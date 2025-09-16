// YouStream PWA demo: local recording, mock publish, install prompt
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}

// --- Live preview (camera) ---
const livePreview = document.getElementById('livePreview');
const startLiveBtn = document.getElementById('startLiveBtn');
const stopLiveBtn = document.getElementById('stopLiveBtn');
const liveStatus = document.getElementById('liveStatus');
let liveStream;

startLiveBtn.addEventListener('click', async () => {
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
    livePreview.srcObject = liveStream;
    startLiveBtn.disabled = true;
    stopLiveBtn.disabled = false;
    liveStatus.textContent = 'Camera active. (Not streaming yet)';
  } catch (err) {
    console.error(err);
    liveStatus.textContent = 'Camera error: ' + err.message;
  }
});

stopLiveBtn.addEventListener('click', () => {
  if (liveStream) {
    liveStream.getTracks().forEach(t => t.stop());
    livePreview.srcObject = null;
  }
  startLiveBtn.disabled = false;
  stopLiveBtn.disabled = true;
  liveStatus.textContent = 'Idle';
});

/*
 * To implement real live streaming:
 * 1) Use a provider (Livepeer, LiveKit, Mux Live) or roll your own SFU (mediasoup).
 * 2) Send liveStream tracks to RTCPeerConnection and use WebSocket signaling.
 * 3) See README.md for sample snippets.
 */

// --- Record & publish locally ---
const recordPreview = document.getElementById('recordPreview');
const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn = document.getElementById('stopRecBtn');
const downloadRecBtn = document.getElementById('downloadRecBtn');
let recStream, mediaRecorder, recChunks = [], recBlob;

startRecBtn.addEventListener('click', async () => {
  recStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  recordPreview.srcObject = recStream;
  mediaRecorder = new MediaRecorder(recStream, { mimeType: getBestMime() });
  recChunks = [];
  mediaRecorder.ondataavailable = (e) => e.data.size && recChunks.push(e.data);
  mediaRecorder.onstop = () => {
    recBlob = new Blob(recChunks, { type: mediaRecorder.mimeType });
    recordPreview.srcObject = null;
    recordPreview.src = URL.createObjectURL(recBlob);
    recordPreview.controls = true;
    downloadRecBtn.disabled = false;
  };
  mediaRecorder.start(500);
  startRecBtn.disabled = true;
  stopRecBtn.disabled = false;
});

stopRecBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (recStream) recStream.getTracks().forEach(t => t.stop());
  startRecBtn.disabled = false;
  stopRecBtn.disabled = true;
});

downloadRecBtn.addEventListener('click', () => {
  if (!recBlob) return;
  const a = document.createElement('a');
  const ext = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
  a.href = URL.createObjectURL(recBlob);
  a.download = `youstream-recording.${ext}`;
  a.click();
});

function getBestMime(){
  const candidates = [
    'video/mp4;codecs=h264,aac',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus'
  ];
  for (const m of candidates){ if (MediaRecorder.isTypeSupported(m)) return m; }
  return '';
}

// --- Mock publish to local feed ---
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const feed = document.getElementById('feed');
let feedItems = [];

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0] || recBlob;
  if (!file) { uploadStatus.textContent = 'Pick a file or record something first.'; return; }
  uploadStatus.textContent = 'Publishing (local mock)...';
  const url = URL.createObjectURL(file);
  addToFeed(url);
  uploadStatus.textContent = 'Published locally.';
  fileInput.value = '';
});

function addToFeed(url){
  feedItems.unshift({ url, ts: Date.now() });
  renderFeed();
}
function renderFeed(){
  feed.innerHTML = '';
  for (const item of feedItems){
    const v = document.createElement('video');
    v.src = item.url;
    v.controls = true;
    feed.appendChild(v);
  }
}
