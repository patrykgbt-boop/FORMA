import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const scripts=fs.readdirSync(new URL("..",import.meta.url)).filter(x=>x.endsWith(".js"));
const extract=(name)=>{
  const re=new RegExp("  function "+name.replace(/[.*+?^\u0024{}()|[\]\\]/g,"\\\u0024&")+"\\([\\s\\S]*?(?=\\n  (?:function |async function |const |let |\\\u0024\\(|\\\u0024\\\u0024\\(|window\\.|if\\())|\\n  \\})");
  const found=html.match(re);
  assert.ok(found,"Missing function "+name);
  return found[0];
};

test("HTML has exactly one main inline script and it parses",()=>{
  assert.equal(inline.length,1);
  new vm.Script(inline[0],{filename:"index.inline.js"});
});
test("all shipped JavaScript files parse (service worker, PWA, instructions)",()=>{
  for(const file of scripts) new vm.Script(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"),{filename:file});
});
test("key HTML controls and authentication are not duplicated",()=>{
  for(const id of ["authForm","signInBtn","authMessage","workoutExercises","saveDetailedWorkout","workoutDaySelect","jDate"]){
    const occurrences=[...html.matchAll(new RegExp('id="'+id+'"',"g"))];
    assert.equal(occurrences.length,1,id);
  }
  assert.match(inline[0],/signInWithPassword/);
  assert.match(inline[0],/getSession/);
});
test("workout saving is atomic: never deletes old sets from browser",()=>{
  const start=html.indexOf("  async function saveDetailedWorkout(){");
  const end=html.indexOf("  function planDayOptionLabel(",start);
  assert.ok(start>0&&end>start);
  const code=html.slice(start,end);
  assert.match(code,/rpc\(["']save_workout_atomic["']/);
  assert.doesNotMatch(code,/from\(["']workout_sets["']\)\.delete\(/);
  assert.match(code,/saveWorkoutDraft/);
  assert.match(code,/clearWorkoutDraft/);
});
test("workout draft is stored by user, date and day",()=>{
  assert.match(inline[0],/forma-workout-draft-v1/);
  assert.match(inline[0],/function workoutDraftKey\(userId,date,day\)/);
  assert.match(inline[0],/window\.addEventListener\(["']pagehide["']/);
});
test("pure set validation rejects partial, duplicate, malformed records",()=>{
  const source=extract("validateWorkoutPayload");
  const validate=new Function(source+";return validateWorkoutPayload;")();
  const good=[{exercise_id:"x",exercise_name:"Bench",set_number:1,weight_kg:95,reps:5,rir:1,is_warmup:false}];
  assert.equal(validate(good),null);
  assert.match(validate([]),/ser/i);
  assert.match(validate([...good,{...good}]),/numer|powtórzon/i);
  assert.match(validate([{...good,reps:null}]),/powt/i);
  assert.match(validate([{...good,weight_kg:-10}]),/ciężar/i);
  assert.match(validate([{...good,rir:11}]),/RIR/i);
  assert.match(validate([{...good,exercise_name:" "}]),/wariant/i);
});
