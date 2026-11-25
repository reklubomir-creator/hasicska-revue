const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("edition administration checks the organizer PIN and keeps each year and revision separate", () => {
  const rows = [];
  const context = vm.createContext({
    Utilities: { getUuid: randomUUID },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => key === "ORGANIZER_PIN" ? "organizer-for-test" : null
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
  });
  vm.runInContext(readFileSync("ostry-provoz/Code.gs", "utf8"), context);
  context.json = value => value;
  context.competitionEditionSheet_ = () => ({
    getLastRow: () => rows.length + 1,
    getRange: (row, column, count) => ({
      getValues: () => rows.slice(row - 2, row - 2 + count),
      setValues: ([value]) => { rows[row - 2] = value; }
    }),
    appendRow: row => rows.push(row)
  });
  const post = data => context.doPost({ postData: { contents: JSON.stringify(data) } });
  const edition = {
    year: 2027, name: "Hasičská revue 2027", status: "preparation",
    units: [{ id: "a", name: "Sloučená jednotka" }, { id: "b", name: "Druhá jednotka" }],
    stations: [{ id: "s", name: "Studna", kind: "studna" }],
    commanders: [{ id: "1", name: "První velitel", unitId: "a" }, { id: "2", name: "Druhý velitel", unitId: "a" }],
    reviewers: [{ id: "r", name: "Hodnotitel", stationId: "s" }],
    observers: [{ id: "o", name: "Pozorovatel" }],
    draw: [{ id: "d", unitId: "a", stationId: "s" }]
  };
  const credential = "organizer-for-test";
  const save = (value, expectedRevision = null) =>
    post({ action: "saveCompetitionEdition", edition: value, credential, expectedRevision });
  assert.equal(post({ action: "listCompetitionEditions" }).ok, false);
  assert.equal(post({ action: "saveCompetitionEdition", edition, expectedRevision: null }).ok, false);
  assert.equal(rows.length, 0);
  assert.equal(save({ ...edition, reviewers: [{ id: "r", name: "Eva", stationId: "unknown" }] }).ok, false);
  assert.equal(save({ ...edition, draw: [...edition.draw, { id: "x", unitId: "b", stationId: "s" }] }).ok, false);
  const first = save(edition);
  assert.equal(first.ok, true);
  assert.equal(first.edition.commanders.length, 2);
  assert.equal(save(edition).ok, false);
  assert.equal(save({ ...edition, year: 2028, name: "Hasičská revue 2028" }).ok, true);
  assert.equal(save({ ...edition, status: "archived" }, first.edition.revision).ok, true);
  assert.equal(save(edition, first.edition.revision).ok, false);
  const list = post({ action: "listCompetitionEditions", credential });
  assert.equal(list.editions.length, 2);
  assert.equal(list.editions.find(item => item.year === 2027).status, "archived");
  assert.equal(list.editions.find(item => item.year === 2028).status, "preparation");
});
