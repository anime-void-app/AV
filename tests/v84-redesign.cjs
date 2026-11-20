'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=["index.html","anime.html","watch.html","match.html","profile.html","account.html","history.html","collections.html","kodik.html","manga.html","movies.html","messages.html","community.html","explore.html","updates.html","reading.html","journal.html","universe.html","music.html","taste.html","eras.html","secrets.html","story-dna.html","studios.html","festivals.html","quotes.html"];
test('Nocturne stylesheet on 26 pages',()=>{for(const p of pages)assert.equal(read(p).split('av-visual-84.css?v=84.0').length-1,1,p)});
test('all room routes and entrance points retired',()=>{
 for(const p of ['index.html','anime.html','match.html','av-app-78.js','av-home-53.js','av-journey-81.js','av-match-77.js'])
  assert.doesNotMatch(read(p),/party\.html|av-party-launch-83/);
 for(const p of ['party.html','av-party-83.js','av-party-sync-83.js'])assert.equal(fs.existsSync(path.join(root,p)),false,p);
});
test('manifest and watch page have no party bootstrap',()=>{
 const m=JSON.parse(read('app.webmanifest'));
 assert.ok(m.shortcuts.every(x=>x.url!=='/party.html'));
 assert.match(read('watch.html'),/kodik-bridge\.js\?v=81\.0/);
 assert.doesNotMatch(read('watch.html'),/av-party-bridge-83|av-party-embed/);
});
test('existing shared scripts still parse',()=>{
 for(const p of ['av-app-78.js','av-home-53.js','av-journey-81.js','av-match-77.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
test('cache revision and main search are intact',()=>{
 assert.match(read('service-worker.js'),/av-AV-core-v84\.0/);
 assert.match(read('service-worker.js'),/av-visual-84\.css\?v=84\.0/);
 assert.match(read('index.html'),/id="search"/);
});
