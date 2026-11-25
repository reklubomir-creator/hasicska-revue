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
  assert.equal(dashboard().station.number,1);
  assert.equal(dashboard().dispatch.message,"Příjezd zadní branou.");
  assert.equal(dashboard().station.name,undefined);
  assert.equal(dashboard().station.location,undefined);
  assert.ok(dashboard().notices.some(notice => notice.text === "Přidělené stanoviště č. 1"));
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
  assert.deepEqual(dashboard().completed,[1]);
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
  assert.equal(dashboard().station.number,2);
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

test("předregistrace přiřadí kontakt k připravené jednotce a zobrazí výjezd až po startu", () => {
  const app = createAppsScript({ORGANIZER_PIN:credential});
  const post = (action,fields = {}) => app.post({action,year,...fields});
  const invitation = randomBytes(32).toString("hex");
  const token = randomBytes(32).toString("hex");
  const info = {startsAt:"2027-10-24T13:30",venue:"Blansko",meetingPlace:"Ve 13:00 u zbrojnice"};
  const prepared = post("saveCompetitionEdition",{credential,expectedRevision:null,edition:{...edition,...info}}).edition;
  assert.equal(post("issueEditionRegistration",{credential:"wrong",invitation}).ok,false);
  assert.equal(post("issueEditionRegistration",{credential,invitation}).ok,true);
  const available = post("readEditionRegistration",{invitation});
  assert.deepEqual(available.units.map(unit => unit.name),["Jednotka A","Jednotka B"]);
  assert.deepEqual(available.info,info);
  const registration = {invitation,token,unitId:"a",name:"Jan Velitel",phone:"+420 123 456 789",email:"jan@example.test"};
  assert.equal(post("registerEditionUnit",{...registration,phone:"abc"}).ok,false);
  assert.equal(post("registerEditionUnit",registration).ok,true);
  assert.equal(post("registerEditionUnit",registration).ok,true);
  assert.equal(post("registerEditionUnit",{...registration,token:randomBytes(32).toString("hex")}).ok,false);
  assert.deepEqual(post("readEditionRegistration",{invitation}).units.map(unit => unit.id),["b"]);
  assert.equal(post("listCompetitionEditions",{credential:invitation}).ok,false);
  const saved = post("listCompetitionEditions",{credential}).editions[0];
  assert.deepEqual(saved.registrations,[{unitId:"a",name:registration.name,phone:registration.phone,email:registration.email}]);
  const correction = {year,source:"registration",unitId:"a",name:"Jan Nový",phone:"777 123 456",email:"novy@example.test",
    expected:saved.registrations[0]};
  assert.equal(post("updateEditionCommander",{...correction,credential:token}).ok,false);
  assert.equal(post("updateEditionCommander",{...correction,credential}).ok,true);
  assert.equal(post("updateEditionCommander",{...correction,credential}).ok,false);
  assert.equal(post("listCompetitionEditions",{credential}).editions[0].registrations[0].email,"novy@example.test");
  const before = post("readUnitDashboard",{token}).dashboard;
  assert.deepEqual(before.preparation,info);
  assert.equal(before.station,null);
  assert.ok(!JSON.stringify(before).includes(registration.phone));
  assert.equal(post("saveCompetitionEdition",{credential,expectedRevision:prepared.revision,edition:{...prepared,status:"active"}}).ok,true);
  const after = post("readUnitDashboard",{token}).dashboard;
  assert.equal(after.preparation,undefined);
  assert.equal(after.station.number,1);
  assert.equal(post("readEditionRegistration",{invitation}).ok,false);
  assert.equal(post("revokeUnitAccess",{credential,unitId:"a"}).ok,true);
  assert.equal(post("readUnitDashboard",{token}).code,"INVALID_UNIT_ACCESS");
  assert.equal(post("listCompetitionEditions",{credential}).editions[0].registrations.length,1);
});

test("tři sloučené jednotky mají jeden start a sdílí postup i na již vydaném odkazu člena", () => {
  const app = createAppsScript({ORGANIZER_PIN:credential});
  const post = (action,fields = {}) => app.post({action,year,credential,...fields});
  const token = randomBytes(32).toString("hex");
  const setup = {...edition,startsAt:"2027-10-24T13:30",venue:"Blansko",meetingPlace:"Zbrojnice",
    units:[...edition.units,{id:"c",name:"Jednotka C"}],stations:[...edition.stations,{id:"quiz",name:"Kvíz",kind:"quiz"}]};
  const prepared = post("saveCompetitionEdition",{expectedRevision:null,edition:setup}).edition;
  assert.equal(post("issueUnitAccess",{unitId:"a",token}).ok,true);
  const merged = {...prepared,merges:[{id:"abc",unitIds:["a","b","c"]}],
    draw:[{id:"merged-start",unitId:"abc",stationId:"s"}]};
  assert.equal(post("saveCompetitionEdition",{expectedRevision:prepared.revision,
    edition:{...merged,merges:[...merged.merges,{id:"duplicated",unitIds:["a","c"]}]}}).ok,false);
  assert.equal(post("saveCompetitionEdition",{expectedRevision:prepared.revision,
    edition:{...merged,draw:[...merged.draw,{id:"duplicate-start",unitId:"a",stationId:"p"}]}}).ok,false);
  const saved = post("saveCompetitionEdition",{expectedRevision:prepared.revision,edition:merged}).edition;
  const invitation = randomBytes(32).toString("hex");
  const groupToken = randomBytes(32).toString("hex");
  assert.equal(post("issueEditionRegistration",{invitation}).ok,true);
  assert.deepEqual(post("readEditionRegistration",{invitation}).units.map(unit => unit.id),["abc"]);
  assert.equal(post("registerEditionUnit",{invitation,token:groupToken,unitId:"abc",name:"Velitel",phone:"123 456 789"}).ok,true);
  const updated = post("listCompetitionEditions").editions[0];
  assert.equal(updated.registrations[0].unitId,"abc");
  assert.equal(post("saveCompetitionEdition",{expectedRevision:saved.revision,edition:{...merged,status:"active"}}).ok,true);
  const dashboard = key => post("readUnitDashboard",{token:key}).dashboard;
  assert.equal(dashboard(token).name,"Jednotka A + Jednotka B + Jednotka C");
  assert.equal(dashboard(token).station.number,1);
  assert.equal(post("acknowledgeUnitDispatch",{token,stationId:"s"}).ok,true);
  assert.ok(dashboard(groupToken).dispatch.receivedAt);
  assert.equal(post("acknowledgeUnitArrival",{token:groupToken,stationId:"s"}).ok,true);
  assert.equal(dashboard(token).state,"active");
  assert.deepEqual(post("readEditionProgress").units.map(unit => unit.id),["abc"]);
  const assessment = {unitId:"abc",stationId:"s",reviewerId:"judge"};
  assert.equal(post("startEditionAssessment",assessment).ok,true);
  assert.equal(post("saveEditionAssessment",{...assessment,result:"Drobné nedostatky",notes:"Společný zápis",submissionId:randomUUID()}).ok,true);
  for (const [unitId,percentage] of [["a",82],["b",55],["c",0]]) {
    assert.equal(post("saveEditionMemberQuiz",{unitId,stationId:"quiz",percentage,expectedPercentage:null}).ok,true);
  }
  assert.equal(post("saveEditionMemberQuiz",{unitId:"abc",stationId:"quiz",percentage:100,expectedPercentage:null}).ok,false);
  assert.equal(post("readEditionFinalAssessments",{credential:token}).ok,false);
  const final = post("readEditionFinalAssessments");
  assert.deepEqual(final.units.map(unit => unit.name),["Jednotka A","Jednotka B","Jednotka C"]);
  assert.deepEqual(final.units.map(unit => unit.assessments.find(item => item.kind === "quiz").percentage),[82,55,0]);
  assert.ok(final.units.every(unit => unit.assessments.length === 2 && unit.assessments[0].notes === "Společný zápis"));
});

test("dva nezávislé souběžné svazky mají vlastní start a kontakty lze opravit i po startu", () => {
  const app = createAppsScript({ORGANIZER_PIN:credential});
  const post = (action,fields) => app.post({action,year,credential,...fields});
  const units = ["a","b","c","d","e"].map(id => ({id,name:id.toUpperCase()}));
  const commander = {id:"vel-a",unitId:"a",name:"Původní velitel",phone:"123456789",email:"a@example.test"};
  const draft = {...edition,status:"active",units,commanders:[commander],
    stations:[...edition.stations,{id:"t",name:"Slalom",kind:"scored"}],
    merges:[{id:"ab",unitIds:["a","b"]},{id:"ce",unitIds:["c","e"]}],
    draw:[{id:"x",unitId:"ab",stationId:"s"},{id:"y",unitId:"ce",stationId:"p"},{id:"z",unitId:"d",stationId:"t"}]};
  const saved = post("saveCompetitionEdition",{expectedRevision:null,edition:draft});
  assert.equal(saved.ok,true,saved.error);
  const progress = post("readEditionProgress",{});
  assert.deepEqual(progress.units.map(unit => [unit.name,unit.stationId]),[["D","t"],["A + B","s"],["C + E","p"]]);
  const updated = post("updateEditionCommander",{source:"manual",unitId:"a",contactId:commander.id,
    expected:commander,expectedRevision:saved.edition.revision,name:"Nový velitel",phone:"987654321",email:"b@example.test"});
  assert.equal(updated.ok,true,updated.error);
  assert.notEqual(updated.revision,saved.edition.revision);
  assert.equal(post("listCompetitionEditions",{}).editions[0].commanders[0].name,"Nový velitel");
});
