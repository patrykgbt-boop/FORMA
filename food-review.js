(() => {
"use strict";
const root=document.getElementById("foodReviewPlanner");
const list=document.getElementById("foodReviewRows");
const summary=document.getElementById("foodReviewProgress");
const heading=document.getElementById("foodReviewDate");
const notice=document.getElementById("foodReviewMessage");
const enabled=document.getElementById("foodReviewEnabled");
const clock=document.getElementById("foodReviewTime");
const preview=document.getElementById("foodReviewTest");
if(!root||!list||!summary||!notice||!enabled||!clock||!preview)return;

const types=[["breakfast","Śniadanie","breakfast"],["lunch","Obiad","lunch"],["dinner","Kolacja","dinner"],["snack","Dodatki / przekąski","extras"]];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=v=>{const x=Number(String(v??"").replace(",","."));return Number.isFinite(x)?x:NaN;};
const ctx=()=>typeof window.FORMA_FOOD_REVIEW_CONTEXT==="function"?window.FORMA_FOOD_REVIEW_CONTEXT():null;
let settings={enabled:true,remind_time:"22:00"}, reviews=new Map(),editing=null,loadedDate="",loadedUser="",busy=false,loading=false;
let editTitle="";
function localDay(){
 const p={};
 new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit"})
   .formatToParts(new Date()).forEach(t=>{if(t.type!=="literal")p[t.type]=t.value;});
 return p.year+"-"+p.month+"-"+p.day;
}
function dayData(){
 const date=localDay(),monday=new Date(date+"T12:00:00Z");
 const day=monday.getUTCDay()||7;
 monday.setUTCDate(monday.getUTCDate()-day+1);
 const week=monday.toISOString().slice(0,10),c=ctx();
 return {
  date,menu:(c?.dietWeekPlan||[]).find(x=>x.week_start===week&&Number(x.day_of_week)===day)||null,
  recipes:(c?.dietRecipes||[]).filter(x=>x.week_start===week&&Number(x.day_of_week)===day),
 };
}
function recipe(source){return dayData().recipes.find(x=>x.meal_type===source)||null;}
function product(name){return (ctx()?.foodProducts||[]).find(x=>x.name.trim().toLocaleLowerCase("pl-PL")===String(name||"").trim().toLocaleLowerCase("pl-PL"))||null;}
function foodFor(meal){return (ctx()?.foodLogItems||[]).filter(x=>x.entry_date===localDay()&&x.meal_type===meal).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));}
function mealName(source){const d=dayData();return recipe(source)?.recipe_name||String(d.menu?.[source]||"").split(":")[0].trim();}
function parseRecipe(r){
 if(!r?.ingredients)throw Error("Brak składników w rozpisce. Wpisz ręcznie.");
 const servings=number(r.servings)||1;
 const arr=[];
 for(const line of r.ingredients.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
  const match=line.match(/^(.+?)\s+—\s+([\d,.]+)\s*(g|ml|szt\.?)$/i);
  if(!match)throw Error("Nie można odczytać gramatury: "+line);
  const p=product(match[1]);
  if(!p)throw Error("Brak składnika „"+match[1]+"” w bazie produktów.");
  const amount=number(match[2]);let grams=match[3].toLowerCase().startsWith("szt")?amount*number(p.serving_grams):amount;
  if(!Number.isFinite(grams)||grams<=0||servings<=0)throw Error("Sprawdź ilość produktu: "+p.name);
  arr.push({
   product_id:p.id,product_name:p.name,amount_g:Math.round(grams/servings*10)/10,
   kcal_per_100:Number(p.kcal_per_100),protein_per_100:Number(p.protein_per_100),
   carbs_per_100:Number(p.carbs_per_100),fat_per_100:Number(p.fat_per_100),
  });
 }
 if(!arr.length)throw Error("Przepis nie zawiera składników.");
 return arr;
}
function rowHTML(x={}){
 const fields=[["amount_g","g"],["kcal_per_100","kcal/100"],["protein_per_100","B/100"],
 ["carbs_per_100","W/100"],["fat_per_100","T/100"]];
 return '<div class="food-review-custom-row">'+
 '<label>Produkt<input class="food-review-product" list="foodReviewProductList" placeholder="np. Jogurt naturalny" value="'+esc(x.product_name||"")+'"></label>'+
 fields.map(pair=>'<label>'+pair[1]+'<input class="food-review-'+pair[0]+'" type="number" step="0.1" min="0" value="'+esc(x[pair[0]]??"")+'"></label>').join("")+
 '<button type="button" data-action="remove" class="food-review-remove" aria-label="Usuń produkt">×</button></div>';
}
function renderEditor(meal){
 const items=foodFor(meal);
 return '<div class="food-review-editor">'+
  '<p>Wpisz produkty, które faktycznie zjadłeś. Wybranie produktu z bazy automatycznie uzupełnia makro.</p>'+
  '<label class="food-review-dish">Nazwa dania<input class="food-review-title" maxlength="200" placeholder="np. Makaron z kurczakiem" value="'+esc(editTitle)+'"></label>'+
  '<div class="food-review-custom-rows">'+(items.length?items.map(rowHTML).join(""):rowHTML({}))+'</div>'+
  '<div class="food-review-edit-actions">'+
  '<button type="button" data-action="add" data-meal="'+meal+'">+ Produkt</button>'+
  '<button type="button" data-action="save-custom" data-meal="'+meal+'" class="food-review-primary">Zapisz mój posiłek</button>'+
  '<button type="button" data-action="cancel" data-meal="'+meal+'">Anuluj</button>'+
  '</div></div>';
}
function mealCard(meal,label,source){
 const name=mealName(source)||"Brak dania w planie",r=recipe(source),old=foodFor(meal),review=reviews.get(meal);
 const mode=review?.mode,tag=mode==="planned"?"✓ Zgodnie z planem":
 mode==="changed"?"✓ Wpisana zmiana":mode==="skipped"?"✓ Nie jadłem":
 old.length?"Wpisane — potwierdź":"Do uzupełnienia";
 const energy=old.reduce((a,x)=>a+Number(x.amount_g)*Number(x.kcal_per_100)/100,0);
 return '<section class="food-review-meal '+(mode?"food-review-done":"")+'">'+
 '<div class="food-review-head"><div><strong>'+label+'</strong><p>'+esc(name)+(old.length?' • '+Math.round(energy)+' kcal':'')+'</p></div><small>'+tag+'</small></div>'+
 '<div class="food-review-actions">'+
 (r?'<button data-action="planned" data-meal="'+meal+'" type="button">✓ Jak w planie</button>':"")+
 (old.length?'<button data-action="confirm" data-meal="'+meal+'" type="button">Potwierdź zapisane</button>':"")+
 '<button data-action="change" data-meal="'+meal+'" type="button">✎ Inny posiłek</button>'+
 (meal==="snack"?'<button data-action="skip" data-meal="'+meal+'" type="button">Nie jadłem</button>':"")+
 '</div>'+(editing===meal?renderEditor(meal):"")+'</section>';
}
function render(){
 const c=ctx();root.classList.toggle("hidden",!c?.userId);if(!c?.userId)return;
 const day=localDay();
 heading.textContent="Dzisiaj, "+new Date(day+"T12:00:00Z").toLocaleDateString("pl-PL",{timeZone:"UTC",day:"numeric",month:"long",weekday:"long"});
 summary.textContent=types.filter(t=>reviews.has(t[0])).length+" / 4 potwierdzone";
 enabled.checked=settings.enabled;clock.disabled=!settings.enabled;clock.value=String(settings.remind_time||"22:00").slice(0,5);
 list.innerHTML=types.map(t=>mealCard(...t)).join("")+
 '<datalist id="foodReviewProductList">'+(c.foodProducts||[]).map(x=>'<option value="'+esc(x.name)+'"></option>').join("")+'</datalist>';
 preview.disabled=busy||!window.FORMA_REST_PUSH?.isEnabled?.();
}
async function load(){
 const c=ctx();if(!c?.userId||loading){render();return;}
 loading=true;const date=localDay();
 try{
  const [pref,done]=await Promise.all([
   c.client.from("forma_food_review_settings").select("*").eq("user_id",c.userId).maybeSingle(),
   c.client.from("forma_food_meal_reviews").select("*").eq("user_id",c.userId).eq("entry_date",date),
  ]);
  if(pref.error)throw pref.error;if(done.error)throw done.error;
  if(ctx()?.userId!==c.userId)return;
  settings={enabled:true,remind_time:"22:00",...(pref.data||{})};
  reviews=new Map((done.data||[]).map(x=>[x.meal_type,x]));
  loadedDate=date;loadedUser=c.userId;render();
  notice.textContent=settings.enabled?"O "+String(settings.remind_time).slice(0,5)+
   " FORMA przypomni tylko o niepotwierdzonych posiłkach.":"Przypomnienie wyłączone, ale checklistę możesz wypełnić.";
 }catch(e){console.error(e);notice.textContent="Nie udało się pobrać checklisty posiłków.";}
 finally{loading=false;}
}
async function settingsSave(delta){
 const c=ctx();if(!c?.userId)return;
 const previous={...settings};settings={...settings,...delta};render();
 try{
  const {error}=await c.client.from("forma_food_review_settings").upsert({
   user_id:c.userId,enabled:settings.enabled,remind_time:String(settings.remind_time).slice(0,5),updated_at:new Date().toISOString(),
  },{onConflict:"user_id"});
  if(error)throw error;
  notice.textContent="Zapisano ustawienia przypomnienia.";
 }catch(e){settings=previous;render();notice.textContent="Nie udało się zmienić ustawień.";}
}
function isSame(a,b){
 return a.length===b.length&&a.every((x,i)=>x.product_name===b[i].product_name&&Math.abs(Number(x.amount_g)-Number(b[i].amount_g))<0.11);
}
async function save(meal,mode,title,items){
 const c=ctx();if(!c?.userId||busy)return;
 busy=true;notice.textContent="Zapisuję produkty i przeliczam dzienną kaloryczność…";
 try{
  const {data,error}=await c.client.rpc("forma_save_food_meal_review",{
   p_entry_date:localDay(),p_meal_type:meal,p_mode:mode,p_title:title,p_items:items,
  });
  if(error)throw error;
  reviews.set(meal,{meal_type:meal,mode,meal_title:title});
  editing=null;await c.refresh();
  render();
  notice.textContent="Zapisano! "+(data?.calories!=null?"Łącznie dziś "+data.calories+" kcal. ":"")+
   "Inne posiłki pozostały bez zmian.";
 }catch(e){console.error(e);notice.textContent="Nie zapisano: "+(e.message||"błąd serwera");}
 finally{busy=false;render();}
}
function getCustomRows(){
 const editor=list.querySelector(".food-review-editor");
 if(!editor)throw Error("Nie otwarto formularza.");
 editTitle=editor.querySelector(".food-review-title").value.trim();
 const input=[...editor.querySelectorAll(".food-review-custom-row")];
 const result=[];
 for(const el of input){
  const name=el.querySelector(".food-review-product").value.trim();
  if(!name)continue;
  const quantity=number(el.querySelector(".food-review-amount_g").value);
  if(!Number.isFinite(quantity)||quantity<=0||quantity>5000)throw Error("Podaj poprawną gramaturę: "+name);
  const nutrients={};
  for(const key of ["kcal_per_100","protein_per_100","carbs_per_100","fat_per_100"]){
   const raw=el.querySelector(".food-review-"+key).value;
   if(raw==="")throw Error("Wpisz wszystkie wartości odżywcze dla: "+name);
   nutrients[key]=number(raw);
   if(!Number.isFinite(nutrients[key])||nutrients[key]<0||nutrients[key]>1000)throw Error("Nieprawidłowe makro: "+name);
  }
  if(nutrients.kcal_per_100===0&&!product(name))throw Error("Nie wpisuj 0 kcal dla nieznanego produktu: "+name);
  result.push({product_id:product(name)?.id||null,product_name:name,amount_g:quantity,...nutrients});
 }
 if(!result.length)throw Error("Dodaj co najmniej jeden zjedzony produkt.");
 return result;
}
enabled.addEventListener("change",e=>settingsSave({enabled:e.target.checked}));
clock.addEventListener("change",e=>{if(/^\d\d:\d\d$/.test(e.target.value))settingsSave({remind_time:e.target.value});});
list.addEventListener("change",e=>{
 if(!e.target?.classList?.contains("food-review-product"))return;
 const p=product(e.target.value),r=e.target.closest(".food-review-custom-row");if(!r)return;
 for(const key of ["kcal_per_100","protein_per_100","carbs_per_100","fat_per_100"])
  r.querySelector(".food-review-"+key).value=p?.[key]??"";
 if(p&&!r.querySelector(".food-review-amount_g").value)
  r.querySelector(".food-review-amount_g").value=p.serving_grams||100;
});
list.addEventListener("click",async e=>{
 const btn=e.target?.closest("button[data-action]");if(!btn||busy)return;
 const action=btn.dataset.action,meal=btn.dataset.meal,source=meal==="snack"?"extras":meal;
 try{
  if(action==="planned"){
   const r=recipe(source),items=parseRecipe(r),previous=foodFor(meal);
   if(previous.length&&!isSame(items,previous)&&!window.confirm("Ten posiłek ma już inne produkty w dzienniku. Zastąpić je porcją z planu?"))return;
   await save(meal,"planned",r.recipe_name,items);
  }else if(action==="confirm"){
   const existing=foodFor(meal);
   if(!existing.length)throw Error("Nie znaleziono wpisanego posiłku.");
   await save(meal,"changed","Wcześniej wpisany posiłek",existing.map(x=>({
    product_id:x.product_id||null,product_name:x.product_name,amount_g:Number(x.amount_g),
    kcal_per_100:Number(x.kcal_per_100),protein_per_100:Number(x.protein_per_100),
    carbs_per_100:Number(x.carbs_per_100),fat_per_100:Number(x.fat_per_100),
   })));
  }else if(action==="skip"){
   if(meal!=="snack")return;
   if(foodFor(meal).length&&!window.confirm("Usunąć zapisane przekąski i zaznaczyć, że ich nie jadłeś?"))return;
   await save(meal,"skipped","Nie jadłem przekąsek",[]);
  }else if(action==="change"){
   editing=meal;editTitle=reviews.get(meal)?.meal_title||"";render();
  }else if(action==="cancel"){editing=null;render();}
  else if(action==="add"){
   const box=list.querySelector(".food-review-custom-rows");
   if(box)box.insertAdjacentHTML("beforeend",rowHTML());
  }else if(action==="remove"){
   const el=btn.closest(".food-review-custom-row");
   if(el?.parentElement?.children.length>1)el.remove();
  }else if(action==="save-custom"){
   const items=getCustomRows(),old=foodFor(meal);
   if(old.length&&!isSame(items,old)&&!window.confirm("Zastąpić dotychczasowe produkty w tym posiłku?"))return;
   await save(meal,"changed",editTitle||items.map(x=>x.product_name).slice(0,2).join(", "),items);
  }
 }catch(e){notice.textContent="Nie zapisano: "+(e.message||"błąd danych");}
});
preview.addEventListener("click",async()=>{
 preview.disabled=true;
 try{
  if(!window.FORMA_REST_PUSH?.testFoodReview)throw Error("Włącz Web Push w dzienniku treningowym.");
  await window.FORMA_REST_PUSH.testFoodReview();
  notice.textContent="Wysłano testowe powiadomienie o posiłkach.";
 }catch(e){notice.textContent="Test nie powiódł się: "+(e.message||"błąd");}
 finally{preview.disabled=!window.FORMA_REST_PUSH?.isEnabled?.();}
});
window.addEventListener("forma:data-loaded",()=>{if(!editing)load();else render();});
window.addEventListener("forma:auth",load);
window.addEventListener("forma:push-enabled",render);
window.addEventListener("pageshow",()=>{if(ctx()?.userId&&(loadedUser!==ctx().userId||loadedDate!==localDay()))load();else render();});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&loadedDate!==localDay())load();});
load();
})();