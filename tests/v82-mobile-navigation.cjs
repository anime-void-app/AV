'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const all=["index.html","profile.html","anime.html","watch.html","account.html","history.html","collections.html","party.html","match.html","kodik.html","manga.html","movies.html","messages.html","community.html","explore.html","updates.html","reading.html"];
test('one shared app dock across 17 key pages',()=>{
 for(const p of all){
  const s=read(p);
  assert.equal(s.split('av-app-78.css?v=78.0').length-1,1,p+' CSS');
  assert.equal(s.split('av-app-78.js?v=78.0').length-1,1,p+' JS');
 }
});
test('compact CSS loaded once across home/watch/anime/profile',()=>{
 for(const p of ['index.html','watch.html','anime.html','profile.html'])
  assert.equal(read(p).split('av-mobile-82.css?v=82.0').length-1,1,p);
});
test('watch brand is full-width and real controls are accessible',()=>{
 const css=read('av-mobile-82.css');
 for(const mark of ['body.av-watch-page>header','.header-actions','white-space:nowrap!important',
  'flex-wrap:wrap!important','body.av-home>header','body.av-profile-page>header',
  'body.av-title-page>header','max-width:365px','max-width:760px','.av78-dock-label','prefers-reduced-motion'])
  assert.ok(css.includes(mark),'missing '+mark);
 assert.match(css,/grid-template-areas:"brand lang theme"/);
});
test('watch-party embed and existing playback/auth remain wired',()=>{
 const app=read('av-app-78.js'),watch=read('watch.html');
 assert.match(app,/get\('party'\)==='1'/);
 assert.match(app,/window\.self!==window\.top/);
 assert.match(watch,/av-video-81\.js\?v=81\.0/);
 assert.match(watch,/kodik-bridge\.js\?v=81\.0/);
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('account.html'),/av-account\.js\?v=73\.0/);
});
test('PWA CSS cache and release are versioned',()=>{
 const w=read('service-worker.js');
 assert.doesNotThrow(()=>new vm.Script(w));
 const c=vm.runInNewContext(w.slice(0,w.indexOf('const PRELOAD_CONCURRENCY'))+';({NEW_CORE,CORE_CACHE})');
 assert.equal(c.CORE_CACHE,'av-AV-core-v82.0');
 assert.ok(c.NEW_CORE.includes('av-mobile-82.css?v=82.0'));
 assert.equal(c.NEW_CORE.length,new Set(c.NEW_CORE).size);
 assert.match(read('updates.html'),/<strong>82\.0<\/strong>/);
 assert.match(read('V82_MOBILE_QA.md'),/backup\/pre-v82-mobile-navigation-20261120/);
});
