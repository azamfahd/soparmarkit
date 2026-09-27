# ==============================================================================
# ProGuard Rules for Smart Accounting App (Android / Capacitor / Firebase)
# ==============================================================================

# Preserve annotations and line numbers for stack traces
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Preserve JavaScript Interface methods for WebView communication
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class app.azamfahd.account20.twa.MainActivity$* {
    public *;
}

# ==============================================================================
# Capacitor & Bridge
# ==============================================================================
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.BridgeActivity
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <methods>;
}
-keepclassmembers enum com.getcapacitor.** { *; }

# ==============================================================================
# Google Play Services & Google Sign-In
# ==============================================================================
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.auth.api.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-dontwarn com.google.android.gms.**

# ==============================================================================
# Firebase Services (Auth, Firestore, Analytics, Core)
# ==============================================================================
-keep class com.google.firebase.** { *; }
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.firebase.firestore.** { *; }
-keep class com.google.firebase.analytics.** { *; }
-dontwarn com.google.firebase.**

# ==============================================================================
# Capacitor SQLite & Native Plugins
# ==============================================================================
-keep class com.getcapacitor.community.database.sqlite.** { *; }
-dontwarn com.getcapacitor.community.database.sqlite.**

# Generic JSON & Serialization safety
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
