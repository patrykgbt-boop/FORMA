/* FORMA — additional technique library for Upper A, Lower A and Lower B.
 * Each active exercise uses four execution steps. Exercise variants have
 * separate setup cues; RDL remains inactive in the actual training plan.
 */
(() => {
"use strict";
const guide=(muscles,equipment,steps,tips,extra={})=>({muscles,equipment,steps,tips,...extra});
window.FORMA_ADDITIONAL_GUIDES = {
  "Wyciskanie sztangi leżąc":guide(
    "Klatka piersiowa, triceps, przednia część barków",
    "Ławka pozioma, sztanga, stojaki z asekuracją",
    [
      "Ustaw oczy pod gryfem, stopy stabilnie na podłożu, a łopatki ściągnij i ustabilizuj na ławce. Ustaw zabezpieczenia lub osobę asekurującą.",
      "Chwyć gryf nieco szerzej niż barki. Unieś go ze stojaków i ustaw nad barkami, z nadgarstkami w osi przedramion.",
      "Nabierz powietrza, napnij tułów i opuść sztangę pod kontrolą do dolnej lub środkowej części klatki, prowadząc przedramiona możliwie pionowo.",
      "Wyciśnij gryf płynnie do góry i lekko w stronę barków; pośladki pozostają na ławce, a stopy stabilnie na podłożu."
    ],
    ["Nie odbijaj sztangi od klatki.","Użyj asekuracji przy ciężkich seriach.","Trzymaj nadgarstki neutralnie i nie rozstawiaj łokci skrajnie na boki."]
  ),
  "Ściąganie drążka wyciągu":guide(
    "Najszerszy grzbietu, obłe większe, biceps",
    "Wyciąg górny z drążkiem / maszyna Pulldown",
    [
      "Ustaw siedzisko i podpórkę ud, chwyć uchwyty w wygodnej szerokości i usiądź z wyprostowanym tułowiem.",
      "Ustaw łopatki stabilnie, ściągnij barki lekko w dół i napnij brzuch. Pozwól ramionom wyciągnąć się w górę bez szarpania.",
      "Prowadząc łokcie w dół ku bokom żeber, przyciągnij uchwyt w stronę górnej części klatki; nie odchylaj się nadmiernie.",
      "Powoli wróć do wyprostu ramion. Kontroluj obciążenie również na końcu ruchu."
    ],
    ["Nie ciągnij drążka za kark.","Nie bujaj tułowiem, by nadać ciężarowi rozpęd.","Myśl o prowadzeniu łokci w dół, a nie o ciągnięciu samymi dłońmi."],
    {variants:[
      {id:"lat-pulldown",label:"Wyciąg z drążkiem",matches:["ściąganie","wyciąg","drążek"],
       equipment:"Wyciąg górny z szerokim lub neutralnym uchwytem"},
      {id:"machine-pulldown",label:"Maszyna Pulldown",matches:["pulldown","maszyna"],
       equipment:"Maszyna Pulldown — uchwyty niezależne lub połączone",
       steps:[
         "Wyreguluj siedzenie i stabilizację ud tak, aby uchwyty były osiągalne w górnej pozycji bez unoszenia bioder.",
         "Chwyć rękojeści, utrzymaj stabilny tułów i napnij brzuch; barki utrzymuj daleko od uszu.",
         "Pociągnij uchwyty łukiem w dół, prowadząc łokcie wzdłuż boków tułowia, zgodnie z torem maszyny.",
         "Oddawaj ciężar powoli, aż poczujesz kontrolowane rozciągnięcie pleców; unikaj szarpnięcia na końcu."
       ]}
    ]}
  ),
  "Wyciskanie na skosie Smith":guide(
    "Górna część klatki, triceps, przednie barki",
    "Maszyna Smitha i ławka skośna",
    [
      "Ustaw ławkę pod dodatnim skosem około 15–30° względem poziomu i sprawdź tor gryfu; ustaw ograniczniki bezpieczeństwa.",
      "Ułóż łopatki stabilnie na ławce, stopy dociśnij do podłogi, chwyć gryf nieco szerzej niż barki i zwolnij blokady.",
      "Opuszczaj gryf powoli w kierunku górnej części klatki, dopasowując pozycję ławki do pionowego toru prowadnicy.",
      "Wyciśnij gryf do góry bez odrywania bioder i bez agresywnego przeprostu łokci. Po serii bezpiecznie zablokuj sztangę."
    ],
    ["Nie wymuszaj toru ruchu, który powoduje ból w barkach.","Zablokuj gryf przed wstawaniem.","Stały kąt ławki ułatwia rzetelny pomiar progresu."]
  ),
  "Przyciąganie / maszyna upper-back":guide(
    "Środkowe plecy, najszerszy grzbietu, tylne barki, biceps",
    "Maszyna Upper-Back / ROW",
    [
      "Wyreguluj fotel i podparcie klatki; uchwyty powinny być dostępne bez nadmiernego wysuwania barków.",
      "Oprzyj klatkę stabilnie, napnij brzuch i ustaw nadgarstki prosto; zacznij od komfortowego rozciągnięcia ramion.",
      "Przyciągnij uchwyty, prowadząc łokcie w tył zgodnie z torem maszyny; nie odrywaj tułowia od podpory.",
      "Wróć powoli, zachowując kontakt z podparciem i kontrolę nad ciężarem."
    ],
    ["Nie podrzucaj ciężaru tułowiem.","Zatrzymaj ruch na chwilę przy plecach.","Dobierz tor łokcia do uchwytów maszyny."],
    {variants:[
      {id:"upper-back",label:"Upper-Back oburącz",matches:["upper-back","upper back"],equipment:"Maszyna Upper-Back z podparciem klatki piersiowej"},
      {id:"row-one-arm",label:"ROW jednorącz",matches:["row","jednorącz","jednora","one arm","single"],
       equipment:"Maszyna ROW — przyciąganie jednorącz",
       steps:[
         "Ustaw fotel i podparcie klatki. Chwyć uchwyt jedną ręką, drugą ustabilizuj pozycję w sposób przewidziany przez producenta.",
         "Nie skręcaj bioder ani klatki; napnij brzuch i rozpocznij z kontrolowanym wyprostem ręki.",
         "Przyciągnij łokieć w tył, w kierunku żeber lub biodra, bez rotowania tułowia.",
         "Oddaj uchwyt pod kontrolą. Wykonaj równą liczbę powtórzeń drugą ręką."
       ],
       tips:["Nie wykręcaj kręgosłupa, aby dociągnąć ciężar.","Utrzymuj łopatkę w naturalnym rytmie ruchu.","Zacznij od słabszej strony."]}
    ]}
  ),
  "Krzyżowanie linek":guide(
    "Mięśnie piersiowe, przednie barki",
    "Brama z dwoma wyciągami / Dual Pulley",
    [
      "Ustaw obie linki na podobnej wysokości; dla klasycznego wariantu przyjmij lekki wykrok i chwyć rękojeści.",
      "Napnij brzuch, ustaw klatkę stabilnie i zachowaj lekkie, stałe ugięcie łokci.",
      "Prowadź dłonie po łuku przed klatkę, skupiając się na przywodzeniu ramion; nie prostuj łokci jak przy wyciskaniu.",
      "Wróć powoli do komfortowego rozciągnięcia klatki bez odrywania barków i nadmiernego wychylania się."
    ],
    ["Unikaj przeciążania barków przez zbyt szeroki zakres.","Nie wyciągaj ruchu z kołysania tułowiem.","Linki powinny pracować symetrycznie."],
    {variants:[
      {id:"cable-crossover",label:"Klasyczna brama",matches:["brama","krzyżowanie"]},
      {id:"dual-pulley",label:"Dual Pulley",matches:["dual pulley","dual","wolne bloczki"],
       equipment:"Dwa niezależne bloczki Dual Pulley — dopasuj wysokość do celu ćwiczenia",
       tips:["Ustaw bloczki symetrycznie i użyj podobnego obciążenia.","Przy różnych wysokościach zmienia się akcent pracy klatki.","Nie próbuj dociągać ciężaru kosztem pozycji barków."]}
    ]}
  ),
  "Uginanie sztangi":guide(
    "Biceps, mięsień ramienny, przedramiona",
    "Sztanga prosta/łamana albo wyciąg dolny",
    [
      "Stań stabilnie, chwyć gryf podchwytem i ustaw łokcie blisko tułowia.",
      "Utrzymaj klatkę i tułów bez kołysania, a nadgarstki w osi przedramion.",
      "Ugnij łokcie, unosząc ciężar w stronę barków, bez wypychania bioder do przodu.",
      "Opuść gryf powoli do komfortowego wyprostu i zachowaj kontrolę w dolnej pozycji."
    ],
    ["Nie zarzucaj ciężaru plecami.","Łokcie nie powinny wędrować daleko przed barki.","Pracuj w płynnym zakresie, bez gwałtownego opuszczania."],
    {variants:[
      {id:"barbell",label:"Sztanga",matches:["sztanga","gryf","łamana"]},
      {id:"low-cable",label:"Wyciąg dolny",matches:["wyciąg","linka","cable","dolny"],
       equipment:"Wyciąg dolny z gryfem lub parą uchwytów",
       steps:[
         "Ustaw bloczek nisko, stań blisko wyciągu i chwyć gryf podchwytem; łokcie ustaw przy bokach.",
         "Napnij brzuch, utrzymaj ramiona spokojnie i nie odchylaj tułowia.",
         "Zegnij łokcie, prowadząc uchwyt ku górze w napięciu linki; nie podciągaj ramion barkami.",
         "Oddawaj uchwyt powoli, utrzymując napięcie i nie dopuszczając do uderzenia stosu."
       ]}
    ]}
  ),
  "Wznosy bokiem":guide(
    "Boczne aktony mięśni naramiennych",
    "Hantle lub wyciąg dolny",
    [
      "Stań stabilnie, trzymaj lekkie hantle po bokach i lekko ugnij łokcie.",
      "Napnij brzuch, utrzymaj barki daleko od uszu i neutralne nadgarstki.",
      "Unieś ramiona bokiem mniej więcej do wysokości barków, prowadząc ruch łokciami.",
      "Opuść ramiona powoli, nie rozkołysując tułowia."
    ],
    ["Nie wzruszaj barkami.","Nie rób ruchu z rozpędu.","Ciężar musi pozwalać na kontrolowane opuszczanie."],
    {variants:[
      {id:"dumbbells",label:"Hantle",matches:["hantle","hantel"]},
      {id:"single-cable",label:"Linka wyciągu",matches:["wyciąg","linka","cable","pulley"],
       equipment:"Wyciąg dolny — wznoszenie jednorącz",
       steps:[
         "Ustaw bloczek na dole, stań bokiem do maszyny i chwyć uchwyt dalszą ręką.",
         "Napnij brzuch, utrzymaj bark nisko i łokieć lekko ugięty.",
         "Unieś ramię bokiem w kierunku wysokości barku, nie odchylając tułowia.",
         "Opuść ramię powoli i powtórz na drugą stronę, pilnując takiej samej techniki."
       ]}
    ]}
  ),
  "Prostowanie nadgarstków z hantlami":guide(
    "Prostowniki nadgarstka i przedramiona",
    "Lekki hantel, ławka lub oparcie na udzie",
    [
      "Usiądź i podeprzyj przedramiona na ławce lub udach. Dłonie skieruj wnętrzem w dół, nadgarstki wysuń poza krawędź podpory.",
      "Chwyć lekki hantel w osi przedramienia i trzymaj łokcie nieruchomo.",
      "Unieś grzbiet dłoni ku górze, wykonując ruch samym nadgarstkiem w niewielkim zakresie.",
      "Powoli opuść dłoń do komfortowego rozciągnięcia i zatrzymaj przed pojawieniem się bólu."
    ],
    ["Pracuj bardzo małym obciążeniem.","Nie ruszaj łokciami ani całym przedramieniem.","Przy bólu nadgarstka przerwij ćwiczenie."]
  ),
  "Przysiad ze sztangą":guide(
    "Czworogłowe ud, pośladki, przywodziciele i stabilizatory tułowia",
    "Sztanga, stojaki z zabezpieczeniami",
    [
      "Ustaw sztangę stabilnie na górnej części pleców, chwyć ją i zdejmij ze stojaków. Stopy ustaw mniej więcej na szerokość barków.",
      "Nabierz powietrza i napnij mięśnie brzucha, utrzymując kręgosłup w neutralnej pozycji.",
      "Zginaj biodra i kolana jednocześnie, schodząc do kontrolowanej głębokości; kolana prowadź zgodnie z kierunkiem palców.",
      "Wstań przez nacisk całych stóp, utrzymując równowagę i napięty tułów."
    ],
    ["Zastosuj zabezpieczenia na stojaku.","Nie wymuszaj głębokości kosztem utraty kontroli miednicy.","Nie przenoś ciężaru tylko na palce."]
  ),
  "Hip thrust — maszyna / Smith":guide(
    "Mięśnie pośladkowe, pomocniczo tył uda",
    "Maszyna hip thrust lub Smith z ławką",
    [
      "Oprzyj górną część pleców o stabilną ławkę/podparcie. Ustaw stopy na szerokość bioder i obciążenie wygodnie na biodrach.",
      "Napnij brzuch, skieruj żebra w dół i ustaw głowę w przedłużeniu tułowia.",
      "Wyprostuj biodra, unosząc miednicę po pracę pośladków; u góry piszczele powinny być blisko pionu.",
      "Zatrzymaj ruch na sekundę w szczycie i opuść biodra pod kontrolą, bez nadmiernego wyprostu dolnych pleców."
    ],
    ["Nie wypychaj ciężaru kręgosłupem lędźwiowym.","W pierwszych treningach priorytetem jest ustawienie maszyny, nie wynik siłowy.","Przerwij przy bólu pleców, bioder lub ucisku sprzętu."],
    {variants:[
      {id:"hip-machine",label:"Maszyna Hip Thrust",matches:["maszyna","hip thrust","hip-thrust"],
       equipment:"Dedykowana maszyna Hip Thrust z pasem/poduszką",
       tips:["Sprawdź, czy pas lub poduszka nie uciska kości biodrowych.","Ustaw siedzisko do długości tułowia.","Kontroluj kontakt pleców z oparciem."]},
      {id:"hip-smith",label:"Smith + ławka",matches:["smith"],
       equipment:"Maszyna Smitha i stabilna ławka poprzeczna",
       steps:[
         "Ustaw ławkę stabilnie, załóż grubą podkładkę na gryf i ustaw ograniczniki bezpieczeństwa.",
         "Oprzyj łopatki na ławce, stopy ustaw tak, aby w górnej pozycji golenie były blisko pionu.",
         "Napnij brzuch i unoś biodra przez prostowanie w stawach biodrowych, pilnując pionowej prowadnicy gryfu.",
         "Dociśnij pośladki na górze, bez wyginania lędźwi, po czym powoli opuść gryf do komfortowej dolnej pozycji."
       ]}
    ]}
  ),
  "Leg press":guide(
    "Czworogłowe ud, pośladki, przywodziciele",
    "Suwnica Leg Press z blokadami",
    [
      "Ustaw siedzisko, oprzyj plecy i miednicę, stopy połóż stabilnie na platformie.",
      "Odblokuj suwnicę i napnij brzuch, zachowując naturalną pozycję kręgosłupa.",
      "Powoli zginaj kolana do takiej głębokości, przy której pośladki nadal przylegają do oparcia.",
      "Wypchnij platformę całą stopą, prowadząc kolana zgodnie ze stopami; nie blokuj kolan przeprostem."
    ],
    ["Nie odrywaj miednicy ani nie zaokrąglaj dolnych pleców w dole.","Po zakończeniu serii zawsze załóż blokady.","Nie prostuj kolan gwałtownie."]
  ),
  "Uginanie nóg":guide(
    "Mięśnie kulszowo-goleniowe (dwugłowy uda, półścięgnisty, półbłoniasty)",
    "Maszyna do uginania kolan — siedząc lub leżąc",
    [
      "Dopasuj maszynę do długości nóg, ustawiając oś ruchu w przybliżeniu na wysokości kolan.",
      "Oprzyj tułów i miednicę stabilnie, ustaw wałek przy dolnej części podudzi zgodnie z maszyną.",
      "Zginaj kolana przeciwko oporowi bez odrywania miednicy i bez szarpania.",
      "Prostuj kolana powoli w komfortowym zakresie, utrzymując napięcie tyłu uda."
    ],
    ["Nie zginaj grzbietu, by poruszyć ciężarem.","Kontroluj wyprost nóg — nie opuszczaj stosu bez hamowania.","Jeśli czujesz ból kolana, sprawdź ustawienie osi i zakres."],
    {variants:[
      {id:"leg-curl-seated",label:"Uginanie siedząc",matches:["siedząc","seated"],equipment:"Maszyna Leg Curl siedząc"},
      {id:"leg-curl-lying",label:"Uginanie leżąc",matches:["leżąc","lying"],equipment:"Maszyna Leg Curl leżąc",
       steps:[
         "Ustaw wałek nad piętami i oś maszyny w pobliżu kolan, następnie połóż się stabilnie na ławce.",
         "Napnij brzuch i dociśnij biodra do podparcia.",
         "Zegnij kolana, przyciągając pięty ku pośladkom bez unoszenia miednicy.",
         "Powoli wyprostuj kolana, nie dopuszczając do gwałtownego opadania obciążenia."
       ]}
    ]}
  ),
  "Łydki":guide(
    "Mięsień brzuchaty łydki, płaszczkowaty",
    "Maszyna do wspięć stojąc lub siedząc / suwnica",
    [
      "Ustaw śródstopie stabilnie na podwyższeniu lub platformie, pięty pozostaw swobodnie poza krawędzią.",
      "Utrzymaj stabilne kolana oraz tułów i opuść pięty do komfortowego rozciągnięcia łydki.",
      "Wespnij się wysoko na palce, unosząc pięty pracą stawu skokowego, a nie odbiciem kolan.",
      "Zatrzymaj ruch na górze, a następnie opuść pięty powoli, bez sprężynowania."
    ],
    ["Nie odbijaj się ze ścięgna Achillesa.","Nie przenoś ciężaru na zewnętrzne krawędzie stóp.","Pełen kontrolowany zakres jest ważniejszy niż wielki ciężar."],
    {variants:[
      {id:"calf-standing",label:"Wspięcia stojąc",matches:["stojąc","standing","suwnica"]},
      {id:"calf-seated",label:"Wspięcia siedząc",matches:["siedząc","seated"],
       equipment:"Maszyna do wspięć siedząc — nacisk na mięsień płaszczkowaty",
       tips:["Kolana pozostają ugięte i stabilne przez cały ruch.","Nie odrywaj ud spod podparcia.","Kontroluj dłuższą fazę opuszczania."]}
    ]}
  ),
  "Brzuch":guide(
    "Mięsień prosty brzucha, mięśnie skośne i stabilizujące",
    "Wyciąg górny z liną / mata",
    [
      "Uklęknij przed górnym wyciągiem, chwyć linę obok głowy i ustaw biodra stabilnie.",
      "Napnij brzuch, nie ciągnij rękami liny jak przy prostowaniu ramion.",
      "Zwijaj tułów żebrami ku miednicy, zginając kręgosłup w kontrolowany sposób i napinając brzuch.",
      "Powoli wróć do umiarkowanego wyprostu, nie odchylając bioder w tył."
    ],
    ["Nie ciągnij liny samymi rękami.","Dopasuj ciężar tak, by czuć brzuch, a nie prostowniki pleców.","Nie szarp szyją."],
    {variants:[
      {id:"cable-crunch",label:"Spięcia na wyciągu",matches:["brzuch","spięcia","wyciąg"]},
      {id:"ab-crunch-floor",label:"Spięcia na macie",matches:["mata","crunch"],
       equipment:"Mata gimnastyczna — spięcia brzucha",
       steps:[
         "Połóż się na plecach z ugiętymi kolanami i stopami opartymi o podłoże.",
         "Ustaw ręce lekko przy skroniach lub na klatce i utrzymaj głowę w neutralnej pozycji.",
         "Unieś łopatki z podłoża, przybliżając żebra do miednicy bez ciągnięcia głowy rękami.",
         "Opuść łopatki powoli, zachowując napięcie mięśni brzucha."
       ]}
    ]}
  ),
  "Martwy ciąg — top set":guide(
    "Pośladki, tylna część ud, prostowniki grzbietu, mięśnie grzbietu",
    "Sztanga, talerze, równe podłoże",
    [
      "Ustaw stopy mniej więcej na szerokość bioder; sztanga nad śródstopiem, około 2–3 cm od goleni.",
      "Cofnij biodra, chwyć gryf, ustaw kręgosłup neutralnie i napnij mięśnie brzucha oraz grzbietu. Zlikwiduj luz między rękami a gryfem.",
      "Odepchnij podłogę nogami, prowadząc sztangę blisko goleni i ud; wyprostuj biodra bez odchylania tułowia w tył.",
      "Opuść sztangę przez cofnięcie bioder, a następnie ugięcie kolan; odstaw ciężar pod kontrolą i ustaw kolejne powtórzenie."
    ],
    ["Top set: trzymaj intensywność maksymalnie około RPE 8 (około 2 powtórzenia w zapasie).","Bez szarpania sztangi z podłogi i bez utraty neutralnej pozycji.","Nie wyginaj się do tyłu po wyproście bioder."]
  ),
  "Martwy ciąg — back-off":guide(
    "Pośladki, tylna część ud, prostowniki grzbietu, mięśnie grzbietu",
    "Sztanga — serie lżejsze po serii głównej",
    [
      "Po serii top set odejmij obciążenie zgodnie z rozpisanym planem; odpocznij przed pierwszym back-offem.",
      "Ustaw stopy i chwyt dokładnie tak jak w serii głównej: gryf nad śródstopiem, mocny brzuch i napięte plecy.",
      "Podnoś gryf płynnie blisko nóg, kończąc ruch wyprostem bioder i kolan bez przeprostu lędźwi.",
      "Odkładaj sztangę kontrolowanie, oddychaj i ustawiaj kolejne powtórzenie z taką samą techniką."
    ],
    ["Nie przyspieszaj serii tylko dlatego, że ciężar jest mniejszy.","Jeśli tracisz pozycję, zmniejsz ciężar lub przerwij serię.","Technika i zakres muszą pozostać takie same jak w top secie."]
  ),
  "Hack squat / front squat":guide(
    "Czworogłowe ud, pośladki, mięśnie stabilizujące",
    "Maszyna Hack Squat albo sztanga do przysiadu przedniego",
    [
      "Na Hack Squat ustaw plecy i barki na podparciu, stopy na platformie i sprawdź blokady.",
      "Napnij brzuch, trzymaj całe stopy na platformie, kolana w kierunku palców.",
      "Zginaj kolana i biodra do komfortowej głębokości, nie odrywając miednicy od oparcia.",
      "Wyprostuj nogi płynnie, bez agresywnego blokowania kolan, a następnie załóż blokady."
    ],
    ["Wybierz jeden wariant na cały blok progresji.","Nie dociskaj kolan do środka ani nie wypychaj ich wbrew naturalnemu torowi.","Nie odrywaj pleców od podparcia maszyny."],
    {variants:[
      {id:"hack",label:"Hack Squat",matches:["hack","maszyna"],equipment:"Maszyna Hack Squat"},
      {id:"front",label:"Front Squat",matches:["front","przedni"],
       equipment:"Przysiad przedni ze sztangą (front rack)",
       steps:[
         "Ustaw sztangę na przednich częściach barków, łokcie skieruj wysoko i zabezpiecz stanowisko.",
         "Stopy ustaw stabilnie, klatkę utrzymuj wysoko, nabierz powietrza i napnij tułów.",
         "Zejdź do przysiadu z kolanami w kierunku palców, utrzymując łokcie uniesione i ciężar nad śródstopiem.",
         "Wstań, nie pozwalając klatce opaść; po serii odstaw sztangę na stojaki."
       ],
       tips:["Jeśli nie jesteś w stanie utrzymać wysokich łokci, zmniejsz ciężar.","Nie zastępuj ruchu pochyleniem tułowia do przodu.","Zachowaj bezpieczny uchwyt front-rack."]}
    ]}
  ),
  "Bułgarskie":guide(
    "Czworogłowe ud, pośladki, mięśnie stabilizujące biodra",
    "Ławka/podwyższenie i ewentualnie hantle",
    [
      "Stań tyłem do ławki, oprzyj na niej grzbiet tylnej stopy i ustaw przednią stopę dostatecznie daleko.",
      "Ustaw miednicę przodem, napnij brzuch i przenieś większość obciążenia na nogę wykroczną.",
      "Zejdź pionowo w dół przez zgięcie przedniego biodra i kolana, utrzymując kolano zgodnie z kierunkiem stopy.",
      "Wstań, naciskając całą przednią stopą; utrzymaj kontrolę równowagi i zrób tyle samo powtórzeń drugą nogą."
    ],
    ["Nie odpychaj się agresywnie tylną nogą.","Dopasuj odległość od ławki do swojej budowy.","Pierwsze serie wykonaj bez hantli, jeśli potrzebujesz stabilizacji."]
  ),
  "Core":guide(
    "Mięśnie głębokie brzucha, skośne, stabilizujące kręgosłup",
    "Mata (plank) lub wyciąg z uchwytem (Pallof press)",
    [
      "Ustaw przedramiona na macie, łokcie pod barkami i nogi wyprostowane.",
      "Napnij brzuch i pośladki, utrzymując głowę, tułów i biodra w jednej linii.",
      "Trzymaj pozycję bez opadania bioder ani nadmiernego unoszenia pośladków.",
      "Zakończ serię, kiedy nie możesz utrzymać prawidłowej pozycji, nie doprowadzaj do przeprostu lędźwi."
    ],
    ["Oddychaj regularnie.","Nie unoś głowy, patrz przed siebie w podłoże.","Czas lub opór zwiększaj dopiero przy stabilnej pozycji."],
    {variants:[
      {id:"plank",label:"Plank",matches:["plank","deska"],equipment:"Mata — plank na przedramionach"},
      {id:"pallof",label:"Pallof Press",matches:["pallof","antyrotacja"],
       equipment:"Wyciąg z uchwytem na wysokości mostka — antyrotacja",
       steps:[
         "Stań bokiem do wyciągu w lekkim rozkroku, chwyć uchwyt obiema dłońmi przy mostku.",
         "Ustaw żebra nad miednicą i napnij brzuch, nie pozwalając tułowiowi obracać się do maszyny.",
         "Wyprostuj ramiona przed siebie, utrzymując klatkę i biodra skierowane na wprost.",
         "Powoli wróć dłońmi do mostka. Powtórz serię z przeciwną stroną zwróconą do wyciągu."
       ],
       tips:["To ćwiczenie antyrotacyjne — tułów powinien pozostać nieruchomy.","Nie dobieraj ciężaru powodującego skręcanie tułowia.","Oddychaj spokojnie i symetrycznie."]}
    ]}
  ),
  // Retain as a reference for past records only; this movement stays inactive in Lower A.
  "RDL":guide(
    "Tylna część uda, pośladki, prostowniki grzbietu",
    "Sztanga lub hantle; ruch hip hinge (w planie obecnie nieaktywny)",
    [
      "Stań ze sztangą przy udach, stopy na szerokość bioder, kolana lekko ugięte.",
      "Napnij brzuch i cofnij biodra, prowadząc sztangę blisko nóg, bez zaokrąglania pleców.",
      "Zejdź tylko do zakresu, w którym utrzymasz napięcie tyłu ud i neutralny tułów.",
      "Wróć do pionu przez wyprost bioder, ściskając pośladki bez wyginania lędźwi."
    ],
    ["Ćwiczenie jest WYŁĄCZONE w obecnym planie i zastąpione hip thrustem.","Jeśli wróci do programu, zacznij od nauki ruchu hip hinge z minimalnym ciężarem.","Nie ćwicz przez ból pleców."]
  ),
};
})();