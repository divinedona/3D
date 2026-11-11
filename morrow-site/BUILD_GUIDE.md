# Building Morrow: the complete implementation guide

This document explains the Morrow website in this repository, including the exact structure, styling decisions, procedural 3D objects, animations, and interactions. It is intended to help you rebuild the same experience, understand the existing code, or adapt it to another brand.

The source files are the authority for exact behavior. Values described below reflect the implementation documented on November 3, 2026. Sections called “Next steps” describe possible extensions rather than features already built.

## Contents

1. [What the website contains](#1-what-the-website-contains)
2. [Technology and file structure](#2-technology-and-file-structure)
3. [Installing and running it](#3-installing-and-running-it)
4. [The design foundation](#4-the-design-foundation)
5. [Header and navigation](#5-header-and-navigation)
6. [Hero section](#6-hero-section)
7. [The interactive workspace](#7-the-interactive-workspace)
8. [The possibilities section](#8-the-possibilities-section)
9. [The moving project gallery](#9-the-moving-project-gallery)
10. [The companion section](#10-the-companion-section)
11. [The interactive footer](#11-the-interactive-footer)
12. [The three dialog views](#12-the-three-dialog-views)
13. [The shared 3D engine](#13-the-shared-3d-engine)
14. [Animation and interaction map](#14-animation-and-interaction-map)
15. [Responsive layout and accessibility](#15-responsive-layout-and-accessibility)
16. [A practical build sequence](#16-a-practical-build-sequence)
17. [Testing and troubleshooting](#17-testing-and-troubleshooting)
18. [Deployment, customization, and production extensions](#18-deployment-customization-and-production-extensions)

## 1. What the website contains

Morrow is a fictional creative playground. The page introduces the brand, gives visitors a small working workspace to explore, shows example projects, introduces six characters, and ends with a large interactive character and another invitation to try the workspace.

Although different sections can feel like different pages, the current site is a **single scrolling page**. It does not use a router. Its navigation links change the URL fragment and scroll to an element in the same document.

| View | Location | Purpose |
| --- | --- | --- |
| Header and hero | `#top` | Establish the brand and show the main experience |
| Embedded workspace | `#playground`, inside the hero | Let visitors interact immediately |
| Possibilities | `#possibilities` | Explain the four benefits |
| Project gallery | `#work` | Show examples of what could be made |
| Companions | `#crew` | Let visitors explore six personalities |
| Interactive footer | `#hello` | End with a memorable interaction and call to action |
| Expanded workspace | Native dialog | Provide a larger version of the embedded workspace |
| Project detail | Native dialog | Inspect an example and add an idea based on it |
| About | Native dialog | Explain the concept and the demo |

The workspace has four internal tabs: Home, Your ideas, Your crew, and Inspiration. These tabs change a React state value; they do not navigate to new URLs.

The page uses both browser-rendered 3D and ordinary HTML/CSS. The floating characters, cube, character portrait, live gallery character, and footer creature are real Three.js objects. The typography, buttons, dotted backgrounds, sticky notes, orbit artwork, and moving gallery track are HTML/CSS.

The demo does not currently have accounts, a database, AI generation, saved projects, or a payment system. Adding an idea stores a text item in React memory for the current page visit. Reloading resets it.

## 2. Technology and file structure

### 2.1 The stack

| Tool | Responsibility |
| --- | --- |
| React and React DOM | Components, state, conditional content, dialog control |
| Three.js | Geometry, materials, lighting, cameras, WebGL rendering |
| Vite | Development server, module loading, asset handling, production build |
| Vite React plugin | JSX transformation and component refresh during development |
| Lucide React | Asterisk, arrows, navigation icons, help, close, and other SVG icons |
| CSS | Layout, typography, decorative artwork, hover effects, marquee, responsive rules |
| Browser APIs | Pointer input, animation frames, element visibility, resizing, native dialogs |
| Biome | Source formatting and lint checks |

The repository declares React `^19.2.8`, React DOM `^19.2.8`, Three.js `^0.185.1`, Lucide React `^1.34.0`, Vite `^8.2.2`, and the React plugin `^6.1.0`. Biome is declared as `2.4.9`. These are package declarations; the lockfile records the versions actually resolved during installation.

This implementation uses Three.js directly. It does not require React Three Fiber, GSAP, Framer Motion, Spline, Blender, imported character models, or custom GLSL shaders. Those tools could be used in a different implementation, but they are not dependencies of the site built here.

### 2.2 Source files

```text
berd/
├── package.json                      Existing dependency declarations
├── pnpm-lock.yaml                    Existing dependency lockfile
├── src/app/assets/fonts/             Shared local fonts
└── morrow-site/
    ├── index.html                    HTML shell and metadata
    ├── main.jsx                      Mounts the React application
    ├── app.jsx                       Page, data, workspace, gallery, dialogs
    ├── scene.jsx                     Reusable imperative Three.js scene
    ├── styles.css                    All site styles and CSS animations
    ├── vite.config.mjs               Dedicated site build/server configuration
    ├── README.md                     Quick start
    ├── BUILD_GUIDE.md                This document
    └── dist/                         Generated production output
```

The site is in its own folder but uses dependencies from the parent repository. It also references the parent repository's font files. Copying only `morrow-site` into an empty directory will therefore require installing dependencies and updating or copying the fonts.

### 2.3 Component responsibilities

`App` owns state shared by multiple sections: `party`, `selected`, `menu`, `modal`, `ideas`, and `footerWord`. It also installs reveal observers and the custom cursor handlers.

`Logo` creates the asterisk plus wordmark and links back to the hero.

`Workspace` owns its own current tab, text input, and feedback message. It receives the shared idea list and the shared function for adding an idea.

`WorkArt` chooses the character, poster, or orbit artwork. Its `live` prop determines whether the character artwork uses an actual Three.js scene or a lightweight CSS illustration.

`Scene` owns a canvas and its Three.js resources. Its props select the kind of scene to create and the state needed by its animation loop.

Keeping `main.jsx` separate from `app.jsx` matters during development. The entry file calls `createRoot` once, while component updates can refresh the application without repeatedly creating a React root on the same element.

## 3. Installing and running it

### 3.1 Run the existing copy

Open PowerShell in the repository root:

```powershell
Set-Location C:\Users\HP\Desktop\berd
```

If dependencies are not installed, follow the repository setup instructions and install them with its configured package manager:

```powershell
pnpm install
```

The repository specifies `pnpm@10.33.0`. Use that version for a reproducible fresh installation. The working environment used Node.js `22.21.0`; confirm the Node version is compatible with the repository and Vite before installing.

Start Morrow using its dedicated configuration:

```powershell
.\node_modules\.bin\vite.cmd --config morrow-site/vite.config.mjs
```

Open `http://127.0.0.1:5180/`. Keep the terminal process running while using the development server. Use Ctrl+C in that terminal when you want to stop it.

Do not use the root `pnpm dev` command to start this particular page: that command selects the Berd application's default Vite configuration. Morrow uses the configuration under `morrow-site`.

### 3.2 Understand the Vite configuration

```js
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5180, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
```

`root` is resolved relative to the configuration file, so the HTML entry comes from `morrow-site`. Port `5180` avoids using the Berd app's original port. `strictPort` means Vite reports an occupied port instead of silently switching to another one. The host is the local loopback address.

Because the root is `morrow-site`, `outDir: "dist"` produces `morrow-site/dist`. A build clears that generated output directory before writing the new build. Keep handwritten source files outside `dist`.

### 3.3 Build and preview production output

```powershell
.\node_modules\.bin\vite.cmd build --config morrow-site/vite.config.mjs
```

Then, for a local production preview:

```powershell
.\node_modules\.bin\vite.cmd preview --config morrow-site/vite.config.mjs --host 127.0.0.1 --port 5181
```

Use the URL printed by Vite. This preview command is separate from the development server. Serve the generated files through an HTTP server; do not rely on double-clicking the built HTML file and opening it through `file://`.

### 3.4 Rebuild it as a standalone project

For a project outside Berd:

1. Create a folder with its own `package.json` and `type: "module"`.
2. Copy `index.html`, `main.jsx`, `app.jsx`, `scene.jsx`, `styles.css`, and `vite.config.mjs` into that folder.
3. Install React, React DOM, Three.js, and Lucide React, plus Vite and its React plugin.
4. Copy the three licensed font files into a local `assets/fonts` folder. Preserve their license notices.
5. Update the three `@font-face` URLs in `styles.css` to match the copied font locations.
6. Add scripts such as `"dev": "vite"`, `"build": "vite build"`, and `"preview": "vite preview"`.
7. Commit that project's own dependency lockfile if you need consistent installation versions.

The relative root resolution in the current Vite configuration also works when that configuration and the source files sit together at the root of a new project.

## 4. The design foundation

### 4.1 The visual idea

The design combines a quiet editorial page with playful objects. Large headings and generous spacing give the content structure. Rounded characters, slightly rotated paper elements, small labels, and a restrained pastel palette give it personality.

The main repeating visual elements are an asterisk, oversized two-line headings, a sans-serif/italic-serif combination, thin separators, colored notes, small monospace captions, and characters with simple eyes and smiles. Repeating these elements is what makes the sections feel like one brand.

### 4.2 Colors

| Use | Value |
| --- | --- |
| Main paper/background | `#f2f0e9` |
| Main ink/text | `#202a23` |
| Brand orange | `#fa603d` |
| Main separator | `#d6d7ce` |
| Workspace surface | `#fffef8` |
| Workspace sidebar | `#fafbf5` |
| Yellow sticky note | `#f4d791` |
| Gallery section | `#e8e9df` |
| Character gallery artwork | `#d3bddd` |
| Poster artwork | `#ff7047` |
| Orbit artwork | `#263a2c` |
| Footer | `#f0b99d` |

The first four are CSS custom properties under `:root`. Some other colors are written directly in component rules. If adapting the brand broadly, consider gathering those additional colors into variables as well.

### 4.3 Typography

Three local fonts are loaded with `@font-face`:

- **Inter**, exposed as `Morrow Sans`: navigation, body text, controls, and upright headings.
- **Fraunces Italic**, exposed as `Morrow Serif`: italic headline phrases, note text, and character quotes.
- **Geist Mono**, exposed as `Morrow Mono`: section numbers, status labels, and small UI metadata.

`font-display: swap` allows fallback text to appear while a font loads. The variable font files support a range of weights rather than requiring a separate file for every weight.

The global `em` rule selects the italic serif. That means a heading can remain a single semantic heading while changing typography for its second line:

```jsx
<h1>
  A little weird.
  <br />
  <em>A lot of possible.</em>
</h1>
```

Large headings use tight negative letter spacing and short line heights. Keep the typography intentional: replacing the fonts without adjusting size and tracking can change line wrapping and the relationship between the headline and the characters.

### 4.4 Basic layout rules

`box-sizing: border-box` makes padding and borders part of an element's declared size. The body margin is removed. Horizontal overflow is clipped to contain oversized artwork.

The page uses `scroll-behavior: smooth` and `scroll-padding-top: 100px` for anchor navigation. Reduced-motion rules disable smooth scrolling.

Most sections use percentage horizontal padding so the margins scale with the viewport. Broad page layouts use Grid or Flexbox; absolute positioning is reserved for layered compositions inside a section or workspace.

## 5. Header and navigation

### 5.1 What visitors see

The header has the Morrow logo on the left, three links in the middle, and the Try Morrow button on the right. At narrower widths the middle links are replaced by a menu control.

The logo is built from a Lucide asterisk, the word `morrow`, and a small superscript `®`. The symbol is part of the visual concept; it should not be taken as a statement that this fictional brand has a registered trademark.

### 5.2 How to build it

Use a semantic `<header>` containing the logo, a `<nav aria-label="Main navigation">`, and a group of action buttons. The header is absolutely positioned at the top of the page with `z-index: 10`, a desktop height of `93px`, and horizontal padding of `4.5%`.

It is not sticky in the current implementation. As the visitor scrolls down, the header scrolls out of view.

The links point to `#playground`, `#crew`, and `#work`. The logo points to `#top`. A hover underline is a pseudo-element whose width changes from zero to 100% over `200ms`.

The primary button uses the dark ink background, cream text, a small radius, and an arrow. On hover it turns orange and moves up by two pixels.

### 5.3 Interaction logic

Try Morrow sets `modal` to `{ type: "workspace" }`. The dialog effect then opens the native dialog.

The mobile menu uses the Boolean `menu` state. Its button exposes `aria-expanded`, swaps a menu icon for a close icon, and adds `nav-open` to the navigation element. A `hashchange` listener closes the menu after navigation to a different fragment.

At `760px` and below, the open menu is an absolutely positioned vertical panel beneath the header. It has a light surface, border, radius, and shadow.

**Next steps:** if you want a sticky header, change its positioning deliberately and retest anchor offsets and section overlap. If a visitor clicks an already-current fragment while the mobile menu is open, there may be no `hashchange`; closing the menu directly when each link is activated is a useful refinement.

## 6. Hero section

### 6.1 Purpose and composition

The hero is the first main section. It communicates the brand in one sentence, shows the characters, and offers an actual interactive preview rather than only a static product image.

Its layers are:

1. A cream dotted background.
2. A transparent Three.js canvas with six characters.
3. The eyebrow label, headline, and supporting paragraph.
4. A tilted workspace window.
5. An orange circular party-mode button.
6. Bottom labels and a link to the possibilities section.

The hero is `position: relative`, at least `1000px` high on the large desktop layout, and clips overflowing decoration. The canvas and workspace are positioned relative to this section, not relative to the entire document.

### 6.2 The background

The dotted pattern is CSS:

```css
.hero {
  background-image: radial-gradient(#ccd0c5 0.7px, transparent 0.7px);
  background-size: 25px 25px;
}
```

A tiny radial gradient is repeated in a 25-pixel grid. No image download is needed. The dot pattern is intentionally low contrast so it gives texture without competing with the text.

### 6.3 The copy

The eyebrow reads `YOUR NEXT BIG THING STARTS HERE`. It uses the small monospace style and an orange dot.

The headline reads “A little weird.” followed by “A lot of possible.” in the italic serif. On large screens its size is `clamp(60px, 7.6vw, 110px)`: it grows with viewport width but stays between the specified minimum and maximum. Its line height is `1.04`.

The copy wrapper has `133px` top padding, center alignment, and `z-index: 2`. The supporting paragraph is `14px`, has line height `1.6`, and sits `24px` below the headline.

The copy wrapper has `pointer-events: none` because it is a display layer, not a control. That helps prevent noninteractive text from intercepting pointer input meant for other elements in the layered composition.

### 6.4 The floating 3D characters

`<Scene party={party} />` uses the default `hero` variant. The scene places six procedural characters at the following base positions:

| Character | X | Y | Z | Scale |
| --- | ---: | ---: | ---: | ---: |
| Pip | -5.15 | 2.30 | 0 | 0.99 |
| Loop | 5.08 | 2.06 | -0.8 | 0.93 |
| Bloom | -4.95 | -2.65 | 1 | 0.81 |
| Scout | 5.15 | -2.70 | -0.3 | 0.97 |
| Nova | -2.38 | 4.20 | -2 | 0.55 |
| Mochi | 2.48 | 4.60 | -1.5 | 0.56 |

These numbers are Three.js world units, not CSS pixels. The camera is at Z `16` with a `38°` field of view. The different sizes and depths create a layered composition around the central content.

The canvas wrapper fills the hero with desktop insets of `72px` at the top and `50px` at the bottom. It uses `pointer-events: none`. As a result, the hero's background characters have time-based floating and rotating motion, but do not receive direct pointer interaction through this wrapper. The cube, companion portrait, and footer use interactive scene containers instead.

Each hero character stores its original position and tilt. The animation loop adds small sine-wave offsets to those values. Using different phase offsets prevents all six objects moving in lockstep.

### 6.5 The tilted workspace

The workspace wrapper sits at desktop top `447px`, centered at `left: 50%`, with width `min(72%, 920px)`. Its transform combines centering with a one-degree counterclockwise rotation:

```css
transform: translateX(-50%) rotate(-1deg);
```

It has two subtle shadows and a `13px` radius. Hovering straightens it over `700ms`. This motion belongs to the HTML wrapper; the workspace itself does not need to be a 3D plane.

### 6.6 Party mode

The circular button begins at desktop top `444px`, left `6%`, with a `108px` diameter. It has an orange background and a playful label, “seriously, don't.”

Clicking toggles `party` and updates:

- The hero's background color to `#dfdfec`.
- The button's color and label.
- The speed and amplitude of the hero character motion.
- A fixed status message near the bottom of the viewport.

Normal character bobbing has amplitude `0.21`. Party mode uses `0.65`. The main speed multiplier changes from `1` to `3`. The toast remains visible while party mode is enabled; it does not automatically dismiss after a timer.

This effect changes existing state and animation parameters. It does not load a second model set or start a separate rendering engine.

### 6.7 Building the hero in the right order

First build the background, header, headline, and workspace as plain HTML/CSS. Confirm their spacing at the intended screen widths. Then put the transparent canvas behind them. Finally add the party control and tune animation sizes.

Starting with the text composition is important because the characters should fit the content. Making the characters first and forcing the text into the remaining space often leads to unreadable overlap.

## 7. The interactive workspace

### 7.1 Window frame and layout

The same `Workspace` component is used in the hero and expanded dialog. The `expanded` prop adds a CSS class for the larger presentation.

The workspace has a `33px` title bar with three colored decorative dots, a small caption, and another tiny status dot. These are ordinary CSS circles.

Below that, `.workspace-inner` is a flex row with a desktop minimum height of `397px`. The sidebar is `166px` wide and does not shrink. The content area grows to fill the remaining space and has `min-width: 0` so flex sizing does not force it wider than the available room.

The content area is itself relatively positioned. That makes it the positioning reference for the cube, note, input composer, and status message. Its dotted background uses a tighter `17px` grid than the hero.

### 7.2 Home tab

The Home tab contains the greeting, cube, sticky note, mood pill, and asterisk decoration.

The cube container occupies `55%` of the content area's width, begins at `left: 30%` and `top: 40px`, and is `275px` high on desktop. It mounts `<Scene variant="cube" />`.

The cube is a rounded box with six pastel material slots, small dark eyes, and a torus smile. It rotates slowly by itself. Horizontal dragging adds to its Y rotation; pointer position changes its X tilt. The pointer is captured while dragging so movement can continue even if the pointer leaves the immediate element bounds.

The yellow sticky note is `144 × 143px`, at left `6%`, top `140px`, rotated by `-5deg`. It is HTML text inside a styled block. Its shadow and rotation create the paper impression. It is not draggable in the current site.

The mood pill is a small bordered status element reading “open to anything.” It is decorative. The “The someday project” entry in the sidebar is also display text rather than a separate saved-project link.

### 7.3 Your ideas tab

`App` initially supplies three ideas. Each is an object with `id` and `text`:

```js
{ id: 1, text: "A tiny studio for very big dreams." }
```

When an idea is added, `setIdeas` uses a functional update to append a new object. The new ID is one larger than the last ID. This is sufficient for a local list; a database-backed application should use IDs provided by its persistence layer.

The ideas render as a wrapping flex layout with vertical overflow. Desktop notes are `142px` wide with a minimum height of `127px`. `nth-child` rules alternate colors and slight rotations. `overflow-wrap: anywhere` prevents a long word from breaking the note layout.

The form uses controlled input state and a `160`-character maximum. On submission it:

1. Prevents the browser's normal form navigation.
2. Trims leading and trailing whitespace.
3. Shows guidance if the result is empty.
4. Calls the shared `addIdea` function for valid text.
5. Clears the input.
6. Switches that workspace instance to Your ideas.
7. Shows a short success message.

The sidebar count is derived from `ideas.length`, formatted with a leading zero. The feedback container has `aria-live="polite"`.

### 7.4 Your crew tab

This tab displays six lightweight HTML buttons from the same `CREW` data used by the main companion section. Each has a colored face thumbnail, name, and role.

Clicking a person sets the workspace feedback to their name and quote. It does not open a chat, run AI, assign a team member, or change the selected character in the main companion section. Those are separate pieces of state.

Using CSS thumbnails here avoids creating six additional WebGL canvases inside a small UI grid.

### 7.5 Inspiration tab

This tab contains an asterisk, a headline, three lines of suggestions, and a button. Clicking the button picks one of three predefined text prompts using `Math.random()` and shows it in the feedback area.

The suggestions are authored content in the source. They are not generated by an external AI service.

### 7.6 Shared state versus local state

The embedded workspace and expanded workspace share the `ideas` list because the parent owns it. However, each `Workspace` instance has its own `tab`, `input`, and `hint` state.

Consequently, an idea submitted in either workspace appears in the other one's list, but opening the expanded workspace begins at Home. A partially typed input in the embedded workspace is not automatically copied into the dialog.

“A new beginning” opens the local ideas view and gives guidance; it does not create a persistent project. “A little help” sets a hint describing the available interactions.

## 8. The possibilities section

### 8.1 Purpose

This section explains the product idea after the visitor has seen the visual experience. Its headline is “Less overthinking. More making.” It contains four benefits:

1. Your space. Your kind of chaos.
2. Good company. Great possibilities.
3. From a little ‘what if’ to something real.
4. Follow the idea. See where it goes.

The section is text-focused. It does not require a canvas or model.

### 8.2 Layout

The shared `.section-space` class gives desktop padding of `105px 6% 115px`. A thin top line, small section label, and asterisk introduce the section.

The centered headline grows between `50px` and `96px` using `clamp()`. Its two-line structure mirrors the hero. It has substantial spacing above and below so the next grid is visually distinct.

The benefits use `grid-template-columns: repeat(4, 1fr)` with a `48px` gap. Each article has a top rule, an italic number, an asterisk, a two-line title, and a short paragraph. The paragraph width is capped at `225px` for manageable line lengths.

### 8.3 Scroll reveal

Elements marked `.reveal` begin transparent and translated down by `28px`. An `IntersectionObserver` watches them with threshold `0.12`. When an element intersects enough of the viewport, the observer adds `is-visible`.

The CSS then transitions opacity over `800ms` and transform over `950ms`. The four benefit articles receive increasing transition delays: `0`, `100`, `200`, and `300ms`.

The class stays once revealed, so the element does not hide again when scrolled away. The observer is disconnected when the application unmounts.

This is a reveal effect, not a scroll-scrubbed timeline. Scrolling determines when it starts; it does not directly determine the animation's progress.

### 8.4 How to build it

Build the section in normal document flow. Make a data array for the benefits and map it to semantic `<article>` elements. Keep the headings as text so they remain selectable and accessible. Add the observer only after the static layout is readable.

At mobile widths the grid becomes two columns and the typography becomes smaller. If you substantially increase the amount of copy, revisit the spacing rather than assuming the original column heights still work.

## 9. The moving project gallery

### 9.1 Purpose and layout

The gallery turns the abstract product idea into visual examples. It begins with “A thought. Then a thing.” and displays three project types: a character, a poster, and a small universe.

The section background is `#e8e9df`, with `92px` desktop top padding. The heading and introduction sit above a full-width clipped gallery track.

Each desktop card is `clamp(285px, 30vw, 430px)` wide. The artwork is `370px` high, followed by a category label and project title.

### 9.2 Seamless horizontal motion

The implementation renders two groups containing the same three projects. The track is a flex row with width `max-content`.

```css
.work-marquee {
  width: max-content;
  display: flex;
  animation: work-drift 48s linear infinite;
}

@keyframes work-drift {
  to { transform: translateX(-50%); }
}
```

The second group follows the first. Moving by half the combined width takes the track through one group's distance; the animation can restart while the next matching group is in position.

The two groups must keep equal layout widths, including their gap and trailing padding. Different dimensions between the original and duplicate would create a jump at the loop boundary.

The track pauses on hover and `focus-within`, which gives visitors time to inspect and activate a card. Reduced-motion mode stops it altogether.

### 9.3 Why the duplicate uses lighter artwork

The duplicate group is `aria-hidden` and its artworks are not buttons. This avoids repeating the same keyboard controls and screen-reader content.

The original character card mounts a live Bloom scene. Its duplicate uses a CSS flower made of five overlapping circles. This reduces the WebGL work, although the two artworks are deliberately not pixel-identical: the live character has full geometry and lighting while the duplicate is a simpler illustration.

If your goal is a visually identical loop, use the same static rendered artwork in both groups, or engineer a matching lightweight representation. Retain only one accessible set of controls.

### 9.4 Character artwork

The character tile has a lavender background and alternating large rounded corners: `80px 0 80px 0`. It uses `<Scene variant="art" selected={2} />`, selecting Bloom. A circular green sticker sits above the canvas as ordinary HTML.

The art scene has one character, rather than the six-object hero layout. The same geometry factory supplies it, which keeps the character consistent across sections.

### 9.5 Poster artwork

The poster is CSS and text on an orange surface. Its main text is “make” with “believe.” in the italic serif. A large pale asterisk sits partly outside the card and turns over `24s`.

The effect comes from typography, clipping, color, and a simple rotation animation. Rendering this as a texture in WebGL would add complexity without improving the current interaction.

### 9.6 Orbit artwork

The orbit card has a dark green background and large alternating corners. It contains three outlined circles. Two are rotated and compressed horizontally with `scaleX(0.6)` to suggest elliptical orbital paths.

The planets are CSS circles with inset shadows and a five-second vertical floating animation. One has a negative animation delay so their movement does not begin in sync. They are not simulated orbital bodies and do not respond to dragging in the current site.

### 9.7 Opening a project

The original cards are buttons with accessible names such as “Explore An idea with a personality.” Clicking a card sets `{ type: "work", work }` as modal state.

On hover or keyboard focus, a small circular arrow fades in and rotates into place. The project dialog shows a larger artwork, description, and a button to create a local idea based on it.

**Next steps:** for user-controlled browsing, add previous/next controls or a scrollable gallery. The current continuously moving track does not implement drag-to-scroll controls or a visible pause toggle.

## 10. The companion section

### 10.1 Purpose

The companion section introduces the six personalities and gives visitors a more focused opportunity to inspect the 3D characters. The heading is “Little characters. Big energy.”

Desktop layout is a two-column grid: explanatory text and selectors on the left, a character card on the right. The gap is `8%`, and the section has extra vertical breathing room.

### 10.2 Companion data

| Index | Name | Role | Color | Main body geometry |
| --- | --- | --- | --- | --- |
| 0 | Pip | The possibility finder | `#fa603d` | Rounded box |
| 1 | Loop | The connection maker | `#a2c873` | Torus |
| 2 | Bloom | The wild idea person | `#bdafe6` | Scaled sphere with five sphere petals |
| 3 | Scout | The make-it-happen one | `#f6c348` | Tilted capsule |
| 4 | Nova | The detail spotter | `#7db9d2` | Beveled extruded star |
| 5 | Mochi | The gentle nudge | `#e79ab5` | Flattened rounded sphere |

`CREW` contains the name, role title, descriptive copy, “good for” text, personality text, and quote. The Three.js color list and geometry factory follow the same ordering.

If you reorder the data, keep the geometry ordering and colors synchronized. A more extensible version could store a named geometry type with each companion rather than relying on the numerical index.

### 10.3 Selectors

The selectors are in a `<fieldset>` with a visually hidden legend. They are HTML buttons with two tiny CSS eyes, not miniature canvases.

Desktop selectors form a three-column grid. A selected button exposes `aria-pressed`, changes its text color, and adds a double ring around its colored face. Hover raises and rotates the thumbnail.

Clicking calls `setSelected(index)`. React updates the card's text and passes the same selection into `<Scene variant="crew" selected={selected} />`.

### 10.4 Character card

The card has a pale surface, thin border, `465px` maximum width, and an offset pale shadow. Its top row shows the companion number. A `285px` portrait area contains the canvas and a quote. Below are the name, role, description, and two metadata columns.

`--crew-color` is set from the selected person's color and used by the decorative asterisk next to the name. The information area uses `aria-live="polite"` to announce changed companion content.

The base card CSS includes `rotate(2deg)`, but the more specific reveal-visible transform takes precedence after its reveal. If you want to preserve the tilt at all times, use a nested wrapper for the reveal or combine the reveal and rotation transforms deliberately.

### 10.5 Changing the 3D model

The scene keeps a `selectedIndex`. On an animation frame, if the incoming selection differs, it removes the old object, disposes its geometry and materials, creates the new character, and adds that character to the same Three.js scene.

The WebGL renderer and camera are reused. This is preferable to replacing the complete canvas and environment for every selection.

The portrait gently floats and rotates. Its rotation also follows pointer position. Blinking is implemented by briefly reducing the eye group's Y scale and easing it back toward full size. The hero characters do not use this blinking branch; it belongs to the single-character crew/art variants.

### 10.6 Previous and next buttons

The next index is `(selected + 1) % 6`. The previous index is `(selected + 5) % 6`. The modulo operation wraps the ends, so moving forward from Mochi returns to Pip.

If you change the number of companions, replace the hard-coded sixes with the data length throughout the selector, numbering, and geometry logic.

## 11. The interactive footer

### 11.1 Purpose and layers

The footer is a final large visual moment. It repeats the invitation to create something, offers another workspace button, and lets the visitor poke or drag a large character.

The section uses peach `#f0b99d`, a desktop minimum height of `850px`, relative positioning, and clipped overflow. Its layers are the top label, central headline and CTA, large canvas, circular phrase button, and bottom information bar.

The headline reads “You came with a thought. Leave with a little possibility.” The final phrase comes from `footerWord` state.

### 11.2 Large character

`<Scene variant="footer" />` creates the Mochi sphere geometry in brand orange rather than its usual pink. It scales the full character to `2.25`, shifts it downward, and uses a camera at Z `6`.

The desktop canvas container is `min(880px, 84vw)` wide and `620px` high, centered horizontally and positioned slightly below the section's bottom. Clipping creates the impression of a large creature rising into the page.

The copy wrapper uses `pointer-events: none`; its CTA specifically restores `pointer-events: auto`. This lets visitors interact with the character underneath empty parts of the copy layer while keeping the button usable.

### 11.3 How deformation works

The body's geometry is cloned, and its original vertex positions are copied into `footerBase`. Each animation frame starts from those original positions. This is essential: deforming last frame's already-deformed positions would allow the shape to drift or stretch indefinitely.

Pointer coordinates are normalized relative to the canvas. A smoothed pointer is used to find a region of influence over the body. For a vertex at `(x, y)`:

```js
const influence = Math.exp(
  -((x - pointer.x * 0.8) ** 2 + (y - pointer.y * 0.8) ** 2) * 3,
);
```

This Gaussian-like falloff gives vertices near the pointer a stronger effect and distant vertices a weaker effect. The code adjusts X, Y, and Z, with larger multipliers while dragging. It also adds a small time-based sine wobble.

After changing the vertices, it marks the position attribute for update and recalculates vertex normals so the lighting follows the modified surface.

This is a procedural visual deformation. It is not a soft-body physics simulation: there is no spring solver, collision engine, raycast hit test, or physically modeled force. The influence point is mapped from the canvas pointer position, which is enough for the playful appearance built here.

### 11.4 Phrase button and bottom bar

The circular yellow-green button chooses one of four predefined ending phrases. Random selection can choose the same phrase again, so not every click necessarily changes the visible text.

The main CTA opens the expanded workspace. The bottom bar contains the logo, current year, About button, and Back to top anchor. The year is computed when React renders; it is not an automatically ticking clock.

**Next steps:** GPU vertex displacement can make this effect cheaper if the mesh becomes much denser. A physics engine would only be necessary if you want actual bouncing, collisions, or material simulation.

## 12. The three dialog views

### 12.1 Shared dialog controller

The site uses a single native `<dialog>` element with three conditional content branches. Modal state is either `null`, `{ type: "workspace" }`, `{ type: "work", work }`, or `{ type: "about" }`.

An effect calls `showModal()` when a modal is selected and `close()` when the state becomes null. It also toggles `body.modal-open` to disable background scrolling. Both the close button and the dialog's cancel/close events clear the state.

Calling `showModal()` places the dialog in the browser's top layer and makes the rest of the document inert while it is open. Escape can close it through the native cancel behavior. The current code does not include an explicit click-on-backdrop dismissal handler.

The backdrop is a semitransparent green-black with `backdrop-filter: blur(8px)`. The dialog has a light surface, border, rounded corners, constrained viewport height, and a shadow.

### 12.2 Expanded workspace view

This dialog is at most `1120px` wide, while keeping `36px` total clearance from the viewport sides. It uses the same workspace component with `expanded` enabled.

Desktop expanded content is at least `510px` high. The sidebar widens to `200px`, the cube area grows, and note/input/thumbnail sizes are adjusted. A short note explains that ideas are kept locally for the visit.

It is a large modal workspace, not a separate page or an operating-system full-screen mode.

### 12.3 Project detail view

The project dialog shows `WorkArt`, a category label, a title, a description, and “Make it a starting point.” Its artwork area is `315px` high.

Clicking the action adds `My take on: [project title]` to the shared idea list and changes modal state to the workspace view. The newly mounted workspace starts on Home. Click Your ideas there to see the new note; the current implementation does not automatically select that tab for this particular transition.

### 12.4 About view

The About view uses an asterisk, a heading, and two paragraphs explaining the original concept and local demo behavior. Its action changes the current dialog content to the expanded workspace.

**Next steps:** associate the dialog with a visible heading using `aria-labelledby` or give it a context-specific accessible label. Verify focus return and focus placement after switching dialog content. These refinements improve the production experience without changing the visual layout.

## 13. The shared 3D engine

### 13.1 Scene variants

| Variant | Contents | Camera Z | Typical placement |
| --- | --- | ---: | --- |
| `hero` | Six characters | 16 | Hero background |
| `cube` | Rounded pastel cube | 6.7 | Workspace Home |
| `crew` | Selected companion | 6.7 | Companion portrait |
| `art` | Selected companion | 6.7 | Gallery or project detail |
| `footer` | Large orange sphere character | 6 | Footer |

Every mounted `Scene` has its own renderer and canvas. The variants reuse geometry-building functions; they do not share a single global renderer.

### 13.2 React and imperative rendering

The scene host is a DOM element referenced by `useRef`. A `useEffect` creates the Three.js resources and appends the renderer's canvas to that host.

The effect depends on `variant`, so changing the kind of scene rebuilds it. `selected` and `party` are copied into a mutable ref each React render. The animation loop reads that ref to see current values without needing to create a new renderer.

Positions and rotations are changed directly on Three.js objects. There is no React `setState` call every animation frame. React handles interface state; Three.js handles continuous rendering.

### 13.3 Renderer and camera

The renderer uses a transparent background, antialiasing, and a low-power preference. The preference is a hint to the browser, not a guarantee of reduced power usage.

Pixel ratio is capped at `1.6`. A very high-density screen therefore does not force the canvas to render at the full device pixel ratio. This limits fill-rate costs while retaining useful sharpness.

Color output uses `SRGBColorSpace`. Tone mapping uses `ACESFilmicToneMapping` with exposure `1.25`. These settings contribute to the soft, polished appearance, particularly around bright reflections.

The perspective camera uses FOV `38`, near plane `0.1`, and far plane `100`. After resizing, `camera.aspect` is updated and `updateProjectionMatrix()` is called. Without this step, models could stretch as the canvas changes shape.

### 13.4 Materials and lighting

The material helper creates `MeshPhysicalMaterial` with:

```js
{
  roughness: 0.24,
  metalness: 0.04,
  clearcoat: 1,
  clearcoatRoughness: 0.13,
}
```

The low roughness and clearcoat create glossy surfaces. The low metalness keeps the material closer to coated plastic than metal. Dark face/limb material and cream eye material use slightly different roughness values.

`RoomEnvironment` generates a local environment scene. `PMREMGenerator` converts it into an environment texture suitable for rough material reflections. The temporary room and generator are disposed once that texture is created.

Additional light sources are a warm directional light with intensity `4.2`, a cream ambient light with intensity `1.1`, and a cool directional fill with intensity `2.5`. The warm/cool combination gives surfaces readable variation.

There are no imported HDR images and no shadow-map setup in the current scene. Some apparent grounding is supplied by CSS backgrounds around the portrait. If adding actual cast shadows, you will need receiver geometry, shadow settings, and additional performance testing.

### 13.5 Building the characters

`part()` wraps a geometry and material in a mesh and applies a position and scale. `character()` creates a `THREE.Group`, adds the body and decorative parts, and stores references to its eyes and body in `userData`.

Pip uses `RoundedBoxGeometry(1.7, 1.75, 1.35, 5, 0.42)`. The final values control subdivision and rounding.

Loop uses `TorusGeometry(0.78, 0.4, 24, 64)`, producing a thick ring.

Bloom has a central sphere scaled to `(0.94, 1.13, 0.76)`, with five smaller spheres placed around it. Petal coordinates use sine and cosine to distribute them around a circle.

Scout uses a capsule with radius `0.62` and straight length `0.8`, tilted slightly around Z.

Nova begins as a `THREE.Shape` with alternating radii `1.18` and `0.62`. Ten perimeter steps form five outer points and five inner points. `ExtrudeGeometry` gives the star depth `0.6` and rounded bevels of size/thickness `0.16`.

Mochi uses a sphere with `48 × 36` segments, scaled to `(1.07, 0.94, 0.79)` for its wider, flattened shape.

Eyes are layered spheres: a cream outer eye, dark pupil, and tiny highlight. Capsules create feet and arms. A half-torus, rotated around Z, creates the smile. Geometry is placed at a face depth appropriate to the body; Loop uses a shallower depth than the other characters.

### 13.6 The cube

The cube uses `RoundedBoxGeometry(2.1, 2.1, 2.1, 6, 0.23)` and an array of six pastel materials. Small face meshes sit slightly in front of the front surface to avoid visual overlap with the cube surface.

Its Y rotation combines an initial angle, slow time rotation, and accumulated manual drag rotation. Its X tilt follows the smoothed pointer Y value. Its vertical position uses a small sine-wave bob.

### 13.7 Pointer normalization and smoothing

Pointer movement is measured against the scene container's rectangle:

```js
target.set(
  ((event.clientX - rect.left) / rect.width - 0.5) * 2,
  -((event.clientY - rect.top) / rect.height - 0.5) * 2,
);
```

This maps the approximate center to `(0, 0)` and the edges to approximately `-1` or `1`. The Y sign is reversed to align screen input with the scene's coordinate convention.

Each frame uses `pointer.lerp(target, 0.065)`. Instead of jumping instantly to the new pointer coordinate, the pointer advances partway toward it, giving a softer response. This interpolation is frame-based; for consistent smoothing across substantially different frame rates, a time-delta-based factor would be a useful extension.

### 13.8 Resize and offscreen rendering

`ResizeObserver` measures the host element rather than relying only on window resize events. This handles changes caused by responsive layout, dialog size, or other container changes.

For the hero, horizontal spread is clamped between `0.58` and `1` using the canvas width divided by `1150`. The original base X values are scaled by this factor.

`IntersectionObserver` watches the scene with a `100px` root margin. When a scene is outside that range, its animation loop stops scheduling further frames. When it returns, rendering resumes. The elapsed time continues from the original start time, so reappearing objects resume at the current time-based phase rather than preserving a paused phase.

### 13.9 Cleanup and failure handling

When a scene unmounts, it cancels the animation frame, disconnects observers, removes pointer listeners, disposes geometries/materials/environment/renderer, and removes the canvas.

`disposeObject()` collects unique geometry and material objects in sets, avoiding repeated disposal when several meshes share a material.

If creating the WebGL renderer fails, the component shows a CSS character illustration. This preserves a decorative visual instead of leaving a blank area. The fallback handles renderer construction failure; full WebGL context-loss recovery after rendering has begun is not implemented.

## 14. Animation and interaction map

| Effect | Implementation | Current behavior |
| --- | --- | --- |
| Navigation underline | CSS pseudo-element width | Appears on hover over 200ms |
| Primary button lift | CSS transform/background transition | Raises 2px and turns orange |
| Hero character floating | Three.js sine offsets | Different phases for six objects |
| Party animation | Shared Boolean and scene ref | Faster, larger hero motion |
| Tilted workspace | CSS transform | Straightens on hover over 700ms |
| Cube spin | Three.js time plus pointer drag | Slow automatic rotation plus manual turning |
| Section reveal | IntersectionObserver plus CSS | One-time fade and upward motion |
| Work gallery motion | CSS keyframes | 48-second repeating horizontal track |
| Poster asterisk | CSS rotate animation | One turn over 24 seconds |
| Duplicate flower | CSS rotate animation | One turn over 20 seconds |
| Planets | CSS translate animation | Gentle vertical float over five seconds |
| Companion motion/blink | Three.js rotation and eye scale | Single-character scene movement |
| Footer deformation | Per-vertex CPU update | Pointer falloff, drag amplification, wobble |
| Phrase change | React state and random selection | Picks one of four authored phrases |
| Cursor | Pointer events and fixed CSS element | Small difference-blended square |
| Dialog | Native browser dialog plus CSS | Top-layer view with blurred backdrop |

The custom cursor is visually hidden from assistive technology and has `pointer-events: none`. Its position is updated using a `translate3d()` transform. Over buttons, links, inputs, cube areas, or footer areas, a class changes its size from `11px` to `19px`. A `mix-blend-mode: difference` rule changes its apparent color against the surface underneath.

It is displayed only for `pointer: fine`; normal touch interfaces do not display it. The current page should also be reviewed on keyboard and hybrid input devices before production use.

## 15. Responsive layout and accessibility

### 15.1 Breakpoints

| Range | Main changes |
| --- | --- |
| Above 1050px | Full desktop navigation, large hero, four benefit columns, two-column companions |
| 1050px and below | Tighter navigation/feature spacing, hero window at top 415px and width 78% |
| 760px and below | Mobile menu, smaller hero/workspace, two benefit columns, stacked companion layout |
| 400px and below | Smaller logo/sidebar/headings, hero window at top 370px and width 94% |
| Coarse pointer | Larger selected touch controls and 16px input text |
| Reduced motion | Stopped marquee/CSS motion, immediate reveals, disabled smooth scrolling |

### 15.2 Hero on smaller screens

At `760px` and below, the hero is at least `870px` high. The copy begins at `119px`. Its headline uses `clamp(48px, 9.6vw, 74px)`. The workspace begins at `390px` with width `89%`.

The hero canvas is inset `345px -120px 60px`. Moving its top edge lower keeps the floating decorations away from the headline and description. The negative horizontal insets let some art extend beyond the narrow content width while the hero clips its overflow.

At `400px` and below, the minimum hero height becomes `825px`, the workspace begins at `370px`, and the sidebar width is `98px`.

These are deliberate composition values rather than a universal template. If the headline becomes three lines or your brand copy is longer, adjust workspace placement and section height together. Check the actual content rather than shrinking everything indiscriminately.

### 15.3 The other sections

The benefit grid becomes two columns. Gallery cards use a `285px` width and `315px` artwork height. The companion section becomes a single column, with six smaller selectors in one row and the portrait card below.

The footer canvas is intentionally `680px` wide on smaller layouts and clipped by the section. Its large character remains a dramatic cropped object. The bottom bar wraps to accommodate the logo, links, and year.

The expanded workspace gets narrower sidebar and content dimensions. Smaller screens also simplify secondary content by hiding some tiny decorative labels and details.

### 15.4 Accessibility already present

The page uses one main H1, section H2s, and card H3s. Navigation uses anchors, controls use buttons, and idea entry uses a real form. Icon-only controls have accessible labels.

Orange focus outlines are provided for keyboard users. Companion selectors expose pressed state; the menu exposes expanded state. Feedback and companion information use polite live regions. The duplicate gallery is hidden from the accessibility tree.

Canvas content is decorative from the document's perspective, while the meaningful names, descriptions, and actions remain HTML. A CSS fallback has an image role and description.

### 15.5 Reduced motion: exact current behavior

CSS reduces transition/animation durations, stops the gallery, reveals content immediately, disables smooth scrolling, and removes workspace rotation.

The Three.js loop uses `t = 0` when reduced motion is requested. That stops time-driven bobbing and rotations. Footer wobble is explicitly set to zero, and the portrait blink target remains fully open. Pointer-driven movement and dragging can still work.

Reduced motion does not completely stop visible scenes from rendering each frame in the current code. A stronger performance optimization would render only when a pointer, size, or selection changes while reduced motion is enabled.

### 15.6 Further accessibility review

Before public release, verify text contrast, especially small muted text. Add a visible pause option if keeping automatically moving gallery content. Associate the dialog with an accessible title. Consider a skip link, alternatives for pointer-only 3D interaction, and larger hit targets for every small control.

The current coarse-pointer rules enlarge several controls, but they do not establish a uniform 44px minimum for every button. Do not treat the presence of media queries as a complete accessibility audit.

## 16. A practical build sequence

### Stage 1: Get a minimal page running

Create the HTML entry, React entry file, application component, and Vite configuration. Start the server and verify that a heading renders. This proves your toolchain before geometry or animation complicates debugging.

### Stage 2: Establish the design foundation

Load the fonts, define the paper/ink/accent palette, reset basic styles, and create shared heading, label, button, and logo styles. Check these in both large and narrow viewports.

### Stage 3: Build the complete static page

Create the header, hero copy, workspace frame, benefits, gallery cards, companion card, and footer in document order. Use placeholder shapes where needed. At this stage every section should look coherent without JavaScript animation.

### Stage 4: Implement React state and basic interactions

Make the workspace tabs work. Add the idea form and shared list. Add companion selection, previous/next controls, mobile menu, modal state, and footer phrase state. Test these while the visuals are still simple.

### Stage 5: Build one lit 3D character

Set up a transparent renderer and perspective camera. Add a rounded box body, face, arms, and feet. Apply the physical material, local room environment, and warm/cool lighting. Tune this one character before multiplying it across the site.

### Stage 6: Add the other geometry types

Implement the torus, petaled sphere, capsule, extruded star, and flattened sphere. Confirm the face depth and proportions for each one. Reuse materials and helpers within each character where appropriate.

### Stage 7: Integrate the scene variants

Start with the workspace cube and one portrait. Add the six-character hero arrangement after the hero copy layout is stable. Reuse the portrait variant for the gallery. Add the large footer variant last.

### Stage 8: Add motion incrementally

Add small bobbing offsets first, then rotation, pointer smoothing, cube dragging, blinking, and footer deformation. Keep each effect independently understandable. Add CSS reveal and gallery animation after the sections remain readable at rest.

### Stage 9: Add lifecycle and device safeguards

Implement cleanup, resizing, offscreen pause, pixel-ratio limits, and a renderer failure fallback. Apply reduced-motion and coarse-pointer rules. Check that opening/closing the dialog does not accumulate canvases or event listeners.

### Stage 10: Verify and deploy

Run the site checks and production build. Test the generated output through a preview server. Confirm that fonts and chunks load at the eventual deployment path. Publish the generated output only after these checks.

## 17. Testing and troubleshooting

### 17.1 Source and build checks

From the existing repository root:

```powershell
.\node_modules\.bin\biome.cmd check morrow-site --diagnostic-level=error
.\node_modules\.bin\vite.cmd build --config morrow-site/vite.config.mjs
```

The production build and scoped checks passed for the implemented site. Live browser checks confirmed 3D rendering, idea submission, companion selection, and opening/closing the expanded workspace dialog.

Root TypeScript, i18n, and token-contract checks passed. The wider repository check has existing CRLF formatting issues, design-system audit/coverage failures, and manifest/CLI scripts that attempt to run a Unix-style formatter executable on Windows. Those checks cover the larger Berd repository, not only this standalone page.

A 390px responsive override exposed the mobile navigation structure, but the browser inspection tool could not capture an image at that exact override. Narrower default-browser layouts were visually inspected. Recheck real 320–430px devices before describing all phone layouts as visually verified.

### 17.2 Manual test list

- Open the page and confirm there is no blank canvas or error overlay.
- Confirm the correct fonts load and the headline wraps as expected.
- Hover the workspace and see it straighten.
- Turn party mode on and off.
- Drag the cube horizontally and observe rotation.
- Submit a nonempty idea and verify the count and note.
- Submit whitespace and verify guidance rather than an empty note.
- Switch workspace tabs and request an inspiration prompt.
- Open the expanded workspace and confirm the shared idea is present.
- Close the dialog with its button and Escape; check focus and background scrolling.
- Open each project and use “Make it a starting point.”
- Select all six companions and use the wraparound arrow controls.
- Move over and drag the footer character; check that it returns toward its base shape.
- Change the footer phrase and use Back to top.
- Test the mobile menu, including a repeated click on the current fragment.
- Navigate controls by keyboard and inspect focus outlines.
- Enable reduced motion and confirm automatic motion is suppressed.
- Inspect the console, network requests, and resource usage after repeated dialog cycles.

### 17.3 Common problems

| Problem | What to inspect |
| --- | --- |
| Wrong app opens on port 5173 | Use Morrow's dedicated Vite configuration and port 5180 |
| Port is already occupied | Stop the previous server or explicitly choose another port |
| Canvas is invisible | Check WebGL availability, host dimensions, camera position, and console errors |
| Models stretch after resizing | Update camera aspect/projection and renderer size together |
| Fonts fail after copying the site | Copy the font files and correct the CSS URLs |
| Objects look too washed out | Tune exposure, light intensity, roughness, and environment together |
| Objects look flat or dull | Check environment texture and physical material settings |
| Characters cover text | Adjust canvas/container composition and model positions at that breakpoint |
| Gallery jumps when looping | Ensure duplicate group dimensions, gaps, and trailing padding match |
| Footer slowly distorts permanently | Recalculate from saved original vertices, not prior frame positions |
| React warns about duplicate roots | Keep root mounting separate from refreshed component modules |
| Memory use grows after closing dialogs | Inspect disposal, observers, pointer listeners, and renderer removal |
| Production assets fail under a subdirectory | Configure Vite's base path for the actual deployment location |

### 17.4 Current performance profile

The measured production JavaScript bundle was approximately `782KB` before gzip and `212KB` after gzip. CSS was approximately `29KB`. The three TTF font assets totaled approximately `1.46MB` before any transport compression.

Vite emitted its large-chunk warning because the JavaScript chunk exceeds `500KB`. A successful build is not the same as a completed performance audit.

The page can have several canvases mounted together: hero, embedded cube, gallery character, companion portrait, footer, and an additional scene when a dialog is open. Offscreen visibility pauses rendering, but resources still exist while the corresponding component is mounted.

For a production optimization pass, prioritize lazy-loading noninitial scenes, narrower font subsets or licensed WOFF2 conversions, deferred scene creation, sensible GPU-quality settings, and a measured budget for vertex-normal recomputation. Profile on actual midrange phones before increasing geometry detail.

## 18. Deployment, customization, and production extensions

### 18.1 Deploy the current website

Build the site and publish the **contents of `morrow-site/dist`** to a static host. React, CSS, fonts, and Three.js are bundled into generated assets. The current visual demo does not require a server-side application.

If your build service checks out the whole Berd repository, install dependencies from its root, run the dedicated Morrow build command, and set the output directory to `morrow-site/dist`. If you extracted the site into its own project, use that project's normal build command and output directory.

For a root-domain deployment, the current default base path is suitable. For a path such as `/morrow/`, set `base: "/morrow/"` in the Vite configuration and rebuild. Verify direct visits and asset requests using the final URL.

Hash navigation stays inside the document, so the current site does not require route rewrites for separate React routes. If you later introduce true routes, revisit hosting fallback behavior.

### 18.2 Change the brand

Start with the logo word, title and description metadata, favicon, hero statement, section copy, footer year/name, and About description. Then update the CSS palette and character colors.

Changing only the wordmark will leave Morrow-specific copy elsewhere. Search `app.jsx`, `index.html`, and documentation for the current brand before publishing a renamed site.

For new character designs, edit `character()` while keeping a consistent scale, front-facing orientation, and facial treatment. Update the selector thumbnails and associated data as needed.

### 18.3 Turn the demo into a product

Persistent ideas could begin with `localStorage` for a single-browser experience. Save and restore the list, validate stored data, and provide a way to reset it. A signed-in cross-device product would need a backend, authentication, authorization, and database records.

Real project creation needs a project data model and actual workspace navigation. Companion AI needs a server endpoint, a chosen model/provider, conversation state, request/error handling, and appropriate cost controls. API credentials belong on the server, not inside the client bundle.

AI-generated artwork would need a generation workflow, pending/success/failure states, asset storage, and clear handling of visitor prompts. The current art examples and inspiration prompts are authored local content.

Independent pages such as `/about`, `/projects`, or `/workspace` would require a routing strategy or additional HTML entries. That would be an extension of the current page rather than a requirement for recreating its existing scrolling experience.

### 18.4 What defines the finished result

To recreate the present site faithfully, preserve the relationship between quiet typography, pastel surfaces, thin rules, character geometry, glossy environment lighting, modest default movement, and larger interactions reserved for visitor actions.

Use HTML for readable content and controls, Three.js for the actual spatial objects, CSS for inexpensive decorative motion, and React state for the transitions between interface states. The experience comes from these parts working together across the full page.
