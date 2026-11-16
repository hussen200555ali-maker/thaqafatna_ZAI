package com.thaqafatna.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String HOME_URL = "https://thaqafatna-qr.vercel.app/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#1A1A2E"));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#1A1A2E"));

        webView = new WebView(this);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        webView.setLayoutParams(params);

        configureWebView();
        root.addView(webView);
        setContentView(root);

        if (savedInstanceState == null) {
            if (isOnline()) {
                webView.loadUrl(HOME_URL);
            } else {
                loadOfflinePage();
            }
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // استخدم المحتوى المخزَّن مؤقتاً عند انقطاع الشبكة
        settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setDefaultTextEncodingName("UTF-8");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                // عرض شاشة عربية احتياطية عند فشل تحميل المورد الأساسي
                if (req.isForMainFrame()) {
                    loadOfflinePage();
                }
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.setBackgroundColor(Color.parseColor("#1A1A2E"));
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo net = cm.getActiveNetworkInfo();
        return net != null && net.isConnected();
    }

    private void loadOfflinePage() {
        // شاشة احتياطية عربية عند فقدان الاتصال
        String html =
            "<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">"
            + "<style>"
            + "  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }"
            + "  body { background:#1A1A2E; color:#F5F0E1; font-family:'Arial','Tahoma',sans-serif;"
            + "         display:flex; flex-direction:column; align-items:center; justify-content:center;"
            + "         min-height:100vh; padding:32px; text-align:center; }"
            + "  .icon { width:96px; height:96px; border-radius:24px; background:#C9A961;"
            + "          display:flex; align-items:center; justify-content:center; margin-bottom:28px;"
            + "          font-size:54px; font-weight:bold; color:#1A1A2E; box-shadow:0 8px 24px rgba(201,169,97,0.3); }"
            + "  h1 { font-size:24px; font-weight:700; margin-bottom:14px; color:#C9A961; }"
            + "  p { font-size:16px; line-height:1.6; color:#B0B8C0; margin-bottom:28px; max-width:340px; }"
            + "  .btn { background:#C9A961; color:#1A1A2E; border:none; padding:14px 36px;"
            + "         border-radius:32px; font-size:16px; font-weight:bold; cursor:pointer;"
            + "         box-shadow:0 4px 12px rgba(201,169,97,0.4); }"
            + "  .footer { position:absolute; bottom:24px; font-size:12px; color:#687078; }"
            + "</style></head><body>"
            + "  <div class=\"icon\">ث</div>"
            + "  <h1>الخدمة غير متاحة حالياً</h1>"
            + "  <p>يبدو أنك غير متصل بالإنترنت. تطبيق ثقافتنا يحتاج إلى اتصال بالشبكة لعرض المحتوى الثقافي. يرجى التحقّق من اتصالك وإعادة المحاولة.</p>"
            + "  <button class=\"btn\" onclick=\"location.reload()\">إعادة المحاولة</button>"
            + "  <div class=\"footer\">ثقافتنا — v2.0.2</div>"
            + "</body></html>";
        webView.loadDataWithBaseURL(HOME_URL, html, "text/html", "UTF-8", HOME_URL);
    }

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
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        // إعادة التحميل تلقائياً عند عودة الاتصال
        if (webView != null && webView.getUrl() != null
                && webView.getUrl().startsWith("data:") && isOnline()) {
            webView.loadUrl(HOME_URL);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
