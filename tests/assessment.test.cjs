const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("Apps Script authorizes station writes and applies retries once", () => {
  const rows = [];
  const context = vm.createContext({
    Date,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => ({
        ORGANIZER_PIN: "organizer-for-test",
        ASSESSMENT_STATION_TOKENS: JSON.stringify({ Studna: "station-for-test" })
      })[key]
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
  });
  vm.runInContext(readFileSync("ostry-provoz/Code.gs", "utf8"), context);
  context.json = value => value;
  context.unitsAllowed_ = unit => unit === "Klepačov";
  context.assessmentSheet_ = () => ({
    getLastRow: () => rows.length + 1,
    getRange: (row, column, count) => ({
      getValues: () => rows.slice(row - 2, row - 2 + count),
      setValues: ([value]) => { rows[row - 2] = value; }
    }),
    appendRow: row => rows.push(row)
  });
  const post = data => context.doPost({ postData: { contents: JSON.stringify(data) } });
  const record = {
    unit: "Klepačov", station: "Studna", reviewer: "Hodnotitel",
    notes: "Poznámka", status: "V pořádku", expectedRevision: null, submissionId: randomUUID()
  };
  const request = { action: "saveAssessment", record, credential: "station-for-test" };
  assert.equal(post({ ...request, credential: "" }).ok, false);
  assert.equal(post({ ...request, record: { ...record, station: "Slalom" } }).ok, false);
  assert.equal(post({ action: "deleteAssessment", credential: request.credential }).ok, false);
  const saved = post(request);
  assert.equal(saved.ok, true);
  assert.equal(post(request).record.revision, saved.record.revision);
  assert.equal(rows.length, 1);
  assert.equal(post({ ...request, record: { ...record, notes: "Jiný obsah" } }).ok, false);
  assert.equal(post({ ...request, record: { ...record, submissionId: randomUUID() } }).ok, false);
  assert.equal(post({
    ...request, record: { ...record, notes: "Oprava", expectedRevision: saved.record.revision, submissionId: randomUUID() }
  }).ok, true);
  assert.equal(rows.length, 1);
});

test("draft storage survives a fresh session and separates units, stations and reviewers", () => {
  const source = readFileSync("ostry-provoz/index.html", "utf8");
  const code = source.slice(source.indexOf("const assessmentCredentials"), source.indexOf("const REVIEWER_LOCK_KEY"));
  const entries = new Map();
  const localStorage = {
    get length() { return entries.size; },
    key: index => [...entries.keys()][index],
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value)
  };
  function start() {
    const fields = new Map();
    const el = id => {
      if (!fields.has(id)) {
        fields.set(id, { value: "", addEventListener() {}, classList: {
          contains: () => false, add() {}, remove() {}
        } });
      }
      return fields.get(id);
    };
    const context = vm.createContext({
      localStorage, el, reviewerMode: true, quizTokenFromUrl: null, observerMode: false,
      choice: { name: "Eva", station: 0 },
      stations: ["Studna", "Slalom"], units: ["Jednotka A", "Jednotka B"],
      getLockedReviewer() { return context.choice; },
      updateStatusTiles() {}, showPage() {}, syncReviewer() {}
    });
    vm.runInContext(code, context);
    return { context, el };
  }
  let { context, el } = start();
  function enter(unit, station, reviewer, notes) {
    context.choice = { name: reviewer, station: context.stations.indexOf(station) };
    el("assessmentUnit").value = unit;
    el("stationSelect").value = station;
    el("status").value = "V pořádku";
    el("notes").value = "";
    context.openAssessmentDraft();
    el("notes").value = notes;
    context.storeAssessmentDraft();
  }
  enter("Jednotka A", "Studna", "Eva", "Rozpracovaná poznámka");
  enter("Jednotka B", "Studna", "Eva", "Jiná jednotka");
  enter("Jednotka A", "Slalom", "Eva", "Jiné stanoviště");
  enter("Jednotka A", "Studna", "Petr", "Jiný hodnotitel");
  assert.equal(entries.size, 4);

  ({ context, el } = start());
  el("assessmentUnit").value = "Jednotka A";
  el("stationSelect").value = "Studna";
  context.openAssessmentDraft();
  assert.equal(el("notes").value, "Rozpracovaná poznámka");
  assert.match(el("assessmentDraftStatus").textContent, /obnoven/);
  assert.equal(entries.size, 4);
});
