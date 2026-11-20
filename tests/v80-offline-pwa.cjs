'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const worker=read('service-worker.js');
const header=worker.slice(0,worker.indexOf('const PRELOAD_CONCURRENCY'));
const data=vm.runInNewContext(header+';({NEW_CORE,CORE_CACHE})');
test('new service worker parses and uses the V80 cache',()=>{
 assert.doesNotThrow(()=>new vm.Script(worker));
 assert.equal(data.CORE_CACHE,'av-AV-core-v81.0');
});
test('install uses the actual current home resources and no unnecessary old versions',()=>{
 const core=data.NEW_CORE;
 assert.ok(core.length<110&&core.length>55,'unexpected core count: '+core.length);
 assert.equal(new Set(core).size,core.length);
 let total=0;
 for(const entry of core){
  const p=entry.replace(/^\.\//,'').split(/[?#]/)[0];
  assert.ok(fs.existsSync(path.join(root,p)),'missing '+entry);
  total+=fs.statSync(path.join(root,p)).size;
 }
 assert.ok(total<3500000,'install shell bigger than 3.5MB: '+total);
 assert.ok(core.includes('offline.html')&&core.includes('index.html'));
 assert.ok(core.some(x=>x.startsWith('av-app-78.js?')));
 assert.ok(!core.includes('av-party-68.js?v=68.0'));
 assert.ok(!core.includes('vendor/hls.light-1.6.15.min.js?v=24.31'));
});
test('optional resource failure does not cancel installation but essential failure does',async()=>{
 async function attempt(failed){
  const listeners={},store=new Map();let activated=false;
  const cache={
   async put(k,r){store.set(k,r)},
   async match(k){return store.get(k)||undefined}
  };
  const mock={
   self:{addEventListener(k,fn){listeners[k]=fn},skipWaiting(){activated=true}},
   caches:{open:async()=>cache},
   fetch:async(asset)=>{if(asset===failed)throw new Error('offline '+failed);return {ok:true,body:asset}},
   URL,Response,console
  };
  vm.runInNewContext(worker,mock);
  let promise;listeners.install({waitUntil(p){promise=p}});
  let error=null;try{await promise}catch(e){error=e}
  return {error,activated,store};
 }
 const optional=data.NEW_CORE.find(x=>x.startsWith('av-home-77.js?'));
 const partial=await attempt(optional);assert.equal(partial.error,null);assert.equal(partial.activated,true);
 const blocked=await attempt('offline.html');assert.ok(blocked.error);assert.equal(blocked.activated,false);
});
test('navigation has a branded offline fallback and no playback rewrites',()=>{
 assert.match(worker,/cache\.match\("offline\.html"\)/);
 assert.match(worker,/status:503/);
 assert.match(worker,/LICENSED_AUDIO/);
 assert.ok(worker.includes("/kodik-data/"));
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('match.html'),/av-match-77\.js\?v=77\.0/);
});
test('offline page is self-contained and accessible',()=>{
 const html=read('offline.html');
 assert.match(html,/<html lang="ru">/);
 assert.match(html,/id="retry"/);
 assert.match(html,/id="home"/);
 assert.match(html,/prefers-reduced-motion|system-ui/);
 assert.doesNotMatch(html,/(?:src|href)="https?:|localStorage|supabase/i);
});
test('new release documentation exists',()=>{
 assert.match(read('updates.html'),/<strong>81\.0<\/strong>/);
});
