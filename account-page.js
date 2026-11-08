(()=>{'use strict';const $=id=>document.getElementById(id),A=window.AVAccount,t=A.t;let mode='login',pending=false;
function showPanel(value){if(!['overview','settings','cloud','security'].includes(value))value='overview';for(const p of document.querySelectorAll('[data-account-panel]'))p.hidden=p.dataset.accountPanel!==value;for(const b of document.querySelectorAll('[data-account-tab]')){if(b.dataset.accountTab===value)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
for(const b of document.querySelectorAll('[data-account-tab]'))b.onclick=()=>{location.hash=b.dataset.accountTab;showPanel(b.dataset.accountTab);};
addEventListener('hashchange',()=>showPanel(location.hash.slice(1)));showPanel(location.hash.slice(1));
$('openInterfaceSettings').onclick=()=>window.AVInterface.open();
$('settingsLanguage').onclick=()=>{window.AVSiteI18n24.set(document.documentElement.lang==='en'?'ru':'en');location.reload();};
$('startPasswordRecovery').onclick=()=>{showPanel('overview');location.hash='overview';tab('recover');$('authSection').hidden=false;$('accountMail').value=A.state().user?.email||'';$('accountMail').focus();};
function feedback(text){$('accountFeedback').textContent=text;}
if(!['animevoid.ru','localhost','127.0.0.1'].includes(location.hostname.toLowerCase())){
 const note=document.createElement('p');
 note.className='muted';
 const label=document.createElement('span');
 label.textContent=t('Google-вход работает на основном домене. Локальные данные с этого адреса не переносятся автоматически. ','Google sign-in uses the primary domain. Local data on this address will not transfer automatically. ');
 const link=document.createElement('a');link.href='https://animevoid.ru/account.html';
 link.textContent='animevoid.ru/account.html';
 note.append(label,link);
 $('googleLogin').insertAdjacentElement('afterend',note);
}
async function run(fn){
 if(pending)return;
 pending=true;
 // Preserve controls disabled by permissions or unavailable cloud data.
 const buttons=[...document.querySelectorAll('button')];
 const originallyDisabled=new Map(buttons.map(button=>[button,button.disabled]));
 buttons.forEach(button=>{button.disabled=true;});
 feedback('');
 return (async()=>{
  try{await fn();}
  catch(e){
   const message=String(e?.message||e);
   feedback(/email not confirmed/i.test(message)?
      t('Адрес почты ещё не подтверждён. Открой письмо подтверждения или войди через Google с подтверждённым адресом.',
        'Email not confirmed. Open the confirmation email or sign in through Google with a verified address.'):
      message);
  }
  finally{
   pending=false;
   buttons.forEach(button=>{if(button.isConnected)button.disabled=originallyDisabled.get(button);});
   render();
  }
 })();
}
function tab(value){mode=value;for(const m of ['login','register','recover'])$(m+'Tab').setAttribute('aria-selected',String(m===mode));$('passwordLabel').hidden=mode==='recover';$('accountPassword').required=mode!=='recover';$('accountPassword').autocomplete=mode==='register'?'new-password':'current-password';$('accountPassword').minLength=mode==='register'?12:1;$('consentLabel').hidden=mode!=='register';$('accountConsent').required=mode==='register';$('emailSubmit').textContent=mode==='register'?t('Создать аккаунт','Create account'):mode==='recover'?t('Отправить письмо','Send recovery email'):t('Войти','Sign in');}
function render(){
 const s=A.state(),signed=!!s.user,verifying=!signed&&['checking','reloading'].includes(s.phase);
 const cloudIssue=signed&&['error','offline','conflict','choose'].includes(s.phase);
 $('accountStatus').dataset.phase=s.phase;
 $('accountStatus').textContent=signed?
  (cloudIssue?
   t('✓ Вход выполнен. Проблема с облачными сохранениями — аккаунт не отключён. ',
     '✓ Signed in. Cloud saves need attention, but your account is connected. ')+(s.message||''):
   t('✓ Вход выполнен. ','✓ Signed in. ')+(s.message||'')):
  (s.message||({checking:t('Проверяем сохранённый вход…','Checking saved sign-in…'),
     guest:t('Войдите в аккаунт.','Sign in to your account.')}[s.phase]||s.phase));
 $('authSection').hidden=signed||verifying;
 $('signedSection').hidden=!signed;
 $('accountEmail').textContent=s.user?.email||'';
 $('sessionPersistence').textContent=signed?
   t('Аккаунт подтверждён. Вход не зависит от облачного сохранения.',
     'Account verified. Your login is independent of cloud-save syncing.'):'';
 $('accountCloudWarning').hidden=!cloudIssue;
 $('accountCloudWarningText').textContent=cloudIssue?
   t('Ты остаёшься в аккаунте. В разделе «Сохранение» можно сравнить копии и восстановить данные без повторного входа.',
     'You are still signed in. Use Saving to compare backups and recover without signing in again.'):'';
 $('loadCloud').disabled=pending||!s.remoteRevision;
 $('saveDevice').disabled=pending||s.phase==='checking';
 $('recoveryForm').hidden=sessionStorage.getItem('avAccountRecovery')!=='1';
 $('logoutAccount').hidden=!signed;
 if(sessionStorage.getItem('avAccountRecovery')==='1')showPanel('security');
}

for(const node of document.querySelectorAll('[data-ru]')){const text=node.dataset[document.documentElement.lang==='en'?'en':'ru'];if(node.tagName==='H1'){node.replaceChildren(...text.split('<br>').flatMap((v,i)=>i?[document.createElement('br'),document.createTextNode(v)]:[document.createTextNode(v)]));}else node.textContent=text;}
for(const m of ['login','register','recover'])$(m+'Tab').onclick=()=>tab(m);
$('accountLanguage').onclick=()=>{window.AVSiteI18n24.set(document.documentElement.lang==='en'?'ru':'en');location.reload();};
$('googleLogin').onclick=()=>run(async()=>{const button=$('googleLogin');button.setAttribute('aria-busy','true');feedback(t('Переходим к Google…','Opening Google sign-in…'));try{await A.google();}finally{button.removeAttribute('aria-busy');}});
$('accountForm').onsubmit=e=>{e.preventDefault();if(!$('accountForm').reportValidity())return;run(async()=>{const mail=$('accountMail').value.trim(),pass=$('accountPassword').value;if(mode==='recover'){await A.recover(mail);feedback(t('Если адрес зарегистрирован, придёт письмо. Откройте ссылку в этом же браузере.','If registered, this address will receive an email. Open the link in this same browser.'));}else if(mode==='register'){if(!$('accountConsent').checked)throw Error(t('Подтвердите согласие.','Confirm consent.'));const signed=await A.register(mail,pass);$('accountPassword').value='';if(signed)await A.restore();else feedback(t('Проверьте почту и подтвердите адрес. Откройте ссылку в этом же браузере.','Check your email and confirm your address. Open the link in this same browser.'));}else{await A.login(mail,pass);$('accountPassword').value='';}});};
$('recoveryForm').onsubmit=e=>{e.preventDefault();if(!$('recoveryForm').reportValidity())return;run(async()=>{await A.password($('newPassword').value);$('newPassword').value='';feedback(t('Пароль обновлён.','Password updated.'));});};
$('saveDevice').onclick=()=>run(()=>A.choose('local'));$('loadCloud').onclick=()=>run(()=>A.choose('cloud'));$('retryAccount').onclick=()=>run(()=>A.restore());$('logoutAccount').onclick=()=>run(()=>A.logout());$('downloadAccountBackup').onclick=()=>run(()=>AVSafe.exportBackup());$('downloadPendingRecovery').onclick=()=>run(()=>A.exportRecovery('pending'));$('downloadSafetyRecovery').onclick=()=>run(()=>A.exportRecovery('safety'));
$('accountCloudWarningButton').onclick=()=>{
 showPanel('cloud');location.hash='cloud';$('accountAdvanced').open=true;
};
addEventListener('pageshow',event=>{if(event.persisted)void A.restore();});
addEventListener('av:account-state',render);addEventListener('av:cloud-restored',ev=>{if(!ev.detail?.automatic){$('reloadAfterRestore').hidden=false;showPanel('cloud');}});tab('login');render();})();
