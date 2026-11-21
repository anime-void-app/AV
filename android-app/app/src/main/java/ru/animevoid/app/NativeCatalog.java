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

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
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
    private int accent=Color.rgb(140,241,212);

    public NativeCatalog(Activity activity, Navigator navigator){this.activity=activity;this.navigator=navigator;}
    public void setAccent(int color){accent=color;}
    private int dp(int n){return (int)(n*activity.getResources().getDisplayMetrics().density+.5f);}
    private GradientDrawable background(int color,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;
    }
    private TextView label(String value,int size,int color,boolean bold){
        TextView x=new TextView(activity);x.setText(value);x.setTextSize(size);x.setTextColor(color);
        x.setGravity(Gravity.CENTER_VERTICAL);if(bold)x.setTypeface(null,1);return x;
    }
    private Button button(String title,Runnable run,boolean primary){
        Button b=new Button(activity);b.setText(title);b.setAllCaps(false);b.setTextSize(12);
        b.setTextColor(primary?Color.rgb(5,31,35):Color.WHITE);
        b.setBackground(background(primary?accent:Color.rgb(35,51,68),13));
        b.setOnClickListener(v->run.run());return b;
    }
    private void addButton(LinearLayout host,String title,Runnable run,boolean primary){
        Button b=button(title,run,primary);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(44));
        p.topMargin=dp(10);host.addView(b,p);
    }
    public void show(FrameLayout destination,String initialQuery,boolean favorites){
        this.screen=destination;this.onlyFavorites=favorites;this.query=initialQuery==null?"":initialQuery.trim();
        this.page=0;this.selectedType="all";
        ScrollView scroll=new ScrollView(activity);scroll.setFillViewport(true);
        LinearLayout container=new LinearLayout(activity);container.setOrientation(LinearLayout.VERTICAL);
        container.setPadding(dp(14),dp(22),dp(14),dp(24));
        scroll.addView(container);destination.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        TextView eyebrow=label("ANIME VOID   /   DISCOVERY",11,accent,true);
        eyebrow.setLetterSpacing(.12f);container.addView(eyebrow);
        TextView heading=label(favorites?"Мои сохранённые":"Каталог аниме",28,Color.WHITE,true);
        heading.setPadding(0,dp(8),0,dp(5));container.addView(heading);
        TextView subtitle=label(favorites?"Локальное избранное на этом телефоне":"9 000+ историй · каталог из данных ANIME VOID",13,Color.rgb(172,189,202),false);
        subtitle.setPadding(0,0,0,dp(17));container.addView(subtitle);

        search=new EditText(activity);
        search.setSingleLine(true);search.setHint("Название аниме на русском или английском");
        search.setTextColor(Color.WHITE);search.setHintTextColor(Color.rgb(162,181,196));
        search.setTextSize(15);search.setPadding(dp(14),0,dp(14),0);
        search.setBackground(background(Color.rgb(25,39,55),15));
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
        LinearLayout.LayoutParams c=new LinearLayout.LayoutParams(-1,dp(47));c.topMargin=dp(12);
        container.addView(chips,c);
        for(String[] option:new String[][]{{"all","Все"},{"anime-serial","Сериалы"},{"anime","Фильмы/OVA"}}){
            String type=option[0];Button chip=button(option[1],()->{selectedType=type;page=0;render();},false);
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
        result.setAdapter(adapter);result.setBackground(background(Color.rgb(24,39,56),12));
        return result;
    }
    private AdapterView.OnItemSelectedListener choiceHandler(){
        return new AdapterView.OnItemSelectedListener(){
            public void onNothingSelected(AdapterView<?> view){}
            public void onItemSelected(AdapterView<?> p,View v,int pos,long id){page=0;render();}
        };
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
        if(cache.exists()&&cache.length()>300&&cache.length()<9_000_000
          &&System.currentTimeMillis()-cache.lastModified()<24L*3600*1000){
            try(FileInputStream stream=new FileInputStream(cache)){
                return new String(readBytes(stream,9_000_000),StandardCharsets.UTF_8);
            }
        }
        JSONObject manifest=new JSONObject(fetch(ORIGIN+"kodik-data/manifest.json",25000));
        String generation=manifest.optString("generation","");
        int count=manifest.optInt("uniqueTitles",0);
        if(!generation.matches("g-[A-Za-z0-9-]{1,75}")||count<100||count>25000)throw new IllegalArgumentException("invalid manifest");
        String json=fetch(ORIGIN+"kodik-data/"+generation+"/index.json",9_000_000);
        if(new JSONObject(json).getJSONArray("titles").length()!=count)throw new IllegalStateException("incomplete index");
        File temp=new File(activity.getCacheDir(),"av-kodik-index-v87.tmp");
        try(FileOutputStream out=new FileOutputStream(temp)){out.write(json.getBytes(StandardCharsets.UTF_8));}
        if(!temp.renameTo(cache)){temp.delete();}
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
            String title=normalize(t.name+" "+t.original);
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
        status.setText(all.size()+" тайтлов · страница "+(page+1)+" из "+pages);
        if(all.isEmpty()){results.addView(label("Ничего не найдено. Попробуй другое название или жанр.",14,Color.rgb(180,192,202),false));return;}
        GridLayout grid=new GridLayout(activity);grid.setColumnCount(2);grid.setUseDefaultMargins(false);
        results.addView(grid,new LinearLayout.LayoutParams(-1,-2));
        int width=activity.getResources().getDisplayMetrics().widthPixels-dp(38);
        int cardWidth=Math.max(dp(125),width/2-dp(6));
        int start=page*PAGE;
        for(int i=start;i<Math.min(all.size(),start+PAGE);i++){
            Item t=all.get(i);
            LinearLayout card=new LinearLayout(activity);card.setOrientation(LinearLayout.VERTICAL);
            card.setBackground(background(Color.rgb(21,35,51),17));card.setPadding(dp(7),dp(7),dp(7),dp(10));
            GridLayout.LayoutParams cp=new GridLayout.LayoutParams();cp.width=cardWidth;cp.height=-2;cp.setMargins(dp(2),dp(3),dp(5),dp(8));grid.addView(card,cp);
            FrameLayout cover=new FrameLayout(activity);
            cover.setBackground(background(Color.rgb(36,57,72),13));card.addView(cover,new LinearLayout.LayoutParams(-1,dp(204)));
            TextView fallback=label("✦",35,accent,true);fallback.setGravity(Gravity.CENTER);
            cover.addView(fallback,new FrameLayout.LayoutParams(-1,-1));
            if(!t.poster.isEmpty()){
                ImageView poster=new ImageView(activity);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);
                cover.addView(poster,new FrameLayout.LayoutParams(-1,-1));loadImage(t.poster,poster);
            }
            TextView name=label(t.name,14,Color.WHITE,true);name.setMaxLines(2);name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            name.setPadding(dp(4),dp(10),dp(2),dp(3));card.addView(name,new LinearLayout.LayoutParams(-1,dp(56)));
            TextView meta=label((t.year>0?t.year+"":"Год не указан")+"  ·  "+(t.type.equals("anime-serial")?"Сериал":"Фильм"),11,Color.rgb(173,191,205),false);
            meta.setPadding(dp(4),0,dp(2),dp(5));card.addView(meta);
            card.setOnClickListener(v->detail(t));
            card.setContentDescription(t.name+", "+t.year+", открыть описание");
        }
        LinearLayout pager=new LinearLayout(activity);pager.setGravity(Gravity.CENTER);pager.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(-1,dp(49));pp.topMargin=dp(15);results.addView(pager,pp);
        Button prev=button("← Назад",()->{page--;render();},false);prev.setEnabled(page>0);
        Button next=button("Вперёд →",()->{page++;render();},true);next.setEnabled(page+1<pages);
        LinearLayout.LayoutParams b1=new LinearLayout.LayoutParams(0,-1,1);b1.rightMargin=dp(5);pager.addView(prev,b1);
        pager.addView(next,new LinearLayout.LayoutParams(0,-1,1));
        addButton(results,"Открыть расширенный веб-каталог",()->navigator.open(ORIGIN+"kodik.html"),false);
    }
    private void detail(Item t){
        LinearLayout details=new LinearLayout(activity);details.setPadding(dp(19),dp(6),dp(19),0);
        details.setOrientation(LinearLayout.VERTICAL);
        TextView meta=label((t.year>0?t.year+" · ":"")+(t.type.equals("anime-serial")?"Сериал":"Фильм / OVA"),13,accent,true);
        details.addView(meta);
        TextView genres=label(String.join(" · ",t.genres),13,Color.rgb(184,202,216),false);
        genres.setPadding(0,dp(10),0,dp(6));details.addView(genres);
        String desc=t.description.isEmpty()?"Описание отсутствует в каталоге.":t.description;
        TextView description=label(desc.length()>1100?desc.substring(0,1100)+"…":desc,13,Color.WHITE,false);
        description.setPadding(0,dp(10),0,dp(12));details.addView(description);
        boolean favored=favoriteIds().contains(t.id);
        new AlertDialog.Builder(activity).setTitle(t.name).setView(details)
            .setPositiveButton("Открыть тайтл",(d,which)->navigator.open(ORIGIN+"kodik.html?title="+android.net.Uri.encode(t.id)))
            .setNeutralButton(favored?"Убрать из избранного":"♡ В избранное",(d,which)->{
                toggleFavorite(t);if(onlyFavorites)render();
            })
            .setNegativeButton("Закрыть",null).show();
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
                connection=(HttpURLConnection)new URL(address).openConnection();connection.setConnectTimeout(5000);
                connection.setReadTimeout(7000);connection.setInstanceFollowRedirects(false);
                if(connection.getResponseCode()!=200)return;
                byte[] data;try(InputStream is=connection.getInputStream()){data=readBytes(is,1_000_000);}
                BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=2;
                Bitmap b=BitmapFactory.decodeByteArray(data,0,data.length,options);
                if(b!=null){images.put(address,b);main.post(()->{if(address.equals(into.getTag()))into.setImageBitmap(b);});}
            }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}
        });
    }
    private static class Item{
        final String id,name,original,type,poster,description;final int year;final List<String> genres=new ArrayList<>();
        Item(JSONObject x){
            id=x.optString("id","");name=x.optString("titleRu",x.optString("titleOriginal","")).trim();
            original=x.optString("titleOriginal","");year=x.optInt("year",0);type=x.optString("type","");
            String url=x.optString("poster","");poster=safePoster(url)?url:"";
            description=x.optString("description","").replaceAll("<[^>]*>"," ").trim();
            JSONArray values=x.optJSONArray("genres");
            if(values!=null)for(int i=0;i<values.length()&&i<20;i++){
                String g=values.optString(i,"").trim();if(!g.isEmpty())genres.add(g);
            }
        }
    }
    public void dispose(){background.shutdownNow();posters.shutdownNow();}
}
