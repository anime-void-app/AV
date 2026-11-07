/* ANIME VOID accounts: one PKCE client; verified identity; automatic, CAS-versioned PRIVATE app-state copies.
   A browser snapshot is not proof of a purchase or of any privileged server role. */
(()=>{'use strict';
const BASE='https://bszukonnqdujllmblwcw.supabase.co',KEY='sb_publishable_2vQbIxS-UHMuSwRJGKIBGA_TqxEiYsj',OWNER='avCloudDeviceOwnerV1',META='avCloudMetaV1:',UUID=/^[a-f0-9-]{36}$/i;
let client,identity=null,epoch=0,active=false,busy=false,restoring=false,timer,phase='checking',message='',remote=null,retryAt=0,retryDelay=3000;
let authFlowPending=false,authRecheckScheduled=false;
const t=(ru,en)=>document.documentElement.lang==='en'?en:ru;
const safe=()=>isSecureContext&&['https:','http:'].includes(location.protocol);
function needSecure(){if(!safe())throw Error(t('Сначала включите HTTPS для сайта. По HTTP вход и синхронизация заблокированы.','Enable HTTPS first. Sign-in and cloud sync are blocked over HTTP.'));}
// Auth callbacks may fire on tab refocus and after a PKCE/password exchange.
 // Never invalidate a *verified, unchanged* identity on a repeated SIGNED_IN event.
 function scheduleAuthRecheck(){
   if(authFlowPending||authRecheckScheduled)return;
   authRecheckScheduled=true;
   setTimeout(()=>{authRecheckScheduled=false;if(!authFlowPending)void restore();},0);
 }
 function getClient(){
   if(!client){
     needSecure();
     if(!window.supabase?.createClient)throw Error(t('Модуль входа не загрузился.','Auth library is unavailable.'));
     client=window.AVSharedSupabaseClient||window.supabase.createClient(BASE,KEY,{
       auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce',storageKey:'avSupabaseAuthV1'}
     });
     window.AVSharedSupabaseClient=client;
     client.auth.onAuthStateChange((event,session)=>{
       if(event==='PASSWORD_RECOVERY'){
         try{sessionStorage.setItem('avAccountRecovery','1');}catch{}
       }
       const incoming=session?.user?.id||null;
       if(event==='SIGNED_OUT'){
         // A real sign-out, not a routine token refresh.
         active=false;identity=null;remote=null;++epoch;status('guest');
         return;
       }
       if(event==='USER_UPDATED'&&incoming&&incoming===identity?.id){
         identity={...identity,email:session.user.email||identity.email};
         dispatchEvent(new CustomEvent('av:account-state',{detail:state()}));
         return;
       }
       if(event==='TOKEN_REFRESHED'&&incoming===identity?.id)return;
       if(event==='SIGNED_IN'&&incoming===identity?.id)return;
       if(incoming&&['SIGNED_IN','USER_UPDATED','TOKEN_REFRESHED'].includes(event)){
         scheduleAuthRecheck();
       }
     });
   }
   return client;
 }
function status(p,text=''){phase=p;message=text;paintSync();dispatchEvent(new CustomEvent('av:account-state',{detail:state()}));}
function paintSync(){const text=phase==='saved'?t('Сохранено','Saved'):phase==='saving'||phase==='checking'?t('Сохраняется…','Syncing…'):phase==='offline'?t('Нет связи · данные на устройстве','Offline · kept on device'):phase==='conflict'?t('Конфликт копий','Version conflict'):phase==='guest'?t('Войти','Sign in'):t('Проверить сохранение','Check sync');const profile=document.getElementById('profileAccountButton');if(profile){let n=document.getElementById('profileAccountSyncStatus');if(!n){n=document.createElement('span');n.id='profileAccountSyncStatus';n.setAttribute('role','status');n.style.cssText='display:inline-block;margin-left:10px;font-size:12px;opacity:.8';profile.after(n);}n.textContent=text;}const link=document.querySelector('.vi-sidebar a[href="account.html"]');if(link){link.title=text;let dot=link.querySelector('.av-account-sync-dot');if(!dot){dot=document.createElement('span');dot.className='av-account-sync-dot';dot.setAttribute('aria-hidden','true');dot.style.cssText='margin-left:auto;font-size:10px';link.append(dot);}dot.textContent='●';dot.style.color=phase==='saved'?'#87c7a0':phase==='offline'||phase==='conflict'||phase==='error'?'#ef9b89':'#a694a7';}}
function state(){return {phase,message,user:identity?{...identity}:null,active,busy,remoteRevision:remote?.revision||0};}
function meta(uid){try{return JSON.parse(localStorage.getItem(META+uid)||'null');}catch{return null;}}
function raw(){return window.AVSafe.snapshot();}
function validated(data){if(!Object.keys(data).length)return {};return {...AVSafe.validateBackup({app:'ANIME VOID',version:1,data:{...data}})};}
function canonical(d){return JSON.stringify(Object.fromEntries(Object.keys(d).sort().map(k=>[k,d[k]])));}
async function hash(d){const v=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(d)));return [...new Uint8Array(v)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function setMeta(uid,rev,digest){localStorage.setItem(META+uid,JSON.stringify({revision:rev,hash:digest}));}
function same(uid,e){return epoch===e&&identity?.id===uid;}
async function readRemote(uid){const r=await getClient().from('av_account_documents').select('revision,document,updated_at').eq('user_id',uid).maybeSingle();if(r.error)throw Object.assign(r.error,{status:r.status});return r.data||{revision:0,document:{},updated_at:null};}
function explain(e){if(['42P01','PGRST205','42883','PGRST202'].includes(e?.code))return t('Облачная база ещё не настроена. Выполните ACCOUNT-CLOUD-SETUP.sql в Supabase.','Cloud database is not configured. Run ACCOUNT-CLOUD-SETUP.sql in Supabase.');if(e?.code==='40001')return t('Есть другая версия данных. Автосохранение приостановлено: выберите нужную копию в аккаунте.','A different cloud revision exists. Autosave paused: choose a copy in Account.');return String(e?.message||e);}
async function withLock(fn){if(!navigator.locks?.request)throw Error(t('Для безопасного сохранения нужен актуальный браузер и HTTPS.','Safe sync requires a modern browser and HTTPS.'));return navigator.locks.request('av-account-cloud-sync-v1',fn);}
async function push(uid,e,expected,data){if(!same(uid,e)||localStorage.getItem(OWNER)!==uid)throw Error('Account changed; save cancelled');await keep('pending',uid,data);if(!same(uid,e)||localStorage.getItem(OWNER)!==uid)throw Error('Account changed; save cancelled');const r=await getClient().rpc('av_account_save',{p_expected_revision:expected,p_document:data,p_expected_user:uid});if(r.error)throw Object.assign(r.error,{status:r.status});if(!same(uid,e)||localStorage.getItem(OWNER)!==uid)return;const row=r.data?.[0];if(!Number.isSafeInteger(row?.revision)||row.revision!==expected+1)throw Error('Unverified save response');const digest=await hash(data);await baseline(uid,row.revision,data);if(!same(uid,e)||localStorage.getItem(OWNER)!==uid)return;setMeta(uid,row.revision,digest);remote={revision:row.revision,document:data,updated_at:row.updated_at};status('saved',t('Сохранено','Saved'));}
// Recovery copies are private browser storage, not a new source of server privileges.
function recoveryStore(){return new Promise((resolve,reject)=>{const q=indexedDB.open('anime-void-account-recovery-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('copies');q.onerror=()=>reject(q.error);q.onsuccess=()=>resolve(q.result);});}
async function disk(action,key,value){const db=await recoveryStore();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('copies',action==='get'?'readonly':'readwrite'),st=tx.objectStore('copies');let result;const q=action==='get'?st.get(key):st.put(value,key);q.onsuccess=()=>{result=q.result;};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||q.error||Error('Recovery storage failed'));});}finally{db.close();}}
async function keep(kind,uid,data){await disk('put',kind+':'+(uid||'guest'),{data,at:new Date().toISOString()});}
async function baseline(uid,rev,data){await disk('put','baseline:'+uid,{revision:rev,data});}
function networkError(e){return !navigator.onLine||e?.status>=500||/fetch|network|offline|connection|timeout|bad gateway|service unavailable|temporarily unavailable/i.test(String(e?.message||e));}
function failed(err){active=false;if(networkError(err)){retryAt=Date.now()+retryDelay;retryDelay=Math.min(60000,retryDelay*2);status('offline',t('Нет связи. Изменения на устройстве сохранены; отправим автоматически.','Offline. Changes are kept on this device and will sync automatically.'));}else status(err?.code==='40001'?'conflict':'error',explain(err));}
function equal(a,b){return a===b;}
// Three-way merge: independent keys merge; genuinely conflicting values are NEVER guessed.
function mergeCopies(base,local,cloud){const out={},conflicts=[];for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(cloud)])){let b=base[k],l=local[k],r=cloud[k],v;
 if(equal(l,r))v=l;else if(equal(l,b))v=r;else if(equal(r,b))v=l;
 else if(k==='animeVoidFavorites'||k.startsWith('watched_')){try{const bb=new Set(JSON.parse(b||'[]')),ll=new Set(JSON.parse(l||'[]')),rr=new Set(JSON.parse(r||'[]'));const arr=[];for(const x of new Set([...bb,...ll,...rr])){const B=bb.has(x),L=ll.has(x),R=rr.has(x);if(L===R?L:L===B?R:L)arr.push(x);}v=JSON.stringify(arr.sort((a,b)=>typeof a==='number'?a-b:String(a).localeCompare(String(b))));}catch{conflicts.push(k);}}
 else conflicts.push(k);if(v!==undefined)out[k]=v;
 }return {data:out,conflicts};}
async function automatic(uid,e){await withLock(async()=>{if(!same(uid,e))return;let owner=localStorage.getItem(OWNER);const cloud=await readRemote(uid);if(!same(uid,e))return;remote=cloud;const current=validated(raw()),digest=await hash(current),m=meta(uid);
 if(owner!==uid){
  await keep('safety',owner||uid,current);if(!same(uid,e))return;
  if(cloud.revision){const pending=await disk('get','pending:'+uid);if(m&&pending?.data&&m.revision===cloud.revision&&await hash(validated(pending.data))!==m.hash){await applyCloud(uid,e,{...cloud,document:validated(pending.data),pendingBase:cloud.document},digest,true);return;}await applyCloud(uid,e,cloud,digest,true);return;}
  if(owner){const pending=await disk('get','pending:'+uid);const own=pending?.data?validated(pending.data):{};await applyCloud(uid,e,{revision:0,document:own},digest,true);return;}
  // First login on an unclaimed device: adopt its existing progress automatically.
  await keep('pending',uid,current);if(!same(uid,e)||await hash(validated(raw()))!==digest)throw Error('Local data changed; retrying');
  localStorage.setItem(OWNER,uid);active=true;await push(uid,e,0,current);return;
 }
 if(!cloud.revision){active=true;await push(uid,e,0,current);return;}
 if(!m){if(!cloud.revision){active=true;await push(uid,e,0,current);return;}if(digest===await hash(validated(cloud.document))){await baseline(uid,cloud.revision,current);setMeta(uid,cloud.revision,digest);active=true;status('saved',t('Сохранено','Saved'));return;}await keep('pending',uid,current);status('conflict',t('Найдены две копии без общей версии. Обе сохранены; выберите нужную в восстановлении.','Two copies have no common baseline. Both are retained; choose a recovery copy.'));return;}
 if(digest===m.hash){if(cloud.revision!==m.revision){if(!cloud.revision){active=true;await push(uid,e,0,current);return;}await applyCloud(uid,e,cloud,digest,true);return;}await baseline(uid,m.revision,current);active=true;status('saved',t('Сохранено','Saved'));return;}
 if(cloud.revision===m.revision){active=true;await push(uid,e,m.revision,current);return;}
 await keep('pending',uid,current);const base=await disk('get','baseline:'+uid);if(!same(uid,e))return;
 if(base?.revision===m.revision){const merged=mergeCopies(base.data,current,validated(cloud.document));if(!merged.conflicts.length){const mergedData=validated(merged.data);await push(uid,e,cloud.revision,mergedData);if(!same(uid,e))return;await applyCloud(uid,e,{revision:remote.revision,document:mergedData},digest,true);return;}}
 status('conflict',t('Одни и те же данные изменены на двух устройствах. Обе копии сохранены.','The same data changed on two devices. Both copies are retained.'));
 });}
async function restore(){const e=++epoch,previous=identity;active=false;remote=null;status('checking',t('Синхронизация…','Syncing…'));try{needSecure();const r=await getClient().auth.getSession();if(r.error)throw r.error;if(e!==epoch)return;if(!r.data.session){identity=null;status('guest');return;}const checked=await getClient().auth.getUser();if(checked.error)throw checked.error;const u=checked.data.user;if(!UUID.test(u?.id||''))throw Error('Unverified identity');if(e!==epoch)return;identity={id:u.id,email:u.email||''};await automatic(u.id,e);retryDelay=3000;
 }catch(err){if(e!==epoch)return;if(networkError(err)&&!identity)identity=previous;failed(err);}}
async function applyCloud(uid,e,cloud,expectedHash,auto=false){const data=validated(cloud.document),base=cloud.pendingBase?validated(cloud.pendingBase):data,digest=await hash(base);if(!same(uid,e)||await hash(validated(raw()))!==expectedHash)throw Error(t('Данные изменились во время загрузки. Повторяем синхронизацию.','Local data changed during download. Sync will retry.'));await keep('safety',localStorage.getItem(OWNER)||uid,validated(raw()));await baseline(uid,cloud.revision,base);if(!same(uid,e)||await hash(validated(raw()))!==expectedHash)throw Error('Local data changed; retrying');restoring=true;try{AVSafe.commitBackup(data,'replace');localStorage.setItem(OWNER,uid);setMeta(uid,cloud.revision,digest);}finally{restoring=false;}active=!auto&&cloud.revision>0;status(auto?'reloading':'saved',auto?t('Загружаем данные аккаунта…','Loading account data…'):t('Сохранено','Saved'));dispatchEvent(new CustomEvent('av:cloud-restored',{detail:{automatic:auto}}));
 if(auto){location.reload();}
}
async function save(){if(!active||busy||restoring||!identity||!safe())return;busy=true;const uid=identity.id,e=epoch;try{await withLock(async()=>{if(!same(uid,e)||localStorage.getItem(OWNER)!==uid){active=false;return;}const m=meta(uid);if(!m){active=false;return;}const data=validated(raw());if(await hash(data)===m.hash)return;await keep('pending',uid,data);status('saving',t('Сохраняется…','Saving…'));await push(uid,e,m.revision,data);});}catch(err){if(same(uid,e)){if(err?.code==='40001'){active=false;setTimeout(()=>restore(),0);}else failed(err);}}finally{busy=false;}}
async function tick(){if(busy||restoring||(phase==='checking'||phase==='reloading'))return;if(phase==='offline'&&Date.now()>=retryAt){await restore();return;}if(phase==='error'&&/Local data changed|Данные изменились/.test(message)){await restore();return;}await save();}

async function choose(mode){if(busy)throw Error('Busy');busy=true;active=false;const uid=identity?.id,e=epoch;if(!uid){busy=false;throw Error('Sign in first');}try{needSecure();await withLock(async()=>{if(!same(uid,e))return;const owner=localStorage.getItem(OWNER);if(mode==='local'&&owner&&owner!==uid)throw Error(t('Эти данные связаны с другим аккаунтом. Загрузите облачную копию своего аккаунта или используйте отдельный профиль браузера.','These local data belong to another account. Load your own cloud copy or use a separate browser profile.'));const current=validated(raw()),digest=await hash(current);const cloud=await readRemote(uid);if(!same(uid,e))return;remote=cloud;
 if(mode==='cloud'){if(!cloud.revision)throw Error(t('В этом аккаунте ещё нет облачной копии.','No cloud copy exists in this account yet.'));AVSafe.exportBackup();await applyCloud(uid,e,cloud,digest);return;}
 if(mode!=='local')throw Error('Invalid mode');if(!confirm(t('Сохранить текущие данные устройства в этом аккаунте? Если облачная копия есть, она будет заменена. Предыдущие 3 версии остаются на сервере.','Save this device data in this account? An existing cloud copy will be replaced. The last 3 versions are retained on the server.')))return;
 AVSafe.exportBackup();if(!same(uid,e)||await hash(validated(raw()))!==digest)throw Error('Data changed; retry');localStorage.setItem(OWNER,uid);await push(uid,e,cloud.revision,current);active=true;
 });}catch(err){status(err?.code==='40001'?'conflict':'error',explain(err));throw err;}finally{busy=false;dispatchEvent(new CustomEvent('av:account-state',{detail:state()}));}}
async function exportRecovery(kind){if(!identity||!['pending','safety'].includes(kind))throw Error(t('Сначала войдите в аккаунт.','Sign in first.'));const uid=identity.id,copy=await disk('get',kind+':'+uid);if(identity?.id!==uid)throw Error('Account changed');if(!copy?.data)throw Error(t('На этом устройстве нет такой копии.','This device has no such copy.'));const data=validated(copy.data),url=URL.createObjectURL(new Blob([JSON.stringify({app:'ANIME VOID',version:1,savedAt:copy.at,data},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='anime-void-recovery-'+kind+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function requireGoogleOrigin(){
   const host=location.hostname.toLowerCase();
   if(host==='animevoid.ru'||host==='localhost'||host==='127.0.0.1')return;
   throw Error(t('Для Google-входа откройте https://animevoid.ru/account.html. На другом домене браузер не передаёт код подтверждения входа.','Open https://animevoid.ru/account.html to sign in with Google. A different domain cannot share the login verification code.'));
 }
 function callbackURL(){return new URL('account.html',location.href).href.split('?')[0].split('#')[0];}
async function login(email,password){
   needSecure();
   authFlowPending=true;
   let result;
   try{result=await getClient().auth.signInWithPassword({email,password});}
   finally{authFlowPending=false;}
   if(result.error)throw result.error;
   await restore();
 }
async function register(email,password){
   needSecure();
   if(password.length<12)throw Error(t('Пароль — минимум 12 символов.','Use at least 12 characters.'));
   authFlowPending=true;
   let result;
   try{result=await getClient().auth.signUp({email,password,options:{emailRedirectTo:callbackURL()}});}
   finally{authFlowPending=false;}
   if(result.error)throw result.error;
   return !!result.data.session;
 }
async function google(){needSecure();requireGoogleOrigin();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);let disabled=false;try{const settings=await fetch(BASE+'/auth/v1/settings',{headers:{apikey:KEY},credentials:'omit',cache:'no-store',signal:controller.signal});if(settings.ok)disabled=(await settings.json()).external?.google===false;}catch{}finally{clearTimeout(timeout);}if(disabled)throw Error(t('Вход через Google пока выключен владельцем сайта. Нужно настроить Google OAuth и включить Google в Supabase → Authentication → Providers. Пока можно войти по почте.','Google sign-in is disabled by the site owner. Configure Google OAuth and enable Google in Supabase Authentication Providers. Email sign-in is available.'));const r=await getClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:callbackURL(),scopes:'openid email profile'}});if(r.error)throw r.error;}
async function recover(email){needSecure();const r=await getClient().auth.resetPasswordForEmail(email,{redirectTo:callbackURL()});if(r.error)throw r.error;}
async function password(value){needSecure();if(sessionStorage.getItem('avAccountRecovery')!=='1')throw Error(t('Сначала откройте ссылку восстановления из письма.','Open the recovery link from your email first.'));if(value.length<12)throw Error(t('Пароль — минимум 12 символов.','Use at least 12 characters.'));const r=await getClient().auth.updateUser({password:value});if(r.error)throw r.error;sessionStorage.removeItem('avAccountRecovery');}
async function logout(){if(busy||restoring||['saving','checking','reloading'].includes(phase))throw Error(t('Синхронизация ещё выполняется. Повторите выход после завершения.','Sync is still in progress. Retry sign-out when it finishes.'));await save();if(busy||restoring||['saving','checking','reloading'].includes(phase))throw Error(t('Синхронизация ещё выполняется. Повторите выход после завершения.','Sync is still in progress. Retry sign-out when it finishes.'));if(['offline','error','conflict'].includes(phase)){AVSafe.exportBackup();if(!confirm(t('Последние изменения не подтверждены облаком. Страховочная копия скачана. Выйти, оставив данные на устройстве?','Latest changes are not confirmed in cloud. A safety copy was downloaded. Sign out and keep local data?')))return false;}const r=await getClient().auth.signOut({scope:'local'});if(r.error)throw r.error;active=false;identity=null;++epoch;status('guest',t('Вы вышли. Данные остаются на этом устройстве; на общем компьютере очистите данные сайта после сохранения копии.','Signed out. Data remains on this device; clear site data on shared computers after saving a copy.'));return true;}
async function init(){
   try{
     needSecure();
     const url=new URL(location.href);
     if(url.pathname.endsWith('/account.html')){
       const failure=url.searchParams.get('error'),errorText=url.searchParams.get('error_description')||failure;
       const code=url.searchParams.get('code');
       let callbackError=null;
       if(code&&!failure){
         // The PKCE verifier stays in browser storage on the domain that started the flow.
         // Keep auth listeners from restoring a half-exchanged session.
         authFlowPending=true;
         try{
           const result=await getClient().auth.exchangeCodeForSession(code);
           if(result.error)throw result.error;
         }catch(error){callbackError=error;}
         finally{authFlowPending=false;}
       }
       // OAuth codes are single-use: remove on both success and failure to prevent replay.
       if(failure||code){
         for(const key of ['error','error_description','error_code','code','state','sb_flow_id'])url.searchParams.delete(key);
         history.replaceState(history.state,'',url.pathname+url.search+url.hash);
       }
       if(failure)throw Error(t('Google не завершил вход: ','Sign-in was not completed: ')+String(errorText||failure).slice(0,180));
       if(callbackError)throw Error(t('Не получилось подтвердить вход. Повторите вход с основного адреса animevoid.ru в том же браузере. ','Could not verify sign-in. Start again from animevoid.ru in the same browser. ')+String(callbackError.message||callbackError).slice(0,180));
     }
     await restore();
   }catch(err){status('error',explain(err));}
   timer=setInterval(tick,3000);
 }
window.AVAccount=Object.freeze({client:getClient,state,restore,choose,save,exportRecovery,login,register,google,recover,password,logout,t,open:()=>location.assign(new URL('account.html',location.href))});
addEventListener('storage',ev=>{if(ev.storageArea===localStorage&&ev.key==='avSupabaseAuthV1'&&!authFlowPending)scheduleAuthRecheck();});
addEventListener('storage',ev=>{if(ev.key===OWNER&&identity&&ev.newValue!==identity.id){active=false;++epoch;status('checking',t('Аккаунт изменён в другой вкладке.','Account changed in another tab.'));setTimeout(()=>restore(),0);}});
let editTimer;
function queueAutosave(){if(!active||restoring)return;clearTimeout(editTimer);editTimer=setTimeout(save,200);}
for(const event of ['input','change','click'])document.addEventListener(event,queueAutosave,true);
// The measured player ledger is written programmatically, not through DOM input events.
addEventListener('av:measured',queueAutosave);
const ACCOUNT_OWNED_KEY=/^(?:animeVoid[A-Za-z0-9_-]*|watched_(?:anilist-)?\d+|duration_[\w-]+|progress_[\w-]+)$/;
addEventListener('storage',ev=>{if(ev.key&&ACCOUNT_OWNED_KEY.test(ev.key))queueAutosave();});
addEventListener('online',()=>restore());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
