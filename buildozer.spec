[app]

# (string) Title of your application
title = نقاط البيع وإدارة المستودعات

# (string) Package name
package.name = smartpos

# (string) Package domain (needed for android packaging)
package.domain = org.smartpos

# (string) Source code directory
source.dir = .

# (list) Source files to include (let's include all web build assets in dist and python entrypoints)
source.include_exts = py,png,jpg,kv,html,js,css,json,ttf,woff,woff2,ico,svg,webmanifest

# (list) List of inclusions using pattern matching
source.include_patterns = dist/*, dist/**/*, assets/*

# (list) Source files to exclude
source.exclude_exts = spec,md,zip,tar.gz

# (list) List of directory to exclude
source.exclude_dirs = node_modules, src, .git, .github, public

# (string) Application versioning
version = 1.0.0

# (list) Application requirements (dependencies)
# We need python3, kivy, and pyjnius to interact with Android Java APIs (like webview and cameras)
requirements = python3, kivy, pyjnius, hostpython3

# (str) Supported orientations (landscape, portrait or all)
orientation = all

# -----------------------------------------------------------------------------
# Android specific configurations
# -----------------------------------------------------------------------------

# (list) Permissions required by the app
# Crucial for barcode scanning, saving backups, and importing files
android.permissions = CAMERA, WRITE_EXTERNAL_STORAGE, READ_EXTERNAL_STORAGE, INTERNET

# (int) Target Android API, should be as high as possible
android.api = 33

# (int) Minimum API your APK will support
android.minapi = 21

# (int) Android SDK version to use
android.sdk = 33

# (str) Android NDK version to use
android.ndk = 25b

# (bool) Use private storage for data
android.private_storage = True

# (list) Screen orientation
android.wakelock = True

# (list) Android entrypoint layout / theme settings
android.theme = @android:style/Theme.NoTitleBar.Fullscreen

# (str) Icon of the application
# android.icon.filename = %(source.dir)s/icon.png

# (list) List of Java .jar files to add to the libs directory
# android.add_jars = foo.jar

# (list) Java classes to keep
# android.keep_java_classes = org.kivy.android.PythonActivity

# (bool) If true, then skip intent-filters systematic addition
android.skip_intent_filters = False

# -----------------------------------------------------------------------------
# Buildozer settings
# -----------------------------------------------------------------------------

[buildozer]

# (int) Log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 2

# (int) Display warning if buildozer is run as root (0 = false, 1 = true)
warn_on_root = 1
