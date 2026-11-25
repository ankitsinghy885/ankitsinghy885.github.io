# Expense Tracker 📊

Mobile-first expense tracker app. Roz ka kharch add karo, app khud batayega **aaj kitna kharch kar sakte ho**, mahine ka total kitna hua, aur budget me kitna bacha hai.

- 🌍 **Saare countries** ki currency (₹, $, €, ¥, …) — app khud aapke **phone ke time zone se country pakad leta hai** (na GPS permission, na internet), aur header me hi ek tap se badal sakte ho
- 🗣️ **English + हिन्दी** — header ke `EN/हि` button se turant switch, mahine ke naam aur rakam bhi usi bhasha me
- 📴 **Offline chalta hai** — internet ki zaroorat nahi
- 🔒 **Data sirf aapke phone me** rehta hai, kahin upload nahi hota

---

## 📱 Phone me kaise chalayein

### Tarika 1 — Asli app jaisa (recommended)

App ko ek baar kisi free hosting pe daalna hoga, phir phone me "Add to Home screen" se icon ban jayega.

1. [app.netlify.com/drop](https://app.netlify.com/drop) kholo
2. Poora `Daily Expense Tracker` folder drag-drop kar do (login bhi nahi chahiye)
3. Jo URL mile use phone ke **Chrome** me kholo
4. Menu (⋮) → **"Add to Home screen"** / **"Install app"**

Ab home screen pe icon aa jayega, poori screen me khulega, offline chalega. (iPhone pe Safari → Share → "Add to Home Screen")

> GitHub Pages ya koi bhi static hosting bhi chalega — bas `https://` hona chahiye, tabhi install option aata hai.

### Tarika 2 — Sirf test karna hai (PC + phone same WiFi)

```bash
npm start
```

PC pe `http://localhost:5173` khulega. Phone me kholne ke liye:

```bash
ipconfig          # apna IPv4 address dekho, jaise 192.168.1.5
```

Phone browser me `http://192.168.1.5:5173` kholo (dono same WiFi pe hone chahiye).

### Tarika 3 — Bina internet, ek single file

```bash
npm run standalone
```

`standalone.html` banegi (~118 KB, sab kuch usi ek file me). Use phone me copy karke browser se kholo — chalega, par home-screen install aur offline cache sirf Tarika 1 me milta hai.

---

## ✨ Features

| Feature | Kya karta hai |
|---|---|
| **Daily expense** | Amount + category + note + date — 5 second me entry. Quick chips (+₹500, +₹1,000…) se aur fast |
| **Daily limit** | Budget aur bache hue dino se roz ka safe kharch nikalta hai |
| **Aaj ka total** | Hero number me aaj ka kharch + limit ka progress bar |
| **Mahine ka total** | Kitna kharch hua, kitna bacha, average per day, month-end ka projection |
| **Budget** | Monthly budget set karo, meter me % dikhega |
| **Alerts** | Daily limit cross hone pe, 80% budget pe, aur "is speed se budget cross ho jayega" warning |
| **History** | Date-wise grouped list, mahina badal kar dekho, search + category filter |
| **Charts** | 7/30 din ka daily spending chart (dashed line = aaj ki limit) + category-wise breakdown |
| **Country/currency** | Header me chip button → saare desh, search, ya "अपने आप पता लगाएँ" (time zone se) |
| **Bhasha** | English aur हिन्दी — header ke button se ya Settings → Language |
| **Backup** | JSON backup/restore aur CSV export |
| **Theme** | Light / Dark / phone ki setting ke hisaab se |

---

## 🧮 Daily limit kaise nikalti hai

**Adaptive (default, recommended)**

```
Aaj ki limit = (Monthly budget − aaj se pehle ka kharch) ÷ (aaj milakar bache hue din)
```

Example: ₹30,000 budget, 30 din ka mahina. 13 din me ₹13,000 kharch ho gaya.
Aaj ki limit = (30,000 − 13,000) ÷ 17 = **₹1,000**

Agar aaj ₹3,000 kharch kar diya, to kal ki limit khud ghat kar ₹875 ho jayegi. Kam kharch karoge to badh jayegi.

**Flat** — `budget ÷ mahine ke din`, roz same number. Settings me switch kar sakte ho.

**Salary cycle:** Settings → *"Budget month starts on day"* me apni salary date daal do (jaise 5), to mahina 5 tarikh se 4 tarikh tak gina jayega, 1–31 ke bajay.

---

## 💾 Data kahan jata hai

Sab kuch phone ke browser storage (localStorage) me — **koi server, koi account, koi internet nahi**.

Iska matlab: browser ka data clear karoge ya app uninstall karoge to expenses chale jayenge. Isliye kabhi-kabhi **Settings → Backup (JSON)** daba kar file save kar lena. Wahi file "Restore backup" se wapas aa jati hai (merge ya replace, dono option milte hain).

---

## 🛠 Commands

```bash
npm start          # local server (http://localhost:5173)
npm run deploy     # dist/ folder banao — yahi hosting pe upload karna hai
npm run check      # saari calculations ke tests (226 checks)
npm run check:ui   # asli browser mein currency aur backup flows (26 checks)
npm run icons      # app icons dobara banao
npm run standalone # single-file build
```

## 📁 Files

```
index.html              UI ka structure
css/styles.css          saari styling (light + dark theme)
js/currencies.js        ~200 countries → currency, formatting
js/store.js             data save/load, add/edit/delete
js/calc.js              budget cycle, daily limit, totals, summary
js/charts.js            daily chart + category bars
js/app.js               screens, forms, sheets
sw.js                   offline cache (service worker)
manifest.webmanifest    install/home-screen settings
tools/check.js          logic tests
tools/ui-check.js       browser tests (headless Chrome)
```

## 📦 Play Store pe launch karna hai?

Poori step-by-step guide: **[PLAYSTORE.md](PLAYSTORE.md)** — hosting, PWABuilder se `.aab`
banana, assetlinks, Play Console ke forms, testing rule, sab kuch.

Launch ke liye zaroori cheezein already repo me ready hain:

```
privacy.html                        privacy policy page (email/naam bharna hai)
.well-known/assetlinks.json         TWA verification ka template
store/play-icon-512.png             Play listing ka icon
store/feature-graphic-1024x500.png  listing ka banner
store/screenshots/                  7 phone screenshots (1080x1920)
store/feature-graphic.html          banner ka source (badal kar dobara render kar sakte ho)
```

---

MIT License · works offline · v1.0
