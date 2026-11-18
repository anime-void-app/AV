/* ANIME VOID V76 — pure clock and party adapter regression checks. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const load=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const sync=require('../av-party-sync-76.js');
test('all release JS parses',()=>{for(const file of ['av-party-sync-76.js','av-party-76.js','av-kodik-player.js','av-kodik-test.js','service-worker.js'])assert.doesNotThrow(()=>new vm.Script(load(file),{filename:file}));});
test('stale provider playback is rejected only while playing',()=>{
 const state={providerManaged:true,episode:7,ready:true,position:12,playing:true,duration:1500,signalAgeMs:12000};
 assert.equal(sync.sampleProvider(state,7),null);
 assert.ok(sync.sampleProvider({...state,signalAgeMs:1000},7));
 assert.ok(sync.sampleProvider({...state,playing:false},7));
 assert.equal(sync.sampleProvider({...state,episode:8},7),null);
 assert.equal(sync.sampleProvider({...state,duration:0},7),null);
});
test('guest joins at shared position and catches up to room clock',()=>{
 const room={playhead:80,is_playing:true},sample={position:15,duration:1600,playing:false};
 const plan=sync.planFollower(room,sample,10000,12000);
 assert.ok(plan.target>82);
 assert.ok(plan.seek>82);
 assert.equal(plan.action,'play');
 assert.equal(plan.aligned,false);
});
test('paused host pauses guest and does not add elapsed playback',()=>{
 const p=sync.planFollower({playhead:130,is_playing:false},{position:130,duration:1600,playing:true},10000,20000);
 assert.equal(p.target,130);assert.equal(p.action,'pause');assert.equal(p.seek,null);
});
test('in sync follower requires no repeated seek or transport command',()=>{
 const p=sync.planFollower({playhead:80,is_playing:true},{position:81,duration:1600,playing:true},10000,11000);
 assert.equal(p.aligned,true);assert.equal(p.seek,null);assert.equal(p.action,null);
});
test('invalid data is never allowed to seek or play automatically',()=>{
 assert.equal(sync.target({playhead:-4,is_playing:true},1,2,1500),null);
 assert.equal(sync.planFollower({playhead:3,is_playing:true},{position:NaN,duration:1400,playing:false},1,2),null);
 assert.equal(sync.sampleProvider({providerManaged:true,episode:3,ready:true,position:0,duration:1000,signalAgeMs:Infinity,playing:true},3),null);
});
test('Kodik trusted signals and party-only commands are wired',()=>{
 const k=load('av-kodik-player.js'),p=load('av-party-76.js'),html=load('party.html');
 assert.match(k,/event\.origin!==ORIGIN\|\|event\.source!==frame\.contentWindow/);
 assert.match(k,/params\.get\('party'\)!=='1'/);
 assert.match(k,/partyControl,?/);
 assert.match(k,/lastPartyClockAt=Date\.now\(\)/);
 assert.match(p,/provider\.partyControl\?\.\('seek',decision\.seek\)/);
 assert.match(p,/sampleProvider\(provider\.state\(\),room\.episode\)/);
 assert.match(html,/id="partySyncMode"/);
});
test('room membership and previous features remain wired',()=>{
 const s=load('av-party-76.js');
 assert.match(s,/members\.filter\(person=>person\.ready\)/);
 assert.match(s,/\.rpc\('av_party_join_by_code'/);
 assert.match(s,/async function submitChat\(\)/);
 assert.match(s,/async function reconcilePeers\(users\)/);
 assert.match(s,/channel\.send\(\{type:'broadcast',event,payload\}\)/);
 assert.match(s,/\.eq\('host_id',user\.id\)\.eq\('episode',expectedEpisode\)/);
});
test('no data migrations and versioned resources',()=>{
 assert.match(load('party.html'),/av-party-sync-76\.js\?v=76\.0/);
 assert.match(load('party.html'),/av-party-76\.js\?v=76\.0/);
 assert.match(load('av-kodik-test.js'),/av-kodik-player\.js\?v=76\.0/);
 assert.match(load('service-worker.js'),/av-AV-core-v76\.0/);
 assert.match(load('updates.html'),/<strong>76\.0<\/strong>/);
});
