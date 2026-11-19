# Hasičská revue GPS — v2.0.0 (vývoj)
První izolovaný modul pro příjem GPS z Traccar Client (iOS/Android). Ostrá aplikace v1.0.4 není změněna.

## Parametry
- Nejvýše 10 jednotek, cílový interval 30 s.
- Cloudflare Worker + D1, ukládá **jen poslední polohu** zařízení.
- Žádná veřejná mapa ani historie tras v této etapě.
- Příjem OsmAnd protokolu Traccar Client: `/gps?token=TAJNY_TOKEN&id=JEDNOTKA&lat=49.0&lon=16.0&timestamp=...`.
- Každá jednotka musí mít vlastní náhodný token; do D1 se ukládá jen SHA-256 hash. Přijímač ověřuje ID i token.

## Nasazení (zatím neprovedeno)
1. V Cloudflare vytvořit D1 databázi a vyplnit binding `DB` v `wrangler.toml`.
2. Spustit `wrangler d1 execute hasicska-revue-gps --remote --file=./schema.sql`.
3. Založit identifikátor a token pro testovací zařízení; bezpečně uložit jeho hash do `gps_devices`.
4. Nasadit Worker a nastavit Traccar Client na HTTPS adresu s tokenem.
5. Ověřit polohu při zamčeném telefonu, offline chování a výdrž baterie.

## Bezpečnost před ostrým nasazením
- Token v URL může skončit v provozních logách: omezit logování, ideálně použít jiný podporovaný způsob předání tajemství.
- Doplnit ochranu proti opakování požadavků, rate limiting, audit, kontrolu stáří polohy a automatické ukončení sledování.
- Přidat autentizované API pro mapu; tabulka gps_latest **nesmí být veřejně dostupná**.
- Ověřit skutečné parametry odesílané konkrétní verzí Traccar Client.
- GPS interval při zamčené obrazovce nelze garantovat.
