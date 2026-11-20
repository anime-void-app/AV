'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Android project has Gradle, manifest and native source',()=>{
 for(const p of ['android-app/settings.gradle','android-app/build.gradle','android-app/app/build.gradle',
 'android-app/app/src/main/AndroidManifest.xml','android-app/app/src/main/java/ru/animevoid/app/MainActivity.java',
 'android-app/app/src/main/java/ru/animevoid/app/ReminderReceiver.java',
 'android-app/app/src/main/java/ru/animevoid/app/BootReceiver.java',
 '.github/workflows/android-rustore.yml'])assert.ok(fs.existsSync(path.join(root,p)),p);
});
test('app keeps embedded browsing secure and has offline native features',()=>{
 const s=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java');
 for(const term of ['setJavaScriptEnabled(true)','setDomStorageEnabled(true)','setAllowFileAccess(false)',
  'setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)','shouldOverrideUrlLoading',
  'onShowFileChooser','onShowCustomView','private void showDiary','private void showReminders',
  'setAllowContentAccess(true)','AnimeVoidAndroid/1.0'])assert.ok(s.includes(term),term);
 assert.doesNotMatch(s,/addJavascriptInterface|setAllowUniversalAccessFromFileURLs/);
});
test('manifest uses least-required permissions and non-exported receivers',()=>{
 const m=read('android-app/app/src/main/AndroidManifest.xml');
 assert.match(m,/android.permission.INTERNET/);
 assert.match(m,/android.permission.POST_NOTIFICATIONS/);
 assert.match(m,/android.permission.RECEIVE_BOOT_COMPLETED/);
 assert.match(m,/android:exported="false"/);
 assert.match(m,/android:usesCleartextTraffic="false"/);
 assert.match(m,/android:allowBackup="false"/);
});
test('monetization is off; no payment keys in public repo',()=>{
 const s=read('android-app/app/src/main/java/ru/animevoid/app/MainActivity.java'),g=read('android-app/app/build.gradle');
 assert.match(s,/оплата и подписки не подключены/);
 assert.match(g,/AV_KEYSTORE_FILE/);
 assert.doesNotMatch(g,/storePassword\s+["']|keyPassword\s+["']/);
 assert.match(read('android-app/README.md'),/server-verified/);
});
test('browser dock is omitted only inside the real Android shell',()=>{
 const js=read('av-app-78.js');
 assert.match(js,/AnimeVoidAndroid/);
 assert.match(js,/av-native-client/);
 assert.match(js,/window\.self!==window\.top/);
});
