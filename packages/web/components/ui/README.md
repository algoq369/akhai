# AkhAI UI Components

## Overview
This directory contains custom UI components for AkhAI, inspired by ReactBits design patterns and adapted to a **grey-only minimal design system**.

## ReactBits Registry
Components fetched from https://reactbits.dev

**Registry URL:** `https://reactbits.dev/r/{component-name}.json`

## Installed Components

### 1. MagicBento.tsx (247 lines)
Animated bento grid layout component with framer-motion.

**Features:**
- Grid layout with size variants (small, medium, large)
- Staggered fade-in animations
- Hover effects (scale 1.02, lift -4px)
- Gradient overlays
- Floating animations
- MethodologyAnimation subcomponent

**Usage:**
```tsx
import { MagicBento, BentoCard } from '@/components/ui/MagicBento';

const cards: BentoCard[] = [
  {
    id: 'card-1',
    title: 'Flash',
    description: 'Parallel Multi-AI Consensus',
    icon: '🧬',
    size: 'large',
    gradient: 'from-gray-800 via-gray-700 to-gray-600',
    onClick: () => router.push('/'),
  },
];

<MagicBento cards={cards} />
```

### 2. FlowingMenu.tsx (104 lines)
Animated navigation menu with flowing effects.

**Features:**
- Moving background pill on hover/active
- Flowing underline gradient
- Spring animations (stiffness: 500, damping: 30)
- Active state: white background, black text
- Hover state: grey-800 background

**Usage:**
```tsx
import { FlowingMenu } from '@/components/ui/FlowingMenu';

const menuItems = [
  { href: '/', label: 'Search', icon: '⚡' },
  { href: '/explore', label: 'Explore', icon: '✨' },
];

<FlowingMenu items={menuItems} />
```

### 3. GalaxyBackground.tsx (196 lines)
Canvas-based animated star field with parallax and mouse interaction.

**Features:**
- 200 animated twinkling stars (configurable)
- **GREYSCALE ONLY** - white to grey radial gradients
- Continuous star drift movement with wrap-around
- Parallax layers - closer stars move faster
- Mouse/pointer interaction - stars shift based on cursor position
- Touch support for mobile devices
- Sin wave animation for twinkle effect
- Black background (#000000)
- Responsive canvas sizing

**Props:**
- `starCount?: number` - Number of stars (default: 200)
- `interactive?: boolean` - Enable mouse/touch interaction (default: true)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { GalaxyBackground } from '@/components/ui/GalaxyBackground';

// Basic usage
<GalaxyBackground />

// With custom star count
<GalaxyBackground starCount={300} />

// Disable mouse interaction
<GalaxyBackground interactive={false} />
```

**Animation Details:**
- Stars continuously drift downward and to the right
- Different star layers create depth with parallax
- Mouse movement creates dynamic parallax shift (5% strength)
- Stars wrap around screen edges seamlessly
- 60fps animation with requestAnimationFrame

### 4. DecryptedText.tsx (88 lines)
Character-by-character decrypt animation.

**Features:**
- Random character cycling before reveal
- Configurable speed (default 50ms)
- DecryptedTitle wrapper component
- Grey text during decryption

**Usage:**
```tsx
import { DecryptedText, DecryptedTitle } from '@/components/ui/DecryptedText';

<DecryptedTitle
  text="AkhAI"
  className="text-4xl font-bold text-white"
  speed={30}
/>

<DecryptedText
  text="Custom text"
  speed={50}
  autoStart={true}
/>
```

## Design System (Grey-Only)

### Color Palette
```css
--color-bg-primary: #000000;      /* Black background */
--color-bg-secondary: #111111;    /* Dark surface */
--color-bg-tertiary: #1a1a1a;     /* Lighter surface */
--color-border: #222222;          /* Dark border */
--color-border-hover: #333333;    /* Hover border */
--color-text-primary: #ffffff;    /* White text */
--color-text-secondary: #a3a3a3;  /* Gray-400 */
--color-text-tertiary: #737373;   /* Gray-500 */
--color-text-muted: #525252;      /* Gray-600 */
```

### Design Patterns
- **Primary buttons:** white bg, black text (inverted)
- **Secondary buttons:** dark grey bg, light grey text
- **NO COLORS:** strictly monochrome (no blue, purple, cyan, green, red, yellow)
- **Glassmorphism:** backdrop-blur with transparency
- **Typography hierarchy:** size, weight, tracking variations

### Grey Gradients
```tsx
// Bento card gradients (example)
'from-gray-800 via-gray-700 to-gray-600'
'from-gray-900 via-gray-800 to-gray-700'
'from-gray-700 via-gray-600 to-gray-500'
```

## Fetching New Components

### Method 1: Using the Script
```bash
cd /Users/sheirraza/akhai/packages/web
./scripts/fetch-reactbits.sh
```

Fetch a specific component:
```bash
./scripts/fetch-reactbits.sh spotlight
```

### Method 2: Manual Fetch
```bash
curl https://reactbits.dev/r/magic-bento.json > /tmp/magic-bento.json
```

Then inspect the JSON and manually create the component.

### Available ReactBits Components
- `magic-bento` - Bento grid layout ✅ Installed
- `flowing-menu` - Animated navigation ✅ Installed
- `galaxy` - Galaxy background ✅ Installed
- `decrypted-text` - Text decrypt animation ✅ Installed
- `scramble-text` - Text scramble effect
- `blob-cursor` - Blob cursor effect
- `particles` - Particle background
- `spotlight` - Spotlight effect
- `aurora` - Aurora background
- `meteors` - Meteor animation
- `ripple` - Ripple effect
- `grid-pattern` - Grid background pattern

## Dependencies
All components require:
- `framer-motion` ^12.23.26
- React 18+
- Next.js 15+
- Tailwind CSS

## Notes
- These are **custom implementations** inspired by ReactBits
- ReactBits website doesn't provide direct source code download
- All components adapted to grey-only minimal design
- Components use framer-motion for smooth animations
- All styling uses Tailwind CSS utility classes

## Adding New Components
1. Fetch the component metadata from ReactBits
2. Create a new `.tsx` file in this directory
3. Implement the component with grey-only colors
4. Export from `index.ts` if needed
5. Update this README

## Configuration Files
- `components.json` - Registry configuration
- `.cursor/rules` - Cursor AI context about ReactBits
- `scripts/fetch-reactbits.sh` - Component fetcher script
