/* ANIME VOID 70.0 — licensed original file selection.
   From repo root: node --test tests/v70-download-options.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
const base='https://animevoid.ru/watch.html?id=4224&episode=1';
function api(){
 const sandbox=vm.createContext({window:{},URL});
 new vm.Script(src('av-download-policy-70.js')).runInContext(sandbox);
 return sandbox.window.AVDownloadPolicy70;
}
function owned(){
 return {id:'licensed-cdn',animeId:'anilist-4224',label:'Author CDN',allowOriginalDownload:true,episodes:[{
 number:1,files:[
 {licensed:true,original:false,quality:'1080p',format:'mp4',url:'https://cdn.example.org/ep1-1080.mp4',bytes:123456789,filename:'Episode-01-1080p.mp4'},
 {licensed:true,original:true,format:'mkv',url:'https://cdn.example.org/ep1-original.mkv',bytes:7654321098,filename:'Episode-01-Original.mkv'},
 {licensed:true,original:false,quality:'720p',format:'mp4',url:'https://cdn.example.org/ep1-720.mp4',bytes:1234567}
 ]}]};
}
test('true original first, quality variants and known exact size',()=>{
 const files=api().list([owned()],'4224',1,'licensed-cdn',base);
 assert.equal(files.length,3);
 assert.equal(files[0].original,true);
 assert.equal(files[0].quality,'original');
 assert.equal(files[0].format,'mkv');
 assert.equal(files[0].bytes,7654321098);
 assert.equal(files[1].quality,'1080p');
 assert.equal(files[2].quality,'720p');
 assert.equal(files[0].href,'https://cdn.example.org/ep1-original.mkv');
});
test('unknown size is not invented',()=>{
 const o=owned();delete o.episodes[0].files[2].bytes;
 const p=api(),files=p.list([o],'4224',1,'licensed-cdn',base);
 assert.equal(files[2].bytes,null);
 assert.match(p.formatSize(null),/неизвестен/);
});
test('permission and original metadata are required for every file',()=>{
 const p=api();
 const noPermission=owned();noPermission.allowOriginalDownload=false;
 assert.equal(p.list([noPermission],'4224',1,'licensed-cdn',base).length,0);
 const bad=owned();bad.episodes[0].files[0].licensed=false;
 bad.episodes[0].files[1].original='yes';
 bad.episodes[0].files[2].quality='4K download';
 assert.equal(p.list([bad],'4224',1,'licensed-cdn',base).length,0);
});
test('malicious URL, strange format and path traversal filenames are rejected',()=>{
 const p=api(),o=owned();
 o.episodes[0].files[0].url='javascript:alert(1)';
 o.episodes[0].files[1].format='m3u8';
 o.episodes[0].files[2].filename='../traversal.mp4';
 const files=p.list([o],'4224',1,'licensed-cdn',base);
 assert.equal(files.length,1);
 assert.equal(files[0].filename,'ANIME-VOID-4224-E01.mp4');
 assert.equal(p.list([owned()],'bad',1,'licensed-cdn',base).length,0);
 assert.equal(p.list([owned()],'4224',2,'licensed-cdn',base).length,0);
});
test('legacy originalFile is still supported',()=>{
 const o=owned();o.episodes[0].originalFile=o.episodes[0].files[1];delete o.episodes[0].files;
 const files=api().list([o],'4224',1,'licensed-cdn',base);
 assert.equal(files.length,1);assert.equal(files[0].original,true);
});
test('UI loads same-origin licensed catalog and uses native links',()=>{
 const js=src('av-download-70.js'),page=src('watch.html'),sw=src('service-worker.js');
 assert.match(js,/licensed-downloads\.json/);
 assert.match(js,/credentials:'same-origin'/);
 assert.match(js,/if\(file\.sameOrigin\)go\.download=file\.filename/);
 assert.match(js,/link|go\.href=file\.href/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.doesNotMatch(js,/MediaRecorder|MediaSource|\.m3u8|\.ts\b/);
 for(const name of ['av-download-policy-70.js','av-download-70.js','av-download-70.css'])
  assert.match(page,new RegExp(name.replaceAll('.','\\.')+'\\?v=70\\.0'));
 assert.match(sw,/av-AV-core-v70\.0/);
 assert.match(sw,/licensed-downloads\.json/);
});
test('shipped catalog has no invented provider files',()=>{
 const catalog=JSON.parse(src('licensed-downloads.json'));
 assert.equal(catalog.version,1);
 assert.deepEqual(catalog.sources,[]);
});
test('new JavaScript parses',()=>{
 for(const name of ['av-download-policy-70.js','av-download-70.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(src(name),{filename:name}));
});
