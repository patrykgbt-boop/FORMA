(() => {
  "use strict";

  const root=document.getElementById("supplementPlanner");
  const todayContainer=document.getElementById("supplementActive");
  const otherContainer=document.getElementById("supplementInactive");
  const headline=document.getElementById("supplementHeadline");
  const status=document.getElementById("supplementStatus");
  if(!root || !todayContainer || !otherContainer || !status) return;

  const safe=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const timeString=(t)=>String(t||"08:00").slice(0,5);
  const checkins=new Map();
  let reminders=[],loadedFor="",loading=false;

  function ctx(){
    return typeof window.FORMA_SUPPLEMENTS_CONTEXT==="function"?
      window.FORMA_SUPPLEMENTS_CONTEXT():null;
  }
  function localISO(){
    // FORMA reminders use Warsaw time, matching the server-side worker.
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit"})
      .formatToParts(new Date()).reduce((a,p)=>{if(p.type!=="literal")a[p.type]=p.value;return a;},{});
    return parts.year+"-"+parts.month+"-"+parts.day;
  }
  const safeReminderIds=new Set(["creatine","vitamin_d3","citrulline"]);
  function trainingToday(){
    const date=localISO(),c=ctx();
    return (c?.schedule||[]).find(e=>e.scheduled_date===date&&e.status!=="cancelled");
  }
  function nextWorkoutDate(){
    const date=localISO(),c=ctx();
    return (c?.schedule||[]).filter(x=>x.scheduled_date>=date&&x.status==="planned")
      .sort((a,b)=>(a.scheduled_date+" "+a.start_time).localeCompare(b.scheduled_date+" "+b.start_time))[0]||null;
  }
  function preWorkoutTime(schedule,lead){
    if(!schedule)return null;
    const iso=String(schedule.scheduled_date)+"T"+timeString(schedule.start_time)+":00Z";
    const date=new Date(Date.parse(iso)-Number(lead)*60000);
    if(!Number.isFinite(date.getTime()))return null;
    const output=date.toISOString().slice(0,16);
    return output.slice(0,10)+" o "+output.slice(11);
  }
  function activeToday(r){
    return r.enabled && (r.reminder_type==="daily" || !!trainingToday());
  }
  function rowHTML(r){
    const canUse=safeReminderIds.has(r.slug);
    const checked=checkins.has(r.id);
    const isToday=activeToday(r);
    const next=nextWorkoutDate();
    let schedule=r.reminder_type==="daily" ?
      "Codziennie o "+timeString(r.remind_time) :
      next ? "Przed treningiem "+preWorkoutTime(next,r.lead_minutes) :
        "Automatycznie przed zaplanowanym treningiem";
    const canCheck = r.enabled && isToday && canUse;
    const controls = canUse ?
      '<label class="supp-control"><input type="checkbox" class="supp-enabled" data-id="'+r.id+'" '+(r.enabled?'checked':'')+'> Włącz przypomnienie</label>' :
      '<span class="supp-hold">Wstrzymane — wymaga sprawdzenia składu</span>';
    const timeEdit=r.reminder_type==="daily"?
      '<label class="supp-time-field">Godzina <input type="time" class="supp-time" data-id="'+r.id+'" value="'+safe(timeString(r.remind_time))+'" '+(r.enabled?'':'disabled')+'></label>' :
      '<label class="supp-time-field">Minut przed treningiem <select class="supp-lead" data-id="'+r.id+'" '+(r.enabled?'':'disabled')+'>'+
      [30,45,60,75].map(v=>'<option value="'+v+'" '+(Number(r.lead_minutes)===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
    return '<div class="supp-row '+(!r.enabled?'supp-off':'')+'" data-id="'+r.id+'">'+
      '<div class="supp-main"><div class="supp-title">'+safe(r.title)+'</div><div class="supp-dose">'+safe(r.dose_text)+'</div>'+
      '<div class="supp-when">'+safe(schedule)+'</div>'+
      '<details class="supp-note"><summary>Wskazówki i uwagi</summary><p>'+safe(r.note)+'</p></details></div>'+
      '<div class="supp-controls"><label class="supp-check"><input type="checkbox" class="supp-taken" data-id="'+r.id+'" '+(checked?'checked':'')+' '+(!canCheck?'disabled':'')+'> '+
      (checked?'Przyjęte':'Oznacz jako przyjęte')+'</label>'+controls+(canUse?timeEdit:'')+'</div></div>';
  }
  function render(){
    const c=ctx();
    root.classList.toggle("hidden",!c?.userId);
    if(!c?.userId){headline.textContent="Suplementy";todayContainer.innerHTML="";otherContainer.innerHTML="";return;}
    const active=reminders.filter(r=>r.enabled).sort((a,b)=>a.sort_order-b.sort_order);
    const inactive=reminders.filter(r=>!r.enabled).sort((a,b)=>a.sort_order-b.sort_order);
    const due=active.filter(activeToday);
    const done=due.filter(r=>checkins.has(r.id)).length;
    headline.textContent=due.length?done+" / "+due.length+" zaplanowanych na dziś":"Brak zaplanowanych na dziś";
    todayContainer.innerHTML=active.map(rowHTML).join("")||'<div class="supp-empty">Brak włączonych suplementów.</div>';
    otherContainer.innerHTML=inactive.map(rowHTML).join("")||'<div class="supp-empty">Brak pozostałych suplementów.</div>';
    const pushEnabled=window.FORMA_REST_PUSH?.isEnabled?.()===true;
    status.textContent=pushEnabled?
      "Powiadomienia korzystają z tych samych zezwoleń iPhone’a co timer treningowy. Zmiana godziny zapisuje się w chmurze.":
      "Aby otrzymywać powiadomienia przy zablokowanym ekranie, włącz Web Push w Dziennik → Trening szczegółowy.";
  }
  async function load(){
    const c=ctx();
    if(!c?.userId||loading){render();return;}
    loading=true;
    loadedFor=c.userId;
    try{
      const today=localISO();
      const [r,l]=await Promise.all([
        c.client.from("forma_supplement_reminders").select("*").eq("user_id",c.userId).order("sort_order",{ascending:true}),
        c.client.from("forma_supplement_checkins").select("*").eq("user_id",c.userId).eq("local_date",today),
      ]);
      if(r.error)throw r.error;
      if(l.error)throw l.error;
      if(ctx()?.userId!==c.userId)return;
      reminders=r.data||[];
      checkins.clear();for(const x of l.data||[])checkins.set(x.reminder_id,x);
      render();
    }catch(error){
      console.error("FORMA supplement planner error:",error);
      status.textContent="Nie udało się pobrać planu suplementacji. Sprawdź połączenie.";
    }finally{loading=false}
  }
  async function updateReminder(rem,changes){
    const c=ctx();
    if(!c?.userId)return;
    const old={...rem};
    Object.assign(rem,changes);
    render();
    try{
      const {error}=await c.client.from("forma_supplement_reminders").update({...changes,updated_at:new Date().toISOString()})
        .eq("id",rem.id).eq("user_id",c.userId);
      if(error)throw error;
    }catch(err){Object.assign(rem,old);render();status.textContent="Błąd zapisu przypomnienia.";console.error(err);}
  }
  async function setTaken(rem,checked){
    const c=ctx();if(!c?.userId)return;
    const day=localISO();
    const old=checkins.get(rem.id);
    if(checked)checkins.set(rem.id,{reminder_id:rem.id});else checkins.delete(rem.id);
    render();
    try{
      if(checked){
        const {error}=await c.client.from("forma_supplement_checkins")
          .upsert({user_id:c.userId,reminder_id:rem.id,local_date:day},{onConflict:"user_id,reminder_id,local_date"});
        if(error)throw error;
      }else{
        const {error}=await c.client.from("forma_supplement_checkins")
          .delete().eq("user_id",c.userId).eq("reminder_id",rem.id).eq("local_date",day);
        if(error)throw error;
      }
    }catch(err){
      if(old)checkins.set(rem.id,old);else checkins.delete(rem.id);
      render();status.textContent="Nie zapisano przyjęcia suplementu.";console.error(err);
    }
  }
  root.addEventListener("change",event=>{
    const e=event.target;
    const id=e?.dataset?.id;
    if(!id)return;
    const r=reminders.find(x=>x.id===id);
    if(!r)return;
    if(e.classList.contains("supp-taken"))setTaken(r,e.checked);
    if(e.classList.contains("supp-enabled") && safeReminderIds.has(r.slug))updateReminder(r,{enabled:e.checked});
    if(e.classList.contains("supp-time") && safeReminderIds.has(r.slug) && /^\d\d:\d\d$/.test(e.value))updateReminder(r,{remind_time:e.value});
    if(e.classList.contains("supp-lead") && safeReminderIds.has(r.slug))updateReminder(r,{lead_minutes:Number(e.value)});
  });
  window.addEventListener("forma:data-loaded",load);
  window.addEventListener("forma:auth",load);
  window.addEventListener("pageshow",()=>{if(ctx()?.userId && loadedFor!==ctx()?.userId)load();else render();});
  window.addEventListener("forma:push-enabled",render);
  load();
})();
