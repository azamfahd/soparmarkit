import os
import sys
import json
import threading
import socket
import http.server
import socketserver
import webview
import tkinter as tk
from tkinter import filedialog

# ----------------------------------------------------------------------
# 1. API Bridge Class (Exposed to JavaScript inside the WebView)
# ----------------------------------------------------------------------
class PythonAPI:
    def __init__(self):
        self.window = None

    def select_file(self):
        """
        Opens a native file selection dialog to select a JSON backup file.
        Returns the content of the file as a string.
        """
        try:
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            file_path = filedialog.askopenfilename(
                title="اختر ملف النسخة الاحتياطية الاستيراد",
                filetypes=[("JSON files", "*.json")]
            )
            root.destroy()
            if not file_path:
                return None
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                return content
        except Exception as e:
            print(f"Error reading file: {e}")
            return json.dumps({"error": str(e)})

    def save_file(self, filename, content):
        """
        Opens a native save file dialog to save content directly to the user's PC.
        Returns True if successful, False otherwise.
        """
        try:
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            file_path = filedialog.asksaveasfilename(
                title="حفظ النسخة الاحتياطية",
                initialfile=filename,
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            root.destroy()
            if not file_path:
                return False
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error saving file: {e}")
            return False

# ----------------------------------------------------------------------
# 2. Local HTTP Server to serve Vite's 'dist' build folder offline
# ----------------------------------------------------------------------
def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom handler to redirect missing routes back to index.html
    enabling standard Client-Side SPA Routing (React Router).
    """
    def do_GET(self):
        # Clean path and search files inside dist
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

def start_server(port, directory):
    os.chdir(directory)
    handler = SPAHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    print(f"Serving local files at http://127.0.0.1:{port}")
    httpd.serve_forever()

# ----------------------------------------------------------------------
# 3. Main Desktop Launcher
# ----------------------------------------------------------------------
def main():
    # Detect dist folder path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, 'dist')
    
    # Check if user compiled the web application
    if not os.path.exists(dist_dir) or not os.listdir(dist_dir):
        # Check parent folder as fallback
        dist_dir = os.path.join(os.path.dirname(base_dir), 'dist')
        if not os.path.exists(dist_dir) or not os.listdir(dist_dir):
            print("\n[!] خطا: لم يتم العثور على مجلد 'dist'.")
            print("الرجاء تشغيل 'npm run build' أولاً لبناء واجهات التطبيق، ثم تشغيل هذا الملف.\n")
            # Show standard TK error dialog
            root = tk.Tk()
            root.withdraw()
            tk.messagebox.showerror(
                "خطأ في التشغيل", 
                "لم يتم العثور على مجلد 'dist'.\nالرجاء تشغيل 'npm run build' أولاً لبناء واجهات التطبيق ثم إعادة المحاولة."
            )
            root.destroy()
            sys.exit(1)

    port = find_free_port()
    
    # Run the HTTP server in a separate thread
    server_thread = threading.Thread(target=start_server, args=(port, dist_dir))
    server_thread.daemon = True
    server_thread.start()

    # Create the Python API Bridge object
    api = PythonAPI()

    # Launch PyWebView with professional hardware-accelerated viewport
    # and connect JavaScript window to the Python class methods
    window = webview.create_window(
        title="نظام نقاط البيع وإدارة المستودعات الذكي",
        url=f"http://127.0.0.1:{port}",
        js_api=api,
        width=1280,
        height=800,
        min_size=(1024, 768),
        background_color='#0f172a' # Smooth slate background matches theme loader
    )
    
    api.window = window
    webview.start(debug=False)

if __name__ == '__main__':
    main()
