const SHELL_CACHE="forma-shell-v18";
const RUNTIME_CACHE="forma-runtime-v18";
const SHELL=["/","/manifest.webmanifest","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/rest-timer.js","/push-rest.js","/supplements.js","/meal-prep.js","/food-review.js","/planned-meal.js","/exercise-guide-panels.js","/exercise-guides-extra.js","/exercise-guides.js","/exercise-guides.css","/exercise-guides/chest-press.webp","/exercise-guides/seated-row.webp","/exercise-guides/shoulder-press.webp","/exercise-guides/face-pull.webp","/exercise-guides/triceps-pushdown.webp","/exercise-guides/rope-hammer-curl.webp","/exercise-guides/upper-a-1.webp","/exercise-guides/upper-a-2.webp","/exercise-guides/lower-a-1.webp","/exercise-guides/lower-a-2.webp","/exercise-guides/upper-b-1.webp","/exercise-guides/upper-b-2.webp","/exercise-guides/lower-b-1.webp","/exercise-guides/lower-b-2.webp"];
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


// Web Push notifications are delivered by the operating system even while
// FORMA's page is suspended or the iPhone is locked.
self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const title = typeof payload.title === "string" ? payload.title.slice(0, 100) : "FORMA • Koniec przerwy";
  const body = typeof payload.body === "string" ? payload.body.slice(0, 220) : "Możesz rozpocząć kolejną serię.";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.type === "rest-test" ? "forma-rest-test" : payload.type === "supplements" ? "forma-supplements" : payload.type?.startsWith("meal-prep") ? "forma-meal-prep" : payload.type?.startsWith("food-review") ? "forma-food-review" : "forma-rest-timer",
    data: { url: "/", timerId: payload.timerId || null },
    vibrate: [160, 80, 160],
    timestamp: Date.now(),
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const visibleApp = allClients.find(client => {
      try { return new URL(client.url).origin === self.location.origin; } catch { return false; }
    });
    if (visibleApp) {
      await visibleApp.focus();
      return;
    }
    await self.clients.openWindow("/");
  })());
});
