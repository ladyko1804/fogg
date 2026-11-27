const CACHE="moi-day-v273";
const ASSETS=["./index.html","./manifest.json","./icon.svg","./icon-192.png","./icon-512.png"];
const LOCAL_MAP=["./leaflet/leaflet.js","./leaflet/leaflet.css"];

self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await c.addAll(ASSETS).catch(()=>{});
    await c.addAll(LOCAL_MAP).catch(()=>{});
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

function timeoutFetch(req,ms){
  return new Promise(resolve=>{
    let done=false;
    const t=setTimeout(()=>{ if(!done){done=true;resolve(null);} },ms);
    fetch(req).then(r=>{ if(!done){done=true;clearTimeout(t);resolve(r);} })
             .catch(()=>{ if(!done){done=true;clearTimeout(t);resolve(null);} });
  });
}

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.hostname.includes("tile.openstreetmap.org"))return;
  const isDoc=req.mode==="navigate"||/\.html$/.test(url.pathname)||url.pathname.endsWith("/");

  if(isDoc){
    e.respondWith((async()=>{
      // обходим HTTP-кэш GitHub Pages, иначе обновления приходят с задержкой до 10 минут
      const net=await timeoutFetch(new Request(req.url,{cache:"no-store"}),7000);
      if(net){
        const cp=net.clone();
        caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});
        return net;
      }
      const hit=await caches.match(req);
      if(hit)return hit;
      const fallback=await caches.match("./index.html");
      if(fallback)return fallback.clone();
      return Response.error();
    })());
    return;
  }

  e.respondWith((async()=>{
    const hit=await caches.match(req);
    if(hit)return hit;
    const net=await timeoutFetch(req,5000);
    if(net){
      const cp=net.clone();
      caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});
      return net;
    }
    return new Response("",{status:504,statusText:"offline"});
  })());
});
