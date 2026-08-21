---
name: PulseFeed Laboratory
colors:
  surface: '#0a1422'
  surface-dim: '#0a1422'
  surface-bright: '#31394a'
  surface-container-lowest: '#050e1d'
  surface-container-low: '#131c2b'
  surface-container: '#17202f'
  surface-container-high: '#212a3a'
  surface-container-highest: '#2c3545'
  on-surface: '#dae3f7'
  on-surface-variant: '#d7c3b3'
  inverse-surface: '#dae3f7'
  inverse-on-surface: '#283140'
  outline: '#9f8d7f'
  outline-variant: '#524438'
  surface-tint: '#ffb873'
  primary: '#ffc794'
  on-primary: '#4b2800'
  primary-container: '#f2a65a'
  on-primary-container: '#6b3c00'
  inverse-primary: '#8b5006'
  secondary: '#78d1ff'
  on-secondary: '#003549'
  secondary-container: '#2d9bc9'
  on-secondary-container: '#002d3f'
  tertiary: '#cfd2df'
  on-tertiary: '#2c303a'
  tertiary-container: '#b3b6c3'
  on-tertiary-container: '#444752'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbf'
  primary-fixed-dim: '#ffb873'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6a3b00'
  secondary-fixed: '#c2e8ff'
  secondary-fixed-dim: '#78d1ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004d68'
  tertiary-fixed: '#dfe2ef'
  tertiary-fixed-dim: '#c3c6d3'
  on-tertiary-fixed: '#181b25'
  on-tertiary-fixed-variant: '#434751'
  background: '#0a1422'
  on-background: '#dae3f7'
  surface-variant: '#2c3545'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.2'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system adopts a "Technical Instrumentation" aesthetic, positioning the product as a high-precision tool for data analysis and real-time monitoring. The brand personality is clinical, authoritative, and obsessively functional, evoking the feel of a laboratory dashboard or specialized hardware interface.

The design style is **Modern Technical Minimalism** with a focus on structured data density. It utilizes a "widgetized" grid layout where every element serves a diagnostic purpose. Visual flair is restricted to functional state indicators (live telemetry vs. static data), ensuring that the UI remains a neutral vessel for complex information. The emotional response should be one of total control and absolute accuracy.

## Colors
This design system employs a strict functional color logic to differentiate the nature of the data being presented.

- **Amber Signal (#f2a65a):** The primary color. Used exclusively for static data points, primary actions (CTAs), and historical records. It represents "ground truth" and stability.
- **Cyan Stream (#3fa7d6):** The secondary color. Reserved for live telemetry, active streams, motion indicators, and real-time connectivity states. It represents "active flow."
- **Foundations:** The dark theme uses a deep slate-navy (#0f131c) to provide technical depth, complemented by a neutral slate (#8a93a6) for secondary UI elements.
- **Borders:** Use low-contrast variations of the muted text color to define widget boundaries (approx. 10-15% opacity of the primary text color).

## Typography
Typography is the primary tool for information hierarchy in this design system.

- **Headings (Space Grotesk):** Use for page titles and section headers. The geometric quirks of Space Grotesk signal innovation and technical precision.
- **UI & Body (Inter):** Use for all descriptive text, labels, and general interface elements. It provides maximum legibility in high-density environments.
- **Raw Telemetry (JetBrains Mono):** This is a mandatory requirement for **all numerical data**, including prices, timestamps, percentages, and coordinates. The monospaced nature ensures that jumping numbers during live updates do not cause layout shift and look like a raw data feed.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid Grid** optimized for multi-pane "Workstation" views.

- **Grid Model:** A 12-column system on desktop. Containers use a 1px solid border to define "Widgets."
- **Density:** High density is encouraged. Use the 4px base unit for tight alignments between related data points.
- **Structure:** Layouts should feel modular. Content is housed in "Cells" or "Panes" that can theoretically be rearranged.
- **Mobile:** On mobile, the 12-column grid collapses to 1 column. Gutters remain 16px to ensure touch targets for numerical data are maintained.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering and Borders** rather than shadows. 

- **Level 0 (Background):** The deepest layer (#0f131c). Used for the overall canvas.
- **Level 1 (Surface):** The widget container. Used for cards, sidebars, and panels.
- **Level 2 (Interaction):** Active or hovered states use a subtle lightening of the surface color or a 1px stroke of the primary/secondary color.
- **Borders:** Use crisp 1px lines to separate data modules. Avoid all drop shadows to maintain the "flat" instrumentation aesthetic.

## Shapes
Shapes are defined by high-radius curves, creating a "pill-shaped" or modular capsule look that softens the technical density.

- **Radius:** Use a generous 1rem (Pill-shaped) radius for buttons and standard containers. This softens the rigid instrumentation aesthetic, making the complex data feel more approachable and modern.
- **Interactive Elements:** Buttons and inputs should maintain consistent heights (32px for small, 40px for standard) to reinforce the grid-based logic while utilizing the pill-shaped profile.

## Components
- **Buttons:** 
  - *Primary (Amber):* For static actions (Save, Export, Submit). Solid fill, dark text. Pill-shaped.
  - *Telemetry (Cyan):* For live actions (Start Stream, Connect, Refresh). Ghost style with a 1px Cyan border. Pill-shaped.
- **Chips:** Monospaced text inside with high-rounded corners (pill style). Use for tags or status indicators. Status: Live should use a pulsing Cyan dot.
- **Data Tables:** No vertical lines. Horizontal lines should be low-contrast at 50% opacity. Numerical columns must be right-aligned using JetBrains Mono.
- **Input Fields:** Inset appearance with a 1rem corner radius and a subtle 1px border. Focus state uses a 1px Amber Signal glow (0px blur, 1px spread).
- **Widgets/Cards:** Defined by a 1px border and a 1rem radius. Headers should use `label-caps` for a "Metadata" look.
- **Progress Bars:** Use Cyan for active progress and Amber for completed/filled states to denote the transition from "active flow" to "static record." All bars should use fully rounded caps.
- **Floating Navigation (BoardSidebar):** The personal board's primary navigation is a vertical rail that floats mid-viewport on the reading edge (`start-6`, `top-1/2`). Matches the Stitch "Floating Sidebar Navigation" reference: a `rounded-2xl` card with a 1px `surface-container-highest` border on `surface-container-low`, `gap-4` between `size-12` `rounded-xl` icon buttons. Active route uses an outlined `primary-container/20` fill with a 1px `primary/20` border; idle/hover follow the Level 2 elevation rule (hover lifts via `surface-container-high` + `primary` icon). Hover/focus reveals a `start-14` tooltip card (`surface-container-highest`). No drop shadow — elevation comes from tonal layering and borders per §Elevation. Lucide icons (`LuHouse`, `LuLayoutGrid`, `LuChartBar`, `LuBell`) map the Stitch Material Symbols. The rail is **freely draggable**: a grip handle at the top (`LuGripHorizontal`) captures pointer input, the card repositions via a compositor-only `translate3d` transform clamped to the viewport (16px margin), and the position persists in `localStorage` across sessions. The handle is keyboard-operable (arrow keys nudge 8px) and honors `touch-action: none` + `cursor: grab/grabbing`. Desktop only (`lg:block`); mobile keeps the top-bar menu.

## Iconography

Icons are implemented with **react-icons / Lucide** (`react-icons/lu`) — the stable, tree-shaken
subset mapped from the Stitch reference's Material Symbols. Use one icon per action, 16–20px,
`currentColor`-derived (inherit the surrounding text token), and keep decorative icons
`aria-hidden="true"`. Icon-only controls must carry an accessible name. Families other than
Lucide are reserved for brand marks only; do not mix icon families within a UI area.