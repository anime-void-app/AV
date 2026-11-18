/* ANIME VOID V75 static regression tests. Run: node --test tests/v75-party-ux.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const load=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('scripts parse',()=>{for(const f of ['av-party-75.js','service-worker.js'])assert.doesNotThrow(()=>new vm.Script(load(f),{filename:f}));});
test('room code and keyboard inputs',()=>{
 const js=load('av-party-75.js');assert.match(js,/function extractInviteCode\(value\)/);
 assert.match(js,/clipboardData\?\.getData\('text'\)/);assert.match(js,/ui\.joinCode\.click\(\)/);
});
test('unread chats and tab keyboard navigation',()=>{
 const js=load('av-party-75.js'),html=load('party.html');
 for(const id of ['partyConnection','partyUnread'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/unreadChats=Math\.min\(99,unreadChats\+1\)/);
 assert.match(js,/ui\.voiceTab\.addEventListener\('keydown',onTabKey\)/);
});
test('old room chat acknowledgement cannot pollute another room',()=>{
 const js=load('av-party-75.js');
 assert.match(js,/const sendingRoom=roomId,sendingChannel=channel;/);
 assert.match(js,/roomId!==sendingRoom\|\|channel!==sendingChannel/);
});
test('PWA and changelog match V75',()=>{
 assert.match(load('party.html'),/av-party-75\.js\?v=75\.0/);
 assert.match(load('service-worker.js'),/av-AV-core-v75\.0/);
 assert.match(load('updates.html'),/<strong>75\.0<\/strong>/);
});