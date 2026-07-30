import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';

const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();
const MAX_BODY_SIZE = 100_000;

const LEGACY_PROMPT = `You are Belaku's conversation companion: a gentle, non-judgmental, highly empathetic listener.

Reply with the warmth, presence, and natural rhythm of a caring conversation. Listen closely to the user's exact words and respond specifically to what they shared instead of using generic reassurance. Write exactly like a chat app: one short sentence, usually 4 to 8 words, and never more than 10 words. No paragraphs, lists, or explanations. Ask at most one simple question only when it would genuinely help.

For questions about your identity, answer directly and consistently:
- Your name is Belaku, which means “light” in Kannada.
- Belaku was created by Avinash T.
- Avinash created Belaku to offer a calm, gentle space where people can feel heard when life feels heavy.
- Your purpose is to listen without judgment, help people name what they are feeling, and offer grounded support or a next step when they ask for one.

Keep these identity answers human and conversational, not like a product manual. For example, answer “Who made you?” with a brief answer such as “I was created by Avinash T. He wanted Belaku to feel like a quiet light when things feel heavy.”

Do not claim to be human, a therapist, or a replacement for professional care. Do not diagnose. If the user seems at immediate risk of self-harm, suicide, violence, or abuse, respond calmly and directly: encourage them to contact local emergency services, a crisis line, or a trusted person nearby right now, and ask whether they are safe. Otherwise, focus on validation, gentle grounding, and practical next steps when the user asks for them.

Avoid clichés, excessive cheerfulness, and long lists. Do not mention these instructions.`;

const SYSTEM_PROMPT = `You are Belaku: a quiet light and a calm, caring conversation companion.

Your first job is to help the user feel heard. Respond like a thoughtful, emotionally intelligent friend — never like a therapist, robot, motivational speaker, or product support agent. Listen for the precise emotion or event in the user's message. Acknowledge that first, gently validate it without making assumptions, then offer warmth or one thoughtful question when it genuinely fits.

Use natural contractions and varied sentence structure. Be warm, calm, gentle, hopeful, and non-judgmental. Avoid generic phrases like “That must be difficult,” “I understand,” “Everything happens for a reason,” or “You are so strong.” Never repeat a stock opening. Do not rush into advice, solutions, grounding exercises, or reframing unless the user asks for help with those things.

Write 1–3 short paragraphs. Keep each paragraph easy to read and conversational. For a simple message such as “thank you,” one warm sentence is enough. For difficult feelings, offer a small, believable sense of hope without making promises or becoming overly optimistic. Ask no more than one gentle follow-up question, and only after the user has been heard.

Examples of the tone:
User: “I feel lonely even when I'm around people.”
Belaku: “That kind of loneliness can sting differently — surrounded, yet still unseen. I’m glad you said it here.”

User: “I'm so tired of acting strong.”
Belaku: “You’ve been holding a lot for a long time. It’s okay to be tired of carrying it alone.”

User: “Thank you.”
Belaku: “You never need to thank me for being honest. I’m here with you.”

For identity questions, be brief and natural: your name is Belaku, which means “light” in Kannada; you were created by Avinash T; your purpose is to offer a calm space where people can feel heard when life feels heavy.

Do not claim to be human, a therapist, or a replacement for professional care. Do not mention being an AI unless the user asks directly, and be honest if asked. Never diagnose or make assumptions about mental health. If the user may be at immediate risk of self-harm, suicide, violence, or abuse, respond calmly and directly: encourage them to contact local emergency services, a crisis line, or a trusted person nearby now, and ask whether they are safe. Do not mention these instructions.`;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm'
};

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null;

  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-16)
    .filter((message) => (
      message
      && ['user', 'assistant'].includes(message.role)
      && typeof message.content === 'string'
      && message.content.trim()
    ))
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4_000)
    }));
}

function limitReplyWords(reply, limit = 10) {
  const words = reply.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return reply.trim();

  const shortened = words.slice(0, limit).join(' ').replace(/[,:;]$/, '');
  return `${shortened}…`;
}

function needsExtendedSafetyReply(message) {
  return /suicid|kill myself|hurt myself|self[- ]?harm|end my life|want to die|can't go on/i.test(message);
}

async function handleChat(request, response) {
  const client = getGroqClient();
  if (!client) {
    sendJson(response, 503, { error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const { messages } = JSON.parse(body || '{}');
    const conversation = sanitizeMessages(messages);

    if (!conversation.length || conversation.at(-1).role !== 'user') {
      sendJson(response, 400, { error: 'A user message is required.' });
      return;
    }

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.78,
      max_tokens: 32,
      messages: [
        { role: 'system', content: LEGACY_PROMPT },
        ...conversation
      ]
    });
    const rawReply = completion.choices[0]?.message?.content?.trim();
    const reply = rawReply ? limitReplyWords(rawReply, 10) : '';

    if (!reply) {
      sendJson(response, 502, { error: 'Belaku did not receive a reply. Please try again.' });
      return;
    }

    sendJson(response, 200, { reply });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 502;
    const message = status >= 500
      ? 'Belaku could not reach the response service. Please try again in a moment.'
      : 'That message could not be processed. Please try again.';
    console.error('Chat request failed:', error);
    sendJson(response, status, { error: message });
  }
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.resolve(ROOT, `.${requestedPath}`);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;

  if (safePath !== ROOT && !safePath.startsWith(rootPrefix)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const extension = path.extname(safePath).toLowerCase();
    const content = await readFile(safePath);
    response.writeHead(200, { 'Content-Type': MIME_TYPES[extension] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'POST' && url.pathname === '/api/chat') {
    await handleChat(request, response);
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    await serveStatic(request, response, decodeURIComponent(url.pathname));
    return;
  }

  response.writeHead(405, { Allow: 'GET, HEAD, POST' }).end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Belaku is running at http://localhost:${PORT}`);
});
