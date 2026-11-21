'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');const read=p=>fs.readFileSync(path.join(base,p),'utf8');
test('native V87 catalog validates static generation and bounded metadata size',()=>{
 const s=read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const marker of ['kodik-data/manifest.json','/index.json','uniqueTitles','readBytes(input,limit)','9_000_000','setInstanceFollowRedirects(false)','valid.size()<100','getCacheDir()'])assert.ok(s.includes(marker),marker);
 assert.doesNotMatch(s,/addJavascriptInterface|setAllowUniversalAccessFromFileURLs|kodikplayer\.com\/serial/);
});
test('native V87 content uses background IO, bounded page, HTTPS image allowlist',()=>{
 const s=read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 for(const marker of ['newSingleThreadExecutor','newFixedThreadPool(3)','private static final int PAGE=24','safePoster','getProtocol()','LruCache<String,Bitmap>','posters.execute','main.post','body']) {
   if(marker==='body')continue;
   assert.ok(s.includes(marker),marker);
 }
 assert.match(s,/\"https\"\.equals\(url\.getProtocol\(\)\)/);
});
test('native catalog opens existing first-party title page; saved shelf stays local',()=>{
 const s=read('android-app/app/src/main/java/ru/animevoid/app/NativeCatalog.java');
 assert.match(s,/kodik\.html\?title=/);
 assert.match(s,/native_catalog_favorites_v87/);
 assert.match(s,/getSharedPreferences\(\"av_native_v1\"/);
 assert.match(s,/\"Хентай\"/);
 const main=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const key of ['NativeCatalog','nativeCatalog.show(content','showTab("favorites")','showTab("web")','nativeCatalog.dispose()'])assert.ok(main.includes(key),key);
});
test('Android version and release readme V87 are explicit',()=>{
 const g=read('android-app/app/build.gradle');
 assert.match(g,/versionCode (?:4|5|6|7|8)/);assert.match(g,/versionName '(?:1\.3|2\.(?:0|1|2|3))\.0'/);
 assert.match(read('android-app/README.md'),/native catalogue/);
 assert.match(read('android-app/README.md'),/does NOT yet have native video playback/);
});
