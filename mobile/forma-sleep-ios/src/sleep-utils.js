// Strefa dnia: dzień przebudzenia według ustawień lokalnych iPhone'a.
export function localDate(iso){
 const d=new Date(iso);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
export function diffMinutes(start,end){
 const millis=new Date(end).getTime()-new Date(start).getTime();
 if(!Number.isFinite(millis)||millis<=0||millis>24*3600*1000)throw new Error('Czas sesji musi wynosić 1 min–24 h.');
 return Math.round(millis/60000);
}
export function buildNight(pending,latency,awake,quality){
 const total=diffMinutes(pending.startedAt,pending.endedAt);
 const l=Number(latency),a=Number(awake),q=Number(quality);
 if(!Number.isInteger(l)||l<0||l>600||!Number.isInteger(a)||a<0||a>600)throw new Error('Nieprawidłowe minuty zasypiania lub czuwania.');
 if(!Number.isInteger(q)||q<1||q>5)throw new Error('Oceń jakość snu od 1 do 5.');
 if(total-l-a<=0)throw new Error('Czas snu musi być dodatni.');
 const result=pending.analysis||{};
 const snoring=result.snoreSupported?Math.min(600,Math.ceil((result.snoreSeconds||0)/60)):null;
 return {sleep_date:localDate(pending.endedAt),bed_at:pending.startedAt,woke_at:pending.endedAt,sleep_duration_min:total-l-a,latency_min:l,awake_minutes:a,awakenings:null,quality:q,snoring_minutes:snoring,source:'ios',notes:'FORMA Sleep iOS; czas snu oszacowany z sesji i deklaracji. '+(result.snoreSupported?'Możliwe epizody chrapania: '+(result.snoreEvents||0)+'.':'Rozpoznanie chrapania niedostępne lub nieudane.')};
}
export function minutesLabel(value){return Math.floor(value/60)+' h '+String(value%60).padStart(2,'0')+' min';}
