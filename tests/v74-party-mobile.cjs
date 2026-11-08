/* ANIME VOID V74 watch-party and V73 mobile authentication regressions.
   Run: node --test tests/v74-party-mobile.cjs */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const load=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('all new JavaScript parses',()=>{
 for(const name of ['av-party-74.js','av-account.js','account-page.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(load(name),{filename:name}));
});
test('verified mobile account remains visible across cloud failures and reloads',async()=>{
 const cached=new Map(),uid='11111111-1111-4111-8111-111111111111';
 cached.set('avSupabaseAuthV1',JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:9999999999,user:{id:uid,email:'fixture@example.invalid'}}));
 const storage={getItem:k=>cached.get(k)??null,setItem:(k,v)=>cached.set(k,String(v)),removeItem:k=>cached.delete(k)};
 let n=0;
 const backend={auth:{
  getSession:async()=>{n++;return {data:{session:JSON.parse(cached.get('avSupabaseAuthV1'))},error:null};},
  getUser:async()=>({data:{user:{id:uid,email:'fixture@example.invalid'}},error:null}),
  onAuthStateChange:()=>({})
 },from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({error:{message:'network unavailable',status:503},status:503})})})})};
 function fresh(){
  const obj={window:null,
   document:{readyState:'loading',documentElement:{lang:'ru'},getElementById(){return null;},querySelector(){return null;},addEventListener(){}},
   location:{protocol:'https:',hostname:'animevoid.ru',pathname:'/account.html',href:'https://animevoid.ru/account.html'},
   localStorage:storage,navigator:{onLine:true},isSecureContext:true,
   supabase:{createClient:()=>backend},AVSafe:{snapshot:()=>({})},
   CustomEvent:class{},dispatchEvent(){},addEventListener(){},
   crypto:{subtle:{}},indexedDB:{},setTimeout:()=>1,setInterval:()=>1};
  obj.window=obj;
  new vm.Script(load('av-account.js')).runInNewContext(obj);
  return obj.AVAccount;
 }
 const before=fresh();await before.restore();
 const after=fresh();await after.restore();
 assert.ok(before.state().user&&after.state().user);
 assert.equal(after.state().phase,'offline');
 assert.equal(n,2);
 assert.ok(cached.has('avSupabaseAuthV1'));
});
test('mobile lock fallback is safe and cloud errors remain separate from authentication',()=>{
 const js=load('av-account.js'),view=load('account-page.js'),html=load('account.html');
 assert.match(js,/localLockTail=new Promise/);
 assert.match(js,/status\('authenticated'/);
 assert.match(js,/lastVerifiedAt=Date\.now\(\)/);
 assert.match(view,/\$\('signedSection'\)\.hidden=!signed/);
 assert.match(html,/id="accountCloudWarning"/);
 assert.match(html,/av-auth-73\.css\?v=73\.0/);
});
test('short invite code and standalone player controls are wired',()=>{
 const html=load('party.html'),js=load('av-party-74.js');
 for(const id of ['partyJoinCode','partyJoinByCode','partyRoomCode','partyCopyCode','partyStartPlayback','partyOpenPlayback'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/\.rpc\('av_party_join_by_code',\{p_code:code\}\)/);
 assert.match(js,/\.select\('id,host_id,anime_id,episode,playhead,is_playing,updated_at,invite_code'\)/);
 assert.match(js,/ui\.openPlayback\.href=standalone\.href/);
 assert.match(js,/video\.play\(\)/);
});
test('unsupported video source gives actionable message instead of indefinite loading',()=>{
 const js=load('av-party-74.js');
 assert.match(js,/noSource=Array\.isArray\(knownSources\)/);
 assert.match(js,/пока нет подключённого видеоисточника/);
 assert.match(js,/watchFrame\(true\)/);
 assert.match(js,/Kodik/);
});
test('room-code access is rate limited and hidden from anonymous visitors',()=>{
 const sql=load('PARTY_CODES_V74.sql');
 assert.match(sql,/security definer/i);
 assert.match(sql,/tries>8/);
 assert.match(sql,/revoke all on function/i);
 assert.match(sql,/to authenticated/i);
});
test('pages, service-worker and changelog point to this release',()=>{
 const room=load('party.html'),account=load('account.html'),sw=load('service-worker.js');
 assert.match(room,/av-party-74\.js\?v=74\.0/);
 assert.match(room,/av-party-74\.css\?v=74\.0/);
 assert.match(room,/av-account\.js\?v=73\.0/);
 assert.match(account,/account-page\.js\?v=73\.0/);
 assert.match(sw,/av-AV-core-v74\.0/);
 assert.match(sw,/ignoreSearch: !requireExactVersion/);
 assert.match(load('updates.html'),/<strong>74\.0<\/strong>/);
});
