/* ANIME VOID 68.0 — static validation for the watch-party MVP.
   Usage: node --test tests/v68-party-smoke.cjs
   Does not claim real multi-browser connectivity tests. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
test('party page contains room, chat and voice UI',()=>{
 const page=source('party.html');
 for(const id of ['partyCreate','partyFrame','partyChatForm','partyMessages','partyMic','partyMute','partyPeople','partyCopy']){
  assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(page,/av-party-68\.js\?v=68\.0/);
});
test('realtime authorization and authenticated room membership are used',()=>{
 const js=source('av-party-68.js');
 assert.match(js,/auth\.getUser\(\)/);
 assert.match(js,/av_watch_party_members/);
 assert.match(js,/av_watch_party_rooms/);
 assert.match(js,/private:true/);
 assert.match(js,/realtime\.setAuth/);
});
test('voice requires explicit permission and supports stopping tracks',()=>{
 const js=source('av-party-68.js');
 assert.match(js,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(js,/RTCPeerConnection/);
 assert.match(js,/track\.stop\(\)/);
 assert.match(js,/function cleanupVoice\(/);
});
test('chat uses ephemeral broadcast and safe DOM text',()=>{
 const js=source('av-party-68.js');
 assert.match(js,/send\('chat',msg\)/);
 assert.match(js,/message\.textContent=body/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
});
test('watch page exposes invite action and embedded mode',()=>{
 const watch=source('watch.html'), nav=source('av-watch-57.js');
 assert.match(watch,/av-party-embed/);
 assert.match(nav,/party\.html\?anime=/);
 for(const page of ['index.html','profile.html'])
  assert.match(source(page),/av-layout-51\.js\?v=68\.0/);
});
test('assets are wired into the offline cache',()=>{
 const sw=source('service-worker.js');
 assert.match(sw,/av-AV-core-v68\.0/);
 assert.match(sw,/party\.html/);
 assert.match(sw,/av-party-68\.js\?v=68\.0/);
});
for(const p of ['av-party-68.js','av-watch-57.js','av-layout-51.js','av-home-53.js']){
 test('JavaScript parses: '+p,()=>{new (require('node:vm').Script)(source(p),{filename:p});});
}
