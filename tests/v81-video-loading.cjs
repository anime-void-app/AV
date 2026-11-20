'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const core=require('../av-video-81.js');
test('local identity validates id and exact MAL mapping',()=>{
 assert.equal(core.localMal('anilist-16498',null,{id:'anilist-16498',mal:16498}),16498);
 assert.equal(core.localMal('anilist-9999',{id:'anilist-9999',idMal:35760},null),35760);
 assert.equal(core.localMal('anilist-99',{id:'anilist-100',idMal:55},{id:'anilist-99',mal:0}),null);
 assert.equal(core.localMal('anilist-0',{id:'anilist-0',idMal:22},null),null);
 assert.equal(core.safeMal('bad'),null);
});
test('verified local title does not invent episode counts',()=>{
 const item=core.fallbackTitle('anilist-16498',{id:'anilist-16498',mal:16498,ru:'Атака титанов',en:'Attack on Titan'});
 assert.equal(item.ruTitle,'Атака титанов');assert.equal(item.episodes,null);
 assert.equal(core.hasEpisodeCount(item),false);
 assert.equal(core.hasEpisodeCount({...item,episodes:24}),true);
 assert.equal(core.hasEpisodeCount({...item,format:'MOVIE'}),true);
});
test('bridge and helper scripts parse',()=>{
 for(const p of ['av-video-81.js','kodik-bridge.js','service-worker.js'])assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
test('Kodik resolves local MAL first, AniList is fallback only',()=>{
 const code=read('kodik-bridge.js');
 assert.match(code,/const locally=localKnown\(\)/);
 assert.match(code,/if\(locally\)return locally/);
 assert.match(code,/identity\.localMal/);
 assert.match(code,/C\.load/);
 assert.match(code,/C\.title/);
 assert.match(code,/control\.abort\(\)/);
 assert.match(code,/root\.style\.setProperty\('display','none','important'\)/);
 assert.match(code,/Повторить попытку/);
 assert.doesNotMatch(code,/proxy|bypass/i);
});
test('watch page loads local identity, no fabricated episode controls, and versioned bridge',()=>{
 const html=read('watch.html');
 assert.match(html,/av-video-81\.js\?v=81\.0/);
 assert.match(html,/kodik-bridge\.js\?v=81\.0/);
 assert.match(html,/AVVideoIdentity81\?\.fallbackTitle/);
 assert.match(html,/AVVideoIdentity81\?\.hasEpisodeCount/);
 assert.match(html,/metadataState='error';applyLanguage\(\);return/);
 assert.match(html,/av-kodik-test\.js\?v=67\.0/);
});
test('release and cache are bumped, other player intact',()=>{
 assert.match(read('service-worker.js'),/av-AV-core-v81\.0/);
 assert.match(read('updates.html'),/<strong>81\.0<\/strong>/);
 assert.match(read('av-kodik-player.js'),/function partyControl/);
});
