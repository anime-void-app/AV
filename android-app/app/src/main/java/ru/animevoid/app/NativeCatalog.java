package ru.animevoid.app;

import android.app.Activity;
import android.app.AlertDialog;
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

    public NativeCatalog(Activity activity, Navigator navigator){this.activity=activity;this.navigator=navigator;}
    public void setAccent(int color){accent=color;}
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
        container.setPadding(dp(14),dp(22),dp(14),dp(24));
        scroll.addView(container);destination.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        TextView eyebrow=label("ANIME VOID   /   DISCOVERY",11,accent,true);
        eyebrow.setLetterSpacing(.12f);container.addView(eyebrow);
        LinearLayout hero=new LinearLayout(activity);hero.setOrientation(LinearLayout.VERTICAL);
        hero.setPadding(dp(19),dp(20),dp(19),dp(18));
        hero.setBackground(AuroraTheme.hero(activity.getResources().getDisplayMetrics().density));
        LinearLayout.LayoutParams heroP=new LinearLayout.LayoutParams(-1,-2);heroP.topMargin=dp(9);heroP.bottomMargin=dp(15);
        container.addView(hero,heroP);
        TextView overline=label(favorites?"МОЯ ПОДБОРКА · 01":"AURORA CINEMA · DISCOVERY",10,accent,true);
        overline.setLetterSpacing(.15f);hero.addView(overline);
        TextView heading=label(favorites?"Моя коллекция":"Открой свою\\nследующую историю",27,AuroraTheme.FG,true);
        heading.setPadding(0,dp(11),0,dp(6));hero.addView(heading);
        TextView subtitle=label(favorites?"То, что ты сохранил на этом устройстве":"Тысячи аниме · жанры · переводы · находки",13,AuroraTheme.MUTED,false);
        hero.addView(subtitle);
        if(!favorites)addButton(hero,"✧  Случайная история",()->{
            if(titles.isEmpty())return;
            java.util.Random random=new java.util.Random();
            detail(titles.get(random.nextInt(titles.size())));
        },true);

        search=new EditText(activity);
        search.setSingleLine(true);search.setHint("Название аниме на русском или английском");
        search.setTextColor(Color.WHITE);search.setHintTextColor(Color.rgb(162,181,196));
        search.setTextSize(15);search.setPadding(dp(14),0,dp(14),0);
        search.setBackground(background(AuroraTheme.SOFT,15));
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

        status=label("Загружаем каталог…",13,Color.rgb(160,193,204),false);
        status.setPadding(0,dp(15),0,dp(12));container.addView(status);
        results=new LinearLayout(activity);results.setOrientation(LinearLayout.VERTICAL);
        container.addView(results);
        if(!titles.isEmpty()){populateGenres();render();}
        if(!loaded)load();
    }
    private Spinner spinner(String[] labels){
        Spinner result=new Spinner(activity);
        ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,labels);
        result.setAdapter(adapter);result.setBackground(background(AuroraTheme.SOFT,12));
        return result;
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
        ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,android.R.layout.simple_spinner_dropdown_item,ordered);
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
                });
            }catch(Exception ex){
                main.post(()->{
                    loading=false;
                    if(status!=null&&screen!=null)status.setText("Не удалось загрузить каталог. Проверь интернет и повтори попытку.");
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
        GridLayout grid=new GridLayout(activity);grid.setColumnCount(2);grid.setUseDefaultMargins(false);
        results.addView(grid,new LinearLayout.LayoutParams(-1,-2));
        int width=activity.getResources().getDisplayMetrics().widthPixels-dp(38);
        int cardWidth=Math.max(dp(125),width/2-dp(6));
        int start=page*PAGE;
        for(int i=start;i<Math.min(all.size(),start+PAGE);i++){
            Item t=all.get(i);
            LinearLayout card=new LinearLayout(activity);card.setOrientation(LinearLayout.VERTICAL);
            card.setBackground(background(AuroraTheme.PANEL,18));card.setPadding(dp(7),dp(7),dp(7),dp(10));
            GridLayout.LayoutParams cp=new GridLayout.LayoutParams();cp.width=cardWidth;cp.height=-2;cp.setMargins(dp(2),dp(3),dp(5),dp(8));grid.addView(card,cp);
            FrameLayout cover=new FrameLayout(activity);
            cover.setBackground(AuroraTheme.hero(activity.getResources().getDisplayMetrics().density));card.addView(cover,new LinearLayout.LayoutParams(-1,dp(204)));
            TextView fallback=label("◈",41,accent,true);fallback.setGravity(Gravity.CENTER);
            cover.addView(fallback,new FrameLayout.LayoutParams(-1,-1));
            if(!t.poster.isEmpty()){
                ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
                cover.addView(poster,new FrameLayout.LayoutParams(-1,-1));loadImage(t.poster,poster);
            }
            TextView name=label(t.name,14,AuroraTheme.FG,true);name.setMaxLines(2);name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            name.setPadding(dp(4),dp(10),dp(2),dp(3));card.addView(name,new LinearLayout.LayoutParams(-1,dp(56)));
            TextView meta=label((t.year>0?t.year+"":"Год —")+"  ·  "+(t.type.equals("anime-serial")?"Сериал":"Фильм / OVA"),11,AuroraTheme.MUTED,false);
            meta.setPadding(dp(4),0,dp(2),dp(5));card.addView(meta);
            TextView badge=label("✧ "+t.variants+" переводов",10,accent,true);
            badge.setPadding(dp(4),0,0,0);card.addView(badge);
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
        ScrollView scroller=new ScrollView(activity);
        LinearLayout details=new LinearLayout(activity);details.setPadding(dp(19),dp(9),dp(19),dp(12));
        details.setOrientation(LinearLayout.VERTICAL);scroller.addView(details);
        LinearLayout cover=new LinearLayout(activity);cover.setGravity(Gravity.CENTER_VERTICAL);
        cover.setOrientation(LinearLayout.HORIZONTAL);
        details.addView(cover);
        ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
        poster.setBackground(AuroraTheme.hero(activity.getResources().getDisplayMetrics().density));
        cover.addView(poster,new LinearLayout.LayoutParams(dp(100),dp(144)));loadImage(t.poster,poster);
        LinearLayout metadata=new LinearLayout(activity);metadata.setOrientation(LinearLayout.VERTICAL);
        metadata.setPadding(dp(15),0,0,0);cover.addView(metadata,new LinearLayout.LayoutParams(0,-2,1f));
        metadata.addView(label("✦  "+(t.year>0?t.year:"Год неизвестен"),13,accent,true));
        TextView format=label(t.type.equals("anime-serial")?"Сериал":"Фильм / OVA",13,AuroraTheme.FG,false);
        format.setPadding(0,dp(6),0,0);metadata.addView(format);
        metadata.addView(label("◈  "+t.variants+" переводов",12,AuroraTheme.MUTED,false));
        TextView genres=label(String.join(" · ",t.genres),13,AuroraTheme.MUTED,false);
        genres.setPadding(0,dp(16),0,dp(10));details.addView(genres);
        TextView summaryTitle=label("ОБ ЭТОЙ ИСТОРИИ",11,accent,true);details.addView(summaryTitle);
        TextView description=label("Загружаем описание...",13,AuroraTheme.FG,false);
        description.setPadding(0,dp(10),0,dp(5));details.addView(description);
        boolean favored=favoriteIds().contains(t.id);
        AlertDialog dialog=new AlertDialog.Builder(activity).setTitle(t.name).setView(scroller)
            .setPositiveButton("▶ Смотреть",(d,which)->{
                rememberOpened(t);
                navigator.open(ORIGIN+"kodik.html?title="+android.net.Uri.encode(t.id));
            })
            .setNeutralButton(favored?"Убрать ♡":"Сохранить ♡",(d,which)->{
                toggleFavorite(t);if(onlyFavorites)render();
            })
            .setNegativeButton("Закрыть",null).create();
        dialog.show();
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
    public void dispose(){background.shutdownNow();posters.shutdownNow();}
}
