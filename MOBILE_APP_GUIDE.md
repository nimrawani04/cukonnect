# 📱 CuKashmir Mobile App — How It Works

This project runs as **both a website and a native Android/iOS app** using Capacitor.
You can build the app in **two modes**:

| Mode | What it does | When to use |
|------|--------------|-------------|
| 🔄 **Development (hot-reload)** | APK loads the live Lovable preview URL over the internet. Any change in Lovable is reflected instantly inside the app. | While you're still building / testing features. |
| 📦 **Production (bundled)** | The UI is built locally and packaged **inside** the APK. No Lovable URL is loaded — the app works fully standalone. | When you're ready to share/distribute the APK to real users. |

---

## 🚀 First-time setup (do this once)

1. **Export to GitHub** — top-right of Lovable → *GitHub → Connect to GitHub* → Create repository.
2. **Clone your repo locally:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo>
   npm install
   ```
3. **Add the Android platform:**
   ```bash
   npx cap add android
   ```
4. Make sure you have **[Android Studio](https://developer.android.com/studio)** installed.

---

## 🔄 Mode 1 — Development APK (hot-reload)

Use this while you're still iterating in Lovable.

```bash
npm run build
npx cap sync android
npx cap run android
```

✅ The APK will load the live Lovable preview, so any change you make in Lovable shows up the next time you reopen the app (no rebuild needed).
⚠️ Requires internet to display the UI.

---

## 📦 Mode 2 — Production APK (bundled, standalone)

Use this when you want to share the app with real users.

### macOS / Linux
```bash
npm run build
CAP_ENV=production npx cap sync android
```

### Windows (PowerShell)
```powershell
npm run build
$env:CAP_ENV="production"; npx cap sync android
```

### Windows (CMD)
```cmd
npm run build
set CAP_ENV=production && npx cap sync android
```

Then open the project in Android Studio:
```bash
npx cap open android
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK…**
2. Choose **APK** → *Next*
3. Create or select a **keystore** (you'll need this for every future release — keep it safe!)
4. Select **release** build variant → *Finish*
5. Your `.apk` file will appear in `android/app/release/app-release.apk`

✅ This APK works offline (for the cached UI) and does **not** depend on the Lovable preview URL.
✅ Share the `.apk` file directly, or upload the `.aab` to the Google Play Store.

---

## 🔁 Switching between modes

Just re-run the sync command with or without `CAP_ENV=production`:

```bash
# Switch back to hot-reload dev mode
npm run build && npx cap sync android

# Switch to production bundled mode
npm run build && CAP_ENV=production npx cap sync android
```

The `capacitor.config.ts` automatically includes/excludes the hot-reload server URL based on the env variable.

---

## 🔄 Updating the app after Lovable changes

Whenever you make changes in Lovable:

```bash
git pull
npm install        # only if dependencies changed
npm run build
npx cap sync android         # dev mode
# OR
CAP_ENV=production npx cap sync android   # production mode
```

Then re-run / re-build the APK in Android Studio.

---

## 🍏 iOS (optional, requires Mac + Xcode)

Same flow — replace `android` with `ios`:
```bash
npx cap add ios
npm run build
npx cap sync ios       # or: CAP_ENV=production npx cap sync ios
npx cap open ios
```

---

## 🔔 Push notifications

Native push notifications for ride chats are already wired up. The first time you open the APK, Android will ask for notification permission — tap **Allow**. You'll get notifications for new ride messages even when the app is in the background.

---

## ❓ Troubleshooting

- **App shows blank screen in production mode** → make sure you ran `npm run build` *before* `npx cap sync`.
- **Changes from Lovable not appearing** → in production mode you must rebuild the APK. In dev mode just reopen the app.
- **Permission denied for notifications** → Android Settings → Apps → CuKashmir → Notifications → Enable.
