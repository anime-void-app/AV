/* ANIME VOID V77 -- product regression suite */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const core=require('../av-match-core-77.js');
test('version scripts parse',()=>{
 for(const p of ['av-match-core-77.js','av-match-77.js','av-home-77.js','av-party-76.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
test('new PWA manifest is valid; existing catalog manifest is retained',()=>{
 const app=JSON.parse(read('app.webmanifest')),cat=JSON.parse(read('manifest.json'));
 assert.equal(app.display,'standalone');
 assert.equal(app.id,'/index.html');assert.equal(app.scope,'/');
 assert.ok(app.icons.some(x=>x.sizes==='192x192'));
 assert.ok(app.icons.some(x=>x.sizes==='512x512'));
 assert.ok(app.shortcuts.some(x=>x.url==='/match.html'));
 assert.equal(cat.provider,'Kodik');
});
test('all major HTML routes link to PWA manifest',()=>{
 for(const p of ['index.html','profile.html','watch.html','anime.html','match.html','party.html','history.html','account.html','kodik.html']){
  assert.match(read(p),/app\.webmanifest\?v=77\.0/);
  assert.doesNotMatch(read(p),/href="manifest\.json"/);
 }
});
test('real genre intersection is required and duplicates/adult titles excluded',()=>{
 const data=[
  {id:10,title:{english:'First'},genres:['Romance','Comedy'],averageScore:82,isAdult:false},
  {id:11,title:{romaji:'Second'},genres:['Romance'],averageScore:90,isAdult:false},
  {id:12,title:{english:'Hidden'},genres:['Romance','Comedy'],averageScore:99,isAdult:true},
  {id:10,title:{english:'Duplicate'},genres:['Romance','Comedy'],averageScore:100}
 ];
 const picks=core.rank(data,['Romance'],['Comedy'],24);
 assert.equal(picks.length,1);assert.equal(picks[0].id,10);
 assert.equal(core.rank(data,[],['Comedy']).length,0);
 assert.deepEqual(core.normalizeGenres(['Romance','Romance','Comedy','Fantasy','Drama','invalid']),['Romance','Comedy','Fantasy']);
});
test('public link contains only validated genres',()=>{
 const query=core.buildParams(['Romance','Fantasy'],['Action','invalid']);
 assert.deepEqual(core.parsePrefs('?'+query),{a:['Romance','Fantasy'],b:['Action']});
 assert.deepEqual(core.parsePrefs('?a=%3Cscript%3E&b=Comedy'),{a:[],b:['Comedy']});
});
test('homepage is accessible and old features remain present',()=>{
 const h=read('index.html'),js=read('av-home-77.js'),css=read('av-home-77.css');
 assert.match(h,/id="av77Main"/);assert.match(h,/href="#av77Main"/);
 assert.match(h,/av-home-77\.js\?v=77\.0/);
 assert.match(h,/id="catalog"/);assert.match(h,/id="favorites"/);assert.match(h,/id="continueSection"/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(js,/beforeinstallprompt/);assert.match(js,/img\.loading='lazy'/);
 assert.equal((h.match(/<main\b/g)||[]).length,1);
 assert.equal((h.match(/<\/main>/g)||[]).length,1);
});
test('match links do not assert unsupported playback and use correct saved ids',()=>{
 const js=read('av-match-77.js');
 assert.match(js,/available\.has\('anilist-'\+item\.id\)/);
 assert.match(js,/encodeURIComponent\(localIds\.get\(item\.id\)\)/);
 assert.match(js,/https:\/\/anilist\.co\/anime\//);
 assert.doesNotMatch(js,/supabase|service_role|av_watch_party_rooms/i);
 assert.match(read('match.html'),/id="matchGenresA"/);
 assert.match(read('match.html'),/id="matchGenresB"/);
 assert.match(read('av-match-77.css'),/@media\(max-width:370px\)/);
});
test('cache and release notes are versioned; old party player remains wired',()=>{
 const sw=read('service-worker.js');
 assert.match(sw,/av-AV-core-v77\.0/);
 for(const f of ['app.webmanifest?v=77.0','match.html','av-match-77.js?v=77.0','av-home-77.js?v=77.0'])assert.ok(sw.includes(f));
 assert.match(read('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(read('watch.html'),/av-kodik-test\.js\?v=67\.0/);
 assert.match(read('updates.html'),/<strong>77\.0<\/strong>/);
 assert.match(read('sitemap.xml'),/animevoid\.ru\/match\.html/);
});
