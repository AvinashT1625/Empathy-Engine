# Belaku

Belaku uses Groq through a small local server so the API key stays out of the browser.

## Run locally

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

The app uses the OpenAI JavaScript library with Groq's OpenAI-compatible endpoint. Text replies use `llama-3.1-8b-instant`; messages with an attached photo use the vision model (`qwen/qwen3.6-27b` by default). Both can be overridden with `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL`.

Read Aloud runs entirely in the browser with Kokoro TTS. The model downloads only on first use, is reused for the session, and falls back quietly to the browser's built-in voice when Kokoro is unavailable. No Read Aloud API key or server endpoint is used.