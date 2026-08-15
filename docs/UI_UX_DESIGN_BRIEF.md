# VertexPortal LMS — UI / UX Design Brief & Design System

**Document Version:** 2.0.0  
**Design Standard:** LearnOVA / VertexPortal Design Language System (DLS)  
**Target:** Frontend Engineers & UI/UX Designers  
**Status:** Approved for Production  

---

## 1. Design Philosophy & Brand Persona

VertexPortal's visual identity balances **modern elegance, educational clarity, and high-performance immersion**. The interface eliminates visual clutter, prioritizes content readability, utilizes subtle glassmorphism for elevation, and maintains high-contrast typography to ensure prolonged focus during study sessions.

### Brand Keywords
- **Intelligent:** Clean AI chat integration with rich Markdown, LaTeX, and code syntax rendering.
- **Focused:** Distraction-free learning player with modular collapsible sidebars.
- **Vibrant & Trustworthy:** Curated deep royal purples, soft indigo surfaces, and high-visibility status indicators.

---

## 2. Color Palette & Design Tokens

Defined centrally in `frontend/src/index.css` via CSS variables:

### 2.1 Brand & Accent Tokens
| Token Variable | Hex Code | HSL / Usage | Purpose |
|---|---|---|---|
| `--vp-primary` | `#6C5CE7` | `hsl(247, 74%, 63%)` | Primary brand color, CTA buttons, active states |
| `--vp-primary-light` | `#a29bfe` | `hsl(244, 98%, 80%)` | Hover glows, secondary badges, soft outlines |
| `--vp-primary-dark` | `#5046d4` | `hsl(244, 65%, 55%)` | Button active/pressed states, deep accents |
| `--vp-primary-50` | `#f3f1ff` | `hsl(247, 100%, 97%)` | Active sidebar backgrounds, pill tags |
| `--vp-primary-100` | `#ede9fe` | `hsl(250, 92%, 96%)` | Light mode card accent highlights |

### 2.2 Semantic Status Colors
| Token Variable | Hex Code | Purpose |
|---|---|---|
| `--vp-success` | `#00b894` | Passed quizzes, active enrollments, completed lectures |
| `--vp-warning` | `#fdcb6e` | Pending submissions, expiring coupons, trial courses |
| `--vp-danger` | `#d63031` | Errors, failed attempts, refund alerts, account bans |
| `--vp-info` | `#0984e3` | System announcements, live class starting notices |
| `--vp-gold` | `#f9ca24` | Review stars, achievement badges, top rankings |

### 2.3 Surfaces & Backgrounds
| Token Variable | Light Mode | Dark Mode Variant |
|---|---|---|
| `--vp-bg` | `#f7f8fc` (Soft cool grey) | `#0f111a` (Deep Slate Obsidian) |
| `--vp-surface` | `#ffffff` (Pure White) | `#1a1d2e` (Elevated Charcoal) |
| `--vp-surface-2` | `#f7f8fc` (Muted Container) | `#23273c` (Component Container) |
| `--vp-surface-3` | `#eef0f7` (Hover Container) | `#2d324d` (Active Card Hover) |
| `--vp-border` | `#e8eaf0` (Subtle Divider) | `#2e334d` (Dark Border) |

### 2.4 Typography Tokens
| Token Variable | Light Mode | Dark Mode Variant |
|---|---|---|
| `--vp-text` | `#1a1d2e` (High Contrast Black) | `#f1f3f9` (Crisp Off-White) |
| `--vp-text-secondary` | `#636e8a` (Neutral Slate) | `#9da8c7` (Muted Slate) |
| `--vp-text-muted` | `#a0a8c0` (Low Contrast Slate) | `#697394` (Subdued Meta) |

---

## 3. Typography Scale & Font Pairing

- **Display & Headings:** `Plus Jakarta Sans` (`font-sans`, weights: 600, 700, 800) with `-0.025em` tracking for a contemporary editorial feel.
- **Body & UI Text:** `Inter` (`font-sans`, weights: 400, 500, 600) with `-0.011em` tracking for legibility at small sizes.
- **Code & Monospace:** `Fira Code`, `JetBrains Mono`, or system monospace for code blocks, JSON editors, and the interactive Code Playground.

---

## 4. Spacing, Radii & Elevation Shadows

### Radius Scale
- `sm`: `0.375rem` (6px) — Badges, tags, tooltips.
- `md`: `0.75rem` (12px) — Input fields, standard buttons.
- `lg`: `1rem` (16px) — Course cards, modal windows, code editor panes.
- `xl`: `1.25rem` (20px) — Hero containers, player sidebars.
- `full`: `9999px` — Pill filters, avatars, toggle switches.

### Elevation Shadows
- `--vp-shadow-sm`: `0 1px 3px rgba(108, 92, 231, 0.05), 0 1px 2px rgba(0,0,0,0.06)`
- `--vp-shadow`: `0 4px 6px -1px rgba(108, 92, 231, 0.07), 0 2px 4px -1px rgba(0,0,0,0.06)`
- `--vp-shadow-md`: `0 10px 15px -3px rgba(108, 92, 231, 0.08), 0 4px 6px -2px rgba(0,0,0,0.05)`
- `--vp-shadow-lg`: `0 20px 25px -5px rgba(108, 92, 231, 0.1), 0 10px 10px -5px rgba(0,0,0,0.04)`

---

## 5. Component Design Standards

### 5.1 Interactive Video Player
- 16:9 responsive aspect ratio container with HTML5 video custom overlay.
- Left/Right collapsible curriculum drawer displaying modules, lectures, duration, and completion checkmarks.
- Bottom interactive tab bar: **Overview**, **Notes (Timestamped)**, **Discussions (Q&A)**, **Resources (PDF downloads)**, and **AI Tutor Assistant**.

### 5.2 Course Discovery Card
- Aspect ratio 16:9 thumbnail with rounded top borders.
- Badges: Difficulty level (`Beginner`, `Intermediate`, `Advanced`), Category badge, and Bestseller/Featured ribbons.
- Content: Course title (2-line clamp), instructor name & avatar, star rating with total reviews, dynamic price vs. original strikethrough price, and "Add to Cart" / "Enroll Now" quick actions.

### 5.3 Live Classroom (WebRTC Streaming)
- Grid layout adapting dynamically from 1 to 25+ video tiles.
- Active speaker audio indicator with glowing purple border.
- Floating bottom glassmorphic dock: Mic Toggle, Camera Toggle, Screen Share, Hand Raise, Chat Drawer Toggle, and End Call CTA.

### 5.4 AI Assistant Chat Window
- Clean message bubbles with distinct styling for Student (subtle grey right-aligned) and AI Assistant (purple-accented left-aligned).
- Dynamic streaming response with animated typing indicator.
- Support for inline code formatting, Markdown tables, and citation links that seek the video player to exact timestamps.

---

## 6. Accessibility & Responsive Breakpoints

- **Mobile First (`< 640px`):** Single column layouts, bottom navigation bars, collapsible menus, touch targets `>= 44px x 44px`.
- **Tablet (`640px - 1024px`):** Two-column grids, adaptive sidebars with drawer overlays.
- **Desktop (`1024px+`):** Persistent multi-pane layouts, sticky sidebar navigation, dual-pane player & AI tutor.
- **Accessibility:** High color contrast ratio (`>= 4.5:1` for normal text, `>= 3:1` for large text), full keyboard navigable tabindex, and aria live regions for toast notifications.
