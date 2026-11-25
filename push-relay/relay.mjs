import { DatabaseSync } from "node:sqlite";
import { setTimeout as delay } from "node:timers/promises";
import webPush from "web-push";
import { createDeliveryQueue } from "./delivery.mjs";

const { REVUE_TEST_API_URL, REVUE_RELAY_SECRET, REVUE_VAPID_SUBJECT,
  REVUE_VAPID_PUBLIC_KEY, REVUE_VAPID_PRIVATE_KEY, REVUE_PUSH_DB } = process.env;
const knownProductionDeployment = "AKfycbwuEk9g6WroMHecImGviCG8aMujLvdxbDsrnTNrPzB7HBEgGfLBP-Vz3kOXsDHU8ZVjrw";
const deployment = /^https:\/\/script\.google\.com\/macros\/s\/([\w-]+)\/exec$/.exec(REVUE_TEST_API_URL || "");
if (!deployment || deployment[1] === knownProductionDeployment || !REVUE_RELAY_SECRET ||
    REVUE_RELAY_SECRET.length < 32 || !REVUE_VAPID_SUBJECT || !REVUE_VAPID_PUBLIC_KEY ||
    !REVUE_VAPID_PRIVATE_KEY || !REVUE_PUSH_DB) {
  throw new Error("Nastav testovací Apps Script, tajemství, klíče VAPID, kontakt a cestu k DB.");
}

webPush.setVapidDetails(REVUE_VAPID_SUBJECT,REVUE_VAPID_PUBLIC_KEY,REVUE_VAPID_PRIVATE_KEY);
const database = new DatabaseSync(REVUE_PUSH_DB);
const deliver = createDeliveryQueue(database,(...args) => webPush.sendNotification(...args),{
  report:message => process.stderr.write(message + "\n")
});

async function request(action, fields = {}) {
  const response = await fetch(REVUE_TEST_API_URL,{
    method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},
    body:JSON.stringify({action,secret:REVUE_RELAY_SECRET,...fields}),
    signal:AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("Apps Script vrátil HTTP " + response.status + ".");
  const result = await response.json();
  if (!result.ok) throw new Error("Apps Script odmítl požadavek pro doručování.");
  return result;
}

let stopping = false;
process.once("SIGINT",() => { stopping = true; });
process.once("SIGTERM",() => { stopping = true; });
do {
  try {
    const {deliveries} = await request("readUnitPushDeliveries");
    await deliver(deliveries,(id,endpoint) => request("removeExpiredUnitPush",{id,endpoint}));
  } catch {
    process.stderr.write("Doručovací cyklus se nepodařilo dokončit.\n");
  }
  if (!stopping && !process.argv.includes("--once")) await delay(15000);
} while (!stopping && !process.argv.includes("--once"));
database.close();
