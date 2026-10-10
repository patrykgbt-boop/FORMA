const SHELL_CACHE="forma-shell-v2";
const RUNTIME_CACHE="forma-runtime-v2";
const SHELL=["/","/manifest.webmanifest","/icon-192.png","/icon-512.png","/apple-touch-icon.png"];
const OPTIONAL_CDN=[
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL);
    await Promise.allSettled(OPTIONAL_CDN.map(async url=>{
      const res=await fetch(url,{mode:"cors"});
      if(res.ok) await cache.put(url,res.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keep=new Set([SHELL_CACHE,RUNTIME_CACHE]);
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>!keep.has(k)).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(SHELL_CACHE);
        await cache.put("/",fresh.clone());
        return fresh;
      }catch{
        return (await caches.match("/")) || new Response("FORMA jest offline.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      const fresh=await fetch(req);
      if(fresh.ok){
        const cache=await caches.open(RUNTIME_CACHE);
        await cache.put(req,fresh.clone());
      }
      return fresh;
    })());
    return;
  }

  if(url.hostname==="cdn.jsdelivr.net"){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      const fresh=await fetch(req);
      const cache=await caches.open(RUNTIME_CACHE);
      await cache.put(req,fresh.clone());
      return fresh;
    })());
  }
});
