# Hasičská revue — audit 1.1.0-alpha.1

## Ověřený výchozí stav

- Produkční aplikace je v cestě `/ostry-provoz/`. Stránka na GitHub Pages a větev `main` (`caae1d5`) uváděly **1.0.4**. Kořenová stránka je starší pracovní prototyp se samostatným nastavením.
- Obě rozhraní tvoří HTML s vloženým CSS a JavaScriptem. Ostrá aplikace obsahuje pevné seznamy stanovišť, jednotek a hodnotitelů. Výsledky, hodnocení, kontakty a zprávy ukládá Apps Script do vázané Google tabulky. Sdílené rozlosování, stav soutěže a relace kvízu používají Script Properties. Prohlížeč uchovává místní kopie. Přehledy periodicky dotazují server.
- Větev `feature/gps-v2` (`d9b6bb2`) přidává čtyři soubory v `gps-worker/`. Větve `fix/studna-status-v0.1.99` a `pred-akci-opravy-2026-10-22` obsahují starší změny ke Studni, otázkám kvízu, kontaktům a jménu hodnotitele. Slučování těchto starších větví by vyžadovalo kontrolu proti změnám po soutěži.

## Oprávnění a data

| Oblast | Zjištění a stav |
| --- | --- |
| Ruční hodnocení | Alpha ověřuje kód stanoviště nebo organizační PIN před zápisem. Mazání vyžaduje organizační PIN. Identita z výběru jména na zařízení zatím není ověřená individuálním účtem. |
| Souběžné změny | Apps Script serializuje zápisy zámkem. Revize chrání aktualizace a shodný identifikátor u posledního zápisu potvrzuje opakování bez další změny. Při rozdílném obsahu nebo revizi server vrací konflikt a koncept se zachová. |
| Rozlosování a kontakty | Sdílený stav se zapisuje jako jeden celek. Zápis rozlosování, stavu hodnocení a kontaktů stále vyžaduje doplnění autorizace a ochrany proti souběžnému přepsání stavu. |
| Čtení a soukromí | Čtení kontaktů, výsledků a některých stavů v Apps Scriptu zatím nemá kontrolu role. Režimy hodnotitele a pozorovatele v URL slouží k otevření rozhraní. Je třeba zavést serverové relace a omezit rozsah čtených dat pro každou roli. |
| Kvíz | Aktivace, uzavření a reset mají kontrolu organizačního PINu. Vstup účastníka používá token kvízu. Přístupové kódy potřebují samostatnou ochranu proti hádání a provozní postup pro výměnu. |
| Ročníky | Současná tabulka a sdílený stav reprezentují jednu soutěž. Oddělené ročníky a archiv zůstávají součástí další etapy. |

## GPS větev

Worker přijímá polohu ve formátu OsmAnd a kontroluje ID zařízení proti hashi jeho individuálního tokenu a příznaku povolení v D1. Tabulka eviduje poslední přijatou polohu, čas záznamu a čas přijetí. Konfigurace neobsahuje vazbu na D1. Zbývá přidat autorizované čtení pro mapu, soutěžní časové okno, limit aktivních zařízení, pravidla stáří a pořadí poloh, omezení požadavků a bezpečné zacházení s tokeny v provozních záznamech. Interval při zamčeném iOS a Androidu zatím nebyl ověřen na zařízeních. GPS kód zůstává v původní větvi.

## Oddělené testování

Použij novou testovací Google tabulku a k ní vázaný Apps Script s kódem z `ostry-provoz/Code.gs`. V jeho Script Properties nastav vlastní `ORGANIZER_PIN` a `ASSESSMENT_STATION_TOKENS` jako JSON objekt, kde klíčem je přesný název stanoviště a hodnotou samostatný náhodný kód. Kód zadej jako heslo v hodnoticím formuláři.

URL testovacího Apps Scriptu nastav do `TEST_API_URL` v souboru `ostry-provoz/config.js`. Konfigurace platí také pro samostatná rozhraní hodnotitele a jednotky. Vývojová stránka zamítá známou produkční adresu Apps Scriptu. Testovací URL musí směřovat k testovací tabulce. Provozní PIN ani kódy do frontendu nepatří.
