/* V83 — pure two-device clock simulation and room behavior regressions. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const clock=require('../av-party-sync-83.js');
const snapshot=(playhead,is_playing,updated_at='2026-11-20T15:00:00.000Z',episode=1)=>({
 id:'11111111-1111-4111-8111-111111111111',anime_id:'anilist-4224',episode,
 playhead,is_playing,updated_at
});
test('V83 scripts parse and entrypoint is wired',()=>{
 for(const file of ['av-party-83.js','av-party-sync-83.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
 const html=read('party.html');
 assert.match(html,/av-party-83\.js\?v=83\.0/);
 assert.match(html,/av-party-sync-83\.js\?v=83\.0/);
 assert.match(html,/av-party-83\.css\?v=83\.0/);
 assert.doesNotMatch(html,/src="av-party-76\.js/);
});
test('two viewers converge to the host clock after late entry',()=>{
 const room=snapshot(60,true),guest={kind:'html5',position:12,playing:false,duration:1420};
 const first=clock.planFollower(room,guest,1000,1800);
 assert.ok(first.seek>=60&&first.seek<62);
 assert.equal(first.action,'play');
 assert.equal(first.aligned,false);
 const next=clock.planFollower(room,{...guest,position:first.target+0.1,playing:true},1000,1900);
 assert.equal(next.action,null);
 assert.equal(next.seek,null);
 assert.equal(next.aligned,true);
});
test('pause and seek propagate without guessing a timer while paused',()=>{
 const room=snapshot(135,false),guest={kind:'html5',position:141,playing:true,duration:1450};
 const decision=clock.planFollower(room,guest,1000,7000);
 assert.equal(decision.target,135);
 assert.equal(decision.action,'pause');
 assert.equal(decision.seek,135);
 assert.equal(decision.rate,1);
});
test('a frozen host snapshot is not kept in sync forever',()=>{
 const room=snapshot(21,true),guest={kind:'html5',position:25,playing:true,duration:600};
 const d=clock.planFollower(room,guest,1000,12000);
 assert.equal(d.mode,'stale');assert.equal(d.seek,null);assert.equal(d.action,null);
});
test('old out-of-order database responses cannot rewind a room',()=>{
 const a=snapshot(80,true,'2026-11-20T15:00:05.000Z');
 const prior=snapshot(64,true,'2026-11-20T15:00:04.000Z');
 const old=clock.acceptSnapshot(a,prior,9500,10000);
 assert.equal(old.accept,false);assert.equal(old.receivedAt,9500);
 const duplicate=clock.acceptSnapshot(a,{...a},9500,10000);
 assert.equal(duplicate.accept,false);
 const latest=clock.acceptSnapshot(a,snapshot(81,true,'2026-11-20T15:00:06.000Z'),9500,10000);
 assert.equal(latest.accept,true);assert.equal(latest.receivedAt,10000);
});
test('unchanged polls preserve the extrapolation anchor',()=>{
 const row=snapshot(100,true,'2026-11-20T15:00:07.000Z');
 const poll=clock.acceptSnapshot(row,snapshot(100,true,'2026-11-20T15:00:08.000Z'),3200,4000);
 assert.equal(poll.accept,true);assert.equal(poll.receivedAt,3200);
 assert.ok(clock.target(row,3200,4500,1500)>101);
});
test('native and provider samples reject unverified time',()=>{
 assert.equal(clock.sampleProvider({providerManaged:true,episode:2,ready:true,position:10,duration:100,playing:true,signalAgeMs:9000},2),null);
 assert.ok(clock.sampleProvider({providerManaged:true,episode:2,ready:true,position:10,duration:100,playing:false,signalAgeMs:9000},2));
 assert.equal(clock.sampleProvider({providerManaged:true,episode:1,ready:true,position:10,duration:100,playing:true,signalAgeMs:10},2),null);
 assert.ok(clock.sampleNative({tagName:'VIDEO',hidden:false,currentSrc:'https://cdn.example/video.mp4',currentTime:10,duration:150,paused:false,ended:false}));
 assert.equal(clock.sampleNative({tagName:'VIDEO',hidden:false,currentSrc:'',currentTime:10,duration:150,paused:false,ended:false}),null);
});
test('source bridge is recognized, never mislabeled as missing native source',()=>{
 const src=read('av-party-83.js');
 assert.match(src,/getElementById\('avKodikBridge'\)/);
 assert.match(src,/embeddedBridge/);
 assert.match(src,/noSource=!bridge&&Array\.isArray/);
 assert.match(src,/ручной режим просмотра/);
});
test('host controls, code join, voice, chat and automatic recovery are wired',()=>{
 const src=read('av-party-83.js'),html=read('party.html');
 for(const id of ['partyHostPanel','partyHostPlay','partyHostPause','partyHostBack','partyHostForward','partyJumpEpisode','partyGoEpisode','partyShare','partyRoomQuality'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const p of ['function hostControl','scheduleReconnect','addEventListener(\'online\'','function reconcilePeers','async function submitChat','av_party_join_by_code','acceptSnapshot','channel.track'])
  assert.ok(src.includes(p),p);
 assert.match(src,/\.eq\('host_id',user\.id\)\.eq\('episode',expectedEpisode\)/);
 assert.match(src,/if\(reconnectTimer\)\{clearTimeout\(reconnectTimer\);reconnectTimer=null;\}/);
});
test('V83 does not relax RLS or invent direct video sources',()=>{
 const src=read('av-party-83.js');
 assert.doesNotMatch(src,/service_role|sb_secret_|create policy|execute_sql|stream extractor/i);
 assert.match(read('party.html'),/каждом устройстве отдельно/);
 assert.match(read('V83_PARTY_QA.md'),/Rave/);
 assert.match(read('service-worker.js'),/av-AV-core-v83\.0/);
 assert.match(read('updates.html'),/<strong>83\.0<\/strong>/);
});

test('anime title opens its own private party with one tap',()=>{
 const html=read('anime.html'),js=read('av-party-launch-83.js');
 assert.match(html,/av-party-launch-83\.js\?v=83\.0/);
 assert.match(html,/av-party-launch-83\.css\?v=83\.0/);
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/party\.html\?anime=/);
 assert.match(js,/anilist-/);
 assert.match(read('party.html'),/каталоге/);
 assert.doesNotMatch(js,/fetch\(|localStorage\.setItem|supabase/i);
});
