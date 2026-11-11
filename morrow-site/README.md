# Morrow

An original, interactive 3D landing page inspired by the playful presentation of berd.xyz.

For the complete section-by-section implementation documentation, see [BUILD_GUIDE.md](BUILD_GUIDE.md).

From the repository root:

```powershell
.\node_modules\.bin\vite.cmd --config morrow-site/vite.config.mjs
```

Open http://127.0.0.1:5180. To produce the static site:

```powershell
.\node_modules\.bin\vite.cmd build --config morrow-site/vite.config.mjs
```

The output is `morrow-site/dist`. The page is independent of Berd's desktop app. All 3D characters are original procedural Three.js geometry; lighting is generated locally. Fonts are the repository's self-hosted, OFL-licensed Inter, Fraunces, and Geist Mono.

The playground stores ideas in memory for the current page session. It does not call an AI provider or transmit prompts. Interactive features include workspace tabs, adding ideas, a full-screen workspace, project previews, a six-character selector, a party-mode toggle, and pointer deformation of the footer character. Reduced-motion settings and a WebGL fallback are supported.

Validation: the production build and scoped Biome checks pass. Live browser checks confirmed 3D rendering, idea submission, companion selection, and opening/closing the workspace dialog. Root TypeScript, i18n, and token-contract checks pass. The wider repository check remains affected by existing CRLF formatting errors, design-system audit/coverage failures, and manifest/CLI scripts that invoke a Unix formatter executable on Windows. Vite reports a bundle-size warning for the Three.js bundle.
