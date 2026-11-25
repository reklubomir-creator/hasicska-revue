# Změny Hasičské revue

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
