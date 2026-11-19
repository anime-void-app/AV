/* ANIME VOID V77 — deterministic, local, privacy-respecting two-person genre matching. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AVMatch77=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const GENRES=Object.freeze(['Romance','Fantasy','Action','Comedy','Drama','Mystery','Adventure','Slice of Life','Sci-Fi']);
 const valid=genre=>GENRES.includes(genre);
 function normalizeGenres(value){
  const list=Array.isArray(value)?value:[];
  return [...new Set(list.filter(valid))].slice(0,3);
 }
 function parsePrefs(query){
  const params=typeof query==='string'?new URLSearchParams(query):query;
  const parse=key=>normalizeGenres(String(params?.get(key)||'').split(','));
  return {a:parse('a'),b:parse('b')};
 }
 function buildParams(a,b){
  const params=new URLSearchParams();
  const first=normalizeGenres(a),second=normalizeGenres(b);
  if(first.length)params.set('a',first.join(','));
  if(second.length)params.set('b',second.join(','));
  return params.toString();
 }
 function normalized(item){
  if(!item||typeof item!=='object'||item.isAdult===true)return null;
  const id=Number(String(item.id||'').replace(/^anilist-/,''));
  if(!Number.isSafeInteger(id)||id<=0)return null;
  const title=item.title;
  const name=typeof title==='string'?title:
   (typeof title?.english==='string'&&title.english.trim()?title.english:
    typeof title?.romaji==='string'?title.romaji:'');
  if(!name.trim())return null;
  const genres=[...(Array.isArray(item.genres)?item.genres:[]),item.genre].filter(x=>typeof x==='string');
  const score=Number(item.averageScore||item.score||0);
  const cover=typeof item.coverImage==='object'?item.coverImage?.large:item.image;
  return {id,title:name.slice(0,180),genres:[...new Set(genres)],score:Number.isFinite(score)?Math.min(100,Math.max(0,score)):0,
   cover:typeof cover==='string'?cover:null,year:Number.isSafeInteger(item.seasonYear||item.year)?(item.seasonYear||item.year):null};
 }
 function rank(items,choiceA,choiceB,limit=12){
  const a=normalizeGenres(choiceA),b=normalizeGenres(choiceB);
  if(!a.length||!b.length||!Array.isArray(items))return [];
  const seen=new Set(),result=[];
  for(const raw of items){
   const item=normalized(raw);
   if(!item||seen.has(item.id))continue;
   const genres=item.genres.map(x=>x.toLowerCase());
   const countA=a.filter(g=>genres.includes(g.toLowerCase())).length;
   const countB=b.filter(g=>genres.includes(g.toLowerCase())).length;
   // Both people must have at least one requested genre represented.
   if(!countA||!countB)continue;
   seen.add(item.id);
   const score=100+countA*25+countB*25+item.score*.4;
   result.push({...item,matchScore:score,countA,countB});
  }
  result.sort((x,y)=>y.matchScore-x.matchScore||y.score-x.score||x.id-y.id);
  return result.slice(0,Math.max(1,Math.min(36,Number(limit)||12)));
 }
 return Object.freeze({GENRES,normalizeGenres,parsePrefs,buildParams,normalized,rank});
});
