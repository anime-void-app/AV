'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('V92 follows website Aurora Cinema styles via efficient native components',()=>{
 const code=load('android-app/app/src/main/java/ru/animevoid/app/AuroraDesign.java');
 for(const marker of ['Nebula extends View','SymbolView extends View','LinearGradient','RadialGradient','Canvas','hero(','nav(','tile(','stat('])assert.ok(code.includes(marker),marker);
 assert.doesNotMatch(code,/postDelayed|ValueAnimator|Thread\.sleep|new Timer/);
});
test('V92 five sections are restyled without fake account data or video bypass',()=>{
 const app=load('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const marker of ['toolbarAction','AuroraDesign.nav','AuroraDesign.hero','AuroraDesign.addTile','AuroraDesign.section','Сохранённые тайтлы','showNativeProfile','nativeCatalog.show(content','LibraryBackup'])assert.ok(app.includes(marker),marker);
 assert.match(app,/Настоящий уровень, XP, ранги и достижения/);
 assert.doesNotMatch(app,/addJavascriptInterface|purchaseProduct\(/);
});
test('V92 catalogue cards, save action, dark spinners and title sheet exist',()=>{
 const cat=load('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const marker of ['AuroraDesign.hero','AuroraDesign.panel','new Dialog(activity)','Gravity.BOTTOM','toggleFavorite(t)','rememberOpened(t)','setVerticalScrollBarEnabled(false)','genreAdapter','native_catalog_recent_v90','kodik.html?title='])assert.ok(cat.includes(marker),marker);
 assert.doesNotMatch(cat,/setJavaScriptEnabled\(true\)|addJavascriptInterface/);
});
test('V92 versionCode and preview package still protect user local data',()=>{
 const gradle=load('android-app/app/build.gradle');
 assert.match(gradle,/versionCode (?:7|8)/);assert.match(gradle,/versionName '2\.(?:2|3)\.0'/);
 assert.match(gradle,/appLabel:'ANIME VOID V9(?:2|3)'/);
 assert.match(gradle,/applicationIdSuffix '\.preview'/);
 assert.match(load('android-app/README.md'),/V92/);
});
