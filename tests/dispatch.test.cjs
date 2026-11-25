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
  context.canManageAssessment_ = (credential, station) => credential === "admin" || (credential === "studna" && station === "Studna");
  context.editionProgressSheet_ = () => null;
  context.editionProgressRows_ = () => records;
  context.saveEditionProgressEntry_ = (_sheet,_year,row,previous) => {
    if (previous) records.splice(records.indexOf(previous),1,row);
    else records.push(row);
  };
  const invoke = (action, stationId, unitId, extra = {}) => context.editionProgress_({
    year:2027,credential:"admin",reviewerId:"judge",action,stationId,unitId,...extra
  });
  const state = unit => context.editionDispatch_(edition,records).units.get(unit);
  assert.equal(state("a").station.id,"one");
  assert.equal(invoke("openEditionStation","two","b").ok,false);
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
