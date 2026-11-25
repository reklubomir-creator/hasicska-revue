# Změny Hasičské revue

## 1.1.0-beta.4 — 2026-11-25

- Jednotka vidí výjezdovou zprávu s cílem, pokyny a mapou. Vedení nastavuje text pro každé stanoviště a vidí čas převzetí pokynu i příjezdu.
- Po potvrzení příjezdu se hodnocení při otevření formuláře zahájí automaticky s vybraným hodnotitelem. Po uložení vyhodnocení může hodnotitel uvolnit stanoviště pro další jednotku.
- Pohotovost je označena jako pauza na zbrojnici. Mimořádné pauzy se zobrazují pouze v případě, že jsou aktivní.
- Vráceno české diktování poznámky při hodnocení. Přepsaný text se ukládá jako rozpracovaný koncept.
- Doplněn samostatný náhled ročníku pro pozorovatele. Ukazuje aktuální stav jednotek, stanoviště a postup. Přístup chrání vlastní kód, který se nastavuje jako `EDITION_OBSERVER_CODE` v Apps Scriptu.

## 1.1.0-beta.3 — 2026-11-25

- Studna se vybírá jako běžné soutěžní stanoviště. Potvrzení průchodu a dodatečné hodnocení má vlastní volbu.
- Pole Údaje je přejmenováno na nepovinnou poznámku k jednotce.
- Přihlášení hodnotitele rozlišuje platný kód před startem soutěže a neplatný přístup.

## 1.1.0-beta.2 — 2026-11-25

- Sjednocený vzhled přehledu jednotky, hodnocení a průběhu ročníku. Aktuální stanoviště a čekání na přesun jsou čitelnější. Stav připojení a pohotovost mají vlastní vizuální zvýraznění.
- Správa ročníků má sbalené seznamy, větší dotykové ovládání a přehlednější mobilní formuláře. Průběh ročníku má sbalitelné uvolňování stanovišť a organizaci pauz.
- Ověřeno místně v Chromiu při šířkách 320, 390, 768 a 1440 px.

## 1.1.0-beta.1 — 2026-11-25

- Integrační testy spouštějí skutečné API handlery s místní náhradou Google Sheets. Pokrývají přípravu a start ročníku, hodnocení, povolení přesunu, pauzu, adresování oznámení, archivaci a ochranu historického listu.
- Prohlížečový scénář v Chromiu ověřil administraci, přístup jednotky, obnovení konceptu, předání stanoviště, zprávy a návrat z offline režimu. Opraveno předčasné zobrazení pole soukromého odkazu.
- Produkční kvíz ve zdrojích obsahuje 15 schválených otázek na roli. Starší vývojové větve mají sady po 20 otázkách. Beta zachovává schválenou sadu. Podmínky před nasazením shrnuje [audit](AUDIT.md).

## 1.1.0-alpha.6.1 — 2026-11-25

- Přidána podpora Web Push v samostatném přehledu jednotky, včetně otevření vybrané zprávy ze systémového oznámení.
- Odběry jsou vázány na platný přístup jednotky. Doručovací proces ukládá potvrzená odeslání a opakuje dočasné chyby.
- Nasazení vyžaduje testovací Apps Script, klíče VAPID a spuštěný doručovací proces. Postup je v [návodu](push-relay/README.md).

## 1.1.0-alpha.6 — 2026-11-25

- Organizátor může zahájit časovanou pauzu pro všechny jednotky nebo pro jednu a případně ji ukončit dříve. Během pauzy systém dotčené jednotce nepřidělí další přesun.
- Přehled jednotky zobrazuje konec pauzy, zprávy organizátora, průběžné pokyny a oznámení o novém stanovišti. Zprávy se obnovují v otevřené stránce bez duplicitního zápisu.
- Doručení push při zavřené aplikaci zbývá. Etapa 1.1.0-alpha.5 pro GPS byla odložena.

## 1.1.0-alpha.4 — 2026-11-25

- Tlačítko Start soutěže odhalí jednotkám startovní stanoviště. Po uzavření stanoviště jednotka čeká na uvolnění cíle.
- Velitel stanoviště otevře obsazené stanoviště tlačítkem Můžeme poslat novou jednotku až po potvrzení dokončení dosavadní jednotky. Čekající jednotky dostávají volný cíl v pořadí, ve kterém dokončily předchozí stanoviště.
- Přehled ročníku se obnovuje automaticky a zobrazuje obsazení, stav hodnocení a absolvovaná stanoviště podle oprávnění. Pohotovost se do součtu nepočítá.
- Studna umožňuje samostatně potvrdit průchod a doplnit hodnocení později. U nového ročníku zatím potvrzuje uzavřený kvíz organizátor. Původní kvíz, Studna a historické listy zůstávají oddělené.

## 1.1.0-alpha.3 — 2026-11-25

- Správa ročníků vydává soukromý odkaz a QR kód pro konkrétní jednotku. Vydáním nového odkazu nebo zrušením přístupu se předchozí odkaz zneplatní. Tabulka ukládá pouze otisk klíče.
- Mobilní stránka načítá serverem omezené údaje vlastní jednotky, zobrazuje startovní stanoviště, stav přípravy, souhrn absolvování a připojení. Při výpadku v otevřené stránce zůstanou poslední načtené údaje s upozorněním.
- List přípravy je zdrojem startu. Předávání dalších stanovišť po potvrzení hodnocení, ostrý průběh a skutečné pauzy čekají na propojení v dalších etapách.

## 1.1.0-alpha.2 — 2026-11-25

- Přidána správa přípravy ročníků s organizačním PINem a kontrolou souběžných úprav.
- Každý ročník má vlastní konfiguraci jednotek, kontaktů velitelů, typů stanovišť, přiřazení hodnotitelů, seznamu pozorovatelů a rozlosování. Zbývající starty lze dolosovat se zachováním již vybraných.
- Konfigurace se ukládá v Google Sheets do samostatného listu podle roku. Stávající hodnocení a výsledky zůstávají v původním úložišti. Přepínání ostrého ročníku a jeho výsledků zatím není součástí této verze.

## 1.1.0-alpha.1 — 2026-11-25

- Nové i upravované hodnocení ukládá poznámku a výsledek do místního konceptu. Koncepty jsou oddělené podle ročníku, hodnotitele, jednotky, stanoviště a typu zápisu. Při otevření formuláře se obnoví jeho koncept. Po spuštění se obnoví poslední dostupný koncept daného hodnotitele.
- Formulář zobrazuje stav místního uložení. Úspěšný zápis vyžaduje potvrzení serveru. Opakování stejného odeslání neprovede druhý zápis a kontrola revize chrání před přepsáním mezitím změněného hodnocení.
- Server vyžaduje k ručnímu zápisu kód příslušného stanoviště nebo organizační PIN. Mazání vyžaduje organizační PIN. Kódy se nastavují v Apps Scriptu a vstup je skrytý. Trvalé QR odkazy stále otevírají stejné rozhraní.
- Vývojová ostrá část vyžaduje vlastní testovací Apps Script. Rozbor architektury a zbývajících rizik je v [auditu](AUDIT.md).

## 1.0.4

- Závěrečný přehled zobrazuje hodnocení podle stanoviště po řádcích jednotek.
