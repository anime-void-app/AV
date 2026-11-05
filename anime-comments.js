/* v24.15 Public discussions. Verified auth, bounded RPCs, textContent-only rendering.
   No local-only messages, auto-rewards, private-backup or payment writes. */
(()=>{'use strict';if(window.__AVComments2415)return;window.__AVComments2415=true;
const KEY=/^(?:(?:anilist|shikimori|kinopoisk)-[1-9]\d{0,14}|kodik-(?:movie|serial)-[1-9]\d{0,14})$/;
const n=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
let client,mounted=null,mappingTicket=0;
function db(){if(client)return client;if(window.AVAccount?.client)return client=window.AVAccount.client();if(window.AVSharedSupabaseClient)return client=window.AVSharedSupabaseClient;
if(!window.supabase?.createClient)throw Error('Модуль входа не загрузился. Обнови страницу.');
client=window.supabase.createClient('https://bszukonnqdujllmblwcw.supabase.co','sb_publishable_2vQbIxS-UHMuSwRJGKIBGA_TqxEiYsj',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce',storageKey:'avSupabaseAuthV1'}});window.AVSharedSupabaseClient=client;return client;}
async function rpc(method,args){const control=new AbortController(),timer=setTimeout(()=>control.abort(),20000);try{const query=db().rpc(method,args);return await(typeof query.abortSignal==='function'?query.abortSignal(control.signal):query);}finally{clearTimeout(timer);}}
function explain(e){if(['PGRST202','PGRST205','42883','42P01'].includes(e?.code))return 'Обсуждения ещё не подключены к базе. Владельцу сайта нужно выполнить COMMENTS-SETUP.sql в Supabase.';
const msg=String(e?.message||e);if(msg.includes('30 seconds'))return 'Между сообщениями нужно подождать 30 секунд.';if(msg.includes('Confirm email'))return 'Сначала подтверди адрес почты.';if(msg.includes('Posting restricted'))return 'Публикация комментариев для этого аккаунта ограничена.';if(e?.code==='42501')return 'Войди в аккаунт заново или проверь подтверждение почты.';return 'Не удалось выполнить запрос. Проверь подключение и повтори. Сообщение не считается отправленным без подтверждения сервера.';}
function unmount(){if(mounted){mounted.dispose();mounted=null;}}
function mount(key,target){unmount();if(!KEY.test(key))return;
const box=n('section',undefined,'av-discussion');box.id='avAnimeDiscussion';box.dataset.thread=key;box.setAttribute('aria-label','Обсуждение аниме');
const top=n('div',undefined,'av-discussion-top'),refresh=n('button','Обновить');refresh.type='button';top.append(n('h2','Обсуждение и комментарии'),refresh);
const notice=n('p',undefined,'av-comment-notice');notice.setAttribute('role','status');const auth=n('p','Проверяем вход…'),login=n('a','Войти / зарегистрироваться');login.href='account.html';auth.append(' ',login);
const form=n('form'),name=n('input'),text=n('textarea'),spoiler=n('input'),spoilerLabel=n('label',' Есть спойлеры'),reply=n('p'),cancel=n('button','Отменить ответ'),send=n('button','Отправить');
name.placeholder='Публичный псевдоним';name.minLength=2;name.maxLength=48;name.required=true;name.setAttribute('aria-label','Публичный псевдоним');text.placeholder='Обсуди аниме: впечатления, вопросы, теории…';text.maxLength=3000;text.required=true;text.rows=4;text.setAttribute('aria-label','Комментарий');spoiler.type='checkbox';spoilerLabel.prepend(spoiler);cancel.type='button';reply.hidden=true;reply.append(cancel);send.type='submit';form.append(name,text,reply,spoilerLabel,send);form.hidden=true;
const rules=n('p','Псевдонимы не подтверждают статус автора. Не публикуй личные данные. Спойлеры отмечай. Лимит — 3000 символов, одно сообщение в 30 секунд.','av-comment-rules'),list=n('div'),more=n('button','Показать ещё');more.type='button';more.hidden=true;
box.append(top,notice,auth,form,rules,list,more);target.append(box);
let dead=false,user=null,authSeq=0,loadSeq=0,cursor=null,busy=false,parentId=null,requestId=null,subscription;
const setNotice=t=>{if(!dead)notice.textContent=t;};
function resetNonce(){requestId=null;}for(const e of[name,text,spoiler])e.addEventListener('input',resetNonce);
function resetReply(){parentId=null;reply.hidden=true;reply.replaceChildren(cancel);requestId=null;}cancel.onclick=resetReply;
async function verifiedUser(){const seq=++authSeq;try{const r=await db().auth.getUser();if(dead||seq!==authSeq)return;const next=r.error?null:r.data?.user||null;
if(user?.id!==next?.id){text.value='';resetReply();}
user=next;form.hidden=!user;auth.replaceChildren();if(user){auth.textContent='Ты вошёл. Комментарий будет общедоступным.';}else auth.append('Чтобы написать комментарий, ',login);
}catch{if(!dead){form.hidden=true;auth.replaceChildren('Не удалось проверить вход. ',login);}}}
function card(row){const article=n('article',undefined,'av-comment');article.id='comment-'+row.id;const header=n('div',undefined,'av-comment-header'),date=n('time',new Date(row.created_at).toLocaleString('ru-RU'));date.dateTime=row.created_at;header.append(n('strong',String(row.display_name||'Участник').slice(0,48)),date);article.append(header);
if(row.parent_id)article.append(n('p','↳ Ответ: '+String(row.parent_name||'участнику').slice(0,48),'av-comment-parent'));
if(row.deleted){article.append(n('p','Сообщение удалено.','av-comment-rules'));return article;}
const body=n('p',String(row.body||'').slice(0,3000),'av-comment-body');if(row.spoiler){const details=n('details'),summary=n('summary','Спойлер — показать');details.append(summary,body);article.append(details);}else article.append(body);
const actions=n('div',undefined,'av-comment-actions'),answer=n('button','Ответить');answer.type='button';answer.onclick=()=>{if(busy)return;if(!user){login.focus();setNotice('Для ответа нужно войти в аккаунт.');return;}parentId=row.id;requestId=null;reply.replaceChildren(n('span','Ответ: '+row.display_name+' '),cancel);reply.hidden=false;text.focus();};actions.append(answer);
if(row.is_mine){const del=n('button','Удалить');del.type='button';del.onclick=async()=>{if(busy||!user||!confirm('Удалить свой комментарий?'))return;busy=true;del.disabled=true;try{const r=await rpc('av_comment_delete',{p_id:row.id,p_expected_user:user.id});if(r.error)throw r.error;if(!r.data)throw Error('Not deleted');if(!dead)await load(false);}catch(e){setNotice(explain(e));}finally{busy=false;if(!dead)del.disabled=false;}};actions.append(del);}article.append(actions);return article;}
async function load(append){const seq=++loadSeq;more.disabled=true;refresh.disabled=true;setNotice('Загружаем обсуждение…');const last=append?cursor:null;
try{const r=await rpc('av_comments_list',{p_anime_key:key,p_before:last?.created_at||null,p_before_id:last?.id||null,p_limit:30});if(r.error)throw r.error;if(!Array.isArray(r.data)||r.data.length>30)throw Error('Invalid page');if(dead||seq!==loadSeq)return;
if(!append)list.replaceChildren();for(const row of r.data)if(!list.querySelector('[id="comment-'+String(row.id).replace(/[^a-f0-9-]/gi,'')+'"]'))list.append(card(row));cursor=r.data.at(-1)||last;more.hidden=r.data.length<30;setNotice(list.children.length?'':'Пока нет комментариев. Начни обсуждение!');
}catch(e){if(!dead&&seq===loadSeq){setNotice(explain(e));more.hidden=true;}}finally{if(!dead&&seq===loadSeq){more.disabled=false;refresh.disabled=false;}}}
form.onsubmit=async e=>{e.preventDefault();if(busy||!user||!form.reportValidity())return;const body=text.value.trim(),nick=name.value.trim();if(!body||nick.length<2)return;busy=true;for(const el of[name,text,spoiler,cancel,send])el.disabled=true;requestId=requestId||crypto.randomUUID();const payload={p_anime_key:key,p_body:body,p_name:nick,p_spoiler:spoiler.checked,p_request_id:requestId,p_expected_user:user.id,p_parent_id:parentId};
try{const r=await rpc('av_comment_post',payload);if(r.error)throw r.error;if(typeof r.data!=='string')throw Error('No server confirmation');if(dead)return;
if(text.value.trim()===body)text.value='';resetReply();spoiler.checked=false;await load(false);setNotice('Комментарий опубликован.');}catch(err){setNotice(explain(err));}finally{busy=false;if(!dead)for(const el of[name,text,spoiler,cancel,send])el.disabled=false;}};
refresh.onclick=()=>load(false);more.onclick=()=>load(true);
try{subscription=db().auth.onAuthStateChange(()=>setTimeout(()=>{if(!dead){verifiedUser();load(false);}},0)).data?.subscription;}catch(e){setNotice(explain(e));}
mounted={dispose(){dead=true;++authSeq;++loadSeq;subscription?.unsubscribe();box.remove();}};verifiedUser();load(false);
}
const catalog=document.getElementById('watchPanel');if(catalog){addEventListener('av:discussion-title',e=>{if(typeof e.detail?.id==='string'&&KEY.test(e.detail.id))mount(e.detail.id,catalog);else unmount();});if(KEY.test(window.AVDiscussionTitle||''))mount(window.AVDiscussionTitle,catalog);return;}
const raw=String(document.querySelector('script[data-av-comments-id]')?.dataset.avCommentsId||new URLSearchParams(location.search).get('id')||'').replace(/^anilist-/,'');if(!/^[1-9]\d{0,14}$/.test(raw)||!Number.isSafeInteger(Number(raw)))return;
const target=document.querySelector('main')||document.body,waiting=n('section',undefined,'av-discussion'),msg=n('p','Подключаем обсуждение этого аниме…'),retry=n('button','Повторить');retry.type='button';waiting.append(n('h2','Обсуждение и комментарии'),msg,retry);target.append(waiting);
async function resolve(){const seq=++mappingTicket;retry.disabled=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
try{const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME){id idMal}}',variables:{id:Number(raw)}}),signal:controller.signal});if(!r.ok)throw Error();const j=await r.json(),media=j?.data?.Media;if(!media||media.id!==Number(raw))throw Error();const mal=media.idMal;if(mal!==null&&(!Number.isSafeInteger(mal)||mal<1))throw Error();if(seq!==mappingTicket)return;waiting.remove();mount(mal?'shikimori-'+mal:'anilist-'+raw,target);
}catch{msg.textContent='Не удалось определить обсуждение этого аниме. Проверь сеть и повтори.';retry.disabled=false;}finally{clearTimeout(timer);}}
retry.onclick=resolve;resolve();
})();
