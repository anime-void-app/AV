'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pages=['index.html','profile.html','watch.html','anime.html','match.html','party.html','history.html','account.html','kodik.html'];
test('new app script parses',()=>assert.doesNotThrow(()=>new vm.Script(read('av-app-78.js'))));
test('all nine pages load one shared app shell',()=>{
 for(const page of pages){
  const s=read(page);
  assert.equal((s.match(/av-app-78\.js\?v=78\.0/g)||[]).length,1,page);
  assert.equal((s.match(/av-app-78\.css\?v=78\.0/g)||[]).length,1,page);
 }
});
test('mobile dock uses real routes and preserves party embed',()=>{
 const s=read('av-app-78.js');
 for(const route of ['index.html','match.html','party.html','profile.html'])assert.ok(s.includes(route));
 assert.match(s,/get\('party'\)==='1'/);
 assert.match(s,/window\.self!==window\.top/);
 assert.match(s,/input\.focus/);
 assert.match(s,/document\.createElement/);
 assert.doesNotMatch(s,/innerHTML|supabase|localStorage\.setItem|fetch\(/i);
});
test('homepage hub reuses existing sections without placeholders',()=>{
 const h=read('index.html'),s=read('av-app-78.js');
 for(const id of ['av77Main','continueSection','continueCard','calendarSection','favorites','search'])assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(s,/querySelector\('h3'\)/);
 assert.match(s,/getComputedStyle\(el\)\.display==='none'/);
});
test('accessible CSS supports small phones, reduced motion, keyboard and safe areas',()=>{
 const s=read('av-app-78.css');
 for(const token of ['max-width:370px','max-width:700px','prefers-reduced-motion','focus-visible','safe-area-inset-bottom','min-height:52px','@media print'])assert.ok(s.includes(token),token);
});
test('PWA and changelog are versioned without changing old modules',()=>{
 assert.match(read('service-worker.js'),/av-AV-core-v78\.0/);
 assert.match(read('service-worker.js'),/av-app-78\.js\?v=78\.0/);
 assert.match(read('updates.html'),/<strong>78\.0<\/strong>/);
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('index.html'),/av-home-77\.js\?v=77\.0/);
});
