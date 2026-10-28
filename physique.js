
(function(){
"use strict";
const BUCKET="forma-physique-private";
const AREA={upper_chest:"Górna klatka",side_delts:"Barki boczne",rear_delts:"Barki tylne",back_width:"Szerokość pleców",back_thickness:"Grubość pleców",core:"Brzuch / stabilizacja",legs:"Nogi"};
const DEF={upper_chest:3,side_delts:3,rear_delts:3,back_width:3,back_thickness:2,core:1,legs:1};
const RE={upper_chest:/skos|incline/i,side_delts:/wznosy bokiem|unoszenie.*bok/i,rear_delts:/odwrotne rozpiętki|face.?pull/i,back_width:/ściąganie.*drąż|podciąganie|pulldown/i,back_thickness:/wiosłowanie|przyciąganie|row/i,core:/brzuch|plank|antyrotac/i,legs:/przysiad|martwy|wykrok|suwnica/i};
const SUG={upper_chest:"Priorytet na wyciskanie na skosie dodatnim (15–30°), kontrolę toru ruchu i progres powtórzeń.",side_delts:"Wznosy bokiem, szczególnie linka, kontrolowana ekscentryka.",rear_delts:"Odwrotne rozpiętki i stabilna praca łopatki.",back_width:"Ściąganie drążka lub podciąganie — kontrola łokci w kierunku bioder.",back_thickness:"Wiosłowanie z podparciem, pełen ruch i progres obciążenia.",core:"Antyrotacje, plank i stabilizacja; bez obietnic miejscowej redukcji.",legs:"Zachowaj dwa dni Lower i kontrolę techniki."};
const VIEW={front:"Przód",back:"Tył",side:"Bok"};
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const fmt=x=>x==null?"—":Number(x).toFixed(1).replace(".",",");
let api=null,measures=[],photos=[],goals=null,urls=new Map(),busy=false,ready=false;
function context(){api=window.FORMA_PHYSIQUE_CONTEXT?.()||null;return api?.userId?api:null}
function note(t){$("physiqueMessage").textContent=t}
function getPriority(){const p={};for(const k of Object.keys(AREA))p[k]=Number($("physiquePriority-"+k).value);return p}
function dates(kind){return [...new Set(photos.filter(x=>x.photo_kind===kind).map(x=>x.photo_date))].sort().reverse()}
function photo(kind,date,view){return photos.filter(p=>p.photo_kind===kind&&p.photo_date===date&&p.photo_view===view).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0]}
function fillMeasurement(date){
 const row=measures.find(x=>x.measured_on===date);
 for(const k of ["waist","chest","shoulders","arm","thigh"])$("physique-"+k).value=row?.[k+"_cm"]??"";
 $("physique-notes").value=row?.notes||"";
}
function measurementsUI(){
 $("physiqueMeasureList").innerHTML=measures.slice().sort((a,b)=>b.measured_on.localeCompare(a.measured_on)).slice(0,12).map(m=>
 '<div class="physique-measure-item"><strong>'+esc(m.measured_on)+'</strong><span>Pas '+fmt(m.waist_cm)+' · klatka '+fmt(m.chest_cm)+' · barki '+fmt(m.shoulders_cm)+' · ramię '+fmt(m.arm_cm)+' · udo '+fmt(m.thigh_cm)+' cm</span><button type="button" class="secondary" data-measure-date="'+esc(m.measured_on)+'">Edytuj</button></div>').join("")||
 '<p class="muted">Brak pomiarów. Wpisz je rano, w porównywalnych warunkach.</p>';
 $("physiqueMeasureList").querySelectorAll("[data-measure-date]").forEach(b=>b.addEventListener("click",()=>{$("physiqueMeasureDate").value=b.dataset.measureDate;fillMeasurement(b.dataset.measureDate)}));
}
function card(item,title){
 const src=item?urls.get(item.id):null;
 return '<div class="physique-photo-card"><strong>'+esc(title)+'</strong>'+
 (src?'<img src="'+esc(src)+'" alt="'+esc(title)+'" loading="lazy"><small>'+esc(item.photo_date)+'</small>':'<div class="physique-photo-empty">Brak zdjęcia</div>')+'</div>';
}
function comparison(){
 const list=dates("progress");
 for(const [id,preferred] of [["physiqueCompareA",list.at(-1)],["physiqueCompareB",list[0]]]){
  const node=$(id),keep=node.value;
  node.innerHTML=list.map(d=>'<option value="'+esc(d)+'">'+esc(d)+'</option>').join("");
  node.value=list.includes(keep)?keep:preferred||"";
 }
 const side=$("physiqueCompareView").value,ref=dates("reference").map(d=>photo("reference",d,side)).find(Boolean);
 $("physiqueCompareGrid").innerHTML=card(photo("progress",$("physiqueCompareA").value,side),"Wcześniej")+
  card(photo("progress",$("physiqueCompareB").value,side),"Teraz")+card(ref,"Cel");
 const ordered=measures.slice().sort((a,b)=>a.measured_on.localeCompare(b.measured_on)).filter(x=>x.waist_cm!=null);
 const delta=ordered.length>=2?Number(ordered.at(-1).waist_cm)-Number(ordered.at(-2).waist_cm):null;
 $("physiqueSummary").textContent="Pas: "+(ordered.length?fmt(ordered.at(-1).waist_cm)+" cm":"brak")+
  " · zmiana względem poprzedniego: "+(delta==null?"za mało pomiarów":(delta>0?"+":"")+fmt(delta)+" cm")+
  " · fotografie wykonuj co 4 tygodnie w podobnym świetle i pozycji.";
}
function gallery(){
 $("physiqueGallery").innerHTML=photos.slice().sort((a,b)=>b.photo_date.localeCompare(a.photo_date)).slice(0,45).map(p=>
 '<div class="physique-gallery-item">'+
 (urls.get(p.id)?'<img src="'+esc(urls.get(p.id))+'" alt="Zdjęcie sylwetki" loading="lazy">':'<div class="physique-photo-empty">Brak podglądu</div>')+
 '<div><strong>'+(p.photo_kind==="reference"?"Sylwetka docelowa":"Zdjęcie postępu")+' · '+esc(VIEW[p.photo_view])+'</strong><small>'+esc(p.photo_date)+'</small></div>'+
 '<button type="button" class="secondary" data-delete-photo="'+esc(p.id)+'">Usuń</button></div>').join("")||
 '<p class="muted">Dodaj zdjęcia przodu, tyłu lub boku. Są przechowywane prywatnie.</p>';
 $("physiqueGallery").querySelectorAll("[data-delete-photo]").forEach(b=>b.addEventListener("click",()=>deletePhoto(b.dataset.deletePhoto)));
}
function recommendations(){
 const p=getPriority();
 const sorted=Object.keys(AREA).filter(k=>p[k]>=2).sort((a,b)=>p[b]-p[a]).slice(0,5);
 $("physiqueRecommendations").innerHTML=sorted.map(k=>{
  const inPlan=(api?.exercisePlan||[]).filter(x=>x.active!==false&&RE[k].test(x.name)).map(x=>x.name).slice(0,3);
  return '<div class="physique-advice-row"><strong>'+esc(AREA[k])+'</strong><p>'+esc(SUG[k])+'</p><small>'+
    (inPlan.length?'Już w FORMA: '+esc([...new Set(inPlan)].join(", ")):"Nie znaleziono ćwiczenia w aktualnym planie — sprawdź przed dodaniem objętości.")+
   '</small></div>';
 }).join("");
 const s=api?.settings||{};
 const weights=(api?.entries||[]).filter(e=>e.date>="2026-10-26"&&e.weight!=null);
 $("physiqueRecommendations").insertAdjacentHTML("beforeend",
 '<div class="physique-advice-row"><strong>Dieta</strong><p>Obecny cel: '+esc(s.calories??"—")+' kcal · '+esc(s.protein??"—")+
 ' g białka. Masa do stycznia, redukcja od lutego zgodnie z naszym planem.</p><small>'+
 (weights.length<3?"Brak co najmniej 3 porównywalnych ważeń — nie koryguj kalorii.":"Uwzględnij średnie masy i kalorii z dwóch wiarygodnych tygodni, nie jedną fotografię.")+
 ' Obwód talii i zdjęcia pomagają oceniać trend, ale nie mierzą dokładnie poziomu tłuszczu.</small></div>');
}
function render(){
 if(!ready||!context())return;
 for(const k of Object.keys(AREA))$("physiquePriority-"+k).value=String(goals?.priorities?.[k]??DEF[k]);
 $("physiqueTargetNotes").value=goals?.target_notes||"";
 measurementsUI();gallery();comparison();recommendations();
}
async function load(){
 if(!ready||!context()||busy)return;
 busy=true;note("Pobieranie pomiarów i prywatnej galerii…");
 try{
  const [m,p,g]=await Promise.all([
   api.client.from("physique_measurements").select("*").eq("user_id",api.userId).order("measured_on",{ascending:true}),
   api.client.from("physique_photos").select("*").eq("user_id",api.userId).order("photo_date",{ascending:false}),
   api.client.from("physique_goals").select("*").eq("user_id",api.userId).maybeSingle()
  ]);
  for(const r of [m,p,g])if(r.error)throw r.error;
  measures=m.data||[];photos=p.data||[];goals=g.data||null;
  const urlsResult=await Promise.all(photos.slice(0,60).map(async x=>{
   const result=await api.client.storage.from(BUCKET).createSignedUrl(x.storage_path,600);
   return result.error?null:[x.id,result.data.signedUrl];
  }));
  urls=new Map(urlsResult.filter(Boolean));
  render();note("Dane sylwetki zsynchronizowane.");
 }catch(e){console.error(e);note("Błąd odczytu. Sprawdź połączenie i zalogowanie.");}
 finally{busy=false;}
}
async function saveMeasurements(event){
 event.preventDefault();if(!context())return;
 const payload={user_id:api.userId,measured_on:$("physiqueMeasureDate").value,
  notes:$("physique-notes").value.trim(),updated_at:new Date().toISOString()};
 for(const k of ["waist","chest","shoulders","arm","thigh"]){
  const val=$("physique-"+k).value.trim();payload[k+"_cm"]=val===""?null:Number(val);
 }
 if(!payload.measured_on||!["waist","chest","shoulders","arm","thigh"].some(k=>payload[k+"_cm"]!=null)){note("Podaj datę i minimum jeden obwód.");return;}
 const r=await api.client.from("physique_measurements").upsert(payload,{onConflict:"user_id,measured_on"}).select("*").single();
 if(r.error){note("Nie udało się zapisać pomiaru: "+r.error.message);return;}
 measures=measures.filter(m=>m.measured_on!==payload.measured_on).concat(r.data);
 measurementsUI();comparison();note("Pomiary zapisane.");
}
async function saveGoals(event){
 event.preventDefault();if(!context())return;
 const r=await api.client.from("physique_goals").upsert({user_id:api.userId,priorities:getPriority(),
  target_notes:$("physiqueTargetNotes").value.trim(),updated_at:new Date().toISOString()},{onConflict:"user_id"}).select("*").single();
 if(r.error){note("Nie udało się zapisać celów: "+r.error.message);return;}
 goals=r.data;recommendations();note("Priorytety zapisane. Nie zmieniono treningu ani kalorii.");
}
function compress(file){
 return new Promise((resolve,reject)=>{
  if(!file||!/^image\//.test(file.type)||file.size>16*1024*1024){reject(new Error("Wybierz zdjęcie do 16 MB."));return;}
  const u=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   URL.revokeObjectURL(u);
   const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
   const can=document.createElement("canvas");can.width=Math.round(img.naturalWidth*scale);can.height=Math.round(img.naturalHeight*scale);
   if(!can.width||!can.height){reject(new Error("Pusty obraz."));return;}
   can.getContext("2d").drawImage(img,0,0,can.width,can.height);
   can.toBlob(blob=>blob&&blob.size<=5*1024*1024?resolve(blob):reject(new Error("Nie udało się zmniejszyć zdjęcia.")),"image/jpeg",0.84);
  };
  img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error("Nie można odczytać zdjęcia. Wybierz JPEG."))};
  img.src=u;
 });
}
async function uploadPhoto(event){
 event.preventDefault();if(!context()||busy)return;
 const file=$("physiquePhotoFile").files[0],date=$("physiquePhotoDate").value;
 const kind=$("physiquePhotoKind").value,view=$("physiquePhotoView").value;
 if(!file||!date||!["progress","reference"].includes(kind)||!VIEW[view]){note("Uzupełnij datę, rodzaj, widok i zdjęcie.");return;}
 busy=true;note("Przygotowywanie zdjęcia bez metadanych EXIF…");
 try{
  const blob=await compress(file),path=api.userId+"/"+crypto.randomUUID()+".jpg";
  const u=await api.client.storage.from(BUCKET).upload(path,blob,{contentType:"image/jpeg",upsert:false});
  if(u.error)throw u.error;
  const r=await api.client.from("physique_photos").insert({user_id:api.userId,photo_date:date,photo_kind:kind,photo_view:view,storage_path:path}).select("*").single();
  if(r.error){await api.client.storage.from(BUCKET).remove([path]);throw r.error;}
  photos.push(r.data);
  const signed=await api.client.storage.from(BUCKET).createSignedUrl(path,600);
  if(!signed.error)urls.set(r.data.id,signed.data.signedUrl);
  $("physiquePhotoFile").value="";gallery();comparison();note("Zdjęcie zapisane prywatnie.");
 }catch(err){console.error(err);note("Błąd przesyłania: "+err.message)}
 finally{busy=false;}
}
async function deletePhoto(id){
 if(!context()||busy)return;
 const p=photos.find(x=>x.id===id);
 if(!p||!confirm("Usunąć to zdjęcie z galerii?"))return;
 busy=true;
 try{
  const a=await api.client.storage.from(BUCKET).remove([p.storage_path]);
  if(a.error)throw a.error;
  const r=await api.client.from("physique_photos").delete().eq("id",id).eq("user_id",api.userId);
  if(r.error)throw r.error;
  photos=photos.filter(x=>x.id!==id);urls.delete(id);gallery();comparison();note("Zdjęcie usunięto.");
 }catch(e){console.error(e);note("Błąd usuwania zdjęcia.");}
 finally{busy=false;}
}
function init(){
 if(ready||!$("view-physique"))return;ready=true;
 $("physiqueMeasureDate").value=today();$("physiquePhotoDate").value=today();
 for(const [key,label] of Object.entries(AREA)){
  const wrap=document.createElement("label");
  wrap.textContent=label;
  const sel=document.createElement("select");sel.id="physiquePriority-"+key;
  for(const [val,caption] of [[1,"Utrzymanie"],[2,"Rozwój"],[3,"Priorytet"]]){
   const opt=document.createElement("option");opt.value=String(val);opt.textContent=caption;sel.appendChild(opt);
  }
  sel.value=String(DEF[key]);wrap.appendChild(sel);$("physiquePriorities").appendChild(wrap);
  sel.addEventListener("change",recommendations);
 }
 $("physiqueMeasureDate").addEventListener("change",e=>fillMeasurement(e.target.value));
 $("physiqueMeasureForm").addEventListener("submit",saveMeasurements);
 $("physiqueGoalsForm").addEventListener("submit",saveGoals);
 $("physiquePhotoForm").addEventListener("submit",uploadPhoto);
 for(const id of ["physiqueCompareA","physiqueCompareB","physiqueCompareView"])
  $(id).addEventListener("change",comparison);
 document.querySelector('[data-view="physique"]')?.addEventListener("click",load);
 window.addEventListener("forma:data-loaded",load);
 window.addEventListener("forma:auth",()=>{if(!context()){measures=[];photos=[];urls.clear();goals=null;note("Zaloguj się, aby korzystać z galerii.");}});
 if(context())load();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
