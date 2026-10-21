# Local Instrument fonts

The application serves these files locally from `/fonts/`. No font provider is
contacted by the running prototype. Only WOFF2 Latin and Latin-ext subsets are
included; `src/fonts.css` declares their Unicode ranges and `font-display: swap`.

| Family | Included styles | Weight | Source package |
| --- | --- | --- | --- |
| Instrument Sans | normal, true italic | variable 400–700, default width | `@fontsource-variable/instrument-sans@5.3.0` |
| Instrument Serif | normal, true italic | 400 | `@fontsource/instrument-serif@5.3.0` |

Both families are designed by Rodrigo Fuenzalida and Jordan Egstad for Instrument.
Copyright 2022 The Instrument Sans / Instrument Serif Project Authors.
Both are distributed under the **SIL Open Font License 1.1**; the complete,
unmodified licenses from each source package are included next to the font files:

- [Instrument Sans license](./Instrument-Sans-OFL.txt)
- [Instrument Serif license](./Instrument-Serif-OFL.txt)

## Provenance

Fetched on 2026-10-20 from the following pinned npm package archives. The WOFF2
files are copied without modification. CSS is derived from the packages' `wght`,
`wght-italic`, `400` and `400-italic` stylesheets, with local URLs, a consistent
Instrument Sans family name, and the unused WOFF fallback removed.

- [Sans archive](https://registry.npmjs.org/@fontsource-variable/instrument-sans/-/instrument-sans-5.3.0.tgz)
- [Serif archive](https://registry.npmjs.org/@fontsource/instrument-serif/-/instrument-serif-5.3.0.tgz)
- [Fontsource Sans metadata](https://fontsource.org/fonts/instrument-sans/about)
- [Fontsource Serif metadata](https://fontsource.org/fonts/instrument-serif/about)
- [Instrument Sans upstream](https://github.com/Instrument/instrument-sans)
- [Instrument Serif upstream](https://github.com/Instrument/instrument-serif)

The source package metadata identifies the Google Fonts distributions as Sans v4
and Serif v5. No font package is needed at runtime or during installation because
the exact required binary assets and licenses are versioned here.

## Usage

Import `src/fonts.css` and `src/tokens.css` once from the entry point. Use
`var(--font-sans)` for UI/body text and `var(--font-serif)` with weight 400 for
display text. Use `font-style: italic` for the supplied italic faces; do not
simulate italics with transforms. Sans weights outside 400–700 and serif weights
other than 400 are intentionally not supplied.
