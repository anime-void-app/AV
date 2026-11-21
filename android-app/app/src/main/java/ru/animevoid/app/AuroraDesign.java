package ru.animevoid.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/** V92 reusable phone-first Aurora Cinema components. No external libraries, timers or network. */
public final class AuroraDesign {
    private AuroraDesign(){}
    public static int dp(Context c,float value){return (int)(c.getResources().getDisplayMetrics().density*value+.5f);}
    public static float density(Context c){return c.getResources().getDisplayMetrics().density;}
    public static TextView text(Context c,String value,int size,int color,boolean strong){
        TextView t=new TextView(c);
        t.setText(value);t.setTextSize(size);t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if(strong)t.setTypeface(Typeface.create("sans-serif-medium",Typeface.BOLD));
        else t.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));
        t.setIncludeFontPadding(false);
        return t;
    }
    public static GradientDrawable panel(Context c,int radius){
        GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(21,32,48),Color.rgb(12,20,33)});
        d.setCornerRadius(dp(c,radius));d.setStroke(dp(c,1),Color.rgb(49,67,87));
        return d;
    }
    public static GradientDrawable raised(Context c,int radius,int accent){
        GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(23,47,60),Color.rgb(17,25,44),Color.rgb(29,23,48)});
        d.setCornerRadius(dp(c,radius));d.setStroke(dp(c,1),tone(accent,.23f));
        return d;
    }
    public static int tone(int color,float t){
        int r=(int)(Color.red(color)*t+38*(1-t));
        int g=(int)(Color.green(color)*t+58*(1-t));
        int b=(int)(Color.blue(color)*t+73*(1-t));
        return Color.rgb(r,g,b);
    }
    public static TextView kicker(Context c,String s,int accent){
        TextView t=text(c,s,10,accent,true);t.setLetterSpacing(.16f);return t;
    }
    public static LinearLayout hero(Activity c,LinearLayout host,int accent,String index,String headline,String subtitle,String action,Runnable tap){
        FrameLayout canvas=new FrameLayout(c);
        canvas.setBackground(raised(c,25,accent));
        canvas.setClipToOutline(true);
        LinearLayout.LayoutParams outer=new LinearLayout.LayoutParams(-1,-2);
        outer.bottomMargin=dp(c,20);host.addView(canvas,outer);
        canvas.addView(new Nebula(c,accent),new FrameLayout.LayoutParams(-1,-1));
        LinearLayout body=new LinearLayout(c);body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(c,22),dp(c,27),dp(c,18),dp(c,23));
        canvas.addView(body,new FrameLayout.LayoutParams(-1,-2));
        body.addView(kicker(c,index,accent));
        TextView title=text(c,headline,29,AuroraTheme.FG,true);
        title.setLineSpacing(dp(c,2),1.0f);
        title.setLetterSpacing(-.032f);
        LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(-1,-2);
        titleLp.topMargin=dp(c,17);body.addView(title,titleLp);
        TextView sub=text(c,subtitle,13,AuroraTheme.MUTED,false);
        sub.setLineSpacing(dp(c,3),1);
        sub.setMaxWidth(dp(c,310));
        LinearLayout.LayoutParams subLp=new LinearLayout.LayoutParams(-1,-2);
        subLp.topMargin=dp(c,11);subLp.bottomMargin=dp(c,20);
        body.addView(sub,subLp);
        TextView btn=text(c,action+"   ›",13,AuroraTheme.DARK_TEXT,true);
        btn.setGravity(Gravity.CENTER);
        btn.setPadding(dp(c,16),0,dp(c,16),0);
        GradientDrawable fill=new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
            new int[]{accent,Color.rgb(179,232,231)});
        fill.setCornerRadius(dp(c,13));
        btn.setBackground(AuroraTheme.touch(fill,0x22ffffff));
        btn.setMinWidth(dp(c,194));btn.setContentDescription(action);
        body.addView(btn,new LinearLayout.LayoutParams(-2,dp(c,46)));
        btn.setOnClickListener(v->tap.run());
        return body;
    }
    public static void section(Context c,LinearLayout host,String eyebrow,String title,int accent){
        TextView kicker=kicker(c,eyebrow,accent);
        LinearLayout.LayoutParams kp=new LinearLayout.LayoutParams(-1,-2);
        kp.bottomMargin=dp(c,9);host.addView(kicker,kp);
        TextView heading=text(c,title,22,AuroraTheme.FG,true);
        heading.setLetterSpacing(-.03f);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.bottomMargin=dp(c,15);host.addView(heading,p);
    }
    public static LinearLayout tile(Context c,String symbol,String title,String caption,int accent,Runnable action){
        LinearLayout row=new LinearLayout(c);row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(c,15),dp(c,14),dp(c,14),dp(c,14));
        row.setBackground(AuroraTheme.touch(panel(c,17),0x18ffffff));
        SymbolView icon=new SymbolView(c,symbol,accent);
        icon.setBackground(AuroraTheme.solid(tone(accent,.12f),12,Color.rgb(59,87,105),1,density(c)));
        row.addView(icon,new LinearLayout.LayoutParams(dp(c,44),dp(c,44)));
        LinearLayout middle=new LinearLayout(c);middle.setOrientation(LinearLayout.VERTICAL);
        middle.setPadding(dp(c,13),0,dp(c,7),0);
        TextView h=text(c,title,15,AuroraTheme.FG,true);
        h.setMaxLines(1);h.setEllipsize(android.text.TextUtils.TruncateAt.END);
        middle.addView(h);
        if(caption!=null&&!caption.isEmpty()){
            TextView sub=text(c,caption,11,AuroraTheme.MUTED,false);
            sub.setPadding(0,dp(c,5),0,0);sub.setMaxLines(2);middle.addView(sub);
        }
        row.addView(middle,new LinearLayout.LayoutParams(0,-2,1));
        row.addView(new SymbolView(c,"chevron",AuroraTheme.MUTED),new LinearLayout.LayoutParams(dp(c,20),dp(c,24)));
        row.setContentDescription(title+(caption==null?"":", "+caption));
        row.setOnClickListener(v->action.run());
        return row;
    }
    public static void addTile(Context c,LinearLayout host,String symbol,String title,String caption,int accent,Runnable action){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.bottomMargin=dp(c,10);
        host.addView(tile(c,symbol,title,caption,accent,action),p);
    }
    public static LinearLayout stat(Context c,String value,String label,int accent){
        LinearLayout outer=new LinearLayout(c);outer.setOrientation(LinearLayout.VERTICAL);
        outer.setPadding(dp(c,16),dp(c,18),dp(c,10),dp(c,16));
        outer.setBackground(panel(c,17));
        TextView metric=text(c,value,25,accent,true);
        outer.addView(metric);
        TextView title=text(c,label,11,AuroraTheme.MUTED,false);title.setPadding(0,dp(c,8),0,0);
        outer.addView(title);return outer;
    }
    public static LinearLayout nav(Context c,String name,String text,int accent,boolean active,Runnable click){
        LinearLayout holder=new LinearLayout(c);holder.setOrientation(LinearLayout.VERTICAL);
        holder.setGravity(Gravity.CENTER_HORIZONTAL|Gravity.CENTER_VERTICAL);
        holder.setContentDescription(text);
        holder.setFocusable(true);
        holder.setBackground(AuroraTheme.touch(
            AuroraTheme.solid(active?Color.rgb(22,52,62):Color.rgb(10,16,27),15,
                active?tone(accent,.28f):Color.TRANSPARENT,active?1:0,density(c)),0x22ffffff));
        SymbolView art=new SymbolView(c,name,active?accent:AuroraTheme.MUTED);
        holder.addView(art,new LinearLayout.LayoutParams(dp(c,27),dp(c,27)));
        TextView title=text(c,text,10,active?accent:AuroraTheme.MUTED,active);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);tp.topMargin=dp(c,4);
        holder.addView(title,tp);
        holder.setOnClickListener(v->click.run());
        return holder;
    }
    public static final class SymbolView extends View {
        private final String symbol;
        private final int color;
        public SymbolView(Context c,String symbol,int color){super(c);this.symbol=symbol;this.color=color;setLayerType(View.LAYER_TYPE_SOFTWARE,null);}
        @Override protected void onDraw(Canvas canvas){
            super.onDraw(canvas);
            int save=canvas.save();
            float square=Math.min(getWidth(),getHeight());
            canvas.translate((getWidth()-square)/2f,(getHeight()-square)/2f);
            canvas.scale(square/24f,square/24f);
            Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);p.setColor(color);
            p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(1.8f);
            p.setStrokeCap(Paint.Cap.ROUND);p.setStrokeJoin(Paint.Join.ROUND);
            Path path=new Path();
            switch(symbol){
                case "home":
                    path.moveTo(3,11);path.lineTo(12,3.5f);path.lineTo(21,11);canvas.drawPath(path,p);
                    canvas.drawRoundRect(new RectF(5,10,19,21),2,2,p);
                    canvas.drawLine(10,21,10,15,p);canvas.drawLine(14,15,14,21,p);
                    break;
                case "catalog":
                    for(int x=0;x<2;x++)for(int y=0;y<2;y++)canvas.drawRoundRect(new RectF(4+x*9,4+y*9,11+x*9,11+y*9),1.5f,1.5f,p);
                    break;
                case "search":
                    canvas.drawCircle(10.5f,10.5f,6.5f,p);canvas.drawLine(16,16,21,21,p);break;
                case "heart":case "library":
                    path.moveTo(12,21);path.cubicTo(8,18,3,14.5f,3,9.8f);path.cubicTo(3,4,9,3,12,7.5f);
                    path.cubicTo(15,3,21,4,21,9.8f);path.cubicTo(21,14.5f,16,18,12,21);canvas.drawPath(path,p);break;
                case "profile":
                    canvas.drawCircle(12,8.5f,4,p);canvas.drawArc(new RectF(3.5f,12.5f,20.5f,25),196,148,false,p);break;
                case "play":
                    path.moveTo(8,5);path.lineTo(19,12);path.lineTo(8,19);path.close();canvas.drawPath(path,p);break;
                case "clock":
                    canvas.drawCircle(12,12,8.5f,p);canvas.drawLine(12,7,12,12,p);canvas.drawLine(12,12,16,14,p);break;
                case "sparkle":
                    path.moveTo(12,2);path.lineTo(14.5f,9.5f);path.lineTo(22,12);path.lineTo(14.5f,14.5f);
                    path.lineTo(12,22);path.lineTo(9.5f,14.5f);path.lineTo(2,12);path.lineTo(9.5f,9.5f);path.close();
                    canvas.drawPath(path,p);break;
                case "bookmark":
                    path.moveTo(7,3);path.lineTo(17,3);path.quadTo(18,3,18,5);path.lineTo(18,21);
                    path.lineTo(12,17);path.lineTo(6,21);path.lineTo(6,5);path.quadTo(6,3,7,3);canvas.drawPath(path,p);break;
                case "settings":
                    canvas.drawCircle(12,12,4,p);for(int i=0;i<8;i++){
                        double a=i*Math.PI/4;canvas.drawLine((float)(12+7*Math.cos(a)),(float)(12+7*Math.sin(a)),
                        (float)(12+9.5*Math.cos(a)),(float)(12+9.5*Math.sin(a)),p);}break;
                case "share":
                    canvas.drawLine(12,17,12,3,p);canvas.drawLine(7,8,12,3,p);canvas.drawLine(17,8,12,3,p);
                    canvas.drawRoundRect(new RectF(4,11,20,21),3,3,p);break;
                case "back":
                    canvas.drawLine(16,5,9,12,p);canvas.drawLine(9,12,16,19,p);break;
                case "refresh":
                    canvas.drawArc(new RectF(4,4,20,20),-45,295,false,p);
                    canvas.drawLine(19,4,20,10,p);canvas.drawLine(20,10,14,9,p);break;
                case "external":
                    canvas.drawRoundRect(new RectF(3,8,16,21),2,2,p);
                    canvas.drawLine(12,4,21,4,p);canvas.drawLine(21,4,21,13,p);
                    canvas.drawLine(21,4,10,15,p);break;
                case "chevron":
                    canvas.drawLine(8,5,15,12,p);canvas.drawLine(15,12,8,19,p);break;
                default:canvas.drawCircle(12,12,5,p);
            }
            canvas.restoreToCount(save);
        }
    }
    /** Procedural decorative paint, static on purpose to avoid CPU/battery animation loops. */
    public static final class Nebula extends View{
        private final int accent;
        private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        public Nebula(Context c,int accent){super(c);this.accent=accent;setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
        @Override protected void onDraw(Canvas canvas){
            super.onDraw(canvas);
            float w=getWidth(),h=getHeight();if(w<1||h<1)return;
            p.setShader(new LinearGradient(0,0,w,h,
                new int[]{Color.rgb(9,33,45),Color.rgb(15,25,47),Color.rgb(34,21,55)},null,Shader.TileMode.CLAMP));
            canvas.drawRect(0,0,w,h,p);p.setShader(null);
            p.setShader(new RadialGradient(w*.86f,h*.30f,w*.74f,new int[]{
                Color.argb(110,Color.red(accent),Color.green(accent),Color.blue(accent)),
                0x1533a8ce,0x00101828},null,Shader.TileMode.CLAMP));
            canvas.drawRect(0,0,w,h,p);p.setShader(null);
            p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(dp(getContext(),1.1f));
            for(int i=0;i<4;i++){
                p.setColor(Color.argb(58-i*10,155,220,224));
                float r=dp(getContext(),52+i*34);
                canvas.drawOval(new RectF(w*.94f-r,h*.43f-r,w*.94f+r,h*.43f+r),p);
            }
            p.setStyle(Paint.Style.FILL);
            p.setColor(0x65d4ecff);canvas.drawCircle(w*.88f,h*.34f,dp(getContext(),17),p);
            p.setColor(0x99f8feff);canvas.drawCircle(w*.88f,h*.34f,dp(getContext(),9),p);
            for(int i=0;i<23;i++){
                float x=((i*73+19)%101)/101f*w;
                float y=((i*43+71)%97)/97f*h;
                p.setColor(i%3==0?0x8ae2ffff:0x5fc9b9ee);
                canvas.drawCircle(x,y,dp(getContext(),i%6==0?1.45f:.7f),p);
            }
            p.setShader(new LinearGradient(0,0,w*.92f,0,new int[]{
                0xe90b1b29,0xb00d2034,0x0010192b},null,Shader.TileMode.CLAMP));
            canvas.drawRect(0,0,w,h,p);p.setShader(null);
        }
    }
}
