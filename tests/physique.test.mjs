import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const script=fs.readFileSync(new URL("../physique.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const sw=fs.readFileSync(new URL("../sw.js",import.meta.url),"utf8");

test("private physique module JavaScript parses",()=>{new vm.Script(script,{filename:"physique.js"});});
test("app exposes physique tab and form controls",()=>{
 for(const id of ["view-physique","physiqueCompareGrid","physiqueCompareA","physiqueCompareB",
    "physiqueCompareView","physiquePhotoForm","physiqueMeasureForm","physiqueGoalsForm",
    "physiquePriorities","physiqueGallery","physiqueRecommendations","physiqueMessage"]){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.match(html,/data-view="physique"/);
 assert.match(html,/physique:"Sylwetka"/);
});
test("private photo uploads convert files to JPEG on the device and never use public URLs",()=>{
 assert.match(script,/canvas|can\.toBlob/);
 assert.match(script,/image\/jpeg/);
 assert.match(script,/createSignedUrl\(/);
 assert.doesNotMatch(script,/getPublicUrl\(/);
 assert.match(script,/BUCKET="forma-physique-private"/);
 assert.match(script,/userId\+"\/"\+crypto\.randomUUID/);
});
test("photo deletion and account isolation are present",()=>{
 assert.match(script,/\.storage\.from\(BUCKET\)\.remove/);
 assert.match(script,/\.eq\("user_id",api\.userId\)/);
 assert.match(script,/window\.addEventListener\("forma:auth"/);
});
test("diet and exercise recommendations are read-only",()=>{
 const start=script.indexOf("function recommendations(){");
 const stop=script.indexOf("function render(){",start);
 assert.ok(start>0&&stop>start);
 const body=script.slice(start,stop);
 assert.doesNotMatch(body,/\.update\(|\.insert\(|\.upsert\(|\.delete\(/);
 assert.match(body,/context|api|exercisePlan/);
});
test("photos do not expose guessed body-fat percentages or auto-identify people",()=>{
 assert.doesNotMatch(script,/estimateBodyFat|faceIdentification|inferSex|BMIfromPhoto/);
 assert.match(html,/nie.*szacuje procentu tkanki tłuszczowej/i);
});
test("PWA caches physique module without dropping sleep integration",()=>{
 assert.match(sw,/\"\/physique\.js\"/);
 assert.match(sw,/\"\/sleep\.js\"/);
 assert.match(html,/src="\/physique\.js" defer/);
});
