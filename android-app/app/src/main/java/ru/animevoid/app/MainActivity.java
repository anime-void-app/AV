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
import android.widget.ProgressBar;
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
    private static final int BACKGROUND=AuroraTheme.BG;
    private static final int PANEL=AuroraTheme.PANEL;
    private int ACCENT=AuroraTheme.ACCENT;
    private static final int MUTED=AuroraTheme.MUTED;
    private LinearLayout root, nav;
    private ProgressBar pageLoad;
    private String pendingWebUrl;
    private FrameLayout content;
    private WebView browser;
    private LinearLayout appHeader;
    private LinearLayout webContainer;
    private TextView webTitle;
    private boolean webMainFrameFailed=false;
    private FrameLayout webErrorHost;
    private NativeCatalog nativeCatalog;
    private LibraryBackup libraryBackup;
    private String pendingCatalogQuery;
    private String activeTab="home";
    private String pendingSearch=null;
    private ValueCallback<Uri[]> uploadCallback;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(AuroraTheme.BG);
        getWindow().setNavigationBarColor(AuroraTheme.BG);
        ACCENT=AuroraTheme.ACCENT;
        nativeCatalog=new NativeCatalog(this,this::openTrusted);
        libraryBackup=new LibraryBackup(this,()->showTab("library"));
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
        return AuroraTheme.solid(color,radius,AuroraTheme.LINE,1,getResources().getDisplayMetrics().density);
    }

    private TextView text(String text,int size,int color,boolean bold){
        TextView t=new TextView(this);t.setText(text);t.setTextColor(color);t.setTextSize(size);
        t.setGravity(Gravity.CENTER_VERTICAL);if(bold)t.setTypeface(null,1);return t;
    }
    private Button button(String label,Runnable action,boolean primary){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);
        b.setTextColor(primary?AuroraTheme.DARK_TEXT:AuroraTheme.FG);
        b.setTextSize(13);b.setTypeface(android.graphics.Typeface.create("sans-serif-medium",1));
        b.setMinHeight(dp(44));b.setPadding(dp(12),0,dp(12),0);
        b.setStateListAnimator(null);
        GradientDrawable bg=primary?AuroraTheme.solid(ACCENT,13,ACCENT,1,getResources().getDisplayMetrics().density)
            :AuroraDesign.panel(this,13);
        b.setBackground(AuroraTheme.touch(bg,0x35ffffff));
        b.setOnClickListener(v->action.run());return b;
    }

    private View toolbarAction(String glyph,String description,Runnable action){
        FrameLayout button=new FrameLayout(this);
        button.setBackground(AuroraTheme.touch(AuroraDesign.panel(this,14),0x22ffffff));
        AuroraDesign.SymbolView art=new AuroraDesign.SymbolView(this,glyph,ACCENT);
        FrameLayout.LayoutParams icon=new FrameLayout.LayoutParams(dp(23),dp(23),Gravity.CENTER);
        button.addView(art,icon);button.setContentDescription(description);
        button.setOnClickListener(v->action.run());
        return button;
    }

    private void renderShell(){
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(AuroraTheme.BG);setContentView(root);
        LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(18),dp(11),dp(17),dp(10));
        FrameLayout symbol=new FrameLayout(this);
        symbol.setBackground(AuroraDesign.raised(this,13,ACCENT));
        TextView mark=AuroraDesign.text(this,"✦",24,ACCENT,true);mark.setGravity(Gravity.CENTER);
        symbol.addView(mark,new FrameLayout.LayoutParams(-1,-1));
        header.addView(symbol,new LinearLayout.LayoutParams(dp(42),dp(42)));
        LinearLayout identity=new LinearLayout(this);identity.setOrientation(LinearLayout.VERTICAL);
        identity.setPadding(dp(10),0,dp(2),0);
        TextView brand=AuroraDesign.text(this,"ANIME VOID",20,AuroraTheme.FG,true);
        brand.setLetterSpacing(-.04f);brand.setSingleLine(true);
        brand.setEllipsize(android.text.TextUtils.TruncateAt.END);identity.addView(brand);
        TextView byline=AuroraDesign.kicker(this,"AURORA CINEMA  /  MOBILE",ACCENT);
        byline.setSingleLine(true);
        byline.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams byp=new LinearLayout.LayoutParams(-1,-2);byp.topMargin=dp(4);
        identity.addView(byline,byp);
        header.addView(identity,new LinearLayout.LayoutParams(0,-2,1f));
        header.addView(toolbarAction("heart","Сохранённые тайтлы",()->showTab("favorites")),
            new LinearLayout.LayoutParams(dp(42),dp(42)));
        LinearLayout.LayoutParams share=new LinearLayout.LayoutParams(dp(42),dp(42));
        share.leftMargin=dp(8);header.addView(toolbarAction("search","Поиск",()->showTab("discover")),share);
        appHeader=header;
        root.addView(header,new LinearLayout.LayoutParams(-1,dp(67)));
        View separator=new View(this);separator.setBackgroundColor(AuroraTheme.LINE);
        root.addView(separator,new LinearLayout.LayoutParams(-1,dp(1)));
        pageLoad=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        pageLoad.setMax(100);pageLoad.setIndeterminate(false);pageLoad.setVisibility(View.GONE);
        pageLoad.setProgressTintList(android.content.res.ColorStateList.valueOf(ACCENT));
        root.addView(pageLoad,new LinearLayout.LayoutParams(-1,dp(2)));
        content=new FrameLayout(this);content.setBackgroundColor(BACKGROUND);
        root.addView(content,new LinearLayout.LayoutParams(-1,0,1f));
        View footerLine=new View(this);footerLine.setBackgroundColor(AuroraTheme.LINE);
        root.addView(footerLine,new LinearLayout.LayoutParams(-1,dp(1)));
        nav=new LinearLayout(this);nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(7),dp(5),dp(7),dp(5));nav.setBackgroundColor(AuroraTheme.BG);
        root.addView(nav,new LinearLayout.LayoutParams(-1,dp(71)));
    }

        private void showTab(String tab){
        activeTab=tab;content.removeAllViews();nav.removeAllViews();
        if(appHeader!=null)appHeader.setVisibility("web".equals(tab)?View.GONE:View.VISIBLE);
        if(pageLoad!=null)pageLoad.setVisibility("web".equals(tab)?View.VISIBLE:View.GONE);
        if("web".equals(tab))showCatalog();
        else if("catalog".equals(tab)||"favorites".equals(tab)){
            nativeCatalog.setAccent(ACCENT);
            nativeCatalog.show(content,pendingCatalogQuery,"favorites".equals(tab));
            pendingCatalogQuery=null;
        }else{
            ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
            scroll.setVerticalScrollBarEnabled(false);
            LinearLayout vertical=new LinearLayout(this);vertical.setOrientation(LinearLayout.VERTICAL);
            vertical.setPadding(dp(18),dp(22),dp(18),dp(29));
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
            {"home","home","Главная"},{"catalog","catalog","Каталог"},
            {"discover","search","Поиск"},{"library","library","Моё"},{"profile","profile","Профиль"}}){
            final String target=item[0];
            boolean selected=tab.equals(target)||("web".equals(tab)&&"catalog".equals(target))
                ||("favorites".equals(tab)&&"library".equals(target))
                ||("diary".equals(tab)&&"library".equals(target))
                ||("reminders".equals(tab)&&"profile".equals(target))
                ||("settings".equals(tab)&&"profile".equals(target));
            LinearLayout itemView=AuroraDesign.nav(this,item[1],item[2],ACCENT,selected,()->showTab(target));
            LinearLayout.LayoutParams cell=new LinearLayout.LayoutParams(0,-1,1f);
            cell.leftMargin=dp(2);cell.rightMargin=dp(2);nav.addView(itemView,cell);
        }
    }

        private void showNativeHome(LinearLayout host){
        LinearLayout homeHero=AuroraDesign.hero(this,host,ACCENT,"✦  ANIME VOID   /   ТВОЯ ИСТОРИЯ",
            "Миры, в которые\nхочется вернуться.",
            "Собери свою вселенную из любимых историй. Найди что-то новое сегодня.",
            "Исследовать каталог",()->showTab("catalog"));
        nativeCatalog.showHomeHeroPoster(homeHero);
        int saved=0;
        try{saved=new JSONArray(getSharedPreferences(PREF,MODE_PRIVATE)
            .getString("native_catalog_favorites_v87","[]")).length();}catch(Exception ignored){}
        LinearLayout metrics=new LinearLayout(this);metrics.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams mp=new LinearLayout.LayoutParams(-1,-2);mp.bottomMargin=dp(25);host.addView(metrics,mp);
        LinearLayout.LayoutParams statLeft=new LinearLayout.LayoutParams(0,-2,1);
        statLeft.rightMargin=dp(9);
        metrics.addView(AuroraDesign.stat(this,String.valueOf(saved),"Сохранено локально",ACCENT),statLeft);
        metrics.addView(AuroraDesign.stat(this,String.valueOf(stored(DIARY).length()),
            "Записей в дневнике",AuroraTheme.LILAC),new LinearLayout.LayoutParams(0,-2,1));
        AuroraDesign.section(this,host,"ОТКРОЙ НОВОЕ","Постеры и свежие истории",ACCENT);
        LinearLayout showcaseSlot=new LinearLayout(this);
        showcaseSlot.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams showcaseLp=new LinearLayout.LayoutParams(-1,-2);
        showcaseLp.bottomMargin=dp(18);
        host.addView(showcaseSlot,showcaseLp);
        nativeCatalog.showHomeShowcase(showcaseSlot,()->showTab("catalog"));
        AuroraDesign.section(this,host,"ПРОДОЛЖИТЬ","Твои недавние истории",ACCENT);
        String recent=getSharedPreferences(PREF,MODE_PRIVATE).getString("lastAnimeUrl",null);
        if(recent!=null&&trusted(Uri.parse(recent))){
            AuroraDesign.addTile(this,host,"play","Продолжить просмотр",
                "Открыть последнюю страницу на ANIME VOID",ACCENT,()->openTrusted(recent));
        }
        JSONArray opened=stored("native_catalog_recent_v90");
        int added=0;
        for(int i=0;i<opened.length()&&added<3;i++){
            JSONObject entry=opened.optJSONObject(i);if(entry==null)continue;
            String id=entry.optString("id","");
            String name=entry.optString("name","Аниме");
            if(!id.matches("(?:shikimori|kinopoisk)-[1-9][0-9]*|kodik-(?:movie|serial)-[1-9][0-9]*"))continue;
            if(name.length()>52)name=name.substring(0,52)+"…";
            String target="https://animevoid.ru/kodik.html?title="+Uri.encode(id);
            AuroraDesign.addTile(this,host,"clock",name,
                "Недавно открыто в каталоге",AuroraTheme.LILAC,()->openTrusted(target));
            added++;
        }
        if(added==0&&(recent==null||!trusted(Uri.parse(recent)))){
            AuroraDesign.addTile(this,host,"sparkle","Здесь появятся твои находки",
                "Открой любое аниме из каталога",ACCENT,()->showTab("catalog"));
        }
        View gap=new View(this);host.addView(gap,new LinearLayout.LayoutParams(-1,dp(16)));
        AuroraDesign.section(this,host,"НАВИГАЦИЯ","Выбирай свой маршрут",ACCENT);
        AuroraDesign.addTile(this,host,"catalog","Каталог аниме и дунхуа",
            "Жанры, постеры, описания и переводы",ACCENT,()->showTab("catalog"));
        AuroraDesign.addTile(this,host,"search","Найти свою историю",
            "Поиск по названиям и фильтрам",AuroraTheme.LILAC,()->showTab("discover"));
        AuroraDesign.addTile(this,host,"heart","Моя коллекция",
            "Сохранённые тайтлы и личный дневник",AuroraTheme.PURPLE,()->showTab("library"));
        AuroraDesign.addTile(this,host,"bookmark","Подборки ANIME VOID",
            "Коллекции на сайте",ACCENT,()->openTrusted("https://animevoid.ru/collections.html"));
        View socialGap=new View(this);host.addView(socialGap,new LinearLayout.LayoutParams(-1,dp(10)));
        AuroraDesign.section(this,host,"СООБЩЕСТВО","Больше возможностей",ACCENT);
        AuroraDesign.addTile(this,host,"profile","Сообщество",
            "Общение и публикации",AuroraTheme.LILAC,
            ()->openTrusted("https://animevoid.ru/community.html"));
        AuroraDesign.addTile(this,host,"share","Личные сообщения",
            "Твои диалоги на ANIME VOID",AuroraTheme.PURPLE,
            ()->openTrusted("https://animevoid.ru/messages.html"));
        AuroraDesign.addTile(this,host,"sparkle","Anime Match",
            "Открой подбор историй по настроению",ACCENT,
            ()->openTrusted("https://animevoid.ru/match.html"));
        TextView foot=AuroraDesign.text(this,"ANIME VOID  ·  AURORA CINEMA  ·  V92",10,MUTED,true);
        foot.setGravity(Gravity.CENTER);foot.setLetterSpacing(.12f);
        foot.setPadding(0,dp(23),0,dp(5));host.addView(foot);
    }

        private void showDiscover(LinearLayout host){
        AuroraDesign.section(this,host,"EXPLORE   /   ANIME VOID","Найди свой мир",ACCENT);
        AuroraDesign.hero(this,host,AuroraTheme.LILAC,"✦  ИСТОРИИ БЕЗ ГРАНИЦ",
            "Следующая история\nуже ждёт тебя.",
            "Введи название аниме или открой жанры в каталоге.",
            "Открыть каталог",()->showTab("catalog"));
        LinearLayout panel=card(host);
        panel.addView(AuroraDesign.text(this,"Поиск по каталогу",18,AuroraTheme.FG,true));
        TextView helper=AuroraDesign.text(this,"Быстрый поиск по названию на русском или английском",12,MUTED,false);
        helper.setPadding(0,dp(8),0,dp(12));panel.addView(helper);
        EditText query=new EditText(this);
        query.setSingleLine(true);query.setHint("Название аниме, дунхуа…");
        query.setTextColor(AuroraTheme.FG);query.setHintTextColor(MUTED);query.setTextSize(15);
        query.setInputType(android.text.InputType.TYPE_CLASS_TEXT);
        query.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);
        query.setPadding(dp(14),0,dp(14),0);
        query.setBackground(AuroraDesign.panel(this,14));
        panel.addView(query,new LinearLayout.LayoutParams(-1,dp(53)));
        query.setOnEditorActionListener((v,action,event)->{
            if(action==android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH){
                openCatalogSearch(query.getText().toString());return true;
            }return false;
        });
        addButton(panel,"Найти аниме",()->openCatalogSearch(query.getText().toString()),true);
        View gap=new View(this);host.addView(gap,new LinearLayout.LayoutParams(-1,dp(8)));
        AuroraDesign.section(this,host,"БЫСТРЫЙ ДОСТУП","Исследовать ещё",ACCENT);
        AuroraDesign.addTile(this,host,"catalog","Все жанры и форматы",
            "Сериалы, фильмы и OVA",ACCENT,()->showTab("catalog"));
        AuroraDesign.addTile(this,host,"heart","Мои сохранённые",
            "Продолжи свою коллекцию",AuroraTheme.LILAC,()->showTab("favorites"));
        AuroraDesign.addTile(this,host,"sparkle","Рекомендации сайта",
            "Редакторские подборки ANIME VOID",AuroraTheme.PURPLE,
            ()->openTrusted(HOME+"#recommendedSection"));
        AuroraDesign.addTile(this,host,"bookmark","Манга и истории",
            "Раздел чтения ANIME VOID",ACCENT,
            ()->openTrusted("https://animevoid.ru/manga.html"));
        AuroraDesign.addTile(this,host,"play","Фильмы",
            "Отдельный кинораздел сайта",AuroraTheme.LILAC,
            ()->openTrusted("https://animevoid.ru/movies.html"));
    }

        private void openCatalogSearch(String entered){
        String q=entered==null?"":entered.trim();
        if(q.isEmpty()){showTab("catalog");return;}
        pendingCatalogQuery=q.substring(0,Math.min(120,q.length()));
        showTab("catalog");
    }

    private void showLibrary(LinearLayout host){
        AuroraDesign.hero(this,host,ACCENT,"♡  ANIME VOID   /   МОЯ ПОЛКА",
            "Коллекция,\nкоторая про тебя.",
            "Сохраняй любимые истории, возвращайся к просмотру и веди личные заметки.",
            "Открыть сохранённое",()->showTab("favorites"));
        AuroraDesign.section(this,host,"БИБЛИОТЕКА","Твоё пространство",ACCENT);
        AuroraDesign.addTile(this,host,"heart","Сохранённые тайтлы",
            "Избранное на этом устройстве",ACCENT,()->showTab("favorites"));
        AuroraDesign.addTile(this,host,"clock","История просмотра",
            "Настоящая история в твоём аккаунте на сайте",AuroraTheme.LILAC,
            ()->openTrusted("https://animevoid.ru/history.html"));
        AuroraDesign.addTile(this,host,"bookmark","Мои коллекции на сайте",
            "Списки и подборки, связанные с аккаунтом",AuroraTheme.PURPLE,
            ()->openTrusted("https://animevoid.ru/collections.html"));
        AuroraDesign.addTile(this,host,"sparkle","Личный дневник",
            stored(DIARY).length()+" заметок · доступны без интернета",ACCENT,
            ()->showTab("diary"));
        View space=new View(this);host.addView(space,new LinearLayout.LayoutParams(-1,dp(14)));
        AuroraDesign.section(this,host,"ДАННЫЕ ПРИЛОЖЕНИЯ","Сохрани свою библиотеку",ACCENT);
        AuroraDesign.addTile(this,host,"share","Экспортировать библиотеку",
            "Скачать локальные сохранения в JSON",ACCENT,
            ()->libraryBackup.exportToFile());
        AuroraDesign.addTile(this,host,"bookmark","Импортировать библиотеку",
            "Восстановить из сохранённого файла",AuroraTheme.LILAC,
            ()->libraryBackup.importFromFile());
        LinearLayout notice=card(host);
        notice.addView(AuroraDesign.text(this,
            "Избранное в приложении хранится локально. Аккаунт, XP и просмотренные серии работают на сайте и не подменяются вымышленными данными.",12,MUTED,false));
    }

        private void showNativeProfile(LinearLayout host){
        AuroraDesign.hero(this,host,AuroraTheme.LILAC,"◈  ANIME VOID   /   ЛИЧНЫЙ МИР",
            "Твоя история.\nТвои правила.",
            "Профиль, уровни, достижения и мастерская в одном пространстве.",
            "Мой профиль на сайте",()->openTrusted("https://animevoid.ru/profile.html"));
        AuroraDesign.section(this,host,"ПРОФИЛЬ И ДОСТИЖЕНИЯ","Твоя вселенная",ACCENT);
        AuroraDesign.addTile(this,host,"profile","Мой профиль",
            "Аватар, ранги, уровень и XP на сайте",AuroraTheme.LILAC,
            ()->openTrusted("https://animevoid.ru/profile.html"));
        AuroraDesign.addTile(this,host,"sparkle","Мастерская оформления",
            "Баннеры, темы и персонализация",ACCENT,
            ()->openTrusted("https://animevoid.ru/profile.html#profileWorkshop"));
        AuroraDesign.addTile(this,host,"bookmark","Достижения и ранги",
            "Открой реальные достижения своего аккаунта",AuroraTheme.PURPLE,
            ()->openTrusted("https://animevoid.ru/profile.html"));
        AuroraDesign.addTile(this,host,"share","Мои сообщения",
            "Чаты и переписки на сайте",ACCENT,
            ()->openTrusted("https://animevoid.ru/messages.html"));
        AuroraDesign.addTile(this,host,"profile","Аккаунт и вход",
            "Настройки учётной записи",AuroraTheme.LILAC,
            ()->openTrusted("https://animevoid.ru/account.html"));
        View space=new View(this);host.addView(space,new LinearLayout.LayoutParams(-1,dp(14)));
        AuroraDesign.section(this,host,"ИНСТРУМЕНТЫ","Приложение",ACCENT);
        AuroraDesign.addTile(this,host,"clock","Напоминания",
            "Локальные уведомления о просмотре",ACCENT,()->showTab("reminders"));
        AuroraDesign.addTile(this,host,"settings","Настройки и оформление",
            "Цветовые акценты и приватность",AuroraTheme.LILAC,()->showTab("settings"));
        AuroraDesign.addTile(this,host,"share","Поделиться ANIME VOID",
            "Пригласи друзей в свою вселенную",AuroraTheme.PURPLE,this::sharePage);
        TextView disclaimer=AuroraDesign.text(this,
            "Настоящий уровень, XP, ранги и достижения берутся из аккаунта на сайте. Здесь они не подменяются тестовыми цифрами.",11,MUTED,false);
        disclaimer.setPadding(0,dp(10),0,dp(4));host.addView(disclaimer);
    }

        private boolean trusted(Uri u){
        if(u==null||!"https".equalsIgnoreCase(u.getScheme()))return false;
        String host=u.getHost();
        return ("animevoid.ru".equalsIgnoreCase(host)||"www.animevoid.ru".equalsIgnoreCase(host))
            &&(u.getPort()==-1||u.getPort()==443)&&u.getUserInfo()==null;
    }
    private void openTrusted(String url){
        Uri u=Uri.parse(url);
        if(!trusted(u)){openExternal(url);return;}
        pendingWebUrl=u.toString();
        showTab("web");
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
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(false);
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setSafeBrowsingEnabled(true);
            settings.setUserAgentString(settings.getUserAgentString()+" AnimeVoidAndroid/1.0");
            CookieManager.getInstance().setAcceptCookie(true);
            CookieManager.getInstance().setAcceptThirdPartyCookies(browser,true);
            browser.setWebViewClient(new WebViewClient(){
                @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap favicon){
                    webMainFrameFailed=false;
                    if(webErrorHost!=null)webErrorHost.setVisibility(View.GONE);
                    if(webTitle!=null)webTitle.setText("ANIME VOID · ЗАГРУЗКА");
                }
                @Override public void onPageFinished(WebView view,String url){
                    super.onPageFinished(view,url);
                    if(webTitle!=null){
                        String pageTitle=view.getTitle();
                        if(pageTitle==null||pageTitle.trim().isEmpty())pageTitle="ANIME VOID";
                        if(pageTitle.length()>55)pageTitle=pageTitle.substring(0,55)+"…";
                        webTitle.setText(pageTitle);
                    }
                    if(webErrorHost!=null&&!webMainFrameFailed)webErrorHost.setVisibility(View.GONE);
                    Uri current=Uri.parse(url);
                    if(!trusted(current))return;
                    if(url.contains("/anime.html")||url.contains("/watch.html")
                        ||url.contains("/kodik.html")&&current.getQueryParameter("title")!=null){
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
                    if(request.isForMainFrame()){
                        webMainFrameFailed=true;
                        if(pageLoad!=null)pageLoad.setVisibility(View.GONE);
                        showWebError("Страница недоступна",
                            "Проверь интернет или открой каталог — сохранённые данные останутся доступными.");
                    }
                }
                @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,
                    android.webkit.WebResourceResponse error){
                    if(request.isForMainFrame()&&error.getStatusCode()>=500){
                        webMainFrameFailed=true;
                        showWebError("Сервис временно недоступен",
                            "Сервер ответил с ошибкой "+error.getStatusCode()+". Каталог приложения остаётся доступен.");
                    }
                }
                @Override public boolean onRenderProcessGone(WebView view,android.webkit.RenderProcessGoneDetail detail){
                    if(view.getParent() instanceof ViewGroup)((ViewGroup)view.getParent()).removeView(view);
                    view.destroy();browser=null;
                    if(pageLoad!=null)pageLoad.setVisibility(View.GONE);
                    if("web".equals(activeTab)){
                        toast("Плеер перезапущен после ошибки. Открой страницу ещё раз.");
                        showTab("home");
                    }
                    return true;
                }
            });
            browser.setWebChromeClient(new WebChromeClient(){
                @Override public void onReceivedTitle(WebView view,String title){
                    if(webTitle!=null&&title!=null&&!title.trim().isEmpty()){
                        webTitle.setText(title.length()>55?title.substring(0,55)+"…":title);
                    }
                }
                @Override public void onProgressChanged(WebView view,int progress){
                    if(pageLoad!=null){pageLoad.setProgress(progress);pageLoad.setVisibility("web".equals(activeTab)&&progress<100?View.VISIBLE:View.GONE);}
                }
                @Override public void onShowCustomView(View view,CustomViewCallback callback){
                    if(fullView!=null){callback.onCustomViewHidden();return;}
                    fullView=view;fullCallback=callback;root.setVisibility(View.GONE);
                    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                        |View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
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
        }
        String requested=pendingWebUrl;
        pendingWebUrl=null;
        if(requested!=null)browser.loadUrl(requested);
        else if(browser.getUrl()==null)browser.loadUrl(HOME);
        if(browser.getParent() instanceof ViewGroup)((ViewGroup)browser.getParent()).removeView(browser);
        webContainer=new LinearLayout(this);webContainer.setOrientation(LinearLayout.VERTICAL);
        webContainer.setBackgroundColor(AuroraTheme.BG);
        LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(10),dp(4),dp(10),dp(4));
        toolbar.setBackgroundColor(AuroraTheme.BG);
        View back=toolbarAction("back","Назад по истории",()->{
            if(browser!=null&&browser.canGoBack())browser.goBack();
            else showTab("catalog");
        });
        toolbar.addView(back,new LinearLayout.LayoutParams(dp(39),dp(39)));
        webTitle=AuroraDesign.text(this,"ANIME VOID / ПРОСМОТР",12,AuroraTheme.FG,true);
        webTitle.setSingleLine(true);
        webTitle.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(0,-2,1f);
        titleLp.leftMargin=dp(9);toolbar.addView(webTitle,titleLp);
        LinearLayout.LayoutParams smallLp=new LinearLayout.LayoutParams(dp(39),dp(39));
        smallLp.leftMargin=dp(5);
        toolbar.addView(toolbarAction("refresh","Обновить страницу",()->{
            if(browser!=null)browser.reload();
        }),smallLp);
        LinearLayout.LayoutParams browserLp=new LinearLayout.LayoutParams(dp(39),dp(39));
        browserLp.leftMargin=dp(5);
        toolbar.addView(toolbarAction("external","Открыть в браузере",()->{
            if(browser!=null&&browser.getUrl()!=null)openExternal(browser.getUrl());
            else openExternal(HOME);
        }),browserLp);
        webContainer.addView(toolbar,new LinearLayout.LayoutParams(-1,dp(49)));
        FrameLayout webSurface=new FrameLayout(this);
        webContainer.addView(webSurface,new LinearLayout.LayoutParams(-1,0,1f));
        webSurface.addView(browser,new FrameLayout.LayoutParams(-1,-1));
        webErrorHost=new FrameLayout(this);webErrorHost.setVisibility(View.GONE);
        webSurface.addView(webErrorHost,new FrameLayout.LayoutParams(-1,-1));
        content.addView(webContainer,new FrameLayout.LayoutParams(-1,-1));
    }
    private void showWebError(String title,String message){
        if(webErrorHost==null||!"web".equals(activeTab))return;
        webErrorHost.removeAllViews();
        webErrorHost.setBackgroundColor(AuroraTheme.BG);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
        LinearLayout column=new LinearLayout(this);column.setOrientation(LinearLayout.VERTICAL);
        column.setGravity(Gravity.CENTER_VERTICAL);
        column.setPadding(dp(24),dp(24),dp(24),dp(24));
        scroll.addView(column);
        AuroraDesign.hero(this,column,ACCENT,"ANIME VOID  /  ВОССТАНОВЛЕНИЕ",
            title,message,"Повторить загрузку",()->{
                if(webErrorHost!=null)webErrorHost.setVisibility(View.GONE);
                if(browser!=null)browser.reload();
            });
        AuroraDesign.addTile(this,column,"catalog","Перейти к каталогу",
            "Нативные постеры, фильтры и сохранённые тайтлы",ACCENT,()->showTab("catalog"));
        AuroraDesign.addTile(this,column,"external","Открыть страницу в Chrome",
            "Поможет, если вход или плеер не работают в приложении",AuroraTheme.LILAC,()->{
                if(browser!=null&&browser.getUrl()!=null)openExternal(browser.getUrl());
                else openExternal(HOME);
            });
        webErrorHost.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        webErrorHost.setVisibility(View.VISIBLE);
    }
    
    private void leaveFullScreen(){
        if(fullView==null)return;
        if(fullView.getParent() instanceof ViewGroup)((ViewGroup)fullView.getParent()).removeView(fullView);
        fullView=null;root.setVisibility(View.VISIBLE);
        getWindow().getDecorView().setSystemUiVisibility(0);
        if(fullCallback!=null){fullCallback.onCustomViewHidden();fullCallback=null;}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==LibraryBackup.EXPORT_REQUEST||requestCode==LibraryBackup.IMPORT_REQUEST){
            libraryBackup.onResult(requestCode,resultCode,data);return;
        }
        if(requestCode==PICK_FILE&&uploadCallback!=null){
            uploadCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
            uploadCallback=null;
        }
    }
    @Override public void onBackPressed(){
        if(fullView!=null){leaveFullScreen();return;}
        if("web".equals(activeTab)&&browser!=null&&browser.canGoBack()){browser.goBack();return;}
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
        if(nativeCatalog!=null)nativeCatalog.dispose();
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
        TextView eyebrow=AuroraDesign.kicker(this,"ANIME VOID  /  ЛИЧНОЕ ПРОСТРАНСТВО",ACCENT);
        LinearLayout.LayoutParams ep=new LinearLayout.LayoutParams(-1,-2);ep.bottomMargin=dp(10);
        host.addView(eyebrow,ep);
        TextView a=AuroraDesign.text(this,title,28,AuroraTheme.FG,true);a.setLetterSpacing(-.03f);host.addView(a);
        TextView b=AuroraDesign.text(this,subtitle,13,MUTED,false);
        b.setLineSpacing(dp(3),1f);b.setPadding(0,dp(10),0,dp(20));host.addView(b);
    }
    private LinearLayout card(LinearLayout host){
        LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(17),dp(17),dp(17),dp(17));c.setBackground(AuroraDesign.panel(this,21));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=dp(12);
        host.addView(c,p);return c;
    }
    private void addButton(LinearLayout box,String label,Runnable action,boolean main){
        Button b=button(label,action,main);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(48));p.topMargin=dp(9);
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
            addButton(item,"▶  Открыть на ANIME VOID",()->openTrusted(url),true);
            addButton(item,"✎  Изменить заметку",()->editExistingEntry(id),false);
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
    private void editExistingEntry(String id){
        JSONArray list=stored(DIARY);
        JSONObject existing=null;
        for(int i=0;i<list.length();i++){
            JSONObject row=list.optJSONObject(i);
            if(row!=null&&id.equals(row.optString("id"))){existing=row;break;}
        }
        if(existing==null){toast("Запись не найдена");return;}
        final JSONObject selected=existing;
        LinearLayout form=new LinearLayout(this);form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(18),dp(12),dp(18),dp(8));
        TextView noteLabel=AuroraDesign.kicker(this,"МОЯ БИБЛИОТЕКА  /  РЕДАКТИРОВАНИЕ",ACCENT);
        form.addView(noteLabel);
        EditText title=new EditText(this);title.setSingleLine(true);title.setHint("Название");
        title.setText(existing.optString("title",""));title.setTextColor(AuroraTheme.FG);
        form.addView(title);
        EditText note=new EditText(this);note.setMinLines(3);note.setHint("Твоя заметка");
        note.setText(existing.optString("note",""));note.setTextColor(AuroraTheme.FG);
        form.addView(note);
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Изменить запись")
            .setView(form).setNegativeButton("Отмена",null)
            .setPositiveButton("Сохранить",null).create();
        dialog.setOnShowListener(ignored->dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            .setOnClickListener(v->{
                String name=title.getText().toString().trim();
                if(name.isEmpty()){title.setError("Введи название");return;}
                try{
                    selected.put("title",name.substring(0,Math.min(160,name.length())));
                    String notes=note.getText().toString();
                    selected.put("note",notes.substring(0,Math.min(500,notes.length())));
                    store(DIARY,list);dialog.dismiss();showTab("diary");
                }catch(Exception ex){toast("Не удалось сохранить изменения");}
            }));
        dialog.show();
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
        boolean future=false;
        for(int i=0;i<reminders.length();i++)
            if(reminders.optJSONObject(i)!=null&&reminders.optJSONObject(i).optLong("when",0)>=System.currentTimeMillis())
                future=true;
        if(!future)card(root).addView(text("Активных напоминаний пока нет.",14,MUTED,false));
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
    private View paletteSwatch(String title,int color){
        LinearLayout tile=new LinearLayout(this);tile.setOrientation(LinearLayout.VERTICAL);
        tile.setGravity(Gravity.CENTER_HORIZONTAL);tile.setPadding(dp(7),dp(10),dp(7),dp(10));
        tile.setBackground(AuroraDesign.panel(this,13));
        View sample=new View(this);
        sample.setBackground(AuroraTheme.solid(color,9,color,1,getResources().getDisplayMetrics().density));
        tile.addView(sample,new LinearLayout.LayoutParams(-1,dp(34)));
        TextView label=AuroraDesign.text(this,title,10,AuroraTheme.MUTED,true);
        label.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(26));
        lp.topMargin=dp(7);tile.addView(label,lp);
        return tile;
    }
    private void confirmClearPosters(){
        new AlertDialog.Builder(this).setTitle("Очистить кеш обложек?")
            .setMessage("Удалятся только загруженные изображения. Сохранённые аниме, дневник, аккаунт и история сайта останутся без изменений.")
            .setNegativeButton("Отмена",null)
            .setPositiveButton("Очистить",(dialog,which)->{
                int amount=nativeCatalog.clearPosterCache();
                toast("Удалено файлов обложек: "+amount);
            }).show();
    }
    private void showSettings(LinearLayout root){
        heading(root,"Настройки","ANIME VOID · Android 2.4.0 / V94");
        AuroraDesign.section(this,root,"ОРИГИНАЛЬНЫЙ СТИЛЬ САЙТА","Единая фиолетовая палитра",ACCENT);
        LinearLayout palette=new LinearLayout(this);palette.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams row=new LinearLayout.LayoutParams(-1,-2);
        row.bottomMargin=dp(12);root.addView(palette,row);
        String[] labels={"Фон","Карточки","Акцент","Кнопки"};
        int[] colors={AuroraTheme.BG,AuroraTheme.PANEL,AuroraTheme.ACCENT,AuroraTheme.SOLID};
        for(int i=0;i<labels.length;i++){
            LinearLayout.LayoutParams cell=new LinearLayout.LayoutParams(0,-2,1f);
            if(i>0)cell.leftMargin=dp(7);
            palette.addView(paletteSwatch(labels[i],colors[i]),cell);
        }
        LinearLayout colorsBox=card(root);
        TextView paletteInfo=AuroraDesign.text(this,
            "Точная основная тема ANIME VOID: фон #0B0713, сливовые карточки #171020, лавандовый акцент #C1A2FF и фиолетовые кнопки #7C3AED. Без отдельной зелёной или бирюзовой палитры.",
            12,MUTED,false);
        paletteInfo.setLineSpacing(dp(3),1f);colorsBox.addView(paletteInfo);
        AuroraDesign.section(this,root,"БИБЛИОТЕКА","Храни свои истории",ACCENT);
        AuroraDesign.addTile(this,root,"share","Экспортировать библиотеку",
            "Локальные сохранения и заметки в файле JSON",ACCENT,
            ()->libraryBackup.exportToFile());
        AuroraDesign.addTile(this,root,"bookmark","Импортировать библиотеку",
            "Восстановить данные с другого телефона",AuroraTheme.LILAC,
            ()->libraryBackup.importFromFile());
        AuroraDesign.addTile(this,root,"refresh","Очистить кеш обложек",
            "Освободить память, не удаляя избранное",AuroraTheme.PURPLE,this::confirmClearPosters);
        View divider=new View(this);root.addView(divider,new LinearLayout.LayoutParams(-1,dp(17)));
        AuroraDesign.section(this,root,"АККАУНТ И ПРИВАТНОСТЬ","Твои данные",ACCENT);
        AuroraDesign.addTile(this,root,"profile","Профиль и аккаунт",
            "Настройки и достижения на сайте",ACCENT,
            ()->openTrusted("https://animevoid.ru/profile.html"));
        AuroraDesign.addTile(this,root,"external","Открыть вход в браузере",
            "Если Google-вход ограничен в WebView",AuroraTheme.LILAC,
            ()->openExternal("https://animevoid.ru/account.html"));
        AuroraDesign.addTile(this,root,"bookmark","Правила сообщества",
            "Политика общения и контента",AuroraTheme.PURPLE,
            ()->openTrusted("https://animevoid.ru/community-rules.html"));
        LinearLayout details=card(root);
        details.addView(AuroraDesign.kicker(this,"ANIME VOID  /  О ПРИЛОЖЕНИИ",ACCENT));
        TextView note=AuroraDesign.text(this,
            "Версия 2.4.0 · Android 8.0+. Дневник, избранное приложения и резервные копии хранятся на устройстве. Вход, уровни, история просмотра и плеер работают через сайт. Видеоконтент может предоставляться сторонними сервисами. Сейчас оплата и подписки не подключены.",
            12,MUTED,false);
        note.setLineSpacing(dp(4),1f);note.setPadding(0,dp(10),0,0);
        details.addView(note);
        TextView footer=AuroraDesign.kicker(this,"ANIME VOID · ORIGINAL WEBSITE DESIGN",ACCENT);
        footer.setGravity(Gravity.CENTER);footer.setPadding(0,dp(6),0,dp(10));root.addView(footer);
    }
    
    private void sharePage(){
        String url=browser!=null&&browser.getUrl()!=null?browser.getUrl():HOME;
        if(!trusted(Uri.parse(url)))url=HOME;
        Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT,"ANIME VOID — "+url);
        startActivity(Intent.createChooser(send,"Поделиться ссылкой"));
    }
}
