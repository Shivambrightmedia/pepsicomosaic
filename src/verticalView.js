import { FaceDetector } from './faceDetector.js';
import { uploadPhoto } from './services/cloudinary.js';
import { publishPhoto } from './services/firebase.js';

export function createVerticalView(router) {
  const container = document.createElement('div');
  container.className = 'capture-screen-wrapper';

  container.innerHTML = `
    <!-- Cosmic Glowing Curved Wave Overlays in Background -->
    <div class="bg-curved-arc arc-top-right"></div>
    <div class="bg-curved-arc arc-bottom-left"></div>

    <div class="capture-screen-card">
      <!-- Top Right Bookmark Icon to return to Start Page -->
      <button class="top-bookmark-btn" id="btn-home" title="Go to Start Screen">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <!-- 512px Unified Center Column with Generous Vertical Distribution -->
      <div class="kiosk-aligned-column">
        <!-- TOP SECTION: Traffic Lights Capsule + Number 20 + Prompt -->
        <div class="capture-header-zone">
          <div class="traffic-lights-capsule">
            <div class="light-dot dot-red" id="dot-red" title="Rude / Frown"></div>
            <div class="light-dot dot-green" id="dot-green" title="Smile (1s Hold)"></div>
            <div class="light-dot dot-yellow" id="dot-yellow" title="Normal / Neutral"></div>
          </div>

          <!-- Countdown (shows 10 instead of 1.0) & Prompt -->
          <div class="camera-prompt-zone">
            <div class="countdown-large-num" id="countdown-num">10</div>
            <div class="camera-look-text">LOOK AT THE CAMERA</div>
          </div>
        </div>

        <!-- MIDDLE SECTION: EXACTLY 512px by 512px SQUARE CAMERA BOX with Reticle -->
        <div class="camera-512-box" id="camera-box">
          <video id="webcam-video" autoplay playsinline muted></video>

          <!-- Framing Corner Brackets and Center Plus Reticle -->
          <div class="camera-reticle">
            <div class="reticle-box">
              <div class="reticle-corner tl"></div>
              <div class="reticle-corner tr"></div>
              <div class="reticle-corner bl"></div>
              <div class="reticle-corner br"></div>
              <div class="reticle-center-cross">+</div>
            </div>
          </div>

          <div class="camera-status-pill" id="camera-status">Looking for Face...</div>
        </div>

        <!-- BOTTOM SECTION: Perfectly Aligned 512px Width Row -->
        <div class="capture-bottom-zone">
          <div class="bottom-controls-row">
            <!-- Left: Square Photo Card (150x150) + "YOUR PHOTO" Label -->
            <div class="photo-preview-group">
              <div class="captured-small-card" id="captured-card">
                <img id="captured-photo-img" alt="Captured Portrait" style="display:none;" />
                <div class="captured-empty-placeholder" id="captured-placeholder">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              </div>
              <span class="your-photo-label">YOUR PHOTO</span>
            </div>

            <!-- Right: Stacked RETAKE & OK Buttons -->
            <div class="action-buttons-column">
              <!-- RETAKE BUTTON -->
              <button class="btn-action-retake" id="btn-retake">
                <span class="btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <span class="btn-text">RETAKE</span>
              </button>

              <!-- OK BUTTON with Blue-to-Magenta Gradient -->
              <button class="btn-action-ok" id="btn-ok">
                <span class="btn-icon check-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </span>
                <span class="btn-text">OK</span>
              </button>
            </div>
          </div>

          <!-- Bottom bar with subtle simulation buttons & home link -->
          <div class="bottom-footer-bar">
            <div class="test-controls-row">
              <button class="quick-sim-btn" id="btn-sim-smile">😊 Smile (1s)</button>
              <button class="quick-sim-btn" id="btn-sim-snap">📸 Snap</button>
              <button class="quick-sim-btn" id="btn-back-start">← Start Screen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // DOM Elements
  const videoEl = container.querySelector('#webcam-video');
  const dotRed = container.querySelector('#dot-red');
  const dotGreen = container.querySelector('#dot-green');
  const dotYellow = container.querySelector('#dot-yellow');
  const btnHome = container.querySelector('#btn-home');
  const btnBackStart = container.querySelector('#btn-back-start');

  const countdownNum = container.querySelector('#countdown-num');
  const statusPill = container.querySelector('#camera-status');

  const capturedImg = container.querySelector('#captured-photo-img');
  const capturedPlaceholder = container.querySelector('#captured-placeholder');
  const btnRetake = container.querySelector('#btn-retake');
  const btnOk = container.querySelector('#btn-ok');

  const btnSimSmile = container.querySelector('#btn-sim-smile');
  const btnSimSnap = container.querySelector('#btn-sim-snap');

  let currentCapturedPhoto = null;

  // Traffic lights updater: Red = Rude, Green = Smile, Yellow = Normal
  function setTrafficLights(state) {
    dotRed.classList.toggle('active', state === 'rude');
    dotGreen.classList.toggle('active', state === 'smile');
    dotYellow.classList.toggle('active', state === 'neutral');
  }

  // Handle auto-captured or snapped photo
  function onPhotoCaptured(photoUrl) {
    currentCapturedPhoto = photoUrl;
    capturedImg.src = photoUrl;
    capturedImg.style.display = 'block';
    capturedPlaceholder.style.display = 'none';

    statusPill.textContent = 'Photo captured!';
    countdownNum.textContent = '10';
  }

  // Reset to live camera tracking
  function resetCapture() {
    currentCapturedPhoto = null;
    capturedImg.src = '';
    capturedImg.style.display = 'none';
    capturedPlaceholder.style.display = 'flex';
    countdownNum.textContent = '10';
    statusPill.textContent = 'Looking for face...';
    detector.resume();
  }

  // Navigation: Back to Start Screen
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      router.navigate('/start');
    });
  }

  if (btnBackStart) {
    btnBackStart.addEventListener('click', () => {
      router.navigate('/start');
    });
  }

  // Retake Button
  btnRetake.addEventListener('click', () => {
    resetCapture();
  });

  let isUploading = false;

  // OK Button: Confirms photo, uploads to Cloudinary, and publishes to Firebase
  btnOk.addEventListener('click', async () => {
    if (!currentCapturedPhoto || isUploading) return;

    isUploading = true;
    btnOk.disabled = true;
    btnRetake.disabled = true;
    btnOk.classList.add('is-loading');
    statusPill.textContent = '☁️ Saving to Cloudinary...';

    try {
      // 1. Upload photo to Cloudinary
      const uploadRes = await uploadPhoto(currentCapturedPhoto);

      let finalPhotoUrl = currentCapturedPhoto;
      if (uploadRes.success && uploadRes.url) {
        finalPhotoUrl = uploadRes.url;
        statusPill.textContent = '⚡ Syncing with Mosaic Wall...';

        // 2. Publish to Firebase Realtime Database
        await publishPhoto(finalPhotoUrl);
      } else {
        console.warn('[Kiosk] Cloudinary upload issue, falling back to local sync:', uploadRes.error);
        statusPill.textContent = '⚠️ Cloud offline, syncing locally...';
      }

      // 3. Fallback / local broadcast for same-browser instant sync
      router.broadcast({
        type: 'PHOTO_APPROVED',
        image: finalPhotoUrl
      });

      statusPill.textContent = '✓ Added to Wall!';
      btnOk.classList.remove('is-loading');
      btnOk.classList.add('btn-confirmed');

      setTimeout(() => {
        btnOk.classList.remove('btn-confirmed');
        btnOk.disabled = false;
        btnRetake.disabled = false;
        isUploading = false;
        resetCapture();
        router.navigate('/start');
      }, 500);

    } catch (err) {
      console.error('[Kiosk] Upload flow error:', err);
      statusPill.textContent = '⚠️ Error uploading photo';

      // Fallback local broadcast
      router.broadcast({
        type: 'PHOTO_APPROVED',
        image: currentCapturedPhoto
      });

      setTimeout(() => {
        btnOk.classList.remove('is-loading');
        btnOk.disabled = false;
        btnRetake.disabled = false;
        isUploading = false;
        resetCapture();
        router.navigate('/start');
      }, 1000);
    }
  });

  // Face Detector Service
  const detector = new FaceDetector({
    onStateChange: (state) => {
      setTrafficLights(state);
    },
    onProgress: (progress, remainingSec) => {
      if (progress > 0) {
        // Countdown from 10 to 0 (tenths: 10 -> 0)
        const val = Math.max(0, Math.round(remainingSec * 10));
        countdownNum.textContent = `${val}`;
      } else {
        countdownNum.textContent = '10';
      }
    },
    onCapture: (photo) => {
      onPhotoCaptured(photo);
    },
    onError: (err) => {
      statusPill.textContent = err;
    }
  });

  // Quick simulation triggers for manual testing
  btnSimSmile.addEventListener('click', () => {
    setTrafficLights('smile');
    let timeLeft = 10;
    const timer = setInterval(() => {
      timeLeft -= 1;
      countdownNum.textContent = `${timeLeft}`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        countdownNum.textContent = '10';
        const frame = detector.captureFrame() || generateSimulatedSelfie();
        onPhotoCaptured(frame);
      }
    }, 100);
  });

  btnSimSnap.addEventListener('click', () => {
    const frame = detector.captureFrame() || generateSimulatedSelfie();
    onPhotoCaptured(frame);
  });

  function generateSimulatedSelfie() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#161b26';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#ffffff';
    ctx.font = '110px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('😊', 256, 260);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillText('SMILE CAPTURED', 256, 360);
    return canvas.toDataURL('image/jpeg');
  }

  // Component lifecycle
  container.start = async () => {
    statusPill.textContent = 'Loading AI models...';
    await detector.loadModels();
    statusPill.textContent = 'Starting camera...';
    const ok = await detector.startCamera(videoEl);
    if (ok) {
      statusPill.textContent = 'Camera active';
    } else {
      statusPill.textContent = 'Webcam not found (Use test buttons)';
    }
  };

  container.stop = () => {
    detector.stop();
  };

  return container;
}
