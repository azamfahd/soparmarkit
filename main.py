import os
import sys
import threading
import http.server
import socketserver
from kivy.app import App
from kivy.uix.floatlayout import FloatLayout
from kivy.clock import Clock
from kivy.utils import platform

# ----------------------------------------------------------------------
# 1. Native Android Permissions & WebView Camera Handler (Pyjnius)
# ----------------------------------------------------------------------
if platform == 'android':
    from android.permissions import request_permissions, Permission
    from jnius import autoclass, cast
    
    # Import necessary Native Android Java Classes
    PythonActivity = autoclass('org.kivy.android.PythonActivity')
    WebView = autoclass('android.webkit.WebView')
    WebViewClient = autoclass('android.webkit.WebViewClient')
    WebChromeClient = autoclass('android.webkit.WebChromeClient')
    WebSettings = autoclass('android.webkit.WebSettings')
    PermissionRequest = autoclass('android.webkit.PermissionRequest')

    class AndroidWebChromeClient(WebChromeClient):
        """
        Natively overrides Android's WebChromeClient inside Python to grant 
        the WebView direct permissions for camera and hardware resources.
        This fixes the "Camera initialization failure" in web applications on Android.
        """
        def onPermissionRequest(self, request):
            # Grant access to all requested permissions (like CAMERA)
            resources = request.getResources()
            request.grant(resources)

# ----------------------------------------------------------------------
# 2. Local HTTP Server to serve React built 'dist' folder locally on Android
# ----------------------------------------------------------------------
class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Clean path and search files inside dist
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

def start_local_server(port, directory):
    os.chdir(directory)
    handler = SPAHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    print(f"Android Local Server serving at port {port}")
    httpd.serve_forever()

# ----------------------------------------------------------------------
# 3. Kivy App Layout & Lifecycle
# ----------------------------------------------------------------------
class WebviewApp(App):
    def build(self):
        self.title = "نظام المبيعات والمستودعات الذكي"
        self.root_layout = FloatLayout()
        
        # 1. Define local assets directory
        # Inside the APK, assets are packaged inside 'app' root folder
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.dist_dir = os.path.join(base_dir, 'dist')
        
        # 2. Start the lightweight local server
        self.port = 8080
        server_thread = threading.Thread(target=start_local_server, args=(self.port, self.dist_dir))
        server_thread.daemon = True
        server_thread.start()

        # 3. Native WebView Setup
        if platform == 'android':
            # Request permissions natively on startup
            request_permissions([
                Permission.CAMERA,
                Permission.WRITE_EXTERNAL_STORAGE,
                Permission.READ_EXTERNAL_STORAGE
            ])
            
            # Initialize Android WebView natively using Android API via Pyjnius
            self.activity = PythonActivity.mActivity
            self.webview = WebView(self.activity)
            
            # Configure web view settings
            settings = self.webview.getSettings()
            settings.setJavaScriptEnabled(True)
            settings.setDomStorageEnabled(True)
            settings.setDatabaseEnabled(True)
            settings.setAllowFileAccess(True)
            settings.setAllowContentAccess(True)
            settings.setMediaPlaybackRequiresUserGesture(False)
            
            # Bind the custom WebChromeClient that automatically grants camera permissions
            self.chrome_client = AndroidWebChromeClient()
            self.webview.setWebChromeClient(self.chrome_client)
            self.webview.setWebViewClient(WebViewClient())
            
            # Load our local served React app URL
            self.webview.loadUrl(f"http://127.0.0.1:{self.port}")
            
            # Set WebView as the content view of Kivy's activity
            self.activity.setContentView(self.webview)
        else:
            # Fallback label for non-Android environments during testing
            from kivy.uix.label import Label
            fallback_label = Label(
                text="يرجى تشغيل التطبيق على نظام أندرويد لفتح واجهة WebView.\nأو تشغيل 'python app.py' لتشغيل واجهة سطح المكتب الاحترافية.",
                halign="center",
                font_name="Arial" if platform == 'win' else None
            )
            self.root_layout.add_widget(fallback_label)
            
        return self.root_layout

    def on_pause(self):
        # Keep application running in background without stopping server
        return True

    def on_resume(self):
        pass

if __name__ == '__main__':
    WebviewApp().run()
