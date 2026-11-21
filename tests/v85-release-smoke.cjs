'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','anime.html','watch.html','match.html','profile.html','account.html','history.html','collections.html','kodik.html','manga.html','movies.html','messages.html','community.html','explore.html','updates.html','reading.html','journal.html','universe.html','music.html','taste.html','eras.html','secrets.html','story-dna.html','studios.html','festivals.html','quotes.html'];
test('V85 theme enabled on all 26 core pages',()=>{
 for(const page of pages){
  const html=read(page);
  assert.equal(html.split('av-visual-85.css?v=85.0').length-1,1,page);
  assert.equal(html.split('av-visual-85.js?v=85.0').length-1,1,page);
 }
});
test('V85 home navigation and PWA install survives hero replacement',()=>{
 const js=read('av-visual-85.js');
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'av-visual-85.js'}));
 for(const name of ['av85-journey','app.html','history.html','explore.html','profile.html#profileWorkshop','#av77Install'])
  assert.ok(js.includes(name),name);
 assert.match(js,/side\.append\(install\)/);
 assert.match(read('index.html'),/id="search"/);
});
test('V93 Android landing links only to verified GitHub preview, not RuStore checkout',()=>{
 const html=read('app.html');
 assert.match(html,/не релиз RuStore/);
 assert.match(html,/оплата, подписки и платные функции не подключены/);
 assert.match(html,/releases\/download\/v2\.3\.0-beta1\/animevoid-v93-preview\.apk/);
 assert.match(html,/av-visual-85.css\?v=85\.0/);
 assert.doesNotMatch(html,/rustore\.ru\/catalog\/app\/ru\.animevoid\.app/);
});
test('V85 offline assets are precached with fresh version',()=>{
 const sw=read('service-worker.js');
 assert.match(sw,/av-AV-core-v85\.0/);
 for(const asset of ['av-visual-85.css?v=85.0','av-visual-85.js?v=85.0','app.html'])
  assert.ok(sw.includes(asset),asset);
 assert.doesNotThrow(()=>new vm.Script(sw,{filename:'service-worker.js'}));
});
test('native version has genuine free theme selector and no fake paid unlock',()=>{
 const build=read('android-app/app/build.gradle');
 const java=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 assert.match(build,/versionCode (?:2|3|4|5|6|7|8)/);assert.match(build,/versionName '(?:1\.(?:1|2|3)|2\.(?:0|1|2|3))\.0'/);
 for(const item of ['chooseAccent','accentFor','getSharedPreferences','оплата и подписки не подключены'])assert.ok(java.includes(item),item);
 assert.doesNotMatch(java,/addJavascriptInterface|purchaseProduct\(/);
});
