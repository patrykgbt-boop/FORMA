/* FORMA — exercise technique guide library.
   Generated posters are illustrative. Always show variant notes when equipment differs. */
(() => {
  "use strict";
  const posters = [
    {name:"Wyciskanie na maszynie Chest Press",slug:"chest-press",note:"Oddzielny wariant ćwiczenia, nie to samo co wyciskanie hantli na skosie."},
    {name:"Wiosłowanie siedząc na wyciągu",slug:"seated-row",note:"Wariant na wyciągu; maszyna z podparciem może mieć inny tor uchwytów."},
    {name:"Wyciskanie nad głowę na maszynie",slug:"shoulder-press",note:"Wariant na maszynie — różni się od wyciskania żołnierskiego na Smithie."},
    {name:"Face Pull na linie",slug:"face-pull",note:"Ćwiczenie pokrewne dla tyłu barków, ale nie jest zamienną ilustracją odwrotnych rozpiętek."},
    {name:"Prostowanie ramion na wyciągu",slug:"triceps-pushdown",note:"Pasuje do prostowania ramion na wyciągu w Upper B."},
    {name:"Uginanie młotkowe na linie",slug:"rope-hammer-curl",note:"Wariant na linie wyciągu — w aktualnym Upper B masz uginanie z hantlami."},
    {name:"Upper A — plansza 1",slug:"upper-a-1",note:"Wyciskanie, ściąganie drążka, Smith i maszyna Upper-Back."},
    {name:"Upper A — plansza 2",slug:"upper-a-2",note:"Krzyżowanie linek, biceps, wznosy bokiem i nadgarstki."},
    {name:"Lower A — plansza 1",slug:"lower-a-1",note:"Przysiad, hip thrust i leg press."},
    {name:"Lower A — plansza 2",slug:"lower-a-2",note:"Uginanie nóg, łydki i brzuch."},
    {name:"Upper B — plansza 1",slug:"upper-b-1",note:"Wyciskanie, podciąganie, wiosłowanie i dipy."},
    {name:"Upper B — plansza 2",slug:"upper-b-2",note:"Barki, modlitewnik, triceps, biceps i przedramiona."},
    {name:"Lower B — plansza 1",slug:"lower-b-1",note:"Martwy ciąg i dwa warianty przysiadu."},
    {name:"Lower B — plansza 2",slug:"lower-b-2",note:"Bułgarskie, tył uda, łydki i core."},
  ];

  const byName = {
    "Wyciskanie żołnierskie / Smith": {
      muscles:"Barki, triceps, mięśnie stabilizujące",
      equipment:"Maszyna Smitha / wyciskanie stojąc lub siedząc",
      steps:["Ustaw gryf i ograniczniki bezpieczeństwa. Przyjmij stabilną pozycję; dłonie nieco szerzej od barków.","Napnij brzuch i pośladki, trzymaj żebra nad miednicą. Ustaw nadgarstki w jednej linii z przedramionami.","Wyciskaj gryf nad głowę po torze dostosowanym do maszyny, bez przeprostu odcinka lędźwiowego.","Opuszczaj powoli do bezpiecznej pozycji wyjściowej. Zachowaj napięcie tułowia."],
      tips:["Nie wyginaj nadmiernie pleców.","Dobierz uchwyt i tor do swojej mobilności barków.","Ustaw asekurację/ograniczniki na Smithie."],
    },
    "Podciąganie": {
      muscles:"Najszerszy grzbietu, środkowe plecy, biceps",
      equipment:"Drążek / maszyna z odciążeniem",
      steps:["Chwyć stabilnie drążek i napnij mięśnie brzucha.","Zainicjuj ruch aktywnie barkami, ściągając je w dół.","Podciągaj się, prowadząc łokcie w dół i ku tułowiowi; bez wymachu nogami.","Opuszczaj ciało pod kontrolą do komfortowego wyprostu ramion."],
      tips:["Nie szarp ani nie kołysz ciałem.","Jeśli potrzebujesz, użyj maszyny wspomagającej.","Nie wymuszaj zakresu przy bólu barków."],
    },
    "Wyciskanie hantli na skosie": {
      muscles:"Górna część klatki piersiowej, przednie barki, triceps",
      equipment:"Ławka skośna i hantle",
      steps:["Ustaw ławkę pod niewielkim dodatnim skosem, zwykle 15–30°. Oprzyj stopy stabilnie.","Ustaw łopatki stabilnie przy ławce; hantle trzymaj przy górnej części klatki.","Wypchnij hantle po łuku ku górze, nie zderzając ich na szczycie.","Wróć powoli do komfortowego rozciągnięcia, nie opuszczając łokci nadmiernie głęboko."],
      tips:["Nie zamieniaj ruchu w wyciskanie pionowe przez zbyt duży skos.","Kontroluj oba hantle niezależnie.","Nie odrywaj pośladków od ławki."],
    },
    "Wiosłowanie siedząc / maszyna": {
      muscles:"Najszerszy grzbietu, środkowe plecy, tylne barki, biceps",
      equipment:"Maszyna do wiosłowania / wyciąg siedząc",
      poster:"seated-row",
      imageNote:"Ilustracja przedstawia wiosłowanie na wyciągu siedząc. Na maszynie z podparciem klatki piersiowej tor ruchu i ustawienie siedzenia mogą się różnić.",
      steps:["Ustaw siedzisko i ewentualne podparcie tak, by chwycić uchwyty bez zaokrąglania pleców.","Napnij brzuch, ustaw barki stabilnie i zachowaj neutralny grzbiet.","Przyciągnij uchwyty w kierunku dolnych żeber/brzucha, prowadząc łokcie w tył.","Wróć powoli, pozwalając mięśniom pleców się rozciągnąć bez szarpania."],
      tips:["Nie bujaj tułowiem.","Nie unoś barków do uszu.","Zatrzymaj ruch krótko w końcowej fazie."],
    },
    "Dipy": {
      muscles:"Triceps, klatka piersiowa, przednie barki",
      equipment:"Poręcze do dipów / maszyna wspomagająca",
      steps:["Chwyć poręcze i ustabilizuj barki oraz łopatki.","Utrzymaj napięty tułów i ugnij kolana, jeśli poprawia to stabilność.","Zginaj łokcie do komfortowego zakresu bez wymuszania zbyt głębokiego zejścia.","Wypchnij się do góry pod kontrolą, bez szarpnięcia."],
      tips:["Przerwij lub ogranicz zakres, jeśli odczuwasz ból przedniej części barku.","Nie zapadaj się w barkach.","W razie potrzeby użyj odciążenia."],
    },
    "Odwrotne rozpiętki": {
      muscles:"Tylne aktony barków, górne plecy",
      equipment:"Maszyna reverse pec-deck / hantle",
      steps:["Ustaw uchwyty i siedzisko tak, aby ramiona poruszały się swobodnie na wysokości barków.","Zachowaj stabilny tułów i lekko ugięte łokcie.","Rozprowadź ramiona na boki, skupiając się na pracy tylnych barków.","Powróć powoli bez gwałtownego zamykania ramion."],
      tips:["Nie unoś barków.","Unikaj zarzucania ciężaru tułowiem.","Nie wypychaj głowy do przodu."],
    },
    "Modlitewnik": {
      muscles:"Biceps, mięsień ramienny",
      equipment:"Ławka modlitewnik / maszyna",
      steps:["Ustaw wysokość siedziska, aby pachy i tylne części ramion miały stabilne podparcie.","Chwyć gryf i zacznij od komfortowo wyprostowanych łokci, bez przeprostu.","Zginaj ramiona, nie odrywając ich od oparcia.","Opuszczaj ciężar powoli, bez opadania na prosty łokieć."],
      tips:["Nie szarp ciężarem z dolnej pozycji.","Nie odrywaj ramion od poduszki.","Dobierz ciężar pozwalający kontrolować zejście."],
    },
    "Prostowanie ramion na wyciągu": {
      muscles:"Triceps (mięsień trójgłowy ramienia)",
      equipment:"Wyciąg górny — drążek lub lina",
      poster:"triceps-pushdown",
      steps:["Ustaw wyciąg wysoko, chwyć uchwyt i stań stabilnie.","Trzymaj łokcie blisko tułowia, barki w stabilnej pozycji.","Prostuj łokcie w dół bez wyprowadzania ramion do przodu.","Wróć powoli do zgięcia łokci, utrzymując kontrolę ciężaru."],
      tips:["Nie kołysz tułowiem.","Łokcie pozostają blisko boków.","Kontroluj fazę powrotu."],
    },
    "Uginanie młotkowe z hantlami": {
      muscles:"Mięsień ramienny, biceps, mięsień ramienno-promieniowy",
      equipment:"Dwa hantle",
      steps:["Stań prosto i trzymaj hantle chwytem neutralnym (kciuki do przodu).","Napnij brzuch i ustaw łokcie blisko boków.","Zginaj łokcie bez zmiany chwytu i bez kołysania tułowiem.","Powoli opuść hantle do komfortowego wyprostu."],
      tips:["Nie skręcaj nadgarstków.","Nie odchylaj pleców.","Dostosuj ciężar do pełnej kontroli ruchu."],
    },
    "Rotacje przedramion (pronacja/supinacja)": {
      muscles:"Pronatory i supinatory przedramion",
      equipment:"Mały hantel / młotek treningowy",
      steps:["Oprzyj przedramię, ugnij łokieć około 90° i trzymaj niewielki ciężar.","Utrzymuj nieruchomy łokieć i neutralny nadgarstek.","Powoli obracaj przedramię, kierując dłoń w górę (supinacja) i w dół (pronacja).","Wróć płynnie przez środek, kontrolując zakres bez bólu."],
      tips:["Pracuj małym ciężarem, ponieważ dźwignia jest długa.","Nie skręcaj całego ramienia zamiast przedramienia.","Nie wymuszaj zakresu przy dyskomforcie w nadgarstku lub łokciu."],
    },
  };
  // Extra guides load first; this merges technique instructions without touching
  // the current workout plan or any saved workout history.
  Object.assign(byName, window.FORMA_ADDITIONAL_GUIDES || {});
  const esc = x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const src=slug=>"/exercise-guides/"+encodeURIComponent(slug)+".webp";
  const modal=document.getElementById("exerciseGuideModal");
  const content=document.getElementById("exerciseGuideContent");
  if(!modal || !content) return;
  let lastFocus=null;
  let displayedExercise=null;
  let guideHistoryToken=null;
  function safeFocus(element) {
    if(!element?.focus) return;
    try { element.focus({preventScroll:true}); }
    catch { element.focus(); }
  }
  function open(){
    if(modal.hidden) {
      lastFocus=document.activeElement;
      // Give the standalone iPhone app a local history entry: the iOS
      // back gesture can dismiss an instruction without leaving training.
      if(window.history?.pushState) {
        guideHistoryToken="forma-guide-"+Date.now();
        try {
          const state=window.history.state;
          window.history.pushState({
            ...(state && typeof state==="object" ? state : {}),
            formaExerciseGuideToken:guideHistoryToken
          },"",window.location.href);
        } catch { guideHistoryToken=null; }
      }
    }
    modal.hidden=false;
    modal.scrollTop=0;
    content.scrollTop=0;
    document.body.classList.add("exercise-guide-open-state");
    // On iOS a normal focus() may scroll the entire full-screen dialog,
    // hiding its close bar above the viewport.
    safeFocus(modal.querySelector(".exercise-guide-back-to-workout"));
  }
  function close(fromHistory=false){
    if(modal.hidden) return;
    modal.hidden=true;
    document.body.classList.remove("exercise-guide-open-state");
    const token=guideHistoryToken;
    guideHistoryToken=null;
    safeFocus(lastFocus?.isConnected===false ? null : lastFocus);
    if(!fromHistory && token && window.history?.state?.formaExerciseGuideToken===token) {
      window.history.back();
    }
  }
  function header(title,subtitle){
    return '<p class="exercise-guide-eyebrow">FORMA • TECHNIKA ĆWICZENIA</p>'+
    '<h3 id="exerciseGuideTitle">'+esc(title)+'</h3>'+
    (subtitle?'<p class="exercise-guide-subtitle">'+esc(subtitle)+'</p>':"");
  }
  function poster(slug,note){
    return '<div class="exercise-guide-poster"><img loading="lazy" decoding="async" src="'+src(slug)+
    '" alt="Graficzna instrukcja wykonania ćwiczenia — '+esc(slug)+'"></div>'+
    (note?'<p class="exercise-guide-variant-note">ℹ '+esc(note)+'</p>':"");
  }
  function cropPanel(panel,name){
    // The source is a composite training sheet. Clip it to the exact exercise
    // so iPhone users never see another exercise while checking technique.
    const [x,y,w,h]=panel.crop;
    const sourceWidth=1055;
    const file=src(panel.sheet);
    const imgWidth=(sourceWidth/w*100).toFixed(5);
    const offLeft=(x/w*100).toFixed(5);
    const offTop=(y/h*100).toFixed(5);
    return '<div class="exercise-guide-crop" style="aspect-ratio:'+w+'/'+h+'">'+
      '<img decoding="async" loading="eager" src="'+file+
      '" alt="Instrukcja graficzna ćwiczenia: '+esc(name)+
      '" style="width:'+imgWidth+'%;left:-'+offLeft+'%;top:-'+offTop+'%" />'+
      '</div>'+
      (panel.note?'<p class="exercise-guide-variant-note">ℹ '+esc(panel.note)+'</p>':'');
  }
  function guidesGrid(key,records){
    return '<div class="exercise-guide-steps">'+records.map((step,i)=>
    '<div class="exercise-guide-step"><b>'+String(i+1)+'</b><p>'+esc(step)+'</p></div>').join("")+'</div>';
  }
  function showGuide(name,description,variantName="",choiceId=null){
    displayedExercise={name,description,variantName};
    const base=byName[name]||null;
    if(!base){
      content.innerHTML=header(name,"Wskazówki z planu treningowego")+
        '<p class="exercise-guide-summary">'+esc(description||"Ustaw stabilną pozycję, kontroluj obciążenie i pracuj w komfortowym zakresie ruchu.")+'</p>';
      open();return;
    }
    // The user can train on a different machine than the original plan.
    // Match an explicitly named machine/variant first; otherwise show a safe
    // default and let the user switch manually inside the guide.
    const alternatives=Array.isArray(base.variants)?base.variants:[];
    const normalized=String(variantName||"").toLocaleLowerCase("pl-PL");
    const chosen=alternatives.find(v=>v.id===choiceId)||
      alternatives.find(v=>(v.matches||[]).some(alias=>normalized.includes(String(alias).toLocaleLowerCase("pl-PL"))))||
      alternatives[0]||null;
    const guide=chosen?{...base,...chosen}:base;
    const switches=alternatives.length?
      '<div class="exercise-guide-variants"><p>Wybierz wariant wykonania:</p><div class="exercise-guide-variant-choices">'+
      alternatives.map(v=>'<button type="button" data-guide-variant="'+esc(v.id)+'" class="'+(v.id===chosen?.id?'active':'')+
        '" aria-pressed="'+String(v.id===chosen?.id)+'">'+esc(v.label)+'</button>').join("")+
      '</div></div>':"";
    const performed=variantName && variantName!==name?
      '<p class="exercise-guide-performed"><strong>Wpisany sprzęt:</strong> '+esc(variantName)+'</p>':"";
    const panel=window.FORMA_EXERCISE_PANELS?.[name]||null;
    content.innerHTML=header(name,guide.equipment)+performed+switches+
      '<p class="exercise-guide-muscles"><strong>Pracują:</strong> '+esc(guide.muscles)+'</p>'+
      (panel?cropPanel(panel,name):guide.poster?poster(guide.poster,guide.imageNote):"")+
      '<h4>Ruch krok po kroku</h4>'+guidesGrid(name,guide.steps)+
      '<h4>Najważniejsze wskazówki</h4>'+
      '<ul class="exercise-guide-tips">'+guide.tips.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
    open();
  }
  const trainingGroups=[
    {title:"Upper A",items:[
      "Wyciskanie sztangi leżąc","Ściąganie drążka wyciągu","Wyciskanie na skosie Smith",
      "Przyciąganie / maszyna upper-back","Krzyżowanie linek","Uginanie sztangi",
      "Wznosy bokiem","Prostowanie nadgarstków z hantlami"
    ]},
    {title:"Lower A",items:[
      "Przysiad ze sztangą","Hip thrust — maszyna / Smith","Leg press",
      "Uginanie nóg","Łydki","Brzuch"
    ]},
    {title:"Upper B",items:[
      "Wyciskanie żołnierskie / Smith","Podciąganie","Wyciskanie hantli na skosie",
      "Wiosłowanie siedząc / maszyna","Dipy","Odwrotne rozpiętki","Modlitewnik",
      "Prostowanie ramion na wyciągu","Uginanie młotkowe z hantlami",
      "Rotacje przedramion (pronacja/supinacja)"
    ]},
    {title:"Lower B",items:[
      "Martwy ciąg — top set","Martwy ciąg — back-off","Hack squat / front squat",
      "Bułgarskie","Uginanie nóg","Łydki","Core"
    ]}
  ];
  function showCatalog(){
    content.innerHTML=header("Biblioteka techniki ćwiczeń","Cztery dni treningowe: szczegółowe instrukcje każdego aktualnego ćwiczenia i sześć ilustracji obrazkowych.")+
      '<p class="exercise-guide-catalog-summary">Wybierz dzień i ćwiczenie. Przy niektórych ćwiczeniach możesz przełączać maszynę lub wariant ruchu.</p>'+
      '<div class="exercise-guide-day-groups">'+trainingGroups.map(group=>
        '<section class="exercise-guide-day-group"><h4>'+esc(group.title)+'</h4>'+
        group.items.map(name=>
          '<button type="button" data-guide-name="'+esc(name)+'">'+esc(name)+'</button>'
        ).join("")+'</section>'
      ).join("")+'</div>'+
      '<h4>Wszystkie plansze graficzne</h4>'+
      '<div class="exercise-guide-catalog">'+posters.map(p=>
      '<button type="button" class="exercise-guide-catalog-card" data-guide-poster="'+esc(p.slug)+'">'+
      '<img loading="lazy" src="'+src(p.slug)+'" alt="'+esc(p.name)+'">'+
      '<strong>'+esc(p.name)+'</strong><small>'+esc(p.note)+'</small></button>'
    ).join("")+'</div>';
    open();
  }
  function showPoster(slug){
    const p=posters.find(x=>x.slug===slug);
    if(!p)return;
    content.innerHTML=header(p.name,"Graficzny instruktaż — 4 kroki")+
      poster(p.slug,p.note)+
      '<button type="button" class="exercise-guide-back" data-guide-catalog>← Wróć do biblioteki</button>';
    open();
  }
  document.addEventListener("click",event=>{
    const variantButton=event.target.closest?.("[data-guide-variant]");
    if(variantButton && displayedExercise){
      showGuide(displayedExercise.name,displayedExercise.description,
        displayedExercise.variantName,variantButton.dataset.guideVariant);
      return;
    }
    const guide=event.target.closest?.(".exercise-guide-trigger");
    if(guide){
      const card=guide.closest(".exercise-card");
      const name=card?.dataset?.name || guide.dataset.exerciseName || "";
      const description=card?.querySelector(".exercise-description p")?.textContent||"";
      const variantName=card?.querySelector(".exercise-variant-input")?.value?.trim()||name;
      showGuide(name,description,variantName);
      return;
    }
    if(event.target.closest?.("[data-guide-catalog]")){showCatalog();return;}
    const listBtn=event.target.closest?.("[data-guide-name]");
    if(listBtn){
      const name=listBtn.dataset.guideName;
      if(byName[name]) showGuide(name,"",name);
      return;
    }
    const posterBtn=event.target.closest?.("[data-guide-poster]");
    if(posterBtn){showPoster(posterBtn.dataset.guidePoster);return;}
    if(event.target.closest?.(".exercise-guide-close, .exercise-guide-back-to-workout, .exercise-guide-floating-exit") || event.target===modal)close();
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!modal.hidden)close();});
  window.addEventListener("popstate",()=>{
    if(!modal.hidden) close(true);
  });
  // Alternative to Safari's back gesture when running as an installed PWA:
  // swipe to the right starting at the left edge of the guide.
  let startTouch=null;
  modal.addEventListener("touchstart",event=>{
    if(modal.hidden || event.touches.length!==1) return;
    const touch=event.touches[0];
    startTouch=touch.clientX<=45?{x:touch.clientX,y:touch.clientY}:null;
  },{passive:true});
  modal.addEventListener("touchend",event=>{
    if(!startTouch || modal.hidden) return;
    const start=startTouch;
    startTouch=null;
    const touch=event.changedTouches[0];
    if(touch && touch.clientX-start.x>90 && Math.abs(touch.clientY-start.y)<65) close();
  },{passive:true});
  window.FORMA_EXERCISE_GUIDES={showGuide,showCatalog,posters:posters.map(x=>({...x})),
    guideNames:Object.keys(byName),guideCount:Object.keys(byName).length};
})();