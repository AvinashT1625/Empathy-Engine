# Belaku — my notes on this project

## What it is

Belaku is a chat app I built to be a calm, non-judgmental space to talk through whatever's going on in your head. You can type, attach a photo for context, and have replies read aloud to you. The name means "light" in Kannada — a small, steady light for the hard moments, not a therapist and not pretending to be one.

## Why I built it

Most "AI companion" apps I'd tried felt either creepy (too clingy, too eager to role-play a relationship) or clinical (bullet-pointed advice, "have you tried journaling"). I wanted something in between — a listener that actually reflects back what you specifically said instead of recycling the same three comforting phrases. A lot of the system prompt work went into stripping out lines like "that must be difficult" and "I understand" because they read as filler, not empathy.

I also wanted it to be honest about its limits. The onboarding says plainly: this isn't a therapist, and if you're in danger please contact someone real. I'd rather the app undersell itself than overpromise and have someone rely on it in a moment it can't actually help with.

## Who it's for

Anyone who wants to think out loud without an audience — a rough day, a breakup, loneliness, the stuff that's hard to bring up with people around you even when you want to. It's not built for crisis intervention as a primary channel, and it's not a diagnostic tool. I say that upfront in-app because I mean it.

## Tech decisions and why

**No framework on the frontend.** This was mostly a personal choice — I wanted the custom cursor, the glass panels, and the entrance animations all built by hand, without fighting React's re-render cycle or a build pipeline. It's plain HTML/CSS/JS, `node --watch` for the dev server, done.

**No Express on the backend.** It's one route (`/api/chat`) and a static file server. Didn't need a framework for that.

**Groq for inference.** Fast, cheap, and OpenAI-compatible, so I could use the `openai` npm package pointed at a different base URL instead of writing a custom client. Text goes to Llama 3.1 8B Instant; if you attach a photo it switches to a Qwen vision model automatically.

**Kokoro TTS in-browser.** I didn't want Read Aloud to mean "send your conversation to a third-party voice API." Kokoro runs as WebGPU/WASM right in the browser, so audio generation never leaves your machine. It's slower on first load since it has to download the model, but I think that tradeoff's worth it for a privacy feature like this.

## How it's put together

- `server.js` — static file serving plus the one `/api/chat` endpoint. Sanitizes incoming messages, validates any attached image, picks the right model, strips out any `<think>` tags Groq sometimes sends back, returns the reply.
- `app.js` — everything client-side: sending messages, the onboarding flow, the image compression pipeline (canvas resize + quality stepping so a 10MB photo doesn't blow past the vision model's limits), and the whole custom cursor/mote/sound-effect system I probably spent too long on.
- `read-aloud.js` — the `BelakuReadAloud` class. Handles Kokoro loading, the per-message play button, text cleanup before speech (stripping markdown/links so it doesn't read "asterisk asterisk" out loud), and falling back to the browser's built-in voice if Kokoro can't load.
- `styles.css` — one big stylesheet, CSS variables for theming, the glassmorphism look, and most of the animation keyframes.

## What I'd flag if you're reading the code

I haven't gone back and cleaned out some early iterations — there's an old keyword-based responder in `app.js` that's dead code now (real replies come from the API), a couple of superseded system prompts still sitting in `server.js`, and a word-limiter helper I built and then never actually called. None of it runs, it's just clutter I haven't gotten around to deleting.

Dark mode is fully styled but disabled — `app.js` forces it off on load. I built it, wasn't happy with how the toggle felt, and didn't want to ship something half-finished.

Also worth knowing: there's no `.env` auto-loading, so `GROQ_API_KEY` has to be exported in your shell before you run the app — dropping it in a `.env` file alone won't do anything unless you also load it yourself.

## Running it

1. `cd` into the project folder in PowerShell.
2. `npm install`
3. Get a key from [console.groq.com/keys](https://console.groq.com/keys) and set `$env:GROQ_API_KEY`.
4. Optionally override `$env:GROQ_VISION_MODEL` if you want a different vision model than the default.
5. `npm start`, then open `http://localhost:3000`.

## About me

I'm Avinash T., independent front-end dev. Frontend, UI/UX, and creative code are basically what I spend my time on. If you want to see more or get in touch:

- Instagram: [@yooo.avi](https://www.instagram.com/yooo.avi/)
- LinkedIn: [avinasht1625](https://www.linkedin.com/in/avinasht1625/)
- GitHub: [AvinashT1625](https://github.com/AvinashT1625)
- Email: avinasht2772@gmail.com