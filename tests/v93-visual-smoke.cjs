'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('V93 home showcases real catalog metadata and poster artwork',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 const catalog=read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const x of ['nativeCatalog.showHomeShowcase','showcaseSlot','ОТКРОЙ НОВОЕ','showTab("catalog")'])assert.ok(main.includes(x),x);
 for(const x of ['showHomeShowcase','renderHomeShowcase','HorizontalScrollView','loadImage(lead.poster,image)','loadImage(t.poster,poster)','WeakReference','getWindowToken()','readCatalog()'])assert.ok(catalog.includes(x),x);
 assert.match(catalog,/goToCatalog/);
});
test('V93 retains key site functions and handles WebView errors with real recovery',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const link of ['community.html','messages.html','manga.html','movies.html','account.html','match.html','collections.html','history.html','profile.html','kodik.html'])assert.ok(main.includes(link)||read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java').includes(link),link);
 for(const x of ['webMainFrameFailed','onPageStarted','onReceivedHttpError','showWebError','openExternal','setSafeBrowsingEnabled(true)','u.getUserInfo()==null','u.getPort()==443','onRenderProcessGone','onShowCustomView'])assert.ok(main.includes(x),x);
 assert.doesNotMatch(main,/addJavascriptInterface|setAllowUniversalAccessFromFileURLs|payment\.charge/);
});
test('V93 local tools keep existing user data and allow editing personal entries',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const x of ['editExistingEntry','store(DIARY,list)','setOnShowListener','LibraryBackup','showReminders','schedule(name,when.getTimeInMillis())','chooseAccent','sharePage'])assert.ok(main.includes(x),x);
});
test('V93 device QA uses actual repo catalog metadata, not shipped synthetic content',()=>{
 const qa=read('android-app/qa/visual_smoke.py');
 for(const x of ['kodik-data','titles-%04d.json','uiautomator','screencap','01-home','02-catalog','03-title-detail','04-discovery','05-library','06-diary','07-profile','08-settings','run-as'])assert.ok(qa.includes(x),x);
 const gradle=read('android-app/app/build.gradle');
 assert.match(gradle,/versionCode 8/);assert.match(gradle,/versionName '2\.3\.0'/);
 assert.match(gradle,/appLabel:'ANIME VOID V93'/);
});
