'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const p=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('V90 native theme matches website Aurora Cinema palette',()=>{
 const site=p('av-visual-85.css'),theme=p('android-app/app/src/main/java/ru/animevoid/app/AuroraTheme.java');
 for(const css of ['#070b14','#111a29','#8cf1d4','#c4a5ff','#f5d39a'])assert.ok(site.includes(css),css);
 for(const rgb of ['Color.rgb(7,11,20)','Color.rgb(17,26,41)','Color.rgb(140,241,212)','Color.rgb(196,165,255)','Color.rgb(245,211,154)'])assert.ok(theme.includes(rgb),rgb);
 assert.match(p('android-app/app/src/main/res/values/styles.xml'),/Theme\.Material\.NoActionBar/);
});
test('V90 native redesign and real account data remain distinct',()=>{
 const app=p('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const str of ['AURORA CINEMA','AuroraTheme.hero','Моя коллекция','Сохранённые тайтлы','История просмотра','showNativeProfile','getSharedPreferences'])assert.ok(app.includes(str),str);
 assert.match(app,/Настоящий уровень, XP, ранги и достижения/);
 assert.doesNotMatch(app,/addJavascriptInterface|purchaseProduct\(/);
});
test('V90 first-party WebView performs one navigation, reports load progress',()=>{
 const app=p('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const str of ['pendingWebUrl=u.toString()','browser.loadUrl(pendingWebUrl)','onProgressChanged','pageLoad','setAllowFileAccess(false)','MIXED_CONTENT_NEVER_ALLOW','lastAnimeUrl'])assert.ok(app.includes(str),str);
 assert.doesNotMatch(app,/showTab\("catalog"\);browser\.reload\(\)/);
});
test('V90 catalog has offline fallback, detail loading, image disk cache, bounded browsing',()=>{
 const cat=p('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const str of ['downloadCatalog(cache,savedGen)','FileInputStream is=new FileInputStream(cache)','poster_v90','SHA-256','1_000_000','getCacheDir()','private static final int PAGE=24','styleFilterChips','native_catalog_recent_v90','Описание не предоставлено каталогом'])assert.ok(cat.includes(str),str);
 assert.match(cat,/setInstanceFollowRedirects\(false\)/);
 assert.match(cat,/native_catalog_favorites_v87/);
});
test('V90 Android 2.0 has incremented version; store release remains gated',()=>{
 const gradle=p('android-app/app/build.gradle');
 assert.match(gradle,/versionCode 5/);assert.match(gradle,/versionName '2\.0\.0'/);
 const docs=p('android-app/README.md');assert.match(docs,/V90/);assert.match(docs,/DEBUG/);
});

test('V90 preview has a side-by-side package and persistent CI test signing',()=>{
 const gradle=p('android-app/app/build.gradle');
 assert.match(gradle,/applicationIdSuffix '\.preview'/);
 assert.match(gradle,/manifestPlaceholders = \[appLabel:'ANIME VOID V90'\]/);
 assert.match(p('android-app/app/src/main/AndroidManifest.xml'),/android:label="\$\{appLabel\}"/);
 assert.match(p('.github/workflows/android-rustore.yml'),/av-v90-preview-debug-keystore-1/);
});
