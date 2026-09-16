# ANERVA — public site

A single static page. No build step, no framework, no npm, no external requests.
Open `index.html` from any static host, or run the bundled server.

```bash
node serve.mjs          # http://127.0.0.1:8777
```

## What's on the page

| # | Section | Notes |
|---|---|---|
| — | **The opening** | The film is first seen through the ANERVA mark, which then expands until the film fills the frame. Runs once per session; any click, key or scroll skips it. |
| 1 | **Hero** | The 15s silent film, the fixed headline, the glass nav. |
| 2 | **High performance / dysregulation** | Playfair headline, hairline divider, and the three drawn traces — Effort, Rigidity, Recovery cost. |
| 3 | **The problem** | "You're not indisciplined; your system needs regulation," plus a snap-scrolling rail of six portraits, one per signal. |
| 4 | **The connected system** | "ANA maps energy, state, cognition, behaviour and identity…" plus the three shifts. |
| 5 | **Four functional domains** | The closed feedback loop — a live canvas circuit with four selectable domains. |
| 6 | **Program pathways** | ANA Core and ANA Premium. |
| 7 | **What we know** | The scope and safety block, on an inverted paper surface. |
| 8 | **Apply** | "Begin with a suitability application" plus the footer — Nerva Systems, Explore, Legal. |

Sections 3–6 and the footer follow the Figma file. The hero and the traces band
are the local build.

## Useful flags

- `index.html?nointro` — skip the opening. Used for screenshots and layout runs.
- `index.html?only=<section-id>` — render one section alone, so a screenshot
  composites the fixed chrome correctly. Ids: `hero` `coexist` `problem`
  `connected` `framework` `pathways` `measurement` `begin`.

## Checks

```bash
node tools/lint-copy.mjs
```

Enforces the claims contract mined from the blueprint documents: no retired
neuroplasticity day-counts, no accuracy claims, no identity framing, no prices,
no unqualified OM8-as-endpoint language, and the required boundary sentences
present. Exits non-zero on any hit.

`tools/check-layout.html` loads the page at thirteen widths from 360 to 2560 and
reports horizontal overflow and undersized tap targets.

## Assets

| Path | Notes |
|---|---|
| `assets/anerva-mark.svg` | The mark, traced from the 4500px brand original to true vector. Verified against the raster at IoU 0.9995. 4 KB. |
| `assets/anerva-mark-mono.svg` | `currentColor` variant. Drives the opening aperture mask. |
| `assets/anerva-lockup.png` | Mark + wordmark, white, 3x. The wordmark only exists as a low-resolution screenshot crop, so it is kept as a raster rather than traced. |
| `assets/film/` | The hero film: seamless 13.84s loop (1.2s crossfade), VP9 + H.264 at 1080/720/540. A phone loads 616 KB rather than the 4.7 MB master. |
| `assets/faces/` | Six portraits, one per signal, generated in the ANERVA palette. |
| `assets/stills/` | One wide light-ribbon frame from the film, behind the connected-system section. |
| `assets/fonts/` | Inter and Playfair Display, latin subset, variable, self-hosted. 106 KB total. |

`assets/anerva-logo.svg` is the original 7 MB file — a full screenshot of the
reference design with the logo cropped out by `viewBox`. It is no longer
referenced and can be deleted.

## Before this goes live

Four items are deliberately left empty rather than guessed:

1. **Crisis helpline.** Not shipped. The PRD names Tele-MANAS 14416 but records it
   as unverified, and a wrong crisis number is worse than none.
2. **The application destination.** "Apply to ANERVA", the nav "Begin" and the two
   "Apply for…" buttons have no URL, and nor do Privacy policy, Terms and
   Accessibility. They currently explain that rather than 404.
3. **The founder's name.** `CURRENT_STATE.md` says *Dr. Kavitha Satish Kumar*; the
   PRD says *Dr. Kavitha S K Aaryan*. CURRENT_STATE wins by its own supersession
   rule, but this needs confirming before it is printed.
4. **Public mode labels.** Phase 08 §15 reserves approval of public-facing
   category and mode labels to the founder.

Two copy notes. **"indisciplined"** is used in the problem headline at your
instruction. Standard English is *undisciplined*; the change is a one-word edit
in `index.html` if you want it back. And the footer carries **™** on ANERVA and
Anerva Neural Architecture, from your supplied design. The mined claims contract
says no ™ because no IP convention is approved, so the lint now reports it as a
warning rather than blocking — worth one check with counsel before launch.

## Kept, not deleted

- `ref/index.full.html` — the earlier eight-section build (the pattern, the
  positioning band, the method, the phase ladder, the founder, the formulation
  instrument). Any block can be copied back.
- `assets/js/phase-ladder.js` — the interactive pathway/phase explorer. Built,
  not currently mounted.
- `assets/js/anerva.js` still carries the seven categories and eight operating
  modes as data, so those sections can be restored without re-entering content.
