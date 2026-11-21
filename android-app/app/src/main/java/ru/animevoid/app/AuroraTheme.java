package ru.animevoid.app;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;

/** Exact default ANIME VOID website palette from av-design.css + site-polish.css. */
public final class AuroraTheme {
    private AuroraTheme(){}
    public static final int BG=Color.rgb(11,7,19);             // #0b0713
    public static final int PANEL=Color.rgb(23,16,32);         // #171020
    public static final int SOFT=Color.rgb(36,22,50);          // #241632
    public static final int TINT=Color.rgb(48,27,72);          // #301b48
    public static final int FG=Color.rgb(244,242,250);         // #f4f2fa
    public static final int MUTED=Color.rgb(182,177,197);      // #b6b1c5
    public static final int ACCENT=Color.rgb(193,162,255);     // #c1a2ff
    public static final int LILAC=Color.rgb(216,180,254);      // #d8b4fe
    public static final int PURPLE=Color.rgb(168,85,247);      // #a855f7
    public static final int SOLID=Color.rgb(124,58,237);       // #7c3aed
    public static final int LINE=Color.rgb(73,48,95);          // #49305f
    public static final int DARK_TEXT=Color.WHITE;

    public static GradientDrawable solid(int fill,int radius,int strokeColor,int strokeSize,float density){
        GradientDrawable d=new GradientDrawable();d.setColor(fill);
        d.setCornerRadius(radius*density);if(strokeSize>0)d.setStroke(Math.max(1,(int)(strokeSize*density)),strokeColor);
        return d;
    }
    public static GradientDrawable hero(float density){
        GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{PANEL,SOFT,TINT});
        d.setCornerRadius(25*density);d.setStroke(Math.max(1,(int)density),0x66c1a2ff);
        return d;
    }
    public static Drawable touch(GradientDrawable surface,int highlight){
        return new RippleDrawable(ColorStateList.valueOf(highlight),surface,null);
    }
}
