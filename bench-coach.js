/* FORMA — Bench 110 kg / conservative strength progression. Pure, offline-compatible. */
(function(root){
  "use strict";
  const BENCH_ID="ebb36dac-3980-411c-92ce-fa87c6802528";
  const GOAL_WEIGHT=110,MIN_REPS=3,STRETCH_REPS=5;
  const tidy=s=>String(s||"").trim().replace(/\s+/g," ").toLocaleLowerCase("pl-PL");
  function isFlatBenchName(name){
    const s=tidy(name);
    if(/skos|hantl|smith|w[eęż]sz|close.?grip|pauz|pin.press|board.press|maszyn/.test(s))return false;
    return /^(wyciskanie sztangi leżąc|wyciskanie sztangi płasko|bench press|barbell bench press)$/.test(s);
  }
  function epley(weight,reps){
    const w=Number(weight),r=Number(reps);
    if(!Number.isFinite(w)||w<=0||!Number.isInteger(r)||r<1||r>10)return null;
    // For one completed rep report the actual lifted load, not a 3.3% increase.
    return r===1?w:w*(1+r/30);
  }
  function validSet(s){
    // Bench 110×3–5: only heavy sets (1–6 reps) for a more comparable e1RM trend.
    return s && s.is_warmup!==true && Number(s.weight_kg)>0 &&
      Number.isInteger(Number(s.reps)) && Number(s.reps)>=1 && Number(s.reps)<=6 &&
      epley(s.weight_kg,s.reps)!==null;
  }
  function benchData(sessions,sets,exerciseId=BENCH_ID,upToDate=null){
    const idToDate=new Map((sessions||[]).map(s=>[String(s.id),String(s.session_date)]));
    const days=new Map();
    for(const s of (sets||[])){
      const date=idToDate.get(String(s.session_id));
      if(!date||(upToDate&&date>=upToDate) || String(s.exercise_id)!==String(exerciseId) ||
        !isFlatBenchName(s.exercise_name)||!validSet(s))continue;
      const point={date,weight:Number(s.weight_kg),reps:Number(s.reps),
        rir:s.rir===null||s.rir===undefined?null:Number(s.rir),
        e1rm:epley(s.weight_kg,s.reps),setNumber:Number(s.set_number||1)};
      if(!days.has(date))days.set(date,[]);
      days.get(date).push(point);
    }
    const trend=[...days.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,items])=>{
      const ranked=[...items].sort((a,b)=>b.e1rm-a.e1rm||b.weight-a.weight);
      return {date,best:ranked[0],sets:items.sort((a,b)=>a.setNumber-b.setNumber)};
    });
    const best=trend.map(d=>d.best).reduce((x,y)=>!x||y.e1rm>x.e1rm?y:x,null);
    const latest=trend.at(-1)||null;
    const prev=trend.length>1?trend.at(-2):null;
    const trendDelta=prev&&latest?latest.best.e1rm-prev.best.e1rm:null;
    return {trend,best,latest,previous:prev,trendDelta,
      targetMin:epley(GOAL_WEIGHT,MIN_REPS),targetStretch:epley(GOAL_WEIGHT,STRETCH_REPS),
      sessions:trend.length};
  }
  const roundTo=(n,step)=>Math.round(n/step)*step;
  function recommend(ex,history){
    // history: latest sessions first, each {session:{session_date},sets:[]}
    const step=Math.max(0.5,Math.min(10,Number(ex.progression_step_kg)||2.5));
    const min=Math.max(1,Number(ex.rep_min)||4),max=Math.max(min,Number(ex.rep_max)||6);
    const target=Math.max(1,Number(ex.target_sets)||1);
    const sorted=(history||[]).map(h=>({
      date:h.session?.session_date||"",
      sets:(h.sets||[]).filter(s=>s.is_warmup!==true&&
        Number(s.weight_kg)>0&&Number(s.reps)>0&&Number.isInteger(Number(s.reps)))
        .sort((a,b)=>Number(a.set_number)-Number(b.set_number))
    })).filter(x=>x.sets.length);
    if(!sorted.length)return {weight:ex.start_weight_kg==null?null:Number(ex.start_weight_kg),
      message:"Pierwsza sesja — ustal bezpieczny ciężar",detail:"Brak wcześniejszych serii roboczych tego wariantu.",kind:"insufficient"};
    const last=sorted[0],older=sorted[1];
    const top=Number(last.sets[0].weight_kg),all=last.sets.slice(0,target);
    const sameLoad=all.length>=target&&all.every(x=>Math.abs(Number(x.weight_kg)-top)<0.001);
    const highRep=sameLoad&&all.every(x=>Number(x.reps)>=max);
    const reliableRir=all.every(x=>x.rir!==null&&x.rir!==undefined&&
      Number.isFinite(Number(x.rir))&&Number(x.rir)>=1);
    const lowRir=all.some(x=>x.rir!==null&&Number(x.rir)<=0);
    const belowMin=all.length>=target && all.every(x=>Number(x.reps)<min);
    const oldAll=older?.sets.slice(0,target)||[];
    const oldBelowMin=oldAll.length>=target&&oldAll.every(x=>Number(x.reps)<min);
    let weight=top,message="Utrzymaj ciężar, pracuj nad powtórzeniami",kind="hold";
    let detail="Wskazówka na następny trening, nie automatyczne zwiększenie obciążenia.";
    if(highRep&&reliableRir&&!lowRir){
      weight=roundTo(top+step,step); message="Możliwy progres +"+step+" kg";kind="increase";
      detail="Wszystkie serie były na tym samym ciężarze, w górnym limicie i z RIR ≥1.";
    }else if(belowMin&&oldBelowMin&&older &&
      Math.abs(Number(oldAll[0].weight_kg)-top)<=step &&
      !lowRir){
      weight=roundTo(Math.max(step,top*0.95),step);
      message="Rozważ lżejszy tydzień i ocenę regeneracji";kind="review";
      detail="Dwa porównywalne słabsze treningi — sprawdź sen, stres i technikę. Nie zmieniaj planu automatycznie.";
    }else if(lowRir){
      message="Pozostaw ciężar; zachowaj RIR 1–2";kind="hold";
      detail="Nie dokładaj obciążenia po serii do upadku.";
    }else if(!sameLoad){
      // Last session was pyramidal/drop sets. A single top set is not proof of 4 equally heavy sets.
      const weights=all.map(x=>Number(x.weight_kg)).filter(x=>Number.isFinite(x)&&x>0);
      const low=weights.length?Math.min(...weights):top;
      weight=Number.isFinite(low)?roundTo(low,step):top;
      message="Wyrównaj serie robocze przed zwiększaniem";kind="hold";
      detail="Różne ciężary w ostatnim treningu; punkt wyjścia to około "+weight+" kg. Dopasuj według RIR, nie kopiuj ślepo.";
    }else if(!reliableRir){
      message="Utrzymaj ciężar i wpisuj RIR";kind="hold";
      detail="Brak pełnych danych RIR — bez automatycznego zwiększenia ciężaru.";
    }
    if(!Number.isFinite(weight)||weight<=0)weight=null;
    return {weight,message,detail,kind,previousDate:last.date,previousSets:last.sets};
  }
  root.FORMA_BENCH_COACH={BENCH_ID,GOAL_WEIGHT,MIN_REPS,STRETCH_REPS,isFlatBenchName,epley,benchData,recommend};
})(typeof window!=="undefined"?window:globalThis);
