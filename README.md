<div align="center">

# Belaku — A Quiet Light

*A calm, private, AI-powered conversation companion built for moments when you simply need someone to listen.*

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq-F55036)](https://groq.com/)
[![OpenAI SDK](https://img.shields.io/badge/OpenAI-JavaScript%20SDK-412991?logo=openai)](https://github.com/openai/openai-node)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## About

**Belaku** (Kannada: *"Light"*) is an empathy-first AI conversation companion designed for people experiencing loneliness, heartbreak, stress, grief, burnout, self-doubt, or simply needing a space to think out loud.

Unlike traditional AI assistants, Belaku focuses on creating calm, emotionally intelligent conversations that feel supportive rather than clinical. It is designed to be a quiet presence—not a replacement for therapy or professional mental healthcare. :contentReference[oaicite:0]{index=0}

---

## Why Belaku?

Many people struggle to find someone available when they need to talk.

Belaku provides a judgment-free space where users can:

- Express difficult emotions
- Organize overwhelming thoughts
- Reflect through conversation
- Receive empathetic, human-like responses
- Share images for additional context
- Listen to responses using natural voices

The goal is simple:

> **To be a quiet light during difficult moments.** :contentReference[oaicite:1]{index=1}

---

# Features

- Emotionally intelligent AI conversations
- Image attachment support (Vision AI)
- Browser-based Kokoro Text-to-Speech
- Natural Indian male and female voices
- Privacy-focused architecture
- Lightweight local Node.js server
- Beautiful glassmorphism interface
- Responsive desktop & mobile experience
- Smooth animations
- Conversation starters
- Accessibility-focused design

---

# Screenshots

> Add screenshots here.

```
/assets/screenshots/home.png
/assets/screenshots/chat.png
/assets/screenshots/read-aloud.png
```

---

# Technology Stack

| Category | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js |
| AI Provider | Groq |
| SDK | OpenAI JavaScript SDK |
| Text Model | llama-3.1-8b-instant |
| Vision Model | qwen/qwen3.6-27b |
| Text-to-Speech | Kokoro TTS |
| Package Manager | npm |

Source: :contentReference[oaicite:2]{index=2}

---

# Architecture

```text
                User
                  │
                  ▼
        HTML / CSS / JavaScript
                  │
                  ▼
         Local Node.js Server
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
     Groq Chat         Groq Vision
        │
        ▼
     AI Response
        │
        ▼
 Browser-based Kokoro TTS
```

---

# Privacy

Belaku is designed with privacy as a core principle.

- API keys never reach the browser.
- Groq requests are proxied through a local server.
- Read Aloud runs entirely inside the browser.
- No external Text-to-Speech API is used.
- No TTS API key is required.

Source: :contentReference[oaicite:3]{index=3}

---

# Read Aloud

Belaku includes built-in speech powered by **Kokoro TTS**.

Features:

- Runs 100% in-browser
- Downloads once on first use
- Cached for the session
- Natural Indian Female voice (Deepa)
- Natural Indian Male voice (Tejas)
- Automatic browser speech fallback
- No cloud TTS services

Source: :contentReference[oaicite:4]{index=4}

---

# Local Installation

## 1. Clone the repository

```bash
git clone https://github.com/AvinashT1625/Belaku.git
```

```bash
cd Belaku
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Get a Groq API Key

https://console.groq.com/keys

---

## 4. Configure PowerShell

```powershell
$env:GROQ_API_KEY="YOUR_GROQ_API_KEY"
```

(Optional)

```powershell
$env:GROQ_VISION_MODEL="qwen/qwen3.6-27b"
```

---

## 5. Start Belaku

```bash
npm start
```

Open:

```
http://localhost:3000
```

Source: :contentReference[oaicite:5]{index=5}

---

# Project Structure

```text
Belaku
│
├── app.js
├── server.js
├── read-aloud.js
├── styles.css
├── index.html
├── package.json
├── assets/
└── README.md
```

Source: :contentReference[oaicite:6]{index=6}

---

# Safety

Belaku is **not** a therapist or crisis intervention service.

If conversations indicate potential self-harm or immediate danger, Belaku is instructed to encourage users to contact local emergency services, trusted people, or professional support.

Source: :contentReference[oaicite:7]{index=7}

---

# Roadmap

- [ ] Conversation history
- [ ] Export chats
- [ ] User accounts
- [ ] Cloud sync
- [ ] Additional languages
- [ ] More Kokoro voices
- [ ] Custom themes
- [ ] Dark mode toggle

(The uploaded project summary notes that dark mode exists in CSS but currently has no active UI toggle.) :contentReference[oaicite:8]{index=8}

---

# Developer

<div align="center">

## Avinash T

**Independent Front-End Developer**

*"I shape calm, human-centered interfaces — one thoughtful detail at a time."*

[GitHub](https://github.com/AvinashT1625) •
[LinkedIn](https://linkedin.com/in/avinasht1625) •
[Instagram](https://instagram.com/yooo.avi)

</div>

Developer details sourced from the project summary. :contentReference[oaicite:9]{index=9}

---

# Acknowledgements

Built using:

- Groq
- OpenAI JavaScript SDK
- Kokoro TTS
- Node.js

---

# License

This project is intended for educational and personal use.

Please review the licenses of all third-party libraries before distributing or deploying this project.

---

<div align="center">

### Belaku — A Quiet Light

Designed and developed by **Avinash T**

© 2026 Avinash T. All rights reserved.

</div>