package ru.animevoid.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.view.Window;
import android.view.WindowManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.LruCache;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.AdapterView;
import android.widget.TextView;
import android.text.TextUtils;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Arrays;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.lang.ref.WeakReference;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** V87: native metadata catalogue. No media downloading, bypasses or purchase state. */
public final class NativeCatalog {
    public interface Navigator { void open(String trustedUrl); }
    private static final String ORIGIN="https://animevoid.ru/";
    private static final String FAVORITES="native_catalog_favorites_v87";
    private static final int PAGE=24;
    private final Activity activity;
    private final Navigator navigator;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService background=Executors.newSingleThreadExecutor();
    private final ExecutorService posters=Executors.newFixedThreadPool(3);
    private final LruCache<String,Bitmap> images=new LruCache<String,Bitmap>(12*1024){
        @Override protected int sizeOf(String key,Bitmap value){return Math.max(1,value.getByteCount()/1024);}
    };
    private final List<Item> titles=new ArrayList<>();
    private final List<Button> filterButtons=new ArrayList<>();
    private ScrollView listScroll;
    private String generation="";
    private boolean loaded=false,loading=false;
    private FrameLayout screen;
    private LinearLayout results;
    private TextView status;
    private EditText search;
    private Spinner genreChoice,sortChoice;
    private String selectedType="all";
    private boolean onlyFavorites;
    private String query="";
    private int page=0;
    private Runnable pendingSearch;
    private int accent=AuroraTheme.JADE;
    private WeakReference<LinearLayout> showcaseHost=new WeakReference<>(null);
    private TextView showcaseHint;
    private Runnable goToCatalog=()->{};

    public NativeCatalog(Activity activity, Navigator navigator){this.activity=activity;this.navigator=navigator;}
    public void setAccent(int color){accent=color;}
    /** Public on-device catalogue artwork shared by the native home screen; no fake ratings. */
    public void showHomeShowcase(LinearLayout host,Runnable openCatalog){
        showcaseHost=new WeakReference<>(host);
        goToCatalog=openCatalog;
        showcaseHint=label("Подбираем постеры из каталога…",12,AuroraTheme.MUTED,false);
        host.addView(showcaseHint);
        if(loaded)host.post(this::renderHomeShowcase);
        else if(!loading)load();
    }
    private void renderHomeShowcase(){
        LinearLayout target=showcaseHost.get();
        if(target==null||target.getWindowToken()==null)return;
        if(showcaseHint!=null&&showcaseHint.getParent()==target)target.removeView(showcaseHint);
        target.removeAllViews();
        ArrayList<Item> recent=new ArrayList<>();
        for(Item item:titles){
            if(item.year>=2000&&!item.poster.isEmpty()&&!item.name.isEmpty()&&item.variants>0)recent.add(item);
        }
        recent.sort(Comparator.comparingInt((Item t)->t.year).reversed().thenComparing(t->t.name));
        if(recent.isEmpty()){
            AuroraDesign.addTile(activity,target,"catalog","Открыть каталог",
                "Каталог доступен в отдельной вкладке",accent,
                goToCatalog);
            return;
        }
        Item lead=recent.get(0);
        LinearLayout feature=new LinearLayout(activity);feature.setGravity(Gravity.CENTER_VERTICAL);
        feature.setBackground(AuroraDesign.raised(activity,20,accent));
        feature.setPadding(dp(11),dp(11),dp(13),dp(11));
        LinearLayout.LayoutParams fp=new LinearLayout.LayoutParams(-1,-2);
        fp.bottomMargin=dp(14);target.addView(feature,fp);
        ImageView image=new ImageView(activity);
        image.setScaleType(ImageView.ScaleType.CENTER_CROP);
        image.setBackground(new AuroraDesign.PosterArt(accent));
        image.setClipToOutline(true);
        feature.addView(image,new LinearLayout.LayoutParams(dp(112),dp(155)));
        loadImage(lead.poster,image);
        LinearLayout copy=new LinearLayout(activity);copy.setOrientation(LinearLayout.VERTICAL);
        copy.setPadding(dp(14),dp(4),0,dp(4));
        feature.addView(copy,new LinearLayout.LayoutParams(0,-2,1f));
        copy.addView(AuroraDesign.kicker(activity,"✦  В КАТАЛОГЕ  /  "+lead.year,accent));
        TextView title=label(lead.name,16,AuroraTheme.FG,true);
        title.setMaxLines(3);title.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);
        tp.topMargin=dp(11);copy.addView(title,tp);
        TextView info=label((lead.type.equals("anime-serial")?"Сериал":"Фильм")+"  ·  "+lead.variants+" переводов",
            11,AuroraTheme.MUTED,false);
        info.setPadding(0,dp(8),0,dp(9));copy.addView(info);
        TextView cta=label("Подробнее  ›",12,accent,true);copy.addView(cta);
        feature.setOnClickListener(v->detail(lead));
        feature.setContentDescription("Открыть аниме "+lead.name);
        HorizontalScrollView track=new HorizontalScrollView(activity);
        track.setHorizontalScrollBarEnabled(false);
        track.setClipToPadding(false);track.setFillViewport(false);
        LinearLayout shelf=new LinearLayout(activity);shelf.setOrientation(LinearLayout.HORIZONTAL);
        shelf.setPadding(0,dp(1),dp(2),dp(6));
        track.addView(shelf);target.addView(track,new LinearLayout.LayoutParams(-1,-2));
        int count=0;
        for(Item t:recent){
            if(t.id.equals(lead.id))continue;
            if(count++>=9)break;
            LinearLayout card=new LinearLayout(activity);card.setOrientation(LinearLayout.VERTICAL);
            card.setBackground(AuroraDesign.panel(activity,15));
            card.setPadding(dp(6),dp(6),dp(6),dp(8));
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(141),-2);
            cp.rightMargin=dp(11);shelf.addView(card,cp);
            FrameLayout wrap=new FrameLayout(activity);
            wrap.setBackground(new AuroraDesign.PosterArt(accent));
            wrap.setClipToOutline(true);
            card.addView(wrap,new LinearLayout.LayoutParams(-1,dp(174)));
            ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
            wrap.addView(poster,new FrameLayout.LayoutParams(-1,-1));loadImage(t.poster,poster);
            TextView year=label(" "+t.year+" ",10,AuroraTheme.FG,true);
            year.setBackground(AuroraTheme.solid(0xe21a2436,8,Color.TRANSPARENT,0,
                activity.getResources().getDisplayMetrics().density));
            FrameLayout.LayoutParams yp=new FrameLayout.LayoutParams(-2,dp(22),Gravity.TOP|Gravity.LEFT);
            yp.leftMargin=dp(7);yp.topMargin=dp(7);wrap.addView(year,yp);
            TextView name=label(t.name,12,AuroraTheme.FG,true);
            name.setPadding(dp(3),dp(10),dp(2),0);
            name.setMaxLines(2);name.setEllipsize(TextUtils.TruncateAt.END);
            card.addView(name,new LinearLayout.LayoutParams(-1,dp(52)));
            card.setOnClickListener(v->detail(t));
            card.setContentDescription(t.name+" — открыть описание");
        }
        AuroraDesign.addTile(activity,target,"catalog","Весь каталог",
            "Поиск по жанрам, годам и названиям",accent,
            goToCatalog);
    }

    private int dp(int n){return (int)(n*activity.getResources().getDisplayMetrics().density+.5f);}
    private GradientDrawable background(int color,int radius){
        return AuroraTheme.solid(color,radius,AuroraTheme.LINE,1,activity.getResources().getDisplayMetrics().density);
    }
    private TextView label(String value,int size,int color,boolean bold){
        TextView x=new TextView(activity);x.setText(value);x.setTextSize(size);x.setTextColor(color);
        x.setGravity(Gravity.CENTER_VERTICAL);if(bold)x.setTypeface(null,1);return x;
    }
    private Button button(String title,Runnable run,boolean primary){
        Button b=new Button(activity);b.setText(title);b.setAllCaps(false);b.setTextSize(12);
        b.setTextColor(primary?AuroraTheme.DARK_TEXT:AuroraTheme.FG);
        b.setBackground(AuroraTheme.touch(AuroraTheme.solid(primary?accent:AuroraTheme.SOFT,13,
            primary?accent:AuroraTheme.LINE,1,activity.getResources().getDisplayMetrics().density),0x25ffffff));
        b.setOnClickListener(v->run.run());return b;
    }
    private void addButton(LinearLayout host,String title,Runnable run,boolean primary){
        Button b=button(title,run,primary);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(44));
        p.topMargin=dp(10);host.addView(b,p);
    }
    public void show(FrameLayout destination,String initialQuery,boolean favorites){
        this.screen=destination;this.onlyFavorites=favorites;this.query=initialQuery==null?"":initialQuery.trim();
        this.page=0;this.selectedType="all";
        ScrollView scroll=new ScrollView(activity);scroll.setFillViewport(true);listScroll=scroll;
        LinearLayout container=new LinearLayout(activity);container.setOrientation(LinearLayout.VERTICAL);
        container.setPadding(dp(16),dp(21),dp(16),dp(26));
        scroll.setVerticalScrollBarEnabled(false);
        scroll.addView(container);destination.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        AuroraDesign.hero(activity,container,accent,
            favorites?"♡  МОЯ БИБЛИОТЕКА  /  ANIME VOID":"✦  AURORA CINEMA  /  DISCOVERY",
            favorites?"Мои любимые\nистории.":"Твоя следующая\nлюбимая история.",
            favorites?"Сохранено на этом устройстве. Открой историю в одно касание."
                :"Исследуй мир аниме и дунхуа. Жанры, новые открытия и твоя коллекция.",
            favorites?"К общему каталогу":"Случайная история",()->{
                if(favorites){onlyFavorites=false;render();return;}
                if(titles.isEmpty())return;
                detail(titles.get(new java.util.Random().nextInt(titles.size())));
            });
        AuroraDesign.section(activity,container,"ПОИСК  /  ФИЛЬТРЫ",
            favorites?"Найти в сохранённом":"Исследовать каталог",accent);
        search=new EditText(activity);
        search.setSingleLine(true);search.setHint("Название аниме или дунхуа…");
        search.setTextColor(Color.WHITE);search.setHintTextColor(Color.rgb(162,181,196));
        search.setTextSize(15);search.setPadding(dp(14),0,dp(14),0);
        search.setBackground(AuroraDesign.panel(activity,15));
        search.setText(query);
        container.addView(search,new LinearLayout.LayoutParams(-1,dp(54)));
        search.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){
                query=s.toString();page=0;
                if(pendingSearch!=null)main.removeCallbacks(pendingSearch);
                pendingSearch=()->{if(screen==destination)render();};
                main.postDelayed(pendingSearch,200);
            }
            public void afterTextChanged(Editable s){}
        });

        LinearLayout chips=new LinearLayout(activity);chips.setOrientation(LinearLayout.HORIZONTAL);
        filterButtons.clear();
        LinearLayout.LayoutParams c=new LinearLayout.LayoutParams(-1,dp(47));c.topMargin=dp(12);
        container.addView(chips,c);
        for(String[] option:new String[][]{{"all","Все"},{"anime-serial","Сериалы"},{"anime","Фильмы/OVA"}}){
            String type=option[0];Button chip=button(option[1],()->{selectedType=type;page=0;styleFilterChips();render();},false);
            filterButtons.add(chip);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(0,-1,1);cp.rightMargin=dp(5);chips.addView(chip,cp);
        }

        LinearLayout selectors=new LinearLayout(activity);
        selectors.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(49));sp.topMargin=dp(10);
        container.addView(selectors,sp);
        genreChoice=spinner(new String[]{"Все жанры"});
        sortChoice=spinner(new String[]{"По названию","Сначала новые","Сначала старые"});
        selectors.addView(genreChoice,new LinearLayout.LayoutParams(0,-1,1.2f));
        LinearLayout.LayoutParams sortParam=new LinearLayout.LayoutParams(0,-1,1);sortParam.leftMargin=dp(7);
        selectors.addView(sortChoice,sortParam);
        styleFilterChips();
        genreChoice.setOnItemSelectedListener(choiceHandler());
        sortChoice.setOnItemSelectedListener(choiceHandler());

        status=label("Загружаем каталог…",12,accent,true);
        status.setPadding(0,dp(15),0,dp(12));container.addView(status);
        results=new LinearLayout(activity);results.setOrientation(LinearLayout.VERTICAL);
        container.addView(results);
        if(!titles.isEmpty()){populateGenres();render();}
        if(!loaded)load();
    }
    private Spinner spinner(String[] labels){
        Spinner result=new Spinner(activity);
        result.setAdapter(genreAdapter(Arrays.asList(labels)));
        result.setPadding(dp(9),0,dp(7),0);
        result.setBackground(AuroraDesign.panel(activity,13));
        return result;
    }
    private ArrayAdapter<String> genreAdapter(List<String> labels){
        return new ArrayAdapter<String>(activity,android.R.layout.simple_spinner_item,labels){
            @Override public View getView(int position,View convert,ViewGroup parent){
                TextView t=label(getItem(position),12,AuroraTheme.FG,true);
                t.setPadding(dp(8),dp(6),dp(7),dp(6));t.setSingleLine(true);
                t.setEllipsize(android.text.TextUtils.TruncateAt.END);return t;
            }
            @Override public View getDropDownView(int position,View convert,ViewGroup parent){
                TextView t=label(getItem(position),13,AuroraTheme.FG,false);
                t.setPadding(dp(16),dp(12),dp(16),dp(12));
                t.setBackgroundColor(AuroraTheme.PANEL);return t;
            }
        };
    }
    private AdapterView.OnItemSelectedListener choiceHandler(){
        return new AdapterView.OnItemSelectedListener(){
            public void onNothingSelected(AdapterView<?> view){}
            public void onItemSelected(AdapterView<?> p,View v,int pos,long id){page=0;render();}
        };
    }
    private void styleFilterChips(){
        for(int i=0;i<filterButtons.size();i++){
            Button chip=filterButtons.get(i);
            boolean on=(i==0&&"all".equals(selectedType))||(i==1&&"anime-serial".equals(selectedType))||(i==2&&"anime".equals(selectedType));
            chip.setTextColor(on?AuroraTheme.DARK_TEXT:AuroraTheme.MUTED);
            chip.setBackground(AuroraTheme.touch(AuroraTheme.solid(on?accent:AuroraTheme.SOFT,13,
                on?accent:AuroraTheme.LINE,1,activity.getResources().getDisplayMetrics().density),0x22ffffff));
        }
    }
    private void populateGenres(){
        if(genreChoice==null)return;
        String selected=genreChoice.getSelectedItem()==null?"Все жанры":genreChoice.getSelectedItem().toString();
        Set<String> all=new LinkedHashSet<>();for(Item t:titles)for(String g:t.genres)all.add(g);
        List<String> ordered=new ArrayList<>(all);Collections.sort(ordered);
        ordered.add(0,"Все жанры");
        ArrayAdapter<String> adapter=genreAdapter(ordered);
        genreChoice.setAdapter(adapter);
        int at=ordered.indexOf(selected);genreChoice.setSelection(at<0?0:at);
    }
    private void load(){
        if(loading)return;
        loading=true;if(status!=null)status.setText("Загружаем метаданные и проверяем кеш…");
        background.execute(()->{
            try{
                String source=readCatalog();
                JSONObject root=new JSONObject(source);
                JSONArray entries=root.getJSONArray("titles");
                if(entries.length()<100||entries.length()>25000)throw new IllegalStateException("index length");
                ArrayList<Item> valid=new ArrayList<>();
                Set<String> known=new HashSet<>();
                for(int i=0;i<entries.length();i++){
                    JSONObject x=entries.optJSONObject(i);if(x==null)continue;
                    String id=x.optString("id","");
                    if(!id.matches("(?:shikimori|kinopoisk)-[1-9][0-9]*|kodik-(?:movie|serial)-[1-9][0-9]*")||!known.add(id))continue;
                    Item t=new Item(x);
                    if(t.name.isEmpty())continue;
                    if(t.genres.contains("Хентай")||t.genres.contains("Эротика"))continue;
                    valid.add(t);
                }
                if(valid.size()<100)throw new IllegalStateException("catalog validation");
                main.post(()->{
                    titles.clear();titles.addAll(valid);loaded=true;loading=false;
                    if(screen!=null&&screen.getParent()!=null){populateGenres();render();}
                    renderHomeShowcase();
                });
            }catch(Exception ex){
                main.post(()->{
                    loading=false;
                    if(status!=null&&screen!=null)status.setText("Не удалось загрузить каталог. Проверь интернет и повтори попытку.");
                    if(showcaseHint!=null&&showcaseHost.get()!=null){
                        showcaseHint.setText("Постеры недоступны без интернета. Попробуй открыть каталог позже.");
                    }
                    if(results!=null){results.removeAllViews();addButton(results,"Повторить загрузку",this::load,true);
                        addButton(results,"Открыть веб-каталог",()->navigator.open(ORIGIN+"kodik.html"),false);}
                });
            }
        });
    }
    private String readCatalog() throws Exception{
        File cache=new File(activity.getCacheDir(),"av-kodik-index-v87.json");
        File savedGen=new File(activity.getCacheDir(),"av-kodik-generation-v90.txt");
        if(savedGen.exists()){
            try(FileInputStream is=new FileInputStream(savedGen)){
                String existing=new String(readBytes(is,120),StandardCharsets.UTF_8).trim();
                if(existing.matches("g-[A-Za-z0-9-]{1,75}"))generation=existing;
            }catch(Exception ignored){}
        }
        if(cache.exists()&&cache.length()>300&&cache.length()<9_000_000
          &&System.currentTimeMillis()-cache.lastModified()<24L*3600*1000){
            try(FileInputStream stream=new FileInputStream(cache)){
                return new String(readBytes(stream,9_000_000),StandardCharsets.UTF_8);
            }
        }
        try{return downloadCatalog(cache,savedGen);}
        catch(Exception network){
            if(cache.exists()&&cache.length()>300&&cache.length()<9_000_000){
                try(FileInputStream is=new FileInputStream(cache)){return new String(readBytes(is,9_000_000),StandardCharsets.UTF_8);}
            }
            throw network;
        }
    }
    private String downloadCatalog(File cache,File savedGen) throws Exception{
        JSONObject manifest=new JSONObject(fetch(ORIGIN+"kodik-data/manifest.json",25000));
        String generation=manifest.optString("generation","");
        int count=manifest.optInt("uniqueTitles",0);
        if(!generation.matches("g-[A-Za-z0-9-]{1,75}")||count<100||count>25000)throw new IllegalArgumentException("invalid manifest");
        String json=fetch(ORIGIN+"kodik-data/"+generation+"/index.json",9_000_000);
        if(new JSONObject(json).getJSONArray("titles").length()!=count)throw new IllegalStateException("incomplete index");
        File temp=new File(activity.getCacheDir(),"av-kodik-index-v87.tmp");
        try(FileOutputStream out=new FileOutputStream(temp)){out.write(json.getBytes(StandardCharsets.UTF_8));}
        if(!temp.renameTo(cache)){temp.delete();}
        this.generation=generation;
        try(FileOutputStream stream=new FileOutputStream(savedGen)){
            stream.write(generation.getBytes(StandardCharsets.UTF_8));
        }
        return json;
    }
    private static byte[] readBytes(InputStream input,int max) throws Exception{
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        byte[] buf=new byte[8192];int n;
        while((n=input.read(buf))!=-1){
            if(bytes.size()+n>max)throw new IllegalStateException("too large");
            bytes.write(buf,0,n);
        }
        return bytes.toByteArray();
    }
    private static String fetch(String uri,int limit) throws Exception{
        URL url=new URL(uri);
        if(!"https".equals(url.getProtocol())||!"animevoid.ru".equals(url.getHost()))throw new IllegalArgumentException("host");
        HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(7000);c.setReadTimeout(16000);
        c.setInstanceFollowRedirects(false);c.setRequestProperty("Accept","application/json");
        try{
            if(c.getResponseCode()!=200)throw new IllegalStateException("HTTP "+c.getResponseCode());
            try(InputStream input=c.getInputStream()){return new String(readBytes(input,limit),StandardCharsets.UTF_8);}
        }finally{c.disconnect();}
    }
    private static String normalize(String s){
        return s.toLowerCase(Locale.ROOT).replace('ё','е').replaceAll("\\s+"," ").trim();
    }
    private List<Item> filtered(){
        String[] words=normalize(query).split(" ");
        String genre=genreChoice==null||genreChoice.getSelectedItem()==null?"Все жанры":genreChoice.getSelectedItem().toString();
        ArrayList<Item> selected=new ArrayList<>();
        Set<String> fav=onlyFavorites?favoriteIds():null;
        for(Item t:titles){
            if(fav!=null&&!fav.contains(t.id))continue;
            if(!selectedType.equals("all")&&!selectedType.equals(t.type))continue;
            if(!genre.equals("Все жанры")&&!t.genres.contains(genre))continue;
            String title=t.searchable;
            boolean match=true;for(String word:words)if(!word.isEmpty()&&!title.contains(word)){match=false;break;}
            if(match)selected.add(t);
        }
        int sort=sortChoice==null?0:sortChoice.getSelectedItemPosition();
        if(sort==1)selected.sort(Comparator.comparingInt((Item a)->a.year).reversed().thenComparing(a->a.name));
        else if(sort==2)selected.sort(Comparator.comparingInt((Item a)->a.year).thenComparing(a->a.name));
        else selected.sort(Comparator.comparing(a->a.name.toLowerCase(Locale.ROOT)));
        return selected;
    }
    private void render(){
        if(results==null||screen==null||!loaded)return;
        results.removeAllViews();
        List<Item> all=filtered();
        int pages=Math.max(1,(all.size()+PAGE-1)/PAGE);page=Math.min(page,pages-1);
        status.setText("✦  "+all.size()+" тайтлов    ·    "+(page+1)+" / "+pages);
        if(all.isEmpty()){results.addView(label("Ничего не найдено. Попробуй другое название или жанр.",14,Color.rgb(180,192,202),false));return;}
        LinearLayout row=null;
        Set<String> selectedFavorites=favoriteIds();
        int start=page*PAGE;
        for(int i=start;i<Math.min(all.size(),start+PAGE);i++){
            Item t=all.get(i);
            if((i-start)%2==0){
                row=new LinearLayout(activity);row.setOrientation(LinearLayout.HORIZONTAL);
                LinearLayout.LayoutParams rowParams=new LinearLayout.LayoutParams(-1,-2);
                rowParams.bottomMargin=dp(10);results.addView(row,rowParams);
            }
            LinearLayout card=new LinearLayout(activity);card.setOrientation(LinearLayout.VERTICAL);
            card.setBackground(AuroraDesign.panel(activity,19));
            card.setPadding(dp(7),dp(7),dp(7),dp(12));
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(0,-2,1);
            if((i-start)%2==0)cp.rightMargin=dp(5);else cp.leftMargin=dp(5);
            row.addView(card,cp);
            FrameLayout cover=new FrameLayout(activity);
            cover.setBackground(new AuroraDesign.PosterArt(accent));
            cover.setClipToOutline(true);
            card.addView(cover,new LinearLayout.LayoutParams(-1,dp(209)));
            TextView fallback=label("✦",42,accent,true);fallback.setGravity(Gravity.CENTER);
            cover.addView(fallback,new FrameLayout.LayoutParams(-1,-1));
            if(!t.poster.isEmpty()){
                ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
                cover.addView(poster,new FrameLayout.LayoutParams(-1,-1));loadImage(t.poster,poster);
            }
            TextView type=label(t.type.equals("anime-serial")?"  СЕРИАЛ  ":"  ФИЛЬМ / OVA  ",10,AuroraTheme.FG,true);
            type.setBackground(AuroraTheme.solid(0xd70d1b2b,9,Color.TRANSPARENT,0,
                activity.getResources().getDisplayMetrics().density));
            FrameLayout.LayoutParams typeP=new FrameLayout.LayoutParams(-2,dp(25),Gravity.TOP|Gravity.LEFT);
            typeP.leftMargin=dp(8);typeP.topMargin=dp(8);cover.addView(type,typeP);
            TextView fav=label(selectedFavorites.contains(t.id)?"♥":"♡",22,accent,true);
            fav.setGravity(Gravity.CENTER);fav.setContentDescription("В избранное: "+t.name);
            fav.setBackground(AuroraTheme.touch(AuroraTheme.solid(0xe10d1b2b,11,Color.TRANSPARENT,0,
                activity.getResources().getDisplayMetrics().density),0x20ffffff));
            FrameLayout.LayoutParams favP=new FrameLayout.LayoutParams(dp(34),dp(34),Gravity.RIGHT|Gravity.TOP);
            favP.rightMargin=dp(7);favP.topMargin=dp(7);cover.addView(fav,favP);
            fav.setOnClickListener(v->{
                toggleFavorite(t);fav.setText(favoriteIds().contains(t.id)?"♥":"♡");
                if(onlyFavorites)render();
            });
            TextView name=label(t.name,14,AuroraTheme.FG,true);
            name.setMaxLines(2);name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            name.setPadding(dp(5),dp(11),dp(5),dp(4));
            card.addView(name,new LinearLayout.LayoutParams(-1,dp(57)));
            TextView meta=label((t.year>0?t.year+"":"—")+"  ·  "+
                (t.type.equals("anime-serial")?"Сериал":"Фильм / OVA"),11,AuroraTheme.MUTED,false);
            meta.setPadding(dp(5),0,dp(2),dp(6));card.addView(meta);
            TextView badge=label("✧  "+t.variants+" переводов",10,accent,true);
            badge.setPadding(dp(5),0,0,0);card.addView(badge);
            card.setOnClickListener(v->detail(t));
            card.setContentDescription(t.name+", "+t.year+", открыть описание");
        }
        LinearLayout pager=new LinearLayout(activity);pager.setGravity(Gravity.CENTER);pager.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(-1,dp(49));pp.topMargin=dp(15);results.addView(pager,pp);
        Button prev=button("← Назад",()->{page--;render();if(listScroll!=null)listScroll.smoothScrollTo(0,dp(280));},false);prev.setEnabled(page>0);
        Button next=button("Вперёд →",()->{page++;render();if(listScroll!=null)listScroll.smoothScrollTo(0,dp(280));},true);next.setEnabled(page+1<pages);
        LinearLayout.LayoutParams b1=new LinearLayout.LayoutParams(0,-1,1);b1.rightMargin=dp(5);pager.addView(prev,b1);
        pager.addView(next,new LinearLayout.LayoutParams(0,-1,1));
        addButton(results,"Открыть расширенный веб-каталог",()->navigator.open(ORIGIN+"kodik.html"),false);
    }
    private void rememberOpened(Item t){
        SharedPreferences p=activity.getSharedPreferences("av_native_v1",Context.MODE_PRIVATE);
        JSONArray old;
        try{old=new JSONArray(p.getString("native_catalog_recent_v90","[]"));}catch(Exception e){old=new JSONArray();}
        JSONArray fresh=new JSONArray();JSONObject top=new JSONObject();
        try{top.put("id",t.id);top.put("name",t.name);top.put("when",System.currentTimeMillis());fresh.put(top);}
        catch(Exception ignored){}
        for(int i=0;i<old.length()&&fresh.length()<12;i++){
            JSONObject item=old.optJSONObject(i);if(item!=null&&!t.id.equals(item.optString("id")))fresh.put(item);
        }
        p.edit().putString("native_catalog_recent_v90",fresh.toString()).apply();
    }
    private void detail(Item t){
        Dialog dialog=new Dialog(activity);
        LinearLayout sheet=new LinearLayout(activity);sheet.setOrientation(LinearLayout.VERTICAL);
        sheet.setPadding(dp(18),dp(12),dp(18),dp(18));
        sheet.setBackground(AuroraDesign.raised(activity,25,accent));
        ScrollView scroller=new ScrollView(activity);scroller.setFillViewport(false);
        scroller.setVerticalScrollBarEnabled(false);
        LinearLayout details=new LinearLayout(activity);details.setOrientation(LinearLayout.VERTICAL);
        details.setPadding(dp(4),dp(6),dp(4),dp(8));
        scroller.addView(details);
        TextView handle=label("━",21,AuroraTheme.MUTED,true);
        handle.setGravity(Gravity.CENTER);sheet.addView(handle,new LinearLayout.LayoutParams(-1,dp(26)));
        TextView over=AuroraDesign.kicker(activity,"✦  ANIME VOID   /   ИСТОРИЯ",accent);
        details.addView(over);
        TextView heading=label(t.name,23,AuroraTheme.FG,true);
        heading.setLetterSpacing(-.02f);heading.setPadding(0,dp(12),0,dp(14));
        details.addView(heading);
        LinearLayout cover=new LinearLayout(activity);cover.setGravity(Gravity.TOP);
        cover.setOrientation(LinearLayout.HORIZONTAL);details.addView(cover);
        ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
        poster.setBackground(new AuroraDesign.PosterArt(accent));
        cover.addView(poster,new LinearLayout.LayoutParams(dp(109),dp(157)));loadImage(t.poster,poster);
        LinearLayout metadata=new LinearLayout(activity);metadata.setOrientation(LinearLayout.VERTICAL);
        metadata.setPadding(dp(15),dp(5),0,0);cover.addView(metadata,new LinearLayout.LayoutParams(0,-2,1f));
        metadata.addView(label("✦  "+(t.year>0?t.year:"Год неизвестен"),14,accent,true));
        TextView format=label(t.type.equals("anime-serial")?"Аниме-сериал":"Фильм / OVA",
            14,AuroraTheme.FG,true);format.setPadding(0,dp(12),0,0);metadata.addView(format);
        TextView language=label("◈  "+t.variants+" переводов",12,AuroraTheme.MUTED,false);
        language.setPadding(0,dp(10),0,0);metadata.addView(language);
        TextView genres=label(String.join("  ·  ",t.genres),12,AuroraTheme.MUTED,false);
        genres.setPadding(0,dp(16),0,dp(14));details.addView(genres);
        View rule=new View(activity);rule.setBackgroundColor(AuroraTheme.LINE);
        details.addView(rule,new LinearLayout.LayoutParams(-1,dp(1)));
        TextView summaryTitle=AuroraDesign.kicker(activity,"ОБ ЭТОЙ ИСТОРИИ",accent);
        summaryTitle.setPadding(0,dp(16),0,0);details.addView(summaryTitle);
        TextView description=label("Загружаем описание...",13,AuroraTheme.FG,false);
        description.setLineSpacing(dp(4),1f);
        description.setPadding(0,dp(12),0,dp(8));details.addView(description);
        sheet.addView(scroller,new LinearLayout.LayoutParams(-1,0,1f));
        Button watch=button("▶   Смотреть аниме",()->{
            rememberOpened(t);dialog.dismiss();
            navigator.open(ORIGIN+"kodik.html?title="+android.net.Uri.encode(t.id));
        },true);
        LinearLayout.LayoutParams wp=new LinearLayout.LayoutParams(-1,dp(49));wp.topMargin=dp(7);
        sheet.addView(watch,wp);
        boolean favored=favoriteIds().contains(t.id);
        Button saved=button(favored?"♥   Удалить из избранного":"♡   В мою коллекцию",()->{
            toggleFavorite(t);
            boolean isSaved=favoriteIds().contains(t.id);
            if(onlyFavorites&&!isSaved){dialog.dismiss();render();}
            else {
                if(screen!=null&&!onlyFavorites)render();
                dialog.dismiss();
            }
        },false);
        LinearLayout.LayoutParams favp=new LinearLayout.LayoutParams(-1,dp(45));favp.topMargin=dp(9);
        sheet.addView(saved,favp);
        dialog.setContentView(sheet);
        Window window=dialog.getWindow();
        if(window!=null){
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            WindowManager.LayoutParams attrs=window.getAttributes();
            attrs.gravity=Gravity.BOTTOM;attrs.dimAmount=.72f;
            attrs.width=activity.getResources().getDisplayMetrics().widthPixels-dp(10);
            attrs.height=Math.min(dp(720),(int)(activity.getResources().getDisplayMetrics().heightPixels*.88f));
            window.setAttributes(attrs);
        }
        dialog.show();
        if(dialog.getWindow()!=null){
            dialog.getWindow().setLayout(activity.getResources().getDisplayMetrics().widthPixels-dp(10),
                Math.min(dp(720),(int)(activity.getResources().getDisplayMetrics().heightPixels*.88f)));
        }
        if(t.chunk.matches("titles-[0-9]{4}\\.json")){
            background.execute(()->{
                String info="Описание не предоставлено каталогом.";
                try{
                    String activeGen=generation;
                    if(activeGen.isEmpty()){
                        JSONObject manifest=new JSONObject(fetch(ORIGIN+"kodik-data/manifest.json",25000));
                        activeGen=manifest.optString("generation","");
                        if(!activeGen.matches("g-[A-Za-z0-9-]{1,75}"))throw new IllegalStateException("Invalid generation");
                        generation=activeGen;
                    }
                    String content=fetch(ORIGIN+"kodik-data/"+activeGen+"/"+t.chunk,2_000_000);
                    JSONArray all=new JSONObject(content).getJSONArray("titles");
                    for(int i=0;i<all.length();i++){
                        JSONObject o=all.optJSONObject(i);
                        if(o!=null&&t.id.equals(o.optString("id"))){
                            String found=o.optString("description","").replaceAll("<[^>]*>"," ").trim();
                            if(!found.isEmpty()){info=found.length()>1800?found.substring(0,1800)+"…":found;}
                            break;
                        }
                    }
                }catch(Exception ignored){info="Описание временно недоступно. Страница просмотра может содержать дополнительные сведения.";}
                final String result=info;
                main.post(()->{if(dialog.isShowing())description.setText(result);});
            });
        }else description.setText("Описание и переводы доступны при открытии тайтла.");
    }
    
    private Set<String> favoriteIds(){
        SharedPreferences p=activity.getSharedPreferences("av_native_v1",Context.MODE_PRIVATE);
        String raw=p.getString(FAVORITES,"[]");Set<String> ids=new LinkedHashSet<>();
        try{JSONArray a=new JSONArray(raw);for(int i=0;i<a.length()&&i<400;i++){String id=a.optString(i,"");if(id.length()<90)ids.add(id);}}
        catch(Exception ignored){}return ids;
    }
    private void toggleFavorite(Item item){
        Set<String> ids=favoriteIds();if(!ids.remove(item.id)&&ids.size()<300)ids.add(item.id);
        JSONArray serialized=new JSONArray();for(String id:ids)serialized.put(id);
        activity.getSharedPreferences("av_native_v1",Context.MODE_PRIVATE).edit().putString(FAVORITES,serialized.toString()).apply();
    }
    private static boolean safePoster(String address){
        try{
            URL url=new URL(address);if(!"https".equals(url.getProtocol()))return false;
            String host=url.getHost().toLowerCase(Locale.ROOT);
            for(String allowed:new String[]{"shikimori.one","shikimori.io","shikimori.me","shikimori.org","shikimori.net","kodikres.com","kodikcdn.com","myanimelist.net"}){
                if(host.equals(allowed)||host.endsWith("."+allowed))return true;
            }
        }catch(Exception ignored){}
        return false;
    }
    private void loadImage(String address,ImageView into){
        if(!safePoster(address))return;
        into.setTag(address);
        Bitmap cached=images.get(address);
        if(cached!=null){into.setImageBitmap(cached);return;}
        posters.execute(()->{
            HttpURLConnection connection=null;
            try{
                File folder=new File(activity.getCacheDir(),"poster_v90");
                if(!folder.exists())folder.mkdirs();
                MessageDigest digest=MessageDigest.getInstance("SHA-256");
                byte[] checksum=digest.digest(address.getBytes(StandardCharsets.UTF_8));
                StringBuilder filename=new StringBuilder();
                for(int i=0;i<18;i++)filename.append(String.format(Locale.ROOT,"%02x",checksum[i]&255));
                File saved=new File(folder,filename+".img");
                byte[] data;
                if(saved.exists()&&saved.length()>100&&saved.length()<1_000_000
                  &&System.currentTimeMillis()-saved.lastModified()<14L*24*3600*1000){
                    try(FileInputStream in=new FileInputStream(saved)){data=readBytes(in,1_000_000);}
                }else{
                    connection=(HttpURLConnection)new URL(address).openConnection();connection.setConnectTimeout(5000);
                    connection.setReadTimeout(7000);connection.setInstanceFollowRedirects(false);
                    if(connection.getResponseCode()!=200)return;
                    try(InputStream is=connection.getInputStream()){data=readBytes(is,1_000_000);}
                    File tmp=new File(folder,filename+".tmp");
                    try(FileOutputStream out=new FileOutputStream(tmp)){out.write(data);}
                    if(!tmp.renameTo(saved))tmp.delete();
                    File[] existing=folder.listFiles();
                    if(existing!=null&&existing.length>100){
                        Arrays.sort(existing,Comparator.comparingLong(File::lastModified));
                        for(int i=0;i<existing.length-80;i++)existing[i].delete();
                    }
                }
                BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=2;
                Bitmap b=BitmapFactory.decodeByteArray(data,0,data.length,options);
                if(b!=null){images.put(address,b);main.post(()->{if(address.equals(into.getTag()))into.setImageBitmap(b);});}
            }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}
        });
    }
    
    private static class Item{
        final String id,name,original,type,poster,chunk,searchable;final int year,variants;final List<String> genres=new ArrayList<>();
        Item(JSONObject x){
            id=x.optString("id","");name=x.optString("titleRu",x.optString("titleOriginal","")).trim();
            original=x.optString("titleOriginal","");year=x.optInt("year",0);type=x.optString("type","");
            String url=x.optString("poster","");poster=safePoster(url)?url:"";
            chunk=x.optString("chunk","");variants=x.optInt("variantCount",0);
            searchable=normalize(name+" "+original);
            JSONArray values=x.optJSONArray("genres");
            if(values!=null)for(int i=0;i<values.length()&&i<20;i++){
                String g=values.optString(i,"").trim();if(!g.isEmpty())genres.add(g);
            }
        }
    }
    /** User-controlled image-cache cleanup; preserves bookmarks, notes and catalog metadata. */
    public int clearPosterCache(){
        images.evictAll();
        File folder=new File(activity.getCacheDir(),"poster_v90");
        File[] files=folder.listFiles();
        int deleted=0;
        if(files!=null)for(File file:files){
            if(file.isFile()&&file.getName().matches("[0-9a-f]{36}\\.(?:img|tmp)")&&file.delete())deleted++;
        }
        return deleted;
    }
    
    public void dispose(){
        if(pendingSearch!=null)main.removeCallbacks(pendingSearch);
        showcaseHost.clear();background.shutdownNow();posters.shutdownNow();
    }
}
