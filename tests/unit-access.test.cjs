const assert = require("node:assert/strict");
const { createHash, randomBytes } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("unit links expose only the assigned unit and cannot change competition state", () => {
  const edition = {
    name: "Ročník 2027", status: "preparation",
    units: [{ id: "a", name: "Jednotka A" }, { id: "b", name: "Jednotka B" }],
    stations: [{ id: "s", name: "Pohotovost", kind: "standby", location: "Zbrojnice" },
      { id: "q", name: "Kvíz", kind: "quiz", location: "Škola" }],
    draw: [{ unitId: "a", stationId: "s" }, { unitId: "b", stationId: "q" }],
    commanders: [{ unitId: "b", phone: "123" }]
  };
  const rows = [];
  const pushRows = [];
  const relaySecret = "test-relay-secret-for-push-testing-only";
  const context = vm.createContext({
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
      computeDigest: (algorithm, value, encoding) => [...createHash(algorithm).update(value, encoding).digest()]
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => ({ORGANIZER_PIN:"organizer-for-test",UNIT_PUSH_RELAY_SECRET:relaySecret})[key]
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
  });
  vm.runInContext(readFileSync("ostry-provoz/Code.gs", "utf8"), context);
  context.json = value => value;
  context.getSavedCompetitionEdition_ = year => year === 2027 ? edition : null;
  context.unitAccessSheet_ = () => ({
    getLastRow: () => rows.length + 1,
    appendRow: row => rows.push(row),
    deleteRow: index => rows.splice(index - 2, 1),
    getRange: (row, column, count) => ({
      getValues: () => rows.slice(row - 2, row - 2 + count),
      setValues: ([value]) => { rows[row - 2] = value; }
    })
  });
  context.unitPushSheet_ = () => ({
    getLastRow: () => pushRows.length + 1,
    appendRow: row => pushRows.push(row),
    deleteRow: index => pushRows.splice(index - 2, 1),
    getRange: (row, column, count) => ({
      getValues: () => pushRows.slice(row - 2, row - 2 + count),
      setValues: ([value]) => { pushRows[row - 2] = value; }
    })
  });
  context.editionProgressSheet_ = () => null;
  context.editionProgressRows_ = () => [
    { id:"notice-a", unitId:"a", at:Date.now(), notice:"Pro A" },
    { id:"notice-b", unitId:"b", at:Date.now(), notice:"Pro B" }
  ];
  const post = data => context.doPost({ postData: { contents: JSON.stringify(data) } });
  const token = randomBytes(32).toString("hex");
  const nextToken = randomBytes(32).toString("hex");
  const issue = { action: "issueUnitAccess", credential: "organizer-for-test", year: 2027, unitId: "a", token };
  const read = (key, extra = {}) => post({ action: "readUnitDashboard", token: key, ...extra });

  assert.equal(post({ ...issue, credential: token }).ok, false);
  assert.equal(post({ ...issue, unitId: "unknown" }).ok, false);
  assert.equal(post(issue).ok, true);
  assert.notEqual(rows[0][2], token);
  assert.equal(post({ ...issue, unitId: "b" }).ok, false);
  const result = JSON.parse(JSON.stringify(read(token, { year: 2028, unitId: "b" })));
  assert.deepEqual(result, { ok: true, dashboard: {
    name: "Jednotka A", edition: "Ročník 2027", state: "preparation",
    preparation: {startsAt:"",venue:"",meetingPlace:""},
    station: null,
    completed: [], completedCount: 0, pause: null, notices: []
  } });
  assert.equal(post({ action: "saveCompetitionEdition", credential: token }).ok, false);
  assert.equal(post({ ...issue, token: nextToken }).ok, true);
  assert.equal(read(token).code, "INVALID_UNIT_ACCESS");
  const endpoint = "https://fcm.googleapis.com/fcm/send/test";
  const subscription = {endpoint,keys:{p256dh:"a".repeat(87),auth:"b".repeat(22)}};
  assert.equal(post({action:"subscribeUnitPush",token,subscription}).ok,false);
  assert.equal(post({action:"subscribeUnitPush",token:nextToken,
    subscription:{...subscription,endpoint:"https://not-a-push-service.example/test"}}).ok,false);
  assert.equal(post({action:"subscribeUnitPush",token:nextToken,subscription}).ok,true);
  assert.equal(post({action:"subscribeUnitPush",token:nextToken,subscription}).ok,true);
  assert.equal(pushRows.length,1);
  edition.status = "active";
  assert.equal(post({action:"readUnitPushDeliveries",secret:nextToken}).ok,false);
  const data = post({action:"readUnitPushDeliveries",secret:relaySecret});
  assert.equal(data.ok,true);
  assert.equal(data.deliveries[0].notices.join(","),"notice-a");
  assert.equal(post({action:"unsubscribeUnitPush",token,endpoint}).ok,false);
  assert.equal(post({action:"unsubscribeUnitPush",token:nextToken,endpoint}).ok,true);
  assert.equal(pushRows.length,0);
  edition.status = "archived";
  assert.equal(read(nextToken).code, "INVALID_UNIT_ACCESS");
  assert.equal(post({ ...issue, action: "revokeUnitAccess" }).ok, true);
  edition.status = "preparation";
  assert.equal(read(nextToken).code, "INVALID_UNIT_ACCESS");
});
