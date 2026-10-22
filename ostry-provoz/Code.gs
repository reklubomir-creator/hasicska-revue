const SHEET_RESULTS = 'Výsledky';
const SHEET_CONTACTS = 'Kontakty';
function contactUnits_() {
  return ['Klepačov','Olešná','Těchov','Lažánky','Horní Lhota','Obůrka','Dolní Lhota','Spešov','Olomučany'];
}
function contactsSheet_() {
  const ss=spreadsheet_();
  let sh=ss.getSheetByName(SHEET_CONTACTS);
  if (!sh) { sh=ss.insertSheet(SHEET_CONTACTS); sh.appendRow(['Jednotka','Velitel','Telefon','E-mail']); }
  else if (sh.getLastRow()===0) sh.appendRow(['Jednotka','Velitel','Telefon','E-mail']);
  return sh;
}
function contactsList_() {
  const sh=contactsSheet_(), result={};
  if (sh.getLastRow()<2) return result;
  sh.getRange(2,1,sh.getLastRow()-1,4).getDisplayValues().forEach(r=>{
    const unit=String(r[0]||'').trim();
    if (contactUnits_().includes(unit)) result[unit]={commander:String(r[1]||''),phone:String(r[2]||''),email:String(r[3]||''),saved:true};
  });
  return result;
}
function contactSave_(contact) {
  if (!contact || typeof contact!=='object') return {ok:false,error:'Chybí kontakt.'};
  const unit=String(contact.unit||'').trim(),commander=String(contact.commander||'').trim(),phone=String(contact.phone||'').trim(),email=String(contact.email||'').trim();
  if (!contactUnits_().includes(unit)) return {ok:false,error:'Neznámá jednotka.'};
  if (!commander || !phone || !email || commander.length>180 || phone.length>50 || email.length>254) return {ok:false,error:'Neplatné údaje kontaktu.'};
  const sh=contactsSheet_(), row=[unit,commander,phone,email];
  if (sh.getLastRow()>=2) {
    const names=sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
    for(let i=0;i<names.length;i++) if(String(names[i][0]).trim()===unit) { sh.getRange(i+2,1,1,4).setValues([row]); return {ok:true}; }
  }
  sh.appendRow(row); return {ok:true};
}

const SHEET_REPORTS = 'Hodnocení';
const SHEET_ASSESSMENTS = 'Zápisy stanovišť';
const PROP_ACTIVE = 'ACTIVE_QUIZ_SESSION';
const PROP_APP_STATE = 'APP_SHARED_STATE';

const QUIZZES = {
  "Hasič": [
    {"question":"Při vnitřním požáru se náhle zesílí nasávání vzduchu dveřmi a kouř pulzuje. Jaký závěr je nejbezpečnější?","options":["Jde o možný projev rychlého rozvoje požáru; přehodnotit postup a informovat velitele","Požár je již ve fázi dohořívání","Je vhodné okamžitě otevřít všechna okna"],"correct":0},
    {"question":"Co nejlépe vystihuje účel průběžné kontroly zásoby vzduchu v dýchacím přístroji?","options":["Stačí ji zkontrolovat při vstupu","Musí umožnit bezpečný návrat včetně rezervy podle podmínek","Rozhodující je pouze čas od nasazení masky"],"correct":1},
    {"question":"U dopravní nehody s poškozeným elektromobilem je patrné zahřívání trakční baterie. Co je správné?","options":["Považovat vysokonapěťové části za bezpečné po vypnutí zapalování","Bez průzkumu baterii otevřít","Zohlednit riziko tepelného rozvoje a postupovat podle určené taktiky"],"correct":2},
    {"question":"Jaký je význam zónování místa zásahu s nebezpečnou látkou?","options":["Oddělit prostory podle míry ohrožení a řídit pohyb osob i dekontaminaci","Vyhradit pouze parkování techniky","Nahradit identifikaci látky"],"correct":0},
    {"question":"Při průzkumu sklepa naměří přístroj nebezpečnou atmosféru. Co následuje?","options":["Pokračovat s filtrem bez dalšího vyhodnocení","Omezit vstup a použít odpovídající ochranu podle vyhodnoceného rizika","Větrat pouze otevřením dveří a hned vstoupit"],"correct":1},
    {"question":"Proč je nebezpečné používat proud vody bez rozmyslu do prostoru s možným elektrickým napětím?","options":["Voda může vytvářet vodivou cestu; nutno řešit elektrické riziko","Protože voda vždy okamžitě vyvolá výbuch","Protože proud vody nemá žádný chladicí účinek"],"correct":0},
    {"question":"Při vyprošťování po nehodě zůstává vozidlo nestabilní. Co má přednost?","options":["Rychlé odstranění střechy","Stabilizace vozidla a řízení rizik před manipulací","Vytažení osoby bez koordinace"],"correct":1},
    {"question":"Při požáru v uzavřeném prostoru se výrazně zhorší viditelnost a roste teplota. Jaký postup je vhodný?","options":["Ignorovat změnu, pokud je vedení zavodněno","Rozdělit dvojici pro rychlejší průzkum","Vyhodnotit změnu podmínek, zachovat spojení a upravit taktiku"],"correct":2},
    {"question":"Jaký je hlavní důvod evidence osob vstupujících do nebezpečného prostoru?","options":["Možnost kontroly počtu, polohy a návratu zasahujících","Výhradně vykazování spotřeby materiálu","Nahrazení radiového spojení"],"correct":0},
    {"question":"Při požáru střechy hrozí porušení nosných konstrukcí. Co je rozhodující?","options":["Umístit všechny hasiče přímo pod konstrukci","Vyhodnotit stabilitu, omezit expozici a stanovit bezpečné postavení","Pokračovat do úplného vyhoření bez změny taktiky"],"correct":1},
    {"question":"K čemu slouží termokamera při průzkumu zakouřeného objektu?","options":["Jako jediný důkaz, že prostor je bezpečný","Jako náhrada dýchacího přístroje","Jako podpůrný nástroj, jehož obraz je nutné správně interpretovat"],"correct":2},
    {"question":"U tonoucího na vodní hladině je k dispozici házecí pomůcka. Jaká zásada platí?","options":["Upřednostnit záchranu z bezpečného místa s vhodnými pomůckami","Nejprve vstoupit do vody bez jištění","Přiblížit se bez posouzení proudu a hloubky"],"correct":0},
    {"question":"Po použití hasiva v uzavřeném prostoru se objeví známky zhoršení atmosféry. Co je správné?","options":["Sundat ochranu pro lepší komunikaci","Posoudit atmosféru a zachovat odpovídající ochranu dýchání","Považovat prostor automaticky za bezpečný"],"correct":1},
    {"question":"Při předání zraněného zdravotníkům je nejdůležitější sdělit co?","options":["Pouze jméno velitele jednotky","Pouze dobu příjezdu jednotky","Mechanismus události, zjištěný stav a provedená opatření"],"correct":2},
    {"question":"Jak se zachovat při podezření na přítomnost tlakových lahví v požárem zasažené místnosti?","options":["Vyhodnotit možnost ohřevu a selhání lahví a upravit bezpečnostní opatření","Přesunout lahve bez průzkumu do chodby","Považovat každou uzavřenou lahev za prázdnou"],"correct":0},
    {"question":"Jaký význam má správné vedení hadic při zásahu v budově?","options":["Jen zkrácení času úklidu","Zachování průchodnosti a omezení rizika poškození či zalomení vedení","Nahrazení jištění zasahujících"],"correct":1},
    {"question":"Při požáru v místnosti může otevření dveří změnit podmínky. Proč?","options":["Nemá vliv na přísun vzduchu","Vždy okamžitě uhasí plameny","Může ovlivnit ventilaci a rychlost rozvoje požáru"],"correct":2},
    {"question":"Co znamená, když se při zásahu změní směr větru u úniku nebezpečné látky?","options":["Je třeba znovu posoudit ohrožené prostory a rozmístění sil","Zóny ohrožení zůstávají vždy beze změny","Směr větru má význam pouze pro dopravu"],"correct":0},
    {"question":"Při pohybu v zakouřeném objektu ztratí dvojice orientaci. Co je vhodné?","options":["Pokračovat odděleně do různých směrů","Zachovat soudržnost, využít dohodnuté orientační a spojovací postupy a oznámit situaci","Odložit masky kvůli orientaci"],"correct":1},
    {"question":"Jak postupovat při podezření na kontaminaci výstroje po zásahu?","options":["Odvézt ji bez opatření do společných prostor","Ošetřit ji pouze vodou bez posouzení látky","Zabránit druhotné kontaminaci a zajistit odpovídající očistu"],"correct":2}
  ],
  "Strojník": [
    {"question":"Při čerpání z otevřeného zdroje klesá výkon a sací vedení je netěsné. Co je pravděpodobný důsledek?","options":["Přisávání vzduchu a zhoršení nasávání","Zvýšení účinnosti čerpadla","Zvýšení statického tlaku zdroje"],"correct":0},
    {"question":"Co označuje kavitace v odstředivém čerpadle?","options":["Únik vody přes proudnici","Vznik a zánik parních dutin při nevhodných tlakových podmínkách","Zvýšení průtoku pouze změnou průměru hadice"],"correct":1},
    {"question":"Při zvýšení výškového rozdílu mezi čerpadlem a proudnicí při stejném průtoku se požadovaný výtlačný tlak zpravidla…","options":["sníží","nezmění","zvýší"],"correct":2},
    {"question":"Při zvyšování průtoku stejným hadicovým vedením jsou tlakové ztráty třením zpravidla…","options":["vyšší","nižší","nulové"],"correct":0},
    {"question":"Při dlouhodobém provozu čerpadla s minimálním odběrem vody hrozí zejména co?","options":["Samovolné zvýšení hladiny zdroje","Přehřívání vody a čerpadla podle jeho konstrukce","Úplné vymizení hydraulických ztrát"],"correct":1},
    {"question":"Proč musí strojník znát požadovaný tlak na proudnici a délku vedení?","options":["Kvůli určení počtu sedadel v kabině","Pouze pro zápis spotřeby paliva","Pro nastavení tlaku s ohledem na převýšení a ztráty"],"correct":2},
    {"question":"U požárního čerpadla náhle klesne tlak, zatímco otáčky se nemění. Co má strojník prověřit?","options":["Zdroj vody, sací podmínky a případné změny odběru","Jen stav osvětlení vozidla","Pouze datum poslední technické kontroly"],"correct":0},
    {"question":"Jak se mění teoretická dopravní výška při zvýšení výšky hladiny vody vůči čerpadlu na sací straně?","options":["Vždy se zhorší","Sací podmínky se zpravidla zlepší","Na sací podmínky to nemá vliv"],"correct":1},
    {"question":"Proč je důležité při práci s proudnicemi koordinovat náhlé změny odběru?","options":["Nemají vliv na provoz čerpadla","Zvyšují pouze spotřebu osvětlení","Mohou způsobit tlakové rázy a změny provozního bodu"],"correct":2},
    {"question":"Při dálkové dopravě vody více čerpadly je klíčové co?","options":["Sladit průtoky, tlaky a provoz jednotlivých stupňů","Nastavit každé čerpadlo bez komunikace na maximum","Ignorovat tlakové ztráty mezi stupni"],"correct":0},
    {"question":"Proč může být čerpání z velmi mělkého zdroje problematické?","options":["Protože voda nemůže být nasávána pod hladinou","Hrozí přisávání vzduchu, nečistot a víření u sacího koše","Protože nízká hladina vždy znamená vyšší tlak"],"correct":1},
    {"question":"Co může signalizovat prudké kolísání tlaku při nasávání z otevřeného zdroje?","options":["Jistotu správného odvzdušnění","Stálý průtok bez poruchy","Nestabilní sací podmínky nebo přisávání vzduchu"],"correct":2},
    {"question":"Proč je nevhodné dlouhodobě provozovat čerpadlo mimo doporučený rozsah?","options":["Může docházet ke ztrátě účinnosti, vibracím a poškození","Protože se vždy zvýší zásoba vody","Protože tím automaticky klesne teplota motoru"],"correct":0},
    {"question":"U cisterny při čerpání z vlastní nádrže je třeba průběžně sledovat zejména co?","options":["Jen počet obsazených sedadel","Hladinu vody a požadavky na doplňování","Pouze venkovní teplotu"],"correct":1},
    {"question":"Při ustavení vozidla na krajnici frekventované komunikace je zásadní co?","options":["Co nejmenší odstup od proudící dopravy bez označení","Pouze zajištění proti odcizení","Bezpečné postavení, zajištění místa a možnost práce osádky"],"correct":2},
    {"question":"Co se stane s tlakovou ztrátou ve vedení při použití delší hadice stejného průměru a stejném průtoku?","options":["Zpravidla vzroste","Zpravidla klesne","Bude vždy nulová"],"correct":0},
    {"question":"Proč se při dlouhém nasávání zvažuje výškový rozdíl hladiny a čerpadla?","options":["Nemá vliv na možnost nasátí","Ovlivňuje dostupný tlak na vstupu čerpadla","Určuje pouze délku elektrického kabelu"],"correct":1},
    {"question":"Jaký je účel kontrolovaného otevírání a zavírání armatur ve vodním vedení?","options":["Zrychlit opotřebení spojek","Nahradit kontrolu tlaku","Omezit tlakové rázy a chránit vedení"],"correct":2},
    {"question":"Při podezření na zamrzání vody v části čerpacího systému je správné co?","options":["Postupovat podle provozních pravidel zařízení a předcházet poškození mrazem","Zvýšit tlak bez kontroly","Ignorovat změnu průtoku"],"correct":0},
    {"question":"Co je zásadní při předávání čerpacího stanoviště jinému strojníkovi?","options":["Pouze předat klíče od vozidla","Předat nastavení, zdroj, odběr, omezení a zjištěné závady","Stačí oznámit typ vozidla"],"correct":1}
  ],
  "Velitel": [
    {"question":"První jednotka přijíždí k nehodě cisterny s neznámou látkou. Jaká je první taktická priorita?","options":["Průzkum z bezpečné vzdálenosti, identifikace rizik a vymezení prostoru","Okamžité otevření cisterny","Vyslání všech členů k úniku bez ochrany"],"correct":0},
    {"question":"Při požáru objektu jsou hlášeny pohřešované osoby, ale hrozí zřícení stropu. Jak rozhodovat?","options":["Vstoupit bez ohledu na riziko","Poměřit šanci na záchranu s rizikem pro zasahující a upravit taktiku","Odložit veškerý průzkum bez vyhodnocení"],"correct":1},
    {"question":"Při souběhu dvou kritických úkolů jednotka nemá dostatek sil. Co je vhodné?","options":["Rozdělit členy bez ohledu na minimální bezpečné obsazení","Ponechat obě činnosti bez řízení","Stanovit priority, vyžádat posily a upravit nasazení"],"correct":2},
    {"question":"Velitel zjišťuje, že požár může zasáhnout sousední objekt. Co má přednost?","options":["Průběžné vyhodnocení šíření a ochrana ohrožených hodnot","Zrušení spojení s dalšími jednotkami","Odklad průzkumu sousedního objektu až po dohašení"],"correct":0},
    {"question":"Při zásahu dojde k výpadku spojení se skupinou v nebezpečném prostoru. Co je správné?","options":["Předpokládat, že pokračuje podle plánu","Spustit dohodnutý postup pro ztrátu spojení a prověřit bezpečnost skupiny","Vyčkat bez opatření do konce zásahu"],"correct":1},
    {"question":"Jaký je význam stanovení velitele úseku při rozsáhlém zásahu?","options":["Nahradit všechny bezpečnostní postupy","Přenést odpovědnost na náhodného člena","Umožnit účinnější řízení svěřených sil a komunikaci"],"correct":2},
    {"question":"Při zjištění tlakových lahví v požárem zasažené části objektu je správné co?","options":["Přehodnotit bezpečnostní vzdálenosti a způsob nasazení","Ignorovat informaci, dokud nedojde k výbuchu","Vyslat nechráněnou skupinu k lahvím"],"correct":0},
    {"question":"Po příjezdu další jednotky se zásadně mění dostupné síly. Jak má velitel reagovat?","options":["Ponechat původní úkoly bez vyhodnocení","Aktualizovat plán nasazení a předat konkrétní úkoly","Přerušit veškerou komunikaci"],"correct":1},
    {"question":"Na místě zásahu je více složek IZS. Co pomáhá koordinaci?","options":["Nezávislé příkazy bez sdílení informací","Pouze osobní domluva jednotlivých řidičů","Jasně určené velení, společný přehled a koordinace činností"],"correct":2},
    {"question":"Při průzkumu se objeví možnost rychlého rozvoje požáru v uzavřeném prostoru. Co je vhodné?","options":["Upravit taktiku a řízení ventilace podle aktuálního rizika","Automaticky otevřít všechny otvory","Ignorovat změny kouře a teploty"],"correct":0},
    {"question":"Při záchraně z vody se mění proud a dostupné jištění. Co má velitel udělat?","options":["Pokračovat beze změny, protože plán již byl schválen","Znovu posoudit rizika a přizpůsobit metodu i jištění","Vyslat další nejištěné členy"],"correct":1},
    {"question":"Jak postupovat při nejasné informaci o počtu osob v objektu?","options":["Považovat první odhad za definitivní","Zcela ignorovat svědky","Ověřovat informace z více zdrojů a průběžně aktualizovat priority"],"correct":2},
    {"question":"V objektu se může nacházet fotovoltaický systém. Jak to ovlivní taktiku?","options":["Je třeba zohlednit možnou přítomnost napětí i po odpojení části systému","Všechny vodiče jsou po vypnutí hlavního jističe bezpečné","Elektrické riziko se týká pouze noci"],"correct":0},
    {"question":"Požár přechází do fáze dohašování. Co nesmí velitel opomenout?","options":["Okamžitě zrušit dohled nad stabilitou konstrukcí","Dál sledovat rizika, skrytá ohniska a bezpečnost práce","Přestat evidovat zasahující"],"correct":1},
    {"question":"Při úniku látky se mění meteorologické podmínky. Co má velitel udělat?","options":["Ponechat zóny beze změny","Zrušit varování okolí bez prověření","Přehodnotit zasažený prostor a ochranná opatření"],"correct":2},
    {"question":"Při delším zásahu se projevuje únava členů. Co je správná velitelská reakce?","options":["Zajistit střídání, odpočinek a kontrolu schopnosti bezpečného výkonu","Ignorovat únavu až do ukončení zásahu","Ponechat nejtěžší úkoly pouze unaveným členům"],"correct":0},
    {"question":"Při zásahu na komunikaci hrozí sekundární nehoda. Co je zásadní?","options":["Věnovat se pouze původnímu vozidlu","Koordinovat zabezpečení místa, dopravy a prostoru práce","Postavit techniku bez ohledu na příjezd dalších složek"],"correct":1},
    {"question":"Zásah probíhá na více podlažích. Jak omezit ztrátu přehledu?","options":["Ponechat všechny skupiny bez úkolů","Spoléhat na náhodná hlášení","Vymezit úseky, určit odpovědnosti a pravidelně získávat informace"],"correct":2},
    {"question":"Velitel přebírá zásah po jiné osobě. Co potřebuje nejdříve?","options":["Strukturované předání situace, rizik, nasazených sil a priorit","Pouze počet zaparkovaných vozidel","Pouze čas vyhlášení poplachu"],"correct":0},
    {"question":"Po ukončení hlavní činnosti zůstává možnost opětovného vznícení. Co je vhodné?","options":["Předat místo bez vyhodnocení rizik","Stanovit potřebný dohled, kontrolu a podmínky bezpečného předání","Okamžitě zrušit všechna opatření"],"correct":1}
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
  if (p.action === 'contacts') return json({ok:true,contacts:contactsList_()});
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
    if (data.action === 'saveContact') return json(contactSave_(data.contact));
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
      const safeActiveAssessments = state.activeAssessments && typeof state.activeAssessments==='object' && !Array.isArray(state.activeAssessments) ? state.activeAssessments : {};
       const safeAutoCompletedStation1Units = Array.isArray(state.autoCompletedStation1Units) ? state.autoCompletedStation1Units.filter(unit => typeof unit === "string" && unit.length <= 120).slice(0,100) : [];
      const rawDrawnAt = Number(state.startStationsDrawnAt);
      const safeStartStationsDrawnAt = Number.isFinite(rawDrawnAt) && rawDrawnAt > 0 ? rawDrawnAt : 0;
      const safeCombinedSmsCommanderUnit = ['Lažánky','Horní Lhota'].includes(state.combinedSmsCommanderUnit) ? state.combinedSmsCommanderUnit : 'Horní Lhota';
      const serialized = JSON.stringify({startStations:safeStarts,fixedStartUnits:safeFixed,activeAssessments:safeActiveAssessments,autoCompletedStation1Units:safeAutoCompletedStation1Units,startStationsDrawnAt:safeStartStationsDrawnAt,combinedSmsCommanderUnit:safeCombinedSmsCommanderUnit,updatedAt:new Date().toISOString()});
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
        combinedSmsCommanderUnit: 'Horní Lhota',
        startStationsDrawnAt: 0,
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
