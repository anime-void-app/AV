'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','profile.html','anime.html','watch.html','account.html','history.html','collections.html','party.html','match.html','kodik.html','manga.html','movies.html','messages.html','community.html','explore.html','updates.html','reading.html'];
test('new scripts and service worker parse',()=>{
  for(const p of ['av-journey-81.js','av-native-watch-81.js','service-worker.js'])assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
});
test('responsive stylesheet on every primary page',()=>{
  for(const p of pages)assert.equal(read(p).split('av-cinema-81.css?v=81.0').length-1,1,p);
});
test('journey and native tracker only on intended pages',()=>{
  for(const p of ['index.html','profile.html','anime.html','watch.html'])assert.equal(read(p).split('av-journey-81.js?v=81.0').length-1,1,p);
  assert.equal(read('watch.html').split('av-native-watch-81.js?v=81.0').length-1,1);
  for(const p of ['index.html','profile.html','anime.html'])assert.doesNotMatch(read(p),/src="av-native-watch-81\.js/);
});
test('manual progress, old rewards and room sync preserved',()=>{
  assert.match(read('watch.html'),/window\.AVWatchAutoComplete=/);
  assert.match(read('watch.html'),/navigator\.locks\?\.request/);
  assert.match(read('watch.html'),/av-watch-tracker\.js/);
  assert.match(read('party.html'),/av-party-76\.js/);
  assert.match(read('profile.html'),/void-achievements-22\.js/);
  assert.doesNotMatch(read('av-journey-81.js'),/localStorage\.setItem/);
  assert.match(read('av-native-watch-81.js'),/L\.count\(state\.coverage\)<900/);
});
test('offline shell includes new files and remains small',()=>{
  const worker=read('service-worker.js'),header=worker.slice(0,worker.indexOf('const PRELOAD_CONCURRENCY'));
  const {NEW_CORE,CORE_CACHE}=vm.runInNewContext(header+';({NEW_CORE,CORE_CACHE})');
  assert.equal(CORE_CACHE,'av-AV-core-v81.0');
  assert.ok(NEW_CORE.includes('av-cinema-81.css?v=81.0'));
  assert.ok(NEW_CORE.includes('av-journey-81.js?v=81.0'));
  assert.equal(NEW_CORE.length,new Set(NEW_CORE).size);
  const total=NEW_CORE.reduce((sum,ref)=>{
    const file=path.join(root,ref.split('?')[0]);
    assert.ok(fs.existsSync(file),ref);
    return sum+fs.statSync(file).size;
  },0);
  assert.ok(total<3500000,'precache too big: '+total);
});
test('release information present',()=>{
  assert.match(read('updates.html'),/<strong>81\.0<\/strong>/);
  assert.match(read('V81_QA.md'),/RuStore/);
});
test('unique observed playback counts; seeking and replay do not inflate hours',()=>{
  const L=require('../av-watch-ledger.js');
  const session=L.session({titleId:'anilist-4224',title:'Sample',kind:'series',season:1,episode:1});
  session.event({key:'kodik_player_duration_update',value:1200},0,true);
  session.event({key:'kodik_player_video_started'},0,true);
  session.event({key:'kodik_player_time_update',value:0},0,true);
  session.event({key:'kodik_player_seek'},1000,true);
  session.event({key:'kodik_player_time_update',value:1140},1000,true);
  assert.equal(L.count(session.state().coverage),0,'seeking cannot earn viewed coverage');
  session.event({key:'kodik_player_play'},2000,true);
  session.event({key:'kodik_player_time_update',value:0},2000,true);
  for(let i=1;i<=230;i++){
    session.event({key:'kodik_player_time_update',value:i*5},2000+i*5000,true);
  }
  assert.ok(L.count(session.state().coverage)>=900,'continuous viewing reaches completion threshold');
  const first=L.merge({version:1,entries:{}},session.snapshot());
  const repeated=L.merge(first,session.snapshot());
  assert.equal(L.presentation(first).seconds,L.presentation(repeated).seconds,'replay cannot double count unique content');
});
