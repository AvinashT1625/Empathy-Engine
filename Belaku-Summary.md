# Belaku — Full Project Summary

## 1. What Is This App?

Belaku is a single-page web application that acts as a calm, empathetic AI conversation companion. Users type (or share about, via photos) what's on their mind — loneliness, heartbreak, stress, grief, a hard day, or just needing to be heard — and Belaku replies like a warm, emotionally intelligent friend rather than a clinical chatbot. It supports text chat, image attachments (for context/visual storytelling), and Read Aloud (text-to-speech) for responses.

"Belaku" means **"light"** in Kannada — chosen to represent a small, steady light in a difficult moment.

## 2. Why This App? (The Problem It Solves)

- Many people don't have someone available in the moment to talk to, or feel judged/rushed when they try.
- Existing "AI chatbots" often feel robotic, generic, or overly clinical.
- Belaku is designed to be a low-pressure, always-available space to articulate feelings, without diagnosing, lecturing, or being preachy.
- It explicitly does **not** try to replace therapy or emergency services — it's positioned as a supportive companion, not a professional.

## 3. Who Is It For?

- Anyone going through a difficult emotional moment: loneliness, breakups, anxiety, burnout, grief, self-doubt.
- People who want to "think out loud" in a judgment-free space before (or instead of) talking to a person.
- **Not** intended for clinical diagnosis, crisis intervention as a primary channel, or as a substitute for licensed mental health care — the app itself says this directly in onboarding and in its system prompt.

## 4. Developer Details

| Field | Detail |
|---|---|
| Name | Avinash T. |
| Role | Independent front-end developer |
| Focus areas | Frontend, UI/UX, Creative code |
| Bio (in-app) | "I shape calm, human-centered interfaces — one thoughtful detail at a time." |
| Instagram | https://www.instagram.com/yooo.avi/ |
| LinkedIn | https://www.linkedin.com/in/avinasht1625/ |
| GitHub | https://github.com/AvinashT1625 |
| Email | avinasht2772@gmail.com |

Credit appears twice in-app: a hover-expandable "developer credit" card in the main UI, and a footer line in the onboarding modal ("Designed and built by Avinash T.").

## 5. Tech Stack

### Frontend
- Vanilla JavaScript (no framework — no React/Vue/etc.)
- Vanilla HTML5 + CSS3 (no Tailwind/Bootstrap — fully hand-written)
- Google Fonts: Montserrat (weights 400/500/600/700)
- No build step, no bundler — plain static files served as-is

### Backend
- Node.js, using only the built-in `node:http` module (no Express or other web framework)
- ES Modules (`"type": "module"` in `package.json`)
- Custom static file server with MIME-type mapping + path-traversal protection
- Single API route: `POST /api/chat`

### AI / LLM
- Provider: **Groq** (via the official `openai` npm SDK pointed at Groq's OpenAI-compatible endpoint: `https://api.groq.com/openai/v1`)
- Text model: `llama-3.1-8b-instant` (default, overridable via `GROQ_TEXT_MODEL` env var)
- Vision model: `qwen/qwen3.6-27b` (default, overridable via `GROQ_VISION_MODEL` env var) — used automatically when a user attaches a photo
- Generation settings: `temperature 0.72`, `max_tokens 180`
- `reasoning_effort: 'none'` + `reasoning_format: 'hidden'` are set on vision requests, and the server also strips any `<think>...</think>` content from responses before sending them to the client

### Text-to-Speech (Read Aloud)
- Primary engine: **Kokoro TTS** via the `kokoro-js` npm package, run 100% client-side in the browser
- Model: `onnx-community/Kokoro-82M-v1.0-ONNX`
- Tries WebGPU first (`fp32`), falls back to WebAssembly (`q8`) if WebGPU init fails
- Two exposed voices: "Deepa" (Indian female) and "Tejas" (Indian male) — mapped internally to Kokoro's `af_heart` / `am_michael` voices with custom rate/pitch tuning
- Fallback: native browser `SpeechSynthesisUtterance` API if Kokoro is unavailable, with matching logic to prefer Indian-English / gender-appropriate system voices
- No server calls, no TTS API key required — fully private/local audio generation
- Voice preference persisted in `localStorage`

### Package Management
- npm
- Dependencies: `kokoro-js ^1.2.1`, `openai ^4.104.0`
- Scripts: `npm start` / `npm run dev` → `node --watch server.js`

### Environment Variables
- `GROQ_API_KEY` — required; chat functionality won't work without it
- `GROQ_TEXT_MODEL` — optional override
- `GROQ_VISION_MODEL` — optional override
- `PORT` — optional, defaults to `3000`
- `.env` is gitignored, but note: the server does **not** auto-load `.env` (no dotenv import) — the env var must be exported manually in the shell before running (as shown in the README), unless the user adds `--env-file=.env` themselves.

## 6. Architecture / File Breakdown

**`server.js`**
- Serves static frontend files (html/css/js/images)
- Exposes `POST /api/chat`: sanitizes incoming message history (max 16 messages, 4,000 chars each), validates any attached image (must be a base64 data URL, jpeg/png/webp/gif, under ~3.7MB), picks text vs. vision model automatically, calls Groq, strips hidden "thinking" tags, and returns `{ reply }` as JSON
- Contains 3 versions of the system prompt in the file (`LEGACY_PROMPT`, `SYSTEM_PROMPT`, `CONVERSATION_PROMPT`) — only `CONVERSATION_PROMPT` is actually wired into the live completion call; the other two are superseded/unused leftovers from earlier iterations
- Two helper functions, `limitReplyWords()` and `needsExtendedSafetyReply()`, are defined but not currently called anywhere in the request flow — also unused/legacy code

**`app.js`**
- All client-side chat logic: sending messages, rendering bubbles, typing indicator, conversation history array (client keeps full history, sends last 16 messages per request)
- Image attach flow: validates type/size (≤10MB), compresses via `<canvas>` (auto-resizes to max 1800px + iteratively lowers JPEG quality) until the resulting data URL is under ~3.7MB, always re-encoded as JPEG regardless of original format
- Onboarding stepper logic (4 steps, progress dots, back/next)
- `repairOnboardingCopy()` re-injects onboarding text from a JS array at runtime — this fixes a mojibake/encoding issue in the raw HTML (smart quotes/em-dashes got corrupted to `â€™`-style sequences)
- Custom cursor system: a dot + ring that trail the mouse with easing, 5 floating "motes" that react to cursor proximity, click-pulse animation, hover-state resizing — all disabled on touch/coarse pointers via media query
- Web Audio API "glass click" sound effect on button presses
- Clear-chat flow: staggered fade-out of existing messages, then welcome screen reappears with its own entrance animation
- Contains an unused legacy client-side canned-response system (`responses` array + `getResponse()` with keyword matching, including a self-harm keyword regex) — this is dead code; it is never called since real replies now come from `/api/chat`

**`read-aloud.js`**
- `BelakuReadAloud` class: lazy-loads Kokoro, manages per-message play/stop buttons, text sanitization before speech (strips markdown/HTML/links/code blocks), native speech fallback, voice settings popover wiring

**`index.html`**
- Onboarding modal (4 slides) + main app shell (topbar with voice settings + clear-chat button, chat window, composer with textarea, image attach button, send button, image preview chip, developer credit widget)

**`styles.css`**
- Single stylesheet, CSS custom properties for light/dark theming (dark mode styles exist but are currently force-disabled in JS — `document.body.classList.remove('dark-mode')` runs on load, and there's no visible toggle button wired up in the current markup)
- Glassmorphism aesthetic: backdrop-filter blur, translucent panels, soft shadows, gradient accents
- Extensive keyframe animation library: welcome screen entrance, onboarding transitions, message bubble in/out, typing dots, cursor interactions, scroll "sheen" effects, and a dedicated warm-welcome / welcome-return animation set
- Responsive breakpoints for mobile/tablet (custom cursor, voice settings, and read-aloud buttons hidden on touch/narrow screens)
- Global `prefers-reduced-motion` override for accessibility

## 7. Key Features (User-Facing)

- Empathetic AI chat with a distinct, non-generic conversational voice
- Photo attachment support with automatic client-side compression
- Read Aloud on every AI response, two voice options, fully private (on-device TTS, no server round-trip)
- 4-step onboarding flow explaining what Belaku is (and isn't)
- Animated "Clear chat" with staggered message fade-out and a warm re-entrance animation for the welcome screen
- Suggested conversation starters on the welcome screen
- Custom animated cursor + ambient glow + subtle audio feedback for a polished, tactile feel
- Fully responsive (desktop glass-cursor experience → simplified touch-friendly layout on mobile)

## 8. Safety / Privacy Notes

- Crisis handling is implemented at the LLM prompt level: the live system prompt (`CONVERSATION_PROMPT`) instructs the model to recognize signs of self-harm/suicide/violence/abuse risk and respond by calmly encouraging the user to contact emergency services, a crisis line, or a trusted person, and to ask if they're safe.
- There is no deterministic (regex/keyword) server-side safety check actively wired in — safety behavior currently relies entirely on the model following its system prompt instructions (the helper functions that would do keyword-based detection exist in the code but are unused/dead).
- The onboarding explicitly states Belaku is "a supportive conversation companion, not a therapist or emergency service."
- Groq API key stays server-side only — never exposed to the browser.
- TTS runs entirely on-device (Kokoro or native browser voices) — no audio or transcript is sent to any third-party voice API.

## 9. How to Run Locally

1. Open Windows PowerShell.
2. Change directory to wherever Belaku (Empathy-Engine) is stored:

   ```powershell
   cd "FOLDER_LOCATION_WHERE_BELAKU_IS_STORED"
   ```

3. Install dependencies:

   ```powershell
   npm install
   ```

4. Get a Groq API key from [console.groq.com/keys](https://console.groq.com/keys), then set it in your shell:

   ```powershell
   $env:GROQ_API_KEY = "YOUR_GROQ_API_KEY"
   ```

5. *(Optional)* Set the vision model used for photo messages. This already matches the server's built-in default, so it's only needed if you want to override it:

   ```powershell
   $env:GROQ_VISION_MODEL = "qwen/qwen3.6-27b"
   ```

6. Start the app and open it in your browser:

   ```powershell
   npm start
   ```

   Then visit `http://localhost:3000`.

## 10. Notable Limitations / Tech Debt

- No framework, no TypeScript, no automated tests, no CI/CD config
- No dotenv auto-loading (env vars must be exported manually)
- Several unused/legacy code paths left in `server.js` and `app.js` (old prompts, old safety-detection helpers, old canned-response system) that could be cleaned up
- Dark mode CSS exists but has no active UI toggle right now
- No persistence layer — conversations live only in memory/DOM and are lost on refresh