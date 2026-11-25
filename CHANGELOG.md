# Změny Hasičské revue

## 1.1.0-alpha.1 — 2026-11-25

- Nové i upravované hodnocení ukládá poznámku a výsledek do místního konceptu. Koncepty jsou oddělené podle ročníku, hodnotitele, jednotky, stanoviště a typu zápisu. Při otevření formuláře se obnoví jeho koncept. Po spuštění se obnoví poslední dostupný koncept daného hodnotitele.
- Formulář zobrazuje stav místního uložení. Úspěšný zápis vyžaduje potvrzení serveru. Opakování stejného odeslání neprovede druhý zápis a kontrola revize chrání před přepsáním mezitím změněného hodnocení.
- Server vyžaduje k ručnímu zápisu kód příslušného stanoviště nebo organizační PIN. Mazání vyžaduje organizační PIN. Kódy se nastavují v Apps Scriptu a vstup je skrytý. Trvalé QR odkazy stále otevírají stejné rozhraní.
- Vývojová ostrá část vyžaduje vlastní testovací Apps Script. Rozbor architektury a zbývajících rizik je v [auditu](AUDIT.md).

## 1.0.4

- Závěrečný přehled zobrazuje hodnocení podle stanoviště po řádcích jednotek.
