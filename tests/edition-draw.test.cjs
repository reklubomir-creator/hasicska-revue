const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync("ostry-provoz/editions.js","utf8");
const ctx = vm.createContext({crypto:{randomUUID}});
vm.runInContext(source.slice(source.indexOf("function buildRemainingDraw(")),ctx);

test("dolosování ponechá hotové starty a vyplní i neúplné řádky", () => {
  const result = ctx.buildRemainingDraw(["ab","ce","d","f"].map(id => ({id})),
    ["s","p","t","q"].map(id => ({id})),
    [{id:"fixed",unitId:"ab",stationId:"s"}, {id:"partial",unitId:"ce"}, {id:"station",stationId:"t"}, {id:"blank"}]);
  assert.equal(result.ok,true);
  assert.equal(result.draw.length,4);
  assert.equal(result.draw[0].stationId,"s");
  assert.equal(result.draw[1].unitId,"ce");
  assert.equal(result.draw[2].stationId,"t");
  assert.equal(new Set(result.draw.map(row => row.stationId)).size,4);
  assert.equal(new Set(result.draw.map(row => row.unitId)).size,4);
});

test("dolosování oznámí nedostatek stanovišť i duplicitní start", () => {
  assert.equal(ctx.buildRemainingDraw([{id:"ab"}],[],[]).ok,false);
  assert.equal(ctx.buildRemainingDraw([{id:"ab"}],[{id:"s"}],[
    {id:"fixed",unitId:"ab",stationId:"s"},{id:"duplicate",unitId:"ab"}
  ]).ok,false);
});

test("výjezdová SMS odpovídá zadanému vzoru včetně mezer a středníku", () => {
  assert.equal(ctx.formatDispatchSms({
    vehicles:"1V, 1DA",alarm:"16.11.2026 09:46:28",event:"P-Odpad",location:"Blansko 2492",
    landmark:"nad COV",description:"P kompostarna - kompost, vedle hromada, plamen, 30 x 30 m"
  }),"VYJEZD PRO: 1V, 1DA, 16.11.2026 09:46:28,P-Odpad, Blansko 2492, nad COV; P kompostarna - kompost, vedle hromada, plamen, 30 x 30 m");
  assert.equal(ctx.formatDispatchSms({location:" Blansko 2492 ",description:"P kompostarna"}),
    "VYJEZD PRO: Blansko 2492; P kompostarna");
});
