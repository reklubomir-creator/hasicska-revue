const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("dispatch reserves the next station only after its previous unit finishes and the station opens", () => {
  const context = vm.createContext({});
  vm.runInContext(readFileSync("ostry-provoz/Code.gs","utf8"),context);
  const edition = {
    year:2027, status:"active",
    units:[{id:"a",name:"A"},{id:"b",name:"B"}],
    stations:[{id:"one",name:"Studna",kind:"studna"},{id:"two",name:"Pohotovost",kind:"standby"}],
    draw:[{unitId:"a",stationId:"one"},{unitId:"b",stationId:"two"}],
    reviewers:[{id:"judge",stationId:"one"}]
  };
  const records = [];
  context.getSavedCompetitionEdition_ = () => edition;
  context.canManageAssessment_ = (credential, station) => credential === "admin" || (credential === "studna" && station === "Studna") || (credential === "pohotovost" && station === "Pohotovost");
  context.editionProgressSheet_ = () => null;
  context.editionProgressRows_ = () => records;
  context.saveEditionProgressEntry_ = (_sheet,_year,row,previous) => {
    if (previous) records.splice(records.indexOf(previous),1,row);
    else records.push(row);
  };
  const invoke = (action, stationId, unitId, extra = {}) => context.editionProgress_({
    year:2027,credential:stationId === "one" ? "studna" : "pohotovost",reviewerId:"judge",action,stationId,unitId,...extra
  });
  const state = unit => context.editionDispatch_(edition,records).units.get(unit);
  assert.equal(state("a").station.id,"one");
  assert.equal(invoke("openEditionStation","two","b").ok,false);
  assert.equal(invoke("startEditionAssessment","one","a").ok,false);
  records.push({unitId:"a",stationId:"one",arrivedAt:Date.now()});
  records.push({unitId:"b",stationId:"two",arrivedAt:Date.now()});
  assert.equal(invoke("startEditionAssessment","one","a").ok,true);
  assert.equal(state("a").state,"evaluating");
  assert.equal(invoke("completeEditionPassage","one","a",{credential:"studna"}).ok,true);
  assert.equal(state("a").state,"waiting");
  assert.equal(invoke("openEditionStation","two","b",{credential:"studna"}).ok,false);
  assert.equal(invoke("completeEditionPassage","two","b").ok,true);
  assert.equal(state("b").completed.length,0);
  assert.equal(state("a").station,null);
  assert.equal(invoke("openEditionStation","two","b").ok,true);
  assert.equal(state("a").station.id,"two");
  assert.equal(invoke("openEditionStation","two","b").ok,false);
  assert.equal(invoke("openEditionStation","one","a").ok,true);
  assert.equal(state("b").station.id,"one");
  const assessment = {result:"V pořádku",notes:"Dodatečná kontrola",submissionId:"69676cdc-0ac3-4ecf-bcf4-ae3155b4ce0c"};
  assert.equal(invoke("saveEditionAssessment","one","a",assessment).ok,true);
  assert.equal(invoke("saveEditionAssessment","one","a",assessment).ok,true);
  assert.equal(state("a").station.id,"two");
  assert.equal(state("a").completed.length,1);
});

test("a paused unit is dispatched after its pause and sees only its own notices", () => {
  const context = vm.createContext({});
  vm.runInContext(readFileSync("ostry-provoz/Code.gs","utf8"),context);
  const edition = {
    year:2027,status:"active",activatedAt:10,
    units:[{id:"a",name:"A"},{id:"b",name:"B"}],
    stations:[{id:"one",name:"První",kind:"scored"},{id:"two",name:"Druhé",kind:"scored"}],
    draw:[{unitId:"a",stationId:"one"},{unitId:"b",stationId:"two"}]
  };
  const entries = [
    {id:"pause",unitId:"a",at:100,pause:{text:"Pauza na jídlo",endsAt:180100}},
    {unitId:"a",stationId:"one",completedAt:200,releasedAt:220},
    {unitId:"b",stationId:"two",completedAt:300,releasedAt:310},
    {id:"only-b",unitId:"b",at:500,notice:"Pouze pro B"},
    {id:"all",unitId:"*",at:600,notice:"Pro všechny"}
  ];
  const during = context.editionDispatch_(edition,entries,90000);
  const paused = during.units.get("a");
  assert.equal(paused.state,"paused");
  assert.equal(paused.station,null);
  assert.equal(during.stations.get("two").ready,true);
  const notices = context.editionUnitNotices_(entries,paused,90000);
  assert.equal(notices.some(item => item.id === "pause:soon"),true);
  assert.equal(notices.some(item => item.id === "only-b"),false);
  assert.equal(notices.some(item => item.id === "all"),true);

  const resumed = context.editionDispatch_(edition,entries,180100).units.get("a");
  assert.equal(resumed.state,"enroute");
  assert.equal(resumed.station.id,"two");
  const after = context.editionUnitNotices_(entries,resumed,180100);
  assert.equal(after.some(item => item.id === "pause:end"),true);
  assert.equal(after.filter(item => item.id === "station:two:180100").length,1);

  const earlyEntries = [{...entries[0],pause:{...entries[0].pause,endedAt:95000}},...entries.slice(1)];
  const early = context.editionDispatch_(edition,earlyEntries,95000).units.get("a");
  assert.equal(early.station.id,"two");
  assert.equal(early.stationUpdates.at(-1).at,95000);
});
