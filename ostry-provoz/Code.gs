
const SHEET_RESULTS = 'Výsledky';
const SHEET_REPORTS = 'Hodnocení';
const SHEET_ASSESSMENTS = 'Zápisy stanovišť';
const PROP_ACTIVE = 'ACTIVE_QUIZ_SESSION';
const PROP_APP_STATE = 'APP_SHARED_STATE';
const SHEET_CONTACTS = 'Kontakty';

const QUIZZES = {
  "Hasič": [
    {
      "question": "Při vnitřním požáru se náhle výrazně zvýší teplota v horní vrstvě kouře a objeví se v ní plamenné jazyky. Co tento jev signalizuje?",
      "options": [
        "Rozvoj požáru především v prostoru pod stropní konstrukcí.",
        "Riziko rychlého rozvoje požáru a celkového vzplanutí prostoru.",
        "Přesun hlavního ohniska požáru do sousední místnosti."
      ],
      "correct": 1
    },
    {
      "question": "Při vyprošťování osoby z havarovaného vozidla se vozidlo začne při práci s hydraulickým nářadím pohybovat. Co má hasič udělat?",
      "options": [
        "Změnit místo opření nástroje a pokračovat v práci.",
        "Požádat dalšího hasiče o přidržení pohybující se části.",
        "Přerušit práci a obnovit stabilizaci vozidla."
      ],
      "correct": 2
    },
    {
      "question": "Hasič při průzkumu zakouřeného objektu ztratí orientaci a nedokáže určit směr návratu. Jak má postupovat?",
      "options": [
        "Ohlásit situaci a pokusit se obnovit orientaci pomocí zajištěné návratové cesty.",
        "Vyhledat obvodovou stěnu a samostatně postupovat podél ní k východu.",
        "Pokusit se najít okno a vytvořit si náhradní únikovou cestu."
      ],
      "correct": 0
    },
    {
      "question": "Při požáru garáže je uvnitř tlaková láhev vystavená sálavému teplu. Jaké nebezpečí představuje?",
      "options": [
        "Především únik plynu přes pojistné zařízení při zvýšení tlaku.",
        "Možnost porušení tlakové nádoby s prudkým uvolněním jejího obsahu.",
        "Riziko vznícení obsahu pouze při přímém kontaktu láhve s plamenem."
      ],
      "correct": 1
    },
    {
      "question": "Při hašení lesního požáru se náhle změní směr větru. Co musí hasič především sledovat?",
      "options": [
        "Změnu intenzity hoření a potřebu zvýšit průtok vody.",
        "Změnu směru šíření požáru a bezpečnost únikové cesty.",
        "Změnu účinnosti hašení v závislosti na směru vedení proudu."
      ],
      "correct": 1
    },
    {
      "question": "Při dopravní nehodě elektromobilu je viditelně poškozený kryt trakční baterie a z jejího prostoru uniká kouř. Co tato situace signalizuje?",
      "options": [
        "Aktivaci bezpečnostního odpojení vysokonapěťového systému.",
        "Možný tepelný rozklad článků a riziko rozvoje požáru baterie.",
        "Přehřátí palubní elektroniky způsobené zkratem nízkonapěťové soustavy."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu u dopravní nehody za snížené viditelnosti musí hasič vystoupit ze zásahového vozidla na frekventované komunikaci. Jaký postup je nejbezpečnější?",
      "options": [
        "Vystoupit pokud možno na chráněné straně a pohybovat se v zajištěném prostoru zásahu.",
        "Vystoupit směrem k havarovanému vozidlu a přesunout se nejkratší cestou.",
        "Vystoupit za vozidlem a pokračovat podél jeho boku směrem k místu nehody."
      ],
      "correct": 0
    },
    {
      "question": "Při požáru v uzavřené místnosti je patrné pulzování kouře kolem dveří a kouř se střídavě vytlačuje ven a nasává dovnitř. Co tento jev signalizuje?",
      "options": [
        "Postupné dohořívání požáru při nedostatku hořlavých látek.",
        "Rychlý přenos požáru vedením tepla do sousedních prostor.",
        "Riziko explozivního hoření při přístupu vzduchu do prostoru."
      ],
      "correct": 2
    },
    {
      "question": "Při požáru objektu hasič zaznamená výrazné prohnutí ocelového nosníku a deformaci jeho spojů. Co tento stav signalizuje?",
      "options": [
        "Především tepelnou roztažnost konstrukce bez významného vlivu na její stabilitu.",
        "Možnou ztrátu únosnosti konstrukce a riziko jejího zřícení.",
        "Přenos tepla do sousedních konstrukcí jako hlavní bezprostřední nebezpečí."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu na únik nebezpečné chemické látky je hasič v protichemickém ochranném oděvu a dokončil práci v nebezpečné zóně. Jaký je správný postup při jejím opouštění?",
      "options": [
        "Přesunout se do bezpečné zóny a tam zahájit svlékání ochranného oděvu.",
        "Projít stanoveným dekontaminačním postupem a následně bezpečně odložit ochranné prostředky.",
        "Provést prvotní oplach a ochranné prostředky odložit na hranici nebezpečné zóny."
      ],
      "correct": 1
    },
    {
      "question": "Při hašení požáru místnosti začne voda z proudnice dopadat na silně zahřátou konstrukci a prudce se odpařovat. Jaké nebezpečí to představuje pro zasahující hasiče?",
      "options": [
        "Především snížení účinnosti hašení vlivem rychlého odpařování vody.",
        "Riziko opaření horkou vodní párou, zejména v uzavřeném prostoru.",
        "Zvýšení koncentrace hořlavých zplodin v důsledku ochlazování konstrukcí."
      ],
      "correct": 1
    },
    {
      "question": "Při průzkumu zakouřeného objektu v dýchacím přístroji dosáhne hasič tlaku vzduchu stanoveného pro návrat. Jak postupuje?",
      "options": [
        "Pokračuje do spuštění akustické výstrahy dýchacího přístroje.",
        "Samostatně se vrátí k nástupnímu místu a ohlásí ukončení průzkumu.",
        "Upozorní ostatní členy skupiny a postupuje při návratu podle stanoveného režimu."
      ],
      "correct": 2
    },
    {
      "question": "Při vyprošťování zraněného z vozidla se hydraulickým rozpínákem vytváří prostor mezi deformovanými částmi karoserie. Co musí hasič průběžně sledovat?",
      "options": [
        "Stabilitu opěrných bodů nástroje a směr pohybu deformovaných částí.",
        "Především rychlost rozevírání nástroje, aby nedošlo k jeho přetížení.",
        "Zda je nástroj umístěn co nejblíže původnímu konstrukčnímu spoji."
      ],
      "correct": 0
    },
    {
      "question": "Při vnitřním požáru se hasiči chystají otevřít dveře do silně zakouřené místnosti. Dveře jsou v horní části výrazně zahřáté. Jak mají postupovat?",
      "options": [
        "Nejprve otevřít okno na chodbě, aby se vyrovnaly tlakové poměry.",
        "Vyhodnotit projevy požáru, zajistit připravený proud a dveře otevírat kontrolovaně.",
        "Dveře rychle otevřít a ihned aplikovat vodu do horní části místnosti."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu v průmyslovém objektu začnou z výšky odpadávat části podhledu. Co má hasič udělat?",
      "options": [
        "Pokračovat podél nosné stěny, kde je pravděpodobnost pádu dalších částí nižší.",
        "Upozornit ostatní, opustit ohrožený prostor a oznámit nebezpečí veliteli.",
        "Vyhledat místo mimo dopadovou oblast a pokračovat v zásahu při sledování stropu."
      ],
      "correct": 1
    }
  ],
  "Strojník": [
    {
      "question": "Při dálkové dopravě vody začne na vstupu do navazujícího čerpadla výrazně klesat tlak. Jak má jeho strojník postupovat?",
      "options": [
        "Zvýšit otáčky svého čerpadla, aby vyrovnal pokles vstupního tlaku.",
        "Omezit odběr vody a koordinovat dodávku s předchozím strojníkem.",
        "Přivřít výtlačné ventily a následně zvýšit otáčky svého čerpadla."
      ],
      "correct": 1
    },
    {
      "question": "Při čerpání z otevřeného vodního zdroje začne čerpadlo přisávat vzduch, přestože sací koš zůstává pod hladinou. Co má strojník především prověřit?",
      "options": [
        "Těsnost sacího vedení a případné vytváření víru nad sacím košem.",
        "Průchodnost výtlačného vedení a nastavení tlaku na rozdělovači.",
        "Otáčky motoru a případné tlakové ztráty na útočných proudech."
      ],
      "correct": 0
    },
    {
      "question": "Při čerpání z otevřeného vodního zdroje začne čerpadlo kavitačně hlučet a kolísá dodávka vody. Který zásah může pomoci při nedostatečných sacích podmínkách?",
      "options": [
        "Zvýšit otáčky čerpadla a současně více otevřít výtlak.",
        "Přivřít sání čerpadla a ponechat požadovaný průtok.",
        "Snížit odběr vody a prověřit sací výšku i průchodnost sání."
      ],
      "correct": 2
    },
    {
      "question": "Při dopravě vody do místa zásahu o 30 metrů výše než čerpadlo je třeba překonat hydrostatický výškový rozdíl. Jaká je přibližná tlaková ztráta způsobená samotným převýšením?",
      "options": [
        "Přibližně 1,5 baru.",
        "Přibližně 2 bary.",
        "Přibližně 3 bary."
      ],
      "correct": 2
    },
    {
      "question": "Strojník dopravuje vodu hadicovým vedením a na konci potřebuje zajistit tlak 5 barů. Třecí ztráty činí 2 bary a převýšení odpovídá dalším 1,5 baru. Jaký výstupní tlak musí čerpadlo přibližně zajistit?",
      "options": [
        "8,5 baru.",
        "7,5 baru.",
        "6,5 baru."
      ],
      "correct": 0
    },
    {
      "question": "Při jízdě k zásahu se požární vozidlo blíží k železničnímu přejezdu, na kterém blikají dvě střídavá červená světla. Jak musí řidič postupovat?",
      "options": [
        "Může přejezd projet při použití modrého výstražného světla a sirény.",
        "Nesmí na přejezd vjíždět ani při použití zvláštního výstražného zařízení.",
        "Může přejezd projet po zastavení a ověření, že se neblíží vlak."
      ],
      "correct": 1
    },
    {
      "question": "Při ustavení cisternové automobilové stříkačky na svahu je nutné zajistit vozidlo proti samovolnému pohybu. Který postup je správný?",
      "options": [
        "Použít parkovací brzdu a podle podmínek zajistit kola zakládacími klíny.",
        "Použít provozní brzdu a ponechat motor v chodu po celou dobu zásahu.",
        "Zařadit neutrál a zajistit vozidlo pouze pomocí parkovací brzdy."
      ],
      "correct": 0
    },
    {
      "question": "Při pravidelné kontrole vozidla strojník zjistí, že hladina brzdové kapaliny klesla pod předepsané minimum. Jak má postupovat?",
      "options": [
        "Doplnit kapalinu a vozidlo používat bez další kontroly brzdové soustavy.",
        "Provést zkušební jízdu a závadu řešit pouze při zhoršení brzdného účinku.",
        "Prověřit příčinu úbytku a zajistit odstranění závady před dalším provozem."
      ],
      "correct": 2
    },
    {
      "question": "Při jízdě zásahovým vozidlem z dlouhého prudkého klesání hrozí přehřátí provozních brzd. Jaký způsob jízdy je vhodný?",
      "options": [
        "Zařadit neutrál a rychlost regulovat krátkým intenzivním brzděním.",
        "Včas zvolit nižší převodový stupeň a využívat brzdný účinek motoru.",
        "Zařadit vyšší převodový stupeň a průběžně přibrzďovat provozní brzdou."
      ],
      "correct": 1
    },
    {
      "question": "Při kontrole požárního automobilu se vzduchovou brzdovou soustavou strojník zjistí, že po vypnutí motoru a ustálení tlaku dochází k jeho rychlému poklesu. Co tento stav signalizuje?",
      "options": [
        "Nesprávnou činnost regulátoru tlaku, který při vypnutém motoru nedoplňuje vzduch.",
        "Možnou netěsnost vzduchové soustavy, kterou je nutné před provozem prověřit.",
        "Běžné odlehčení kompresoru, při kterém tlak po vypnutí motoru rychle klesá."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu za silného mrazu musí strojník na delší dobu přerušit dodávku vody. Jaké opatření je vhodné k ochraně požárního čerpadla před zamrznutím?",
      "options": [
        "Ponechat čerpadlo zavodněné a udržovat motor vozidla ve zvýšených otáčkách.",
        "Zajistit podle situace cirkulaci vody nebo odvodnění ohrožených částí čerpadla.",
        "Uzavřít výtlačné ventily a ponechat vodu v čerpadle bez dalšího opatření."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu je nutné přečerpat vodu z jedné cisternové automobilové stříkačky do druhé. Co musí strojník přijímajícího vozidla především sledovat?",
      "options": [
        "Stav naplnění nádrže, průtok přiváděné vody a možnost jejího přetečení.",
        "Výstupní tlak předávajícího čerpadla a teplotu motoru předávajícího vozidla.",
        "Délku plnicího vedení a množství vody zbývající v předávajícím vozidle."
      ],
      "correct": 0
    },
    {
      "question": "Při jízdě k zásahu na mokré vozovce dojde u požárního automobilu k aktivaci systému ABS během intenzivního brzdění. Jak má řidič správně postupovat?",
      "options": [
        "Opakovaně uvolňovat a sešlapovat brzdový pedál, aby zabránil zablokování kol.",
        "Udržovat potřebný tlak na brzdový pedál a současně řídit směr jízdy vozidla.",
        "Uvolnit brzdový pedál a zpomalovat výhradně pomocí brzdného účinku motoru."
      ],
      "correct": 1
    },
    {
      "question": "Při práci s požárním čerpadlem strojník uzavře všechny výtlačné ventily, ale čerpadlo zůstává v provozu. Jaké riziko vzniká při delším provozu bez průtoku?",
      "options": [
        "Dochází k postupnému ochlazování vody a poklesu jejího tlaku.",
        "Dochází k zahřívání vody v čerpadle a možnému poškození jeho částí.",
        "Dochází k automatickému zavzdušnění výtlaku a zastavení motoru vozidla."
      ],
      "correct": 1
    },
    {
      "question": "Při pravidelné kontrole požárního automobilu strojník zjistí nerovnoměrné opotřebení běhounu pneumatiky. Co může být jeho příčinou?",
      "options": [
        "Pouze dlouhodobé stání vozidla na vodorovné zpevněné ploše.",
        "Nesprávný tlak huštění, geometrie náprav nebo závada podvozku.",
        "Pouze opakované používání motorové brzdy při jízdě z kopce."
      ],
      "correct": 1
    }
  ],
  "Velitel": [
    {
      "question": "Při požáru rodinného domu má velitel první jednotky informaci o možné osobě uvnitř. Z objektu vychází hustý kouř a rozsah požáru není znám. Jaký postup zvolí?",
      "options": [
        "Zahájí vnitřní průzkum a další rizika vyhodnotí až po nalezení ohniska.",
        "Provede průzkum, ověří podmínky vstupu a rozhodne o způsobu záchrany.",
        "Zahájí hasební útok zvenčí a vnitřní průzkum odloží do příjezdu posil."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu na dopravní nehodě se nachází havarované vozidlo pod poškozeným elektrickým vedením. Není zřejmé, zda je vedení pod napětím. Jak velitel rozhodne?",
      "options": [
        "Povolí přístup po zajištění vozidla, pokud se hasiči nedotknou vodičů.",
        "Umožní vyprošťování s použitím běžných ochranných prostředků jednotky.",
        "Vymezí nebezpečný prostor a vyčká na potvrzení bezpečného stavu vedení."
      ],
      "correct": 2
    },
    {
      "question": "Dvě družstva zasahují uvnitř objektu. Jedno družstvo přestane odpovídat na radiové výzvy. Jaký je odpovídající postup velitele?",
      "options": [
        "Zahájí ověřování situace, aktivuje záchranný postup a přehodnotí nasazení.",
        "Vyšle druhé družstvo k prověření situace a ostatní činnost ponechá beze změny.",
        "Vyčká na další hlášení družstva a mezitím připraví náhradní spojovací prostředek."
      ],
      "correct": 0
    },
    {
      "question": "Jednotka JPO V zasahuje u požáru a na místo přijíždí jednotka HZS. Velitel HZS přebírá velení zásahu. Jaký je správný postup dosavadního velitele?",
      "options": [
        "Předá informace o zásahu a následně samostatně pokračuje podle původního plánu.",
        "Předá informace o zásahu a vyčká s další činností na úplné vystřídání jednotky.",
        "Předá informace o zásahu a další činnost jednotky koordinuje s novým velitelem zásahu."
      ],
      "correct": 2
    },
    {
      "question": "Během zásahu se mění směr větru a kouř začíná ohrožovat původně bezpečný nástupní prostor. Jak velitel postupuje?",
      "options": [
        "Přesune nástupní prostor a ponechá nasazení jednotek podle původního rozhodnutí.",
        "Upraví rozmístění techniky a změnu oznámí až po dokončení probíhajících úkolů.",
        "Přehodnotí nebezpečný prostor, upraví nasazení a informuje dotčené jednotky."
      ],
      "correct": 2
    },
    {
      "question": "Jednotka JPO V přijíždí k dopravní nehodě osobního vozidla. Řidič je při vědomí, ale vozidlo stojí nestabilně ve svahu. Co je prioritou před zahájením vyprošťování?",
      "options": [
        "Zajistit vozidlo proti pohybu a vyhodnotit rizika pro zasahující i řidiče.",
        "Zahájit přístup k řidiči a stabilizaci vozidla provést během vyprošťování.",
        "Připravit transport řidiče a zajistit vozidlo až před jeho vytažením."
      ],
      "correct": 0
    },
    {
      "question": "Při čerpání vody ze zatopeného sklepa velitel zjistí, že voda zasahuje elektrická zařízení. Stav elektrické instalace není znám. Jaký postup zvolí?",
      "options": [
        "Zahájí čerpání z bezpečného místa a stav elektroinstalace ověří v průběhu.",
        "Nechá ověřit bezpečný stav elektroinstalace a do té doby omezí vstup do prostoru.",
        "Povolí vstup pouze hasičům v zásahovém oděvu a s použitím gumových holínek."
      ],
      "correct": 1
    },
    {
      "question": "Jednotka zasahuje u požáru travního porostu. Vítr mění směr a požár se začíná šířit směrem k blízkému lesu. Jednotka má omezené množství vody. Jaký postup velitele je nejvhodnější?",
      "options": [
        "Přesune jednotku na čelo požáru, aby zabránila jeho dalšímu šíření směrem k lesu.",
        "Vyhodnotí směr šíření a únikové cesty, zvolí bezpečné postavení a požádá o posily.",
        "Soustředí jednotku na ochranu hranice lesa a veškerou dostupnou vodu využije v tomto prostoru."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu v obci je nutné zajistit přísun vody z hydrantové sítě. Hydrant poskytuje výrazně menší průtok, než jednotka očekávala. Jak velitel postupuje?",
      "options": [
        "Přizpůsobí nasazení dostupnému průtoku a zajistí alternativní zásobování vodou.",
        "Ponechá původní nasazení proudů a vyčká, zda se tlak v síti postupně zvýší.",
        "Zvýší odběr vody dalšími proudy, aby se odstranilo případné omezení průtoku."
      ],
      "correct": 0
    },
    {
      "question": "Během zásahu jeden člen družstva oznámí veliteli příznaky výrazného vyčerpání. Jednotka přitom plní důležitý úkol. Jak velitel rozhodne?",
      "options": [
        "Ponechá hasiče u lehčí činnosti a jeho vystřídání zajistí po dokončení úkolu.",
        "Zajistí jeho bezpečné stažení a posouzení stavu, současně upraví rozdělení úkolů.",
        "Přeruší činnost celé jednotky a obnoví ji až po odpočinku všech zasahujících."
      ],
      "correct": 1
    },
    {
      "question": "Jednotka je vyslána k odstranění spadlého stromu přes komunikaci. Po příjezdu velitel zjistí, že strom zasahuje do vedení veřejného osvětlení a vodiče jsou poškozené. Jak rozhodne?",
      "options": [
        "Nechá zajistit komunikaci a zahájí odstraňování částí stromu mimo bezprostřední dosah vodičů.",
        "Vymezí nebezpečný prostor a odstranění stromu zahájí až po ověření bezpečného stavu vedení.",
        "Nechá strom zajistit proti pohybu a odstranění vodičů ponechá pracovníkům provozovatele sítě."
      ],
      "correct": 1
    },
    {
      "question": "Při zásahu u dopravní nehody se na místo dostaví posádka zdravotnické záchranné služby. Zraněný je stále zaklíněný ve vozidle. Jak má velitel koordinovat další postup?",
      "options": [
        "Ponechá rozhodování o pořadí úkonů výhradně zdravotníkům a zajistí technické provedení jejich pokynů.",
        "Dohodne se zdravotníky priority a způsob vyproštění s ohledem na zdravotní stav a bezpečnost zásahu.",
        "Dokončí nejprve technické zajištění vyproštění a teprve následně umožní zdravotníkům přístup k pacientovi."
      ],
      "correct": 1
    },
    {
      "question": "Při nočním zásahu u požáru stodoly velitel zjistí, že příjezdová komunikace je úzká a další cisterny by mohly zablokovat odjezd již nasazené techniky. Jaký postup zvolí?",
      "options": [
        "Nechá další techniku dojet co nejblíže k požáru a její rozmístění upraví po příjezdu.",
        "Určí místo pro příjezd a řazení další techniky s ohledem na průjezdnost a potřeby zásahu.",
        "Ponechá rozmístění další techniky na jednotlivých řidičích podle aktuálních možností."
      ],
      "correct": 1
    },
    {
      "question": "Jednotka přijíždí k nahlášenému požáru, ale na uvedené adrese žádný požár nenachází. Oznamovatele se nedaří kontaktovat. Jak má velitel postupovat?",
      "options": [
        "Provede průzkum nejbližšího okolí a po negativním výsledku se vrátí na základnu.",
        "Informuje KOPIS, ověří údaje o události a koordinuje další postup při pátrání.",
        "Pokračuje v pátrání v širším okolí a KOPIS informuje po nalezení místa události."
      ],
      "correct": 1
    },
    {
      "question": "Při likvidaci následků silného větru jednotka odstraňuje strom opřený o střechu domu. Kmen je pod napětím a jeho pohyb po odříznutí nelze spolehlivě předvídat. Jak velitel rozhodne?",
      "options": [
        "Zvolí postupné odřezávání od koruny a průběžně sleduje změny zatížení kmene.",
        "Přeruší rizikové práce, zajistí prostor a vyžádá vhodné prostředky či odbornou pomoc.",
        "Zajistí kmen dostupnými lany a pokračuje v řezání s větším odstupem hasičů."
      ],
      "correct": 1
    }
  ]
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
  if (!sh) {
    sh = ss.insertSheet(SHEET_REPORTS);
    sh.appendRow(['ID','Vytvořeno','Jednotka','Payload JSON']);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Vytvořeno','Jednotka','Payload JSON']);
  }
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
    try {
      return {ok:true,report:JSON.parse(String(sh.getRange(i+2,4).getValue()))};
    } catch (err) {
      return {ok:false,error:'Uložená zpráva je poškozená.'};
    }
  }
  return {ok:false,error:'Toto hodnocení nebylo nalezeno.'};
}

function reportStorageSave_(data) {
  const id = String(data && data.id || '').trim().toUpperCase();
  const report = data && data.report;

  if (!/^[A-F0-9]{12}$/.test(id) || !report || typeof report !== 'object' || Array.isArray(report)) {
    return {ok:false,error:'Chybí platné ID nebo obsah hodnocení.'};
  }
  if (!unitsAllowed_(String(report.u || ''))) return {ok:false,error:'Neznámá jednotka.'};

  const payload = JSON.stringify(report);
  if (payload.length > 45000) return {ok:false,error:'Zpráva je příliš dlouhá pro uložení do jedné buňky.'};

  const sh = reportStorageSheet_();
  const row = [id,new Date(),String(report.u || ''),payload];

  if (sh.getLastRow() >= 2) {
    const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
    for (let i=0;i<ids.length;i++) {
      if (String(ids[i][0]).trim().toUpperCase() === id) {
        sh.getRange(i+2,1,1,4).setValues([row]);
        return {ok:true,id:id};
      }
    }
  }

  sh.appendRow(row);
  return {ok:true,id:id};
}

function assessmentSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_ASSESSMENTS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_ASSESSMENTS);
    sh.appendRow(['Jednotka','Stanoviště','Upraveno','Payload JSON']);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(['Jednotka','Stanoviště','Upraveno','Payload JSON']);
  }
  return sh;
}

function assessmentList_() {
  const sh = assessmentSheet_();
  if (sh.getLastRow() < 2) return [];

  return sh.getRange(2,1,sh.getLastRow()-1,4).getValues()
    .filter(r => r[0] && r[1])
    .map(r => {
      try {
        return JSON.parse(String(r[3]));
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

function assessmentSave_(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return {ok:false,error:'Chybí hodnocení.'};
  }

  const unit = String(record.unit || '').trim();
  const station = String(record.station || '').trim();
  const status = String(record.status || '').trim();

  if (!unitsAllowed_(unit)) return {ok:false,error:'Neznámá jednotka.'};
  if (!station || station.length > 180) return {ok:false,error:'Neplatné stanoviště.'};
  if (['V pořádku','Drobné nedostatky','Závažné nedostatky'].indexOf(status) === -1) {
    return {ok:false,error:'Neplatný stav hodnocení.'};
  }

  const safe = {
    unit:unit,
    station:station,
    reviewer:String(record.reviewer || '').slice(0,180),
    status:status,
    notes:String(record.notes || '').slice(0,12000),
    date:String(record.date || ''),
    time:String(record.time || '')
  };

  const payload = JSON.stringify(safe);
  const sh = assessmentSheet_();
  const values = sh.getLastRow() >= 2
    ? sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues()
    : [];

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
  unit = String(unit || '').trim();
  station = String(station || '').trim();

  if (!unitsAllowed_(unit) || !station) {
    return {ok:false,error:'Neplatná jednotka nebo stanoviště.'};
  }

  const sh = assessmentSheet_();
  if (sh.getLastRow() < 2) return {ok:true,deleted:false};

  const values = sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  for (let i=values.length-1;i>=0;i--) {
    if (values[i][0] === unit && values[i][1] === station) {
      sh.deleteRow(i+2);
      return {ok:true,deleted:true};
    }
  }

  return {ok:true,deleted:false};
}

function contactsSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_CONTACTS);

  if (!sh) {
    sh = ss.insertSheet(SHEET_CONTACTS);
    sh.appendRow(['Jednotka','Velitel','Telefon','E-mail','Upraveno']);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(['Jednotka','Velitel','Telefon','E-mail','Upraveno']);
  }

  return sh;
}

function contactsList_() {
  const sh = contactsSheet_();
  const contacts = {};

  if (sh.getLastRow() < 2) return contacts;

  const rows = sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues();

  rows.forEach(r => {
    const unit = String(r[0] || '').trim();
    if (!unit || !unitsAllowed_(unit)) return;

    contacts[unit] = {
      commander:String(r[1] || ''),
      phone:String(r[2] || ''),
      email:String(r[3] || ''),
      saved:true
    };
  });

  return contacts;
}

function contactSave_(contact) {
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    return {ok:false,error:'Chybí údaje kontaktu.'};
  }

  const unit = String(contact.unit || '').trim();
  const commander = String(contact.commander || '').trim().slice(0,180);
  const phone = String(contact.phone || '').trim().slice(0,60);
  const email = String(contact.email || '').trim().slice(0,254);

  if (!unitsAllowed_(unit)) return {ok:false,error:'Neznámá jednotka.'};

  if (!commander || !phone || !email) {
    return {ok:false,error:'Vyplň jméno velitele, telefon i e-mail.'};
  }

  const sh = contactsSheet_();
  const row = [unit,commander,phone,email,new Date()];

  if (sh.getLastRow() >= 2) {
    const units = sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();

    for (let i=0;i<units.length;i++) {
      if (String(units[i][0]).trim() === unit) {
        sh.getRange(i+2,1,1,5).setValues([row]);
        return {ok:true,unit:unit};
      }
    }
  }

  sh.appendRow(row);
  return {ok:true,unit:unit};
}

function closeQuizSession_(active) {
  if (!active || !unitsAllowed_(active.unit)) {
    return {ok:false,error:'Aktivní relace nemá platnou jednotku.'};
  }

  const sh = getSheet();
  const rows = sh.getLastRow() >= 2
    ? sh.getRange(2,1,sh.getLastRow()-1,11).getValues()
    : [];

  // Hodnocení jednotky je kumulativní napříč všemi jejími relacemi.
  // Při opětovném otevření zahrneme starší i nově odevzdané kvízy.
  // U společné jednotky vyhodnotíme Lažánky a Horní Lhotu odděleně.
  const combined = active.unit === 'Lažánky + Horní Lhota';
  const targetUnits = combined ? ['Lažánky','Horní Lhota'] : [active.unit];
  const submitted = rows.filter(r => targetUnits.indexOf(String(r[1] || '')) !== -1);
  const now = new Date();
  const summaries = [];

  for (const unit of targetUnits) {
    const group = submitted.filter(r =>
      String(r[1] || '') === unit ||
      (!combined && String(r[1] || '') === active.unit)
    );

    let totalQuestions = 0;
    let correctAnswers = 0;

    const lines = group.map(r => {
      const name = String(r[2] || 'Bez jména');
      const role = String(r[3] || 'Role neuvedena');
      const total = Number(r[4]) || 0;
      const correct = Number(r[5]) || 0;
      const pct = Number(r[6]) || 0;

      totalQuestions += total;
      correctAnswers += correct;

      return name + ' (' + role + '): ' + correct + '/' + total + ' (' + pct + ' %)';
    });

    const average = totalQuestions ? Math.round(correctAnswers / totalQuestions * 100) : 0;
    let status = 'V pořádku';

    if (!group.length) status = 'Drobné nedostatky';
    else if (average < 40) status = 'Závažné nedostatky';
    else if (average < 75) status = 'Drobné nedostatky';

    const notes = group.length
      ? 'Příjem kvízů ručně uzavřen. Jednotka: ' + unit + '. Odevzdané kvízy: ' + group.length + '. Celkem správně: ' + correctAnswers + '/' + totalQuestions + ' (' + average + ' %).\n' + lines.join('\n')
      : 'Příjem kvízů ručně uzavřen. Za jednotku ' + unit + ' nebyl odevzdán žádný kvíz.';

    const saved = assessmentSave_({
      unit:unit,
      station:'Kvíz – hasička Klepačov',
      reviewer:'Automatické hodnocení kvízu',
      status:status,
      notes:notes,
      date:Utilities.formatDate(now,Session.getScriptTimeZone(),'d. M. yyyy'),
      time:Utilities.formatDate(now,Session.getScriptTimeZone(),'HH:mm')
    });

    if (!saved.ok) return saved;

    summaries.push({
      unit:unit,
      submitted:group.length,
      percentage:group.length ? average : null,
      status:status
    });
  }

  const totalQuestions = submitted.reduce((sum,r) => sum + (Number(r[4]) || 0),0);
  const correctAnswers = submitted.reduce((sum,r) => sum + (Number(r[5]) || 0),0);
  const overall = totalQuestions ? Math.round(correctAnswers / totalQuestions * 100) : null;

  return {
    ok:true,
    unit:active.unit,
    submitted:submitted.length,
    percentage:overall,
    status:summaries.every(x => x.status === 'V pořádku')
      ? 'V pořádku'
      : summaries.some(x => x.status === 'Závažné nedostatky')
        ? 'Závažné nedostatky'
        : 'Drobné nedostatky',
    unitSummaries:summaries
  };
}

function unitsAllowed_(unit) {
  return [
    'Klepačov',
    'Olešná',
    'Těchov',
    'Lažánky + Horní Lhota',
    'Lažánky',
    'Horní Lhota',
    'Obůrka',
    'Dolní Lhota',
    'Spešov',
    'Olomučany'
  ].indexOf(unit) !== -1;
}

function clearDataRows_(sheetName) {
  const sh = spreadsheet_().getSheetByName(sheetName);
  if (sh && sh.getLastRow() > 1) {
    sh.deleteRows(2,sh.getLastRow()-1);
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};

  if (p.action === 'getReport') {
    return json(reportStorageGet_(p.id));
  }

  if (p.action === 'assessments') {
    return json({ok:true,records:assessmentList_()});
  }

  if (p.action === 'contacts') {
    return json({ok:true,contacts:contactsList_()});
  }

  if (p.action === 'appStateVersion') {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_APP_STATE);
    if (!raw) return json({ok:true,updatedAt:''});

    try {
      const state = JSON.parse(raw);
      return json({ok:true,updatedAt:String(state.updatedAt || '')});
    } catch (err) {
      return json({ok:false,error:'Sdílené rozlosování je poškozené.'});
    }
  }

  if (p.action === 'appState') {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_APP_STATE);
    if (!raw) return json({ok:true,state:null});

    try {
      return json({ok:true,state:JSON.parse(raw)});
    } catch (err) {
      return json({ok:false,error:'Sdílené rozlosování je poškozené.'});
    }
  }

  const active = getActive();

  if (p.action === 'lastClosedQuiz') {
    let last=null;
    try { last=JSON.parse(PropertiesService.getScriptProperties().getProperty('QUIZ_LAST_CLOSED')||'null'); } catch(err) {}
    return json({ok:true,last:last});
  }

  if (p.action === 'completedQuizUnits') {
    let completed=[];
    try { completed=JSON.parse(PropertiesService.getScriptProperties().getProperty('QUIZ_COMPLETED_UNITS')||'[]'); } catch(err) {}
    return json({ok:true,units:Array.isArray(completed)?completed:[]});
  }

  if (p.action === 'state') {
    return json({
      active:!!active,
      session:active ? {unit:active.unit,token:active.token} : null
    });
  }

  if (p.action === 'validate' || p.action === 'questions') {
    if (!active || !p.token || p.token !== active.token) {
      return json({ok:false,active:false,error:'QR kód není platný.'});
    }

    if (p.action === 'validate') {
      return json({ok:true,active:true,session:{unit:active.unit}});
    }

    if (!QUIZZES[p.role]) return json({ok:false,error:'Neplatná role.'});

    return json({
      ok:true,
      questions:QUIZZES[p.role].map((q,index) => ({
        index:index,
        question:q.question,
        options:q.options
      }))
    });
  }

  if (p.action === 'results') {
    const sh = getSheet();
    const values = sh.getDataRange().getValues();

    const rows = values.slice(1)
      .filter(r => r[2] && r[9])
      .sort((a,b) => {
        const da = a[0] instanceof Date ? a[0].getTime() : new Date(a[0]).getTime();
        const db = b[0] instanceof Date ? b[0].getTime() : new Date(b[0]).getTime();
        return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
      });

    return json({
      results:rows.map(r => {
        let wrongAnswers = [];

        try {
          const raw = r[8];
          wrongAnswers = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
          if (!Array.isArray(wrongAnswers)) wrongAnswers = [];
        } catch (err) {
          wrongAnswers = [];
        }

        return {
          date:r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''),
          unit:String(r[1] || ''),
          name:String(r[2] || ''),
          role:String(r[3] || ''),
          total:Number(r[4]) || 0,
          correct:Number(r[5]) || 0,
          percentage:Number(r[6]) || 0,
          durationSeconds:Number(r[7]) || 0,
          sessionToken:String(r[9] || ''),
          wrongAnswers:wrongAnswers
        };
      })
    });
  }

  return ContentService.createTextOutput('Hasičská revue – spojení funguje.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    const data = JSON.parse(
      e && e.postData && e.postData.contents
        ? e.postData.contents
        : '{}'
    );

    lock.waitLock(10000);
    lockAcquired = true;

    if (data.action === 'saveReport') {
      return json(reportStorageSave_(data));
    }

    if (data.action === 'saveAssessment') {
      return json(assessmentSave_(data.record));
    }

    if (data.action === 'saveContact') {
      return json(contactSave_(data.contact));
    }

    if (data.action === 'deleteAssessment') {
      return json(assessmentDelete_(data.unit,data.station));
    }

    // Opravené ukládání kompletního sdíleného stavu.
    if (data.action === 'saveAppState') {
      const state = data.state;

      if (
        !state ||
        typeof state !== 'object' ||
        Array.isArray(state) ||
        !state.startStations ||
        typeof state.startStations !== 'object' ||
        Array.isArray(state.startStations) ||
        !Array.isArray(state.fixedStartUnits)
      ) {
        return json({ok:false,error:'Neplatná data rozlosování.'});
      }

      const props = PropertiesService.getScriptProperties();
      let previous = {};

      try {
        previous = JSON.parse(props.getProperty(PROP_APP_STATE) || '{}');
        if (!previous || typeof previous !== 'object' || Array.isArray(previous)) {
          previous = {};
        }
      } catch (err) {
        previous = {};
      }

      // Rozlosování stanovišť.
      const safeStarts = {};

      Object.keys(state.startStations).forEach(unit => {
        const station = Number(state.startStations[unit]);

        if (unit && Number.isInteger(station) && station >= 1 && station <= 8) {
          safeStarts[String(unit)] = station;
        }
      });

      // Pevně přiřazené jednotky.
      const safeFixed = state.fixedStartUnits
        .filter(unit => typeof unit === 'string' && unit.length <= 120)
        .slice(0,100);

      // Hodnocení stanovišť zachováme i tehdy, když je starší klient nepošle.
      const sourceAssessments =
        state.activeAssessments &&
        typeof state.activeAssessments === 'object' &&
        !Array.isArray(state.activeAssessments)
          ? state.activeAssessments
          : (
              previous.activeAssessments &&
              typeof previous.activeAssessments === 'object' &&
              !Array.isArray(previous.activeAssessments)
                ? previous.activeAssessments
                : {}
            );

      const safeAssessments = {};

      Object.keys(sourceAssessments).forEach(unit => {
        if (!unitsAllowed_(unit)) return;

        const item = sourceAssessments[unit];
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;

        const station = String(item.station || '').trim();
        if (!station || station.length > 180) return;

        safeAssessments[unit] = {
          station:station,
          reviewer:String(item.reviewer || '').slice(0,180),
          updatedAt:Number(item.updatedAt) || Date.now()
        };
      });

      // Automaticky dokončené jednotky na stanovišti 1.
      const sourceAutoCompleted = Array.isArray(state.autoCompletedStation1Units)
        ? state.autoCompletedStation1Units
        : (
            Array.isArray(previous.autoCompletedStation1Units)
              ? previous.autoCompletedStation1Units
              : []
          );

      const safeAutoCompleted = [...new Set(
        sourceAutoCompleted.filter(unit => unitsAllowed_(unit))
      )];

      // Velitel pro SMS: povoleny jsou pouze Lažánky nebo Horní Lhota.
      const requestedCommander = state.combinedSmsCommanderUnit;
      const previousCommander = previous.combinedSmsCommanderUnit;

      const safeCommander = ['Horní Lhota','Lažánky'].includes(requestedCommander)
        ? requestedCommander
        : (
            ['Horní Lhota','Lažánky'].includes(previousCommander)
              ? previousCommander
              : 'Horní Lhota'
          );

      const updatedAt = new Date().toISOString();

      const savedState = {
        startStations:safeStarts,
        fixedStartUnits:safeFixed,
        activeAssessments:safeAssessments,
        combinedSmsCommanderUnit:safeCommander,
        autoCompletedStation1Units:safeAutoCompleted,
        updatedAt:updatedAt
      };

      const serialized = JSON.stringify(savedState);

      if (serialized.length > 50000) {
        return json({ok:false,error:'Sdílený stav je příliš velký.'});
      }

      props.setProperty(PROP_APP_STATE,serialized);

      // Ověříme, že uložený velitel odpovídá požadované hodnotě.
      let verification;

      try {
        verification = JSON.parse(props.getProperty(PROP_APP_STATE) || '{}');
      } catch (err) {
        return json({ok:false,error:'Uložený sdílený stav se nepodařilo načíst.'});
      }

      if (verification.combinedSmsCommanderUnit !== safeCommander) {
        return json({
          ok:false,
          error:'Uložení velitele pro SMS se nepodařilo ověřit.'
        });
      }

      return json({ok:true,updatedAt:updatedAt});
    }

    const props = PropertiesService.getScriptProperties();

    if (data.action === 'resetProduction') {
      const pin = props.getProperty('ORGANIZER_PIN');

      if (!pin || String(data.pin || '') !== pin) {
        return json({ok:false,error:'Nesprávný organizační PIN nebo PIN není nastaven.'});
      }

      clearDataRows_(SHEET_RESULTS);
      clearDataRows_(SHEET_REPORTS);
      clearDataRows_(SHEET_ASSESSMENTS);
      clearDataRows_(SHEET_CONTACTS);

      props.deleteProperty(PROP_ACTIVE);
      props.deleteProperty('QUIZ_COMPLETED_UNITS');
      props.deleteProperty('QUIZ_LAST_CLOSED');

      // Resetujeme i celý sdílený stav včetně volby velitele SMS.
      props.setProperty(PROP_APP_STATE,JSON.stringify({
        startStations:{},
        fixedStartUnits:[],
        activeAssessments:{},
        combinedSmsCommanderUnit:'Horní Lhota',
        autoCompletedStation1Units:[],
        updatedAt:new Date().toISOString()
      }));

      return json({
        ok:true,
        message:'Výsledky, QR zprávy, hodnocení stanovišť, kontakty i sdílené rozlosování byly vymazány.'
      });
    }

    if (data.action === 'activate' || data.action === 'close') {
      const pin = props.getProperty('ORGANIZER_PIN');

      if (!pin || String(data.pin || '') !== pin) {
        return json({ok:false,error:'Nesprávný organizační PIN nebo PIN není nastaven.'});
      }

      if (data.action === 'close') {
        const closed = closeQuizSession_(getActive());
        if (!closed.ok) return json(closed);

        let completed=[];
        try { completed=JSON.parse(props.getProperty('QUIZ_COMPLETED_UNITS')||'[]'); } catch(err) {}
        if(!Array.isArray(completed))completed=[];
        const active=getActive();
        if(active&&active.unit&&!completed.includes(active.unit))completed.push(active.unit);
        props.setProperty('QUIZ_COMPLETED_UNITS',JSON.stringify(completed));
        props.setProperty('QUIZ_LAST_CLOSED',JSON.stringify({summary:closed,token:active.token,unit:active.unit}));
        props.deleteProperty(PROP_ACTIVE);
        return json(closed);
      }

      if (!unitsAllowed_(data.unit)) {
        return json({ok:false,error:'Neznámá jednotka.'});
      }

      const session = {
        unit:data.unit,
        token:Utilities.getUuid().replace(/-/g,''),
        startedAt:new Date().toISOString()
      };

      props.setProperty(PROP_ACTIVE,JSON.stringify(session));
      props.deleteProperty('QUIZ_LAST_CLOSED');

      return json({
        ok:true,
        session:{unit:session.unit,token:session.token}
      });
    }

    if (data.action === 'submit') {
      const active = getActive();

      if (!active || data.token !== active.token) {
        return json({
          ok:false,
          error:'Relace už není aktivní. Odpovědi nebyly přijaty.'
        });
      }

      const name = String(data.name || '').trim();
      const role = String(data.role || '');
      const isCombined = active.unit === 'Lažánky + Horní Lhota';
      const unit = isCombined ? String(data.unit || '').trim() : active.unit;

      if (!name || !QUIZZES[role]) {
        return json({ok:false,error:'Chybí jméno nebo role.'});
      }

      if (isCombined && ['Lažánky','Horní Lhota'].indexOf(unit) === -1) {
        return json({ok:false,error:'Vyber Lažánky nebo Horní Lhotu.'});
      }

      const quiz = QUIZZES[role];
      const answers = Array.isArray(data.answers) ? data.answers : [];
      const byQuestion = {};

      answers.forEach(a => {
        const qi = Number(a.question);
        const ai = Number(a.answer);

        if (
          Number.isInteger(qi) &&
          qi >= 0 &&
          qi < quiz.length &&
          Number.isInteger(ai) &&
          ai >= 0 &&
          ai < quiz[qi].options.length
        ) {
          byQuestion[qi] = ai;
        }
      });

      let correct = 0;
      const wrong = [];

      quiz.forEach((q,i) => {
        const answer = byQuestion[i];

        if (answer === q.correct) {
          correct++;
        } else {
          wrong.push({
            question:q.question,
            answer:answer === undefined ? null : q.options[answer],
            correct:q.options[q.correct]
          });
        }
      });

      const total = quiz.length;
      const percentage = Math.round(correct / total * 100);
      const duration = Math.min(1200,Math.max(0,Number(data.durationSeconds) || 0));

      getSheet().appendRow([
        new Date(),
        unit,
        name,
        role,
        total,
        correct,
        percentage,
        duration,
        JSON.stringify(wrong),
        active.token,
        JSON.stringify(byQuestion)
      ]);

      return json({ok:true,correct:correct,total:total,percentage:percentage});
    }

    return json({ok:false,error:'Neznámá operace.'});

  } catch (err) {
    return json({ok:false,error:String(err)});
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}