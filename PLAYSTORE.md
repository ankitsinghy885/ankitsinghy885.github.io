# Play Store pe launch karne ki poori guide 🚀

Ye app ek **PWA** hai. Isse Play Store pe daalne ke liye ise **TWA** (Trusted Web Activity)
me wrap karte hain — matlab Android app ke andar wahi website chalti hai, bina browser ka
address bar dikhe. Google khud ye tarika support karta hai, aur iska ek bada fayda hai:

> **App update karne ke liye naya APK/AAB nahi chahiye.** Website update karo, app apne aap
> update ho jata hai. Naya bundle sirf tab chahiye jab app ka naam/icon/package badle.

Code ki taraf se sab taiyar hai — niche sirf steps follow karne hain.

---

## ✅ Pehle ye chahiye

| Cheez | Detail |
|---|---|
| Google Play Console account | **$25** (~₹2,100) ek baar ka fee, [play.google.com/console](https://play.google.com/console) |
| HTTPS website | App yahin se chalega (Netlify / GitHub Pages / apna domain) |
| Privacy policy URL | Repo me `privacy.html` ready hai — bas email/naam bharna hai |
| 12 testers, 14 din | Naye **personal** accounts ke liye Google ka rule (company account pe nahi) |
| Store assets | `store/` folder me already bana diye hain ✅ |

---

## Step 1 — App ko HTTPS pe host karo (Netlify Drop, free)

### 1.1 — Upload folder banao

```bash
npm run deploy
```

`dist/` folder ban jayega — isme sirf wo files hain jo live site ko chahiye (tools, README,
PLAYSTORE.md, standalone.html isme nahi jate). **Yahi folder upload karna hai.**

> Jab bhi app ka code badlo, `npm run deploy` dobara chala kar `dist/` ko phir se upload karna.

### 1.2 — Netlify Drop pe daalo

1. [app.netlify.com/drop](https://app.netlify.com/drop) kholo — **account ki zaroorat nahi**
2. Windows Explorer me `D:\Daily Expense Tracker\dist` kholo
3. `dist` folder ko uthakar page pe drop kar do (folder hi drop karna, andar ki files nahi)
4. 10–20 second me URL mil jayega, jaise `https://fluffy-pie-a1b2c3.netlify.app`

> Drop ke baad Netlify ek **"Claim this site"** link dikhata hai. Us par click karke free
> account bana lo — warna site kuch samay baad delete ho sakti hai aur aap uska naam/domain
> change nahi kar paoge. Claim karne ke baad **Site settings → Change site name** se naam
> `expense-tracker-ankit` jaisa kuch rakh sakte ho.

### 1.3 — Check karo (ye 4 URL khulne chahiye)

| URL | Kya dikhna chahiye |
|---|---|
| `https://<url>/` | App |
| `https://<url>/privacy.html` | Privacy policy page |
| `https://<url>/manifest.webmanifest` | JSON text |
| `https://<url>/.well-known/assetlinks.json` | JSON (abhi placeholder, Step 3 me bharenge) |

Phone pe URL kholo → Chrome menu (⋮) → **Install app** aana chahiye. Aa gaya matlab PWA sahi
hai aur PWABuilder bhi khush rahega.

> Agar `/.well-known/assetlinks.json` par 404 aaye (kuch browsers folder drag me dot-folders
> chhod dete hain), to Netlify site → **Deploys** → wahan file manually add kar do, ya
> `dist` ko ZIP banakar drop kar do.

---

## Step 2 — PWABuilder se Android package banao

1. [pwabuilder.com](https://www.pwabuilder.com) kholo
2. Apna URL daalo → **Start** → report card dikhega (manifest/SW/security sab green hona chahiye)
3. **Package for stores** → **Android** → *Google Play* option chuno
4. Ye details bharo:

   | Field | Kya daalein |
   |---|---|
   | Package ID | `com.yourname.expensetracker` (ek baar fix ho gaya to **kabhi badal nahi sakte**) |
   | App name | `Expense Tracker` |
   | Short name | `Expenses` |
   | Signing key | **Create new** (PWABuilder khud bana dega) |

5. **Download** dabao → ek ZIP milegi jisme:
   - `app-release-bundle.aab` ← ye Play Console pe upload hoga
   - `signing.keystore` + `signing-key-info.txt` ← **inka backup rakho!**
   - `assetlinks.json` ← agla step

> ⚠️ **Keystore kho gaya to app kabhi update nahi kar paoge.** Usse Google Drive / pendrive
> dono jagah save kar lo. Password bhi.

---

## Step 3 — assetlinks.json website pe daalo

Ye file Google ko batati hai ki "ye app aur ye website ek hi banda chalata hai". Isske bina
app me browser ka address bar dikhta rahega.

1. PWABuilder ki ZIP me se `assetlinks.json` lo
2. Use website pe is exact path pe daalo:
   ```
   https://<aapka-url>/.well-known/assetlinks.json
   ```
   (Repo me `.well-known/assetlinks.json` ka template already hai — uske andar PWABuilder wali
   file ka content paste kar do, phir dobara host kar do.)
3. Browser me kholkar check karo ki JSON dikh raha hai

> **Important:** Play Console pe **Play App Signing** on hoti hai (default). Uska SHA-256
> fingerprint alag hota hai. App upload karne ke baad **Play Console → Test and release →
> Setup → App signing** me jo SHA-256 dikhe, wahi fingerprint `assetlinks.json` me honi chahiye.
> Ek baar app upload karne ke baad ye step dobara verify kar lena.

---

## Step 4 — Play Console pe app banao

**Create app** → App name: `Expense Tracker`, language: English, type: **App**, **Free**.

### Store listing (ready-to-paste text)

**App name (30 chars max)**
```
Expense Tracker: Daily Budget
```

**Short description (80 chars max)**
```
Track daily spending, set a monthly budget, know what you can spend today.
```
*(Hindi listing bhi add kar sakte ho: Play Console → Store listing → Manage translations)*

**Full description**
```
Expense Tracker makes one question easy to answer: how much can I spend today?

Set your monthly budget once. Every time you add an expense, the app recalculates your safe
daily spending limit from what is left and how many days remain in the month. Spend more
today and tomorrow's limit adjusts down. Spend less and it goes up.

WHAT YOU GET

• Daily spending limit — a real number for today, not a vague guess
• Today at a glance — total spent today with a live progress bar against your limit
• Monthly summary — spent, remaining, average per day and a projected month-end total
• Spending alerts — when you cross today's limit, reach 80% of the budget, or are on pace
  to overshoot it
• History by date — every expense grouped by day, with search and category filters
• Charts — 7 and 30 day spending columns plus a category-wise breakdown
• Categories — food, transport, bills, rent, shopping and more, or add your own
• Salary cycle support — set your budget month to start on payday instead of the 1st
• Backup and export — JSON backup you can restore, and CSV for spreadsheets

WORKS IN EVERY COUNTRY, IN YOUR LANGUAGE

Pick from every country's currency — rupees, dollars, euros, yen, pesos and more. The app
works out your country from your device's time zone on first run, with no location
permission and no internet, and formats every amount the way your country writes it,
including Indian lakh grouping. Change the country any time from the button in the top bar.

Available in English and Hindi, switchable with one tap.

PRIVATE BY DESIGN

No account. No sign-up. No ads. No tracking. Your expenses are stored only on your own
device and are never uploaded anywhere. The app works fully offline.

FAST TO USE

Adding an expense takes about five seconds: amount, category, done. Quick-amount chips make
common amounts a single tap.
```

**Category:** Finance · **Tags:** budget, expenses, personal finance
**Contact email:** apni email
**Privacy policy:** `https://<aapka-url>/privacy.html`

### Graphics (sab `store/` folder me ready hain)

| Jagah | File |
|---|---|
| App icon (512×512) | `store/play-icon-512.png` |
| Feature graphic (1024×500) | `store/feature-graphic-1024x500.png` |
| Phone screenshots (1080×1920) | `store/screenshots/01…07` — kam se kam 2, zyada se zyada 8 |
| Logo (1024×1024, transparent) | `store/logo-1024.png` — social/website ke liye, Play ke liye zaroori nahi |

---

## Step 5 — Policy wale forms

| Form | Jawab |
|---|---|
| **Data safety** | "Does your app collect or share any user data?" → **No**. Data encrypted in transit → N/A. Deletion request → N/A. (App kuch collect hi nahi karta) |
| **Ads** | No ads |
| **Content rating** | Questionnaire bharo — sab "No" → rating **Everyone / 3+** |
| **Target audience** | 18+ ya 13+ chuno (children ke liye design nahi hai) |
| **Government app** | No |
| **Financial features** | "Does your app have financial features?" → **No** (ye sirf personal expense tracking hai, koi lending/payment/trading nahi) |
| **News app** | No |

> Data safety form sach-sach bharna — ye app genuinely kuch collect nahi karta, isliye "No"
> bilkul sahi jawab hai.

---

## Step 6 — Testing (naye personal accounts ke liye zaroori)

Agar aapka Play Console account **personal** hai aur naya hai, to Google maangta hai:

1. **Closed testing** track banao
2. **12 testers** add karo (unki Gmail IDs) — ghar/dost/family chalega
3. Un 12 logo ko **lagatar 14 din** tak app opt-in rakhna hai
4. Uske baad **"Apply for production"** ka button aa jata hai

Isliye: pehle din hi closed testing shuru kar do, taki 14 din ka counter chalu ho jaye.

> Google ke rules time ke saath badalte hain — Console me jo likha ho, wahi final mano.

---

## Step 7 — Release

1. **Test and release → Production → Create new release**
2. `app-release-bundle.aab` upload karo
3. Release notes likho (pehli baar: `First release`)
4. **Send for review**

Review me aam taur pe kuch din lagte hain. Approve hone ke baad app Play Store pe live. 🎉

---

## Launch ke baad

- **App update karna ho?** Bas website update karke dobara host kar do — app apne aap nayi
  version dikhayega. Naya `.aab` sirf tab chahiye jab app ka naam, icon ya package badlo.
- **Rating/reviews** Play Console me dikhte hain.
- **Crash reports** Android vitals me.

## Ek nazar me checklist

- [ ] `privacy.html` me email + naam bhar diya
- [ ] App HTTPS pe host ho gaya, `/privacy.html` khul raha hai
- [ ] PWABuilder se `.aab` bana, keystore ka backup le liya
- [ ] `/.well-known/assetlinks.json` live hai aur Play App Signing wali SHA-256 usme hai
- [ ] Store listing text + `store/` ke saare graphics upload ho gaye
- [ ] Data safety / content rating / target audience forms bhar diye
- [ ] 12 testers × 14 din wala closed testing chalu hai
- [ ] Production release bhej diya
