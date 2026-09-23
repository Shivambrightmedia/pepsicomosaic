// 1080x1920 Portrait Kiosk Start Screen (Cosmic AI Photo Booth)

export function createStartView(router) {
  const container = document.createElement('div');
  container.className = 'start-screen-wrapper';

  container.innerHTML = `
    <div class="start-screen-card start-clean-card">
      <div class="start-bg-layer"></div>
      <div class="start-ambient-glow"></div>
      <div class="orbital-glow-arc"></div>


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
