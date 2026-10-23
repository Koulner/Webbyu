# Safran Atelier camera sequence

Imported on 2026-10-23 from the user's supplied `royal-spices` reference project:
`public/hero/5/d-960/0000.webp` through `0400.webp`, every second frame.

201 original WebP files, 2,936,698 bytes in total. Files are copied unchanged;
the reference's d-960 sequence includes some higher-resolution keyframes.
The excerpt covers the crocus, stigma and dried threads. Later frames containing
the real branded jar are deliberately excluded from this anonymous concept.
No reference contact data, store integration, tracking or external requests are used.
These project assets are not offered as a stock-image library or relicensed here.

`src/saffron-journey.ts` adapts the reference's canvas crossfade and damped camera
follow to one live demo session. It does not import the original global scroll
controller or optical-flow/WebGL renderer. Frames load on demand from the same
origin, with at most four requests and fourteen decoded images per session.
The existing chapter illustrations remain the reduced-motion, Save-Data,
unsupported-browser and loading-failure fallback.

Vite emits hashed asset paths with the configured deployment base. Keep frame
names and the 0–400 bounds in sync with the controller when changing the excerpt.
