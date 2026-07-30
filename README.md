# Belaku - A Quite Light

I built this because I wanted a corner of the internet that didn't feel like it was rushing you. Belaku (it means "light" in Kannada) is a small chat app — you talk, it listens, and it tries to actually respond to *what you said* instead of throwing generic comfort-speak back at you. No account, no tracking dashboard, no growth-hacking dark patterns. Just a quiet UI and a model doing its best to sound like a person who's paying attention.

It's not a therapist and it doesn't pretend to be. If you're in a genuinely bad spot, please call someone — a real person, a crisis line, emergency services. Belaku is for the in-between moments: the days that are just hard, the thoughts you haven't said out loud yet, the "I don't even know what I'm feeling" texts to yourself at 1am.

## Stack, briefly

I kept this deliberately boring on the backend and a little indulgent on the frontend.

- **Server**: plain Node, `node:http`, no Express. It's a chat app, it doesn't need a framework.
- **Model**: Groq, running Llama 3.1 8B Instant for text and a Qwen vision model when you attach a photo. Both are swappable via env vars if you want to try something else.
- **Frontend**: no React, no build step. Just HTML/CSS/JS I wrote by hand, because I wanted full control over the animations and the glass/blur aesthetic without fighting a framework for it.
- **Voice**: Kokoro TTS running entirely in your browser via WebGPU (falls back to WASM, then to your OS voice if none of that works). Nothing gets sent anywhere for audio — I care about that.

## Running it locally

I build and test this on Windows, so these are PowerShell commands — adjust if you're on something else.

1. Open PowerShell and `cd` into wherever you've got this folder:

   ```powershell
   cd "FOLDER_LOCATION_WHERE_BELAKU_IS_STORED"
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Grab a Groq API key — free to generate at [console.groq.com/keys](https://console.groq.com/keys) — and set it:

   ```powershell
   $env:GROQ_API_KEY = "YOUR_GROQ_API_KEY"
   ```

4. If you want to point at a different vision model than the default (`qwen/qwen3.6-27b`), you can override it:

   ```powershell
   $env:GROQ_VISION_MODEL = "qwen/qwen3.6-27b"
   ```

5. Run it:

   ```powershell
   npm start
   ```

   and open `http://localhost:3000`.

That's it — there's no `.env` loader, so the key has to actually be set in your shell session before you run `npm start`, not just sitting in a `.env` file.

## A few honest notes

There's some dead code still in here from earlier versions — an old client-side keyword-matching responder, a couple of unused system prompts, a word-limiter function I never wired up. I know it's there. I'll clean it eventually, it just hasn't been a priority over actually getting the tone of the responses right.

Dark mode is fully styled in the CSS but I turned it off for now (there's a line in `app.js` that force-removes the class on load) — I wasn't happy with how the toggle felt and didn't want to ship it half-done.

— Avinash