'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','watch.html','anime.html','account.html','profile.html','party.html','match.html','history.html','kodik.html'];
test('client scripts and service worker parse',()=>{
 for(const p of ['av-update-79.js','av-app-78.js','av-party-76.js','av-match-77.js','service-worker.js'])assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}),p);
});
test('nine main pages have exactly one update banner script and stylesheet',()=>{
 for(const p of pages){
  const html=read(p);
  assert.equal(html.split('av-update-79.js?v=79.0').length-1,1,p);
  assert.equal(html.split('av-update-79.css?v=79.0').length-1,1,p);
 }
});
test('local HTML assets exist',()=>{
 for(const p of pages)for(const m of read(p).matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)){
  const ref=m[1];if(/^(?:https?:|\/\/|data:|blob:|#|\?|mailto:|tel:|javascript:|\$\{|%)/i.test(ref))continue;
  const clean=ref.split(/[?#]/)[0].replace(/^\.\//,'').replace(/^\//,'');
  if(!clean||clean.includes('{{')||clean.includes('<')||clean.includes('>'))continue;
  assert.ok(fs.existsSync(path.join(root,clean)),p+' missing '+ref);
 }
});
test('PWA prefetch is bounded and all core resources exist',()=>{
 const sw=read('service-worker.js');assert.match(sw,/av-AV-core-v79\.0/);
 assert.doesNotMatch(sw,/CORE_FILES/);assert.match(sw,/cache\.addAll\(NEW_CORE\)/);
 const top=sw.slice(0,sw.indexOf('self.addEventListener("install"'));
 const config=vm.runInNewContext(top+'\n({NEW_CORE,STUDIO_CACHE_LIMIT})');
 assert.ok(config.NEW_CORE.length>150&&config.NEW_CORE.length<260);
 assert.equal(config.STUDIO_CACHE_LIMIT,96);
 let sum=0;
 for(const ref of config.NEW_CORE){
  const p=ref.replace(/^\.\//,'').split(/[?#]/)[0];
  assert.ok(fs.existsSync(path.join(root,p)),p);
  sum+=fs.statSync(path.join(root,p)).size;
 }
 assert.ok(sum<8000000,'eager prefetch too heavy: '+sum);
});
test('studio art cache is bounded and updates never force reload',()=>{
 const sw=read('service-worker.js'),u=read('av-update-79.js');
 assert.match(sw,/caches\.open\(STUDIO_CACHE\)/);
 assert.match(sw,/trimImageCache\(cache,STUDIO_CACHE_LIMIT\)/);
 assert.match(u,/controllerchange/);assert.match(u,/dismissed=true/);
 assert.match(u,/location\.reload\(\)/);assert.doesNotMatch(u,/setInterval\(|innerHTML|supabase|localStorage/i);
});
test('existing features and release notes retained',()=>{
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('match.html'),/av-match-77\.js\?v=77\.0/);
 assert.match(read('index.html'),/av-home-77\.js\?v=77\.0/);
 assert.match(read('updates.html'),/<strong>79\.0<\/strong>/);
});
