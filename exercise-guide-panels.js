/* FORMA: a single exercise uses only its own visual panel from each
   eight-sheet illustration set. Source dimensions: 1055 × 1491 pixels.
   No workout records or machine-variant choices are changed by this map.
*/
(() => {
 "use strict";
 const data={};
 const add=(sheet,entries)=>{
   for(const [name,crop,note] of entries) {
     data[name]={sheet,crop,note:note||""};
   }
 };
 const L=[28,128,478,665],R=[520,128,478,665],L2=[28,796,478,690],R2=[520,796,478,690];
 const W1=[28,128,970,413],W2=[28,550,970,415],W3=[28,973,970,434];
 const UBL=[28,128,478,575],UBR=[520,128,478,575];
 const UBL2=[28,716,478,536],UBR2=[520,716,478,536],UB5=[28,1258,970,230];
 const UB2L=[28,128,478,556],UB2R=[520,128,478,556],
       UB2L2=[28,693,478,536],UB2R2=[520,693,478,536],UB25=[28,1235,970,250];
 add("upper-a-1",[
  ["Wyciskanie sztangi leżąc",L],
  ["Ściąganie drążka wyciągu",R,"Grafika pokazuje ściąganie drążka wyciągu. Na maszynie Pulldown uchwyty i tor ruchu mogą się różnić."],
  ["Wyciskanie na skosie Smith",L2],
  ["Przyciąganie / maszyna upper-back",R2,"Na grafice widoczna jest maszyna do przyciągania oburącz. Dla ROW jednorącz wybierz odpowiedni wariant instrukcji poniżej."]
 ]);
 add("upper-a-2",[
  ["Krzyżowanie linek",L],
  ["Uginanie sztangi",R,"Ilustracja przedstawia uginanie ze sztangą. Jeżeli wykonujesz ćwiczenie na wyciągu dolnym, wybierz wariant wyciągu pod grafiką."],
  ["Wznosy bokiem",L2,"Ilustracja przedstawia wznosy z hantlami. Na wyciągu dolnym ustaw linkę zgodnie z wybranym wariantem techniki."],
  ["Prostowanie nadgarstków z hantlami",R2]
 ]);
 add("lower-a-1",[
  ["Przysiad ze sztangą",W1],
  ["Hip thrust — maszyna / Smith",W2,"Ilustracja pokazuje hip thrust z obciążeniem na biodrach. Ustawienie maszyny dedykowanej i Smitha może się różnić."],
  ["Leg press",W3]
 ]);
 add("lower-a-2",[
  ["Uginanie nóg",W1,"Ilustracja pokazuje uginanie nóg leżąc. Na maszynie siedzącej ustaw podparcie oraz oś stawu kolanowego zgodnie z jej konstrukcją."],
  ["Łydki",W2,"Ilustracja przedstawia wspięcia stojąc. Przy wspięciach siedząc ćwiczenie ma inny układ podparcia."],
  ["Brzuch",W3,"Ilustracja przedstawia spięcia brzucha na wyciągu; spięcia na macie wykonuj według wariantu tekstowego."]
 ]);
 add("upper-b-1",[
  ["Wyciskanie żołnierskie / Smith",UBL],
  ["Podciąganie",UBR],
  ["Wyciskanie hantli na skosie",UBL2],
  ["Wiosłowanie siedząc / maszyna",UBR2,"Ilustracja przedstawia jeden z wariantów maszyny do wiosłowania; szczegóły podparcia i toru mogą być inne na Twoim sprzęcie."],
  ["Dipy",UB5]
 ]);
 add("upper-b-2",[
  ["Odwrotne rozpiętki",UB2L],
  ["Modlitewnik",UB2R],
  ["Prostowanie ramion na wyciągu",UB2L2],
  ["Uginanie młotkowe z hantlami",UB2R2],
  ["Rotacje przedramion (pronacja/supinacja)",UB25]
 ]);
 add("lower-b-1",[
  ["Martwy ciąg — top set",W1],
  ["Martwy ciąg — back-off",W2],
  ["Hack squat / front squat",W3,"Na ilustracji widoczne są oba warianty — Hack Squat i przysiad przedni. Wybierz właściwy wariant poniżej."]
 ]);
 add("lower-b-2",[
  ["Bułgarskie",L],
  ["Core",R2,"Grafika pokazuje wariant antyrotacyjny Pallof Press. Dla planku użyj wskazówek wybranego wariantu tekstowego."]
 ]);
 window.FORMA_EXERCISE_PANELS=Object.freeze(data);
})();