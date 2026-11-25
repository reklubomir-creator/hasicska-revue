const { createHash, randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

function memorySheet() {
  const rows = [];
  return {
    rows,
    getLastRow: () => rows.length,
    getLastColumn: () => Math.max(0,...rows.map(row => row.length)),
    appendRow: row => rows.push(Array.from(row)),
    deleteRow: row => rows.splice(row - 1,1),
    deleteRows: (row,count) => rows.splice(row - 1,count),
    getRange(row,column,count = 1,width = 1) {
      function getValues() {
        return Array.from({length:count},(_,r) =>
          Array.from({length:width},(_,c) => rows[row + r - 1]?.[column + c - 1] ?? ""));
      }
      return {
        getValues,
        getDisplayValues: () => getValues().map(record => record.map(String)),
        setValues(values) {
          for (let r = 0; r < count; r++) {
            rows[row + r - 1] ||= [];
            for (let c = 0; c < width; c++) rows[row + r - 1][column + c - 1] = values[r][c];
          }
        }
      };
    },
    getDataRange() { return this.getRange(1,1,this.getLastRow(),this.getLastColumn()); }
  };
}

function createAppsScript(initialProperties = {}) {
  let now = Date.now();
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const sheets = new Map();
  const properties = new Map(Object.entries(initialProperties));
  const spreadsheet = {
    getSheetByName: name => sheets.get(name) || null,
    insertSheet(name) {
      if (sheets.has(name)) throw new Error("List již existuje.");
      const sheet = memorySheet();
      sheets.set(name,sheet);
      return sheet;
    }
  };
  let held = false;
  const context = vm.createContext({
    Date:TestDate,
    SpreadsheetApp:{getActiveSpreadsheet:() => spreadsheet},
    ContentService:{
      MimeType:{JSON:"application/json"},
      createTextOutput:text => ({text,setMimeType() { return this; }})
    },
    PropertiesService:{getScriptProperties:() => ({
      getProperty:key => properties.get(key) ?? null,
      setProperty:(key,value) => properties.set(key,value),
      deleteProperty:key => properties.delete(key)
    })},
    LockService:{getScriptLock:() => ({
      waitLock() {
        if (held) throw new Error("Lock already held");
        held = true;
      },
      releaseLock() {
        if (!held) throw new Error("Lock not held");
        held = false;
      }
    })},
    Utilities:{
      getUuid:randomUUID,
      DigestAlgorithm:{SHA_256:"sha256"},Charset:{UTF_8:"utf8"},
      computeDigest:(algorithm,value,charset) => [...createHash(algorithm).update(value,charset).digest()]
    }
  });
  vm.runInContext(readFileSync("ostry-provoz/Code.gs","utf8"),context,{filename:"Code.gs"});
  return {
    advance(ms) { now += ms; },
    insertSheet:spreadsheet.insertSheet,
    sheets,
    post(data) {
      now++;
      return JSON.parse(context.doPost({postData:{contents:JSON.stringify(data)}}).text);
    },
    get(parameter) { return JSON.parse(context.doGet({parameter}).text); }
  };
}

module.exports = {createAppsScript};
