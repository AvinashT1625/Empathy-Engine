const { BelakuReadAloud: ReadAloud } = window;

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const messages = document.querySelector('#messages');
const chatScroll = document.querySelector('#chat-scroll');
const chatWindow = document.querySelector('.chat-window');
const welcome = document.querySelector('#welcome');
const sendButton = document.querySelector('#send-button');
const clearButton = document.querySelector('#clear-chat');
const themeToggle = document.querySelector('.theme-toggle');
const voiceSettingsToggle = document.querySelector('#voice-settings-toggle');
const voicePopover = document.querySelector('#voice-popover');
const voiceOptions = [...document.querySelectorAll('.voice-option')];
const pendingRequests = new Set();
const conversation = [];

const responses = [
  "That sounds like a lot to be carrying. I’m really glad you chose to say it out loud here. What part feels the heaviest right now?",
  "I hear how much this has affected you. You don’t need to have the right words for it — we can take this one small piece at a time.",
  "I’m sorry you’re going through that. It makes sense that it hurts; your feelings are not an overreaction. What would feel most supportive in this moment?",
  "Thank you for trusting me with that. Sometimes the kindest next step is simply letting yourself feel it before trying to solve it all.",
  "Being rejected or losing someone can shake the way we see ourselves. But what happened isn’t a measure of your worth. I’m here — tell me more."
];

function getResponse(message) {
  const words = message.toLowerCase();
  if (/suicid|kill myself|hurt myself|self harm|end my life/.test(words)) {
    return "I’m really sorry you’re in this much pain. Please don’t sit with this alone right now — contact local emergency services, a crisis line, or someone you trust and tell them you need support. If you’re in the U.S. or Canada, call or text 988. Are you somewhere safe at this moment?";
  }
  if (/break.?up|rejected|rejection|left me|ghosted|relationship/.test(words)) {
    return "Rejection can make everything feel personal, especially when you cared deeply. It doesn’t erase what you brought to the connection, though. What’s been the hardest moment since it happened?";
  }
  if (/trauma|abuse|abused|assault|trigger/.test(words)) {
    return "I’m so sorry that happened to you. You deserved safety and care. We can go slowly here — you only need to share what feels okay. What would help you feel a little more grounded right now?";
  }
  if (/hurt|sad|lonely|anxious|anxiety|overwhelm|crying/.test(words)) {
    return "That sounds painful, and you don’t have to minimize it. Let’s slow down for a second: what do you need most right now — to be heard, to make sense of it, or to find one small next step?";
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

const readAloud = typeof ReadAloud === 'function'
  ? new ReadAloud({
    settingsToggle: voiceSettingsToggle,
    popover: voicePopover,
    voiceOptions
  })
  : null;

if (!readAloud) console.error('Read Aloud did not load. Chat remains available.');

function makeMessage(text, role) {
  chatWindow.classList.add('has-messages');
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  if (role === 'ai' && readAloud) {
    const readButton = readAloud.createButton(text);
    bubble.appendChild(readButton);
    registerCursorHover(readButton);
  }

  row.appendChild(bubble);
  messages.appendChild(row);
  updateClearState();
  requestAnimationFrame(() => chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' }));
  return row;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'message-row ai typing';
  row.innerHTML = '<div class="bubble"><i></i><i></i><i></i></div>';
  messages.appendChild(row);
  requestAnimationFrame(() => chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' }));
  return row;
}

async function requestReply(history, signal) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history.slice(-16) }),
    signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.reply) throw new Error(data.error || 'The response service is unavailable.');
  return data.reply;
}

async function sendMessage(message) {
  const userMessage = message.trim();
  if (!userMessage) return;

  welcome.classList.add('is-hidden');
  makeMessage(userMessage, 'user');
  conversation.push({ role: 'user', content: userMessage });
  input.value = '';
  resizeInput();
  updateSendState();

  const typing = showTyping();
  const controller = new AbortController();
  pendingRequests.add(controller);

  try {
    const reply = await requestReply(conversation, controller.signal);
    if (!typing.isConnected || chatWindow.classList.contains('is-clearing')) return;
    typing.remove();
    conversation.push({ role: 'assistant', content: reply });
    makeMessage(reply, 'ai');
  } catch (error) {
    if (error.name === 'AbortError' || !typing.isConnected) return;
    typing.remove();
    makeMessage('Connection failed. Please try again.', 'ai');
  } finally {
    pendingRequests.delete(controller);
  }
}

function updateSendState() {
  sendButton.disabled = !input.value.trim();
}

function updateClearState() {
  clearButton.disabled = !messages.querySelector('.message-row');
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 82)}px`;
}

function clearConversation() {
  if (chatWindow.classList.contains('is-clearing')) return;
  readAloud?.stop();
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
  conversation.length = 0;

  const rows = [...messages.querySelectorAll('.message-row')];
  if (!rows.length) {
    welcome.classList.remove('is-hidden');
    input.focus();
    return;
  }

  chatWindow.classList.add('is-clearing');
  rows.forEach((row, index) => {
    row.style.setProperty('--clear-delay', `${Math.min(index * 35, 210)}ms`);
    row.classList.add('is-clearing');
  });

  window.setTimeout(() => {
    messages.replaceChildren();
    chatWindow.classList.remove('has-messages');
    updateClearState();
    welcome.classList.remove('is-hidden');
    chatScroll.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();
  }, 680);
  window.setTimeout(() => chatWindow.classList.remove('is-clearing'), 700);
}

function setTheme(theme) {
  document.body.classList.add('theme-transition');
  document.body.classList.toggle('dark-mode', theme === 'dark');
  localStorage.setItem('quiet-space-theme', theme);
  window.setTimeout(() => document.body.classList.remove('theme-transition'), 600);
}

function registerCursorHover(item) {
  item.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  item.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});
input.addEventListener('input', () => {
  updateSendState();
  resizeInput();
});
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
document.querySelectorAll('.suggestions button').forEach((button) => {
  button.addEventListener('click', () => sendMessage(button.textContent));
});
clearButton.addEventListener('click', clearConversation);
themeToggle.addEventListener('click', () => {
  setTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('quiet-space-theme');
if (savedTheme) setTheme(savedTheme);
else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const cursorAmbient = document.querySelector('.cursor-ambient');
const cursorMotes = [...document.querySelectorAll('.cursor-mote')];
let ringX = -100;
let ringY = -100;
let mouseX = -100;
let mouseY = -100;
let moteFrame;

function moveCursorMotes() {
  moteFrame = undefined;
  cursorMotes.forEach((mote, index) => {
    const originX = window.innerWidth * Number(mote.dataset.x);
    const originY = window.innerHeight * Number(mote.dataset.y);
    const distanceX = originX - mouseX;
    const distanceY = originY - mouseY;
    const distance = Math.hypot(distanceX, distanceY) || 1;
    const force = Math.max(0, 1 - distance / 210) * (20 + index * 2);
    const offsetX = (distanceX / distance) * force;
    const offsetY = (distanceY / distance) * force;
    mote.style.transform = `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0) rotate(${45 + force * .7}deg)`;
  });
}

window.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  document.body.classList.add('cursor-active');
  cursorDot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
  if (!moteFrame) moteFrame = requestAnimationFrame(moveCursorMotes);
});

function animateCursor() {
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  cursorRing.style.transform = `translate(${ringX - 15}px, ${ringY - 15}px)`;
  cursorAmbient.style.setProperty('--ambient-x', `${ringX}px`);
  cursorAmbient.style.setProperty('--ambient-y', `${ringY}px`);
  requestAnimationFrame(animateCursor);
}

document.querySelectorAll('button, textarea, .developer-credit, .developer-credit a').forEach(registerCursorHover);
window.addEventListener('beforeunload', () => readAloud?.stop());
animateCursor();

let scrollAnimationTimer;
chatScroll.addEventListener('scroll', () => {
  chatWindow.classList.remove('is-scrolling');
  window.requestAnimationFrame(() => chatWindow.classList.add('is-scrolling'));
  window.clearTimeout(scrollAnimationTimer);
  scrollAnimationTimer = window.setTimeout(() => chatWindow.classList.remove('is-scrolling'), 430);
});
