# 🌍 LANGUAGE & HEBREW TERMS - SIMPLE IMPLEMENTATION

## Date: December 31, 2025

---

## ✅ TWO SIMPLE REQUIREMENTS

1. **Language Selector** - Dropdown to switch website language
2. **Hebrew Terms** - All Hebrew words show English translation

---

## 📁 FILES CREATED

| File | Lines | Purpose |
|------|-------|---------|
| `components/HebrewTerm.tsx` | 199 | Hebrew term component |
| `components/LanguageSelector.tsx` | 307 | Language switcher |

---

## 🌐 LANGUAGE SELECTOR

### Supported Languages

| Flag | Language | Native | RTL |
|------|----------|--------|-----|
| 🇺🇸 | English | English | No |
| 🇫🇷 | French | Français | No |
| 🇪🇸 | Spanish | Español | No |
| 🇸🇦 | Arabic | العربية | Yes |
| 🇮🇱 | Hebrew | עברית | Yes |
| 🇩🇪 | German | Deutsch | No |
| 🇧🇷 | Portuguese | Português | No |
| 🇨🇳 | Chinese | 中文 | No |
| 🇯🇵 | Japanese | 日本語 | No |

### Usage

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';

// In header:
<LanguageSelector />

// Compact (icon only):
<LanguageSelectorCompact />

// Flag row:
<LanguageSelectorFlags />

// Hook:
const { language, isRTL, setLanguage } = useLanguage();
```

---

## 📜 HEBREW TERMS WITH ENGLISH

### Rule

**EVERY Hebrew term MUST show English translation.**

```
❌ WRONG: "Kether"
✅ RIGHT: "Kether (כֶּתֶר) - Crown"
```

### Usage

```tsx
import { HebrewTerm, HT } from '@/components/HebrewTerm';

<HebrewTerm term="kether" />
// → "Kether (כֶּתֶר) - Crown"

<HT t="binah" />
// → "Binah (בִּינָה) - Understanding"

// String version:
formatHebrewTerm('chesed')
// → "Chesed (חֶסֶד) - Mercy"
```

### All Terms Available

**Sefirot (11):**
| Key | Hebrew | English |
|-----|--------|---------|
| kether | כֶּתֶר | Crown |
| chokmah | חָכְמָה | Wisdom |
| binah | בִּינָה | Understanding |
| chesed | חֶסֶד | Mercy |
| gevurah | גְּבוּרָה | Severity |
| tiferet | תִּפְאֶרֶת | Beauty |
| netzach | נֶצַח | Victory |
| hod | הוֹד | Glory |
| yesod | יְסוֹד | Foundation |
| malkuth | מַלְכוּת | Kingdom |
| daat | דַּעַת | Knowledge |

**Concepts:**
| Key | Hebrew | English |
|-----|--------|---------|
| sefirot | סְפִירוֹת | Emanations |
| etzChayim | עֵץ חַיִּים | Tree of Life |
| qliphoth | קְלִיפּוֹת | Shells (Shadows) |
| tikkunOlam | תִּקּוּן עוֹלָם | World Repair |
| yechidah | יְחִידָה | Unity |

**Five Worlds:**
| Key | Hebrew | English |
|-----|--------|---------|
| adamKadmon | אָדָם קַדְמוֹן | Primordial Man |
| atziluth | אֲצִילוּת | Emanation |
| beriah | בְּרִיאָה | Creation |
| yetzirah | יְצִירָה | Formation |
| assiah | עֲשִׂיָּה | Action |

**Protocols:**
| Key | Hebrew | English |
|-----|--------|---------|
| emet | אֱמֶת | Truth (Life) |
| met | מֵת | Death |
| golem | גּוֹלֶם | Animated Being |

---

## 🚀 HOW TO USE

### Add Language Selector to Header

```tsx
// In your layout.tsx or Header component:

import { LanguageSelector } from '@/components/LanguageSelector';

export function Header() {
  return (
    <header>
      {/* ... other header content ... */}
      <LanguageSelector />
    </header>
  );
}
```

### Replace Hebrew Text with Component

**Before:**
```tsx
<h2>Kether</h2>
<p>The crown sefirah represents...</p>
```

**After:**
```tsx
import { HebrewTerm } from '@/components/HebrewTerm';

<h2><HebrewTerm term="kether" /></h2>
<p>The <HebrewTerm term="kether" format="english-only" /> sefirah represents...</p>
```

### Adding New Terms

If a Hebrew term is missing, add it to `components/HebrewTerm.tsx`:

```tsx
export const HEBREW_TERMS = {
  // ... existing terms ...
  
  // Add new term:
  newTerm: { 
    hebrew: 'עברית', 
    english: 'English Translation',
    pronunciation: 'pronunciation'  // optional
  },
};
```

---

## ✅ CHECKLIST

When building pages:

- [ ] Language selector in header ✓
- [ ] All Hebrew terms use `<HebrewTerm>` component
- [ ] Test RTL with Arabic/Hebrew
- [ ] Check all pronunciations show on hover

---

*Simple Language & Hebrew Terms Implementation Complete*
