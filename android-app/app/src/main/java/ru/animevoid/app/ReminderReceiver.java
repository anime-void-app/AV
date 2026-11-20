package ru.animevoid.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/** Scheduled personal reminders, no server or tracking. */
public final class ReminderReceiver extends BroadcastReceiver {
    public static final String CHANNEL="animevoid_reminders";
    public static void schedule(Context context,int code,String title,long when){
        AlarmManager alarm=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        Intent reminder=new Intent(context,ReminderReceiver.class);
        reminder.putExtra("title",title);reminder.putExtra("code",code);
        PendingIntent action=PendingIntent.getBroadcast(context,code,reminder,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,action);
    }
    @Override public void onReceive(Context context,Intent intent){
        if(intent==null)return;
        int code=intent.getIntExtra("code",0);
        String title=intent.getStringExtra("title");
        if(title==null||title.trim().isEmpty())title="Пора посмотреть аниме";
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26){
            NotificationChannel channel=new NotificationChannel(CHANNEL,"Напоминания ANIME VOID",
                NotificationManager.IMPORTANCE_DEFAULT);
            manager.createNotificationChannel(channel);
        }
        Intent open=new Intent(context,MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent click=PendingIntent.getActivity(context,code,open,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?
            new Notification.Builder(context,CHANNEL):new Notification.Builder(context);
        Notification notification=builder.setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(title).setContentText("Твой вечер с ANIME VOID")
            .setAutoCancel(true).setContentIntent(click).build();
        if(Build.VERSION.SDK_INT<33||context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)
            manager.notify(code,notification);
        // Drop only the completed reminder; other local reminders survive.
        try{
            android.content.SharedPreferences pref=context.getSharedPreferences("av_native_v1",Context.MODE_PRIVATE);
            JSONArray old=new JSONArray(pref.getString("reminders","[]")),fresh=new JSONArray();
            for(int i=0;i<old.length();i++){
                JSONObject x=old.optJSONObject(i);
                if(x!=null&&x.optInt("code")!=code)fresh.put(x);
            }
            pref.edit().putString("reminders",fresh.toString()).apply();
        }catch(Exception ignored){}
    }
}
