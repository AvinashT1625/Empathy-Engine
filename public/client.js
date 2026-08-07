const BelakuReadAloudClass = window.BelakuReadAloud;

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const imageInput = document.querySelector('#image-input');
const attachImageButton = document.querySelector('#attach-image');
const imagePreview = document.querySelector('#image-preview');
const imagePreviewImage = document.querySelector('#image-preview-image');
const imagePreviewName = document.querySelector('#image-preview-name');
const removeImageButton = document.querySelector('#remove-image');
const messages = document.querySelector('#messages');
const chatScroll = document.querySelector('#chat-scroll');
const chatWindow = document.querySelector('.chat-window');
const welcome = document.querySelector('#welcome');
const sendButton = document.querySelector('#send-button');
const clearButton = document.querySelector('#clear-chat');
const voiceSettingsToggle = document.querySelector('#voice-settings-toggle');
const voicePopover = document.querySelector('#voice-popover');
const voiceOptions = [...document.querySelectorAll('.voice-option')];
const appShell = document.querySelector('#app-shell');
const onboarding = document.querySelector('#onboarding');
const onboardingSteps = [...document.querySelectorAll('.onboarding-step')];
const onboardingBack = document.querySelector('#onboarding-back');
const onboardingNext = document.querySelector('#onboarding-next');
const onboardingProgress = [...document.querySelectorAll('.onboarding-progress i')];
const pendingRequests = new Set();
const conversation = [];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VISION_DATA_URL_BYTES = 3_700_000;
let selectedImage = null;

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

const readAloud = typeof BelakuReadAloudClass === 'function'
  ? new BelakuReadAloudClass({
    settingsToggle: voiceSettingsToggle,
    popover: voicePopover,
    voiceOptions
  })
  : null;

if (!readAloud) console.error('Read Aloud did not load. Chat remains available.');

function makeMessage(text, role, image = null) {
  chatWindow.classList.add('has-messages');
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (image) {
    bubble.classList.add('has-image');
    const imageFrame = document.createElement('div');
    imageFrame.className = 'message-image-frame';
    const photo = document.createElement('img');
    photo.className = 'message-image';
    photo.src = image.dataUrl;
    photo.alt = 'Photo shared in this conversation';
    imageFrame.appendChild(photo);
    bubble.appendChild(imageFrame);
  }
  if (text) {
    const messageText = document.createElement(image ? 'p' : 'span');
    if (image) messageText.className = 'message-text';
    messageText.textContent = text;
    bubble.appendChild(messageText);
  }

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

async function requestReply(history, image, signal) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history.slice(-16), image }),
    signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.reply) throw new Error(data.error || 'The response service is unavailable.');
  return data.reply;
}

async function sendMessage(message) {
  const userMessage = message.trim();
  const attachedImage = selectedImage;
  if (!userMessage && !attachedImage) return;
  const messageForConversation = userMessage || 'I shared a photo.';

  welcome.classList.add('is-hidden');
  makeMessage(userMessage, 'user', attachedImage);
  conversation.push({ role: 'user', content: messageForConversation });
  input.value = '';
  clearSelectedImage();
  resizeInput();
  updateSendState();

  const typing = showTyping();
  const controller = new AbortController();
  pendingRequests.add(controller);

  try {
    const reply = await requestReply(conversation, attachedImage, controller.signal);
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
  sendButton.disabled = !input.value.trim() && !selectedImage;
}

function clearSelectedImage() {
  selectedImage = null;
  imageInput.value = '';
  imagePreview.hidden = true;
  imagePreviewImage.removeAttribute('src');
  imagePreviewName.textContent = '';
  updateSendState();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function compressImageForVision(file) {
  const source = await readFileAsDataUrl(file);
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  let scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = 0.84;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_VISION_DATA_URL_BYTES) return dataUrl;
    quality -= 0.1;
    if (quality < 0.45) {
      quality = 0.78;
      scale *= 0.72;
    }
  }
  throw new Error('This photo is too detailed to prepare. Please choose a smaller image.');
}

async function selectImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Please choose a photo smaller than 10 MB.');

  attachImageButton.classList.add('is-loading');
  attachImageButton.disabled = true;
  try {
    const dataUrl = await compressImageForVision(file);
    selectedImage = { dataUrl, name: file.name, type: 'image/jpeg' };
    imagePreviewImage.src = dataUrl;
    imagePreviewName.textContent = file.name;
    imagePreview.hidden = false;
    updateSendState();
  } finally {
    attachImageButton.classList.remove('is-loading');
    attachImageButton.disabled = false;
  }
}

function updateClearState() {
  clearButton.disabled = !messages.querySelector('.message-row');
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 82)}px`;
}

const WELCOME_ANIM_MS = 1750;
const WELCOME_CLEAR_ANIM_MS = 1900;

function playWelcomeAnimation({ clearReturn = false } = {}) {
  welcome.classList.remove('is-warm-welcome', 'is-clear-return');
  void welcome.offsetWidth;
  welcome.classList.add('is-warm-welcome');
  if (clearReturn) welcome.classList.add('is-clear-return');
  window.setTimeout(() => {
    welcome.classList.remove('is-warm-welcome', 'is-clear-return');
  }, clearReturn ? WELCOME_CLEAR_ANIM_MS : WELCOME_ANIM_MS);
}

function revealWelcome({ animate = true, clearReturn = false } = {}) {
  welcome.classList.remove('is-hidden');
  if (animate) requestAnimationFrame(() => playWelcomeAnimation({ clearReturn }));
}

function clearConversation() {
  if (chatWindow.classList.contains('is-clearing')) return;
  readAloud?.stop();
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
  conversation.length = 0;
  clearSelectedImage();

  const rows = [...messages.querySelectorAll('.message-row')];
  if (!rows.length) {
    revealWelcome({ animate: false });
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
    revealWelcome({ clearReturn: true });
    chatScroll.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();
  }, 680);
  window.setTimeout(() => chatWindow.classList.remove('is-clearing'), 700);
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
attachImageButton.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', async () => {
  try {
    await selectImage(imageInput.files?.[0]);
  } catch (error) {
    clearSelectedImage();
    window.alert(error.message || 'That photo could not be attached.');
  }
});
removeImageButton.addEventListener('click', clearSelectedImage);
document.querySelectorAll('.suggestions button').forEach((button) => {
  button.addEventListener('click', () => sendMessage(button.textContent));
});
clearButton.addEventListener('click', clearConversation);
document.body.classList.remove('dark-mode');

let onboardingStep = 0;
let hasEnteredBelaku = false;

const onboardingCopy = [
  {
    title: 'A quiet light when things feel heavy.',
    body: "Belaku is a calm space to say what's on your mind, at your own pace and without judgment."
  },
  {
    title: "Bring the things you haven't known where to put.",
    body: 'Loneliness, heartbreak, confusion, a difficult day, or simply a thought you need to say out loud - start anywhere.'
  },
  {
    title: 'Words are enough. A photo can help tell the story too.',
    body: 'Attach one photo up to 10 MB, add the context behind it, or use the speaker icon to hear a reply aloud.'
  },
  {
    title: 'You deserve to feel heard.',
    body: "Belaku is a supportive conversation companion, not a therapist or emergency service. If you're in immediate danger, please contact local emergency help or someone you trust."
  }
];

function repairOnboardingCopy() {
  onboardingSteps.forEach((step, index) => {
    const copy = onboardingCopy[index];
    const heading = step.querySelector('h1, h2');
    const paragraphs = step.querySelectorAll('p');
    if (heading) heading.textContent = copy.title;
    if (paragraphs[1]) paragraphs[1].textContent = copy.body;
  });
}

function updateOnboarding() {
  onboardingSteps.forEach((step, index) => {
    const active = index === onboardingStep;
    step.hidden = !active;
    step.classList.toggle('is-active', active);
  });
  onboardingProgress.forEach((dot, index) => dot.classList.toggle('is-active', index <= onboardingStep));
  onboardingBack.disabled = onboardingStep === 0;
  onboardingNext.innerHTML = onboardingStep === onboardingSteps.length - 1
    ? 'Start talking <span aria-hidden="true">&rarr;</span>'
    : 'Next <span aria-hidden="true">&rarr;</span>';
}

function closeOnboarding() {
  if (hasEnteredBelaku) return;
  hasEnteredBelaku = true;
  onboarding.classList.add('is-leaving');
  window.setTimeout(() => {
    onboarding.hidden = true;
    appShell.classList.add('is-revealing');
    appShell.inert = false;
    appShell.removeAttribute('aria-hidden');
    playWelcomeAnimation();
    window.setTimeout(() => {
      appShell.classList.remove('is-revealing');
      appShell.classList.add('is-revealed');
    }, WELCOME_ANIM_MS);
    window.setTimeout(() => input.focus(), 720);
  }, 360);
}

onboardingBack.addEventListener('click', () => {
  if (onboardingStep === 0) return;
  onboardingStep -= 1;
  updateOnboarding();
});

onboardingNext.addEventListener('click', () => {
  if (onboardingStep === onboardingSteps.length - 1) {
    closeOnboarding();
    return;
  }
  onboardingStep += 1;
  updateOnboarding();
});

repairOnboardingCopy();
updateOnboarding();

const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const cursorAmbient = document.querySelector('.cursor-ambient');
const cursorMotes = [...document.querySelectorAll('.cursor-mote')];
let ringX = -100;
let ringY = -100;
let dotX = -100;
let dotY = -100;
let mouseX = -100;
let mouseY = -100;
let moteFrame;
let ringOffsetX = 0;
let ringOffsetY = 0;
let cursorClickTimer;
let interfaceAudioContext;

function playGlassClick() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    interfaceAudioContext ||= new AudioContextClass();
    if (interfaceAudioContext.state === 'suspended') interfaceAudioContext.resume();

    const now = interfaceAudioContext.currentTime;
    const oscillator = interfaceAudioContext.createOscillator();
    const gain = interfaceAudioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(680, now);
    oscillator.frequency.exponentialRampToValueAtTime(480, now + 0.075);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    oscillator.connect(gain).connect(interfaceAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.11);
  } catch {
    // Interface sound is optional; browser audio restrictions should never affect controls.
  }
}

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
  if (!moteFrame) moteFrame = requestAnimationFrame(moveCursorMotes);
});

window.addEventListener('pointerdown', () => {
  window.clearTimeout(cursorClickTimer);
  document.body.classList.remove('cursor-click');
  requestAnimationFrame(() => document.body.classList.add('cursor-click'));
});

window.addEventListener('pointerup', () => {
  window.clearTimeout(cursorClickTimer);
  cursorClickTimer = window.setTimeout(() => document.body.classList.remove('cursor-click'), 780);
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button && !button.disabled) playGlassClick();
});

function animateCursor() {
  const isClicking = document.body.classList.contains('cursor-click');
  const isHovering = document.body.classList.contains('cursor-hover');
  dotX += (mouseX - dotX) * 0.36;
  dotY += (mouseY - dotY) * 0.36;
  const ringTargetX = isClicking ? dotX : mouseX;
  const ringTargetY = isClicking ? dotY : mouseY;
  const ringSpeed = isClicking ? 0.26 : 0.085;
  const targetOffset = isHovering && !isClicking ? 8 : 0;
  ringX += (ringTargetX - ringX) * ringSpeed;
  ringY += (ringTargetY - ringY) * ringSpeed;
  ringOffsetX += (targetOffset - ringOffsetX) * (isClicking ? 0.3 : 0.12);
  ringOffsetY += (targetOffset - ringOffsetY) * (isClicking ? 0.3 : 0.12);
  cursorDot.style.left = `${dotX}px`;
  cursorDot.style.top = `${dotY}px`;
  cursorRing.style.left = `${ringX + ringOffsetX}px`;
  cursorRing.style.top = `${ringY + ringOffsetY}px`;
  cursorAmbient.style.setProperty('--ambient-x', `${ringX}px`);
  cursorAmbient.style.setProperty('--ambient-y', `${ringY}px`);
  requestAnimationFrame(animateCursor);
}

document.querySelectorAll('button, textarea, .developer-credit, .developer-credit a').forEach(registerCursorHover);
window.addEventListener('beforeunload', () => readAloud?.stop());
animateCursor();

let selectionPulseTimer;
document.addEventListener('selectionchange', () => {
  const hasSelection = Boolean(window.getSelection()?.toString().trim());
  document.body.classList.toggle('has-text-selection', hasSelection);
  if (!hasSelection) return;
  document.body.classList.remove('selection-pulse');
  requestAnimationFrame(() => document.body.classList.add('selection-pulse'));
  window.clearTimeout(selectionPulseTimer);
  selectionPulseTimer = window.setTimeout(() => document.body.classList.remove('selection-pulse'), 520);
});

let scrollAnimationTimer;
let previousChatScrollTop = 0;
chatScroll.addEventListener('scroll', () => {
  const nextScrollTop = chatScroll.scrollTop;
  chatWindow.dataset.scrollDirection = nextScrollTop >= previousChatScrollTop ? 'down' : 'up';
  previousChatScrollTop = nextScrollTop;
  chatWindow.classList.remove('is-scrolling');
  window.requestAnimationFrame(() => chatWindow.classList.add('is-scrolling'));
  window.clearTimeout(scrollAnimationTimer);
  scrollAnimationTimer = window.setTimeout(() => chatWindow.classList.remove('is-scrolling'), 530);
});
