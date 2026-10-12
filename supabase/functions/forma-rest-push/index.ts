// FORMA — iOS PWA background rest reminders.
// The function uses explicit bearer-token validation because the cron worker
// authenticates with a separate high-entropy X-Forma-Worker secret.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const url = Deno.env.get("SUPABASE_URL");
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !secret) throw new Error("Supabase server configuration missing");

const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-forma-worker",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function output(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}
function equalSecret(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function configRow() {
  const { data, error } = await db.from("forma_push_config").select("vapid_keys,cron_token").eq("id", 1).single();
  if (error || !data) throw new Error("Push configuration unavailable");
  return data;
}
async function vapidPair() {
  let current = await configRow();
  if (!current.vapid_keys) {
    const newPair = await webpush.generateVapidKeys({ extractable: true });
    const exported = await webpush.exportVapidKeys(newPair);
    const { error } = await db.from("forma_push_config")
      .update({ vapid_keys: exported, updated_at: new Date().toISOString() })
      .eq("id", 1).is("vapid_keys", null);
    if (error) throw error;
    current = await configRow();
  }
  if (!current.vapid_keys) throw new Error("VAPID keys not initialized");
  return webpush.importVapidKeys(current.vapid_keys);
}
async function authenticatedUser(req: Request) {
  const bearer = req.headers.get("Authorization") || "";
  const token = bearer.startsWith("Bearer ") ? bearer.substring(7) : "";
  if (!token || token.length > 8192) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : (data.user || null);
}
function deviceIdFrom(body: Record<string, unknown>): string | null {
  const deviceId = body.deviceId;
  return typeof deviceId === "string" && uuidRE.test(deviceId) ? deviceId : null;
}
function validEndpoint(endpoint: string): boolean {
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.hash) return false;
    const host = parsed.hostname.toLowerCase();
    return host === "fcm.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".push.apple.com") ||
      host === "push.apple.com" ||
      host.endsWith(".notify.windows.com");
  } catch { return false; }
}
async function sendPush(subscription: { endpoint: string; p256dh: string; auth_secret: string }, payload: Record<string, unknown>) {
  const vapid = await vapidPair();
  const appServer = await webpush.ApplicationServer.new({
    contactInformation: "mailto:forma-push@users.noreply.github.com",
    vapidKeys: vapid,
  });
  const subscriber = appServer.subscribe({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth_secret },
  });
  await subscriber.pushTextMessage(JSON.stringify(payload), {
    urgency: webpush.Urgency.High,
    ttl: 90,
    topic: "forma-rest",
  });
}
async function processDue() {
  const { data: due, error } = await db.from("forma_push_jobs")
    .select("id,user_id,device_id,timer_id,due_at,label")
    .eq("state", "pending").lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true }).limit(30);
  if (error) throw error;
  let sent = 0, failed = 0;
  for (const job of due || []) {
    // A single worker claims each pending job. Repeated cron calls cannot send it twice.
    const now = new Date().toISOString();
    const { data: claimed, error: claimError } = await db.from("forma_push_jobs")
      .update({ state: "sending", claimed_at: now, updated_at: now })
      .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "pending")
      .select("id,user_id,device_id,timer_id,label").maybeSingle();
    if (claimError || !claimed) continue;
    try {
      const { data: sub, error: subError } = await db.from("forma_push_subscriptions")
        .select("id,endpoint,p256dh,auth_secret")
        .eq("user_id", job.user_id).eq("device_id", job.device_id).maybeSingle();
      if (subError || !sub) throw new Error("No active push subscription");
      const { data: active } = await db.from("forma_push_jobs")
        .select("timer_id,state").eq("id",job.id).maybeSingle();
      if (active?.state !== "sending" || active.timer_id !== job.timer_id) continue;
      try {
        await sendPush(sub, {
          type: "rest-finished",
          title: "FORMA • Przerwa zakończona",
          body: job.label.slice(0, 180),
          timerId: job.timer_id,
          url: "/",
        });
      } catch (cause) {
        const code = cause instanceof webpush.PushMessageError ? cause.response.status : null;
        if (code === 404 || code === 410) {
          await db.from("forma_push_subscriptions").delete().eq("id", sub.id);
        }
        throw cause;
      }
      await db.from("forma_push_jobs")
        .update({ state: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_text: null })
        .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "sending");
      sent++;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "push failed";
      console.error("FORMA rest push delivery failed:", message);
      await db.from("forma_push_jobs")
        .update({ state: "failed", error_text: message.substring(0, 250), updated_at: new Date().toISOString() })
        .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "sending");
      failed++;
    }
  }
  return { processed: (due || []).length, sent, failed };
}

// Supplement reminders are independent of the short rest-timer job queue.
// Workouts are read from FORMA's scheduled training dates so changes to the
// workout day/time automatically move the pre-workout reminder.
function warsawClock() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw", year: "numeric",month: "2-digit",day: "2-digit",
    hour: "2-digit",minute: "2-digit",second: "2-digit",hourCycle: "h23",
  });
  const p: Record<string,string> = {};
  for(const part of formatter.formatToParts(new Date())) {
    if(part.type !== "literal") p[part.type] = part.value;
  }
  return new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),
    Number(p.hour),Number(p.minute),Number(p.second)));
}
function supplementDeadline(rem: Record<string,any>, training: Record<string,any> | null,
 nowLocal: Date): {key:string,due:number,description:string} | null {
  let target: Date;
  if(rem.reminder_type === "daily") {
    const hhmm=String(rem.remind_time||"08:00").slice(0,5);
    target = new Date(nowLocal.toISOString().slice(0,10)+"T"+hhmm+":00Z");
  } else {
    if(!training || training.user_id!==rem.user_id || training.status!=="planned") return null;
    target = new Date(String(training.scheduled_date)+"T"+String(training.start_time).slice(0,5)+":00Z");
    target = new Date(target.getTime()-Number(rem.lead_minutes||45)*60000);
  }
  const diff=nowLocal.getTime()-target.getTime();
  if(!Number.isFinite(diff) || diff < 0 || diff > 90000) return null;
  return {
    key:target.toISOString().slice(0,16),
    due:target.getTime(),
    description:rem.reminder_type==="daily"?"Przyjmij: "+rem.title+" — "+rem.dose_text :
      "Przed treningiem: "+rem.title+" — "+rem.dose_text,
  };
}
async function processSupplementRemindersDue() {
  const nowLocal=warsawClock();
  const current=nowLocal.toISOString().slice(0,10);
  const dayBefore=new Date(nowLocal.getTime()-24*60*60*1000).toISOString().slice(0,10);
  const dayAfter=new Date(nowLocal.getTime()+24*60*60*1000).toISOString().slice(0,10);
  const {data:reminders,error:remError}=await db.from("forma_supplement_reminders")
    .select("id,user_id,slug,title,dose_text,note,reminder_type,remind_time,lead_minutes,enabled")
    .eq("enabled",true).limit(500);
  if(remError) throw remError;
  if(!reminders?.length) return {scheduled:0,delivered:0,failed:0};
  const {data:trainings,error:trainingError}=await db.from("training_schedule")
    .select("user_id,scheduled_date,start_time,status").gte("scheduled_date",dayBefore)
    .lte("scheduled_date",dayAfter).eq("status","planned").limit(500);
  if(trainingError) throw trainingError;
  const {data:completed,error:checkError}=await db.from("forma_supplement_checkins")
    .select("reminder_id,local_date").gte("local_date",dayBefore).lte("local_date",dayAfter).limit(1000);
  if(checkError) throw checkError;
  const checked=new Set((completed||[]).map(x=>x.reminder_id+"|"+x.local_date));
  const {data:subscriptions,error:subError}=await db.from("forma_push_subscriptions")
    .select("user_id,device_id,endpoint,p256dh,auth_secret").limit(500);
  if(subError) throw subError;
  const byDevice = new Map<string,{sub:Record<string,any>,tasks:Array<{rem:Record<string,any>,key:string,description:string}>}>();
  for(const rem of reminders){
    const possibilities=rem.reminder_type==="daily"?[null]:
      (trainings||[]).filter(t=>t.user_id===rem.user_id);
    for(const item of possibilities){
      const task=supplementDeadline(rem,item,nowLocal);
      if(!task || checked.has(rem.id+"|"+task.key.slice(0,10))) continue;
      for(const sub of subscriptions||[]){
        if(sub.user_id!==rem.user_id) continue;
        // Group supplements with the same minute into one notification.
        const grouping=sub.device_id+"|"+task.key;
        if(!byDevice.has(grouping))byDevice.set(grouping,{sub,tasks:[]});
        byDevice.get(grouping)!.tasks.push({rem,key:task.key,description:task.description});
      }
    }
  }
  let attempted=0,delivered=0,failed=0;
  for(const batch of byDevice.values()){
    const claimed: Array<{id:string,task:{rem:Record<string,any>,key:string,description:string}}>= [];
    for(const task of batch.tasks){
      const {data,error}=await db.from("forma_supplement_push_delivery")
        .upsert({
          reminder_id:task.rem.id,device_id:batch.sub.device_id,delivery_key:task.key,
          status:"sending",
        },{onConflict:"reminder_id,device_id,delivery_key",ignoreDuplicates:true})
        .select("id").maybeSingle();
      if(error){console.error("Failed to claim supplement reminder",error.message);continue;}
      if(data?.id) claimed.push({id:data.id,task});
    }
    if(!claimed.length) continue;
    attempted+=claimed.length;
    const groupBody=claimed.map(x=>x.task.rem.title+" — "+x.task.rem.dose_text).join("; ").slice(0,190);
    const type=claimed.some(x=>x.task.rem.reminder_type==="pre_workout")?"pre-workout":"daily";
    try{
      await sendPush(batch.sub,{
        type:"supplements",title:type==="daily"?"FORMA • Suplementy na dziś":"FORMA • Suplementacja przed treningiem",
        body:groupBody,url:"/",key:claimed.map(x=>x.task.key).join(","),
      });
      const ids=claimed.map(x=>x.id);
      const {error}=await db.from("forma_supplement_push_delivery")
        .update({status:"sent",completed_at:new Date().toISOString()}).in("id",ids);
      if(error)console.error("Failed to finalize supplement deliveries",error.message);
      delivered++;
    }catch(e){
      const message=e instanceof Error?e.message:"Push delivery failure";
      console.error("FORMA supplement push error",message);
      await db.from("forma_supplement_push_delivery")
        .update({status:"failed",completed_at:new Date().toISOString(),error_message:message.slice(0,180)})
        .in("id",claimed.map(x=>x.id));
      failed++;
    }
  }
  return {scheduled:attempted,delivered,failed};
}


// Evening meal-prep reminders are based on tomorrow's actual menu and recipes.
function localDayPlan(local: Date) {
  const tomorrow=new Date(local.getTime()+86400000);
  const yesterday=new Date(local.getTime()-86400000);
  const iso=(date:Date)=>date.toISOString().slice(0,10);
  const mon=(date:Date)=>{
    const d=new Date(date.getTime());
    d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
    return iso(d);
  };
  return {
    today:iso(local),tomorrow:iso(tomorrow),tomorrowMonday:mon(tomorrow),
    tomorrowDow:(tomorrow.getUTCDay()||7),
    previous:iso(local),previousMonday:mon(local),previousDow:local.getUTCDay()||7,
  };
}
function mealTitle(text:unknown):string {
  return String(text||"").split(":")[0].replace(/\s+/g," ").trim().slice(0,90);
}
function breakfastPrep(name:string,recipe:Record<string,any>|undefined,mode:string){
  if(!name)return {needs:false,label:"Śniadanie nie zaplanowane"};
  const x=name.toLocaleLowerCase("pl-PL");
  if(mode==="never")return {needs:false,label:"Zrób rano: "+name};
  if(mode==="always")return {needs:true,label:"Przygotuj na jutro: "+name};
  if(/owsian|pudding|chia|ryżank/.test(x))
    return {needs:true,label:"Przygotuj dziś bazę: "+name+" (owoce dodaj rano)"};
  if(/gofr|plack|naleśnik/.test(x))
    return {needs:true,label:"Upiecz dziś: "+name+"; jutro podgrzej"};
  if(/kanap/.test(x)&&/jaj/.test(x))
    return {needs:true,label:"Ugotuj dziś jajka do kanapek; pieczywo i warzywa złóż rano"};
  if(/kanap|jajecznic|omlet|jogurt|skyr|granola|shake|smoothie|koktajl/.test(x))
    return {needs:false,label:"Szybkie śniadanie rano: "+name};
  if(recipe && Number(recipe.prep_minutes)<=10)
    return {needs:false,label:"Szybkie śniadanie rano: "+name};
  return {needs:true,label:"Przygotuj dziś składniki śniadania: "+name};
}
function lunchPrep(name:string,recipe:Record<string,any>|undefined,previousName:string) {
  if(!name)return {needs:false,label:"Obiad nie zaplanowany"};
  const note=String(recipe?.notes||"").toLocaleLowerCase("pl-PL");
  if(/na świeżo|świeżo w/.test(note))
    return {needs:true,label:"Przygotuj dziś składniki: "+name+" (dokończ świeżo jutro)"};
  if(previousName&&previousName.toLocaleLowerCase("pl-PL")===name.toLocaleLowerCase("pl-PL"))
    return {needs:true,label:"Zapakuj drugą, wcześniej przygotowaną porcję: "+name+" (jeśli nie gotowa, ugotuj jedną)"};
  const servings=Math.floor(Number(recipe?.servings||1));
  if(servings>1)return {needs:true,label:"Ugotuj dziś "+servings+" porcje: "+name};
  return {needs:true,label:"Ugotuj dziś obiad: "+name};
}
async function mealPrepSources(todayLocal:Date){
  const date=localDayPlan(todayLocal);
  const [day,prev,recipes]=await Promise.all([
    db.from("diet_week_plan").select("user_id,breakfast,lunch,week_start,day_of_week")
      .eq("week_start",date.tomorrowMonday).eq("day_of_week",date.tomorrowDow).limit(500),
    db.from("diet_week_plan").select("user_id,lunch")
      .eq("week_start",date.previousMonday).eq("day_of_week",date.previousDow).limit(500),
    db.from("diet_recipes").select("user_id,meal_type,recipe_name,notes,prep_minutes,servings,ingredients,instructions")
      .eq("week_start",date.tomorrowMonday).eq("day_of_week",date.tomorrowDow)
      .in("meal_type",["breakfast","lunch"]).limit(1000),
  ]);
  if(day.error||prev.error||recipes.error)throw day.error||prev.error||recipes.error;
  const menus=new Map((day.data||[]).map(x=>[x.user_id,x]));
  const previous=new Map((prev.data||[]).map(x=>[x.user_id,mealTitle(x.lunch)]));
  const byUser=new Map<string,Record<string,any>>();
  for(const r of recipes.data||[]){
    const current=byUser.get(r.user_id)||{};
    current[r.meal_type]=r;
    byUser.set(r.user_id,current);
  }
  return {date,menus,previous,byUser};
}
function mealPrepDetails(userId:string,breakfastMode:string,
 data:Awaited<ReturnType<typeof mealPrepSources>>){
  const menu=data.menus.get(userId);
  const recipes=data.byUser.get(userId)||{};
  const breakfast=mealTitle(recipes.breakfast?.recipe_name||menu?.breakfast);
  const lunch=mealTitle(recipes.lunch?.recipe_name||menu?.lunch);
  const bf=breakfastPrep(breakfast,recipes.breakfast,breakfastMode);
  const ln=lunchPrep(lunch,recipes.lunch,data.previous.get(userId)||"");
  return {
    breakfast:bf,lunch:ln,date:data.date.tomorrow,hasMenu:!!menu,
  };
}
async function processMealPrepDue() {
  const nowLocal=warsawClock();
  const hhmm=nowLocal.toISOString().slice(11,16);
  const {data:settings,error:settingErr}=await db.from("forma_meal_prep_settings")
    .select("user_id,enabled,remind_time,breakfast_mode").eq("enabled",true).limit(500);
  if(settingErr)throw settingErr;
  const due=(settings||[]).filter(x=>String(x.remind_time).slice(0,5)===hhmm);
  if(!due.length)return {due:0,sent:0,failed:0};
  const source=await mealPrepSources(nowLocal);
  const {data:checks,error:checkErr}=await db.from("forma_meal_prep_checkins")
    .select("user_id,target_date,meal_type").eq("target_date",source.date.tomorrow).limit(1000);
  if(checkErr)throw checkErr;
  const checked=new Set((checks||[]).map(x=>x.user_id+"|"+x.meal_type));
  const {data:subs,error:subErr}=await db.from("forma_push_subscriptions")
    .select("user_id,device_id,endpoint,p256dh,auth_secret").limit(500);
  if(subErr)throw subErr;
  let sent=0,failed=0;
  for(const pref of due){
    const detail=mealPrepDetails(pref.user_id,pref.breakfast_mode,source);
    const todo=[];
    if(detail.breakfast.needs&&!checked.has(pref.user_id+"|breakfast"))todo.push("Śniadanie: "+detail.breakfast.label);
    if(detail.lunch.needs&&!checked.has(pref.user_id+"|lunch"))todo.push("Obiad: "+detail.lunch.label);
    if(!todo.length && detail.hasMenu) continue;
    const body=(todo.length?todo.join(" • "):
      "Brak jadłospisu na jutro — uzupełnij śniadanie i obiad w FORMIE.").slice(0,215);
    for(const sub of (subs||[]).filter(x=>x.user_id===pref.user_id)){
      const {data:claim,error:claimErr}=await db.from("forma_meal_prep_deliveries").upsert(
       {user_id:pref.user_id,device_id:sub.device_id,prep_date:source.date.today,status:"sending"},
       {onConflict:"user_id,device_id,prep_date",ignoreDuplicates:true}
      ).select("id").maybeSingle();
      if(claimErr){console.error("Meal prep claim failure",claimErr.message);continue;}
      if(!claim)continue;
      try{
        await sendPush(sub,{
          type:"meal-prep",title:"FORMA • Przygotowania na jutro",body,
          url:"/",targetDate:source.date.tomorrow,
        });
        await db.from("forma_meal_prep_deliveries").update({status:"sent",completed_at:new Date().toISOString()})
          .eq("id",claim.id);
        sent++;
      }catch(e){
        const message=e instanceof Error?e.message:"Push delivery failed";
        console.error("Meal prep push delivery failed",message);
        await db.from("forma_meal_prep_deliveries")
          .update({status:"failed",completed_at:new Date().toISOString(),error_message:message.slice(0,180)})
          .eq("id",claim.id);
        failed++;
      }
    }
  }
  return {due:due.length,sent,failed};
}


// 22:00 food check-in is sent only for meals not yet confirmed.
// Check-ins and logged ingredients are private to each authenticated FORMA user.
const foodReviewMeals:Record<string,string>={
  breakfast:"Śniadanie",lunch:"Obiad",dinner:"Kolacja",snack:"Dodatki",
};
async function foodReviewDueFor(userId:string,localDate:string){
  const {data, error}=await db.from("forma_food_meal_reviews")
    .select("meal_type").eq("user_id",userId).eq("entry_date",localDate);
  if(error)throw error;
  const done=new Set((data||[]).map(x=>x.meal_type));
  return Object.entries(foodReviewMeals).filter(([key])=>!done.has(key)).map(([,label])=>label);
}
async function processFoodReviewDue(){
  const nowLocal=warsawClock();
  const localDate=nowLocal.toISOString().slice(0,10);
  const nowClock=nowLocal.toISOString().slice(11,16);
  const {data:settings,error:settingsError}=await db.from("forma_food_review_settings")
    .select("user_id,remind_time,enabled").eq("enabled",true).limit(500);
  if(settingsError)throw settingsError;
  const due=(settings||[]).filter(row=>String(row.remind_time).slice(0,5)===nowClock);
  if(!due.length)return {due:0,sent:0,failed:0};
  const {data:subs,error:subsError}=await db.from("forma_push_subscriptions")
    .select("user_id,device_id,endpoint,p256dh,auth_secret").limit(500);
  if(subsError)throw subsError;
  let sent=0,failed=0;
  for(const pref of due){
    const remaining=await foodReviewDueFor(pref.user_id,localDate);
    if(!remaining.length)continue;
    const body="Do zatwierdzenia: "+remaining.join(", ")+". Zgodnie z planem? Zapisz składniki jednym dotknięciem lub wpisz zmianę.";
    for(const sub of (subs||[]).filter(x=>x.user_id===pref.user_id)){
      const {data:claim,error:claimError}=await db.from("forma_food_review_deliveries")
        .upsert({user_id:pref.user_id,device_id:sub.device_id,review_date:localDate,status:"sending"},
          {onConflict:"user_id,device_id,review_date",ignoreDuplicates:true})
        .select("id").maybeSingle();
      if(claimError){console.error("Food-review claim failed",claimError.message);continue;}
      if(!claim)continue;
      try{
        await sendPush(sub,{
          type:"food-review",title:"FORMA • Uzupełnij dzisiejsze posiłki",
          body:body.slice(0,220),url:"/",entryDate:localDate,
        });
        await db.from("forma_food_review_deliveries")
          .update({status:"sent",completed_at:new Date().toISOString()}).eq("id",claim.id);
        sent++;
      }catch(e){
        const message=e instanceof Error?e.message:"Push failed";
        console.error("Food review push failed",message);
        await db.from("forma_food_review_deliveries")
          .update({status:"failed",completed_at:new Date().toISOString(),error_message:message.slice(0,180)})
          .eq("id",claim.id);
        failed++;
      }
    }
  }
  return {due:due.length,sent,failed};
}

async function handleRequest(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return output({ error: "Method not allowed" }, 405);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid JSON");
  } catch { return output({ error: "Invalid JSON body" }, 400); }

  if (body.action === "bootstrap") {
    const internal = req.headers.get("X-Forma-Worker") || "";
    const config = await configRow();
    if (!equalSecret(internal, config.cron_token)) return output({ error: "Unauthorized" }, 401);
    const publicKey = await webpush.exportApplicationServerKey(await vapidPair());
    return output({ ready: true, publicKey });
  }

  if (body.action === "tick") {
    const internal = req.headers.get("X-Forma-Worker") || "";
    const config = await configRow();
    if (!equalSecret(internal, config.cron_token)) return output({ error: "Unauthorized" }, 401);
    const rest = await processDue();
    const supplements=await processSupplementRemindersDue();
    const mealPrep=await processMealPrepDue();
    const foodReview=await processFoodReviewDue();
    return output({rest,supplements,mealPrep,foodReview});
  }

  const user = await authenticatedUser(req);
  if (!user) return output({ error: "Please sign in to FORMA" }, 401);

  if (body.action === "config") {
    const publicKey = await webpush.exportApplicationServerKey(await vapidPair());
    return output({ publicKey });
  }

  // Manual test is user-initiated: no background reminder is dispatched unless
  // the recipient explicitly taps "Test" on their own subscribed device.
  if(body.action==="test-meal-prep"){
    const deviceId=deviceIdFrom(body);
    if(!deviceId)return output({error:"Invalid device ID"},400);
    const {data:sub}=await db.from("forma_push_subscriptions").select("endpoint,p256dh,auth_secret")
      .eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if(!sub)return output({error:"No Web Push subscription on this device"},409);
    const {data:settings}=await db.from("forma_meal_prep_settings")
      .select("breakfast_mode").eq("user_id",user.id).maybeSingle();
    const source=await mealPrepSources(warsawClock());
    const details=mealPrepDetails(user.id,settings?.breakfast_mode||"auto",source);
    const labels=[];
    if(details.breakfast.needs) labels.push("Śniadanie: "+details.breakfast.label);
    if(details.lunch.needs) labels.push("Obiad: "+details.lunch.label);
    await sendPush(sub,{
      type:"meal-prep-test",title:"FORMA • Test przygotowań na jutro",
      body:(labels.length?labels.join(" • "):"Sprawdź plan przygotowań jutra w FORMIE.").slice(0,215),
      url:"/",targetDate:details.date,
    });
    return output({sent:true,targetDate:details.date});
  }

  if(body.action==="test-food-review"){
    const deviceId=deviceIdFrom(body);
    if(!deviceId)return output({error:"Invalid device ID"},400);
    const {data:sub}=await db.from("forma_push_subscriptions").select("endpoint,p256dh,auth_secret")
      .eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if(!sub)return output({error:"Web Push not enabled on this device"},409);
    const date=warsawClock().toISOString().slice(0,10);
    const remaining=await foodReviewDueFor(user.id,date);
    await sendPush(sub,{type:"food-review-test",title:"FORMA • Test dziennika posiłków",
      body:remaining.length?"Do sprawdzenia: "+remaining.join(", "):"Wszystkie posiłki na dziś masz już potwierdzone.",
      url:"/",entryDate:date});
    return output({sent:true,remaining:remaining.length});
  }

  const deviceId = deviceIdFrom(body);
  if (!deviceId) return output({ error: "Invalid device ID" }, 400);

  if (body.action === "register") {
    const sub = body.subscription as Record<string, unknown> | undefined;
    const keys = sub?.keys as Record<string, unknown> | undefined;
    const endpoint = sub?.endpoint;
    if (typeof endpoint !== "string" || endpoint.length > 4096 || !validEndpoint(endpoint) ||
        typeof keys?.p256dh !== "string" || keys.p256dh.length > 512 || keys.p256dh.length < 10 ||
        typeof keys?.auth !== "string" || keys.auth.length > 512 || keys.auth.length < 8) {
      return output({ error: "Invalid Web Push subscription" }, 400);
    }
    const { error } = await db.from("forma_push_subscriptions").upsert({
      user_id: user.id, device_id: deviceId, endpoint, p256dh: keys.p256dh,
      auth_secret: keys.auth, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,device_id" });
    if (error) throw error;
    return output({ registered: true });
  }

  if (body.action === "unregister") {
    const { error } = await db.from("forma_push_subscriptions")
      .delete().eq("user_id", user.id).eq("device_id", deviceId);
    if (error) throw error;
    await db.from("forma_push_jobs").update({ state: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("device_id", deviceId).in("state", ["pending","sending"]);
    return output({ registered: false });
  }

  if (body.action === "test") {
    const { data: sub } = await db.from("forma_push_subscriptions")
      .select("id,endpoint,p256dh,auth_secret").eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if (!sub) return output({ error: "No push subscription on this device" }, 409);
    try {
      await sendPush(sub, {
        type: "rest-test",
        title: "FORMA • Test powiadomień",
        body: "Powiadomienia są aktywne. Zablokuj ekran i przetestuj je podczas treningu.",
        url: "/",
      });
      return output({ sent: true });
    } catch (e) {
      const status = e instanceof webpush.PushMessageError ? e.response.status : 502;
      if ([404,410].includes(status)) await db.from("forma_push_subscriptions").delete().eq("id",sub.id);
      console.error("FORMA test push failed", e instanceof Error ? e.message : String(e));
      return output({ error: "Test notification failed; please retry" }, 502);
    }
  }

  if (body.action === "schedule") {
    const timerId = body.timerId, dueAt = body.dueAt, label = body.label;
    if (typeof timerId !== "string" || !uuidRE.test(timerId) ||
        typeof dueAt !== "string" || !Number.isFinite(Date.parse(dueAt)) ||
        typeof label !== "string" || label.length < 1 || label.length > 200) {
      return output({ error: "Invalid timer data" }, 400);
    }
    const delay = Date.parse(dueAt) - Date.now();
    if (delay < -5000 || delay > 20 * 60 * 1000) return output({ error: "Timer deadline out of range" }, 400);
    const { data: sub } = await db.from("forma_push_subscriptions")
      .select("id").eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if (!sub) return output({ error: "Push notifications not enabled on this device" }, 409);
    const { error } = await db.from("forma_push_jobs").upsert({
      user_id:user.id,device_id:deviceId,timer_id:timerId,due_at:new Date(dueAt).toISOString(),
      label,state:"pending",claimed_at:null,sent_at:null,error_text:null,updated_at:new Date().toISOString()
    },{onConflict:"user_id,device_id"});
    if (error) throw error;
    return output({ scheduled:true,dueAt });
  }

  if (body.action === "cancel") {
    if (typeof body.timerId !== "string" || !uuidRE.test(body.timerId)) return output({ error: "Invalid timer ID" }, 400);
    const { error } = await db.from("forma_push_jobs")
      .update({ state:"cancelled",updated_at:new Date().toISOString() })
      .eq("user_id",user.id).eq("device_id",deviceId).eq("timer_id",body.timerId)
      .in("state",["pending","sending"]);
    if (error) throw error;
    return output({ cancelled:true });
  }

  return output({ error:"Unknown action" }, 400);
}
Deno.serve(async(req) => {
  try {
    return await handleRequest(req);
  } catch (e) {
    console.error("FORMA background reminders error", e instanceof Error ? e.message : String(e));
    return output({ error: "Temporary push service error" }, 503);
  }
});
