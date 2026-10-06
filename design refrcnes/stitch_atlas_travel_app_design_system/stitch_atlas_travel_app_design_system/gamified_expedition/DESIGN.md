---
name: Gamified Expedition
colors:
  surface: '#061613'
  surface-dim: '#061613'
  surface-bright: '#2c3c39'
  surface-container-lowest: '#03110e'
  surface-container-low: '#0e1e1b'
  surface-container: '#13221f'
  surface-container-high: '#1d2d2a'
  surface-container-highest: '#283834'
  on-surface: '#d4e6e1'
  on-surface-variant: '#c2c8c2'
  inverse-surface: '#d4e6e1'
  inverse-on-surface: '#233330'
  outline: '#8c928d'
  outline-variant: '#424844'
  surface-tint: '#adcebb'
  primary: '#adcebb'
  on-primary: '#183628'
  primary-container: '#0f2d20'
  on-primary-container: '#769684'
  inverse-primary: '#476555'
  secondary: '#94d4b2'
  on-secondary: '#003824'
  secondary-container: '#0b5137'
  on-secondary-container: '#83c2a1'
  tertiary: '#eac34a'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca830'
  on-tertiary-container: '#4f3e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9ead6'
  primary-fixed-dim: '#adcebb'
  on-primary-fixed: '#022114'
  on-primary-fixed-variant: '#2f4d3e'
  secondary-fixed: '#b0f1cd'
  secondary-fixed-dim: '#94d4b2'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#0b5137'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#061613'
  on-background: '#d4e6e1'
  surface-variant: '#283834'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-micro:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-sm: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system defines a luxury expedition aesthetic combined with modern cartographic gamification. It balances the timeless tactile feel of physical field exploration—reminiscent of field notebooks, brass compasses, and parchment topographical charts—with high-precision digital cartography, frosted HUD elements, and crisp geometric milestone tracking.

The visual style merges **modern organic tactile design** with **refined glassmorphism**:
- Rich, atmospheric deep forest tones serve as night-mode terrain and ambient backdrops.
- Warm parchment and cream surfaces provide daytime clarity and editorial warmth for discovery feeds.
- High-contrast gold and bronze accents denote progression, rare unlocked nodes, and earned accolades.
- Glassmorphic floating navigation controls float effortlessly over live fog-of-war satellite and vector maps.

## Colors

The color palette is anchored in nature, exploration, and earned prestige.

### Theme Palette Roles
- **Primary (`#0F2D20`)**: Deep evergreen base applied to primary interactive touchpoints, hero navigation containers, and prominent confirmation pills.
- **Secondary (`#1F5F44`)**: Sage leaf green used for intermediate state indicators, verified GPS tracking badges, secondary action pills, and active filter states. Bright accent green (`#2E7D5B`) supports success feedback and active radar rings.
- **Tertiary Accent (`#D4AF37` / `#C69214`)**: Radiant expedition gold and antique bronze reserved exclusively for high-value gamification elements: XP progress fill meters, achievement badge crests, unlocked discovery rings, and tier ranks.
- **Neutral Base (`#071714`)**: Ultra-deep abyssal forest black, delivering high contrast for the fog-of-war map overlay, dark-mode sheet cards, and floating utility bars.
- **Warm Parchment (`#EFECE6`)**: Grounding organic neutral applied to light-mode card surfaces, discovery feeds, and content container backgrounds.
- **Crisp Pure White (`#FFFFFF`)**: Primary typography on dark surfaces, icon stroke highlights, and specular reflections on glass elements.
- **Muted Stone (`#667085` & `#98A2B3`)**: Secondary label metadata, inactive bottom bar icons, coordinate details, and subtle outline borders.

## Typography

Typography prioritizes legibility in direct sunlight and dark map environments. Headings employ tight tracking for an authoritative, modern feel, while small labels, status capsules, and level tags use expanded tracking with medium-to-bold weights to guarantee readability at a glance.

- **Headlines**: Set in Inter with negative tracking to produce dense, commanding titles across place names, milestone popups, and screen headers.
- **Body**: Neutral and balanced, optimized for multi-line location descriptions, guides, and travel reviews.
- **Labels & Micro-copy**: Employs uppercase or small-caps letter-spacing on coordinates, XP counters, and level markers to mimic technical navigational readouts.

## Layout & Spacing

The layout is built for native mobile ergonomics, emphasizing thumb-zone accessibility and uninterrupted map surfaces.

### Layout Rhythm
- **Grid Structure**: 4-column fluid mobile grid with `1.25rem` (`20px`) outer safe-area margins and `1rem` (`16px`) gutters.
- **Floating HUD Elements**: Overlays, map controls, and search capsules maintain a minimum clearance of `1rem` from screen boundaries, nested within the bottom safe area.
- **Adaptive Docking**: Bottom bars and drawer sheets anchor to the viewport perimeter, while cards inside feeds and carousels use consistent `0.75rem` to `1rem` internal gaps.

## Elevation & Depth

Visual hierarchy uses frosted glassmorphism layered over topographical maps, complemented by atmospheric depth shading.

### Layering System
1. **Canvas Layer (Level 0)**: Full-viewport interactive map canvas or solid `#071714` / `#EFECE6` document root.
2. **Fog & Mask Layer (Level 1)**: Semi-transparent hex overlays (`rgba(7, 23, 20, 0.78)`) with blur filters obscuring unvisited zones.
3. **Card Layer (Level 2)**: Solid and translucent surface cards with an ambient shadow (`box-shadow: 0 8px 24px -4px rgba(7, 23, 20, 0.12), 0 2px 6px -1px rgba(7, 23, 20, 0.08)`) and fine `1px` inner borders (`rgba(255, 255, 255, 0.08)` on dark, `rgba(15, 45, 32, 0.06)` on parchment).
4. **Floating HUD & Controls (Level 3)**: Frosted glass floating pills using backdrop blur (`backdrop-filter: blur(16px)`), background color `rgba(255, 255, 255, 0.85)` in light mode or `rgba(15, 45, 32, 0.82)` in dark mode, accompanied by subtle inner hairline highlights.
5. **Milestone & Modal Layer (Level 4)**: Overlays with deep diffused shadows (`box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.45)`) and gold aura glows (`box-shadow: 0 0 28px rgba(212, 175, 55, 0.35)`) celebrating unlocked locations and achievements.

## Shapes

The design uses a rounded geometry (`roundedness: 2` at its base) scaled up for high-touch mobile touchpoints.

### Shape Language
- **Cards & Modals**: Corner radii span `20px` to `24px` (`rounded-xl` to custom `rounded-2xl`), evoking comfortable handheld physical instruments.
- **Pills & Action Hubs**: Fully rounded capsule ends (`rounded-full` / `9999px`) for search bars, category tags, action buttons, and status chips.
- **Achievement & Map Hexagons**: Custom regular hexagonal geometry (`clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`) represents modular exploration grid sectors, unlocked territory clusters, and rank crests.

## Components

### Buttons
- **Primary Action Pill**: Full-bleed or pill-shaped buttons styled in `#0F2D20` with pure white text, active press compression (scale 0.98), and a `52px` minimum touch target height.
- **Accent Unlock Button**: Gold gradient fill (`linear-gradient(135deg, #D4AF37, #C69214)`) with dark green text (`#071714`) and bold typography for major check-in confirmations and claim events.
- **Ghost & Secondary Buttons**: Frosted translucent surface with a `1px` subtle outline, used for secondary dismissals and bookmark actions.

### Floating Bottom Navigation
- Persistent 5-tab docked bar featuring an elevated central Action (+) trigger.
- Translucent frosted container (`backdrop-filter: blur(20px)`) with rounded floating profile or anchored perimeter docked to safe bottom bounds.
- Icons: Home, Explore/Map, Central Action Hub (`#0F2D20` circular coin with white icon), Social/Friends, and Profile.
- Active states indicated by micro gold or sage dot indicators beneath icons.

### Hexagonal Fog-of-War & Achievement Badges
- **Map Hexagon Grid**: Tiled polygon meshes covering unexplored coordinates with dark mist (`#071714` at 80% opacity), peeling away with gold boundary pulses upon GPS check-in.
- **Achievement Medallions**: Hexagonal double-bordered crests incorporating brass, gold, and emerald icons with level numerals pinned to the lower vertex.

### Gamification Meters & Counters
- **XP Progress Bar**: `6px` or `8px` rounded track with `#1F5F44` background and smooth `#D4AF37` gradient progress fill, accented with an optional leading glowing specular pip.
- **Exploration Stats**: Triple stat modules displaying circular or pill progress meters for `% World Explored`, `Places Visited`, and `Badges Earned`.

### Cards & Discovery Modules
- Rounded corners (`20px` - `24px`), borderless or bordered by ultra-thin `1px` surface borders.
- Aspect ratio of 4:3 or 16:9 for scenic photography, with bottom gradient scrims ensuring legibility for overlaid white titles and distance tags.
- Embedded pill tags on top corners indicating community rating, XP award value (`+50 XP`), or verification status.

### Form Inputs & Search Capsules
- Floating search bars styled as pill capsules with inset search glyph, voice action, and quick-filter toggle.
- Background: Translucent cream (`#EFECE6`) on light surfaces or `#0F2D20` with `20%` white alpha on maps.
- Focus state: `1.5px` border glow in `#2E7D5B` or `#D4AF37`.