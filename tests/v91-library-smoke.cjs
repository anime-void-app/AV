'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('V91 private library backup uses Android document picker and validates all entries',()=>{
 const b=read('android-app/app/src/main/java/ru/animevoid/app/LibraryBackup.java');
 for(const marker of ['ACTION_CREATE_DOCUMENT','ACTION_OPEN_DOCUMENT','application/json','MAX_BYTES=512*1024','native_catalog_favorites_v87','native_catalog_recent_v90','diary','animevoid-native-library','new AlertDialog.Builder','edit.commit()','validId','getContentResolver'])assert.ok(b.includes(marker),marker);
 assert.doesNotMatch(b,/getCookies|CookieManager|AV_KEYSTORE|password|accessToken/);
 assert.doesNotMatch(b,/REMINDERS|putString\("reminders"/);
});
test('V91 UI supports backup and fullscreen recovery without losing native catalog',()=>{
 const app=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const marker of ['LibraryBackup','libraryBackup.exportToFile()','libraryBackup.importFromFile()','onRenderProcessGone','IMMERSIVE_STICKY','showTab("catalog")','showTab("favorites")','nativeCatalog.show(content'])assert.ok(app.includes(marker),marker);
 assert.match(app,/LibraryBackup\.EXPORT_REQUEST\|\|requestCode==LibraryBackup\.IMPORT_REQUEST/);
 assert.match(app,/Настройки","Aurora Cinema · Android 2\.(?:1|2|3)\.0 \/ V9(?:1|2|3)/);
});
test('V91 retains same preview package for upgrading V90 and version is bumped',()=>{
 const g=read('android-app/app/build.gradle');
 assert.match(g,/versionCode (?:6|7|8)/);assert.match(g,/versionName '2\.(?:1|2|3)\.0'/);
 assert.match(g,/applicationIdSuffix '\.preview'/);
 assert.match(g,/appLabel:'ANIME VOID V9(?:1|2|3)'/);
 const docs=read('android-app/README.md');
 assert.match(docs,/No passwords, cookies, cloud account data or media files/);
});
