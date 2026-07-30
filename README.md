# Belaku - A Quite Light

Belaku uses Groq through a small local server so the API key stays out of the browser.

## Run locally

1. Install dependencies with `npm install`.
2. Set a Groq API key in your shell:

   ```powershell
   $env:GROQ_API_KEY = "gsk_your_key_here"
   ```

3. Start the app with `npm start` and open `http://localhost:3000`.

The app uses the OpenAI JavaScript library with Groq's OpenAI-compatible endpoint and the `llama-3.1-8b-instant` model.

Read Aloud runs entirely in the browser with Kokoro TTS. The model downloads only on first use, is reused for the session, and falls back quietly to the browser's built-in voice when Kokoro is unavailable. No Read Aloud API key or server endpoint is used.
