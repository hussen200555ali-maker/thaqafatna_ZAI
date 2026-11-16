package com.thaqafatna.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.DownloadListener;
import android.webkit.MimeTypeMap;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar loadingBar;
    private FrameLayout root;
    private static final String HOME_URL = "https://thaqafatna-qr.vercel.app/m";
    private static final String PDF_DIR = "pdfs";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StageLogger.startSession(this);
        StageLogger.log(this, StageLogger.STAGE_APP_LAUNCH);

        setupWindow();
        buildRootView();
        configureWebView();

        if (savedInstanceState == null) {
            if (isOnline()) {
                StageLogger.log(this, StageLogger.STAGE_URL_LOADING, HOME_URL);
                webView.loadUrl(HOME_URL);
            } else {
                loadOfflinePage();
            }
        }
    }

    // ====== إعداد النافذة: edge-to-edge + شريط الحالة + insets ======
    private void setupWindow() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        // لون شريط الحالة مطابق للخلفية (تجانس بصري)
        window.setStatusBarColor(Color.parseColor("#1A1A2E"));
        window.setNavigationBarColor(Color.parseColor("#1A1A2E"));

        // Edge-to-edge على Android 11+ (محتوى يمتد خلف شرائط النظام)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        }

        // إضاءة شريط الحالة حسب لون الخلفية
        View decor = window.getDecorView();
        int flags = decor.getSystemUiVisibility();
        flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        decor.setSystemUiVisibility(flags);
    }

    // ====== بناء الحاوية الجذرية + WebView + شريط التحميل ======
    private void buildRootView() {
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#1A1A2E"));

        webView = new WebView(this);
        FrameLayout.LayoutParams webParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        // تطبيق insets يدوياً (لأن edge-to-edge يجعل المحتوى يمتد تحت الشرائط)
        applyInsets(webView);
        webView.setLayoutParams(webParams);
        root.addView(webView);

        // شريط تحميل علوي (نمط Chrome) — مؤشر تقدّم بصري للمستخدم
        loadingBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                dp(3));
        barParams.gravity = Gravity.TOP;
        loadingBar.setLayoutParams(barParams);
        loadingBar.setMax(100);
        loadingBar.setProgress(0);
        loadingBar.setBackgroundColor(Color.TRANSPARENT);
        loadingBar.setVisibility(View.GONE);
        // لون التقدّم ذهبي ليتناسق مع هوية التطبيق
        loadingBar.getProgressDrawable().setColorFilter(
                Color.parseColor("#C9A961"), android.graphics.PorterDuff.Mode.SRC_IN);
        // رفع شريط التحميل تحت شريط الحالة
        applyTopInset(loadingBar);
        root.addView(loadingBar);

        setContentView(root);
    }

    // تطبيق insets على WebView حتى لا يختفي المحتوى تحت شريط الحالة/التنقّل
    private void applyInsets(final View v) {
        root.setOnApplyWindowInsetsListener((host, insets) -> {
            int top, bottom, left, right;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                top = bars.top; bottom = bars.bottom;
                left = bars.left; right = bars.right;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
                left = insets.getSystemWindowInsetLeft();
                right = insets.getSystemWindowInsetRight();
            }
            v.setPadding(left, top, right, bottom);
            return insets;
        });
    }

    private void applyTopInset(final View v) {
        root.setOnApplyWindowInsetsListener((host, insets) -> {
            int top;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                top = insets.getInsets(WindowInsets.Type.systemBars()).top;
            } else {
                top = insets.getSystemWindowInsetTop();
            }
            FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) v.getLayoutParams();
            p.topMargin = top;
            v.setLayoutParams(p);
            return insets;
        });
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    // ====== إعداد WebView: تجاوب + PDF + dark mode + intent ======
    private void configureWebView() {
        StageLogger.log(this, StageLogger.STAGE_WEBVIEW_INIT);
        WebSettings settings = webView.getSettings();

        // --- التجاوب مع جميع أحجام الشاشات ---
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        // احترام حجم خط النظام لإمكانية الوصول
        settings.setTextZoom(100);

        // --- محتوى متقدّم ---
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setDefaultTextEncodingName("UTF-8");
        settings.setGeolocationEnabled(false);

        // --- دعم الوضع الداكن للموقع (API 33+) ---
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            settings.setAlgorithmicDarkeningAllowed(true);
        }

        webView.setWebViewClient(new ThaqafatnaWebViewClient());
        webView.setWebChromeClient(new ThaqafatnaChromeClient());

        // --- اعتراض عمليات التنزيل (PDF وغيرها) ---
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            handleDownload(url, mimetype);
        });

        webView.setBackgroundColor(Color.parseColor("#1A1A2E"));
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
    }

    // ====== WebViewClient: اعتراض PDF + الروابط الخارجية + الأخطاء ======
    private class ThaqafatnaWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            String lower = url.toLowerCase(Locale.ROOT);

            // 1) اعتراض ملفات PDF وفتحها بعارض خارجي
            if (lower.endsWith(".pdf") || lower.contains(".pdf?") || lower.contains(".pdf#")
                    || "application/pdf".equals(request.getUrl().getQueryParameter("type"))) {
                StageLogger.log(MainActivity.this, StageLogger.STAGE_PDF_INTERCEPTED, url);
                openPdfExternally(url);
                return true;
            }

            // 2) اعتراض الأنظمة الخارجية: البريد، الهاتف، واتساب، intent
            if (url.startsWith("mailto:") || url.startsWith("tel:")
                    || url.startsWith("whatsapp:") || url.startsWith("intent:")
                    || url.startsWith("sms:") || url.startsWith("geo:")
                    || url.startsWith("market:") || url.startsWith("viber:")) {
                StageLogger.log(MainActivity.this, StageLogger.STAGE_EXT_INTENT, url);
                try {
                    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(i);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "لا يوجد تطبيق لفتح هذا الرابط",
                            Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            // 3) الروابط الخارجية (خارج نطاق الموقع) — افتح في المتصفح
            if (!url.startsWith(HOME_URL) && !url.startsWith("https://thaqafatna-qr.vercel.app")) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(Intent.createChooser(i, "فتح الرابط في"));
                        return true;
                    } catch (Exception e) { /* اسمح لـ WebView بالمعالجة */ }
                }
            }

            // 4) الرابط الداخلي — اسمح لـ WebView بتحميله
            return false;
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            loadingBar.setVisibility(View.VISIBLE);
            loadingBar.setProgress(0);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            loadingBar.setVisibility(View.GONE);
            StageLogger.log(MainActivity.this, StageLogger.STAGE_PAGE_LOADED, url);
            // ضبط التخطيط بعد التحميل لضمان التجاوب
            view.requestLayout();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame()) {
                StageLogger.log(MainActivity.this, StageLogger.STAGE_ERROR,
                        String.valueOf(err.getErrorCode()));
                loadOfflinePage();
            }
        }
    }

    // ====== ChromeClient: شريط التقدّم + الـ fullscreen للفيديو ======
    private class ThaqafatnaChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            loadingBar.setProgress(newProgress);
            if (newProgress >= 100) {
                loadingBar.setVisibility(View.GONE);
            }
            if (newProgress % 25 == 0) {
                StageLogger.log(MainActivity.this, StageLogger.STAGE_PAGE_PROGRESS,
                        String.valueOf(newProgress));
            }
        }
    }

    // ====== فتح PDF عبر عارض خارجي ======
    private void openPdfExternally(String pdfUrl) {
        // المحاولة 1: افتح الرابط مباشرة بعارض PDF (المتصفح/التطبيقات)
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(pdfUrl), "application/pdf");
            intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(intent, "افتح ملف PDF بـ"));
            StageLogger.log(this, StageLogger.STAGE_PDF_OPENED_EXT, pdfUrl);
            return;
        } catch (Exception e) {
            StageLogger.log(this, StageLogger.STAGE_PDF_NO_VIEWER, pdfUrl);
        }
        // المحاولة 2: نزّل الملف ثم افتحه محلياً عبر FileProvider
        downloadAndOpenPdf(pdfUrl);
    }

    // تنزيل PDF ثم فتحه محلياً عبر FileProvider (للأجهزة بلا عارض مباشر)
    private void downloadAndOpenPdf(final String pdfUrl) {
        Toast.makeText(this, "جارٍ تنزيل ملف PDF…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                File dir = new File(getCacheDir(), PDF_DIR);
                if (!dir.exists()) dir.mkdirs();
                String fileName = "thaqafatna_" + System.currentTimeMillis() + ".pdf";
                File out = new File(dir, fileName);

                URL url = new URL(pdfUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.connect();

                InputStream is = conn.getInputStream();
                FileOutputStream fos = new FileOutputStream(out);
                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) != -1) fos.write(buf, 0, n);
                fos.close();
                is.close();

                // فتح الملف المحلي عبر FileProvider
                Uri uri = FileProvider.getUriForFile(this,
                        getPackageName() + ".fileprovider", out);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/pdf");
                intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY
                        | Intent.FLAG_GRANT_READ_URI_PERMISSION
                        | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(Intent.createChooser(intent, "افتح ملف PDF بـ"));
                StageLogger.log(this, StageLogger.STAGE_PDF_OPENED_EXT, "local:" + fileName);
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this,
                        "تعذّر فتح ملف PDF: " + e.getMessage(), Toast.LENGTH_LONG).show());
                StageLogger.log(this, StageLogger.STAGE_PDF_NO_VIEWER, pdfUrl);
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }

    // ====== معالجة التنزيلات العامة (غير PDF) ======
    private void handleDownload(String url, String mimetype) {
        StageLogger.log(this, StageLogger.STAGE_FILE_DOWNLOAD, url + " | " + mimetype);
        Toast.makeText(this, "جارٍ بدء التنزيل…", Toast.LENGTH_SHORT).show();
        // استخدام DownloadManager عبر Intent للمتصفح (أبسط وأكثر موثوقية)
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "تعذّر تنزيل الملف", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo net = cm.getActiveNetworkInfo();
        return net != null && net.isConnected();
    }

    // ====== شاشة احتياطية عربية متجاوبة عند فقدان الاتصال ======
    private void loadOfflinePage() {
        StageLogger.log(this, StageLogger.STAGE_OFFLINE_SHOWN);
        String html =
            "<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes\">"
            + "<meta name=\"theme-color\" content=\"#1A1A2E\">"
            + "<style>"
            + "  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}"
            + "  :root{--gold:#C9A961;--dark:#1A1A2E;--light:#F5F0E1;--muted:#B0B8C0;}"
            + "  body{background:var(--dark);color:var(--light);font-family:'Arial','Tahoma','Segoe UI',sans-serif;"
            + "       display:flex;flex-direction:column;align-items:center;justify-content:center;"
            + "       min-height:100vh;padding:32px 24px;text-align:center;"
            + "       /* تجاوب مع الشاشات الكبيرة عبر تحديد أقصى عرض */"
            + "       max-width:600px;margin:0 auto;}"
            + "  .icon{width:clamp(72px,18vw,110px);height:clamp(72px,18vw,110px);border-radius:24px;background:var(--gold);"
            + "        display:flex;align-items:center;justify-content:center;margin-bottom:28px;"
            + "        font-size:clamp(40px,10vw,60px);font-weight:bold;color:var(--dark);"
            + "        box-shadow:0 8px 24px rgba(201,169,97,0.3);}"
            + "  h1{font-size:clamp(20px,5vw,28px);font-weight:700;margin-bottom:14px;color:var(--gold);line-height:1.3;}"
            + "  p{font-size:clamp(14px,3.5vw,17px);line-height:1.7;color:var(--muted);"
            + "    margin-bottom:32px;max-width:380px;}"
            + "  .btn{background:var(--gold);color:var(--dark);border:none;padding:14px 40px;"
            + "       border-radius:32px;font-size:16px;font-weight:bold;cursor:pointer;"
            + "       box-shadow:0 4px 12px rgba(201,169,97,0.4);transition:transform .15s;}"
            + "  .btn:active{transform:scale(0.97);}"
            + "  .footer{position:absolute;bottom:max(24px,env(safe-area-inset-bottom));"
            + "          font-size:12px;color:#687078;}"
            + "  @media (min-width:600px){body{padding:48px;} .icon{margin-bottom:36px;}}"
            + "</style></head><body>"
            + "  <div class=\"icon\">ث</div>"
            + "  <h1>الخدمة غير متاحة حالياً</h1>"
            + "  <p>يبدو أنك غير متصل بالإنترنت. تطبيق ثقافتنا يحتاج إلى اتصال بالشبكة لعرض المحتوى الثقافي. يرجى التحقّق من اتصالك ثم الضغط على زر إعادة المحاولة.</p>"
            + "  <button class=\"btn\" onclick=\"location.reload()\">إعادة المحاولة</button>"
            + "  <div class=\"footer\">ثقافتنا — v2.0.3</div>"
            + "</body></html>";
        webView.loadDataWithBaseURL(HOME_URL, html, "text/html", "UTF-8", HOME_URL);
    }

    // ====== دورة الحياة + التسجيل ======
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        if (webView != null) webView.restoreState(savedInstanceState);
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        StageLogger.log(this, StageLogger.STAGE_CONFIG_CHANGE,
                newConfig.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
                        ? "landscape" : "portrait");
        // إعادة تطبيق insets بعد التغيير
        if (root != null) root.requestApplyInsets();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            StageLogger.log(this, StageLogger.STAGE_NAV_BACK);
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        StageLogger.log(this, StageLogger.STAGE_APP_PAUSE);
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        StageLogger.log(this, StageLogger.STAGE_APP_RESUME);
        if (webView != null) webView.onResume();
        // إعادة تحميل تلقائية عند عودة الاتصال إن كنا في الشاشة الاحتياطية
        if (webView != null && webView.getUrl() != null
                && webView.getUrl().startsWith("data:") && isOnline()) {
            webView.loadUrl(HOME_URL);
        }
    }

    @Override
    protected void onDestroy() {
        StageLogger.log(this, StageLogger.STAGE_APP_DESTROY);
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
