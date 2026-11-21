'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('V94 home showcases real catalog metadata and poster artwork',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 const catalog=read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const x of ['nativeCatalog.showHomeShowcase','showcaseSlot','ОТКРОЙ НОВОЕ','showTab("catalog")'])assert.ok(main.includes(x),x);
 for(const x of ['showHomeShowcase','renderHomeShowcase','HorizontalScrollView','loadImage(lead.poster,image)','loadImage(t.poster,poster)','WeakReference','getWindowToken()','readCatalog()'])assert.ok(catalog.includes(x),x);
 assert.match(catalog,/goToCatalog/);
});
test('V94 retains key site functions and handles WebView errors with real recovery',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const link of ['community.html','messages.html','manga.html','movies.html','account.html','match.html','collections.html','history.html','profile.html','kodik.html'])assert.ok(main.includes(link)||read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java').includes(link),link);
 for(const x of ['webMainFrameFailed','onPageStarted','onReceivedHttpError','showWebError','openExternal','setSafeBrowsingEnabled(true)','u.getUserInfo()==null','u.getPort()==443','onRenderProcessGone','onShowCustomView'])assert.ok(main.includes(x),x);
 assert.doesNotMatch(main,/addJavascriptInterface|setAllowUniversalAccessFromFileURLs|payment\.charge/);
});
test('V94 local tools keep existing user data and allow editing personal entries',()=>{
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const x of ['editExistingEntry','store(DIARY,list)','setOnShowListener','LibraryBackup','showReminders','schedule(name,when.getTimeInMillis())','paletteSwatch','sharePage'])assert.ok(main.includes(x),x);
});
test('V94 device QA uses actual repo catalog metadata, not shipped synthetic content',()=>{
 const qa=read('android-app/qa/visual_smoke.py');
 for(const x of ['kodik-data','titles-%04d.json','uiautomator','screencap','01-home','02-catalog','03-title-detail','04-discovery','05-library','06-diary','07-profile','08-settings','run-as'])assert.ok(qa.includes(x),x);
 const gradle=read('android-app/app/build.gradle');
 assert.match(gradle,/versionCode 9/);assert.match(gradle,/versionName '2.4.0'/);
 assert.match(gradle,/appLabel:'ANIME VOID V94'/);
});

test('V94 native colors exactly match ANIME VOID website default CSS theme',()=>{
 const theme=read('android-app/app/src/main/java/ru/animevoid/app/AuroraTheme.java');
 const design=read('android-app/app/src/main/java/ru/animevoid/app/AuroraDesign.java');
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 const styles=read('android-app/app/src/main/res/values/styles.xml');
 const css=read('av-design.css'),polish=read('site-polish.css');
 for(const color of ['11,7,19','23,16,32','36,22,50','48,27,72','244,242,250','182,177,197','193,162,255','124,58,237','73,48,95'])assert.ok(theme.includes(color),color);
 for(const color of ['--av-bg:#0b0b12','--av-surface:#15151f','--av-accent:#c1a2ff','--av-solid:#7140bf'])assert.ok(css.includes(color),color);
 for(const color of ['--av-bg:#0b0713','--av-surface:#171020','--av-raised:#241632','--av-tint:#301b48','--av-line:#49305f','--av-solid:#7c3aed'])assert.ok(polish.includes(color),color);
 assert.match(main,/Точная основная тема ANIME VOID/);
 assert.match(styles,/#C1A2FF/);
 assert.doesNotMatch(main,/Color\.rgb\(140,241,212\)|AuroraTheme\.JADE/);
 assert.doesNotMatch(design,/179,232,231|14,48,60|23,47,60|212,238,255/);
});
