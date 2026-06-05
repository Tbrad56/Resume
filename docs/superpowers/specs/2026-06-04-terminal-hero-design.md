# Terminal Hero + Scroll Motion — Design

**Date:** 2026-06-04
**Project:** Tai Bradley resume site (`resumeProject`)
**Goal:** Make the site less static. Replace the plain script-name hero with an animated terminal-style intro, and add light scroll-reveal motion to the rest of the page. Lean the existing CS/terminal theme from decoration into a signature, without rebuilding the site.

## Scope

In scope:
- Restructure the hero block in `index.html`.
- Add CSS for terminal prompt, blinking cursor, and scroll-reveal classes in `styles.css`.
- Add JS for the typing engine and scroll reveal (new `script.js` or extension of the existing inline `<script>`).

Out of scope (untouched):
- Education, Skills, Projects, Experience, Leadership, Contact, Footer content and layout.
- Color tokens, fonts, card design, nav.
- No build step, no libraries, no framework. Site stays static.

## 1. Terminal Hero

Replaces the current centered script-name hero. Left-aligned (terminals are not centered). Reuses existing color tokens — prompt and cursor in `--green`, text in `--ink`/`--muted`, monospace font.

On load, the hero "runs" a terminal session, typing character-by-character:

```
tai@osu:~$ whoami
Tai Bradley

tai@osu:~$ cat role.txt
B.S. Computer Science · The Ohio State University · ICA

tai@osu:~$ ls focus/
cybersecurity  embedded-systems  software

tai@osu:~$ ./contact --options
[ Email ]  [ LinkedIn ]  [ GitHub ]
```

- `Tai Bradley` output is the visual headline (largest text).
- `[ Email ] [ LinkedIn ] [ GitHub ]` are the real existing buttons (same links/targets), revealed on the final line.
- A blinking cursor `█` (green) follows the active typing position and rests at the end when done.
- Phone number `(470) 265-3853` remains below the terminal block.

### Timing & interaction
- Whole sequence is fast: ~3–4 seconds total.
- Skippable: a click/tap anywhere in the hero, or any scroll, jumps immediately to the finished state.
- No forced waiting and no layout shift — the hero container reserves its final height so content below does not jump as lines type in.

## 2. Accessibility / No-JS (non-negotiable requirements)

- The real name, role, focus areas, and buttons exist as plain semantic HTML in the document. JS only *animates* already-present content.
- JS disabled → the full, final hero renders instantly. Nothing breaks, no empty states.
- `prefers-reduced-motion: reduce` → skip the typing animation entirely; render the final state immediately.
- Screen readers read the real final text, not intermediate typing states. The animated/typed presentation is decorative; mark the live-typing layer `aria-hidden` and keep an accessible final copy, OR animate in place without exposing partial strings to the accessibility tree.

## 3. Scroll Motion (rest of page)

- Each `.section` and `.card` fades in and slides up (~16px) as it enters the viewport.
- Implemented with `IntersectionObserver`; each element animates once on first entry, then the observer unobserves it.
- Same `prefers-reduced-motion` guard: when reduced motion is requested, elements are simply visible with no transition.
- Elements default to visible if JS fails to run (motion is an enhancement via an added class, not a precondition for visibility).

## 4. Theme Glue

- Reuse existing tokens (`--green`, `--green-dark`, `--paper`, `--ink`, `--muted`, `--mono`). No new colors or fonts.
- Cursor and prompt use `--green`, consistent with existing `//` section labels and `>` brand mark.
- Result: the `//` and `>` decoration already present now reads as part of one cohesive terminal session rather than scattered accents.

## 5. Files Changed

| File | Change |
|------|--------|
| `index.html` | Restructure hero markup to be semantic and no-JS-safe (real content present, buttons intact). |
| `styles.css` | Add terminal prompt/cursor styles, blinking-cursor keyframes, scroll-reveal base + visible classes, reduced-motion guards. |
| `script.js` (new) or inline `<script>` | Typing engine for the hero sequence (with skip + reduced-motion handling) and `IntersectionObserver` scroll reveal. Extends, does not replace, the existing mobile-nav script. |

## Success Criteria

- On a normal load, the hero types out the four-command sequence and ends with a blinking cursor; buttons appear and work.
- Clicking/tapping the hero or scrolling immediately completes the animation.
- With JS disabled, the full hero (name, role, focus, buttons, phone) is visible and functional.
- With `prefers-reduced-motion: reduce`, no typing/scroll animation runs; all content is immediately visible.
- Sections and cards reveal on scroll once each.
- No layout shift during the hero animation.
- The rest of the site (content, colors, layout, nav) is unchanged.
