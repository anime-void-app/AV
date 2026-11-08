/* ANIME VOID V69.0 — original-download policy and release smoke tests.
   Run from checkout: node --test tests/v69-downloads-smoke.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
function policy(){
 const context=vm.createContext({window:{},URL});
 new vm.Script(source('av-download-policy-69.js'),{filename:'av-download-policy-69.js'}).runInContext(context);
 return context.window.AVDownloadPolicy69;
}
function licensed(){
 return {
  id:'owner-source',animeId:'anilist-4224',allowOriginalDownload:true,
  episodes:[{number:1,originalFile:{
   licensed:true,original:true,format:'mkv',
   url:'https://cdn.example.org/owned-original.mkv',filename:'Toradora-S01E01.mkv'
  }}]
 };
}
const base='https://animevoid.ru/watch.html?id=4224&episode=1';
test('an explicitly authorized original file gets a direct unchanged HTTPS link',()=>{
 const d=policy().resolve([licensed()],'4224',1,'owner-source',base);
 assert.equal(d.href,'https://cdn.example.org/owned-original.mkv');
 assert.equal(d.filename,'Toradora-S01E01.mkv');
 assert.equal(d.format,'mkv');
 assert.equal(d.sameOrigin,false);
});
test('playback permission alone does not authorize copying',()=>{
 const p=policy(),s=licensed();
 delete s.allowOriginalDownload;
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
 s.allowOriginalDownload=true;
 s.episodes[0].originalFile.licensed=false;
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
 s.episodes[0].originalFile.licensed=true;
 s.episodes[0].originalFile.original=false;
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
});
test('unsafe URLs, unknown formats and wrong episodes are rejected',()=>{
 const p=policy(),s=licensed();
 s.episodes[0].originalFile.url='javascript:alert(1)';
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
 s.episodes[0].originalFile.url='http://cdn.example.org/file.mkv';
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
 s.episodes[0].originalFile.url='https://cdn.example.org/file.mkv';
 s.episodes[0].originalFile.format='m3u8';
 assert.equal(p.resolve([s],'4224',1,'owner-source',base),null);
 s.episodes[0].originalFile.format='mkv';
 assert.equal(p.resolve([s],'4224',2,'owner-source',base),null);
 assert.equal(p.resolve([s],'bad-id',1,'owner-source',base),null);
});
test('unsafe filenames fall back to generated names',()=>{
 const s=licensed();
 s.episodes[0].originalFile.filename='../secret.mkv';
 const d=policy().resolve([s],'4224',1,'owner-source',base);
 assert.equal(d.filename,'ANIME-VOID-4224-E01.mkv');
});
test('download UI is clearly conditional and contains no stream extraction',()=>{
 const ui=source('av-download-69.js'),p=source('av-download-policy-69.js');
 assert.match(ui,/link\.hidden=true/);
 assert.match(ui,/originalFile|исходный файл|original file/);
 assert.match(ui,/policy\.resolve/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=/);
 assert.doesNotMatch(p,/\.fetch\(/);
 assert.doesNotMatch(ui,/fetch\(/);
});
test('existing Kodik source does not claim an authorized original file',()=>{
 const data=source('player-sources.js');
 assert.doesNotMatch(data,/allowOriginalDownload\s*:\s*true/);
 assert.doesNotMatch(data,/originalFile\s*:/);
});
test('watch page and service-worker load the V69 modules in correct order',()=>{
 const html=source('watch.html'),sw=source('service-worker.js');
 for(const name of ['av-download-policy-69.js?v=69.0','av-download-69.js?v=69.0','av-download-69.css?v=69.0']){
  assert.ok(html.includes(name));
  assert.ok(sw.includes(name));
 }
 assert.ok(html.indexOf('av-download-policy-69.js?v=69.0')<html.indexOf('av-download-69.js?v=69.0'));
 assert.match(sw,/av-AV-core-v69\.0/);
 assert.match(source('updates.html'),/<strong>69\.0<\/strong>/);
});
test('new scripts parse without syntax errors',()=>{
 for(const name of ['av-download-policy-69.js','av-download-69.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(source(name),{filename:name}));
});
