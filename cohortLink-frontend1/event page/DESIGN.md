---
name: Unity Hub
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424754'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1280px
---

## Brand & Style
The design system is centered on the concept of "Active Inclusion." It targets diverse community groups—from local sports teams to hobbyist circles—evoking a sense of energy, reliability, and warmth. The aesthetic moves away from aggressive, high-contrast digital trends toward a **Modern Corporate/Social hybrid** style. 

The visual narrative is defined by:
- **Clarity & Air:** High use of whitespace to reduce cognitive load during event coordination.
- **Vibrancy:** Using saturated accent colors against clean, neutral backgrounds to highlight "action" and "creativity."
- **Approachability:** Softened geometry and friendly typography to ensure the platform feels like a welcoming physical community center.

## Colors
The palette is designed to be functional and uplifting. The "Community Blue" serves as the primary driver for navigation and core actions, representing trust and organization. "Activity Green" is reserved for success states, scheduling, and growth-related metrics (like sports wins). "Creative Orange" provides a warm counterpoint for social alerts, highlights, and "jamming" or "play" sessions.

- **Surface:** The primary background is a very light gray (`#f8fafc`) to provide a softer contrast than pure white.
- **Text:** Deep slate neutrals are used for text to maintain high readability without the harshness of pure black.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic feel. The type hierarchy is intentionally "tight" to handle data-heavy community lists while maintaining a friendly presence through generous line heights.

- **Headlines:** Use tighter letter spacing and heavier weights to create strong visual anchors.
- **Labels:** Small labels use a medium or semi-bold weight to ensure they remain legible even when used in colored chips or badges.
- **Mobile Scaling:** Large displays must scale down by roughly 25% on mobile devices to prevent awkward text wrapping in event titles.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1280px max-width container on desktop but transitions to a fluid 4-column grid on mobile devices.

- **The 8pt Grid:** All spatial relationships are multiples of 8px. 16px is the standard padding for cards and containers.
- **Groupings:** Use 24px or 40px spacing to separate major sections (e.g., "Upcoming Games" vs "Recently Joined").
- **Margins:** Desktop views should maintain a minimum 32px safe area from the screen edge to ensure the "airy" feel of the design narrative.

## Elevation & Depth
Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. Because the interface is card-based, depth is critical for distinguishing interactive elements from the background.

- **Level 0 (Surface):** The `#f8fafc` background.
- **Level 1 (Cards):** Pure white background with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)).
- **Level 2 (Hover/Active):** Slightly more pronounced shadow (0px 8px 30px rgba(0, 0, 0, 0.08)) and a 1px subtle stroke using a light neutral shade.
- **Interactive Depth:** No heavy borders. Use subtle color shifts or low-opacity shadows to indicate that an element is clickable.

## Shapes
To align with the welcoming nature of community hubs, the design system employs a **Rounded** shape language. 

- **Components:** Standard buttons and input fields use a 12px (`0.75rem`) radius.
- **Cards:** Content containers use a 16px (`1rem`) radius to feel soft and modern.
- **Iconography:** Use rounded terminals and soft corners for icons to match the UI's geometry. Avoid sharp 90-degree angles wherever possible.

## Components
Consistent application of the "Active Inclusion" theme across core components:

- **Buttons:** Primary buttons use 'Community Blue' with white text and a 12px radius. Secondary buttons should use a light blue ghost style or a subtle gray outline.
- **Cards:** The workhorse of the system. Cards must have 16px internal padding, rounded corners, and a white background. Use "Creative Orange" or "Activity Green" as a top-border accent to categorize the card (e.g., Green for Sports, Orange for Arts).
- **Chips/Badges:** Used for tags like "Intermediate Level" or "Beginners Welcome." These should have a pill shape (fully rounded) and use low-saturation versions of the accent colors for the background with high-saturation text.
- **Input Fields:** Use a subtle 1px border (`#e2e8f0`). On focus, the border should transition to "Community Blue" with a soft outer glow.
- **Lists:** Use generous vertical spacing (12px - 16px) between items. Use a subtle divider or simple whitespace rather than heavy lines.
- **Avatars:** Always circular or heavily rounded to represent the human element of the community. Use a 2px white border when avatars overlap in "Member Groups."