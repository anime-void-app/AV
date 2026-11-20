package ru.animevoid.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;

/** Re-arm future non-exact reminders after a device reboot. */
public final class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){
        if(intent==null||!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()))return;
        try{
            JSONArray list=new JSONArray(context.getSharedPreferences("av_native_v1",Context.MODE_PRIVATE)
                .getString("reminders","[]"));
            long now=System.currentTimeMillis();
            for(int i=0;i<list.length();i++){
                JSONObject item=list.optJSONObject(i);if(item==null)continue;
                long when=item.optLong("when",0);
                if(when>now)ReminderReceiver.schedule(context,item.optInt("code"),
                    item.optString("title","Пора посмотреть аниме"),when);
            }
        }catch(Exception ignored){}
    }
}
