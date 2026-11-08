# GAMEZAAR Game Graphics Standard

Status: FINAL

All 20 V1.0 game templates must use a consistent **2D HD Pixel Art** visual style.

## Visual direction
- Modern, colorful, detailed pixel-art sprites and environments.
- Crisp pixel edges; avoid blurry scaling and unnecessary smoothing.
- Consistent sprite proportions, palette quality, UI treatment, and animation style across all categories.
- Use original or properly licensed artwork and audio.
- Keep gameplay readable on small Android screens.

## Performance and size budget
- Target each individual game's complete web package at **1–3 MB maximum**; aim closer to 1 MB where practical.
- Optimize and compress sprite sheets, backgrounds, fonts, and audio.
- Prefer sprite sheets and reusable assets; avoid duplicate assets.
- Avoid heavy 3D engines and unnecessary third-party libraries.
- Lazy-load nonessential assets and use efficient Canvas rendering.
- Measure the actual exported package size; do not assume a game meets the budget without checking.

## Implementation
- 2D games built with HTML, CSS, and JavaScript using Canvas where appropriate.
- Responsive controls for touch screens and desktop input where useful.
- Keep each game's code and assets modular so future multiplayer support can be added without rebuilding the whole platform.

## V1.0 scope
20 single-player templates across Racing, Puzzle, Arcade, Sports, and Casual & Strategy. Multiplayer is not part of V1.0.
