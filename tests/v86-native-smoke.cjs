'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('V86 native app has five real tabs and corresponding screens',()=>{
 const java=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const screen of ['showNativeHome','showDiscover','showLibrary','showNativeProfile','showCatalog','showDiary','showReminders'])assert.ok(java.includes('void '+screen+'('),screen);
 for(const tab of ['home','catalog','discover','library','profile'])assert.ok(java.includes('{"'+tab+'",'),tab);
 assert.match(java,/showTab\("home"\);/);
});
test('native search is origin restricted and query string is JSON-escaped',()=>{
 const java=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 assert.match(java,/JSONObject\.quote\(q\)/);
 assert.match(java,/if\(!trusted\(current\)\)return;/);
 assert.match(java,/onPageFinished\(WebView view,String url\)/);
 assert.match(java,/view\.evaluateJavascript\(script,null\)/);
 assert.match(java,/setAllowFileAccess\(false\)/);
 assert.doesNotMatch(java,/addJavascriptInterface/);
});
test('native last-page shortcut uses local preferences only',()=>{
 const java=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 assert.match(java,/putString\("lastAnimeUrl",url\)/);
 assert.match(java,/getString\("lastAnimeUrl",null\)/);
 assert.match(java,/Прогресс просмотра учитывает сайт/);
});
test('V86 version increment and staged store claims',()=>{
 assert.match(read('android-app/app/build.gradle'),/versionCode (?:3|4|5|6)/);
 assert.match(read('android-app/app/build.gradle'),/versionName '(?:1\.(?:2|3)|2\.(?:0|1))\.0'/);
 assert.match(read('android-app/README.md'),/NOT feature parity with Anixart/);
 assert.match(read('android-app/README.md'),/individual entrepreneurs/);
});
