# Tai Bradley — Resume Website Design

**Date:** 2026-05-31
**Owner:** Tai Bradley
**Source:** `Tai Bradley Resume Updated.pdf`

## Goal

A simple, computer-science-themed personal resume website built from Tai's
resume. Script-font accents over a clean, professional light theme. Baseline
first — no over-engineering; polish/extras come later.

## Stack & Files

- Static site, no framework.
- `index.html` — markup and content.
- `styles.css` — all styling.
- Minimal vanilla JS (inline in `index.html` or small `script.js`) for:
  - mobile nav hamburger toggle
  - smooth-scroll to sections on nav click
- Lives in the `resumeProject` git repo. Deployable to GitHub Pages later
  (out of scope for this build).

## Visual Design

- **Theme:** Light paper background `#faf8f3`, secondary `#e8e4da`,
  green accent `#2f6f4f`, near-black text `#1a1a1a`.
- **Fonts (Google Fonts):**
  - `Caveat` (script) — hero name + section headings ONLY.
  - `JetBrains Mono` (monospace) — body text, labels, nav, buttons.
- **CS flavor:** section labels styled as code comments, e.g. `// projects`.
  Hero name prefixed with `>` terminal prompt.
- Hover states on all interactive elements. No animations beyond hover +
  smooth scroll.

## Layout

Single-page vertical scroll with a **sticky top nav bar**.

- **Nav bar (sticky):** left = `> Tai Bradley`; right = links
  (About · Skills · Projects · Experience · Contact) that smooth-scroll to
  their sections. Collapses to a hamburger toggle on mobile.

### Sections (in order) — full resume detail

1. **Hero / About**
   - Large script name `Tai Bradley`.
   - Tagline: CS @ The Ohio State University · Information & Computer
     Assurance (ICA) major.
   - Three clickable button links: Email (`mailto:Bradley.809@osu.edu`),
     LinkedIn (`https://www.linkedin.com/in/tai-bradley/`),
     GitHub (`https://github.com/Tbrad56`).
   - Phone shown as text: (470) 265-3853.

2. **Education** (`// education`)
   - The Ohio State University | Columbus, OH — Aug 2023 – Aug 2027 (Expected).
   - B.S. in Computer Science | Junior. Major: Information and Computer
     Assurance (ICA).
   - Organizations: National Society of Black Engineers, ColorStack, The Zeta
     of Kappa Alpha Psi Fraternity Inc., National Pan-Hellenic Council (NPHC),
     Viceroy Scholar.
   - Relevant Coursework: Software II, Systems I (Low-Level Programming),
     Systems II (Operating Systems), Data Structures and Algorithms, Computer
     Networking, Information Security, Programming Principles.

3. **Technical Skills** (`// technical skills`) — rendered as chip/tag pills.
   - Programming Languages: Java, HTML, CSS, C, C++, Python, SQL.
   - Other Skills: Microsoft Office Suite, Security Controls, Intrusion
     Detection & Prevention, Threat Detection, Threat Management, Incident
     Response, OOP, Onshape, Linux OS, NIST Cybersecurity Framework,
     Blockchain development, PLC Programming.

4. **Projects** (`// projects`) — one card each, with title, dates, full bullets:
   - **ICS/SCADA Cyber-Physical Research** | Undergraduate Research — Mar 2026 – Current.
     - Collaborated with a partner developing a blockchain-secured ICS/SCADA
       monitoring system for Water Treatment Plant cybersecurity.
     - Modeled real-world threat vectors (Stuxnet-style actuator sabotage,
       stealth sensor drift, replay attacks, APT multi-vector intrusions)
       alongside a physics-based IDS detecting attacks invisible to network
       monitoring.
     - Designed/integrated a custom blockchain ledger in C using OpenSSL
       SHA-256 hashing and Proof-of-Work for tamper-proof ICS logging.
   - **Sentinel IR** | Electronics CSE — Nov 2025 – Dec 2025.
     - ESP-based intruder detection system: IR obstacle sensor, pushbutton,
       LED, buzzer, state-machine architecture.
     - Validated sensor/actuator behavior via isolated test cases and serial
       debugging.
     - Collaborated with a partner to plan, test, debug, and document end to end.
   - **Email Automation Tool** | Personal Project — Sep 2025 – Nov 2025.
     - Python script automating email sending with multiple attachments via
       Gmail SMTP.
     - Optional encryption of messages/attachments with `cryptography.Fernet`.
     - Managed credentials via environment variables (no hardcoded passwords).

5. **Experience** (`// experience`)
   - **Undergraduate Research Assistant** | The Ohio State University — Feb 2026 – Current.
     - Research under Vimal Buck in cybersecurity; embedded systems security
       and log integrity in IoT environments.
     - Developing security research methodologies alongside CS coursework.
   - **Server** | J. Alexander's Restaurant — Oct 2025 – Apr 2026.
     - Attentive customer service in a fast-paced environment; coordinate with
       team for a positive dining experience.

6. **Leadership** (`// leadership`)
   - **MTA Chairman / Social Media Chair** | Kappa Alpha Psi Fraternity Inc. — Aug 2025 – Current.
     - Chairperson overseeing membership intake for an organized onboarding.
     - Managed/created social media content to promote events and engagement.
   - **Finance Chair** | NPHC Executive Board — Dec 2025 – Current.
     - Manage chapter finances: budgeting, expense tracking, processing funds.
     - Collaborate with E-board to allocate funds responsibly.

7. **Contact / Footer** — Email, LinkedIn, GitHub buttons again; phone as text.

## Buttons

Styled `<a>` elements (monospace label). Primary = solid green fill with hover
darken; used for contact links. Real targets: `mailto:` for email, external
`https` links open in new tab for LinkedIn/GitHub.

## Responsive

- Desktop: comfortable max-width centered column; project cards may sit in a
  grid.
- Mobile: sections stack to one column; nav collapses to hamburger; buttons
  full-width-friendly.

## Out of Scope (baseline)

- Animations beyond hover + smooth scroll.
- Dark-mode toggle.
- Embedded/downloadable PDF.
- Backend, contact form, analytics.
- Deployment config.

## Success Criteria

- Opens in a browser showing all resume content above, accurately.
- Sticky nav links smooth-scroll to correct sections.
- Contact buttons work (mailto + external links).
- Readable and clean on both desktop and mobile widths.
- Script font limited to name + section headings; body fully readable.
