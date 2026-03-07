const STORAGE_KEY = "english-app-v1";
const TOTAL_SECONDS = 60;

const defaultState = {
  activeTab: "wpm",
  targetText: "Learning English every day helps me communicate better with people around the world.",
  speechText: "Today is a great day to practice English pronunciation and listening.",
  rate: "1",
  pitch: "1",
  shadowLang: "en-US",
  shadowTranscript: "",
  passages: [],
  speechLang: "en-US",
  transcriptText: "",
  remainSeconds: TOTAL_SECONDS,
  timerRunning: false,
  timerEndAt: 0
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (error) {
    return { ...defaultState };
  }
}

let appState = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// ----- Tab UI -----
const menuToggle = document.getElementById("menuToggle");
const tabsNav = document.getElementById("tabMenu");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const panels = Array.from(document.querySelectorAll(".panel"));
const mobileMenuMedia = window.matchMedia("(max-width: 640px)");

function setMenuOpen(open) {
  if (!tabsNav || !menuToggle) return;
  tabsNav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
}

function closeMenuIfMobile() {
  if (mobileMenuMedia.matches) setMenuOpen(false);
}

if (menuToggle && tabsNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });
  mobileMenuMedia.addEventListener("change", (event) => {
    if (!event.matches) {
      setMenuOpen(false);
    }
  });
}

function setActiveTab(tab, focusButton) {
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focusButton) button.focus();
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === tab;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  appState.activeTab = tab;
  saveState();
}

tabButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    setActiveTab(btn.dataset.tab, false);
    closeMenuIfMobile();
  });
  btn.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabButtons.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabButtons.length - 1;
    setActiveTab(tabButtons[next].dataset.tab, true);
  });
});

setActiveTab(appState.activeTab, false);
closeMenuIfMobile();

// ----- WPM App -----
const targetText = document.getElementById("targetText");
const wordCountValue = document.getElementById("wordCountValue");
const wpmSeconds = document.getElementById("wpmSeconds");
const wpmValue = document.getElementById("wpmValue");
const wpmStatus = document.getElementById("wpmStatus");
const wpmStart = document.getElementById("wpmStart");
const wpmStop = document.getElementById("wpmStop");
const wpmReset = document.getElementById("wpmReset");

targetText.value = appState.targetText;

let wpmStartedAt = 0;
let wpmElapsedMs = 0;
let wpmTimerId = null;

function countWords(text) {
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

function elapsedSeconds() {
  const runningMs = wpmStartedAt ? Date.now() - wpmStartedAt : 0;
  return Math.floor((wpmElapsedMs + runningMs) / 1000);
}

function stopWpmTimer() {
  if (wpmTimerId) clearInterval(wpmTimerId);
  wpmTimerId = null;
  if (wpmStartedAt) {
    wpmElapsedMs += Date.now() - wpmStartedAt;
    wpmStartedAt = 0;
  }
}

function renderWpm() {
  const words = countWords(targetText.value);
  const elapsedSec = elapsedSeconds();
  const wpm = elapsedSec > 0 ? words / (elapsedSec / 60) : 0;
  wordCountValue.textContent = String(words);
  wpmSeconds.textContent = String(elapsedSec);
  wpmValue.textContent = Number.isFinite(wpm) ? wpm.toFixed(1) : "0.0";
}

targetText.addEventListener("input", () => {
  appState.targetText = targetText.value;
  saveState();
  renderWpm();
});

wpmStart.addEventListener("click", () => {
  if (wpmStartedAt) return;
  wpmStartedAt = Date.now();
  wpmStatus.textContent = "Measuring...";
  if (wpmTimerId) clearInterval(wpmTimerId);
  wpmTimerId = setInterval(renderWpm, 200);
  renderWpm();
});

wpmStop.addEventListener("click", () => {
  if (!wpmStartedAt) return;
  stopWpmTimer();
  renderWpm();
  wpmStatus.textContent = "Stopped. Press Start to resume.";
});

wpmReset.addEventListener("click", () => {
  stopWpmTimer();
  wpmElapsedMs = 0;
  renderWpm();
  wpmStatus.textContent = "Reset complete. Press Start to begin.";
});

renderWpm();

// ----- Text to Speech App -----
const voiceSelect = document.getElementById("voiceSelect");
const speechText = document.getElementById("speechText");
const rateRange = document.getElementById("rateRange");
const pitchRange = document.getElementById("pitchRange");
const rateLabel = document.getElementById("rateLabel");
const pitchLabel = document.getElementById("pitchLabel");
const ttsStatus = document.getElementById("ttsStatus");
const speakBtn = document.getElementById("speakBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");
const shadowToggle = document.getElementById("shadowToggle");
const shadowPanel = document.getElementById("shadowPanel");
const shadowLang = document.getElementById("shadowLang");
const shadowStart = document.getElementById("shadowStart");
const shadowStop = document.getElementById("shadowStop");
const shadowPlayMine = document.getElementById("shadowPlayMine");
const shadowClear = document.getElementById("shadowClear");
const shadowStatus = document.getElementById("shadowStatus");
const shadowModelText = document.getElementById("shadowModelText");
const shadowTranscriptText = document.getElementById("shadowTranscriptText");
const shadowAudio = document.getElementById("shadowAudio");

speechText.value = appState.speechText;
rateRange.value = appState.rate;
pitchRange.value = appState.pitch;
rateLabel.textContent = appState.rate;
pitchLabel.textContent = appState.pitch;
shadowLang.value = appState.shadowLang || "en-US";
shadowModelText.value = speechText.value;
let shadowFinalTranscript = appState.shadowTranscript || "";
shadowTranscriptText.value = shadowFinalTranscript;

let voices = [];
const ShadowSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let shadowRecognition = null;
let shadowMediaRecorder = null;
let shadowChunks = [];
let shadowStream = null;
let shadowBlobUrl = "";
let shadowRunning = false;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
  if (!voices.length) {
    const option = document.createElement("option");
    option.textContent = "No voices found";
    voiceSelect.appendChild(option);
  }
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
} else {
  ttsStatus.textContent = "This browser does not support text-to-speech.";
  speakBtn.disabled = true;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
}

function createUtterance() {
  const utterance = new SpeechSynthesisUtterance(speechText.value);
  utterance.rate = Number(rateRange.value);
  utterance.pitch = Number(pitchRange.value);
  const selectedVoice = voices[Number(voiceSelect.value)];
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.onstart = () => {
    ttsStatus.textContent = "Playing...";
  };
  utterance.onend = () => {
    ttsStatus.textContent = "Playback finished.";
  };
  utterance.onerror = () => {
    ttsStatus.textContent = "A speech error occurred.";
  };
  return utterance;
}

function setShadowPanelOpen(open) {
  shadowPanel.hidden = !open;
  shadowToggle.setAttribute("aria-expanded", String(open));
  shadowToggle.textContent = open ? "Disable Shadowing Mode" : "Enable Shadowing Mode";
}

function setShadowButtons(running) {
  shadowStart.disabled = running;
  shadowStop.disabled = !running;
}

function persistShadowState() {
  appState.shadowLang = shadowLang.value;
  appState.shadowTranscript = shadowFinalTranscript;
  saveState();
}

function renderShadowTranscript(interimText = "") {
  const merged = [shadowFinalTranscript.trim(), interimText.trim()].filter(Boolean).join("\n");
  shadowTranscriptText.value = merged;
}

function releaseShadowStream() {
  if (!shadowStream) return;
  shadowStream.getTracks().forEach((track) => track.stop());
  shadowStream = null;
}

function clearShadowAudio() {
  if (shadowBlobUrl) {
    URL.revokeObjectURL(shadowBlobUrl);
    shadowBlobUrl = "";
  }
  shadowAudio.removeAttribute("src");
  shadowAudio.hidden = true;
  shadowPlayMine.disabled = true;
}

function stopShadowRecognition() {
  if (!shadowRecognition) return;
  shadowRunning = false;
  try {
    shadowRecognition.stop();
  } catch (error) {
    // Ignore stop errors when recognition is already stopped.
  }
}

function stopShadowing(statusText = "Shadowing stopped.") {
  const wasRunning = shadowRunning;
  shadowRunning = false;
  window.speechSynthesis.cancel();
  if (shadowMediaRecorder && shadowMediaRecorder.state !== "inactive") {
    shadowMediaRecorder.stop();
  } else {
    releaseShadowStream();
  }
  stopShadowRecognition();
  setShadowButtons(false);
  if (statusText) shadowStatus.textContent = statusText;
  if (wasRunning) persistShadowState();
}

if (ShadowSpeechRecognition) {
  shadowRecognition = new ShadowSpeechRecognition();
  shadowRecognition.continuous = true;
  shadowRecognition.interimResults = true;
  shadowRecognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript.trim();
      if (!text) continue;
      if (event.results[i].isFinal) {
        shadowFinalTranscript = [shadowFinalTranscript.trim(), text].filter(Boolean).join("\n");
      } else {
        interimTranscript = [interimTranscript, text].filter(Boolean).join(" ");
      }
    }
    renderShadowTranscript(interimTranscript);
    persistShadowState();
  };
  shadowRecognition.onend = () => {
    if (!shadowRunning) {
      setShadowButtons(false);
      return;
    }
    try {
      shadowRecognition.start();
    } catch (error) {
      shadowRunning = false;
      setShadowButtons(false);
      shadowStatus.textContent = "Transcription could not continue automatically.";
    }
  };
  shadowRecognition.onerror = (event) => {
    shadowStatus.textContent = getTranscriptionErrorMessage(event.error);
  };
}

speakBtn.addEventListener("click", () => {
  if (!speechText.value.trim()) {
    ttsStatus.textContent = "Please enter text to read.";
    return;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(createUtterance());
});

pauseBtn.addEventListener("click", () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    ttsStatus.textContent = "Paused";
  }
});

resumeBtn.addEventListener("click", () => {
  window.speechSynthesis.resume();
  ttsStatus.textContent = "Resumed";
});

stopBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  ttsStatus.textContent = "Stopped";
});

speechText.addEventListener("input", () => {
  appState.speechText = speechText.value;
  shadowModelText.value = speechText.value;
  saveState();
});

rateRange.addEventListener("input", () => {
  rateLabel.textContent = rateRange.value;
  appState.rate = rateRange.value;
  saveState();
});

pitchRange.addEventListener("input", () => {
  pitchLabel.textContent = pitchRange.value;
  appState.pitch = pitchRange.value;
  saveState();
});

shadowToggle.addEventListener("click", () => {
  setShadowPanelOpen(shadowPanel.hidden);
});

shadowStart.addEventListener("click", async () => {
  if (!speechText.value.trim()) {
    shadowStatus.textContent = "Please enter text to read before shadowing.";
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    shadowStatus.textContent = "This browser does not support audio recording.";
    return;
  }
  if (!window.MediaRecorder) {
    shadowStatus.textContent = "This browser does not support the recording API.";
    return;
  }

  shadowFinalTranscript = "";
  renderShadowTranscript();
  persistShadowState();
  shadowModelText.value = speechText.value;
  clearShadowAudio();

  try {
    shadowStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    shadowMediaRecorder = new MediaRecorder(shadowStream);
    shadowChunks = [];
    shadowMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) shadowChunks.push(event.data);
    };
    shadowMediaRecorder.onstop = () => {
      const blob = new Blob(shadowChunks, { type: shadowMediaRecorder.mimeType || "audio/webm" });
      clearShadowAudio();
      shadowBlobUrl = URL.createObjectURL(blob);
      shadowAudio.src = shadowBlobUrl;
      shadowAudio.hidden = false;
      shadowPlayMine.disabled = false;
      releaseShadowStream();
    };
    shadowMediaRecorder.start();
  } catch (error) {
    releaseShadowStream();
    shadowStatus.textContent = "Microphone permission is required for shadowing.";
    return;
  }

  shadowRunning = true;
  setShadowButtons(true);
  shadowStatus.textContent = "Shadowing started. Listening and recording...";

  if (shadowRecognition) {
    shadowRecognition.lang = shadowLang.value;
    try {
      shadowRecognition.start();
    } catch (error) {
      shadowStatus.textContent = "Transcription could not start. Recording continues. Check microphone and browser speech-recognition settings.";
    }
  } else {
    shadowStatus.textContent = "Recording started. Speech recognition is not supported in this browser.";
  }

  window.speechSynthesis.cancel();
  const shadowUtterance = createUtterance();
  shadowUtterance.onend = () => {
    stopShadowing("Shadowing finished.");
  };
  shadowUtterance.onerror = () => {
    stopShadowing("Playback error occurred during shadowing.");
  };
  window.speechSynthesis.speak(shadowUtterance);
});

shadowStop.addEventListener("click", () => {
  stopShadowing("Shadowing stopped.");
});

shadowPlayMine.addEventListener("click", () => {
  if (!shadowBlobUrl) return;
  shadowAudio.currentTime = 0;
  shadowAudio.play();
});

shadowClear.addEventListener("click", () => {
  shadowFinalTranscript = "";
  renderShadowTranscript();
  persistShadowState();
  clearShadowAudio();
  shadowStatus.textContent = "Shadowing result cleared.";
});

shadowLang.addEventListener("change", () => {
  persistShadowState();
  if (shadowRunning && shadowRecognition) {
    stopShadowRecognition();
    shadowRunning = true;
    shadowRecognition.lang = shadowLang.value;
    try {
      shadowRecognition.start();
    } catch (error) {
      shadowStatus.textContent = "Language change failed while transcribing.";
    }
  }
});

setShadowPanelOpen(false);
setShadowButtons(false);
shadowPlayMine.disabled = true;

// ----- 60-min Timer + Recorder -----
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const timerStart = document.getElementById("timerStart");
const timerPause = document.getElementById("timerPause");
const timerReset = document.getElementById("timerReset");

const recordClear = document.getElementById("recordClear");
const recordStatus = document.getElementById("recordStatus");
const recordings = document.getElementById("recordings");
const speechLang = document.getElementById("speechLang");
const transcribeCopy = document.getElementById("transcribeCopy");
const transcribeClear = document.getElementById("transcribeClear");
const transcribeStatus = document.getElementById("transcribeStatus");
const transcriptText = document.getElementById("transcriptText");

let remainSeconds = Number(appState.remainSeconds || TOTAL_SECONDS);
if (!Number.isFinite(remainSeconds) || remainSeconds < 0 || remainSeconds > TOTAL_SECONDS) {
  remainSeconds = TOTAL_SECONDS;
}
let timerEndAt = Number(appState.timerEndAt || 0);
let timerRunning = Boolean(appState.timerRunning);
let timerFrameId = null;
let lastTimerPersistAt = 0;
const TIMER_PERSIST_INTERVAL_MS = 300;

function formatTime(totalSec) {
  return Math.max(0, totalSec).toFixed(2);
}

function renderTimer() {
  timerDisplay.textContent = formatTime(Math.max(0, remainSeconds));
}

function persistTimer() {
  appState.remainSeconds = remainSeconds;
  appState.timerRunning = timerRunning;
  appState.timerEndAt = timerEndAt;
  saveState();
}

function stopTimerLoop() {
  if (timerFrameId) cancelAnimationFrame(timerFrameId);
  timerFrameId = null;
}

function startTimerLoop() {
  stopTimerLoop();
  lastTimerPersistAt = 0;
  const tick = () => {
    if (!timerRunning) return;
    remainSeconds = Math.max(0, (timerEndAt - Date.now()) / 1000);
    renderTimer();
    const now = Date.now();
    if (now - lastTimerPersistAt >= TIMER_PERSIST_INTERVAL_MS) {
      persistTimer();
      lastTimerPersistAt = now;
    }
    if (remainSeconds <= 0) {
      timerRunning = false;
      stopTimerLoop();
      timerStatus.textContent = "60 seconds complete";
      stopRecordingIfNeeded();
      stopTranscription();
      persistTimer();
      alert("60 seconds have passed.");
      return;
    }
    timerFrameId = requestAnimationFrame(tick);
  };
  timerFrameId = requestAnimationFrame(tick);
}

if (timerRunning) {
  remainSeconds = Math.max(0, (timerEndAt - Date.now()) / 1000);
  if (remainSeconds <= 0) {
    timerRunning = false;
    remainSeconds = 0;
    timerStatus.textContent = "60 seconds complete";
  } else {
    timerStatus.textContent = "Timer running";
    startTimerLoop();
  }
}
renderTimer();
persistTimer();

timerStart.addEventListener("click", async () => {
  if (timerRunning || remainSeconds <= 0) return;
  timerRunning = true;
  timerEndAt = Date.now() + remainSeconds * 1000;
  timerStatus.textContent = "Timer running";
  persistTimer();
  startTimerLoop();
  await startRecording();
  startTranscription();
});

timerPause.addEventListener("click", () => {
  if (!timerRunning) return;
  remainSeconds = Math.max(0, (timerEndAt - Date.now()) / 1000);
  timerRunning = false;
  stopTimerLoop();
  renderTimer();
  timerStatus.textContent = "Timer stopped";
  persistTimer();
  stopRecordingIfNeeded();
  stopTranscription();
});

timerReset.addEventListener("click", () => {
  timerRunning = false;
  stopTimerLoop();
  remainSeconds = TOTAL_SECONDS;
  timerEndAt = 0;
  renderTimer();
  timerStatus.textContent = "Reset to 60 seconds";
  persistTimer();
  stopRecordingIfNeeded();
  stopTranscription();
});

let mediaRecorder = null;
let chunks = [];
let currentStream = null;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let speechRecognition = null;
let transcriptionRunning = false;
let finalTranscript = appState.transcriptText || "";

transcriptText.value = finalTranscript;
speechLang.value = appState.speechLang || "en-US";

function updateRecordClearButton() {
  recordClear.disabled = recordings.children.length === 0;
}

function renderTranscript(interimText = "") {
  const merged = [finalTranscript.trim(), interimText.trim()].filter(Boolean).join("\n");
  transcriptText.value = merged;
}

function persistTranscript() {
  appState.transcriptText = finalTranscript;
  saveState();
}

function stopTranscription() {
  if (!speechRecognition || !transcriptionRunning) return;
  transcriptionRunning = false;
  try {
    speechRecognition.stop();
  } catch (error) {
    // Ignore stop errors when recognition is already stopped.
  }
}

function getTranscriptionErrorMessage(errorCode) {
  if (errorCode === "not-allowed") {
    return "Microphone permission is required for transcription.";
  }
  if (errorCode === "service-not-allowed") {
    return "Speech recognition service is blocked in this browser. Try Chrome and confirm microphone access is allowed for this site.";
  }
  if (errorCode === "network") {
    return "Network error while using speech recognition service.";
  }
  return `Transcription error: ${errorCode}`;
}

function startTranscription() {
  if (!speechRecognition) {
    transcribeStatus.textContent = "This browser does not support speech recognition.";
    return;
  }
  if (transcriptionRunning) return;
  transcriptionRunning = true;
  transcribeStatus.textContent = "Listening and transcribing...";
  speechRecognition.lang = speechLang.value;
  try {
    speechRecognition.start();
  } catch (error) {
    transcriptionRunning = false;
    transcribeStatus.textContent = "Transcription could not start. Please retry and check browser microphone settings.";
  }
}

function releaseCurrentStream() {
  if (!currentStream) return;
  currentStream.getTracks().forEach((track) => track.stop());
  currentStream = null;
}

function stopRecordingIfNeeded() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    return;
  }
  releaseCurrentStream();
}

function addRecording(audioBlob) {
  const url = URL.createObjectURL(audioBlob);
  const item = document.createElement("div");
  item.className = "record-item";

  const head = document.createElement("div");
  head.className = "record-head";

  const title = document.createElement("span");
  title.className = "record-title";
  title.textContent = `Recording ${new Date().toLocaleString("en-US")}`;

  const actions = document.createElement("div");
  actions.className = "btn-row";

  const download = document.createElement("a");
  download.href = url;
  download.download = `recording-${Date.now()}.webm`;
  download.textContent = "Download";
  download.className = "tab-btn";
  download.style.textDecoration = "none";
  download.style.display = "inline-flex";
  download.style.alignItems = "center";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "danger small";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => {
    URL.revokeObjectURL(url);
    item.remove();
    updateRecordClearButton();
  });

  actions.append(download, remove);
  head.append(title, actions);

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  item.append(head, audio);
  recordings.prepend(item);
  updateRecordClearButton();
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    recordStatus.textContent = "This browser does not support audio recording.";
    return;
  }
  if (!window.MediaRecorder) {
    recordStatus.textContent = "This browser does not support the recording API.";
    return;
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(currentStream);
    chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
      addRecording(blob);
      releaseCurrentStream();
      recordStatus.textContent = "Recording saved.";
    };
    mediaRecorder.start();
    recordStatus.textContent = "Recording...";
  } catch (error) {
    releaseCurrentStream();
    recordStatus.textContent = "Microphone permission is required. Please check browser settings.";
  }
}

recordClear.addEventListener("click", () => {
  const items = Array.from(recordings.querySelectorAll("audio"));
  items.forEach((audio) => {
    if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
  });
  recordings.innerHTML = "";
  updateRecordClearButton();
  recordStatus.textContent = "Recording list cleared.";
});

if (SpeechRecognition) {
  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;

  speechRecognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript.trim();
      if (!text) continue;
      if (event.results[i].isFinal) {
        finalTranscript = [finalTranscript.trim(), text].filter(Boolean).join("\n");
      } else {
        interimTranscript = [interimTranscript, text].filter(Boolean).join(" ");
      }
    }
    renderTranscript(interimTranscript);
    persistTranscript();
  };

  speechRecognition.onend = () => {
    if (transcriptionRunning) {
      try {
        speechRecognition.start();
      } catch (error) {
        transcriptionRunning = false;
        transcribeStatus.textContent = "Transcription stopped and could not auto-restart.";
      }
      return;
    }
  };

  speechRecognition.onerror = (event) => {
    transcriptionRunning = false;
    transcribeStatus.textContent = getTranscriptionErrorMessage(event.error);
  };
} else {
  transcribeStatus.textContent = "This browser does not support speech recognition.";
}

transcribeCopy.addEventListener("click", async () => {
  const textToCopy = transcriptText.value.trim();
  if (!textToCopy) {
    transcribeStatus.textContent = "Nothing to copy yet.";
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      transcriptText.removeAttribute("readonly");
      transcriptText.select();
      transcriptText.setSelectionRange(0, transcriptText.value.length);
      document.execCommand("copy");
      transcriptText.setAttribute("readonly", "readonly");
    }
    transcribeStatus.textContent = "Transcript copied.";
  } catch (error) {
    transcriptText.removeAttribute("readonly");
    transcriptText.select();
    transcriptText.setSelectionRange(0, transcriptText.value.length);
    transcriptText.setAttribute("readonly", "readonly");
    transcribeStatus.textContent = "Copy failed. Text is selected, please copy manually.";
  }
});

transcribeClear.addEventListener("click", () => {
  finalTranscript = "";
  renderTranscript();
  persistTranscript();
  transcribeStatus.textContent = "Transcript cleared.";
});

speechLang.addEventListener("change", () => {
  appState.speechLang = speechLang.value;
  saveState();
  if (transcriptionRunning && speechRecognition) {
    stopTranscription();
    startTranscription();
  }
});

updateRecordClearButton();

// ----- Passage Bank -----
const passageTitle = document.getElementById("passageTitle");
const passageBody = document.getElementById("passageBody");
const passageAdd = document.getElementById("passageAdd");
const passageStatus = document.getElementById("passageStatus");
const passageList = document.getElementById("passageList");

let passages = Array.isArray(appState.passages) ? appState.passages : [];

function persistPassages() {
  appState.passages = passages;
  saveState();
}

function addUseButton(label, onClick, className = "ghost") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${className} small`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderPassages() {
  passageList.innerHTML = "";
  if (!passages.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No passages saved yet.";
    passageList.appendChild(empty);
    return;
  }

  passages.forEach((passage) => {
    const item = document.createElement("details");
    item.className = "passage-item";

    const summary = document.createElement("summary");
    summary.textContent = passage.title;

    const content = document.createElement("div");
    content.className = "passage-content";
    content.textContent = passage.body;

    const actions = document.createElement("div");
    actions.className = "passage-actions";

    const useWpm = addUseButton("Use in WPM", () => {
      targetText.value = passage.body;
      appState.targetText = passage.body;
      saveState();
      renderWpm();
      passageStatus.textContent = `Loaded "${passage.title}" into WPM.`;
    });

    const useTts = addUseButton("Use in TTS", () => {
      speechText.value = passage.body;
      appState.speechText = passage.body;
      shadowModelText.value = passage.body;
      saveState();
      passageStatus.textContent = `Loaded "${passage.title}" into Text to Speech.`;
    });

    const remove = addUseButton("Delete", () => {
      passages = passages.filter((saved) => saved.id !== passage.id);
      persistPassages();
      renderPassages();
      passageStatus.textContent = `Deleted "${passage.title}".`;
    }, "danger");

    actions.append(useWpm, useTts, remove);
    item.append(summary, content, actions);
    passageList.appendChild(item);
  });
}

passageAdd.addEventListener("click", () => {
  const title = passageTitle.value.trim();
  const body = passageBody.value.trim();
  if (!title || !body) {
    passageStatus.textContent = "Please enter both title and passage text.";
    return;
  }

  const newPassage = {
    id: `passage-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    body
  };
  passages = [newPassage, ...passages];
  persistPassages();
  renderPassages();
  passageTitle.value = "";
  passageBody.value = "";
  passageStatus.textContent = `Saved "${title}".`;
});

renderPassages();

window.addEventListener("beforeunload", () => {
  stopWpmTimer();
  stopTimerLoop();
  releaseCurrentStream();
  stopTranscription();
  stopShadowing("");
  clearShadowAudio();
});
