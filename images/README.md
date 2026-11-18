# Yahan apni images daalo 🎨

> ✅ **`logo.png` already lag chuka hai.** App ke saare icons (home screen, Play Store,
> browser tab) isi se bante hain. Logo badalna ho to isi file ko replace karo aur
> `npm run icons` chala do — baaki sab khud update ho jayega.

Figma AI (ya ChatGPT / Gemini / Canva) se images banao aur **isi folder me** niche diye
gaye **naam se** save kar do. Bata dena — main unhe app me laga dunga (sahi jagah, sahi size,
dark mode aur offline cache ke saath).

> **Format:** PNG, **transparent background** (bahut zaroori — warna har illustration ke
> peeche safed/kala box dikhega). Figma me export karte waqt background frame hata dena.

---

## Jo images chahiye

| File ka naam | Size | Kahan lagegi | Figma AI prompt (copy-paste) |
|---|---|---|---|
| `onboarding.png` | 1080 × 760 | App pehli baar khulne par, welcome screen me | *"Flat vector illustration, person checking expenses on a phone, coins and rising bar chart, blue #2a78d6 palette, white background removed, modern fintech style, no text"* |
| `empty-expenses.png` | 640 × 480 | Jab koi kharch add nahi kiya ho | *"Flat vector illustration of an empty receipt with a plus button, blue #2a78d6 palette, minimal, transparent background, no text"* |
| `empty-chart.png` | 640 × 480 | Jab category breakdown khali ho | *"Flat vector illustration of a simple bar chart with no data, blue #2a78d6 palette, minimal, transparent background, no text"* |
| `empty-month.png` | 640 × 480 | Jab kisi mahine ka koi kharch na ho | *"Flat vector illustration of a calendar page, blue #2a78d6 palette, minimal, transparent background, no text"* |
| `budget-target.png` | 640 × 480 | Jab budget set na ho | *"Flat vector illustration of a target with an arrow in the bullseye, blue #2a78d6 palette, minimal, transparent background, no text"* |

## Logo badalna ho to

| File ka naam | Size | Kya hoga |
|---|---|---|
| `logo.png` | 1024 × 1024 | Isse main **app ke saare icons** (192/512/maskable + Play Store icon) bana dunga |

Logo ka prompt: *"App icon for an expense tracker, letter A mark on a chart baseline, blue
gradient #3987e5 to #1c5cab, rounded square, flat minimal, no text, centered"*

---

## 3 cheezein dhyan rakhna

1. **Text mat daalwana** images me — app 2 bhasha (English + हिन्दी) me chalta hai, to picture
   me likha text galat lagega
2. **Blue rakhna** (#2a78d6 / #3987e5) taaki app ke baaki rang se match kare
3. **File size** 300 KB se kam rakhna har image — app offline chalta hai, bhaari images se
   pehli baar load slow hoga (Figma export me "Compress" / TinyPNG use kar sakte ho)

Ready ho jaye to bas bol dena — "images daal di hain" — main laga dunga. 👍
