/* ANIME VOID V72: session persistence and near-real-time watch-party sync.
   Run: node --test tests/v72-auth-party.cjs
   These tests cannot replace real Google OAuth or two-browser E2E. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
function sandbox(auth,storage){
 const data=storage||new Map();
 const localStorage={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)
 };
 const options={};
 const c={
  window:null,document:{
   readyState:'loading',documentElement:{lang:'ru'},
   addEventListener(){},getElementById(){return null;},querySelector(){return null;}
  },
  location:{protocol:'https:',pathname:'/account.html',hostname:'animevoid.ru',href:'https://animevoid.ru/account.html'},
  localStorage,isSecureContext:true,
  CustomEvent:class{constructor(){}},dispatchEvent(){},addEventListener(){},
  supabase:{createClient:(url,key,config)=>{options.value=config;return {auth};}}
 };
 c.window=c;
 new vm.Script(source('av-account.js'),{filename:'av-account.js'}).runInNewContext(c);
 return {a:c.AVAccount,options,storage:data};
}
test('two parallel restores share a single Supabase session read',async()=>{
 let release,requests=0;
 const auth={
  onAuthStateChange:()=>{},
  getSession(){requests++;return new Promise(done=>{release=done;});},
  getUser:async()=>({data:{user:null},error:null})
 };
 const {a,options}=sandbox(auth);
 const p1=a.restore(),p2=a.restore();
 await Promise.resolve();
 assert.equal(requests,1);
 release({data:{session:null},error:null});
 await Promise.all([p1,p2]);
 assert.equal(a.state().phase,'guest');
 assert.equal(options.value.auth.persistSession,true);
 assert.equal(options.value.auth.autoRefreshToken,true);
 assert.equal(options.value.auth.storageKey,'avSupabaseAuthV1');
});
test('successful password OAuth-style session must actually persist in storage',async()=>{
 const auth={
  onAuthStateChange:()=>{},
  getSession:async()=>({data:{session:null},error:null}),
  signInWithPassword:async()=>({data:{session:{user:{id:'mock-id'}}},error:null})
 };
 const {a}=sandbox(auth);
 await assert.rejects(a.login('example@example.org','x'),/сессия не сохранилась/);
});
test('authentication code exchange is manual PKCE and single-use',()=>{
 const s=source('av-account.js');
 assert.match(s,/flowType:'pkce'/);
 assert.match(s,/detectSessionInUrl:false/);
 assert.match(s,/exchangeCodeForSession\(code\)/);
 assert.match(s,/assertSessionSaved\(\)/);
 assert.match(s,/history\.replaceState\(history\.state/);
 assert.match(s,/authInitializing=false/);
 assert.match(s,/const autoReload=auto&&!location\.pathname\.endsWith\('\/account\.html'\)/);
});
test('OAuth and password registration preserve browser auth storage',()=>{
 const s=source('av-account.js');
 assert.match(s,/storage:localStorage/);
 assert.match(s,/storageKey:AUTH_KEY/);
 assert.match(s,/function ensureAuthStorage\(\)/);
 assert.match(s,/if\(result\.data\?\.session\)assertSessionSaved\(\)/);
 assert.match(s,/if\(restoreFlight\)await restoreFlight/);
});
test('account page does not flash guest form during session verification',()=>{
 const p=source('account-page.js'),h=source('account.html');
 assert.match(p,/const verifying=s\.phase==='checking'\|\|s\.phase==='reloading'/);
 assert.match(p,/\$\('authSection'\)\.hidden=verifying\|\|!!s\.user/);
 assert.match(h,/id="sessionPersistence"/);
 assert.match(h,/av-account\.js\?v=72\.0/);
 assert.match(h,/account-page\.js\?v=72\.0/);
});
test('host play/pause/seek sends immediately and state is checked by episode',()=>{
 const s=source('av-party-72.js');
 assert.match(s,/void publishPlayback\(true\);/);
 assert.match(s,/\.eq\('episode',expectedEpisode\)/);
 assert.match(s,/publishPending=true/);
 assert.match(s,/if\(publishPending\)\{/);
 assert.match(s,/setInterval\(\(\)=>\{/);
 assert.match(s,/\},1000\);/);
});
test('viewer corrects video position, paused frame and episode',()=>{
 const s=source('av-party-72.js');
 assert.match(s,/Math\.abs\(drift\)>=0\.75/);
 assert.match(s,/if\(!p\.paused\)p\.pause\(\)/);
 assert.match(s,/roomReceivedAt=Date\.now\(\)/);
 assert.match(s,/async function ensureViewerEpisode\(\)/);
 assert.match(s,/Date\.parse\(data\.updated_at\)<Date\.parse\(room\.updated_at\)/);
});
test('cross-page cache versions are refreshed for desktop and mobile',()=>{
 const h=source('party.html'),w=source('watch.html'),home=source('index.html'),sw=source('service-worker.js');
 assert.match(h,/av-party-72\.js\?v=72\.0/);
 for(const page of [h,w,home,source('profile.html')])assert.match(page,/av-account\.js\?v=72\.0/);
 assert.match(sw,/av-AV-core-v72\.0/);
 assert.match(sw,/av-party-72\.js\?v=72\.0/);
 assert.match(source('updates.html'),/<strong>72\.0<\/strong>/);
});
test('all modified JS parses',()=>{
 for(const name of ['av-account.js','account-page.js','av-party-72.js','service-worker.js'])
  assert.doesNotThrow(()=>new vm.Script(source(name),{filename:name}));
});
