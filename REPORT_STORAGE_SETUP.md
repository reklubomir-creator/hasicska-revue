# Ukládání konkrétních hodnocení pro QR kódy

Frontend ve verzi 0.1.28 už vytváří QR ve tvaru `?reportId=XXXXXXXXXXXX`. Plná zpráva se má uložit do Google Sheets a při otevření QR načíst přes existující Google Apps Script.

## 1. Přidej pomocné funkce do existujícího Google Apps Scriptu

Vlož následující funkce do projektu, který už obsluhuje kvízy. Nenahrazuj celý existující skript — zachovej stávající `doGet` a `doPost`.

```javascript
function reportStorageJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function reportStorageSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Skript musí být navázán na tabulku Google Sheets.');
  let sheet = ss.getSheetByName('Hodnocení');
  if (!sheet) {
    sheet = ss.insertSheet('Hodnocení');
    sheet.appendRow(['ID', 'Vytvořeno', 'Jednotka', 'Payload JSON']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Vytvořeno', 'Jednotka', 'Payload JSON']);
  }
  return sheet;
}

function reportStorageGet_(id) {
  id = String(id || '').trim().toUpperCase();
  if (!/^[A-F0-9]{12}$/.test(id)) return { ok: false, error: 'Neplatný identifikátor hodnocení.' };
  const sheet = reportStorageSheet_();
  if (sheet.getLastRow() < 2) return { ok: false, error: 'Toto hodnocení nebylo nalezeno.' };
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).trim().toUpperCase() !== id) continue;
    const raw = sheet.getRange(i + 2, 4).getValue();
    try { return { ok: true, report: JSON.parse(raw) }; }
    catch (err) { return { ok: false, error: 'Uložená zpráva je poškozená.' }; }
  }
  return { ok: false, error: 'Toto hodnocení nebylo nalezeno.' };
}

function reportStorageSave_(data) {
  const id = String(data && data.id || '').trim().toUpperCase();
  const report = data && data.report;
  if (!/^[A-F0-9]{12}$/.test(id) || !report || typeof report !== 'object') {
    return { ok: false, error: 'Chybí platné ID nebo obsah hodnocení.' };
  }
  const json = JSON.stringify(report);
  if (json.length > 45000) return { ok: false, error: 'Zpráva je příliš dlouhá pro uložení do jedné buňky.' };
  const sheet = reportStorageSheet_();
  const row = [id, new Date(), String(report.u || ''), json];
  if (sheet.getLastRow() >= 2) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim().toUpperCase() === id) {
        sheet.getRange(i + 2, 1, 1, 4).setValues([row]);
        return { ok: true, id: id };
      }
    }
  }
  sheet.appendRow(row);
  return { ok: true, id: id };
}
```

## 2. Přidej dvě směrovací podmínky do stávajících funkcí

V existující `doGet(e)` přidej před běžné zpracování akcí:

```javascript
if (String(e.parameter.action || '') === 'getReport') {
  return reportStorageJson_(reportStorageGet_(e.parameter.id));
}
```

V existující `doPost(e)` přidej hned po parsování JSON těla do proměnné `data` a před ostatními akcemi:

```javascript
if (String(data.action || '') === 'saveReport') {
  return reportStorageJson_(reportStorageSave_(data));
}
```

Pokud už máš proměnnou `data` vytvořenou jinak, použij její existující název.

## 3. Ulož a nasaď novou verzi

V editoru Apps Script ulož projekt a v **Nasadit → Spravovat nasazení** uprav stávající webovou aplikaci na novou verzi. Zachovej stejné URL a přístupová oprávnění, která aplikace už používá.

Po nasazení bude PDF ukládat kompletní hodnocení do listu `Hodnocení`; QR ponese jen krátké ID a web načte příslušnou zprávu z tabulky. Bez nasazení těchto serverových změn nebude nová funkce ukládání a načítání fungovat.