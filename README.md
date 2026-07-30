# Belaku – A Quiet Light

**Belaku** is a privacy-focused empathy engine designed to provide calm, thoughtful conversations for people experiencing loneliness, confusion, stress, grief, rejection, or emotional difficulty.

The application uses **Groq** through a lightweight local proxy server, ensuring your API key never reaches the browser.

---

## Features

- Calm, human-centered AI conversations
- Privacy-focused architecture
- Groq-powered inference
- Browser-based Kokoro Text-to-Speech
- Automatic fallback to the browser's native speech synthesis
- Modern, lightweight web interface

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML, CSS, JavaScript | Frontend |
| Node.js | Local proxy server |
| Groq API | AI inference |
| OpenAI JavaScript SDK | Groq API client |
| Kokoro TTS | Browser-based text-to-speech |

---

## Prerequisites

- Windows
- Node.js (v18 or later recommended)
- npm
- A Groq API Key

Obtain your API key here:

https://console.groq.com/keys

---

# Local Setup

## 1. Open Windows PowerShell

Navigate to the Belaku project directory.

```powershell
cd "FOLDER_LOCATION_WHERE_BELAKU_IS_STORED"
```

---

## 2. Install Dependencies

```powershell
npm install
```

---

## 3. Configure Environment Variables

Set your Groq API Key.

```powershell
$env:GROQ_API_KEY="YOUR_GROQ_API_KEY"
```

(Optional) Set the vision model.

```powershell
$env:GROQ_VISION_MODEL="qwen/qwen3.6-27b"
```

---

## 4. Start the Application

```powershell
npm start
```

Open the application in your browser:

```
http://localhost:3000
```

---

# AI Model

Belaku uses the **OpenAI JavaScript SDK** configured to communicate with **Groq's OpenAI-compatible endpoint**.

**Default chat model**

```
llama-3.1-8b-instant
```

---

# Text-to-Speech

Belaku includes built-in **Read Aloud** functionality powered by **Kokoro TTS**.

- Runs entirely inside the browser
- Downloads the model only during first use
- Reuses the downloaded model throughout the current session
- Falls back automatically to the browser's native speech synthesis if Kokoro is unavailable
- No additional API key is required
- No external TTS server is used

---

# Privacy

Belaku is designed with privacy in mind.

- The Groq API key is stored only in the local server environment.
- The API key is never exposed to the browser.
- Browser-based speech synthesis requires no external TTS service.

---

# License

This project is intended for educational and personal use. Please review the licenses of all third-party libraries and services before deploying or distributing the application.