# ReactBits Component Registry Setup

## ✅ Setup Complete

This document describes the ReactBits component registry integration for AkhAI.

## 📁 Configuration Files Created

### 1. `/packages/web/components.json`
Registry configuration for component management.

**Purpose:** Defines component registry sources, path aliases, and Tailwind config.

**Key Settings:**
- Registry: `@react-bits` → `https://reactbits.dev/r/{name}.json`
- Component path: `@/components/ui`
- Framework: Next.js with TypeScript

### 2. `/.cursor/rules`
Cursor AI context about ReactBits components.

**Purpose:** Provides AI assistants with information about:
- Currently installed components (MagicBento, FlowingMenu, GalaxyBackground, DecryptedText)
- Available components to fetch
- Grey-only design system rules
- Installation paths and procedures

### 3. `/.cursor/mcp-config.md`
Model Context Protocol configuration guide.

**Purpose:** Documents how to configure MCP for ReactBits integration.
**Note:** This is a guide, not an active config. User should manually add to `~/.cursor/mcp.json` if needed.

### 4. `/packages/web/scripts/fetch-reactbits.sh`
Executable script to fetch ReactBits components.

**Usage:**
```bash
cd /Users/sheirraza/akhai/packages/web
./scripts/fetch-reactbits.sh              # Fetch all default components
./scripts/fetch-reactbits.sh spotlight    # Fetch specific component
```

**Features:**
- Colored terminal output
- JSON inspection support
- jq integration for parsing
- Error handling

### 5. `/packages/web/components/ui/README.md`
Comprehensive documentation of all UI components.

**Contents:**
- Component descriptions and features
- Usage examples
- Design system specifications
- Grey-only color palette
- Installation instructions

## 🎨 Installed Components (Custom Implementations)

All components are **custom implementations** inspired by ReactBits, adapted to AkhAI's grey-only minimal design system.

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| MagicBento | `MagicBento.tsx` | 247 | Animated bento grid layout |
| FlowingMenu | `FlowingMenu.tsx` | 104 | Animated navigation menu |
| GalaxyBackground | `GalaxyBackground.tsx` | 96 | Canvas star field animation |
| DecryptedText | `DecryptedText.tsx` | 88 | Text decrypt animation |

**Why Custom Implementations?**
- ReactBits website doesn't provide direct source code downloads
- Needed grey-only color adaptation
- Required integration with Next.js App Router
- Customized for AkhAI's specific needs

## 🎯 Design System

### Strictly Monochrome
**NO COLORS** - Only black, white, and grey shades allowed.

### Color Palette
```css
--color-bg-primary: #000000;      /* Black */
--color-bg-secondary: #111111;    /* Dark grey */
--color-text-primary: #ffffff;    /* White */
--color-text-secondary: #a3a3a3;  /* Grey-400 */
```

### Design Patterns
- **Primary buttons:** White background, black text (inverted)
- **Secondary buttons:** Dark grey background, light grey text
- **Glassmorphism:** `backdrop-blur-sm` with transparency
- **Typography:** Size/weight/tracking hierarchy (no color)

## 📦 Dependencies

### Required
```json
{
  "framer-motion": "^12.23.26"
}
```

Already installed in AkhAI project.

## 🚀 How to Use

### Fetch New ReactBits Components
```bash
# Method 1: Using the script
cd packages/web
./scripts/fetch-reactbits.sh component-name

# Method 2: Manual curl
curl https://reactbits.dev/r/component-name.json > /tmp/component.json
```

### Import and Use
```tsx
import { GalaxyBackground } from '@/components/ui/GalaxyBackground';
import { DecryptedTitle } from '@/components/ui/DecryptedText';
import { FlowingMenu } from '@/components/ui/FlowingMenu';

export default function Page() {
  return (
    <>
      <GalaxyBackground />
      <DecryptedTitle text="AkhAI" />
    </>
  );
}
```

## 🔗 Available ReactBits Components

### ✅ Installed (Custom)
- `magic-bento` - Bento grid layout
- `flowing-menu` - Animated navigation
- `galaxy` - Galaxy background
- `decrypted-text` - Text decrypt animation

### 🟡 Available to Fetch
- `scramble-text` - Text scramble effect
- `blob-cursor` - Blob cursor effect
- `particles` - Particle background
- `spotlight` - Spotlight effect
- `aurora` - Aurora background
- `meteors` - Meteor animation
- `ripple` - Ripple effect
- `grid-pattern` - Grid background pattern

## 📝 Notes for AI Assistants (Claude/Cursor)

When adding new ReactBits components:

1. **Fetch component metadata:**
   ```bash
   curl https://reactbits.dev/r/{name}.json
   ```

2. **Inspect the JSON response** - ReactBits may not provide direct source code

3. **Create custom implementation** inspired by the demo/preview

4. **Apply grey-only design:**
   - Replace ALL colors with grey shades
   - Use `bg-gray-900/50 backdrop-blur-sm` for cards
   - Use `border-gray-800` for borders
   - Use `text-white` for primary text, `text-gray-400` for secondary

5. **Add framer-motion animations** if component is animated

6. **Update README.md** with component documentation

7. **Follow existing patterns** - See MagicBento.tsx, FlowingMenu.tsx as examples

## 🎓 Best Practices

### Component Creation
- TypeScript strict mode
- Use `'use client'` for client-side components
- Export interfaces for props
- Include JSDoc comments for complex logic

### Styling
- Tailwind utility classes only
- No inline styles (except dynamic values)
- Grey shades from gray-100 to gray-900
- Backdrop blur for glassmorphism: `backdrop-blur-sm`, `backdrop-blur-md`

### Animations
- Use framer-motion for complex animations
- Keep animation durations < 500ms
- Use easing functions: `[0.22, 1, 0.36, 1]` (ease-out)
- Stagger children with 0.1s delay

## 🔍 Troubleshooting

### Component fetch fails
- Check network connection
- Verify ReactBits URL is correct
- Save raw JSON to `/tmp/` for inspection
- May need manual implementation

### Colors appearing in components
- Check for hardcoded color classes (blue-*, purple-*, etc.)
- Replace with grey equivalents
- Use find/replace: `text-blue-` → `text-gray-`

### Animations not working
- Verify framer-motion is installed: `npm list framer-motion`
- Check that component uses `'use client'` directive
- Ensure motion components imported: `import { motion } from 'framer-motion'`

## 📚 Resources

- **ReactBits Registry:** https://reactbits.dev
- **Framer Motion Docs:** https://www.framer.com/motion/
- **Next.js App Router:** https://nextjs.org/docs/app
- **Tailwind CSS:** https://tailwindcss.com/docs

## ✨ Summary

AkhAI now has a complete ReactBits component registry setup with:
- 4 custom UI components (grey-only design)
- Automated fetch scripts
- Comprehensive documentation
- AI assistant context (Cursor rules)
- Registry configuration
- Design system guidelines

All components follow the **strictly monochrome** grey-only minimal design aesthetic.
