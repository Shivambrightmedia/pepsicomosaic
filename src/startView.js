// 1080x1920 Portrait Kiosk Start Screen (Cosmic AI Photo Booth)

export function createStartView(router) {
  const container = document.createElement('div');
  container.className = 'start-screen-wrapper';

  container.innerHTML = `
    <div class="start-screen-card start-clean-card">
      <div class="start-bg-layer"></div>
      <div class="start-ambient-glow"></div>
      <div class="orbital-glow-arc"></div>

      <!-- Top Header Content -->
      <div class="start-header-content">
        <div class="neon-camera-box">
          <svg class="neon-camera-svg" viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="50" y1="5" x2="50" y2="12" stroke="#e879f9" stroke-linecap="round" />
            <line x1="42" y1="8" x2="40" y2="14" stroke="#e879f9" stroke-linecap="round" />
            <line x1="58" y1="8" x2="60" y2="14" stroke="#e879f9" stroke-linecap="round" />
            <path d="M22 25 L34 25 L40 18 L60 18 L66 25 L78 25 C84 25 88 29 88 35 L88 65 C88 71 84 75 78 75 L22 75 C16 75 12 71 12 65 L12 35 C12 29 16 25 22 25 Z" stroke="url(#neon-cam-grad)" stroke-width="3" />
            <circle cx="50" cy="50" r="16" stroke="url(#neon-lens-grad)" stroke-width="3" />
            <circle cx="50" cy="50" r="9" stroke="#60a5fa" stroke-width="2" />
            <circle cx="75" cy="35" r="3" fill="#e879f9" />
            <defs>
              <linearGradient id="neon-cam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="50%" stop-color="#c084fc" />
                <stop offset="100%" stop-color="#f472b6" />
              </linearGradient>
              <linearGradient id="neon-lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f472b6" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="brand-title-lockup">
          <span class="ai-text">AI</span>
          <div class="photo-booth-stack">
            <span class="photo-word">PHOTO</span>
            <span class="booth-word">BOOTH</span>
          </div>
        </div>

        <div class="sub-tagline">
          CAPTURE <span class="bullet-star">✦</span> CREATE <span class="bullet-star">✦</span> TAKE HOME
        </div>
      </div>

      <!-- Center Glowing START Button -->
      <div class="start-btn-center">
        <button class="glowing-circle-btn" id="btn-start-kiosk" title="Start Photobooth">
          <div class="circle-outer-glow"></div>
          <div class="circle-gradient-border"></div>
          <div class="circle-content">
            <div class="play-arrow">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span class="start-word">START</span>
          </div>
        </button>
      </div>

      <!-- Bottom Tagline -->
      <div class="start-footer-tag">MAKE MEMORIES MAGICAL</div>
    </div>
  `;

  const btnStart = container.querySelector('#btn-start-kiosk');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      router.navigate('/vertical');
    });
  }

  return container;
}
