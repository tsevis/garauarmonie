# GARAU TRANSPARENCY STUDIO
## A Creative Director's Companion for Perceptual Color Transparency
### Complete Application Plan — In Memory of Professor Augusto Garau

---

## I. VISION

**Garau Transparency Studio** is an interactive educational and creative tool that brings Augusto Garau's theory of perceptual color transparency to life. It serves as a creative director's companion — not merely a calculator, but a studio where artists, designers, educators, and students can explore, learn, understand, and *compose* with color transparency according to the visual laws that Garau devoted his life to studying.

The app works with **any color in the full RGB spectrum** — not limited to a 12-color wheel. Garau's principles of visual chromatic mixture, scission, and the four juxtaposition types are extended mathematically to operate on the continuous color space, while remaining faithful to their perceptual foundations.

**Design Philosophy:** The interface itself will reflect the elegance of Garau's own visual sensibility — clean, precise, deeply respectful of color. The aesthetic draws from mid-century Italian design rationalism (think Bruno Munari, Albe Steiner) crossed with the clarity of the Bauhaus pedagogical tradition. Every pixel respects color: no gratuitous decoration, no elements that fight the chromatic content.

---

## II. THE THEORETICAL ENGINE

### A. The Core Mathematical Model

The engine extends Metelli's achromatic equations into full RGB/HSL space, following the path laid by Da Pos and refined by Garau's visual-mixture thesis.

#### The Four-Zone Configuration

Every transparency display consists of exactly **four zones**:

```
┌─────────────────────────────────────┐
│                                     │
│    Zone A              Zone B       │   ← BACKGROUND (opaque)
│  (background 1)    (background 2)   │
│         ┌───────────────┐           │
│         │               │           │
│    Zone P    │    Zone Q │           │   ← P and Q are the OVERLAP zones
│  (overlap 1) │ (overlap 2)          │     where the transparent figure
│         │               │           │     crosses each background
│         └───────────────┘           │
│                                     │
└─────────────────────────────────────┘

Zone A = Background color 1 (opaque)
Zone B = Background color 2 (opaque)
Zone P = Where transparent figure overlaps A
Zone Q = Where transparent figure overlaps B
t = The perceived color of the transparent figure
α = Transparency coefficient (0 = fully transparent, 1 = fully opaque)
```


You have to use this graphic, because as Garau was insisting there is need for irregularity for the transparency to be understood. 
Transparencies.png


#### Metelli's Equations (Extended to RGB)

For each channel (R, G, B) independently:

```
P_c = α · A_c + (1 − α) · t_c     (left overlap)
Q_c = α · B_c + (1 − α) · t_c     (right overlap)
```

Where `c` ∈ {R, G, B} and values are normalized [0, 1].

**Solving for α (transparency coefficient):**
```
α = (P − Q) / (A − B)
```
Applied per-channel. For a valid balanced transparency, α must be consistent across all three channels (within a tolerance).

**Solving for t (transparent layer color):**
```
t = (A·Q − B·P) / ((A + Q) − (B + P))
```
Or equivalently per-channel:
```
t_c = (P_c − α · A_c) / (1 − α)
```

#### The Computation Modes

The app supports **three primary computation directions**:

| Mode | Given | Computed |
|------|-------|----------|
| **Forward** | A, B (backgrounds) + t (transparent color) + α (transparency %) | P and Q (overlap colors) |
| **Inverse** | A, B (backgrounds) + P, Q (overlap colors) | t and α |
| **Designer** | A, B (backgrounds) + desired t + desired α range | Best P, Q pairs + validation |

**Forward Mode** is the primary creative mode: "I have a background and I want to paint a transparent shape with this color at this transparency — what colors do I need for the overlap zones?"

#### Perceptual Validity Conditions

The engine validates all results against Garau's 10 necessary conditions:

1. **Four regions** — all four zones must be defined
2. **Visual chromatic mixture** — P and Q must each appear as a visible mixture to the average observer (not a pure primary)
3. **Unbalanced mixture preference** — unbalanced mixtures split more easily than balanced ones (green, orange, violet resist splitting)
4. **Common color** — the two mixtures P and Q must share a perceptual color component, which becomes t
5. **Divergent colors** — the non-shared components become the perceived background colors
6. **Balanced transparency** — t must be present in P and Q in equal perceptual proportion for balanced transparency
7. **Asymmetric correction** — if t is present unequally, background colors must be adjusted to compensate
8. **Transparency degree indicator** — if common color is subordinate in both → very transparent; if dominant → more opaque
9. **Background-first derivation** — transparency can be derived starting from background colors
10. **Background mixtures** — backgrounds can also be mixtures with their own shared subordinate color

Additionally, the **Metelli conditions** are checked:
- **Lightness ordering**: the lightness difference between P and Q must exceed the difference between A and B
- **Topology preservation**: lighter overlay region must be over lighter background region
- **Contrast reduction**: the figure's internal contrast must be less than the background's

### B. The Visual Mixture System

Garau's central thesis: transparency perception depends on **visual** chromatic mixtures, not physical ones. A color is a "visual mixture" if it *appears* to contain two or more primary components to the average observer.

The app implements a **Visual Mixture Analyzer** that, for any RGB color:

1. Converts to perceptual hue space (HSL/LCH)
2. Identifies the **dominant** primary component (R, Y, or B — Garau's three fundamentals)
3. Identifies the **subordinate** component(s)
4. Classifies the mixture ratio: dominant (2:1), balanced (1:1), or subordinate (1:2)
5. Labels the color in Garau's notation: e.g., "reddish Yellow (rY)" meaning dominant Yellow with subordinate red

This extends beyond the 12-color wheel by treating the hue circle as continuous and computing mixture ratios proportionally from any hue angle.

#### Mapping Arbitrary Colors to Garau's Framework

```
Hue 0°–60°    → Red zone: ranges from pure R to balanced RY (orange)
Hue 60°–120°  → Yellow zone: from balanced RY to pure Y to balanced YB (green)  
Hue 120°–180° → transitions through greens
Hue 180°–240° → Blue zone
Hue 240°–300° → transitions through violets
Hue 300°–360° → back toward Red

Within each 60° sector, the dominant/subordinate ratio maps continuously.
Saturation modulates the "purity" of the mixture.
Lightness is handled independently per Metelli's lightness conditions.
```

### C. The Juxtaposition Classifier

Given any two colors forming a pair, the engine classifies them into one of Arnheim's four juxtaposition types:

| Type | Definition | Transparency Quality |
|------|-----------|---------------------|
| **Shared Subordinate** | Same subordinate in both, different dominants | Very transparent, balanced, complementary harmony |
| **Shared Dominant** | Same dominant in both, different subordinates | Less transparent, balanced, strong figural unity |
| **Complete Inversion** | Two colors only, each dominant in one and subordinate in other | Two shared colors, convergent, needs background correction |
| **Partial Inversion** | Three colors, one inverts its role | Strong divergence, clashing, needs careful balancing |

---

## III. APPLICATION ARCHITECTURE

### Modular Tab-Based Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  🎨 GARAU TRANSPARENCY STUDIO                            [≡]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ Composer ]  [ Analyzer ]  [ Gallery ]  [ Theory ]  [ + ]     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              Active Module Content Area                  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ Status Bar ────────────────────────────────────────────┐   │
│  │  Validity: ✓  │  α = 0.35  │  Type: Shared Subordinate │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Module 1: TRANSPARENCY COMPOSER (Primary Creative Tool)

The central module. A visual workspace where the creative director builds transparency displays.

**Left Panel — Input Controls:**
- **Color Picker for A** (background 1) — full-spectrum picker with RGB/HSL/Hex input
- **Color Picker for B** (background 2) — same
- **Color Picker for t** (transparent layer color) — same
- **Alpha Slider (α)** — 0% to 100% transparency, with percentage display
- **Computation Direction Toggle** — Forward / Inverse / Designer mode
- A "Swap A↔B" button for quick reversal
- An "Auto-suggest t" button that finds perceptually optimal transparent layer colors given A and B

**Center Panel — Live Transparency Display:**
- A large, real-time rendered four-zone rectangle display
- The transparent shape is rendered as a configurable form (rectangle, circle, or custom polygon) overlapping both A and B backgrounds
- All four zones labeled: A, B, P, Q
- The transparent figure has a subtle depth indicator (slight shadow or offset) to reinforce the perceptual layering
- **Interactive**: clicking any zone selects it and shows its color information
- **Drag handles** to resize the overlap proportions

**Right Panel — Results & Analysis:**
- Computed colors displayed as swatches: P, Q, t, α
- RGB / HSL / Hex values for all six values (A, B, P, Q, t, α)
- **Validity Dashboard:** 
  - Green/red indicators for each of the Metelli conditions
  - Green/red indicators for each of Garau's 10 chromatic conditions
  - Explanation text for any violated condition
- **Juxtaposition Type** of the P-Q pair (auto-classified)
- **Transparency Quality Meter**: how "compelling" the transparency impression is likely to be, based on:
  - Mixture balance of P and Q
  - Degree of visual mixture
  - Lightness condition strength
  - Juxtaposition type
- **Copy/Export buttons** for all color values

**Interactive Features:**
- Dragging any color picker updates the entire display in real-time
- Hovering over a zone highlights its equation contribution
- A "Randomize" button that generates valid transparency displays
- "Snap to Palette" option to constrain to specific color systems (Pantone, Hesselgreen, Munsell, etc.)

### Module 2: VISUAL MIXTURE ANALYZER

An educational and analytical module for understanding any color as a visual mixture.

**Interface:**
- A large color picker / input area
- For any selected color, the app displays:
  - **Garau Notation**: e.g., "reddish Blue (rB)" — dominant Blue, subordinate red
  - **Visual decomposition diagram**: an animated bar or pie showing the proportional primary content
  - **Mixture type**: pure / unbalanced / balanced
  - **Splittability score**: how easily this color can be split perceptually (pure colors = 0, unbalanced mixtures = high, balanced = medium-low)
  - **The complementary mixture** (the shared-subordinate partner)
  - **Position on the chromatic disk** — an interactive Garau/Arnheim color disk showing where this color sits

**Pair Analysis Mode:**
- Input two colors
- The app classifies their juxtaposition type
- Shows the connecting/diverging tensions graphically
- Predicts transparency behavior if used as P-Q pair
- Shows which backgrounds (A, B) would make this pair work as a transparency display

### Module 3: GALLERY & PRESETS

A curated collection of transparency displays organized by type.

**Categories:**
- **By Juxtaposition Type**: Shared Subordinate, Shared Dominant, Complete Inversion, Partial Inversion
- **By Transparency Degree**: Very transparent → Semi-transparent → Nearly opaque
- **Historical**: Recreations of the examples from Garau's book (plates 35–40)
- **Art References**: Analysis of transparency in works by Klee, Kandinsky, Lissitzky, Moholy-Nagy, Albers, Soldati, Rho (as discussed by Garau)
- **User Saved**: personal collection of created displays

Each gallery entry is interactive — clicking it loads the configuration into the Composer for further exploration.

### Module 4: THEORY (Educational Module)

An interactive textbook that teaches Garau's theory step by step.

**Chapters:**
1. **What is Perceptual Transparency?** — Physical vs. perceptual transparency, the role of context, why a physically transparent surface can appear opaque (Tudor-Hart demonstration)
2. **The Four Zones** — Kanizsa's discovery that four regions (not three) are needed, interactive demo
3. **Metelli's Mathematics** — Interactive derivation with sliders showing how α and t are computed, Talbot's law
4. **Chromatic Scission** — Heider's hypothesis, visual chromatic mixtures, Garau's thesis that visual (not physical) reality governs transparency
5. **The 10 Conditions** — Interactive checklist with live examples that violate and satisfy each condition
6. **The Four Juxtapositions** — Arnheim's framework with interactive exploration of each type's transparency qualities
7. **Additive vs. Subtractive** — The Da Pos / Beck debate, interactive comparison showing why additive mixing governs transparency perception
8. **Multiple Transparencies** — Stacking transparent layers, depth plane sequences
9. **Anomalous Transparency** — Garau's chapter 10: cases where background color need not be recognizable
10. **Transparency in Painting** — Historical examples, from Feininger and Klee to Garau's own work

Each chapter features:
- Concise text adapted from Garau's writing
- Interactive diagrams that respond to user manipulation
- "Try it yourself" exercises that link to the Composer
- Key terms highlighted with tooltip definitions

### Module 5: MULTIPLE TRANSPARENCY STACKER (Future Plugin)

For composing layered transparency sequences as described by Garau:

- Background: pure color + mixture containing that color
- Layer 1: complete-inversion pairing
- Layer 2: shared-subordinate pair
- Layer 3: shared-dominant pair

The interface visualizes the accumulation of layers with adjustable depth separation and independent α per layer.

---

## IV. PLUGIN ARCHITECTURE (Future Expandability)

The app is built with a **plugin system** so new modules can be added:

```javascript
// Plugin interface
interface GarauPlugin {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
  
  // Optional hooks into the shared color engine
  onColorChange?: (colors: TransparencyConfig) => void;
  getExports?: () => ExportData;
}

// Shared services available to all plugins
interface GarauServices {
  colorEngine: {
    computeForward(A, B, t, α) → { P, Q, validity };
    computeInverse(A, B, P, Q) → { t, α, validity };
    analyzeVisualMixture(color) → MixtureAnalysis;
    classifyJuxtaposition(c1, c2) → JuxtapositionType;
    validateTransparency(config) → ValidationReport;
  };
  colorPicker: SharedColorPickerComponent;
  displayRenderer: TransparencyDisplayRenderer;
  galleryStorage: SaveLoadSystem;
  themeColors: DesignSystemTokens;
}
```

**Potential future plugins:**
- **Palette Generator** — Generate entire color palettes based on transparency relationships
- **CSS/SVG Exporter** — Export transparency displays as CSS gradients, SVG compositions, or PNG images
- **Painting Analyzer** — Upload an image and identify transparency relationships in it
- **Color Blindness Simulator** — Check how transparency displays appear under different color vision deficiencies
- **Animation Studio** — Animate transitions between different transparency states
- **Print Calibration** — Convert display colors to CMYK with transparency-aware separation
- **Garau Harmony Explorer** — Extend to the other chapters of Color Harmonies (not just transparency)

---

## V. TECHNICAL IMPLEMENTATION

### Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | **Python** 
| Styling | **Tailwind CSS** + CSS custom properties | Rapid, consistent styling with theme variables |
| Color Engine | **Custom module** | No library covers Garau's specific theory |
| Color Space | **LCH/Lab** for perceptual operations, RGB for display | Perceptually uniform space crucial for Garau's visual-mixture logic |



### Color Engine Core API

```typescript
// Core types
type RGB = { r: number; g: number; b: number };     // 0-255
type HSL = { h: number; s: number; l: number };     // h: 0-360, s/l: 0-100
type NormalizedRGB = { r: number; g: number; b: number }; // 0-1

type GarauMixture = {
  dominant: 'R' | 'Y' | 'B';
  subordinate: 'R' | 'Y' | 'B' | null;
  ratio: number;  // 0 = pure, 0.5 = balanced, approaches 1 = inverted
  notation: string; // e.g. "rB" (reddish Blue)
};

type TransparencyConfig = {
  A: RGB;  // Background 1
  B: RGB;  // Background 2
  t: RGB;  // Transparent layer color
  alpha: number; // 0–1 transparency coefficient
};

type TransparencyResult = {
  P: RGB;  // Overlap zone 1
  Q: RGB;  // Overlap zone 2
  alpha: number;
  t: RGB;
  validity: ValidationReport;
  juxtapositionType: JuxtapositionType;
  transparencyQuality: number; // 0–100
};

type ValidationReport = {
  metelliConditions: {
    lightnessOrdering: boolean;
    topologyPreserved: boolean;
    contrastReduction: boolean;
  };
  garauConditions: {
    fourRegions: boolean;
    visualMixtureP: boolean;
    visualMixtureQ: boolean;
    unbalancedPreference: boolean | null; // null = N/A
    commonColorExists: boolean;
    divergentColorsExist: boolean;
    balancedTransparency: boolean;
    alphaConsistency: boolean; // α consistent across channels
  };
  overallValid: boolean;
  warnings: string[];
  suggestions: string[];
};

// Core functions
function computeForward(A: RGB, B: RGB, t: RGB, alpha: number): TransparencyResult;
function computeInverse(A: RGB, B: RGB, P: RGB, Q: RGB): TransparencyResult;
function analyzeVisualMixture(color: RGB): GarauMixture;
function classifyJuxtaposition(c1: RGB, c2: RGB): JuxtapositionType;
function validateTransparency(config: FullConfig): ValidationReport;
function suggestTransparentColor(A: RGB, B: RGB): RGB[];
function suggestBackgrounds(t: RGB, alpha: number): { A: RGB; B: RGB }[];
```

---

## VI. VISUAL DESIGN LANGUAGE

### Aesthetic Direction: Italian Rationalism meets Perceptual Science

- **Background**: Neutral warm gray (#F5F3F0) — never competes with color samples
- **Typography**: A refined sans-serif with humanist proportions (suggestion: Source Sans 3 or equivalent)
- **Color samples**: Always rendered at maximum fidelity — no borders, no rounded corners on swatches (borders influence color perception, as Garau himself would insist)
- **Layout**: Clean grid with generous whitespace; the transparency display always gets the most visual weight
- **Interactions**: Smooth, purposeful transitions; color changes interpolate in perceptual space (LCH), not RGB
- **Icons**: Minimal line icons, monochromatic
- **Status indicators**: Subtle, non-distracting — small colored dots, not loud badges

### Key Graphic Elements

1. **The Four-Zone Display** — The signature visual. A rectangle divided into four zones by the overlapping transparent figure. This is rendered as a live canvas/SVG with:
   - The two background zones (A, B) side by side
   - The transparent figure overlapping both, creating P and Q
   - A subtle depth separation effect (thin shadow line at the figure boundary)
   - Optional: a 3D "exploded view" showing the layers separated in perspective (inspired by Metelli's Plate 46 diagram)

2. **The Chromatic Disk** — An interactive Garau/Arnheim-style color disk that maps the full hue circle with the three primaries (R, Y, B) and their six mixtures, extended to any arbitrary hue. Used in the Analyzer and Theory modules.

3. **The Equation Panel** — A clean mathematical display showing the active equations with color-coded terms that match the zones they represent. Updating live as values change.

4. **The Validity Dashboard** — A vertical stack of condition indicators (⬤ green = met, ⬤ red = violated, ⬤ gray = N/A), each expandable to show explanation.

---

## VII. DEVELOPMENT PHASES

### Phase 1: Foundation (Current Sprint)
- [ ] Color Engine: computeForward, computeInverse, validation
- [ ] Four-Zone Display renderer (SVG/Canvas)
- [ ] Basic Composer module with color pickers and alpha slider
- [ ] Validity condition checker with visual indicators
- [ ] Modular tab framework

### Phase 2: Analysis & Education
- [ ] Visual Mixture Analyzer module
- [ ] Juxtaposition Classifier
- [ ] Chromatic Disk visualization
- [ ] Theory module: first 3 chapters
- [ ] Gallery: Garau's book examples (plates 35–40)

### Phase 3: Advanced Features
- [ ] Multiple Transparency Stacker
- [ ] Designer mode with auto-suggestions
- [ ] Theory module: remaining chapters
- [ ] Export capabilities (PNG, SVG, CSS)
- [ ] Gallery: art references analysis

### Phase 4: Plugin System & Polish
- [ ] Plugin architecture and API
- [ ] User-saved gallery with persistence
- [ ] Responsive design for mobile/tablet
- [ ] Accessibility (keyboard nav, screen reader descriptions)
- [ ] Performance optimization

---

## VIII. DEDICATION

> *"I have devoted most of my life to the study of painting. Having developed an interest in the expressive possibilities offered by transparency in colored displays, I have sought to deepen my understanding of the laws that might govern it."*
> — Augusto Garau, *Color Harmonies*

This application is dedicated to the memory of **Professor Augusto Garau** (1923–2010), painter, educator, and scholar. His work bridged the worlds of art and perception science, demonstrating that the laws governing how we see color are not constraints on artistic expression but instruments of it. In building this tool, we honor his conviction that understanding visual reality — which, as he insisted, does not overlap with physics — is essential to the creative act.

---

*Document prepared for the Garau Transparency Studio project*
*Version 1.0 — February 2026*
