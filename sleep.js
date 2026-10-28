
(function(){
"use strict";
const root=document.getElementById("view-sleep");
if(!root)return;
root.innerHTML=[
'<div class="sleep-header"><div><p class="eyebrow">FORMA SLEEP</p><h2>Sen i regeneracja</h2><p>Osobny moduł FORMA. Analiza historii snu i samopoczucia, bez smartwatcha.</p></div><span class="pill">Synchronizacja Supabase</span></div>',
'<div class="sleep-cards"><article class="stat-card"><span class="stat-label">Średnio / 7 nocy</span><strong id="slAvg">—</strong><small>Ostatnie zapisane noce</small></article><article class="stat-card"><span class="stat-label">Jakość snu</span><strong id="slQuality">—</strong><small>Subiektywna ocena</small></article><article class="stat-card"><span class="stat-label">Nocy w historii</span><strong id="slCount">0</strong><small>Również starszy dziennik</small></article><article class="stat-card"><span class="stat-label">Ostatnia noc</span><strong id="slLatest">—</strong><small id="slLastDate">Brak wpisów</small></article></div>',
'<div class="sleep-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">DZIENNIK</p><h3>Zapisz noc</h3></div></div><form id="slForm" class="form-grid">',
'<label class="span-2">Data przebudzenia<input id="slDate" type="date" required></label>',
'<label>Położenie się spać<input id="slBed" type="time" value="23:00" required></label>',
'<label>Wstanie z łóżka<input id="slWake" type="time" value="07:00" required></label>',
'<label>Zasypianie [min]<input id="slLatency" type="number" value="15" min="0" max="600" required></label>',
'<label>Czuwanie w nocy [min]<input id="slAwake" type="number" value="0" min="0" max="600" required></label>',
'<label>Przebudzenia [liczba]<input id="slAwakenings" type="number" min="0" max="50" placeholder="Opcjonalne"></label>',
'<label>Jak się wyspałeś?<select id="slScore" required><option value="">Wybierz</option><option value="1">1 — bardzo słabo</option><option value="2">2 — słabo</option><option value="3">3 — przeciętnie</option><option value="4">4 — dobrze</option><option value="5">5 — bardzo dobrze</option></select></label>',
'<label class="span-2">Notatka (opcjonalnie)<textarea id="slNotes" rows="2" maxlength="1000" placeholder="Np. hałas, stres lub drzemka"></textarea></label>',
'<div class="sleep-estimate">Szacowany czas snu: <strong id="slEstimate">—</strong><small>Czas w łóżku pomniejszony o zasypianie i czuwanie; nie jest to automatyczny pomiar faz snu.</small></div>',
'<div class="span-2 form-actions"><button class="primary" type="submit" id="slSave">Zapisz noc</button><button class="secondary" type="button" id="slCancel" hidden>Anuluj</button><span class="message" id="slMessage" role="status"></span></div>',
'</form></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">HISTORIA</p><h3>Ostatnie 14 nocy</h3></div></div><div class="sleep-chart" id="slChart"></div><p class="muted sleep-explanation">Wykres przedstawia oszacowany czas snu. Dla większości dorosłych zalecane jest 7–9 godzin, ale liczy się także samopoczucie i regularność.</p><div class="callout"><strong>Monitor natywny iPhone</strong><p>Rejestrowanie chrapania podczas blokady ekranu wymaga osobnej aplikacji iOS. Wersja PWA nie uruchamia mikrofonu w tle. Wyniki z natywnego monitora będziemy mogli połączyć z tym modułem.</p></div></article></div>',
'<article class="panel sleep-history-panel"><div class="panel-head"><div><p class="eyebrow">WPISY</p><h3>Historia snu</h3></div><button type="button" class="secondary" id="slCsv">Eksport CSV</button></div><div class="sleep-list" id="slList"></div></article>'
].join("");
const $=id=>document.getElementById(id);
const ctx=()=>window.FORMA_SLEEP_CONTEXT?.()||null;
const p=n=>String(n).padStart(2,"0");
const today=()=>{const d=new Date();return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());};
const duration=n=>Number.isFinite(n)?Math.floor(Math.round(n)/60)+" h "+p(Math.round(n)%60)+" min":"—";
const dateText=s=>s?s.slice(8,10)+"."+s.slice(5,7)+"."+s.slice(0,4):"";
const time=d=>p(d.getHours())+":"+p(d.getMinutes());
const safe=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
let detailed=[],records=[],busy=false,authSeq=0,editing="";
function status(s,error=false){$("slMessage").textContent=s;$("slMessage").style.color=error?"#fca5a5":"#93a0b8";}
function parse(){
 const day=$("slDate").value,bed=$("slBed").value,wake=$("slWake").value;
 if(!day||!bed||!wake)throw Error("Podaj datę i godziny.");
 const a=day.split("-").map(Number),b=bed.split(":").map(Number),w=wake.split(":").map(Number);
 const bd=new Date(a[0],a[1]-1,a[2],b[0],b[1]),wd=new Date(a[0],a[1]-1,a[2],w[0],w[1]);
 if(b[0]*60+b[1]>=w[0]*60+w[1])bd.setDate(bd.getDate()-1);
 const inBed=Math.round((wd-bd)/60000),lat=Number($("slLatency").value),awake=Number($("slAwake").value),minutes=inBed-lat-awake,score=Number($("slScore").value);
 if(!Number.isFinite(minutes)||minutes<=0||inBed<30||inBed>960)throw Error("Sprawdź godziny, zasypianie i czuwanie (czas w łóżku 30 min – 16 h).");
 if(lat<0||lat>600||awake<0||awake>600)throw Error("Nieprawidłowy czas zasypiania lub czuwania.");
 if(!(score>=1&&score<=5))throw Error("Wybierz ocenę snu.");
 const count=$("slAwakenings").value;
 return {sleep_date:day,bed_at:bd.toISOString(),woke_at:wd.toISOString(),sleep_duration_min:minutes,latency_min:lat,awake_minutes:awake,awakenings:count===""?null:Number(count),quality:score,notes:$("slNotes").value.trim().slice(0,1000),source:"manual",updated_at:new Date().toISOString()};
}
function estimate(){
 try{const prior=$("slScore").value;$("slScore").value="3";const r=parse();$("slScore").value=prior;$("slEstimate").textContent=duration(r.sleep_duration_min);}
 catch(e){$("slEstimate").textContent="Uzupełnij godziny";}
}
function reset(){
 editing="";$("slDate").disabled=false;$("slDate").value=today();
 $("slBed").value="23:00";$("slWake").value="07:00";$("slLatency").value="15";$("slAwake").value="0";
 $("slAwakenings").value="";$("slScore").value="";$("slNotes").value="";
 $("slSave").textContent="Zapisz noc";$("slCancel").hidden=true;estimate();
}
function merged(){
 const a=detailed.map(r=>({date:r.sleep_date,mins:Number(r.sleep_duration_min),quality:r.quality,source:r.source,raw:r}));
 const dates=new Set(a.map(r=>r.date));
 (ctx()?.entries||[]).forEach(e=>{if(!dates.has(e.date)&&Number(e.sleep)>0&&Number(e.sleep)<=24)a.push({date:e.date,mins:Math.round(Number(e.sleep)*60),quality:null,source:"dziennik",raw:null});});
 return a.sort((x,y)=>y.date.localeCompare(x.date));
}
function render(){
 records=merged();
 const last=records.slice(0,7),q=last.filter(x=>x.quality!=null),avg=last.length?last.reduce((a,x)=>a+x.mins,0)/last.length:NaN;
 $("slAvg").textContent=duration(avg);$("slQuality").textContent=q.length?(q.reduce((a,x)=>a+Number(x.quality),0)/q.length).toFixed(1)+"/5":"—";
 $("slCount").textContent=String(records.length);$("slLatest").textContent=last.length?duration(last[0].mins):"—";$("slLastDate").textContent=last.length?dateText(last[0].date):"Brak wpisów";
 const graph=records.slice(0,14).reverse();
 $("slChart").innerHTML=graph.length?graph.map(x=>'<div class="sleep-chart-col"><div class="sleep-bar '+(x.mins<420?'short':'')+'" style="height:'+Math.max(2,Math.min(100,Math.round(x.mins/600*100)))+'%" title="'+safe(dateText(x.date)+" — "+duration(x.mins))+'"></div><small>'+safe(x.date.slice(8,10)+"."+x.date.slice(5,7))+'</small></div>').join(""):'<div class="sleep-empty">Dodaj pierwszą noc, aby zobaczyć wykres.</div>';
 $("slList").innerHTML=records.length?records.slice(0,60).map(x=>{
  const r=x.raw,origin=x.source==="dziennik"?"Wpis historyczny":x.source==="ios"?"Monitor iPhone":x.source==="apple_health"?"Apple Health":"Ręczny wpis";
  const desc=origin+(x.quality==null?"":" • jakość "+x.quality+"/5")+(r?" • "+time(new Date(r.bed_at))+"–"+time(new Date(r.woke_at)):" • szczegóły w Dzienniku");
  const actions=r?'<div class="sleep-night-actions"><button type="button" class="secondary" data-edit="'+safe(x.date)+'">Edytuj</button><button type="button" class="danger" data-delete="'+safe(x.date)+'">Usuń</button></div>':"";
  return '<div class="sleep-night"><div><strong>'+dateText(x.date)+' • '+duration(x.mins)+'</strong><small>'+safe(desc)+'</small>'+(r?.notes?'<small>'+safe(r.notes)+'</small>':"")+'</div>'+actions+'</div>';
 }).join(""):'<div class="sleep-empty">Brak zapisów snu.</div>';
}
async function reload(){
 const c=ctx();if(!c?.userId){detailed=[];records=[];render();return;}
 if(busy)return;
 const stamp=++authSeq;busy=true;
 try{const r=await c.client.from("sleep_nights").select("*").eq("user_id",c.userId).order("sleep_date",{ascending:false}).limit(120);
  if(r.error)throw r.error;
  if(stamp!==authSeq||ctx()?.userId!==c.userId)return;
  detailed=r.data||[];render();status("");
 }catch(err){console.error("FORMA Sleep:",err);status("Nie udało się pobrać danych snu.",true);}
 finally{busy=false;}
}
$("slForm").addEventListener("submit",async ev=>{
 ev.preventDefault();const c=ctx();if(!c?.userId){status("Zaloguj się do FORMA.",true);return;}
 let row;try{row=parse();}catch(err){status(err.message,true);return;}
 $("slSave").disabled=true;status("Zapisywanie…");
 try{
  const saved=await c.client.from("sleep_nights").upsert({...row,user_id:c.userId},{onConflict:"user_id,sleep_date"});
  if(saved.error)throw saved.error;
  const diary=await c.client.from("daily_entries").upsert({user_id:c.userId,entry_date:row.sleep_date,sleep_hours:Number((row.sleep_duration_min/60).toFixed(2)),updated_at:new Date().toISOString()},{onConflict:"user_id,entry_date"});
  reset();await reload();
  if(diary.error)status("Noc zapisana. Pole snu w Dzienniku nie zostało zaktualizowane.",true);
  else {await c.refresh();status("Zapisano noc i zaktualizowano Dziennik FORMA.");}
 }catch(err){console.error("FORMA Sleep save:",err);status("Błąd zapisu: "+(err.message||"spróbuj ponownie"),true);}
 finally{$("slSave").disabled=false;}
});
$("slList").addEventListener("click",async ev=>{
 const edit=ev.target.closest("[data-edit]"),del=ev.target.closest("[data-delete]");
 if(edit){
  const r=detailed.find(x=>x.sleep_date===edit.dataset.edit);
  if(!r)return;
  if(r.source!=="manual"){status("Pomiary z urządzenia nie są edytowane jako wpis ręczny.");return;}
  editing=r.sleep_date;$("slDate").value=r.sleep_date;$("slDate").disabled=true;
  $("slBed").value=time(new Date(r.bed_at));$("slWake").value=time(new Date(r.woke_at));
  $("slLatency").value=r.latency_min;$("slAwake").value=r.awake_minutes;
  $("slAwakenings").value=r.awakenings??"";$("slScore").value=r.quality??"";$("slNotes").value=r.notes||"";
  $("slSave").textContent="Zaktualizuj noc";$("slCancel").hidden=false;
  status("Edycja nocy "+dateText(r.sleep_date));estimate();$("slForm").scrollIntoView({behavior:"smooth",block:"start"});
 }
 if(del){
  const c=ctx(),r=detailed.find(x=>x.sleep_date===del.dataset.delete);if(!r||!c?.userId)return;
  if(!confirm("Usunąć noc "+dateText(r.sleep_date)+"?"))return;
  status("Usuwanie…");
  const result=await c.client.from("sleep_nights").delete().eq("id",r.id).eq("user_id",c.userId);
  if(result.error){status("Błąd usuwania: "+result.error.message,true);return;}
  const hours=Number((Number(r.sleep_duration_min)/60).toFixed(2));
  const d=await c.client.from("daily_entries").update({sleep_hours:null,updated_at:new Date().toISOString()}).eq("user_id",c.userId).eq("entry_date",r.sleep_date).eq("sleep_hours",hours);
  if(editing===r.sleep_date)reset();
  await c.refresh();await reload();
  status(d.error?"Usunięto noc, ale nie zaktualizowano Dziennika.":"Noc usunięta.",!!d.error);
 }
});
$("slCancel").addEventListener("click",()=>{reset();status("");});
["slDate","slBed","slWake","slLatency","slAwake"].forEach(id=>$(id).addEventListener("input",estimate));
$("slCsv").addEventListener("click",()=>{
 const rows=[["data","minuty","jakosc_1_5","zrodlo","notatka"],...records.map(x=>[x.date,x.mins,x.quality??"",x.source,x.raw?.notes||""])];
 const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="forma-sleep.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.FORMA_SLEEP_EXPORT=()=>detailed.map(x=>({...x}));
document.querySelector('.nav-btn[data-view="sleep"]')?.addEventListener("click",reload);
window.addEventListener("forma:data-loaded",()=>{if(root.classList.contains("active"))reload();});
window.addEventListener("forma:auth",()=>{if(!ctx()?.userId){++authSeq;detailed=[];render();}else if(root.classList.contains("active"))reload();});
reset();render();
})();
