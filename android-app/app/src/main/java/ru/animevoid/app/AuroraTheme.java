package ru.animevoid.app;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;

/** Aurora Cinema: shared palette and touch-friendly Android surfaces. Mirrors av-visual-85.css. */
public final class AuroraTheme {
    private AuroraTheme(){}
    public static final int BG=Color.rgb(7,11,20);
    public static final int PANEL=Color.rgb(17,26,41);
    public static final int SOFT=Color.rgb(26,37,56);
    public static final int FG=Color.rgb(246,248,255);
    public static final int MUTED=Color.rgb(172,185,204);
    public static final int JADE=Color.rgb(140,241,212);
    public static final int LILAC=Color.rgb(196,165,255);
    public static final int GOLD=Color.rgb(245,211,154);
    public static final int LINE=Color.rgb(53,73,89);
    public static final int DARK_TEXT=Color.rgb(8,23,31);

    public static GradientDrawable solid(int fill,int radius,int strokeColor,int strokeSize,float density){
        GradientDrawable d=new GradientDrawable();d.setColor(fill);
        d.setCornerRadius(radius*density);if(strokeSize>0)d.setStroke(Math.max(1,(int)(strokeSize*density)),strokeColor);
        return d;
    }
    public static GradientDrawable hero(float density){
        GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(11,35,48),Color.rgb(19,25,43),Color.rgb(29,21,51)});
        d.setCornerRadius(25*density);d.setStroke(Math.max(1,(int)density),Color.rgb(61,111,109));
        return d;
    }
    public static Drawable touch(GradientDrawable surface,int highlight){
        return new RippleDrawable(ColorStateList.valueOf(highlight),surface,null);
    }
}
