# Web Push pro jednotky

Odběry ukládá testovací Apps Script. Doručovací proces načítá pouze identifikátory oznámení a aktivní odběry. Na zamčené obrazovce se zobrazuje obecný pokyn. Po klepnutí se otevře přehled vlastní jednotky a příslušná zpráva se zvýrazní.

## Nastavení testu

1. Nasaď `ostry-provoz/Code.gs` jako samostatný Apps Script navázaný na testovací tabulku. Do jeho Script Properties přidej `UNIT_PUSH_RELAY_SECRET` s náhodným tajemstvím nejméně 32 znaků.
2. V tomto adresáři použij Node.js 22.13 nebo novější, spusť `npm ci` a následně `npx --no-install web-push generate-vapid-keys`. Veřejný klíč nastav jako `PUSH_VAPID_PUBLIC_KEY` v `ostry-provoz/config.js`. Do stejného souboru patří URL testovacího Apps Scriptu jako `TEST_API_URL`.
3. Na hostu pro doručování nastav proměnné prostředí:

   | Proměnná | Hodnota |
   | --- | --- |
   | `REVUE_TEST_API_URL` | Stejná testovací URL končící na `/exec` |
   | `REVUE_RELAY_SECRET` | Stejné tajemství jako v nastavení Apps Scriptu |
   | `REVUE_VAPID_SUBJECT` | Kontaktní adresa ve tvaru `mailto:` |
   | `REVUE_VAPID_PUBLIC_KEY` | Vygenerovaný veřejný klíč |
   | `REVUE_VAPID_PRIVATE_KEY` | Vygenerovaný neveřejný klíč |
   | `REVUE_PUSH_DB` | Cesta k SQLite na trvalém zapisovatelném úložišti |

4. Spusť jednu instanci pomocí `npm start`. `npm start -- --once` provede jeden cyklus pro test. Klíč a tajemství patří do konfigurace hostu. SQLite eviduje odeslané události a opakování při dočasném selhání.
5. Otevři odkaz testovací jednotky a povol oznámení. Na iPhonu s iOS 16.4 nebo novějším nejprve stránku přidej na plochu. V aplikaci z plochy vlož přístupový odkaz a klepni na **Povolit oznámení**. Vyzkoušej zprávu od vedení na zavřeném přehledu a ověř otevření zprávy klepnutím.

Odběry povolené na daném zařízení si zapamatují přístup jednotky pro otevření ze systémového oznámení. Odhlášení ho smaže. Výměna odkazu nebo archivace ročníku zastaví další doručování pro původní přístup.
