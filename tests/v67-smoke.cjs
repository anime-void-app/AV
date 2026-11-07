/* Run with: node tests/v67-smoke.cjs
   Static contracts only; manually test player providers and Google sign-in. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
test('every primary page loads the V67 responsive stylesheet',()=>{
 for(const page of ['index.html','profile.html','watch.html','history.html','account.html']){
  assert.match(file(page),/av-global-67\.css\?v=67\.0/,page);
 }
});
test('native player supports safe, in-place episode switching',()=>{
 const player=file('av-player.js');
 assert.match(player,/function selectEpisode\(number\)/);
 assert.match(player,/refreshLanguage,selectEpisode/);
 assert.match(player,/s\.episodes\.find\(e=>e\.number===episode\?\.number\)/);
 assert.ok(player.indexOf("params.get('episode')")<player.lastIndexOf("params.get('sourceEpisode')"));
 assert.match(file('av-kodik-test.js'),/av-player\.js\?v=67\.0/);
 assert.match(file('watch.html'),/selected===true\|\|selected\?\.then/);
});
test('last opened shortcut validates identity, artwork and episode',()=>{
 const home=file('index.html');
 assert.match(home,/AVState\.savedView\?\.\(\)\.items\?\.get\(canonicalLast\)/);
 assert.match(home,/Number\.isSafeInteger\(selectedEpisode\)/);
 assert.match(home,/String\(AVSafe\.escape\(posterSrc\)\)/);
 assert.match(home,/Последняя открытая серия/);
});
test('watch-history components react to local progress',()=>{
 for(const js of ['av-recent-48.js','av-dashboard-46.js','av-history-46.js']){
  assert.match(file(js),/addEventListener\('av:progress'/,js);
  assert.match(file(js),/addEventListener\('av:playback'/,js);
 }
});
test('service-worker and changelog use V67',()=>{
 assert.match(file('service-worker.js'),/av-AV-core-v67\.0/);
 assert.match(file('service-worker.js'),/av-global-67\.css\?v=67\.0/);
 assert.match(file('updates.html'),/<strong>67\.0<\/strong>/);
});
