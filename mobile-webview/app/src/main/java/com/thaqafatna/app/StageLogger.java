package com.thaqafatna.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * StageLogger — نظام تخزين مراحل رحلة المستخدم
 *
 * يخزّن كل مرحلة يمرّ بها المستخدم في التطبيق لاستخدامها في:
 *  - تحليل تجربة المستخدم (UX analytics)
 *  - تشخيص الأعطال (debugging)
 *  - قياس الأداء وتحسين الرحلة
 *
 * التخزين مزدوج:
 *  1. SharedPreferences (سريع، للقراءة الحيّة)
 *  2. ملف JSON في filesDir (للتصدير والمراجعة)
 *
 * كل سجل: { ts, stage, meta }
 */
public class StageLogger {
    private static final String PREFS_NAME = "thaqafatna_journey";
    private static final String KEY_LOG = "journey_log";
    private static final String KEY_SESSION = "session_id";
    private static final String KEY_FIRST_LAUNCH = "first_launch";
    private static final int MAX_ENTRIES = 500; // حدّ أقصى لمنع النمو غير المحدود

    /** مراحل رحلة المستخدم الموحَّدة */
    public static final String
        STAGE_APP_LAUNCH        = "APP_LAUNCH",
        STAGE_WEBVIEW_INIT      = "WEBVIEW_INIT",
        STAGE_URL_LOADING       = "URL_LOADING",
        STAGE_PAGE_PROGRESS     = "PAGE_PROGRESS",
        STAGE_PAGE_LOADED       = "PAGE_LOADED",
        STAGE_OFFLINE_SHOWN     = "OFFLINE_SHOWN",
        STAGE_PDF_INTERCEPTED   = "PDF_INTERCEPTED",
        STAGE_PDF_OPENED_EXT    = "PDF_OPENED_EXTERNAL",
        STAGE_PDF_NO_VIEWER     = "PDF_NO_VIEWER",
        STAGE_FILE_DOWNLOAD     = "FILE_DOWNLOAD_STARTED",
        STAGE_EXT_INTENT        = "EXTERNAL_INTENT",
        STAGE_NAV_BACK          = "NAVIGATE_BACK",
        STAGE_APP_PAUSE         = "APP_PAUSE",
        STAGE_APP_RESUME        = "APP_RESUME",
        STAGE_APP_DESTROY       = "APP_DESTROY",
        STAGE_ERROR             = "ERROR_RECEIVED",
        STAGE_CONFIG_CHANGE     = "CONFIG_CHANGE",
        STAGE_RETRY             = "USER_RETRY";

    /** تسجيل مرحلة جديدة */
    public static void log(Context ctx, String stage) {
        log(ctx, stage, null);
    }

    /** تسجيل مرحلة مع بيانات إضافية (مثل رابط PDF، نسبة التحميل) */
    public static void log(Context ctx, String stage, String meta) {
        if (ctx == null) return;
        new Thread(() -> {
            try {
                SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                JSONArray arr = parseArray(prefs.getString(KEY_LOG, "[]"));

                JSONObject entry = new JSONObject();
                entry.put("ts", System.currentTimeMillis());
                entry.put("time", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
                entry.put("session", prefs.getString(KEY_SESSION, "unknown"));
                entry.put("stage", stage);
                if (meta != null) entry.put("meta", meta);

                arr.put(entry);

                // اقتطاع الأقدم عند تجاوز الحد
                while (arr.length() > MAX_ENTRIES) {
                    JSONArray newArr = new JSONArray();
                    for (int i = 1; i < arr.length(); i++) newArr.put(arr.get(i));
                    arr = newArr;
                }

                prefs.edit().putString(KEY_LOG, arr.toString()).apply();
                writeToFile(ctx, arr);
            } catch (Exception e) {
                // فشل التسجيل لا يُوقف التطبيق
            }
        }).start();
    }

    /** بدء جلسة جديدة (يُستدعى عند onCreate) */
    public static String startSession(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String sessionId = "s_" + System.currentTimeMillis();
        prefs.edit()
            .putString(KEY_SESSION, sessionId)
            .putLong(KEY_FIRST_LAUNCH, prefs.getLong(KEY_FIRST_LAUNCH, System.currentTimeMillis()))
            .apply();
        return sessionId;
    }

    /** قراءة السجل كاملاً (JSON string) */
    public static String getLog(Context ctx) {
        if (ctx == null) return "[]";
        return ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_LOG, "[]");
    }

    /** ملخّص إحصائي للمراحل (عدد كل مرحلة) */
    public static String getSummary(Context ctx) {
        try {
            JSONArray arr = parseArray(getLog(ctx));
            JSONObject counts = new JSONObject();
            for (int i = 0; i < arr.length(); i++) {
                String stage = arr.getJSONObject(i).optString("stage", "?");
                counts.put(stage, counts.optInt(stage, 0) + 1);
            }
            JSONObject summary = new JSONObject();
            summary.put("total_entries", arr.length());
            summary.put("first_launch", new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                .format(new Date(ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .getLong(KEY_FIRST_LAUNCH, System.currentTimeMillis()))));
            summary.put("stages", counts);
            return summary.toString(2);
        } catch (Exception e) {
            return "{}";
        }
    }

    /** مسح السجل (للاختبار أو خصوصية المستخدم) */
    public static void clear(Context ctx) {
        if (ctx == null) return;
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply();
        File f = new File(ctx.getFilesDir(), "journey_log.json");
        if (f.exists()) f.delete();
    }

    private static JSONArray parseArray(String s) {
        try { return new JSONArray(s); } catch (Exception e) { return new JSONArray(); }
    }

    private static void writeToFile(Context ctx, JSONArray arr) {
        FileWriter w = null;
        try {
            File f = new File(ctx.getFilesDir(), "journey_log.json");
            w = new FileWriter(f, false);
            w.write(arr.toString(2));
        } catch (Exception ignored) {
        } finally {
            if (w != null) try { w.close(); } catch (IOException ignored) {}
        }
    }
}
