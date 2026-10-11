(() => {
  "use strict";

  const root = document.getElementById("mealPrepPlanner");
  const list = document.getElementById("mealPrepTasks");
  const title = document.getElementById("mealPrepDate");
  const progress = document.getElementById("mealPrepProgress");
  const status = document.getElementById("mealPrepStatus");
  const enabled = document.getElementById("mealPrepEnabled");
  const time = document.getElementById("mealPrepTime");
  const breakfastMode = document.getElementById("mealPrepBreakfastMode");
  const test = document.getElementById("mealPrepTest");
  if (!root || !list || !enabled || !time || !breakfastMode || !test) return;

  const esc = s => String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  const textTime = v => String(v||"18:00").slice(0,5);
  const settingsDefault = {enabled:true,remind_time:"18:00",breakfast_mode:"auto"};
  let settings={...settingsDefault}, checkins=new Set(), preparedDate="", currentUser="",loading=false,busy=false;
  const ctx=()=>typeof window.FORMA_MEAL_PREP_CONTEXT==="function" ? window.FORMA_MEAL_PREP_CONTEXT():null;

  function warsawDay() {
    const p={};
    new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit"})
      .formatToParts(new Date()).forEach(x=>{if(x.type!=="literal")p[x.type]=x.value;});
    return new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));
  }
  const iso=d=>d.toISOString().slice(0,10);
  function dateInfo() {
    const now=warsawDay(),tomorrow=new Date(now.getTime()+86400000);
    const yesterday=new Date(now.getTime()-86400000);
    const weekStart=date=>{
      const mon=new Date(date.getTime());mon.setUTCDate(mon.getUTCDate()-((mon.getUTCDay()+6)%7));
      return iso(mon);
    };
    return {today:iso(now),tomorrow:iso(tomorrow),
      tomorrowWeek:weekStart(tomorrow),tomorrowDow:tomorrow.getUTCDay()||7,
      yesterdayWeek:weekStart(now),yesterdayDow:now.getUTCDay()||7,
      display:tomorrow.toLocaleDateString("pl-PL",{timeZone:"UTC",weekday:"long",day:"numeric",month:"long"})};
  }
  const mealName=value=>String(value||"").split(":")[0].replace(/\s+/g," ").trim();
  function findData() {
    const c=ctx(),date=dateInfo();
    const menu=(c?.dietWeekPlan||[]).find(x=>x.week_start===date.tomorrowWeek&&
      Number(x.day_of_week)===date.tomorrowDow)||null;
    const previous=(c?.dietWeekPlan||[]).find(x=>x.week_start===date.yesterdayWeek&&
      Number(x.day_of_week)===date.yesterdayDow)||null;
    const recipes=(c?.dietRecipes||[]).filter(x=>x.week_start===date.tomorrowWeek&&
      Number(x.day_of_week)===date.tomorrowDow);
    const breakfast=recipes.find(x=>x.meal_type==="breakfast")||null;
    const lunch=recipes.find(x=>x.meal_type==="lunch")||null;
    return {date,menu,previous,breakfast,lunch};
  }
  function breakfastTask(name,recipe,mode) {
    if(!name)return {required:false,tip:"Śniadanie nie jest jeszcze zaplanowane."};
    const n=name.toLocaleLowerCase("pl-PL");
    if(mode==="never")return {required:false,tip:"Zrobisz rano; nie wymaga przypomnienia wieczorem."};
    if(mode==="always")return {required:true,tip:"Przygotuj wieczorem to, co można bezpiecznie przechować. Świeże składniki dodaj rano."};
    if(/owsian|pudding|chia|ryżank/.test(n))return {required:true,tip:"Przygotuj bazę owsianki wieczorem i schowaj do lodówki. Banana lub inne świeże owoce dodaj rano."};
    if(/gofr|plack|naleśnik/.test(n))return {required:true,tip:"Upiecz wieczorem, ostudź i schowaj do lodówki; rano podgrzej i dodaj świeże dodatki."};
    if(/kanap/.test(n)&&/jaj/.test(n))return {required:true,tip:"Ugotuj jajka i przygotuj dodatki wieczorem; kanapki z pomidorem złóż rano, aby pieczywo nie rozmokło."};
    if(/kanap|jajecznic|omlet|skyr|jogurt|granola|shake|smoothie|koktajl/.test(n))
      return {required:false,tip:"Szybkie śniadanie — przygotuj świeże rano; wieczorem nic nie trzeba gotować."};
    if(recipe&&Number(recipe.prep_minutes)<=10)
      return {required:false,tip:"Krótki przepis — przygotuj rano, bez dodatkowego gotowania wieczorem."};
    return {required:true,tip:"Odmierz składniki wieczorem, zrób bezpieczne części przepisu i odstaw do lodówki."};
  }
  function lunchTask(name,recipe,previousName) {
    if(!name)return {required:false,tip:"Obiad nie jest jeszcze zaplanowany."};
    const note=String(recipe?.notes||"").toLocaleLowerCase("pl-PL");
    if(/na świeżo|świeżo w/.test(note))
      return {required:true,tip:"Dziś przygotuj i odmierz składniki. Danie wymagające świeżego przygotowania (np. rybę) ugotuj jutro."};
    if(previousName.toLocaleLowerCase("pl-PL")===name.toLocaleLowerCase("pl-PL"))
      return {required:true,tip:"Jeśli wczoraj ugotowałeś dwie porcje, dziś tylko zapakuj drugą. Jeśli zabrakło zapasu, ugotuj nową porcję."};
    if(Number(recipe?.servings)>1)
      return {required:true,tip:"Ugotuj "+Math.floor(Number(recipe.servings))+" porcje na kolejne dni. Szybko schłódź i przechowuj w lodówce; nadmiar ryżu na później zamroź."};
    return {required:true,tip:"Ugotuj dzisiaj obiad na jutro, schłódź i włóż do szczelnego pojemnika w lodówce."};
  }
  function taskHTML(kind,label,raw,recipe,info) {
    if(!raw&&!recipe)return '<div class="meal-prep-task meal-prep-empty"><div><strong>'+label+'</strong><p>Nie ma jeszcze przepisu w jadłospisie.</p></div></div>';
    const isDone=checkins.has(kind);
    const recipeText=recipe?.instructions||"";
    const recipeIngredients=recipe?.ingredients||"";
    const details=recipeText||recipeIngredients?
      '<details><summary>Składniki i instrukcja</summary>'+
       (recipeIngredients?'<p><strong>Składniki:</strong></p><pre>'+esc(recipeIngredients)+'</pre>':'')+
       (recipeText?'<p><strong>Przepis:</strong></p><pre>'+esc(recipeText)+'</pre>':'')+
       (recipe?.notes?'<p>'+esc(recipe.notes)+'</p>':'')+
      '</details>':"";
    return '<div class="meal-prep-task '+(isDone?'meal-prep-done':'')+'">'+
      '<div class="meal-prep-task-main"><div class="meal-prep-task-top"><strong>'+label+': '+esc(raw)+'</strong>'+
      '<small>'+(!info.required?'Rano na świeżo':isDone?'✓ Przygotowane':'Do przygotowania')+'</small></div>'+
      '<p>'+esc(info.tip)+'</p>'+details+'</div>'+
      (info.required?'<label class="meal-prep-checkbox"><input type="checkbox" class="meal-prep-completed" data-kind="'+kind+'" '+(isDone?'checked':'')+'> Gotowe</label>':'')+
      '</div>';
  }
  function render() {
    const c=ctx();root.classList.toggle("hidden",!c?.userId);
    if(!c?.userId){list.innerHTML="";return;}
    const data=findData();
    title.textContent="Na jutro: "+data.date.display;
    enabled.checked=settings.enabled;
    time.disabled=!settings.enabled;
    time.value=textTime(settings.remind_time);
    breakfastMode.value=settings.breakfast_mode;
    const bfName=mealName(data.breakfast?.recipe_name||data.menu?.breakfast);
    const lunchName=mealName(data.lunch?.recipe_name||data.menu?.lunch);
    const previousLunch=mealName(data.previous?.lunch);
    const bf=breakfastTask(bfName,data.breakfast,settings.breakfast_mode);
    const ln=lunchTask(lunchName,data.lunch,previousLunch);
    const tasks=[{type:"breakfast",on:bf.required&&!!bfName},{type:"lunch",on:ln.required&&!!lunchName}].filter(x=>x.on);
    const completed=tasks.filter(x=>checkins.has(x.type)).length;
    progress.textContent=data.menu?completed+" / "+tasks.length+" przygotowane":"Brak menu na jutro";
    list.innerHTML=taskHTML("breakfast","Śniadanie",bfName,data.breakfast,bf)+
      taskHTML("lunch","Obiad",lunchName,data.lunch,ln);
    if(!data.menu) {
      status.textContent="Nie ma jeszcze jadłospisu na jutro. Po zaplanowaniu menu pokażemy tu zadania; przypomnienie powie, że trzeba uzupełnić plan.";
    } else {
      status.textContent=settings.enabled ?
        "Powiadomienie o "+textTime(settings.remind_time)+" będzie zawierać tylko zadania, których jeszcze nie odhaczyłeś. Otrzymasz je także przy zablokowanym iPhonie, jeśli Web Push jest włączony.":
        "Przypomnienie wyłączone — lista i odhaczanie działają nadal.";
    }
    test.disabled=busy||!window.FORMA_REST_PUSH?.isEnabled?.();
  }
  async function load() {
    const c=ctx();
    if(!c?.userId||loading){render();return;}
    const date=dateInfo();
    loading=true;currentUser=c.userId;
    try {
      const [pref,checks]=await Promise.all([
        c.client.from("forma_meal_prep_settings").select("*").eq("user_id",c.userId).maybeSingle(),
        c.client.from("forma_meal_prep_checkins").select("*").eq("user_id",c.userId).eq("target_date",date.tomorrow),
      ]);
      if(pref.error)throw pref.error;
      if(checks.error)throw checks.error;
      if(ctx()?.userId!==c.userId)return;
      settings={...settingsDefault,...pref.data};
      checkins=new Set((checks.data||[]).map(x=>x.meal_type));
      preparedDate=date.tomorrow;
      render();
    }catch(err){
      console.error("Meal prep reminders load failed",err);
      status.textContent="Nie można pobrać listy przygotowań. Sprawdź połączenie z FORMĄ.";
    }finally{loading=false}
  }
  async function saveSettings(changes) {
    const c=ctx();if(!c?.userId||busy)return;
    const old={...settings};settings={...settings,...changes};render();
    try {
      const {error}=await c.client.from("forma_meal_prep_settings").upsert({
        user_id:c.userId,enabled:settings.enabled,remind_time:textTime(settings.remind_time),
        breakfast_mode:settings.breakfast_mode,updated_at:new Date().toISOString(),
      },{onConflict:"user_id"});
      if(error)throw error;
    }catch(err) {
      console.error("Meal prep settings save error",err);
      settings=old;render();status.textContent="Nie udało się zapisać zmiany.";
    }
  }
  async function setCompleted(kind,value) {
    const c=ctx();if(!c?.userId)return;
    const targetDate=dateInfo().tomorrow;
    const old=checkins.has(kind);if(value)checkins.add(kind);else checkins.delete(kind);render();
    try {
      if(value){
        const {error}=await c.client.from("forma_meal_prep_checkins").upsert({
          user_id:c.userId,target_date:targetDate,meal_type:kind,
        },{onConflict:"user_id,target_date,meal_type"});
        if(error)throw error;
      }else {
        const {error}=await c.client.from("forma_meal_prep_checkins")
          .delete().eq("user_id",c.userId).eq("target_date",targetDate).eq("meal_type",kind);
        if(error)throw error;
      }
    }catch(err){
      if(old)checkins.add(kind);else checkins.delete(kind);
      render();status.textContent="Nie udało się zapisać odhaczenia.";console.error(err);
    }
  }
  enabled.addEventListener("change",e=>saveSettings({enabled:e.target.checked}));
  time.addEventListener("change",e=>{
    if(/^\d{2}:\d{2}$/.test(e.target.value))saveSettings({remind_time:e.target.value});
  });
  breakfastMode.addEventListener("change",e=>saveSettings({breakfast_mode:e.target.value}));
  list.addEventListener("change",e=>{
    const el=e.target;
    if(el?.classList?.contains("meal-prep-completed") && ["breakfast","lunch"].includes(el.dataset.kind))
      setCompleted(el.dataset.kind,el.checked);
  });
  test.addEventListener("click",async()=>{
    busy=true;test.disabled=true;
    try {
      if(!window.FORMA_REST_PUSH?.testMealPrep)throw new Error("Włącz powiadomienia w tle w Dzienniku.");
      await window.FORMA_REST_PUSH.testMealPrep();
      status.textContent="Testowe powiadomienie wysłane. Zablokuj telefon i sprawdź, jak wygląda podgląd.";
    }catch(err){status.textContent="Test przypomnienia nie powiódł się: "+(err.message||"spróbuj ponownie");}
    finally{busy=false;test.disabled=!window.FORMA_REST_PUSH?.isEnabled?.();}
  });
  window.addEventListener("forma:data-loaded",load);
  window.addEventListener("forma:auth",load);
  window.addEventListener("forma:push-enabled",render);
  window.addEventListener("pageshow",()=>{
    if(ctx()?.userId&&(currentUser!==ctx().userId||preparedDate!==dateInfo().tomorrow))load();
    else render();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"&&ctx()?.userId && preparedDate!==dateInfo().tomorrow)load();
  });
  load();
})();