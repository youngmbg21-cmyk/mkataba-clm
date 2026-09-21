# HaTi — launch video

A 21-second launch/promo film for HaTi, plus the source project that produced it.
Built with the [`/brag`](https://github.com/latent-spaces/brag) skill and
[Hyperframes](https://hyperframes.heygen.com/) (HTML → MP4).

## Watch it

- **`brag.mp4`** — the final video (1920×1080, 30fps, ~21s, with music). This is the deliverable.
- **`brag.jpg`** — the poster / thumbnail (baked as frame 0 of the video too).

## What it shows

All scenes use HaTi's real brand (teal `#0E5F58` on deep teal `#093733`, cream paper, IBM Plex Sans)
and real product language. The screens are drawn to HaTi's design system, not screen-recorded.

1. A contract page with a **live redline** — "Every contract. Every clause. Handled."
2. The **AI Copilot** reading all 30 contracts and flagging Kenya risks (foreign governing law, auto-renewal, stamp duty).
3. A **redline accepted** — "Redline, counter, agree. Every round on the record."
4. The **Portfolio Intelligence graph** clustering by counterparty — "See the whole book. Ask it anything."
5. A signature **sealed with SHA-256** — "Signed. Sealed with SHA-256."
6. The **HaTi wordmark** — "Contract Lifecycle Management · The whole lifecycle, in one place · Built for Kenya."

## Files

| File | What it is |
|---|---|
| `brag.mp4` | The final rendered video |
| `brag.jpg` | Poster / thumbnail |
| `brag-plan.md` | The creative plan and storyboard |
| `composition-brief.md` | The brief handed to Hyperframes |
| `share-copy.txt` | Ready-to-post captions (X, LinkedIn, one-liner) |
| `composition/` | The re-renderable Hyperframes project (source) |

## Re-render or edit

Requires **Node.js 22+**, **FFmpeg** on `PATH`, and a headless Chrome (Hyperframes downloads one on first run).

```bash
cd launch-video/composition
npx hyperframes check      # validate (lint + runtime + layout + contrast)
npx hyperframes render --quality delivery --fps 30 -o ../brag.mp4
```

The whole film is one file — `composition/index.html` — with all motion on a single GSAP timeline.
Edit the copy, colours, or timing there, then re-render.

Common variants:
- **Vertical (9:16)** for Instagram / TikTok / WhatsApp status: `render --resolution portrait` (adjust the layout first).
- **Shorter cut:** trim the scene `data-duration` values and the timeline in `index.html`.
- **No music / your own track:** replace `composition/assets/music/bed.mp3`, or remove the `<audio id="bed">` element.

## Asset licences — please read before a paid or public campaign

| Asset | Source | Licence |
|---|---|---|
| Sound effects (`seal.ogg`, `click.ogg`) | [Kenney.nl](https://kenney.nl/) | CC0 (public domain) — free to use |
| `gsap.min.js` | [GSAP](https://gsap.com/) | GSAP standard "no charge" licence |
| `music/bed.mp3` ("Business Moves") | [ende.app](https://ende.app/en) via the `/brag` skill | **Licence not yet confirmed.** The `/brag` skill's own notes say to verify the exact music terms before redistributing. **Replace this track (or drop the music) before any paid or wide public use.** |
