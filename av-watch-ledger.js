/* Local measurement of unique content coverage, not a reward/entitlement source. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AVWatchLedger=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const KEY='animeVoidMeasuredV1',ID=/^(?:(?:shikimori|kinopoisk|anilist)-[1-9]\d{0,14}|kodik-(?:movie|serial)-[1-9]\d{0,14})$/,EMPTY='0'.repeat(250),fields='coverage,duration,episode,kind,position,season,title,titleId,updatedAt';
function validate(x){if(!x||Object.getPrototypeOf(x)!==Object.prototype||Object.keys(x).sort().join(',')!=='entries,version'||x.version!==1||!x.entries||Object.getPrototypeOf(x.entries)!==Object.prototype||Object.keys(x.entries).length>2000)throw Error('Invalid measured history');const out={version:1,entries:{}};for(const[k,v]of Object.entries(x.entries)){if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!==fields||!ID.test(v.titleId)||!['movie','series'].includes(v.kind)||!Number.isInteger(v.season)||v.season<0||v.season>10000||!Number.isInteger(v.episode)||v.episode<1||v.episode>10000||v.kind==='movie'&&(v.season!==0||v.episode!==1)||v.kind==='series'&&v.season<1||!Number.isInteger(v.duration)||v.duration<30||v.duration>43200||typeof v.title!=='string'||v.title.length>200||typeof v.coverage!=='string'||!/^[a-f0-9]{250}$/.test(v.coverage)||!Number.isFinite(v.position)||v.position<0||v.position>v.duration||!Number.isFinite(v.updatedAt)||v.updatedAt<0||k!==unitKey(v))throw Error('Invalid measured entry');out.entries[k]={...v};}return out;}
function unitKey(v){return v.titleId+'_s'+v.season+'_e'+v.episode+'_d'+v.duration;}
function union(a,b){let r='';for(let i=0;i<250;i++)r+=(parseInt(a[i],16)|parseInt(b[i],16)).toString(16);return r;}
function count(h){let n=0;for(const c of h)n+=[0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4][parseInt(c,16)];return n;}
function merge(archive,entry){const out=validate(archive),candidate=validate({version:1,entries:{[unitKey(entry)]:entry}}).entries[unitKey(entry)];let key=Object.keys(out.entries).find(k=>{const v=out.entries[k];return v.titleId===candidate.titleId&&v.season===candidate.season&&v.episode===candidate.episode&&Math.abs(v.duration-candidate.duration)<=3;})||unitKey(candidate);const old=out.entries[key];if(old){out.entries[key]={...(candidate.updatedAt>=old.updatedAt?candidate:old),duration:old.duration,coverage:union(old.coverage,candidate.coverage),position:Math.min(old.duration,candidate.updatedAt>=old.updatedAt?candidate.position:old.position)};}else{if(Object.keys(out.entries).length>=2000)throw Error('Measured history limit reached; export before cleanup');out.entries[key]=candidate;}return out;}
function metrics(x){const data=validate(x);let seconds=0,completed=0;const titles=new Set();for(const v of Object.values(data.entries)){const bins=count(v.coverage);seconds+=v.duration*bins/1000;if(bins>=900&&v.position>=v.duration*.95)completed++;if(bins)titles.add(v.titleId);}return{seconds,completed,titles:titles.size,units:Object.keys(data.entries).length,basis:'unique-observed-content',measured:true};}
/* Read-only presentation summary. Deduplicate the same episode recorded with
   slightly different runtime metadata; never alter stored coverage or rewards. */
function presentation(archive){
  const data=validate(archive),seen=new Map();
  for(const entry of Object.values(data.entries)){
    const bins=count(entry.coverage);
    if(bins===0)continue;
    const key=entry.titleId+':'+entry.season+':'+entry.episode;
    const old=seen.get(key);
    if(!old){seen.set(key,{...entry});continue;}
    if(Math.abs(old.duration-entry.duration)<=3){
      const recent=entry.updatedAt>=old.updatedAt?entry:old;
      seen.set(key,{...recent,duration:old.duration,
        coverage:union(old.coverage,entry.coverage),
        position:Math.min(old.duration,Math.max(old.position,entry.position)),
        updatedAt:Math.max(old.updatedAt,entry.updatedAt)});
    }else{
      const oldAmount=old.duration*count(old.coverage),newAmount=entry.duration*bins;
      const best=newAmount>oldAmount?entry:old;
      seen.set(key,{...best,updatedAt:Math.max(old.updatedAt,entry.updatedAt)});
    }
  }
  const entries=[...seen.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.titleId.localeCompare(b.titleId)||a.season-b.season||a.episode-b.episode);
  const titles=new Set();let seconds=0,completed=0;
  for(const entry of entries){
    const bins=count(entry.coverage);
    seconds+=entry.duration*bins/1000;
    titles.add(entry.titleId);
    if(bins>=900&&entry.position>=entry.duration*.95)completed++;
  }
  return {entries,seconds,units:entries.length,titles:titles.size,completed,basis:'unique-observed-content',measured:true};
}
function session(meta){if(!ID.test(meta.titleId)||typeof meta.title!=='string')throw Error('Invalid media identity');let season=meta.kind==='movie'?0:meta.season||null,episode=meta.kind==='movie'?1:meta.episode||null,duration=0,position=0,started=false,playing=false,ad=false,previous=null,ranges=[],bits=EMPTY,speed=1;
function snapshot(){if(!duration||episode===null||season===null||!started)return null;return{titleId:meta.titleId,title:meta.title.slice(0,200),kind:meta.kind==='movie'?'movie':'series',season,episode,duration,position:Math.min(position,duration),coverage:bits,updatedAt:Date.now()};}
function reset(){duration=0;position=0;started=false;playing=false;previous=null;ranges=[];bits=EMPTY;}
function range(a,b){ranges.push([a,b]);ranges.sort((a,b)=>a[0]-b[0]);const merged=[];for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1]+.015)last[1]=Math.max(last[1],r[1]);else merged.push(r.slice());}ranges=merged.slice(-128);const arr=bits.split('');for(let i=0;i<1000;i++){const lo=duration*i/1000,hi=duration*(i+1)/1000;if((parseInt(arr[Math.floor(i/4)],16)&(1<<(i%4)))!==0)continue;let sum=0;for(const r of ranges)sum+=Math.max(0,Math.min(hi,r[1])-Math.max(lo,r[0]));if(sum>=hi-lo-.001)arr[Math.floor(i/4)]=(parseInt(arr[Math.floor(i/4)],16)|(1<<(i%4))).toString(16);}bits=arr.join('');}
function event(m,now,visible=true){let previousEntry=null;const v=m.value;switch(m.key){case'kodik_player_current_episode':if(meta.kind!=='movie'&&v&&typeof v==='object'&&Number.isInteger(v.episode)&&v.episode>=1&&v.episode<=10000&&Number.isInteger(v.season)&&v.season>=1&&v.season<=10000){if(episode!==null&&(episode!==v.episode||season!==v.season)){previousEntry=snapshot();reset();}season=v.season;episode=v.episode;previous=null;}break;
case'kodik_player_duration_update':if(typeof v==='number'&&Number.isFinite(v)&&v>=30&&v<=43200){const d=Math.round(v);if(duration&&Math.abs(duration-d)>3){previousEntry=snapshot();reset();}duration=d;position=Math.min(position,duration);}break;
case'kodik_player_video_started':case'kodik_player_play':started=true;playing=true;previous=null;break;
case'kodik_player_pause':playing=false;previous=null;break;
case'kodik_player_seek':previous=null;break;
case'kodik_player_advert_started':case'kodik_player_ad_started':ad=true;previous=null;break;
case'kodik_player_advert_ended':case'kodik_player_ad_ended':ad=false;previous=null;break;
case'kodik_player_speed_change':if(typeof v==='number'&&v>=.25&&v<=4)speed=v;previous=null;break;
case'kodik_player_time_update':case'kodik_player_time':if(!started||!duration||episode===null||season===null||typeof v!=='number'||!Number.isFinite(v)||v<0||v>duration+2)break;const next=Math.min(v,duration);if(m.key==='kodik_player_time_update'&&visible&&!ad&&playing&&previous){const elapsed=(now-previous.wall)/1000,delta=next-previous.time;if(elapsed>=.05&&elapsed<=10&&delta>0&&delta<=Math.min(42,elapsed*Math.max(1,speed)*1.2+.5))range(previous.time,next);}position=next;previous=visible&&!ad&&playing?{time:next,wall:now}:null;break;
case'kodik_player_video_ended':playing=false;previous=null;break;}
return{previousEntry,current:snapshot()};}
return{event,snapshot,resetClock:()=>{previous=null;},state:()=>({started,playing,duration,position,season,episode,coverage:bits})};}
return Object.freeze({KEY,EMPTY,validate,unitKey,merge,metrics,presentation,count,union,session});});
