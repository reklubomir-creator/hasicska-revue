import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createDeliveryQueue, isAllowedEndpoint } from "../push-relay/delivery.mjs";

test("delivery retries transient failures and stores a successful notice only once per device", async () => {
  const db = new DatabaseSync(":memory:");
  let time = 10;
  let calls = 0;
  let originalTopic;
  const deliver = createDeliveryQueue(db,async (_subscription,payload,options) => {
    assert.deepEqual(JSON.parse(payload),{id:"pause:start"});
    calls++;
    if (calls === 1) {
      originalTopic = options.topic;
      throw Object.assign(new Error("Transient"),{statusCode:503});
    }
    assert.equal(options.topic,originalTopic);
  },{now:() => time});
  const device = {id:"device",subscription:{endpoint:"https://web.push.apple.com/Q123"},notices:["pause:start"]};
  await deliver([device],() => {});
  await deliver([device],() => {});
  assert.equal(calls,1);
  time += 15000;
  await deliver([device],() => {});
  await deliver([device],() => {});
  assert.equal(calls,2);
  db.close();
});

test("delivery restricts endpoints and removes expired subscriptions", async () => {
  const db = new DatabaseSync(":memory:");
  let expired;
  const deliver = createDeliveryQueue(db,async () => { throw Object.assign(new Error("Gone"),{statusCode:410}); });
  assert.equal(isAllowedEndpoint("https://fcm.googleapis.com.evil.example/token"),false);
  assert.equal(isAllowedEndpoint("https://fcm.googleapis.com@evil.example/token"),false);
  assert.equal(isAllowedEndpoint("https://fcm.googleapis.com:443/token"),false);
  await deliver([{id:"device",subscription:{endpoint:"https://fcm.googleapis.com/fcm/send/123"},notices:["notice"]}],
    (id,endpoint) => { expired = [id,endpoint]; });
  assert.deepEqual(expired,["device","https://fcm.googleapis.com/fcm/send/123"]);
  db.close();
});
