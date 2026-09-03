Paste this as your first message to `claude` once you're inside the project folder.
Edit anything in [brackets] before sending — especially the deployment/domain question,
since that changes some setup choices.

---

I'm rebuilding my personal/business website as a static site. Read CONTENT.md in this
folder fully before doing anything else — it's the source of truth for who I am, my
career history, and what's currently on my live WordPress site at 15creative.com. Don't
invent bio content, project descriptions, or numbers that aren't in that file.

**Goal:** One site that combines two things that currently live separately — my 15
Creative creative/consulting business (web dev, video, photography, consulting
services) and my career background as an operator/strategist (I'm currently job
searching in that lane). It should read as one coherent person, not two bolted-together
sites.

**Site structure I want to start with** (push back if you think this is wrong):
1. Home — combined positioning, short intro, routes into both "the work" and "the
   career"
2. About — founder story + the throughline from 2004 (Allodic) to now (Pebble Beach/AI)
3. Bio / Experience — the career timeline from CONTENT.md, presented cleanly (not a
   literal resume dump — readable, web-native)
4. Work — portfolio of creative/client work: video production, photography, web dev.
   Some of this needs real media files from me before it's finished — flag anything
   you're blocked on rather than using placeholder/stock content
5. Services — the existing 15 Creative service offerings, if I decide to keep taking
   client work (I haven't fully decided — build it but make it easy to remove)
6. Contact

**Tech stack:** I want you to recommend one and explain the tradeoff in a sentence or
two, then build it. My instinct is something like Astro (plain static HTML output, no
heavy framework overhead, easy to maintain) but I'm open to plain HTML/CSS if you think
that's actually simpler for a site this size. I do NOT want to run WordPress locally —
I'm decoupling from it and using it only as a content source.

**Design direction:** Professional but not corporate-stiff — I've got a real creative
background so it shouldn't look like a generic consulting template. [Add any specifics
here: colors, fonts, reference sites you like, dark/light preference.]

**What I still need to give you:** real photos and video from my WordPress media
library (the current video portfolio is broken — outdated plugin — so don't try to
scrape or re-embed whatever's live now). I'll pull those separately and drop them in an
/assets folder. Build the layout to accommodate them and use clearly labeled
placeholders in the meantime.

**Deployment:** [Tell it here — e.g. "I want this on Netlify/Vercel with my existing
15creative.com domain pointed at it eventually" or "just get it running locally for now
and we'll figure out hosting later."]

Start by proposing the file/folder structure and confirming the tech stack choice with
me before you scaffold anything.
