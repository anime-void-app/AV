/* ANIME VOID V71.0 — regression checks for connected watch-party rooms.
   Run locally: node --test tests/v71-party-reliability.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
const js=()=>file('av-party-71.js');
test('party script and service worker parse',()=>{
 for(const name of ['av-party-71.js','service-worker.js']){
  assert.doesNotThrow(()=>new vm.Script(file(name),{filename:name}));
 }
});
test('HTML wires new controls and script without losing existing room and voice UI',()=>{
 const html=file('party.html');
 for(const id of ['partyReconnect','partyPlayerStatus','partySound','partyVoiceRetry',
  'partyCreate','partyFrame','partyChatForm','partyMic','partyMute','partyMessages']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/av-party-71\.js\?v=71\.0/);
 assert.match(html,/av-party-71\.css\?v=71\.0/);
 assert.doesNotMatch(html,/av-party-68\.js\?v=68\.0/);
});
test('host playback updates are limited to the exact current episode',()=>{
 assert.match(js(),/\.eq\('episode',expectedEpisode\)/);
 assert.match(js(),/room\?\.episode!==expectedEpisode/);
 assert.match(js(),/publishInFlight/);
 assert.match(js(),/\.maybeSingle\(\)/);
});
test('video attachment waits for async player and identifies unsupported providers',()=>{
 assert.match(js(),/setInterval\(probe,400\)/);
 assert.match(js(),/providerManaged===true/);
 assert.match(js(),/p\.tagName!=='VIDEO'/);
 assert.match(js(),/clearInterval\(videoProbeTimer\)/);
});
test('chat only displays locally after confirmed send',()=>{
 const s=js();
 assert.match(s,/if\(await send\('chat',msg\)\)\{/);
 assert.match(s,/if\(state!=='ok'&&state\?\.status!=='ok'\)/);
 assert.match(s,/chatSending=true;ui\.input\.disabled=true/);
 assert.match(s,/message\.textContent=body/);
 assert.doesNotMatch(s,/\.innerHTML\s*=/);
});
test('closed rooms and failed joins release local video and permissions',()=>{
 const s=js();
 assert.match(s,/AV_ROOM_CLOSED/);
 assert.match(s,/await closeLocal\(/);
 assert.match(s,/if\(wasInserted\)/);
 assert.match(s,/detachVideo\(\);ui\.frame\.removeAttribute\('src'\)/);
 assert.match(s,/document\.body\.classList\.remove\('party-in-room'\)/);
});
test('reconnect and voice recovery do not request microphone automatically',()=>{
 const s=js();
 assert.match(s,/ui\.reconnect\.onclick=async/);
 assert.match(s,/ui\.sound\.onclick=async/);
 assert.match(s,/ui\.voiceRetry\.onclick=/);
 assert.match(s,/ui\.mic\.onclick=async/);
 assert.match(s,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(s,/micEnabled=false;micMuted=false/);
 assert.match(s,/present\(\)\.filter\(p=>p\.voice\)\.length>=4/);
});
test('new assets and release are included in PWA cache and changelog',()=>{
 const sw=file('service-worker.js');
 assert.match(sw,/av-AV-core-v71\.0/);
 assert.match(sw,/av-party-71\.js\?v=71\.0/);
 assert.match(sw,/av-party-71\.css\?v=71\.0/);
 assert.match(file('updates.html'),/<strong>71\.0<\/strong>/);
});
