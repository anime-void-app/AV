package ru.animevoid.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.AlarmManager;
import android.app.DatePickerDialog;
import android.app.PendingIntent;
import android.app.TimePickerDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.graphics.Insets;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.UUID;

/** ANIME VOID native navigation, discovery and offline tools. Trusted-domain WebView for playback. */
public final class MainActivity extends Activity {
    private static final String HOME="https://animevoid.ru/index.html";
    private static final String PREF="av_native_v1";
    private static final String DIARY="diary";
    private static final String REMINDERS="reminders";
    private static final int PICK_FILE=421;
    private static final int NOTIFICATIONS=422;
    private static final int BACKGROUND=Color.rgb(8,14,25);
    private static final int PANEL=Color.rgb(18,31,45);
    private int ACCENT=Color.rgb(140,241,212);
    private static final int MUTED=Color.rgb(174,192,207);
    private LinearLayout root, nav;
    private FrameLayout content;
    private WebView browser;
    private String activeTab="home";
    private String pendingSearch=null;
    private ValueCallback<Uri[]> uploadCallback;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(9,17,28));
        getWindow().setNavigationBarColor(Color.rgb(9,17,28));
        ACCENT=accentFor(getSharedPreferences(PREF,MODE_PRIVATE).getString("accent","jade"));
        renderShell();
        if(Build.VERSION.SDK_INT>=35){
            getWindow().getDecorView().setOnApplyWindowInsetsListener((v,insets)->{
                Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
                root.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                return insets;
            });
        }
        showTab("home");
        Uri deep=getIntent()==null?null:getIntent().getData();
        if(deep!=null)openTrusted(deep.toString());
    }

    private int dp(float dp){return (int)(getResources().getDisplayMetrics().density*dp+0.5f);}
    private GradientDrawable surface(int color,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;
    }
    private TextView text(String text,int size,int color,boolean bold){
        TextView t=new TextView(this);t.setText(text);t.setTextColor(color);t.setTextSize(size);
        t.setGravity(Gravity.CENTER_VERTICAL);if(bold)t.setTypeface(null,1);return t;
    }
    private Button button(String label,Runnable action,boolean primary){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);
        b.setTextColor(primary?Color.rgb(8,31,36):Color.rgb(240,250,255));
        b.setTextSize(13);b.setMinHeight(dp(43));
        b.setBackground(surface(primary?ACCENT:Color.rgb(31,47,65),12));
        b.setOnClickListener(v->action.run());return b;
    }
    private void renderShell(){
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BACKGROUND);setContentView(root);
        LinearLayout top=new LinearLayout(this);top.setPadding(dp(15),dp(9),dp(13),dp(9));
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setBackgroundColor(Color.rgb(12,23,35));
        TextView brand=text("ANIME VOID",21,Color.WHITE,true);brand.setLetterSpacing(-0.045f);
        top.addView(brand,new LinearLayout.LayoutParams(0,dp(48),1f));
        Button save=button("☆",this::saveFromBrowser,false);
        top.addView(save,new LinearLayout.LayoutParams(dp(44),dp(44)));
        Button share=button("↗",this::sharePage,false);
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(dp(44),dp(44));sp.leftMargin=dp(8);top.addView(share,sp);
        root.addView(top);
        View line=new View(this);line.setBackgroundColor(Color.rgb(55,79,90));
        root.addView(line,new LinearLayout.LayoutParams(-1,dp(1)));
        content=new FrameLayout(this);content.setBackgroundColor(BACKGROUND);
        root.addView(content,new LinearLayout.LayoutParams(-1,0,1f));
        nav=new LinearLayout(this);nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(6),dp(7),dp(6),dp(7));nav.setBackgroundColor(Color.rgb(12,23,35));
        root.addView(nav,new LinearLayout.LayoutParams(-1,dp(72)));
    }

    private void showTab(String tab){
        activeTab=tab;content.removeAllViews();nav.removeAllViews();
        if("catalog".equals(tab))showCatalog();
        else{
            ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
            LinearLayout vertical=new LinearLayout(this);vertical.setOrientation(LinearLayout.VERTICAL);
            vertical.setPadding(dp(18),dp(22),dp(18),dp(28));
            scroll.addView(vertical);content.addView(scroll);
            switch(tab){
                case "home":showNativeHome(vertical);break;
                case "discover":showDiscover(vertical);break;
                case "library":showLibrary(vertical);break;
                case "diary":showDiary(vertical);break;
                case "reminders":showReminders(vertical);break;
                case "profile":showNativeProfile(vertical);break;
                default:showSettings(vertical);break;
            }
        }
        for(String[] item:new String[][]{
            {"home","⌂\nГлавная"},{"catalog","▦\nКаталог"},
            {"discover","⌕\nПоиск"},{"library","♡\nМоё"},{"profile","☻\nПрофиль"}}){
            final String next=item[0];
            boolean selected=tab.equals(next)||("diary".equals(tab)&&"library".equals(next))
                ||("reminders".equals(tab)&&"profile".equals(next))
                ||("settings".equals(tab)&&"profile".equals(next));
            Button b=button(item[1],()->showTab(next),selected);
            b.setTextSize(11);b.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams pos=new LinearLayout.LayoutParams(0,dp(55),1f);
            pos.leftMargin=dp(2);pos.rightMargin=dp(2);nav.addView(b,pos);
        }
    }

    private void showNativeHome(LinearLayout host){
        TextView kicker=text("ANIME VOID  ·  ТВОЙ МИР",12,ACCENT,true);
        kicker.setLetterSpacing(0.12f);host.addView(kicker);
        TextView title=text("С чего начнём сегодня?",30,Color.WHITE,true);
        title.setPadding(0,dp(9),0,dp(8));host.addView(title);
        TextView caption=text("Аниме, дунхуа, любимые истории и твой личный прогресс.",14,MUTED,false);
        caption.setPadding(0,0,0,dp(20));host.addView(caption);
        LinearLayout featured=card(host);
        featured.setBackground(surface(Color.rgb(20,49,57),22));
        featured.addView(text("✦  Открой новую историю",23,Color.WHITE,true));
        TextView sub=text("Каталог, жанры и рекомендации доступны прямо в приложении.",14,MUTED,false);
        sub.setPadding(0,dp(7),0,dp(8));featured.addView(sub);
        addButton(featured,"Перейти в каталог",()->showTab("catalog"),true);
        String last=getSharedPreferences(PREF,MODE_PRIVATE).getString("lastAnimeUrl",null);
        if(last!=null&&trusted(Uri.parse(last))){
            LinearLayout recent=card(host);
            recent.addView(text("◷  Недавно открывал",18,Color.WHITE,true));
            TextView explanation=text("Вернись на последнюю страницу тайтла. Позиция видео хранится отдельно на сайте.",12,MUTED,false);
            explanation.setPadding(0,dp(6),0,0);recent.addView(explanation);
            addButton(recent,"Продолжить с этой страницы",()->openTrusted(last),true);
        }
        LinearLayout shortcuts=card(host);
        shortcuts.addView(text("Быстрые разделы",18,Color.WHITE,true));
        addButton(shortcuts,"⌕  Найти аниме",()->showTab("discover"),false);
        addButton(shortcuts,"♡  Мои списки и коллекции",()->showTab("library"),false);
        addButton(shortcuts,"✧  Подборки и новое",()->openTrusted(HOME+"#recommendedSection"),false);
        addButton(shortcuts,"◷  Напоминания",()->showTab("reminders"),false);
        LinearLayout status=card(host);
        status.addView(text("Личный прогресс",17,Color.WHITE,true));
        status.addView(text("Записей в офлайн-дневнике: "+stored(DIARY).length(),14,MUTED,false));
        addButton(status,"Открыть статистику профиля",
            ()->openTrusted("https://animevoid.ru/profile.html"),false);
    }

    private void showDiscover(LinearLayout host){
        heading(host,"Поиск и открытия","Найди аниме по названию или перейди к любимым разделам.");
        LinearLayout search=card(host);
        EditText query=new EditText(this);
        query.setSingleLine(true);query.setHint("Название аниме или дунхуа");
        query.setTextColor(Color.WHITE);query.setHintTextColor(MUTED);
        query.setInputType(android.text.InputType.TYPE_CLASS_TEXT);
        query.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);
        search.addView(query,new LinearLayout.LayoutParams(-1,dp(53)));
        query.setOnEditorActionListener((v,action,event)->{
            if(action==android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH){openCatalogSearch(query.getText().toString());return true;}
            return false;
        });
        addButton(search,"⌕  Найти в каталоге",()->openCatalogSearch(query.getText().toString()),true);
        LinearLayout discover=card(host);
        discover.addView(text("Исследовать ANIME VOID",18,Color.WHITE,true));
        addButton(discover,"✦  Аниме и фильтры",()->openTrusted(HOME+"#catalog"),false);
        addButton(discover,"☯  Китайские дунхуа",()->openTrusted(HOME+"#catalog"),false);
        addButton(discover,"★  Популярное и рейтинги",()->openTrusted(HOME+"#topSection"),false);
        addButton(discover,"✧  Рекомендации",()->openTrusted(HOME+"#recommendedSection"),false);
        addButton(discover,"◇  Коллекции",()->openTrusted("https://animevoid.ru/collections.html"),false);
    }

    private void openCatalogSearch(String entered){
        String q=entered==null?"":entered.trim();
        if(q.isEmpty()){openTrusted(HOME+"#catalog");return;}
        pendingSearch=q.substring(0,Math.min(120,q.length()));
        openTrusted(HOME+"?appSearch="+System.currentTimeMillis()+"#catalog");
    }

    private void showLibrary(LinearLayout host){
        heading(host,"Моё аниме","Избранное, просмотренные серии и личные коллекции.");
        LinearLayout cloud=card(host);
        cloud.addView(text("Списки на ANIME VOID",18,Color.WHITE,true));
        addButton(cloud,"♡  Избранное и запланированное",()->openTrusted(HOME+"#favorites"),true);
        addButton(cloud,"◷  История просмотра",()->openTrusted("https://animevoid.ru/history.html"),false);
        addButton(cloud,"◇  Коллекции",()->openTrusted("https://animevoid.ru/collections.html"),false);
        LinearLayout local=card(host);
        local.addView(text("Локальный дневник",18,Color.WHITE,true));
        local.addView(text(stored(DIARY).length()+" записей · доступны без интернета · не синхронизируются",12,MUTED,false));
        addButton(local,"Открыть мой дневник",()->showTab("diary"),false);
        addButton(local,"☆  Сохранить текущую страницу",this::saveFromBrowser,false);
    }

    private void showNativeProfile(LinearLayout host){
        heading(host,"Мой профиль","Оформление, достижения, статистика и настройки.");
        LinearLayout panel=card(host);
        panel.setBackground(surface(Color.rgb(29,33,60),20));
        panel.addView(text("✦  Мой ANIME VOID",20,Color.WHITE,true));
        panel.addView(text("Профиль и достижения сайта доступны после входа в аккаунт.",13,MUTED,false));
        addButton(panel,"Открыть профиль",()->openTrusted("https://animevoid.ru/profile.html"),true);
        addButton(panel,"Мастерская оформления",
            ()->openTrusted("https://animevoid.ru/profile.html#profileWorkshop"),false);
        LinearLayout tools=card(host);
        tools.addView(text("Мои инструменты",17,Color.WHITE,true));
        addButton(tools,"◷  Напоминания о просмотре",()->showTab("reminders"),false);
        addButton(tools,"⚙  Настройки приложения",()->showTab("settings"),false);
        addButton(tools,"↗  Поделиться ANIME VOID",this::sharePage,false);
    }

    private boolean trusted(Uri u){
        if(u==null||!"https".equalsIgnoreCase(u.getScheme()))return false;
        String host=u.getHost();
        return "animevoid.ru".equalsIgnoreCase(host)||"www.animevoid.ru".equalsIgnoreCase(host);
    }
    private void openTrusted(String url){
        Uri u=Uri.parse(url);
        if(!trusted(u)){openExternal(url);return;}
        showTab("catalog");
        browser.loadUrl(u.toString());
    }
    private void openExternal(String url){
        try{
            Uri u=Uri.parse(url);
            String scheme=u.getScheme();
            if(!"https".equalsIgnoreCase(scheme)&&!"http".equalsIgnoreCase(scheme)
                &&!"mailto".equalsIgnoreCase(scheme)&&!"tel".equalsIgnoreCase(scheme))return;
            startActivity(new Intent(Intent.ACTION_VIEW,u));
        }catch(Exception e){toast("Ссылка сейчас недоступна");}
    }
    private void showCatalog(){
        if(browser==null){
            browser=new WebView(this);
            browser.setBackgroundColor(BACKGROUND);
            WebSettings settings=browser.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setUserAgentString(settings.getUserAgentString()+" AnimeVoidAndroid/1.0");
            CookieManager.getInstance().setAcceptCookie(true);
            CookieManager.getInstance().setAcceptThirdPartyCookies(browser,true);
            browser.setWebViewClient(new WebViewClient(){
                @Override public void onPageFinished(WebView view,String url){
                    super.onPageFinished(view,url);
                    Uri current=Uri.parse(url);
                    if(!trusted(current))return;
                    if(url.contains("/anime.html")||url.contains("/watch.html")){
                        getSharedPreferences(PREF,MODE_PRIVATE).edit().putString("lastAnimeUrl",url).apply();
                    }
                    if(pendingSearch!=null&&url.contains("/index.html")&&url.contains("appSearch=")){
                        String q=pendingSearch;pendingSearch=null;
                        String quoted=JSONObject.quote(q);
                        String script="(function(){var field=document.getElementById('search');"
                          +"if(field){field.value="+quoted+";field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}})();";
                        view.evaluateJavascript(script,null);
                    }
                }

                @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                    if(!request.isForMainFrame())return false;
                    Uri u=request.getUrl();
                    if(trusted(u))return false;
                    openExternal(u.toString());return true;
                }
                @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                    if(request.isForMainFrame())toast("Сайт недоступен. Дневник и напоминания работают офлайн.");
                }
            });
            browser.setWebChromeClient(new WebChromeClient(){
                @Override public void onShowCustomView(View view,CustomViewCallback callback){
                    if(fullView!=null){callback.onCustomViewHidden();return;}
                    fullView=view;fullCallback=callback;root.setVisibility(View.GONE);
                    ViewGroup decor=(ViewGroup)getWindow().getDecorView();
                    decor.addView(view,new ViewGroup.LayoutParams(-1,-1));
                }
                @Override public void onHideCustomView(){leaveFullScreen();}
                @Override public boolean onShowFileChooser(WebView webView,ValueCallback<Uri[]> callback,FileChooserParams params){
                    if(uploadCallback!=null)uploadCallback.onReceiveValue(null);
                    uploadCallback=callback;
                    try{startActivityForResult(params.createIntent(),PICK_FILE);return true;}
                    catch(ActivityNotFoundException e){uploadCallback=null;toast("Выбор файла недоступен");return false;}
                }
            });
            browser.setDownloadListener((url,userAgent,contentDisposition,mimeType,length)->{
                if(url!=null)openExternal(url);
            });
            browser.loadUrl(HOME);
        }
        if(browser.getParent() instanceof ViewGroup)((ViewGroup)browser.getParent()).removeView(browser);
        content.addView(browser,new FrameLayout.LayoutParams(-1,-1));
    }
    private void leaveFullScreen(){
        if(fullView==null)return;
        if(fullView.getParent() instanceof ViewGroup)((ViewGroup)fullView.getParent()).removeView(fullView);
        fullView=null;root.setVisibility(View.VISIBLE);
        if(fullCallback!=null){fullCallback.onCustomViewHidden();fullCallback=null;}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==PICK_FILE&&uploadCallback!=null){
            uploadCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
            uploadCallback=null;
        }
    }
    @Override public void onBackPressed(){
        if(fullView!=null){leaveFullScreen();return;}
        if("catalog".equals(activeTab)&&browser!=null&&browser.canGoBack()){browser.goBack();return;}
        if(!"home".equals(activeTab)){showTab("home");return;}
        super.onBackPressed();
    }
    @Override protected void onNewIntent(Intent intent){
        super.onNewIntent(intent);setIntent(intent);
        if(intent!=null&&intent.getData()!=null)openTrusted(intent.getData().toString());
    }
    @Override protected void onDestroy(){
        leaveFullScreen();
        if(uploadCallback!=null){uploadCallback.onReceiveValue(null);uploadCallback=null;}
        if(browser!=null){if(browser.getParent() instanceof ViewGroup)((ViewGroup)browser.getParent()).removeView(browser);browser.destroy();browser=null;}
        super.onDestroy();
    }

    private JSONArray stored(String key){
        try{return new JSONArray(getSharedPreferences(PREF,MODE_PRIVATE).getString(key,"[]"));}
        catch(Exception e){return new JSONArray();}
    }
    private void store(String key,JSONArray value){
        getSharedPreferences(PREF,MODE_PRIVATE).edit().putString(key,value.toString()).apply();
    }
    private void heading(LinearLayout host,String title,String subtitle){
        TextView a=text(title,26,Color.WHITE,true);host.addView(a);
        TextView b=text(subtitle,13,MUTED,false);b.setPadding(0,dp(7),0,dp(20));host.addView(b);
    }
    private LinearLayout card(LinearLayout host){
        LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(16),dp(15),dp(16),dp(15));c.setBackground(surface(PANEL,17));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=dp(12);
        host.addView(c,p);return c;
    }
    private void addButton(LinearLayout box,String label,Runnable action,boolean main){
        Button b=button(label,action,main);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(46));p.topMargin=dp(9);
        box.addView(b,p);
    }
    private void toast(String s){Toast.makeText(this,s,Toast.LENGTH_LONG).show();}
    private void showDiary(LinearLayout root){
        heading(root,"Личный дневник","Твои планы и заметки хранятся только на этом телефоне — даже без интернета.");
        LinearLayout box=card(root);
        addButton(box,"+ Добавить аниме / заметку",()->editEntry(null),true);
        addButton(box,"☆ Сохранить открытую страницу",this::saveFromBrowser,false);
        JSONArray items=stored(DIARY);
        for(int i=items.length()-1;i>=0;i--){
            JSONObject entry=items.optJSONObject(i);if(entry==null)continue;
            String id=entry.optString("id");String title=entry.optString("title","Аниме");
            LinearLayout item=card(root);
            TextView h=text(title,17,Color.WHITE,true);item.addView(h);
            TextView n=text(entry.optString("note",""),13,MUTED,false);
            n.setPadding(0,dp(6),0,0);item.addView(n);
            String url=entry.optString("url",HOME);
            addButton(item,"Открыть на ANIME VOID",()->openTrusted(url),true);
            addButton(item,"Удалить запись",()->new AlertDialog.Builder(this)
                .setTitle("Удалить запись?").setMessage(title).setNegativeButton("Отмена",null)
                .setPositiveButton("Удалить",(d,w)->{removeById(DIARY,id);showTab("diary");}).show(),false);
        }
        if(items.length()==0)card(root).addView(text("Пока пусто. Сохрани любимое аниме или создай список планов.",14,MUTED,false));
    }
    private void saveFromBrowser(){
        String url=browser==null?HOME:browser.getUrl();
        if(url==null||!trusted(Uri.parse(url)))url=HOME;
        String title=browser==null?"":browser.getTitle();
        editEntry(new String[]{title==null?"":title,url});
    }
    private void editEntry(String[] source){
        LinearLayout form=new LinearLayout(this);form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(18),dp(8),dp(18),0);
        EditText title=new EditText(this);title.setSingleLine(true);title.setHint("Название аниме");
        title.setText(source==null?"":source[0]);form.addView(title);
        EditText note=new EditText(this);note.setMinLines(2);note.setHint("Заметка или план просмотра");
        form.addView(note);
        new AlertDialog.Builder(this).setTitle("Записать в дневник").setView(form)
            .setNegativeButton("Отмена",null).setPositiveButton("Сохранить",(dialog,which)->{
                String name=title.getText().toString().trim();
                if(name.isEmpty()){toast("Название не должно быть пустым");return;}
                JSONArray data=stored(DIARY);if(data.length()>=300){toast("Лимит — 300 записей");return;}
                JSONObject entry=new JSONObject();
                try{
                    entry.put("id",UUID.randomUUID().toString());
                    entry.put("title",name.substring(0,Math.min(160,name.length())));
                    String url=source==null?HOME:source[1];
                    entry.put("url",trusted(Uri.parse(url))?url:HOME);
                    entry.put("note",note.getText().toString().substring(0,Math.min(500,note.length())));
                    data.put(entry);store(DIARY,data);
                    toast("Сохранено только на этом устройстве");showTab("diary");
                }catch(Exception e){toast("Не удалось сохранить запись");}
            }).show();
    }
    private void removeById(String key,String id){
        JSONArray old=stored(key),now=new JSONArray();
        for(int i=0;i<old.length();i++){
            JSONObject x=old.optJSONObject(i);
            if(x!=null&&!id.equals(x.optString("id")))now.put(x);
        }
        store(key,now);
    }
    private void showReminders(LinearLayout root){
        heading(root,"Время для аниме","Поставь локальное напоминание на телефоне. Оно не привязано к аккаунту.");
        LinearLayout box=card(root);
        addButton(box,"+ Назначить напоминание",this::newReminder,true);
        JSONArray reminders=stored(REMINDERS);
        for(int i=0;i<reminders.length();i++){
            JSONObject entry=reminders.optJSONObject(i);if(entry==null)continue;
            long when=entry.optLong("when",0);if(when<System.currentTimeMillis())continue;
            String id=entry.optString("id");int code=entry.optInt("code");
            LinearLayout c=card(root);
            c.addView(text(entry.optString("title","Пора посмотреть аниме"),17,Color.WHITE,true));
            TextView date=text(android.text.format.DateFormat.format("dd.MM.yyyy HH:mm",when).toString(),13,MUTED,false);
            date.setPadding(0,dp(8),0,0);c.addView(date);
            addButton(c,"Отменить",()->{
                Intent intent=new Intent(this,ReminderReceiver.class);
                PendingIntent pi=PendingIntent.getBroadcast(this,code,intent,
                    PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
                ((AlarmManager)getSystemService(Context.ALARM_SERVICE)).cancel(pi);
                removeById(REMINDERS,id);showTab("reminders");
            },false);
        }
        if(reminders.length()==0)card(root).addView(text("Напоминаний ещё нет.",14,MUTED,false));
        card(root).addView(text("Уведомления требуют разрешения Android. Время не гарантируется с точностью до секунды.",12,MUTED,false));
    }
    private void newReminder(){
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFICATIONS);
            toast("Разреши уведомления и нажми «Назначить» повторно");
            return;
        }
        EditText field=new EditText(this);field.setSingleLine(true);
        field.setText("Пора посмотреть аниме");field.setPadding(dp(22),dp(15),dp(22),dp(15));
        new AlertDialog.Builder(this).setTitle("Название напоминания").setView(field)
            .setNegativeButton("Отмена",null).setPositiveButton("Выбрать дату",(dialog,w)->{
                String title=field.getText().toString().trim();
                if(title.isEmpty())title="Пора посмотреть аниме";
                final String name=title.substring(0,Math.min(title.length(),90));
                Calendar date=Calendar.getInstance();
                new DatePickerDialog(this,(v,year,month,day)->{
                    Calendar when=Calendar.getInstance();
                    when.set(year,month,day);
                    new TimePickerDialog(this,(tv,hour,minute)->{
                        when.set(Calendar.HOUR_OF_DAY,hour);when.set(Calendar.MINUTE,minute);
                        when.set(Calendar.SECOND,0);when.set(Calendar.MILLISECOND,0);
                        if(when.getTimeInMillis()<=System.currentTimeMillis()){toast("Нужно выбрать будущее время");return;}
                        schedule(name,when.getTimeInMillis());
                    },date.get(Calendar.HOUR_OF_DAY),date.get(Calendar.MINUTE),true).show();
                },date.get(Calendar.YEAR),date.get(Calendar.MONTH),date.get(Calendar.DAY_OF_MONTH)).show();
            }).show();
    }
    private void schedule(String title,long when){
        try{
            SharedPreferences pref=getSharedPreferences(PREF,MODE_PRIVATE);
            int code=pref.getInt("nextReminder",1);
            pref.edit().putInt("nextReminder",code+1).apply();
            String id=UUID.randomUUID().toString();
            JSONObject obj=new JSONObject();obj.put("id",id);obj.put("title",title);
            obj.put("when",when);obj.put("code",code);
            JSONArray list=stored(REMINDERS);list.put(obj);store(REMINDERS,list);
            ReminderReceiver.schedule(this,code,title,when);
            toast("Напоминание назначено");showTab("reminders");
        }catch(Exception e){toast("Не удалось создать напоминание");}
    }
    private int accentFor(String theme){
        if("amethyst".equals(theme))return Color.rgb(194,154,255);
        if("amber".equals(theme))return Color.rgb(245,211,154);
        return Color.rgb(140,241,212);
    }
    private void chooseAccent(){
        final String[] labels={"Нефрит · jade","Аметист · violet","Янтарь · amber"};
        final String[] values={"jade","amethyst","amber"};
        new AlertDialog.Builder(this).setTitle("Цвет ANIME VOID")
            .setItems(labels,(dialog,which)->{
                getSharedPreferences(PREF,MODE_PRIVATE).edit().putString("accent",values[which]).apply();
                ACCENT=accentFor(values[which]);
                renderShell();
                showTab("settings");
            }).setNegativeButton("Отмена",null).show();
    }
    private void showSettings(LinearLayout root){
        heading(root,"Настройки","ANIME VOID для Android · версия 1.2.0");
        LinearLayout about=card(root);
        about.addView(text("Быстрые действия",17,Color.WHITE,true));
        addButton(about,"Мой профиль на сайте",()->openTrusted("https://animevoid.ru/profile.html"),true);
        addButton(about,"Каталог Anime Match",()->openTrusted("https://animevoid.ru/match.html"),false);
        addButton(about,"Обновить сайт",()->{showTab("catalog");browser.reload();},false);
        LinearLayout design=card(root);
        design.addView(text("Оформление · бесплатно",17,Color.WHITE,true));
        addButton(design,"Выбрать цвет: нефрит / аметист / янтарь",this::chooseAccent,false);
        LinearLayout premium=card(root);
        premium.addView(text("VOID+ · план развития",18,ACCENT,true));
        TextView info=text("Три цвета интерфейса уже доступны бесплатно. В будущем: особые темы профиля, рамки, фоны и поддержка разработки. Сейчас всё без покупок: оплата и подписки не подключены.",13,MUTED,false);
        info.setPadding(0,dp(10),0,0);premium.addView(info);
        LinearLayout privacy=card(root);
        privacy.addView(text("Приватность",17,Color.WHITE,true));
        TextView note=text("Дневник хранится в памяти этого приложения. Сайт может обрабатывать данные аккаунта и сторонних видеопровайдеров отдельно. Для удаления локальных записей используй кнопки в дневнике.",13,MUTED,false);
        note.setPadding(0,dp(8),0,0);privacy.addView(note);
    }
    private void sharePage(){
        String url=browser!=null&&browser.getUrl()!=null?browser.getUrl():HOME;
        if(!trusted(Uri.parse(url)))url=HOME;
        Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT,"ANIME VOID — "+url);
        startActivity(Intent.createChooser(send,"Поделиться ссылкой"));
    }
}
