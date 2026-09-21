# HaTi Copilot — AI capability video

A ~23-second film focused only on HaTi's AI (the Copilot, powered by Claude), plus the
source project that produced it. Built with the [`/brag`](https://github.com/latent-spaces/brag)
skill and [Hyperframes](https://hyperframes.heygen.com/) (HTML → MP4).

Companion to the main launch film in `../` (the whole product); this one is AI-only.

## Watch it

- **`brag.mp4`** — the final video (1920×1080, 30fps, ~23s, with music).
- **`brag.jpg`** — the poster / thumbnail (also baked as frame 0 of the video).

## What it shows

The AI is drawn in HaTi's own Copilot **violet** (`#6d28d9` / `#8b5cf6` / `#a78bfa`) with the
spark (✦) mark, so it reads distinctly from the teal product. Every beat is a real capability:

1. **Reads every contract** — "Copilot reads every contract. All of them. In minutes, not weeks."
2. **Briefs you & flags watch-outs** — a Copilot brief with amber risk flags (auto-renewal, uncapped liability, foreign governing law).
3. **Plain English** — a dense legalese clause turned into one plain sentence, side by side.
4. **Playbook check + your precedent** — spots a clause off your standard and redlines only that, citing your own past deals ("your last 6 supplier deals settled at 30 days").
5. **Ask your whole book** — a natural-language question lights up the matching contracts.
6. **Honest by design** — "Shows its work · Flags what it's unsure of · Never invents a number · Powered by Claude · your key never leaves your server."
7. **Close** — the HaTi Copilot lockup.

## Files

| File | What it is |
|---|---|
| `brag.mp4` | The final rendered video |
| `brag.jpg` | Poster / thumbnail |
| `share-copy.txt` | Ready-to-post captions (X, LinkedIn, one-liner) |
| `composition/` | The re-renderable Hyperframes project (source) |

## Re-render or edit

Requires **Node.js 22+**, **FFmpeg** on `PATH`, and a headless Chrome (Hyperframes downloads one on first run).

```bash
cd launch-video/copilot/composition
npx hyperframes check      # validate (lint + runtime + layout + contrast)
npx hyperframes render --quality delivery --fps 30 -o ../brag.mp4
```

The whole film is one file — `composition/index.html` — with all motion on a single GSAP timeline.
Edit the copy, colours, or timing there, then re-render. (A poster + audio fade were then applied
with FFmpeg to make the final `brag.mp4`; re-running the render alone gives the video without those.)

## Asset licences — please read before a paid or public campaign

| Asset | Source | Licence |
|---|---|---|
| Sound effects (`click.ogg`, `ping.ogg`) | [Kenney.nl](https://kenney.nl/) | CC0 (public domain) — free to use |
| `gsap.min.js` | [GSAP](https://gsap.com/) | GSAP standard "no charge" licence |
| `music/bed.mp3` ("Business Moves") | [ende.app](https://ende.app/en) via the `/brag` skill | **Licence not yet confirmed.** Replace this track (or drop the music) before any paid or wide public use. |

> Note on the "Powered by Claude" line: HaTi's Copilot uses an Anthropic API key set in
> Team & Settings, called through a server-side proxy so the key never reaches the browser.
