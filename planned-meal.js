/* FORMA: bezpieczne przenoszenie przepisu do dziennika. Brak zewnętrznych bibliotek. */
(function(root){
  "use strict";
  const norm=s=>String(s||"").toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
  const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
  function parseIngredients(text){
    const out=[];
    for(const raw of String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){
      const m=raw.match(/^(.+?)\s+[—–-]\s*(\d+(?:[.,]\d+)?)\s*(g|ml|szt\.?|sztuk[ai]?)\s*$/i);
      if(!m){
        out.push({name:raw,amount:null,unit:null,parseError:true,raw});
        continue;
      }
      const unit=m[3].toLowerCase().startsWith("szt")?"szt":m[3].toLowerCase();
      out.push({name:m[1].trim(),amount:Number(m[2].replace(",",".")),unit,parseError:false,raw});
    }
    return out;
  }
  function buildItems(recipe,products){
    const servings=Number(recipe?.servings);
    const portions=Number.isFinite(servings)&&servings>0&&servings<=30?servings:null;
    const library=Array.isArray(products)?products:[];
    const rows=parseIngredients(recipe?.ingredients).map(part=>{
      const match=library.find(p=>norm(p.name)===norm(part.name))||null;
      let grams=null,warning="";
      if(part.parseError||!finite(part.amount)||part.amount<=0)warning="Nie udało się odczytać gramatury — wpisz ręcznie.";
      else if(!portions)warning="Brak liczby porcji przepisu — ustaw gramaturę ręcznie.";
      else if(part.unit==="g")grams=part.amount/portions;
      else if(part.unit==="ml"){
        grams=part.amount/portions;
        warning="Przyjęto orientacyjnie 1 ml ≈ 1 g — sprawdź masę produktu.";
      }else if(part.unit==="szt"&&match&&finite(match.serving_grams)&&Number(match.serving_grams)>0){
        grams=part.amount/portions*Number(match.serving_grams);
        warning="Masa jednej sztuki z Twojej biblioteki — potwierdź ją.";
      }else warning="Brak masy jednej sztuki — wpisz gramaturę.";
      if(!match)warning+=(warning?" ":"")+"Brak produktu w bibliotece — uzupełnij wartości na 100 g.";
      const nutrients=["kcal_per_100","protein_per_100","carbs_per_100","fat_per_100"];
      const known=!!match&&nutrients.every(k=>finite(match[k])&&Number(match[k])>=0);
      if(match&&!known)warning+=(warning?" ":"")+"Brak pełnych danych odżywczych.";
      return {product_name:part.name,product_id:match?.id||null,
        amount_g:grams,kcal_per_100:known?Number(match.kcal_per_100):null,
        protein_per_100:known?Number(match.protein_per_100):null,
        carbs_per_100:known?Number(match.carbs_per_100):null,
        fat_per_100:known?Number(match.fat_per_100):null,
        source_unit:part.unit,source_amount:part.amount,warning,
        needsReview:!!warning};
    });
    return {rows,canFastSave:rows.length>0&&rows.every(x=>!x.needsReview&&validateRows([x])===null)};
  }
  function scaleRows(rows,factor){
    const f=Number(factor);
    if(!Number.isFinite(f)||f<=0||f>5)throw Error("Nieprawidłowa wielkość porcji.");
    return rows.map(x=>({...x,amount_g:x.amount_g===null?null:Math.round(Number(x.amount_g)*f*10)/10}));
  }
  function validateRows(rows){
    if(!Array.isArray(rows)||rows.length<1||rows.length>40)return "Posiłek musi mieć od 1 do 40 produktów.";
    for(const x of rows){
      if(!String(x.product_name||"").trim())return "Uzupełnij nazwę produktu.";
      if(!finite(x.amount_g)||Number(x.amount_g)<=0||Number(x.amount_g)>5000)return "Uzupełnij gramaturę produktu (g).";
      for(const k of ["kcal_per_100","protein_per_100","carbs_per_100","fat_per_100"]){
        if(!finite(x[k])||Number(x[k])<0||Number(x[k])> (k==="kcal_per_100"?1000:100))
          return "Uzupełnij wiarygodne kcal/B/W/T na 100 g (bez zgadywania).";
      }
    }
    return null;
  }
  function totals(rows){
    return (rows||[]).reduce((a,x)=>{
      const f=Number(x.amount_g)/100;
      if(!Number.isFinite(f))return a;
      a.kcal+=f*Number(x.kcal_per_100||0);
      a.protein+=f*Number(x.protein_per_100||0);
      a.carbs+=f*Number(x.carbs_per_100||0);
      a.fat+=f*Number(x.fat_per_100||0);
      return a;
    },{kcal:0,protein:0,carbs:0,fat:0});
  }
  root.FORMA_MEAL_IMPORT={parseIngredients,buildItems,scaleRows,validateRows,totals};
})(typeof window!=="undefined"?window:globalThis);
