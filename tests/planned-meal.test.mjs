import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const js=fs.readFileSync(new URL("../planned-meal.js",import.meta.url),"utf8");
const ctx={};vm.runInNewContext(js,ctx,{filename:"planned-meal.js"});
const api=ctx.FORMA_MEAL_IMPORT;
const p=(name,grams=100)=>({id:name,name,serving_grams:grams,
  kcal_per_100:100,protein_per_100:10,carbs_per_100:10,fat_per_100:2});

test("recipe with batch prep is divided into one serving, without mixing product names with commas",()=>{
  const recipe={ingredients:"Pierś z kurczaka, surowa — 360 g\nRyż basmati, suchy — 330 g",servings:2};
  const result=api.buildItems(recipe,[p("Pierś z kurczaka, surowa"),p("Ryż basmati, suchy")]);
  assert.equal(result.rows[0].amount_g,180);
  assert.equal(result.rows[1].amount_g,165);
  assert.equal(result.rows[0].product_name,"Pierś z kurczaka, surowa");
  assert.equal(result.canFastSave,true);
});
test("ml and individual pieces require review and use library serving grams where available",()=>{
  const recipe={ingredients:"Mleko 2% — 300 ml\nJajko kurze, całe — 2 szt.",servings:1};
  const r=api.buildItems(recipe,[p("Mleko 2%"),p("Jajko kurze, całe",60)]);
  assert.equal(r.rows[0].amount_g,300);
  assert.equal(r.rows[1].amount_g,120);
  assert.equal(r.canFastSave,false);
  assert.ok(r.rows.every(x=>x.needsReview));
});
test("unknown product does not silently receive invented calories",()=>{
  const r=api.buildItems({ingredients:"Nieznany produkt — 30 g",servings:1},[]);
  assert.equal(r.rows[0].kcal_per_100,null);
  assert.equal(r.rows[0].amount_g,30);
  assert.equal(r.canFastSave,false);
  assert.match(api.validateRows(r.rows),/wiarygodne/i);
});
test("malformed ingredient is shown rather than silently omitted",()=>{
  const r=api.buildItems({ingredients:"Nieczytelne ilości\nBanan — 120 g",servings:1},[p("Banan")]);
  assert.equal(r.rows.length,2);
  assert.equal(r.rows[0].amount_g,null);
  assert.equal(r.canFastSave,false);
});
test("portion changes adjust grams, not nutritional values per 100g",()=>{
  const rows=api.buildItems({ingredients:"Banan — 140 g",servings:1},[p("Banan")]).rows;
  const scaled=api.scaleRows(rows,1.5);
  assert.equal(scaled[0].amount_g,210);
  assert.equal(scaled[0].kcal_per_100,100);
  assert.equal(rows[0].amount_g,140);
  assert.equal(Math.round(api.totals(scaled).kcal),210);
});
test("invalid weights or empty meal cannot be saved",()=>{
  const x=api.buildItems({ingredients:"Banan — 100 g",servings:1},[p("Banan")]).rows;
  assert.equal(api.validateRows(x),null);
  assert.match(api.validateRows([]),/produkt/i);
  assert.match(api.validateRows([{...x[0],amount_g:0}]),/gramatur/i);
  assert.match(api.validateRows([{...x[0],protein_per_100:null}]),/kcal/i);
  assert.match(api.validateRows([{...x[0],kcal_per_100:-1}]),/kcal/i);
});
test("new UI calls atomic RPC and forbids auto-import of unverified values",()=>{
  const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/client\.rpc\("log_planned_meal"/);
  assert.match(html,/if\(!source\.canFastSave\)/);
  for(const meal of ["breakfast","lunch","dinner","extras"]){
    assert.match(html,new RegExp('data-import-meal="'+meal+'"'));
    assert.match(html,new RegExp('id="import-'+meal+'"'));
  }
});
