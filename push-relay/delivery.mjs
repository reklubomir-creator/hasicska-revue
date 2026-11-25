import { createHash } from "node:crypto";

export function isAllowedEndpoint(endpoint) {
  return typeof endpoint === "string" && endpoint.length <= 2048 &&
    /^https:\/\/(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|(?:[a-z0-9-]+\.)*web\.push\.apple\.com)\/[A-Za-z0-9_~.%:@/+=-]+$/.test(endpoint);
}

export function createDeliveryQueue(database, send, {now = Date.now, report = () => {}} = {}) {
  database.exec(`
    PRAGMA busy_timeout=5000;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS delivery (
      device TEXT NOT NULL, notice TEXT NOT NULL, updated INTEGER NOT NULL,
      next_attempt INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      done INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (device, notice)
    );
  `);
  const add = database.prepare("INSERT OR IGNORE INTO delivery(device,notice,updated,next_attempt) VALUES (?,?,?,0)");
  const claim = database.prepare(`
    UPDATE delivery SET attempts=attempts+1, updated=?, next_attempt=?
    WHERE device=? AND notice=? AND done=0 AND next_attempt<=? RETURNING attempts
  `);
  const markDone = database.prepare("UPDATE delivery SET done=1,updated=? WHERE device=? AND notice=?");
  const postpone = database.prepare("UPDATE delivery SET next_attempt=?,updated=? WHERE device=? AND notice=?");
  const cleanup = database.prepare("DELETE FROM delivery WHERE updated < ?");

  return async function deliver(devices, removeExpired) {
    cleanup.run(now() - 86400000);
    for (const {id, subscription, notices} of devices) {
      if (!isAllowedEndpoint(subscription?.endpoint) || !Array.isArray(notices)) continue;
      for (const notice of [...notices].reverse()) {
        if (typeof notice !== "string" || notice.length > 160) continue;
        const time = now();
        add.run(id,notice,time);
        const lease = claim.get(time,time + 120000,id,notice,time);
        if (!lease) continue;
        const topic = createHash("sha256").update(notice).digest("base64url").slice(0,32);
        try {
          await send(subscription,JSON.stringify({id:notice}),{TTL:120,topic,timeout:10000});
          markDone.run(now(),id,notice);
        } catch (error) {
          const status = Number(error?.statusCode || 0);
          if (status === 404 || status === 410) {
            markDone.run(now(),id,notice);
            try { await removeExpired(id,subscription.endpoint); } catch { report("Odběr se nepodařilo odstranit."); }
            break;
          }
          if ([400,413].includes(status)) markDone.run(now(),id,notice);
          else postpone.run(now() + Math.min(120000,5000 * 2 ** Math.min(lease.attempts,5)),now(),id,notice);
          report("Doručení odmítnuto" + (status ? " (HTTP " + status + ")." : "."));
        }
      }
    }
  };
}
