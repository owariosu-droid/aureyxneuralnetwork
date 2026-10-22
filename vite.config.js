import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
export default defineConfig({plugins:[{
 name:'nox-offline-shell',
 generateBundle(_,bundle){
  const assets=Object.keys(bundle).filter(name=>/\.(js|css)$/.test(name)).map(name=>`/${name}`);
  const version=createHash('sha256').update(JSON.stringify(Object.entries(bundle).map(([name,item])=>[name,item.type==='chunk'?item.code:String(item.source)]))).digest('hex').slice(0,16);
  const files=JSON.stringify(['/', '/manifest.webmanifest','/nox-icon.svg',...assets]);
  this.emitFile({type:'asset',fileName:'sw.js',source:`
const CACHE='nox-shell-${version}';
const FILES=${files};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nox-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/'))));return;
 }
 if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(event.request)));
});
`});
 }
}]});
