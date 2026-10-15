const SHEET_RESULTS = 'Výsledky';
const SHEET_REPORTS = 'Hodnocení';
const SHEET_ASSESSMENTS = 'Zápisy stanovišť';
const PROP_ACTIVE = 'ACTIVE_QUIZ_SESSION';
const PROP_APP_STATE = 'APP_SHARED_STATE';

const QUIZZES = {
  'Hasič': [
    {question:'Co uděláš, když při zásahu zjistíš bezprostřední ohrožení člena jednotky?',options:['Pokračuješ bez přerušení','Upozorníš velitele a postupuješ podle bezpečnostních pokynů','Počkáš až na konec zásahu'],correct:1},
    {question:'Kdo koordinuje činnost jednotky při zásahu?',options:['Určený velitel zásahu','Kterýkoliv člen podle vlastního uvážení','Vždy řidič prvního vozidla'],correct:0},
    {question:'Co patří k předání informace o zjištěném nebezpečí?',options:['Stručné a srozumitelné hlášení','Pouze zápis po skončení zásahu','Informace jen nejbližšímu kolegovi'],correct:0},
    {question:'Jak se zachováš, když si nejsi jistý bezpečností úkolu?',options:['Úkol provedeš co nejrychleji','Zastavíš se a ověříš další postup s velitelem','Požádáš civilistu o rozhodnutí'],correct:1},
    {question:'Kdy se používají osobní ochranné prostředky?',options:['Jen při příjezdu na místo','Podle rizik a určeného pracovního postupu','Pouze na výslovný pokyn občana'],correct:1},
    {question:'Co uděláš po zjištění poškození výstroje?',options:['Závadu oznámíš a postupuješ podle pokynů','Poškození zatajíš','Výstroj použiješ bez ohledu na stav'],correct:0},
    {question:'Jak správně předáváš důležitou informaci?',options:['Dlouhým neověřeným popisem','Stručně, věcně a s potvrzením porozumění, je-li potřeba','Pouze gestem z dálky'],correct:1},
    {question:'Co je důležité před vstupem do nebezpečného prostoru?',options:['Ověřit rizika a dodržet stanovené zajištění','Vstoupit jako první bez domluvy','Nechat rozhodnutí náhodě'],correct:0},
    {question:'Co uděláš, když se podmínky na místě náhle změní?',options:['Pokračuješ podle původního plánu za každou cenu','Upozorníš velitele a znovu vyhodnotíš situaci podle pokynů','Odejdeš bez oznámení'],correct:1},
    {question:'Jak naložíš s použitým vybavením po činnosti?',options:['Vrátíš ho bez kontroly','Zkontroluješ stav, oznámíš závady a uložíš ho podle pravidel','Necháš ho na místě'],correct:1}
  ],
  'Strojník': [
    {question:'Co je důležité před vyjetím vozidla?',options:['Provést předepsanou kontrolu a ověřit připravenost','Zkontrolovat jen množství paliva','Vyjet a závady řešit až potom'],correct:0},
    {question:'Co uděláš při zjištění technické závady vozidla?',options:['Závadu nahlásíš a postupuješ podle pravidel jednotky','Závadu zatajíš, pokud vozidlo jede','Necháš rozhodnout náhodného kolemjdoucího'],correct:0},
    {question:'Kdo rozhoduje o bezpečném umístění vozidla v místě zásahu?',options:['Posádka bez vzájemné domluvy','Podle situace velitel zásahu ve spolupráci s řidičem','Vždy první osoba, která vystoupí'],correct:1},
    {question:'Co je zásadní při couvání vozidla v omezeném prostoru?',options:['Použít bezpečné navádění a sledovat okolí','Spoléhat pouze na rychlost','Couvat bez kontroly prostoru'],correct:0},
    {question:'Jak postupovat s čerpadlem, pokud jeho provoz neodpovídá očekávání?',options:['Pokračovat bez kontroly','Bezpečně ověřit stav a postupovat podle návodu a pokynů velitele','Zvyšovat výkon bez omezení'],correct:1},
    {question:'Co uděláš s poškozenou hadicí nebo spojkou?',options:['Označíš a nahlásíš závadu, vybavení nepoužiješ nevhodným způsobem','Použiješ ji při každé situaci','Opravíš ji improvizovaně bez schválení'],correct:0},
    {question:'Proč je důležitá komunikace strojníka s velitelem?',options:['Aby byly změny provozu a stav techniky koordinované','Aby se nemusel kontrolovat stav vozidla','Jen kvůli evidenci docházky'],correct:0},
    {question:'Co patří po návratu k běžné péči o vozidlo?',options:['Kontrola, doplnění prostředků a hlášení závad podle pravidel','Pouze umytí karoserie','Nic, pokud vozidlo dojelo'],correct:0},
    {question:'Jak zacházet s technikou, jejíž obsluhu neznáš?',options:['Vyzkoušet ji bez přípravy','Postupovat podle návodu a pokynů oprávněné osoby','Požádat nezkušeného člena o odhad'],correct:1},
    {question:'Co je prioritou při pohybu zásahového vozidla?',options:['Co nejvyšší rychlost za všech okolností','Bezpečná jízda v souladu s pravidly a podmínkami','Předjet každé pomalejší vozidlo'],correct:1}
  ],
  'Velitel': [
    {question:'Jaký je jeden z prvních úkolů velitele po příjezdu?',options:['Vyhodnotit situaci a rizika a určit další postup','Rozdělit úkoly bez průzkumu','Odejít od jednotky bez předání velení'],correct:0},
    {question:'Co má obsahovat srozumitelné rozdělení úkolů?',options:['Kdo co provede a jak bude komunikovat','Pouze jména členů','Jen přibližný čas ukončení'],correct:0},
    {question:'Jak postupovat při novém riziku na místě?',options:['Zohlednit ho v rozhodnutí, informovat jednotku a upravit postup','Ignorovat ho, pokud už práce začala','Nechat každého rozhodovat samostatně'],correct:0},
    {question:'Co je důležité při předání velení?',options:['Jasně předat situaci, rizika, provedené úkony a další úkoly','Předat pouze vysílačku','Odejít bez vysvětlení'],correct:0},
    {question:'Jak reagovat, když člen jednotky oznámí nebezpečí?',options:['Informaci prověřit a podle situace upravit činnost','Oznámení automaticky odmítnout','Počkat do konce zásahu'],correct:0},
    {question:'Co má obsahovat hlášení o situaci?',options:['Podstatné ověřené informace a požadovanou pomoc','Nepotvrzené domněnky jako fakta','Pouze název obce'],correct:0},
    {question:'Proč se průběžně přehodnocuje situace?',options:['Podmínky a rizika se mohou měnit','Aby se zbytečně měnily úkoly','Protože původní průzkum nemá význam'],correct:0},
    {question:'Jak postupovat, pokud jednotka nemá potřebné vybavení?',options:['Vyhodnotit možnosti a vyžádat potřebné síly či prostředky cestou velení','Zahájit nebezpečný úkon bez vybavení','Zatajit nedostatek'],correct:0},
    {question:'Co je důležité při kontrole dokončení úkolu?',options:['Ověřit výsledek, bezpečnost a předání dalších pokynů','Předpokládat, že úkol dopadl dobře','Okamžitě opustit místo'],correct:0},
    {question:'Jak se zachováš při nejasném nebo rozporném hlášení?',options:['Ověříš informace a upřesníš rozhodnutí','Vybereš náhodně jednu verzi','Předáš obě jako potvrzená fakta'],correct:0}
  ]
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function spreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Skript není propojený s tabulkou Google Sheets.');
  return ss;
}
function getSheet() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_RESULTS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_RESULTS);
    sh.appendRow(['Datum','Jednotka','Jméno','Role','Počet otázek','Správně','Úspěšnost (%)','Délka (s)','Chybné odpovědi','Token relace','Odpovědi']);
  }
  return sh;
}
function getActive() {
  const value = PropertiesService.getScriptProperties().getProperty(PROP_ACTIVE);
  return value ? JSON.parse(value) : null;
}
function reportStorageSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_REPORTS);
  if (!sh) { sh = ss.insertSheet(SHEET_REPORTS); sh.appendRow(['ID','Vytvořeno','Jednotka','Payload JSON']); }
  else if (sh.getLastRow() === 0) sh.appendRow(['ID','Vytvořeno','Jednotka','Payload JSON']);
  return sh;
}
function reportStorageGet_(id) {
  id = String(id || '').trim().toUpperCase();
  if (!/^[A-F0-9]{12}$/.test(id)) return {ok:false,error:'Neplatný identifikátor hodnocení.'};
  const sh = reportStorageSheet_();
  if (sh.getLastRow() < 2) return {ok:false,error:'Toto hodnocení nebylo nalezeno.'};
  const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
  for (let i=ids.length-1;i>=0;i--) {
    if (String(ids[i][0]).trim().toUpperCase() !== id) continue;
    try { return {ok:true,report:JSON.parse(String(sh.getRange(i+2,4).getValue()))}; }
    catch (err) { return {ok:false,error:'Uložená zpráva je poškozená.'}; }
  }
  return {ok:false,error:'Toto hodnocení nebylo nalezeno.'};
}
function reportStorageSave_(data) {
  const id = String(data && data.id || '').trim().toUpperCase();
  const report = data && data.report;
  if (!/^[A-F0-9]{12}$/.test(id) || !report || typeof report !== 'object' || Array.isArray(report))
    return {ok:false,error:'Chybí platné ID nebo obsah hodnocení.'};
  if (!unitsAllowed_(String(report.u || ''))) return {ok:false,error:'Neznámá jednotka.'};
  const payload = JSON.stringify(report);
  if (payload.length > 45000) return {ok:false,error:'Zpráva je příliš dlouhá pro uložení do jedné buňky.'};
  const sh = reportStorageSheet_(), row = [id,new Date(),String(report.u || ''),payload];
  if (sh.getLastRow() >= 2) {
    const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
    for (let i=0;i<ids.length;i++) if (String(ids[i][0]).trim().toUpperCase() === id) {
      sh.getRange(i+2,1,1,4).setValues([row]); return {ok:true,id:id};
    }
  }
  sh.appendRow(row); return {ok:true,id:id};
}
function assessmentSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_ASSESSMENTS);
  if (!sh) { sh = ss.insertSheet(SHEET_ASSESSMENTS); sh.appendRow(['Jednotka','Stanoviště','Upraveno','Payload JSON']); }
  else if (sh.getLastRow() === 0) sh.appendRow(['Jednotka','Stanoviště','Upraveno','Payload JSON']);
  return sh;
}
function assessmentList_() {
  const sh = assessmentSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,4).getValues().filter(r => r[0] && r[1]).map(r => {
    try { return JSON.parse(String(r[3])); } catch (e) { return null; }
  }).filter(Boolean);
}
function assessmentSave_(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {ok:false,error:'Chybí hodnocení.'};
  const unit = String(record.unit || '').trim(), station = String(record.station || '').trim();
  const status = String(record.status || '').trim();
  if (!unitsAllowed_(unit)) return {ok:false,error:'Neznámá jednotka.'};
  if (!station || station.length > 180) return {ok:false,error:'Neplatné stanoviště.'};
  if (['V pořádku','Drobné nedostatky','Závažné nedostatky'].indexOf(status) === -1) return {ok:false,error:'Neplatný stav hodnocení.'};
  const safe = {unit,station,reviewer:String(record.reviewer || '').slice(0,180),status,notes:String(record.notes || '').slice(0,12000),date:String(record.date || ''),time:String(record.time || '')};
  const payload = JSON.stringify(safe);
  const sh = assessmentSheet_(), values = sh.getLastRow() >= 2 ? sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues() : [];
  for (let i=0;i<values.length;i++) {
    if (values[i][0] === unit && values[i][1] === station) {
      sh.getRange(i+2,1,1,4).setValues([[unit,station,new Date(),payload]]);
      return {ok:true,record:safe};
    }
  }
  sh.appendRow([unit,station,new Date(),payload]);
  return {ok:true,record:safe};
}
function assessmentDelete_(unit, station) {
  unit = String(unit || '').trim(); station = String(station || '').trim();
  if (!unitsAllowed_(unit) || !station) return {ok:false,error:'Neplatná jednotka nebo stanoviště.'};
  const sh = assessmentSheet_();
  if (sh.getLastRow() < 2) return {ok:true,deleted:false};
  const values = sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  for (let i=values.length-1;i>=0;i--) if (values[i][0] === unit && values[i][1] === station) {
    sh.deleteRow(i+2); return {ok:true,deleted:true};
  }
  return {ok:true,deleted:false};
}

function closeQuizSession_(active) {
  if (!active || !unitsAllowed_(active.unit)) return {ok:false,error:'Aktivní relace nemá platnou jednotku.'};
  const sh = getSheet();
  const rows = sh.getLastRow() >= 2 ? sh.getRange(2,1,sh.getLastRow()-1,11).getValues() : [];
  const submitted = rows.filter(r => String(r[9] || '') === String(active.token || ''));
  const now = new Date();
  const combined = active.unit === 'Lažánky + Horní Lhota';
  const targetUnits = combined ? ['Lažánky','Horní Lhota'] : [active.unit];
  const summaries = [];
  for (const unit of targetUnits) {
    const group = submitted.filter(r => String(r[1] || '') === unit || (!combined && String(r[1] || '') === active.unit));
    let totalQuestions = 0, correctAnswers = 0;
    const lines = group.map(r => {
      const name = String(r[2] || 'Bez jména'), role = String(r[3] || 'Role neuvedena');
      const total = Number(r[4]) || 0, correct = Number(r[5]) || 0, pct = Number(r[6]) || 0;
      totalQuestions += total; correctAnswers += correct;
      return name + ' (' + role + '): ' + correct + '/' + total + ' (' + pct + ' %)';
    });
    const average = totalQuestions ? Math.round(correctAnswers / totalQuestions * 100) : 0;
    let status = 'V pořádku';
    if (!group.length) status = 'Drobné nedostatky';
    else if (average < 40) status = 'Závažné nedostatky';
    else if (average < 75) status = 'Drobné nedostatky';
    const notes = group.length
      ? 'Příjem kvízů ručně uzavřen. Jednotka: ' + unit + '. Odevzdané kvízy: ' + group.length + '. Celkem správně: ' + correctAnswers + '/' + totalQuestions + ' (' + average + ' %).\\n' + lines.join('\\n')
      : 'Příjem kvízů ručně uzavřen. Za jednotku ' + unit + ' nebyl odevzdán žádný kvíz.';
    const saved = assessmentSave_({
      unit, station:'Kvíz – hasička Klepačov', reviewer:'Automatické hodnocení kvízu', status, notes,
      date:Utilities.formatDate(now,Session.getScriptTimeZone(),'d. M. yyyy'),
      time:Utilities.formatDate(now,Session.getScriptTimeZone(),'HH:mm')
    });
    if (!saved.ok) return saved;
    summaries.push({unit,submitted:group.length,percentage:group.length?average:null,status});
  }
  const totalQuestions=submitted.reduce((sum,r)=>sum+(Number(r[4])||0),0);
  const correctAnswers=submitted.reduce((sum,r)=>sum+(Number(r[5])||0),0);
  const overall=totalQuestions?Math.round(correctAnswers/totalQuestions*100):null;
  return {ok:true,unit:active.unit,submitted:submitted.length,percentage:overall,status:summaries.every(x=>x.status==='V pořádku')?'V pořádku':summaries.some(x=>x.status==='Závažné nedostatky')?'Závažné nedostatky':'Drobné nedostatky',unitSummaries:summaries};
}

function unitsAllowed_(unit) {
  return ['Klepačov','Olešná','Těchov','Lažánky + Horní Lhota','Lažánky','Horní Lhota','Obůrka','Dolní Lhota','Spešov','Olomučany'].indexOf(unit) !== -1;
}
function clearDataRows_(sheetName) {
  const sh = spreadsheet_().getSheetByName(sheetName);
  if (sh && sh.getLastRow() > 1) sh.deleteRows(2,sh.getLastRow()-1);
}
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'getReport') return json(reportStorageGet_(p.id));
  if (p.action === 'assessments') return json({ok:true,records:assessmentList_()});
  if (p.action === 'appStateVersion') {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_APP_STATE);
    if (!raw) return json({ok:true,updatedAt:''});
    try {
      const state = JSON.parse(raw);
      return json({ok:true,updatedAt:String(state.updatedAt || '')});
    } catch (err) { return json({ok:false,error:'Sdílené rozlosování je poškozené.'}); }
  }
  if (p.action === 'appState') {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_APP_STATE);
    if (!raw) return json({ok:true,state:null});
    try { return json({ok:true,state:JSON.parse(raw)}); }
    catch (err) { return json({ok:false,error:'Sdílené rozlosování je poškozené.'}); }
  }
  const active = getActive();
  if (p.action === 'state') return json({active:!!active,session:active ? {unit:active.unit,token:active.token} : null});
  if (p.action === 'validate' || p.action === 'questions') {
    if (!active || !p.token || p.token !== active.token) return json({ok:false,active:false,error:'QR kód není platný.'});
    if (p.action === 'validate') return json({ok:true,active:true,session:{unit:active.unit}});
    if (!QUIZZES[p.role]) return json({ok:false,error:'Neplatná role.'});
    return json({ok:true,questions:QUIZZES[p.role].map(q => ({question:q.question,options:q.options}))});
  }
  if (p.action === 'results') {
    const sh = getSheet(), values = sh.getDataRange().getValues();
    const rows = values.slice(1).filter(r => r[2] && r[9]).sort((a,b) => {
      const da = a[0] instanceof Date ? a[0].getTime() : new Date(a[0]).getTime();
      const db = b[0] instanceof Date ? b[0].getTime() : new Date(b[0]).getTime();
      return (Number.isFinite(db)?db:0) - (Number.isFinite(da)?da:0);
    });
    return json({results:rows.map(r => {
      let wrongAnswers=[]; try { const raw=r[8]; wrongAnswers=Array.isArray(raw)?raw:(raw?JSON.parse(String(raw)):[]); if(!Array.isArray(wrongAnswers))wrongAnswers=[]; } catch(err) { wrongAnswers=[]; }
      return {date:r[0] instanceof Date?r[0].toISOString():String(r[0]||''),unit:String(r[1]||''),name:String(r[2]||''),role:String(r[3]||''),total:Number(r[4])||0,correct:Number(r[5])||0,percentage:Number(r[6])||0,durationSeconds:Number(r[7])||0,wrongAnswers};
    })});
  }
  return ContentService.createTextOutput('Hasičská revue – spojení funguje.').setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e) {
  const lock=LockService.getScriptLock(); let lockAcquired=false;
  try {
    const data=JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');
    lock.waitLock(10000); lockAcquired=true;
    if (data.action === 'saveReport') return json(reportStorageSave_(data));
    if (data.action === 'saveAssessment') return json(assessmentSave_(data.record));
    if (data.action === 'deleteAssessment') return json(assessmentDelete_(data.unit,data.station));
    if (data.action === 'saveAppState') {
      const state = data.state;
      if (!state || typeof state !== 'object' || Array.isArray(state) || !state.startStations || typeof state.startStations !== 'object' || Array.isArray(state.startStations) || !Array.isArray(state.fixedStartUnits)) {
        return json({ok:false,error:'Neplatná data rozlosování.'});
      }
      const safeStarts = {};
      Object.keys(state.startStations).forEach(unit => {
        const station = Number(state.startStations[unit]);
        if (unit && Number.isInteger(station) && station >= 1 && station <= 8) safeStarts[String(unit)] = station;
      });
      const safeFixed = state.fixedStartUnits.filter(unit => typeof unit === 'string' && unit.length <= 120).slice(0,100);
      const safeAutoCompletedStation1Units = Array.isArray(state.autoCompletedStation1Units) ? state.autoCompletedStation1Units.filter(unit => typeof unit === "string" && unit.length <= 120).slice(0,100) : [];
      const serialized = JSON.stringify({startStations:safeStarts,fixedStartUnits:safeFixed,autoCompletedStation1Units:safeAutoCompletedStation1Units,updatedAt:new Date().toISOString()});
      if (serialized.length > 50000) return json({ok:false,error:'Rozlosování je příliš velké.'});
      PropertiesService.getScriptProperties().setProperty(PROP_APP_STATE,serialized);
      return json({ok:true,updatedAt:new Date().toISOString()});
    }
    const props=PropertiesService.getScriptProperties();
    if (data.action === 'resetProduction') {
      const pin=props.getProperty('ORGANIZER_PIN');
      if (!pin || String(data.pin || '') !== pin) return json({ok:false,error:'Nesprávný organizační PIN nebo PIN není nastaven.'});
      clearDataRows_(SHEET_RESULTS); clearDataRows_(SHEET_REPORTS); clearDataRows_(SHEET_ASSESSMENTS);
      props.deleteProperty(PROP_ACTIVE);
      // Ulož prázdné sdílené rozlosování místo smazání vlastnosti.
      // Klienti, kteří ještě mají stará data lokálně, tak při dalším pollingu
      // dostanou prázdný stav a nepošlou staré rozlosování zpět na server.
      props.setProperty(PROP_APP_STATE, JSON.stringify({
        startStations: {},
        fixedStartUnits: [],
        autoCompletedStation1Units: [],
        updatedAt: new Date().toISOString()
      }));
      return json({ok:true,message:'Výsledky, QR zprávy, hodnocení stanovišť i sdílené rozlosování byly vymazány.'});
    }
    if (data.action === 'activate' || data.action === 'close') {
      const pin=props.getProperty('ORGANIZER_PIN');
      if (!pin || String(data.pin || '') !== pin) return json({ok:false,error:'Nesprávný organizační PIN nebo PIN není nastaven.'});
      if (data.action === 'close') { const closed=closeQuizSession_(getActive()); if (!closed.ok) return json(closed); props.deleteProperty(PROP_ACTIVE); return json(closed); }
      if (!unitsAllowed_(data.unit)) return json({ok:false,error:'Neznámá jednotka.'});
      const session={unit:data.unit,token:Utilities.getUuid().replace(/-/g,''),startedAt:new Date().toISOString()};
      props.setProperty(PROP_ACTIVE,JSON.stringify(session));
      return json({ok:true,session:{unit:session.unit,token:session.token}});
    }
    if (data.action === 'submit') {
      const active=getActive();
      if (!active || data.token !== active.token) return json({ok:false,error:'Relace už není aktivní. Odpovědi nebyly přijaty.'});
      const name=String(data.name || '').trim(), role=String(data.role || '');
      const isCombined=active.unit==='Lažánky + Horní Lhota';
      const unit=isCombined?String(data.unit||'').trim():active.unit;
      if (!name || !QUIZZES[role]) return json({ok:false,error:'Chybí jméno nebo role.'});
      if (isCombined && ['Lažánky','Horní Lhota'].indexOf(unit)===-1) return json({ok:false,error:'Vyber Lažánky nebo Horní Lhotu.'});
      const quiz=QUIZZES[role], answers=Array.isArray(data.answers)?data.answers:[], byQuestion={};
      answers.forEach(a => {
        const qi=Number(a.question), ai=Number(a.answer);
        if(Number.isInteger(qi)&&qi>=0&&qi<quiz.length&&Number.isInteger(ai)&&ai>=0&&ai<quiz[qi].options.length)byQuestion[qi]=ai;
      });
      let correct=0; const wrong=[];
      quiz.forEach((q,i)=>{const answer=byQuestion[i];if(answer===q.correct)correct++;else wrong.push({question:q.question,answer:answer===undefined?null:q.options[answer],correct:q.options[q.correct]});});
      const total=quiz.length, percentage=Math.round(correct/total*100), duration=Math.min(1200,Math.max(0,Number(data.durationSeconds)||0));
      getSheet().appendRow([new Date(),unit,name,role,total,correct,percentage,duration,JSON.stringify(wrong),active.token,JSON.stringify(byQuestion)]);
      return json({ok:true,correct,total,percentage});
    }
    return json({ok:false,error:'Neznámá operace.'});
  } catch(err) { return json({ok:false,error:String(err)}); }
  finally { if(lockAcquired)lock.releaseLock(); }
}
