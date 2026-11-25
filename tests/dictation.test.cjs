const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync("ostry-provoz/prubeh.js","utf8");
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf("function liveDictationText("),source.lastIndexOf("})();")),context);
const phrase = (transcript,isFinal) => Object.assign([{transcript}],{isFinal});

test("diktování průběžně zobrazí i opraví nepotvrzený text", () => {
  const transcribe = context.liveDictationText;
  assert.equal(transcribe([phrase("Jednotka přijela",false)],false),"Jednotka přijela");
  assert.equal(transcribe([phrase("Jednotka přijela včas.",true),phrase("Po krátké",false)],false),
    "Jednotka přijela včas. Po krátké");
  assert.equal(transcribe([phrase("Jednotka přijela včas.",true),phrase("Po kontrole pokračovala.",true)],false),
    "Jednotka přijela včas. Po kontrole pokračovala.");
});

test("Android odfiltruje opakované části a zachová navazující slova", () => {
  const transcribe = context.liveDictationText;
  const initial = phrase("Jednotka přijela včas.",true);
  assert.equal(transcribe([initial,phrase("jednotka přijela včas",false)],true),"Jednotka přijela včas.");
  assert.equal(transcribe([initial,phrase("přijela včas a připravila techniku",false)],true),
    "Jednotka přijela včas. a připravila techniku");
  assert.equal(transcribe([initial,phrase("jednotka přijela včas.",true),phrase("Technika byla připravená.",true)],true),
    "Jednotka přijela včas. Technika byla připravená.");
});
