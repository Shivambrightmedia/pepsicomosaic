import * as faceapi from '@vladmandic/face-api';

export class FaceDetector {
  constructor({ onStateChange, onProgress, onCapture, onError }) {
    this.onStateChange = onStateChange || (() => {});
    this.onProgress = onProgress || (() => {});
    this.onCapture = onCapture || (() => {});
    this.onError = onError || (() => {});

    this.video = null;
    this.stream = null;
    this.isLoaded = false;
    this.isRunning = false;

    // Concurrency guard to prevent GPU pipeline choking
    this.isProcessing = false;
    this.detectIntervalId = null;
    this.timerAnimationId = null;

    // Offscreen small canvas for lightning-fast inference (<15ms)
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 160;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    this.detectorOptions = null;

    // Smile timing tracker
    this.smileStartTime = null;
    this.holdDuration = 2000; // 2 seconds
    this.isPaused = false;
    this.currentExpression = 'none';
  }

  async loadModels() {
    if (this.isLoaded) return true;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      // 160px input size is 3x faster and lightweight while perfectly accurate for photobooth
      this.detectorOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.35
      });
      this.isLoaded = true;
      return true;
    } catch (err) {
      this.onError('Failed to load AI models');
      return false;
    }
  }

  async startCamera(videoElement) {
    this.video = videoElement;
    try {
      if (this.stream) {
        this.stop();
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.startDetection();
      return true;
    } catch (err) {
      this.onError('Camera access failed or denied');
      return false;
    }
  }

  startDetection() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.smileStartTime = null;

    // 1. Heavy AI inference runs at throttled 10fps (every 100ms) with concurrency guard
    this.detectIntervalId = setInterval(async () => {
      if (!this.isRunning || this.isPaused || this.isProcessing) return;
      if (!this.video || this.video.paused || this.video.ended || !this.video.videoWidth) return;

      this.isProcessing = true;
      try {
        // Downscale frame to 160x160 offscreen canvas for ultra-fast GPU inference
        const vw = this.video.videoWidth;
        const vh = this.video.videoHeight;
        const size = Math.min(vw, vh);
        const sx = (vw - size) / 2;
        const sy = (vh - size) / 2;

        this.offscreenCtx.drawImage(
          this.video,
          sx, sy, size, size,
          0, 0, 160, 160
        );

        const res = await faceapi.detectSingleFace(this.offscreenCanvas, this.detectorOptions).withFaceExpressions();

        if (res && res.expressions) {
          const exp = res.expressions;
          const happy = exp.happy || 0;
          const rude = Math.max(exp.angry || 0, exp.sad || 0, exp.disgusted || 0);

          let state = 'neutral';
          if (happy > 0.5 && happy >= rude) {
            state = 'smile';
          } else if (rude > 0.4) {
            state = 'rude';
          }

          this.currentExpression = state;
          this.onStateChange(state);

          if (state === 'smile') {
            if (!this.smileStartTime) {
              this.smileStartTime = performance.now();
            }
          } else {
            this.smileStartTime = null;
          }
        } else {
          this.currentExpression = 'none';
          this.smileStartTime = null;
          this.onStateChange('none');
        }
      } catch (e) {
        // ignore occasional frame skip
      } finally {
        this.isProcessing = false;
      }
    }, 100);

    // 2. Smooth 60fps animation loop ONLY for timer/countdown progress (zero heavy computation)
    const updateTimer = () => {
      if (!this.isRunning) return;

      if (!this.isPaused && this.smileStartTime) {
        const now = performance.now();
        const elapsed = now - this.smileStartTime;
        const progress = Math.min(1, elapsed / this.holdDuration);
        const remaining = Math.max(0, (this.holdDuration - elapsed) / 1000).toFixed(1);

        this.onProgress(progress, remaining);

        if (progress >= 1) {
          this.isPaused = true;
          this.smileStartTime = null;
          this.onProgress(0, 0);
          const photo = this.captureFrame();
          this.onCapture(photo);
        }
      } else if (!this.smileStartTime) {
        this.onProgress(0, 0);
      }

      this.timerAnimationId = requestAnimationFrame(updateTimer);
    };

    this.timerAnimationId = requestAnimationFrame(updateTimer);
  }

  captureFrame() {
    if (!this.video || !this.video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    const size = Math.min(vw, vh);

    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Mirror image for natural selfie orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;
    ctx.drawImage(this.video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  resume() {
    this.isPaused = false;
    this.smileStartTime = null;
    this.isProcessing = false;
    this.onProgress(0, 0);
  }

  stop() {
    this.isRunning = false;
    if (this.detectIntervalId) {
      clearInterval(this.detectIntervalId);
      this.detectIntervalId = null;
    }
    if (this.timerAnimationId) {
      cancelAnimationFrame(this.timerAnimationId);
      this.timerAnimationId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
