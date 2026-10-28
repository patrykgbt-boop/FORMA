import React, {useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Alert,AppState,KeyboardAvoidingView,Platform,Pressable,SafeAreaView,ScrollView,StatusBar,StyleSheet,Text,TextInput,View} from 'react-native';
import {useAudioRecorder,useAudioRecorderState,RecordingPresets,AudioQuality,requestRecordingPermissionsAsync,setAudioModeAsync} from 'expo-audio';
import {File,Directory,Paths} from 'expo-file-system';
import {supabase} from './src/supabase';
import {localDate,buildNight,diffMinutes,minutesLabel} from './src/sleep-utils';
import {analyzeAudioFile} from './modules/forma-sound-analysis';

const ACTIVE='forma-sleep-ios-active-v1';
const PENDING='forma-sleep-ios-pending-v1';
const options={
  ...RecordingPresets.HIGH_QUALITY,extension:'.m4a',sampleRate:16000,numberOfChannels:1,
  bitRate:32000,isMeteringEnabled:false,directory:'cache',
  ios:{...RecordingPresets.HIGH_QUALITY.ios,audioQuality:AudioQuality.LOW}
};
const C={bg:'#0b1020',card:'#121a2d',line:'#27324a',mint:'#5eead4',white:'#eef2ff',muted:'#93a0b8',red:'#fca5a5'};
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
function Action({label,onPress,disabled=false,secondary=false,danger=false}){
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action,secondary&&styles.secondary,danger&&styles.danger,disabled&&styles.disabled]}>
    <Text style={[styles.actionText,(secondary||danger)&&{color:danger?C.red:C.white}]}>{label}</Text>
  </Pressable>;
}
function LineInput({label,value,onChangeText,keyboardType='default',secureTextEntry=false,placeholder=''}) {
  return <View style={styles.field}><Text style={styles.caption}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={styles.input} keyboardType={keyboardType} secureTextEntry={secureTextEntry} placeholder={placeholder} placeholderTextColor="#64748b" autoCapitalize="none" accessibilityLabel={label}/></View>;
}
export default function App(){
 const recorder=useAudioRecorder(options);
 const recorderState=useAudioRecorderState(recorder,1500);
 const [session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [active,setActive]=useState(null),[pending,setPending]=useState(null);
 const [latency,setLatency]=useState('15'),[awake,setAwake]=useState('0'),[quality,setQuality]=useState('4');
 const [working,setWorking]=useState(false),[status,setStatus]=useState(''),[history,setHistory]=useState([]);
 const [warning,setWarning]=useState('');
 const busy=working;
 useEffect(()=>{
   let mounted=true;
   supabase.auth.getSession().then(({data})=>{if(mounted)setSession(data.session)}).catch(e=>setStatus(e.message));
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{if(mounted)setSession(s)});
   const existingActive=read(ACTIVE), existingPending=read(PENDING);
   if(existingPending)setPending(existingPending);
   if(existingActive)setWarning('Wykryto przerwaną sesję. Sprawdź pliki lokalne; poprzedni pomiar może być niekompletny. Możesz usunąć niedokończone nagrania.');
   return ()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
   if(!session?.user?.id)return;
   supabase.from('sleep_nights').select('sleep_date,sleep_duration_min,snoring_minutes,source').eq('user_id',session.user.id).order('sleep_date',{ascending:false}).limit(7)
    .then(({data,error})=>{if(!error)setHistory(data||[])});
 },[session?.user?.id,pending]);
 const sessionTime=useMemo(()=>active?new Date(active.startedAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}):'', [active]);
 async function signIn(){
   if(!email.trim()||!password)return setStatus('Podaj e-mail i hasło konta FORMA.');
   setWorking(true);setStatus('');
   try{const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setPassword('')}
   catch(e){setStatus('Logowanie: '+e.message)}
   finally{setWorking(false)}
 }
 async function startNight(){
   if(!session?.user?.id)return setStatus('Zaloguj się najpierw do FORMA.');
   if(pending||warning)return setStatus('Najpierw zakończ lub usuń poprzednią sesję.');
   setWorking(true);setStatus('');
   try{
     const permission=await requestRecordingPermissionsAsync();
     if(!permission.granted)throw new Error('Nie przyznano dostępu do mikrofonu w ustawieniach iOS.');
     await setAudioModeAsync({playsInSilentMode:true,allowsRecording:true,allowsBackgroundRecording:true});
     await recorder.prepareToRecordAsync();
     await recorder.record();
     const fresh={startedAt:new Date().toISOString(),userId:session.user.id};
     localStorage.setItem(ACTIVE,JSON.stringify(fresh));
     setActive(fresh);setStatus('Nagrywanie uruchomione. Zablokuj ekran i połóż iPhone na szafce nocnej.');
   }catch(e){setStatus('Nie udało się uruchomić: '+e.message)}
   finally{setWorking(false)}
 }
 async function stopNight(){
   if(!active)return;
   setWorking(true);setStatus('Kończenie nagrania…');
   let uri=null;
   try{
     await recorder.stop();
     uri=recorder.uri||recorder.getStatus()?.url;
     if(!uri)throw new Error('Nie uzyskano ścieżki do nagrania.');
     const endedAt=new Date().toISOString();
     const mins=diffMinutes(active.startedAt,endedAt);
     setStatus('Lokalna analiza dźwięków na iPhonie (bez wysyłania pliku)…');
     let analysis=null,classificationError='';
     try{analysis=await analyzeAudioFile(uri)}
     catch(e){classificationError=String(e.message||e)}
     const result={startedAt:active.startedAt,endedAt,userId:active.userId,analysis,classificationError,
       deviceMinutes:mins};
     // Najpierw utrwal wynik na urządzeniu, dopiero potem usuń nagranie.
     localStorage.setItem(PENDING,JSON.stringify(result));
     setPending(result);
     try{new File(uri).delete()}catch(e){setWarning('Nie udało się automatycznie usunąć pliku. Wybierz „Wyczyść nagrania lokalne”.');}
     localStorage.removeItem(ACTIVE);setActive(null);
     setStatus(classificationError?'Zapisano sesję, ale analiza dźwięku nie powiodła się. Możesz zapisać podstawowe dane.':'Analiza ukończona. Potwierdź poranne dane i zapisz do FORMA.');
   }catch(e){setStatus('Problem podczas kończenia sesji: '+e.message);setWarning('Nagranie mogło pozostać w pamięci telefonu. Wyczyść stare nagrania po sprawdzeniu.');}
   finally{setWorking(false)}
 }
 async function syncNight(){
   if(!pending||!session?.user?.id)return;
   if(pending.userId!==session.user.id)return setStatus('To zapis z innego konta FORMA. Zaloguj się na właściwe konto.');
   let payload;
   try{payload=buildNight(pending,latency,awake,quality)}
   catch(e){setStatus(e.message);return;}
   setWorking(true);setStatus('Synchronizacja z FORMA…');
   try{
     const {error}=await supabase.from('sleep_nights').upsert({...payload,user_id:session.user.id},{onConflict:'user_id,sleep_date'});
     if(error)throw error;
     const daily=await supabase.from('daily_entries').upsert({user_id:session.user.id,entry_date:payload.sleep_date,sleep_hours:Number((payload.sleep_duration_min/60).toFixed(2)),updated_at:new Date().toISOString()},{onConflict:'user_id,entry_date'});
     if(daily.error)throw new Error('Szczegóły snu zapisane, ale nie udało się uaktualnić Dziennika: '+daily.error.message);
     localStorage.removeItem(PENDING);setPending(null);setLatency('15');setAwake('0');setQuality('4');
     setStatus('Dane zapisane. Otwórz zakładkę „Sen” w FORMA na telefonie lub komputerze.');
   }catch(e){setStatus('Wynik pozostał na telefonie; ponów synchronizację. '+e.message)}
   finally{setWorking(false)}
 }
 async function clearOrphanedAudio(){
   Alert.alert('Usunąć pliki audio?','Usunie lokalne nagrania z katalogu pamięci tymczasowej FORMA Sleep. Nie usuwa zapisanych wyników w Supabase.',[
    {text:'Anuluj',style:'cancel'},
    {text:'Usuń',style:'destructive',onPress:async()=>{
      setWorking(true);
      try{
        const folder=new Directory(Paths.cache,'ExpoAudio');
        if(folder.exists){
          for(const entry of folder.list()){if(entry instanceof File&&entry.uri.endsWith('.m4a'))entry.delete();}
        }
        localStorage.removeItem(ACTIVE);setWarning('');setStatus('Pliki lokalne wyczyszczone.');
      }catch(e){setStatus('Nie udało się wyczyścić plików: '+e.message)}
      finally{setWorking(false)}
    }}
   ]);
 }
 return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" backgroundColor={C.bg}/>
 <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
 <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
 <Text style={styles.eyebrow}>FORMA / NATYWNY MONITOR</Text><Text style={styles.title}>FORMA Sleep</Text>
 <Text style={styles.muted}>iPhone • nocny pomiar mikrofonem • podsumowanie do Twojej FORMA</Text>
 {!session?<View style={styles.card}><Text style={styles.heading}>Zaloguj się do FORMA</Text>
   <LineInput label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address"/>
   <LineInput label="Hasło" value={password} onChangeText={setPassword} secureTextEntry/>
   <Action label="Zaloguj się" onPress={signIn} disabled={busy}/>
   <Text style={styles.caption}>Użyj tego samego konta co w aplikacji FORMA. Nie twórz nowego konta.</Text>
 </View>:<View style={styles.card}><Text style={styles.heading}>Twoje konto</Text><Text style={styles.muted}>{session.user.email}</Text>
  <Action label="Wyloguj" secondary disabled={busy||!!active} onPress={async()=>{await supabase.auth.signOut();setHistory([])}}/>
 </View>}
 {session&&<View style={styles.card}>
   <Text style={styles.eyebrow}>SESJA NOCNA</Text>
   <Text style={styles.heading}>{active?'Nagrywanie w toku':pending?'Pomiar oczekuje na zapis':'Gotowy do nagrywania'}</Text>
   {active?<><Text style={styles.info}>Start: {sessionTime}</Text><Text style={styles.caption}>Możesz zablokować ekran. Monitoring nie jest wyznacznikiem faz REM ani diagnostyką bezdechu.</Text><Action label="Zakończ noc i przeanalizuj" onPress={stopNight} disabled={busy}/></>
   :pending?<><Text style={styles.info}>{localDate(pending.endedAt)} • {minutesLabel(pending.deviceMinutes)}</Text>
      <Text style={styles.muted}>{pending.analysis?.snoreSupported?'Możliwe chrapanie: '+pending.analysis.snoreEvents+' epizodów (przybliżenie).':'Klasyfikacja chrapania niedostępna — nie wpisujemy zera jako wyniku.'}</Text>
      {pending.classificationError?<Text style={styles.caption}>Błąd analizy: {pending.classificationError}</Text>:null}
      <LineInput label="Zasypianie [min] (szacunek)" value={latency} onChangeText={setLatency} keyboardType="number-pad"/>
      <LineInput label="Czuwanie podczas nocy [min] (szacunek)" value={awake} onChangeText={setAwake} keyboardType="number-pad"/>
      <Text style={styles.caption}>Jakość wypoczynku (1 = słabo; 5 = bardzo dobrze)</Text>
      <View style={styles.scores}>{[1,2,3,4,5].map(n=><Pressable key={n} onPress={()=>setQuality(String(n))} style={[styles.score,quality===String(n)&&styles.scoreActive]}><Text style={[styles.scoreText,quality===String(n)&&{color:'#07111f'}]}>{n}</Text></Pressable>)}</View>
      <Action label="Zapisz wynik do FORMA" onPress={syncNight} disabled={busy}/>
   </>:<><Text style={styles.muted}>Połóż telefon na stabilnej szafce nocnej. Podłącz ładowarkę, nie przykrywaj iPhone’a i zapewnij wolne miejsce na plik.</Text>
       <Action label="Rozpocznij monitorowanie" onPress={startNight} disabled={busy||!!warning}/></>}
 </View>}
 {!!warning&&<View style={styles.card}><Text style={[styles.heading,{color:C.red}]}>Uwaga — przerwana sesja</Text><Text style={styles.muted}>{warning}</Text><Action label="Wyczyść nagrania lokalne" danger onPress={clearOrphanedAudio} disabled={busy||!!active}/></View>}
 {!!status&&<View style={styles.card}><Text style={styles.muted}>{status}</Text></View>}
 {busy&&<ActivityIndicator color={C.mint} size="large"/>}
 {session&&<View style={styles.card}><Text style={styles.heading}>Ostatnie noce w FORMA</Text>
  {history.length?history.map((item,i)=><View key={i} style={styles.historyRow}><Text style={styles.white}>{item.sleep_date}</Text><Text style={styles.muted}>{minutesLabel(item.sleep_duration_min)} • {item.snoring_minutes==null?'brak oceny chrapania':'możliwe chrapanie '+item.snoring_minutes+' min'}</Text></View>):<Text style={styles.muted}>Brak historii. Zapisz pierwszą noc.</Text>}
 </View>}
 <View style={styles.card}><Text style={styles.heading}>Prywatność i ograniczenia</Text><Text style={styles.caption}>Nagrywanie rozpoczyna się wyłącznie po naciśnięciu przycisku. Analiza dźwięku odbywa się na urządzeniu. Po analizie aplikacja próbuje usunąć surowy plik audio. Pliki mogą pozostać po przerwaniu aplikacji — można je ręcznie wyczyścić. Do Supabase wysyłamy tylko podsumowanie. Przy jednej szafce nocnej aplikacja może rejestrować również drugą osobę. Nie diagnozuje chorób ani nie mierzy faz snu.</Text></View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:C.bg},container:{padding:20,paddingBottom:60},
 eyebrow:{color:C.mint,fontSize:12,fontWeight:'800',letterSpacing:2,marginBottom:8},
 title:{color:C.white,fontSize:33,fontWeight:'800',marginBottom:6},
 muted:{color:C.muted,fontSize:14,lineHeight:21,marginBottom:8},
 white:{color:C.white,fontSize:14,fontWeight:'600'},
 card:{backgroundColor:C.card,borderColor:C.line,borderWidth:1,borderRadius:18,padding:18,marginTop:16,gap:10},
 heading:{color:C.white,fontWeight:'700',fontSize:19},
 caption:{color:C.muted,fontSize:12,lineHeight:19},
 field:{marginTop:4,gap:6},input:{color:C.white,backgroundColor:'#0d1627',borderColor:C.line,borderWidth:1,padding:12,borderRadius:12,minHeight:45},
 action:{padding:14,marginTop:7,backgroundColor:C.mint,borderRadius:12,alignItems:'center'},
 secondary:{backgroundColor:'#182238',borderColor:C.line,borderWidth:1},
 danger:{backgroundColor:'#271721',borderColor:'#5b343e',borderWidth:1},
 disabled:{opacity:0.45},actionText:{fontSize:14,fontWeight:'800',color:'#07111f'},
 info:{color:C.white,fontSize:17,fontWeight:'700'},scores:{flexDirection:'row',gap:10,marginBottom:5},
 score:{flex:1,borderRadius:10,padding:12,alignItems:'center',backgroundColor:'#182238',borderWidth:1,borderColor:C.line},
 scoreActive:{backgroundColor:C.mint},scoreText:{color:C.white,fontWeight:'700'},
 historyRow:{borderTopWidth:1,borderColor:C.line,paddingTop:10,gap:3}
});
