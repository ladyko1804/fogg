const CACHE="moi-day-v3";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./index.html","./manifest.json","./icon.svg"])).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(f=>{
    const cp=f.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return f;
  }).catch(()=>caches.match("./index.html"))));
});
