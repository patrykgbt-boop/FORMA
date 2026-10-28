import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const js=fs.readFileSync(new URL("../bench-coach.js",import.meta.url),"utf8");
const ctx={}; vm.runInNewContext(js,ctx,{filename:"bench-coach.js"});
const api=ctx.FORMA_BENCH_COACH;
const id=api.BENCH_ID;
const session=(n,date)=>({id:n,session_date:date,day_of_week:1});
const set=(session_id,weight,reps,rir=1,other={})=>({
  session_id,exercise_id:id,exercise_name:"Wyciskanie sztangi leżąc",
  set_number:1,weight_kg:weight,reps,rir,is_warmup:false,...other
});
const ex={id,name:"Wyciskanie sztangi leżąc",target_sets:4,rep_min:4,rep_max:6,progression_step_kg:2.5};
const history=(date,sets)=>({session:{session_date:date},sets});

test("Epley supports 110 kg target for 3 and 5 reps, no extrapolation for a single rep",()=>{
  assert.ok(Math.abs(api.epley(110,3)-121)<0.001);
  assert.ok(Math.abs(api.epley(110,5)-128.333333)<0.001);
  assert.equal(api.epley(110,1),110);
  assert.equal(api.epley(110,11),null);
});
test("isolates flat bench from close-grip, incline and warmup sets",()=>{
  const s=[session("a","2026-10-10"),session("b","2026-10-20")];
  const items=[
    set("a",95,3,1),set("a",150,1,1,{is_warmup:true}),
    set("b",95,5,1),
    set("b",140,4,1,{exercise_name:"Wyciskanie sztangi węższym chwytem"}),
    set("b",130,5,1,{exercise_name:"Wyciskanie hantli na skosie"}),
    set("b",130,4,1,{exercise_id:"another-id"}),
    set("b",90,8,1)
  ];
  const result=api.benchData(s,items,id);
  assert.equal(result.sessions,2);
  assert.equal(result.latest.best.weight,95);
  assert.equal(result.latest.best.reps,5);
  assert.ok(Math.abs(result.latest.best.e1rm-110.833333)<0.001);
  assert.ok(Math.abs(result.trendDelta-(110.833333-104.5))<0.001);
});
test("historical bench data supports 95×3 -> 95×5, confidence remains limited with only two sessions",()=>{
  const result=api.benchData([session("a","2026-10-10"),session("b","2026-10-20")],
    [set("a",90,6,2),set("a",95,3,1),set("b",95,5,1),set("b",90,8,1)]);
  assert.equal(result.sessions,2);
  assert.equal(result.latest.best.weight,95);
  assert.equal(result.previous.best.weight,90); // 90×6 gives higher Epley estimate than 95×3.
  assert.equal(result.trend.at(-1).best.reps,5);
  assert.ok(result.trendDelta>0);
});
test("next-load suggestion does not increase after mixed working weights",()=>{
  const sets=[set("a",95,5,1,{set_number:1}),set("a",92.5,5,1,{set_number:2}),
  set("a",92.5,4,1,{set_number:3}),set("a",90,8,1,{set_number:4})];
  const result=api.recommend(ex,[history("2026-10-20",sets)]);
  assert.equal(result.kind,"hold");
  assert.equal(result.weight,90);
  assert.match(result.message,/Wyrównaj serie/);
});
test("all four working sets at upper rep target with RIR >=1 permit exactly +2.5 kg",()=>{
  const rows=[1,2,3,4].map(n=>set("a",95,6,1,{set_number:n}));
  const result=api.recommend(ex,[history("2026-10-28",rows)]);
  assert.equal(result.kind,"increase");
  assert.equal(result.weight,97.5);
});
test("top reps with missing RIR or warm-up sets do not trigger increase",()=>{
  const noRir=[1,2,3,4].map(n=>set("a",95,6,null,{set_number:n}));
  const warmups=[...noRir.map(x=>({...x,rir:1})),set("a",150,7,0,{is_warmup:true,set_number:5})];
  assert.notEqual(api.recommend(ex,[history("2026-10-28",noRir)]).kind,"increase");
  assert.equal(api.recommend(ex,[history("2026-10-28",warmups)]).weight,97.5);
});
test("single weaker session never triggers a drop",()=>{
  const poor=[1,2,3,4].map(n=>set("a",95,3,2,{set_number:n}));
  const good=[1,2,3,4].map(n=>set("b",95,5,2,{set_number:n}));
  assert.equal(api.recommend(ex,[history("2026-10-28",poor),history("2026-10-20",good)]).kind,"hold");
});
test("a new machine variant is not compared to another exercise",()=>{
  assert.equal(api.isFlatBenchName("Wyciskanie sztangi węższym chwytem"),false);
  assert.equal(api.isFlatBenchName("Smith skos dodatni"),false);
  assert.equal(api.isFlatBenchName("Wyciskanie sztangi płasko"),true);
  assert.equal(api.isFlatBenchName("Bench Press"),true);
});
test("UI has dedicated bench panel, script loaded before inline code, no database mutations",()=>{
  const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.ok(html.indexOf('src="/bench-coach.js"') < html.indexOf('  const SUPABASE_URL'));
  for(const id of ["benchCoachPanel","benchMinProgress","benchStretchProgress","benchSparkline",
      "benchNextLoad","benchRecentSessions","benchLatestSet"]){
    assert.equal(html.split('id="'+id+'"').length-1,1,id);
  }
  assert.match(html,/function renderBenchCoach\(\)/);
  assert.match(html,/renderBenchCoach\(\);/);
  const fn=html.slice(html.indexOf("  function renderBenchCoach(){"),html.indexOf("  function renderStrengthDashboard(){"));
  assert.doesNotMatch(fn,/\.update\(|\.insert\(|\.delete\(|\.upsert\(/);
});
