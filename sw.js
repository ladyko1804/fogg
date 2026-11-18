const CACHE="moi-day-v14";
const ASSETS=["./index.html","./manifest.json","./icon.svg"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  const isDoc=req.mode==="navigate"||/\.html$/.test(url.pathname)||url.pathname.endsWith("/");

  if(isDoc){
    // сеть впереди: новая версия приложения приходит сразу
    e.respondWith(
      fetch(req).then(r=>{
        const cp=r.clone();
        caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});
        return r;
      }).catch(()=>caches.match(req).then(r=>r||caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit=>hit||fetch(req).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});
      return r;
    }).catch(()=>caches.match("./index.html")))
  );
});
