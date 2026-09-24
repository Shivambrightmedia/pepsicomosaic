// 1080x1920 Portrait Kiosk Start Screen (Play Screen)
import play1Bg from '../dist/play1.jpg';

export function createStartView(router) {
  const container = document.createElement('div');
  container.className = 'start-screen-wrapper';

  container.innerHTML = `
    <div class="start-screen-card start-clean-card">
      <div class="start-bg-layer" style="background-image: url('${play1Bg}');"></div>

      <!-- Center PLAY Button matching play1.jpg -->
      <div class="start-btn-center">
        <button class="play-pill-btn" id="btn-start-kiosk" title="Play">
          PLAY
        </button>
      </div>
    </div>
  `;

  const btnStart = container.querySelector('#btn-start-kiosk');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      router.navigate('/vertical');
    });
  }

  // Also click anywhere on card to start
  const card = container.querySelector('.start-screen-card');
  if (card) {
    card.addEventListener('click', (e) => {
      if (e.target !== btnStart && !btnStart.contains(e.target)) {
        router.navigate('/vertical');
      }
    });
  }

  return container;
}
