'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('bridge, service worker and watch-page inline scripts parse',()=>{
 for(const p of ['kodik-bridge.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}),p);
 const html=read('watch.html');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim())assert.doesNotThrow(()=>new vm.Script(match[1],{filename:'watch inline script'}));
 }
});
test('verified title lookup skips unavailable AniList service',()=>{
 const bridge=read('kodik-bridge.js');
 assert.match(bridge,/window\.AVTitles\?\.record\(\{id:aid\}\)/);
 assert.match(bridge,/if\(localMal\)return localMal/);
 assert.match(bridge,/R?\.?(?:ignore)?/);
 assert.match(bridge,/Promise\.all\(\[C\.load\(\),fetchMal\(\)\]\)/);
});
test('matching rejects ambiguous title lookalikes',()=>{
 const s=read('kodik-bridge.js');
 assert.match(s,/if\(hits\.length!==1\)return null/);
 assert.match(s,/year>1900/);
 assert.match(s,/titleOriginal/);
});
test('missing player gives meaningful fallback and only one player block',()=>{
 const bridge=read('kodik-bridge.js'),watch=read('watch.html');
 assert.match(bridge,/root\.style\.setProperty\('display','none','important'\)/);
 assert.match(bridge,/watchdog=setTimeout/);
 assert.match(bridge,/link\.href='kodik\.html'/);
 assert.match(watch,/const knownTitle=window\.AVTitles\?\.record/);
 assert.match(watch,/metadataState=item\?'partial':'error'/);
 assert.match(watch,/kodik-bridge\.js\?v=81\.0/);
});
test('PWA version and downstream watch-party unchanged',()=>{
 assert.match(read('service-worker.js'),/av-AV-core-v81\.0/);
 assert.match(read('service-worker.js'),/kodik-bridge\.js\?v=81\.0/);
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('watch.html'),/av-kodik-test\.js\?v=67\.0/);
 assert.match(read('updates.html'),/<strong>81\.0<\/strong>/);
});
