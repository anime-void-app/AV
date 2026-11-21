'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const p=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('V94 native theme matches website ANIME VOID violet palette',()=>{
 const site=p('av-design.css')+p('site-polish.css'),theme=p('android-app/app/src/main/java/ru/animevoid/app/AuroraTheme.java');
 for(const css of ['#0b0713','#171020','#241632','#301b48','#49305f','#c1a2ff','#7c3aed'])assert.ok(site.includes(css),css);
 for(const rgb of ['Color.rgb(11,7,19)','Color.rgb(23,16,32)','Color.rgb(36,22,50)','Color.rgb(48,27,72)','Color.rgb(193,162,255)','Color.rgb(124,58,237)'])assert.ok(theme.includes(rgb),rgb);
 assert.match(p('android-app/app/src/main/res/values/styles.xml'),/Theme\.Material\.NoActionBar/);
});
test('V90 native redesign and real account data remain distinct',()=>{
 const app=p('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const str of ['AURORA CINEMA','AuroraDesign.hero','Моя коллекция','Сохранённые тайтлы','История просмотра','showNativeProfile','getSharedPreferences'])assert.ok(app.includes(str),str);
 assert.match(app,/Настоящий уровень, XP, ранги и достижения/);
 assert.doesNotMatch(app,/addJavascriptInterface|purchaseProduct\(/);
});
test('V90 first-party WebView performs one navigation, reports load progress',()=>{
 const app=p('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const str of ['pendingWebUrl=u.toString()','browser.loadUrl(requested)','onProgressChanged','pageLoad','setAllowFileAccess(false)','MIXED_CONTENT_NEVER_ALLOW','lastAnimeUrl'])assert.ok(app.includes(str),str);
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
 assert.match(gradle,/versionCode (?:5|6|7|8|9)/);assert.match(gradle,/versionName '2\.(?:0|1|2|3|4)\.0'/);
 const docs=p('android-app/README.md');assert.match(docs,/V90/);assert.match(docs,/(?:debug|DEBUG)/);
});

test('V90 preview has a side-by-side package and persistent CI test signing',()=>{
 const gradle=p('android-app/app/build.gradle');
 assert.match(gradle,/applicationIdSuffix '\.preview'/);
 assert.match(gradle,/manifestPlaceholders = \[appLabel:'ANIME VOID V9(?:0|1|2|3|4)'\]/);
 assert.match(p('android-app/app/src/main/AndroidManifest.xml'),/android:label="\$\{appLabel\}"/);
 assert.match(p('.github/workflows/android-rustore.yml'),/av-v90-preview-debug-keystore-1/);
});
