/* ANIME VOID V81 — native <video> observed playback adapter.
 * Reuses the validated AVWatchLedger and existing watched_ commit path.
 * Neither a seek, a page open nor an unverified embed creates watch time. */
(() => {
  'use strict';
  if (!document.body?.classList.contains('av-watch-page') ||
      document.body.classList.contains('av-party-embed') ||
      !window.AVWatchLedger) return;
  const L=window.AVWatchLedger,root=document.getElementById('avPlayer');
  if(!root)return;
  const params=new URLSearchParams(location.search),id='anilist-'+String(params.get('id')||'').replace(/^anilist-/,'');
  if(!/^anilist-[1-9]\d{0,9}$/.test(id))return;
  let video=null,engine=null,key='',lastSave=0,commitBusy=false,finished=new Set();
  function episode(){
    const p=new URLSearchParams(location.search),n=Number(p.get('episode')||1);
    return Number.isSafeInteger(n)&&n>=1&&n<=10000?n:null;
  }
  function makeSession(v){
    const ep=episode(),d=v.duration;
    if(ep===null||!Number.isFinite(d)||d<30||d>43200)return false;
    const newKey=ep+':'+v.currentSrc;
    if(engine&&newKey===key)return true;
    if(engine)persist();
    key=newKey;lastSave=0;
    const source=window.AVVideoSources?.sources?.find(x=>x.animeId===id);
    const title=String(source?.titleRu||source?.titleEn||document.getElementById('animeTitle')?.textContent||'Anime').slice(0,200);
    engine=L.session({titleId:id,title,kind:'series',season:1,episode:ep});
    engine.event({key:'kodik_player_duration_update',value:d},performance.now(),true);
    engine.event({key:'kodik_player_speed_change',value:v.playbackRate},performance.now(),true);
    return true;
  }
  function read(){
    const raw=localStorage.getItem(L.KEY);
    return raw?L.validate(JSON.parse(raw)):{version:1,entries:{}};
  }
  async function persist(){
    const value=engine?.snapshot();if(!value)return false;
    const write=()=>{
      const next=L.merge(read(),value),raw=JSON.stringify(next);
      if(raw.length>3*1024*1024)throw Error('Measured history limit');
      localStorage.setItem(L.KEY,raw);
      dispatchEvent(new Event('av:measured'));
      return true;
    };
    try{
      if(navigator.locks?.request)return await navigator.locks.request('av-measured-v1',write);
      return write();
    }catch{return false;}
  }
  async function finish(){
    if(commitBusy||!engine||!video||!video.isConnected)return;
    const state=engine.state(),snapshot=engine.snapshot();
    if(!snapshot||state.duration<600||state.position<state.duration*.95||L.count(state.coverage)<900)return;
    const token=state.episode+':'+Math.round(state.duration);
    if(finished.has(token))return;
    commitBusy=true;
    try{
      if(!await persist())return;
      if(typeof window.AVWatchAutoComplete!=='function')return;
      const archive=read();
      const matching=Object.values(archive.entries).find(e=>
        e.titleId===id&&e.season===1&&e.episode===state.episode&&
        Math.abs(e.duration-state.duration)<=3&&
        e.position>=e.duration*.95&&L.count(e.coverage)>=900);
      if(!matching)return;
      if(!navigator.locks?.request)return;
      const ok=await window.AVWatchAutoComplete(state.episode,matching.duration);
      if(ok!==false)finished.add(token);
    }catch{/* Keep any existing marks and data; let user try again later. */}
    finally{commitBusy=false;}
  }
  function accept(v){
    if(v!==video||!v.isConnected)return;
    if(!makeSession(v))return;
    engine.event({key:'kodik_player_time_update',value:v.currentTime},performance.now(),
      !document.hidden&&!v.paused&&!v.seeking&&v.readyState>=2);
    if(Date.now()-lastSave>=5000){lastSave=Date.now();void persist();}
    if(v.currentTime>=v.duration*.95)void finish();
  }
  function bind(v){
    if(video===v)return;
    if(engine)void persist();
    video=v;engine=null;key='';lastSave=0;
    v.addEventListener('loadedmetadata',()=>{if(v===video)makeSession(v);});
    v.addEventListener('playing',()=>{
      if(v!==video||!makeSession(v))return;
      engine.event({key:'kodik_player_video_started'},performance.now(),true);
    });
    v.addEventListener('ratechange',()=>{
      if(v===video&&engine)engine.event({key:'kodik_player_speed_change',value:v.playbackRate},performance.now(),true);
    });
    v.addEventListener('timeupdate',()=>accept(v));
    v.addEventListener('seeking',()=>{if(v===video)engine?.resetClock();});
    v.addEventListener('seeked',()=>{if(v===video)engine?.resetClock();});
    v.addEventListener('pause',()=>{
      if(v!==video||!engine)return;
      engine.event({key:'kodik_player_pause'},performance.now(),true);void persist();
    });
    v.addEventListener('ended',()=>{
      if(v!==video||!engine)return;
      engine.event({key:'kodik_player_time_update',value:v.duration},performance.now(),true);
      engine.event({key:'kodik_player_video_ended'},performance.now(),true);
      void finish();void persist();
    });
    if(v.readyState>=1)makeSession(v);
  }
  function findVideo(){
    const found=root.querySelector('video');
    if(found&&found!==video)bind(found);
  }
  new MutationObserver(findVideo).observe(root,{childList:true,subtree:true});
  addEventListener('pagehide',()=>{void persist();});
  document.addEventListener('visibilitychange',()=>{
    if(!engine)return;
    engine.resetClock();
    if(document.hidden)void persist();
  });
  findVideo();
})();