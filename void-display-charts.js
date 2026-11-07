/* source-localized24 */
var I24=window.AVSiteI18n24;
/* Existing Home/Profile chart nodes, one read-only canonical interpretation.
   No history inference, new storage, requests or reward/rank migration. */
(()=>{'use strict';const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;},RU={Action:'Экшен',Adventure:'Приключения',Comedy:'Комедия',Drama:'Драма',Ecchi:'Этти',Fantasy:'Фэнтези',Horror:'Ужасы','Mahou Shoujo':'Махо-сёдзё',Mecha:'Меха',Music:'Музыка',Mystery:'Мистика',Psychological:'Психология',Romance:'Романтика','Sci-Fi':'Фантастика','Slice of Life':'Повседневность',Sports:'Спорт',Supernatural:'Сверхъестественное',Thriller:'Триллер'},statusText={watching:['Смотрю','Watching'],planned:['Планирую','Planned'],completed:['Завершено','Completed'],dropped:['Брошено','Dropped']};let last=null,queued=false;function language(){try{return localStorage.getItem('animeVoidLanguage')!=='en';}catch{return document.documentElement.lang!=='en';}}function legend(id,rows,total,ru,unit,known){const out=$(id);if(!out)return;out.replaceChildren();if(!known){out.append(I24.bindText(el('p','chart-empty',(ru?I24.t("Данные недоступны или повреждены; исходная запись не изменена."):'Data is unavailable or damaged; the original record is unchanged.')),()=>((ru?I24.t("Данные недоступны или повреждены; исходная запись не изменена."):'Data is unavailable or damaged; the original record is unchanged.'))));return;}if(!rows.length){out.append(I24.bindText(el('p','chart-empty',(ru?I24.t("Пока нет данных для диаграммы."):'No chart data yet.')),()=>((ru?I24.t("Пока нет данных для диаграммы."):'No chart data yet.'))));return;}for(const r of rows){const item=el('div','chart-legend-item'),row=el('div','chart-legend-row'),dot=el('span','chart-dot');dot.style.backgroundColor=r.color;dot.setAttribute('aria-hidden','true');const label=el('span','chart-label',r.label),value=el('span','chart-value',(unit==='minutes'?AVState.formatHours(r.value,ru):String(r.value))+' · '+(total?r.value/total*100:0).toLocaleString(ru?'ru':'en',{maximumFractionDigits:1})+'%');label.style.overflowWrap='anywhere';row.append(dot,label,value);const track=el('div','chart-bar'),fill=el('span');fill.style.width=(total?r.value/total*100:0)+'%';fill.style.backgroundColor=r.color;track.setAttribute('aria-hidden','true');track.append(fill);item.append(row,track);out.append(item);}}function ring(id,rows,total,center,caption,known,ru){
 const canvas=$(id);if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const size=260;
 // Keep the 260-unit drawing coordinates independent of CSS card size.
 // Higher device pixel ratio avoids blurry rings/text on scaled desktop monitors.
 const dpr=Math.min(4,Math.max(1,Number.isFinite(window.devicePixelRatio)?window.devicePixelRatio:1));
 canvas.width=Math.round(size*dpr);
 canvas.height=Math.round(size*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,size,size);
 const style=getComputedStyle(canvas);
 const text=style.color||'#f5f3ff';
 const muted=style.getPropertyValue('--vi-muted').trim()||text;
 const cx=130,cy=130,radius=95;
 ctx.lineWidth=22;
 ctx.lineCap='round';
 ctx.strokeStyle=muted;
 ctx.globalAlpha=.14;
 ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=1;
 if(known&&total>0){
  let angle=-Math.PI/2;
  for(const row of rows){
   if(!row.value||row.value<=0)continue;
   const arc=row.value/total*Math.PI*2;
   const gap=Math.min(.035,arc*.14);
   const from=angle+gap,until=angle+arc-gap;
   if(until>from){
    ctx.beginPath();ctx.arc(cx,cy,radius,from,until);
    ctx.strokeStyle=row.color;
    ctx.stroke();
   }
   angle+=arc;
  }
 }
 ctx.textAlign='center';
 ctx.textBaseline='middle';
 ctx.fillStyle=text;
 let font=24;
 const first=String(center);
 while(font>11){
  ctx.font='800 '+font+'px system-ui,sans-serif';
  if(ctx.measureText(first).width<=172)break;
  font--;
 }
 ctx.fillText(first,cx,126,172);
 ctx.fillStyle=muted;
 const sub=String(caption);
 let subFont=12;
 while(subFont>10){
  ctx.font='600 '+subFont+'px system-ui,sans-serif';
  if(ctx.measureText(sub).width<=172)break;
  subFont--;
 }
 ctx.fillText(sub,cx,156,172);
 canvas.setAttribute('role','img');
 I24.attr(canvas,'aria-label',()=>(((known?caption+': '+center:(ru?I24.t('Данные недоступны'):'Data unavailable'))+'. ')+rows.map(r=>r.label+': '+(id==='genreChart'?AVState.formatHours(r.value,ru):r.value)).join('; ')));
 canvas.dataset.displaySource='canonical-v1';
 canvas.dataset.total=String(total);
 canvas.dataset.known=String(known);
}
function render(){if(!window.AVState?.analytics||!$('genreChart')||!$('statusChart'))return;const a=last=AVState.analytics(),ru=language(),manga=document.documentElement.dataset.avInterface==='manga',colors=manga?(document.body.matches('.av-home,.av-profile-page')?['#ac2338','#28232b','#77656b','#a47b78','#5f555f','#ba384c']:['#e55a72','#e8dfda','#ab929d','#ccaaa1','#9e8299','#f0899c']):['#a875ed','#557be2','#e19150','#53a68c','#c969a2','#7d8fbe'];const all=a.genreMinutes.map(r=>({label:ru&&Object.hasOwn(RU,r.genre)?RU[r.genre]:r.genre,value:r.minutes}));if(a.unclassifiedMinutes>0)all.push({label:ru?'Без жанров':'Unclassified',value:a.unclassifiedMinutes});all.sort((x,y)=>y.value-x.value||x.label.localeCompare(y.label));const genres=all.slice(0,5);if(all.length>5)genres.push({label:ru?'Остальные жанры':'Remaining genres',value:all.slice(5).reduce((n,r)=>n+r.value,0)});genres.forEach((r,i)=>r.color=colors[i]);const statuses=Object.entries(a.statusCounts).filter(([,v])=>v>0).map(([id,value],i)=>({label:statusText[id][ru?0:1],value,color:colors[i]}));const genreKnown=a.marksKnown||a.metrics.minutes>0;ring('genreChart',genres,a.metrics.minutes,genreKnown?AVState.formatHours(a.metrics.minutes,ru):'—',!a.marksKnown?(ru?'читаемая часть':'readable part'):(ru?'оценка по отметкам':'estimated from marks'),genreKnown,ru);$('genreChart').dataset.partial=String(!a.marksKnown||!a.catalogueKnown);ring('statusChart',statuses,a.statusTotal,a.statusKnown?String(a.statusTotal):'—',ru?'тайтлов со статусом':'tracked titles',a.statusKnown,ru);legend('genreLegend',genres,a.metrics.minutes,ru,'minutes',genreKnown);legend('statusLegend',statuses,a.statusTotal,ru,'count',a.statusKnown);const genreCard=$('genreChart').closest('.chart-card');if(genreCard){let note=$('displayChartsBasis');if(!note){note=el('p','dc-basis');note.id='displayChartsBasis';genreCard.append(note);}const warnings=[];if(!a.marksKnown)warnings.push(ru?'часть отметок повреждена или недоступна; показана только читаемая часть':'some marks are damaged or unavailable; only readable data is shown');if(!a.catalogueKnown)warnings.push(ru?'метаданные каталога недоступны':'catalogue metadata unavailable');if(a.metrics.warnings.durationConflicts)warnings.push(ru?'для конфликтующих длительностей выбран канонический ID':'canonical IDs take precedence for conflicting durations');if(a.metrics.warnings.invalidDurations)warnings.push(ru?'неверные длительности не использованы':'invalid durations were not used');I24.text(note,()=>(((((((((((ru?I24.t("Время оценочное, не замер просмотра. Длительность разделена поровну между уникальными жанрами тайтла; без жанров — отдельная доля. Сохранённые секунды не доказывают фактический просмотр."):'Time is estimated, not measured viewing. Duration is split equally between each title’s unique genres; unclassified titles have a separate share. Stored seconds do not prove actual viewing.')+' ')+(ru?I24.t("Источники длительности (отметок): сохранённые секунды — "):'Duration sources (marks): stored seconds — '))+a.metrics.sources.storedDuration)+(ru?I24.t(", каталог — "):', catalogue — '))+a.metrics.sources.catalogue)+(ru?I24.t(", условные 24 мин — "):', default 24 min — '))+a.metrics.sources.fallback)+'.')+(warnings.length?((' '+warnings.join('; '))+'.'):''))));}const title=document.querySelector('#genreChart')?.closest('.chart-card')?.querySelector('h3');if(title)I24.text(title,()=>((ru?I24.t("🎬 Оценка времени по жанрам"):'🎬 Estimated time by genre')));if($('chartGenresTitle'))I24.text($('chartGenresTitle'),()=>((ru?I24.t("🎬 Оценка времени по жанрам"):'🎬 Estimated time by genre')));if($('chartStatusesTitle'))I24.text($('chartStatusesTitle'),()=>((ru?I24.t("📋 Статусы тайтлов"):'📋 Title statuses')));if($('chartsSectionSubtitle'))I24.text($('chartsSectionSubtitle'),()=>((ru?I24.t("Канонические ручные отметки и выбранные статусы; время оценочное"):'Canonical manual marks and selected statuses; estimated time')));const home=document.body.classList.contains('av-home');if(home&&$('chartsSection'))$('chartsSection').hidden=!(a.metrics.minutes>0||a.statusTotal>0||!a.marksKnown||!a.statusKnown);return a;}function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}function boot(){render();addEventListener('storage',e=>{if(e.key===null||/^(watched_|duration_|animeVoid(?:Catalog|ListItems|Statuses|Language)$)/.test(e.key||''))schedule();});for(const e of ['av:state','av:progress','av:theme','av:charts-visible'])addEventListener(e,schedule,true);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-av-interface','data-av-contrast']});}window.AVDisplayCharts=Object.freeze({render,snapshot:()=>last?structuredClone(last):null});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
