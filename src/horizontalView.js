// 1920x1080 Fullscreen Mosaic Grid with Dynamic 1:1 Square Presets (50, 100, 150, 200, 400, 500)
// Press 'F' to toggle Settings Icon. Click Settings Icon for Grid Customization.
// Fullscreen (F11) cover-fills the screen with zero black space.
// Approved photos appear BIG first, then fly, shrink, flip, and fit into a random grid slot.
import { subscribeToPhotos, resetRemotePhotos } from './services/firebase.js';

export const GRID_PRESETS = {
  50: { label: '50', cols: 10, rows: 5, total: 50, gap: '4px', fontSize: 'clamp(11px, 1.3vw, 20px)' },
  100: { label: '100', cols: 14, rows: 7, total: 98, gap: '3px', fontSize: 'clamp(8px, 0.95vw, 15px)' },
  150: { label: '150', cols: 16, rows: 9, total: 144, gap: '3px', fontSize: 'clamp(8px, 0.8vw, 13px)' },
  200: { label: '200', cols: 20, rows: 10, total: 200, gap: '2px', fontSize: 'clamp(7px, 0.7vw, 11px)' },
  400: { label: '400', cols: 27, rows: 15, total: 405, gap: '2px', fontSize: 'clamp(5px, 0.5vw, 9px)' },
  500: { label: '500', cols: 30, rows: 17, total: 510, gap: '2px', fontSize: 'clamp(5px, 0.45vw, 8px)' }
};

export function createHorizontalView(router) {
  const container = document.createElement('div');
  container.className = 'mosaic-fullscreen-container';

  // Load saved preset (default 100) and photos
  let currentPresetKey = localStorage.getItem('mosaic_grid_preset') || '100';
  if (!GRID_PRESETS[currentPresetKey]) currentPresetKey = '100';
  let activePreset = GRID_PRESETS[currentPresetKey];

  // Setting icon visibility state
  let isSettingIconVisible = localStorage.getItem('mosaic_setting_icon_visible') !== 'false';

  container.innerHTML = `
    <!-- Top-Right Settings Button (Toggled with 'F' key) -->
    <button class="mosaic-settings-btn ${isSettingIconVisible ? '' : 'is-disabled'}" id="btn-mosaic-settings" title="Settings (Press 'F' to hide/show)">
      <svg class="gear-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
      <span class="key-hint">F</span>
    </button>

    <!-- Brief feedback toast on pressing 'F' -->
    <div class="mosaic-toast hidden" id="mosaic-toast"></div>

    <!-- 1:1 Square Mosaic Fullscreen Grid (Cover Fill, Zero Black Space) -->
    <div class="mosaic-grid-wrapper">
      <div class="mosaic-square-grid" id="mosaic-grid"></div>
    </div>

    <!-- Settings Modal Overlay -->
    <div class="mosaic-settings-modal hidden" id="mosaic-settings-modal">
      <div class="settings-backdrop" id="settings-backdrop"></div>
      <div class="settings-dialog">
        <div class="settings-header">
          <div class="settings-title-group">
            <h3>GRID SETTINGS</h3>
            <div class="settings-badges-row">
              <span class="settings-kbd-badge">Toggle icon: [ F ]</span>
              <span class="cloud-status-badge" id="cloud-status-badge">⚡ Cloud: Connecting...</span>
            </div>
          </div>
          <button class="settings-close-btn" id="btn-close-settings" title="Close">✕</button>
        </div>

        <div class="settings-body">
          <div class="setting-section">
            <label class="setting-label">SELECT GRID SIZE (1:1 SQUARES)</label>
            <div class="preset-grid-buttons" id="preset-buttons">
              <button class="preset-btn" data-preset="50">
                <span class="preset-num">50</span>
                <span class="preset-sub">10 × 5</span>
              </button>
              <button class="preset-btn" data-preset="100">
                <span class="preset-num">100</span>
                <span class="preset-sub">14 × 7 (98)</span>
              </button>
              <button class="preset-btn" data-preset="150">
                <span class="preset-num">150</span>
                <span class="preset-sub">16 × 9 (144)</span>
              </button>
              <button class="preset-btn" data-preset="200">
                <span class="preset-num">200</span>
                <span class="preset-sub">20 × 10</span>
              </button>
              <button class="preset-btn" data-preset="400">
                <span class="preset-num">400</span>
                <span class="preset-sub">27 × 15 (405)</span>
              </button>
              <button class="preset-btn" data-preset="500">
                <span class="preset-num">500</span>
                <span class="preset-sub">30 × 17 (510)</span>
              </button>
            </div>
          </div>

          <div class="settings-stats">
            <span>Filled Slots: <strong id="stat-photos-count">0</strong> / <strong id="stat-total-tiles">98</strong></span>
          </div>

          <div class="settings-actions-footer">
            <button class="settings-action-btn" id="btn-modal-fullscreen">
              📺 Fullscreen (F11)
            </button>
            <button class="settings-action-btn btn-danger" id="btn-modal-reset">
              ↺ Reset Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const gridEl = container.querySelector('#mosaic-grid');
  const settingsModal = container.querySelector('#mosaic-settings-modal');
  const btnSettings = container.querySelector('#btn-mosaic-settings');
  const btnCloseSettings = container.querySelector('#btn-close-settings');
  const backdrop = container.querySelector('#settings-backdrop');
  const presetButtons = container.querySelectorAll('.preset-btn');
  const statPhotos = container.querySelector('#stat-photos-count');
  const statTotal = container.querySelector('#stat-total-tiles');
  const btnModalFullscreen = container.querySelector('#btn-modal-fullscreen');
  const btnModalReset = container.querySelector('#btn-modal-reset');
  const toastEl = container.querySelector('#mosaic-toast');

  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 1800);
  }

  // Toggle visibility of setting icon with 'F' key
  function toggleSettingIcon() {
    isSettingIconVisible = !isSettingIconVisible;
    localStorage.setItem('mosaic_setting_icon_visible', isSettingIconVisible ? 'true' : 'false');

    if (isSettingIconVisible) {
      btnSettings.classList.remove('is-disabled');
      showToast('⚙️ Setting Icon Enabled');
    } else {
      btnSettings.classList.add('is-disabled');
      settingsModal.classList.add('hidden');
      showToast('Setting Icon Hidden (Press F to show)');
    }
  }

  function openModal() {
    settingsModal.classList.remove('hidden');
    updateStats();
  }

  function closeModal() {
    settingsModal.classList.add('hidden');
  }

  function updateStats() {
    const photos = JSON.parse(localStorage.getItem('mosaic_photos') || '[]');
    const filledCount = photos.filter(Boolean).length;
    statPhotos.textContent = filledCount;
    statTotal.textContent = activePreset.total;
  }

  // Set active preset & update grid geometry
  function setPreset(key) {
    if (!GRID_PRESETS[key]) return;
    currentPresetKey = key;
    activePreset = GRID_PRESETS[key];
    localStorage.setItem('mosaic_grid_preset', key);

    presetButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === key);
    });

    const { cols, rows, gap, fontSize } = activePreset;
    gridEl.style.setProperty('--grid-cols', cols);
    gridEl.style.setProperty('--grid-rows', rows);
    gridEl.style.setProperty('--grid-gap', gap);
    gridEl.style.setProperty('--tile-font-size', fontSize);

    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    gridEl.style.gap = gap;
    gridEl.style.padding = gap;
    gridEl.style.width = '100vw';
    gridEl.style.height = '100vh';

    renderGrid();
    updateStats();
  }

  // Render square grid tiles
  function renderGrid() {
    const photos = JSON.parse(localStorage.getItem('mosaic_photos') || '[]');
    const total = activePreset.total;

    gridEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const tile = document.createElement('div');
      tile.className = 'mosaic-tile';
      tile.dataset.index = i;

      const photo = photos[i];
      if (photo) {
        tile.classList.add('has-photo');
        tile.innerHTML = `
          <div class="tile-card is-flipped">
            <div class="tile-front"></div>
            <div class="tile-back"><img src="${photo}" alt="Tile" /></div>
          </div>
        `;
      } else {
        tile.innerHTML = `
          <div class="tile-card">
            <div class="tile-front"></div>
            <div class="tile-back"></div>
          </div>
        `;
      }

      gridEl.appendChild(tile);
    }
  }

  // Animated Showcase: Big photo in center -> Fly, shrink, flip over 4s -> Fit into random tile
  const photoQueue = [];
  let isAnimatingPhoto = false;

  function processQueue() {
    if (isAnimatingPhoto || photoQueue.length === 0) return;
    isAnimatingPhoto = true;
    const nextImg = photoQueue.shift();
    animateFlyPhoto(nextImg, () => {
      isAnimatingPhoto = false;
      processQueue();
    });
  }

  function addPhoto(imageUrl) {
    photoQueue.push(imageUrl);
    processQueue();
  }

  function animateFlyPhoto(imageUrl, onComplete) {
    const photos = JSON.parse(localStorage.getItem('mosaic_photos') || '[]');
    const total = activePreset.total;

    // Pick random unoccupied tile index
    const unoccupied = [];
    for (let i = 0; i < total; i++) {
      if (!photos[i]) unoccupied.push(i);
    }
    const targetIdx = unoccupied.length > 0
      ? unoccupied[Math.floor(Math.random() * unoccupied.length)]
      : Math.floor(Math.random() * total);

    const targetTile = gridEl.children[targetIdx];
    if (!targetTile) {
      if (onComplete) onComplete();
      return;
    }

    // Highlight target tile on grid
    targetTile.classList.add('tile-targeted');

    // 1. Create BIG floating showcase card in center of screen
    const flyer = document.createElement('div');
    flyer.className = 'mosaic-flyer';
    flyer.innerHTML = `
      <div class="mosaic-flyer-glow"></div>
      <div class="mosaic-flyer-inner">
        <img src="${imageUrl}" alt="New Smile" />
        <div class="mosaic-flyer-badge">NEW SMILE!</div>
      </div>
    `;
    container.appendChild(flyer);

    // Trigger pop-in scale animation
    requestAnimationFrame(() => {
      flyer.classList.add('is-shown');
    });

    // 2. Showcase BIG for 1.2s, then take 4 SECONDS to smoothly fly, shrink & flip to random grid slot
    setTimeout(() => {
      const rect = targetTile.getBoundingClientRect();
      const flyerRect = flyer.getBoundingClientRect();

      const targetCenterX = rect.left + rect.width / 2;
      const targetCenterY = rect.top + rect.height / 2;
      const flyerCenterX = flyerRect.left + flyerRect.width / 2;
      const flyerCenterY = flyerRect.top + flyerRect.height / 2;

      const deltaX = targetCenterX - flyerCenterX;
      const deltaY = targetCenterY - flyerCenterY;
      const scale = rect.width / flyerRect.width;

      // 4-second smooth flight + shrink + 360° flip
      flyer.style.transition = 'transform 4.0s cubic-bezier(0.25, 1, 0.35, 1), opacity 4.0s ease';
      flyer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale}) rotateY(360deg)`;

      // 3. Dock into grid slot after 4 seconds (4000ms)
      setTimeout(() => {
        // Save photo in localStorage at targetIdx
        photos[targetIdx] = imageUrl;
        localStorage.setItem('mosaic_photos', JSON.stringify(photos));

        // Update target tile with photo and celebratory flash
        targetTile.classList.remove('tile-targeted');
        targetTile.classList.add('has-photo', 'tile-docked');
        const card = targetTile.querySelector('.tile-card');
        const back = targetTile.querySelector('.tile-back');
        if (back) back.innerHTML = `<img src="${imageUrl}" alt="Tile" />`;
        if (card) card.classList.add('is-flipped');

        // Smoothly fade out flyer during tile flip
        flyer.style.transition = 'opacity 0.4s ease';
        flyer.style.opacity = '0';
        setTimeout(() => flyer.remove(), 450);

        updateStats();

        // Allow 2.8s for slow flip to complete before removing dock class & processing next
        setTimeout(() => {
          targetTile.classList.remove('tile-docked');
          if (onComplete) onComplete();
        }, 2800);
      }, 4000);
    }, 1200);
  }

  // Keyboard 'F' toggles setting icon
  function handleKeyDown(e) {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleSettingIcon();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }

  // Event Listeners
  btnSettings.addEventListener('click', () => openModal());
  btnCloseSettings.addEventListener('click', () => closeModal());
  backdrop.addEventListener('click', () => closeModal());

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setPreset(btn.dataset.preset);
    });
  });

  btnModalFullscreen.addEventListener('click', () => {
    closeModal();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  btnModalReset.addEventListener('click', async () => {
    if (confirm('Reset mosaic wall photos across all connected screens?')) {
      btnModalReset.disabled = true;
      btnModalReset.textContent = 'Resetting...';
      try {
        await resetRemotePhotos();
      } catch (err) {
        console.error('Error resetting cloud photos:', err);
      }
      seenPhotos.clear();
      localStorage.removeItem('mosaic_photos');
      renderGrid();
      updateStats();
      btnModalReset.disabled = false;
      btnModalReset.textContent = '↺ Reset Photos';
      closeModal();
      showToast('↺ Mosaic wall reset');
    }
  });

  // Track already seen photos to prevent duplicate animations between Firebase & BroadcastChannel
  const seenPhotos = new Set();
  const cachedPhotos = JSON.parse(localStorage.getItem('mosaic_photos') || '[]');
  cachedPhotos.filter(Boolean).forEach(p => seenPhotos.add(p));

  // Attach global keyboard listener
  window.addEventListener('keydown', handleKeyDown);

  // Broadcast channel listener for fallback local sync
  router.onBroadcast((data) => {
    if (data.type === 'PHOTO_APPROVED' && data.image) {
      if (seenPhotos.has(data.image)) return;
      seenPhotos.add(data.image);
      addPhoto(data.image);
    }
  });

  // Subscribe to Firebase Realtime Database SSE stream (zero polling)
  let unsubscribeFirebase = subscribeToPhotos({
    onStatusChange: (status) => {
      const badge = container.querySelector('#cloud-status-badge');
      if (!badge) return;
      if (status === 'connected') {
        badge.textContent = '⚡ Cloud: Connected';
        badge.className = 'cloud-status-badge status-connected';
      } else if (status === 'connecting') {
        badge.textContent = '⏳ Cloud: Connecting...';
        badge.className = 'cloud-status-badge status-connecting';
      } else {
        badge.textContent = '⚠️ Cloud: Offline';
        badge.className = 'cloud-status-badge status-disconnected';
      }
    },
    onInitialPhotos: (cloudPhotos) => {
      console.log(`[Mosaic] Synced ${cloudPhotos.length} photos from Firebase`);
      const localPhotos = JSON.parse(localStorage.getItem('mosaic_photos') || '[]');
      const total = activePreset.total;
      let changed = false;

      cloudPhotos.forEach(({ imageUrl }) => {
        seenPhotos.add(imageUrl);
        if (!localPhotos.includes(imageUrl)) {
          // Find next unoccupied slot
          let emptyIdx = -1;
          for (let i = 0; i < total; i++) {
            if (!localPhotos[i]) {
              emptyIdx = i;
              break;
            }
          }
          if (emptyIdx !== -1) {
            localPhotos[emptyIdx] = imageUrl;
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem('mosaic_photos', JSON.stringify(localPhotos));
        renderGrid();
        updateStats();
      }
    },
    onNewPhoto: (imageUrl) => {
      if (seenPhotos.has(imageUrl)) return;
      seenPhotos.add(imageUrl);
      console.log('[Mosaic] New photo arriving via Firebase:', imageUrl);
      addPhoto(imageUrl);
    },
    onReset: () => {
      console.log('[Mosaic] Cloud reset event received');
      seenPhotos.clear();
      localStorage.removeItem('mosaic_photos');
      renderGrid();
      updateStats();
      showToast('↺ Mosaic wall reset');
    }
  });

  // Cleanup on view destroy
  container.stop = () => {
    window.removeEventListener('keydown', handleKeyDown);
    clearTimeout(toastTimer);
    if (typeof unsubscribeFirebase === 'function') {
      unsubscribeFirebase();
      unsubscribeFirebase = null;
    }
  };

  // Initial setup
  setPreset(currentPresetKey);

  return container;
}
