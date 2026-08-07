const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE_STORAGE_KEY = 'belaku-read-aloud-voice';

// Internal engine mappings only. The UI deliberately exposes just Deepa and Tejas.
const VOICES = {
  deepa: { kokoro: 'af_heart', rate: 0.97, pitch: 1.04 },
  tejas: { kokoro: 'am_michael', rate: 0.98, pitch: 0.94 }
};

function speakerIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 10v4h3.25L12.8 18V6l-4.55 4H5Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M16.1 9.1a4.2 4.2 0 0 1 0 5.8M18.7 6.6a7.7 7.7 0 0 1 0 10.8" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/></svg>';
}

function stopIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8.1" y="8.1" width="7.8" height="7.8" rx="1" fill="currentColor"/></svg>';
}

function loadingIcon() {
  return '<span class="read-aloud-spinner" aria-hidden="true"></span>';
}

function prepareText(text) {
  return String(text || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^---[\s\S]*?---\s*/m, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+(.+)$/gm, '$1.')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/gm, '• ')
    .replace(/(\*\*|__|~~|\*|_)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class ReadAloud {
  constructor({ settingsToggle, popover, voiceOptions }) {
    this.settingsToggle = settingsToggle;
    this.popover = popover;
    this.voiceOptions = voiceOptions;
    this.selectedVoice = localStorage.getItem(VOICE_STORAGE_KEY);
    if (!VOICES[this.selectedVoice]) this.selectedVoice = 'deepa';

    this.kokoro = null;
    this.kokoroPromise = null;
    this.kokoroUnavailable = false;
    this.nativeVoices = [];
    this.active = null;
    this.popoverTimer = null;
    this.playbackId = 0;
    this.speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

    this.bindSettings();
    this.refreshNativeVoices();
    if (this.speechSupported) window.speechSynthesis.addEventListener('voiceschanged', () => this.refreshNativeVoices());
  }

  bindSettings() {
    this.updateVoiceOptions();
    this.settingsToggle.addEventListener('click', () => {
      if (this.popover.hidden) this.openSettings();
      else this.closeSettings();
    });
    this.voiceOptions.forEach((option) => option.addEventListener('click', () => {
      const choice = option.dataset.voice;
      if (!VOICES[choice]) return;
      this.selectedVoice = choice;
      localStorage.setItem(VOICE_STORAGE_KEY, choice);
      this.updateVoiceOptions();
      this.closeSettings();
    }));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.voice-settings')) this.closeSettings();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeSettings();
    });
  }

  updateVoiceOptions() {
    this.voiceOptions.forEach((option) => {
      option.setAttribute('aria-pressed', String(option.dataset.voice === this.selectedVoice));
    });
  }

  openSettings() {
    window.clearTimeout(this.popoverTimer);
    this.popover.hidden = false;
    this.settingsToggle.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => this.popover.classList.add('is-open'));
  }

  closeSettings() {
    if (this.popover.hidden) return;
    window.clearTimeout(this.popoverTimer);
    this.popover.classList.remove('is-open');
    this.settingsToggle.setAttribute('aria-expanded', 'false');
    this.popoverTimer = window.setTimeout(() => { this.popover.hidden = true; }, 180);
  }

  createButton(text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'read-aloud-button';
    this.renderButton(button, 'idle');
    button.addEventListener('click', () => this.toggle(button, text));
    return button;
  }

  renderButton(button, state) {
    const isActive = state === 'loading' || state === 'playing';
    button.classList.toggle('is-loading', state === 'loading');
    button.classList.toggle('is-playing', state === 'playing');
    button.setAttribute('aria-busy', String(state === 'loading'));
    button.setAttribute('aria-label', isActive ? 'Stop reading' : 'Read message aloud');
    button.title = isActive ? 'Stop reading' : 'Read aloud';
    button.innerHTML = state === 'loading' ? loadingIcon() : state === 'playing' ? stopIcon() : speakerIcon();
  }

  async toggle(button, originalText) {
    if (this.active?.button === button) {
      this.stop();
      return;
    }
    const text = prepareText(originalText);
    if (!text) return;

    this.stop();
    const playback = { id: ++this.playbackId, button, kind: 'loading' };
    this.active = playback;
    this.renderButton(button, 'loading');
    try {
      const tts = await this.loadKokoro();
      if (!this.isCurrent(playback)) return;
      const audioData = await tts.generate(text, { voice: VOICES[this.selectedVoice].kokoro, speed: 1 });
      if (!this.isCurrent(playback)) return;

      const audioUrl = URL.createObjectURL(audioData.toBlob());
      const audio = new Audio(audioUrl);
      playback.kind = 'kokoro';
      playback.audio = audio;
      playback.audioUrl = audioUrl;
      this.renderButton(button, 'playing');
      audio.addEventListener('ended', () => this.finish(playback), { once: true });
      audio.addEventListener('error', () => this.finish(playback), { once: true });
      await audio.play();
    } catch (error) {
      if (!this.isCurrent(playback)) return;
      console.warn('Kokoro Read Aloud is unavailable; using the browser voice instead.', error);
      this.playNative(playback, text);
    }
  }

  async loadKokoro() {
    if (this.kokoro) return this.kokoro;
    if (this.kokoroUnavailable) throw new Error('Kokoro is unavailable in this browser.');
    if (this.kokoroPromise) return this.kokoroPromise;

    this.kokoroPromise = (async () => {
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
      try {
        this.kokoro = await KokoroTTS.from_pretrained(MODEL_ID, { device: 'webgpu', dtype: 'fp32' });
      } catch (webGpuError) {
        console.warn('Kokoro WebGPU initialization failed; trying WebAssembly.', webGpuError);
        this.kokoro = await KokoroTTS.from_pretrained(MODEL_ID, { device: 'wasm', dtype: 'q8' });
      }
      return this.kokoro;
    })();

    try {
      return await this.kokoroPromise;
    } catch (error) {
      this.kokoroUnavailable = true;
      throw error;
    } finally {
      this.kokoroPromise = null;
    }
  }

  refreshNativeVoices() {
    if (this.speechSupported) this.nativeVoices = window.speechSynthesis.getVoices();
  }

  findNativeVoice() {
    const gender = this.selectedVoice === 'deepa'
      ? /female|woman|zira|susan|hazel|samantha|aria|ava|serena|libby|sonia|priya|deepa/i
      : /male|man|david|mark|daniel|alex|fred|george|rishi|tejas/i;
    const english = (voice) => /^en(?:-|_)/i.test(voice.lang);
    const indian = (voice) => /^en-IN/i.test(voice.lang) || /india|indian|en-in/i.test(`${voice.name} ${voice.lang}`);
    const matches = (voice) => gender.test(`${voice.name} ${voice.lang}`);
    return this.nativeVoices.find((voice) => indian(voice) && matches(voice))
      || this.nativeVoices.find(indian)
      || this.nativeVoices.find((voice) => english(voice) && matches(voice))
      || this.nativeVoices.find(english)
      || this.nativeVoices[0];
  }

  playNative(playback, text) {
    if (!this.speechSupported) {
      this.finish(playback);
      return;
    }
    this.refreshNativeVoices();
    const profile = VOICES[this.selectedVoice];
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.findNativeVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-IN';
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 1;
    playback.kind = 'native';
    playback.utterance = utterance;
    this.renderButton(playback.button, 'playing');
    utterance.onend = () => this.finish(playback);
    utterance.onerror = () => this.finish(playback);
    window.speechSynthesis.speak(utterance);
  }

  isCurrent(playback) {
    return this.active === playback && playback.id === this.playbackId;
  }

  finish(playback) {
    if (!this.isCurrent(playback)) return;
    if (playback.audioUrl) URL.revokeObjectURL(playback.audioUrl);
    this.renderButton(playback.button, 'idle');
    this.active = null;
  }

  stop() {
    const playback = this.active;
    this.playbackId += 1;
    this.active = null;
    if (!playback) return;
    if (playback.audio) {
      playback.audio.pause();
      playback.audio.src = '';
    }
    if (playback.audioUrl) URL.revokeObjectURL(playback.audioUrl);
    if (this.speechSupported) window.speechSynthesis.cancel();
    this.renderButton(playback.button, 'idle');
  }
}

window.BelakuReadAloud = ReadAloud;
