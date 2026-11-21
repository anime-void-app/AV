package ru.animevoid.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** V91 private, user-initiated portable metadata backup; never exports cookies or credentials. */
public final class LibraryBackup {
    public static final int EXPORT_REQUEST=491;
    public static final int IMPORT_REQUEST=492;
    private static final String PREF="av_native_v1";
    private static final int MAX_BYTES=512*1024;
    private static final String[] KEYS={
        "native_catalog_favorites_v87","native_catalog_recent_v90","diary"
    };
    private final Activity activity;
    private final Runnable refresh;
    public LibraryBackup(Activity activity,Runnable refresh){
        this.activity=activity;this.refresh=refresh;
    }
    public void exportToFile(){
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.setType("application/json");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_TITLE,"animevoid-library-backup.json");
        try{activity.startActivityForResult(intent,EXPORT_REQUEST);}
        catch(Exception e){toast("Не удалось открыть выбор файла");}
    }
    public void importFromFile(){
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("application/json");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        try{activity.startActivityForResult(intent,IMPORT_REQUEST);}
        catch(Exception e){toast("Не удалось открыть выбор файла");}
    }
    public void onResult(int request,int result,Intent data){
        if(result!=Activity.RESULT_OK||data==null||data.getData()==null)return;
        if(request==EXPORT_REQUEST)write(data.getData());
        if(request==IMPORT_REQUEST)read(data.getData());
    }
    private void write(Uri uri){
        try{
            SharedPreferences p=activity.getSharedPreferences(PREF,Context.MODE_PRIVATE);
            JSONObject data=new JSONObject();
            data.put("format","animevoid-native-library");
            data.put("version",1);
            data.put("createdAt",System.currentTimeMillis());
            JSONObject library=new JSONObject();
            for(String key:KEYS)library.put(key,new JSONArray(p.getString(key,"[]")));
            data.put("library",library);
            byte[] bytes=data.toString(2).getBytes(StandardCharsets.UTF_8);
            if(bytes.length>MAX_BYTES)throw new IllegalStateException("too large");
            try(OutputStream stream=activity.getContentResolver().openOutputStream(uri,"wt")){
                if(stream==null)throw new IllegalStateException("cannot write");
                stream.write(bytes);stream.flush();
            }
            toast("Копия библиотеки сохранена");
        }catch(Exception e){toast("Не удалось сохранить копию библиотеки");}
    }
    private void read(Uri uri){
        try{
            byte[] bytes;
            try(InputStream input=activity.getContentResolver().openInputStream(uri)){
                if(input==null)throw new IllegalStateException("cannot open");
                ByteArrayOutputStream output=new ByteArrayOutputStream();
                byte[] buffer=new byte[8192];int n;
                while((n=input.read(buffer))!=-1){
                    if(output.size()+n>MAX_BYTES)throw new IllegalStateException("too large");
                    output.write(buffer,0,n);
                }
                bytes=output.toByteArray();
            }
            JSONObject root=new JSONObject(new String(bytes,StandardCharsets.UTF_8));
            if(!"animevoid-native-library".equals(root.optString("format"))
                ||root.optInt("version")!=1)throw new IllegalArgumentException("format");
            JSONObject library=root.getJSONObject("library");
            JSONObject cleaned=new JSONObject();
            for(String key:KEYS){
                JSONArray source=library.optJSONArray(key);
                if(source==null)throw new IllegalArgumentException("missing "+key);
                if(source.length()>(key.equals("diary")?250:300))throw new IllegalArgumentException("too many");
                JSONArray valid=new JSONArray();
                for(int i=0;i<source.length();i++){
                    Object value=source.get(i);
                    if(key.equals("native_catalog_favorites_v87")){
                        if(!(value instanceof String)||!validId((String)value))throw new IllegalArgumentException("bad id");
                        valid.put(value);
                    }else{
                        if(!(value instanceof JSONObject))throw new IllegalArgumentException("bad entry");
                        JSONObject entry=(JSONObject)value;
                        if(entry.toString().length()>3000)throw new IllegalArgumentException("long entry");
                        if(key.equals("native_catalog_recent_v90")&&!validId(entry.optString("id")))throw new IllegalArgumentException("recent id");
                        if(key.equals("diary")){
                            if(entry.optString("title","").length()>240||entry.optString("note","").length()>1500)
                                throw new IllegalArgumentException("diary length");
                            String url=entry.optString("url","");
                            if(!url.isEmpty()&&!url.startsWith("https://animevoid.ru/")
                                &&!url.startsWith("https://www.animevoid.ru/"))
                                throw new IllegalArgumentException("diary link");
                        }
                        valid.put(entry);
                    }
                }
                cleaned.put(key,valid);
            }
            new AlertDialog.Builder(activity)
                .setTitle("Восстановить библиотеку?")
                .setMessage("Заменим локальное избранное, историю открытий и дневник данными из файла. Данные аккаунта на сайте не изменятся. Перед заменой можно сохранить текущую копию.")
                .setNegativeButton("Отмена",null)
                .setPositiveButton("Восстановить",(dialog,which)->{
                    SharedPreferences.Editor edit=activity.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit();
                    for(String key:KEYS)edit.putString(key,cleaned.optJSONArray(key).toString());
                    if(edit.commit()){toast("Библиотека восстановлена");refresh.run();}
                    else toast("Не удалось записать библиотеку");
                }).show();
        }catch(Exception e){toast("Файл повреждён или не является копией ANIME VOID");}
    }
    private static boolean validId(String id){
        return id!=null&&id.matches("(?:shikimori|kinopoisk)-[1-9][0-9]*|kodik-(?:movie|serial)-[1-9][0-9]*");
    }
    private void toast(String text){Toast.makeText(activity,text,Toast.LENGTH_LONG).show();}
}
