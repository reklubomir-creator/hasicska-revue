const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { createAppsScript } = require("./fixtures/apps-script.cjs");

const credential = "organizer-test";
const secret = "integration-test-push-secret-long-enough";
const year = 2027;
const edition = {
  year,name:"Revue 2027",status:"preparation",
  units:[{id:"a",name:"Jednotka A"},{id:"b",name:"Jednotka B"}],
  stations:[{id:"s",name:"Studna",kind:"studna"},{id:"p",name:"Pohotovost",kind:"standby"}],
  commanders:[{id:"1",name:"První velitel",unitId:"a"},{id:"2",name:"Druhý velitel",unitId:"a"}],
  reviewers:[{id:"judge",name:"Hodnotitel",stationId:"s"}],observers:[],
  draw:[{id:"a-start",unitId:"a",stationId:"s"},{id:"b-start",unitId:"b",stationId:"p"}]
};

test("ročník prochází startem, hodnocením, pauzou, předáním, push a archivací přes skutečné API handlery", () => {
  const app = createAppsScript({
    ORGANIZER_PIN:credential,UNIT_PUSH_RELAY_SECRET:secret,EDITION_OBSERVER_CODE:"pozorovatel-test",
    ASSESSMENT_STATION_TOKENS:JSON.stringify({Studna:"hodnotitel-studna"})
  });
  const historical = app.insertSheet("Zápisy stanovišť");
  historical.appendRow(["Jednotka","Stanoviště","Čas","Záznam"]);
  historical.appendRow(["Klepačov","Studna",2026,JSON.stringify({notes:"Historické hodnocení"})]);
  const before = structuredClone(historical.rows);
  const caller = (action,fields = {}) => app.post({action,year,credential,...fields});
  function ok(action,fields) {
    const result = caller(action,fields);
    assert.equal(result.ok,true,action + ": " + (result.error ?? ""));
    return result;
  }
  const preparation = ok("saveCompetitionEdition",{edition,expectedRevision:null}).edition;
  assert.equal(caller("readEditionProgress",{credential:"hodnotitel-studna"}).code,"EDITION_NOT_STARTED");
  assert.equal(caller("readEditionProgress",{credential:"chybný kód"}).code,undefined);
  const token = randomBytes(32).toString("hex");
  ok("issueUnitAccess",{unitId:"a",token});
  const dashboard = () => ok("readUnitDashboard",{credential:undefined,token}).dashboard;
  assert.equal(dashboard().station,null);
  const observe = () => ok("readEditionObserver",{credential:"pozorovatel-test"});
  assert.equal(observe().stations.length,0);
  assert.equal(observe().units[0].stationId,null);
  assert.equal(caller("readEditionObserver",{credential:"nesprávný"}).ok,false);
  assert.equal(caller("listCompetitionEditions",{credential:"pozorovatel-test"}).ok,false);

  const subscription = {endpoint:"https://fcm.googleapis.com/fcm/send/test-integration",
    keys:{p256dh:"a".repeat(87),auth:"b".repeat(22)}};
  ok("subscribeUnitPush",{credential:undefined,token,subscription});
  assert.equal(caller("saveEditionDispatchMessage",{credential:"hodnotitel-studna",stationId:"s",message:"Cizí pokyn",expectedMessage:""}).ok,false);
  ok("saveEditionDispatchMessage",{stationId:"s",message:"Příjezd zadní branou.",expectedMessage:""});
  assert.equal(caller("saveEditionDispatchMessage",{stationId:"s",message:"Přepsání",expectedMessage:""}).ok,false);
  const active = ok("saveCompetitionEdition",{edition:{...preparation,status:"active"},
    expectedRevision:preparation.revision}).edition;
  assert.equal(dashboard().station.name,"Studna");
  assert.equal(dashboard().dispatch.message,"Příjezd zadní branou.");
  assert.equal(dashboard().state,"enroute");
  assert.equal(caller("acknowledgeUnitArrival",{token,stationId:"s"}).ok,false);
  assert.equal(caller("acknowledgeUnitDispatch",{token,stationId:"p"}).ok,false);
  ok("acknowledgeUnitDispatch",{token,stationId:"s"});
  const receivedAt = dashboard().dispatch.receivedAt;
  assert.ok(receivedAt);
  ok("acknowledgeUnitDispatch",{token,stationId:"s"});
  assert.equal(dashboard().dispatch.receivedAt,receivedAt);
  ok("acknowledgeUnitArrival",{token,stationId:"s"});
  assert.equal(dashboard().state,"active");
  assert.equal(dashboard().dispatch,undefined);
  const organizerUnit = ok("readEditionProgress").units.find(unit => unit.id === "a");
  assert.equal(organizerUnit.receivedAt,receivedAt);
  assert.ok(organizerUnit.arrivedAt);
  assert.ok(ok("readEditionProgress",{credential:"hodnotitel-studna"}).units.find(unit => unit.id === "a").arrivedAt);
  assert.equal(caller("saveCompetitionEdition",{edition:{...active,units:[...active.units].reverse()},
    expectedRevision:active.revision}).ok,false);
  assert.equal(caller("openEditionStation",{stationId:"p",unitId:"b"}).ok,false);

  const review = {unitId:"a",stationId:"s",reviewerId:"judge",credential:"hodnotitel-studna"};
  ok("startEditionAssessment",review);
  assert.equal(dashboard().state,"evaluating");
  const observed = observe();
  assert.equal(observed.units.find(unit => unit.id === "a").state,"evaluating");
  assert.deepEqual(observed.reviewers,[]);
  assert.deepEqual(observed.gates,[]);
  assert.deepEqual(observed.pauses,[]);
  assert.equal(caller("openEditionStation",{credential:"pozorovatel-test",stationId:"s",unitId:"a"}).ok,false);
  const saved = {...review,result:"V pořádku",notes:"Zkouška",submissionId:randomUUID()};
  ok("saveEditionAssessment",saved);
  ok("saveEditionAssessment",saved);
  assert.equal(dashboard().state,"waiting");
  assert.equal(dashboard().completedCount,1);
  assert.equal(dashboard().station,null);

  const pauseId = randomUUID();
  ok("startEditionPause",{unitId:"a",eventId:pauseId,minutes:3,text:"Vyčkejte"});
  ok("completeEditionPassage",{unitId:"b",stationId:"p"});
  ok("openEditionStation",{unitId:"b",stationId:"p"});
  assert.equal(dashboard().state,"paused");
  assert.equal(dashboard().station,null);
  app.advance(61000);
  assert.ok(dashboard().notices.some(item => item.id === pauseId + ":soon"));
  const noticeId = randomUUID();
  ok("sendEditionNotice",{unitId:"a",eventId:noticeId,text:"Zpráva pro A"});
  ok("sendEditionNotice",{unitId:"b",eventId:randomUUID(),text:"Zpráva pro B"});
  ok("endEditionPause",{unitId:"a",eventId:pauseId});
  assert.equal(dashboard().station.name,"Pohotovost");
  assert.equal(dashboard().completedCount,1);
  assert.ok(dashboard().notices.some(item => item.id === pauseId + ":end"));
  const deliveries = ok("readUnitPushDeliveries",{secret,credential:undefined}).deliveries;
  assert.equal(deliveries.length,1);
  assert.ok(deliveries[0].notices.includes(noticeId));
  assert.ok(deliveries[0].notices.includes(pauseId + ":end"));
  assert.ok(!dashboard().notices.some(item => item.text === "Zpráva pro B"));
  assert.equal(caller("readUnitPushDeliveries",{secret:token}).ok,false);

  const nextEdition = {...edition,year:2028,name:"Revue 2028"};
  ok("saveCompetitionEdition",{edition:nextEdition,expectedRevision:null});
  assert.equal(ok("readEditionProgress",{year:2028}).units.find(unit => unit.id === "a").completed.length,0);
  ok("saveCompetitionEdition",{edition:{...active,status:"archived"},expectedRevision:active.revision});
  assert.equal(caller("readUnitDashboard",{token}).code,"INVALID_UNIT_ACCESS");
  assert.equal(ok("readUnitPushDeliveries",{secret}).deliveries.length,0);
  assert.equal(ok("readEditionProgress").units.find(unit => unit.id === "a").completed[0],"Studna");
  assert.deepEqual(historical.rows,before);
});

test("historický kvíz drží schválených 15 otázek pro každou roli a účastnický klíč nespravuje ročník", () => {
  const app = createAppsScript({ORGANIZER_PIN:credential});
  const activated = app.post({action:"activate",unit:"Klepačov",pin:credential});
  assert.equal(activated.ok,true);
  const {token} = activated.session;
  for (const role of ["Hasič","Strojník","Velitel"]) {
    const result = app.get({action:"questions",token,role});
    assert.equal(result.ok,true);
    assert.equal(result.questions.length,15);
    assert.ok(result.questions.every(item => Array.isArray(item.options) && !Object.hasOwn(item,"answer")));
  }
  assert.equal(app.post({action:"close",pin:token}).ok,false);
  assert.equal(app.post({action:"listCompetitionEditions",credential:token}).ok,false);
});
