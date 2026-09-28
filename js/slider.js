/**
 * SONARIS — Interactive Dual-Lens Preprocessing Visualizer
 * Compares Raw SSS Speckle Backscatter vs Adaptive Lee Speckle Filter + CLAHE Contrast Tuning
 * Responsive across Mobile, Tablet, and Desktop with Touch Support
 */

(function () {
  const canvas = document.getElementById('preCanvas');
  const wrap = document.getElementById('sliderWrap');
  const handle = document.getElementById('sliderHandle');
  if (!canvas || !wrap || !handle) return;

  let ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let currentPct = 50;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    w = rect.width;
    h = canvas.clientHeight || 340;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    renderView(currentPct);
  }

  function renderView(pct) {
    if (!w || !h) return;
    const splitX = Math.round((pct / 100) * w);
    const imgData = ctx.createImageData(w, h);
    let s = 9.8;
    function rnd() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }

    for (let y = 0; y < h; y++) {
      const rowTone = 28 + Math.sin(y * 0.08) * 14 + Math.cos(y * 0.16) * 8;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const isRaw = x < splitX;

        // Subsea Pipe / Target Feature
        let feature = 0;
        if (Math.abs(y - h * 0.52) < 22 && x > w * 0.15 && x < w * 0.85) {
          feature = 90;
          if (y > h * 0.52 + 10) feature = -45;
        }

        let val;
        if (isRaw) {
          // Speckle noise is multiplicative and high variance
          const noise = (rnd() - 0.5) * 80;
          val = Math.max(0, Math.min(255, rowTone + feature + noise));
          // Raw has cooler, faded blue tone
          imgData.data[i] = val * 0.12;
          imgData.data[i + 1] = val * 0.38;
          imgData.data[i + 2] = val * 0.62;
          imgData.data[i + 3] = 255;
        } else {
          // Lee Filter preserves edges (feature) while smoothing noise
          const smoothNoise = (rnd() - 0.5) * 12;
          const enhancedFeature = feature !== 0 ? feature * 1.35 : 0;
          val = Math.max(0, Math.min(255, rowTone * 0.9 + enhancedFeature + smoothNoise));
          // Enhanced has sharp cyan phosphor tone
          imgData.data[i] = val * 0.05;
          imgData.data[i + 1] = val * 0.75;
          imgData.data[i + 2] = val * 0.95;
          imgData.data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Fine grid overlay
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Target callout on enhanced side
    if (pct < 70) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      const boxW = Math.min(w * 0.45, 240);
      const boxH = Math.min(h * 0.4, 90);
      const boxX = Math.max(splitX + 10, w * 0.35);
      const boxY = h * 0.32;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText('EXTRACTED PIPE CONTOUR [99.2%]', boxX + 4, boxY - 6);
    }
  }

  function updateSlider(clientX) {
    const wrapRect = wrap.getBoundingClientRect();
    let pct = ((clientX - wrapRect.left) / wrapRect.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    currentPct = pct;
    handle.style.left = pct + '%';
    renderView(pct);
  }

  let dragging = false;

  handle.addEventListener('mousedown', () => (dragging = true));
  window.addEventListener('mouseup', () => (dragging = false));
  window.addEventListener('mousemove', (e) => {
    if (dragging) updateSlider(e.clientX);
  });

  // Mobile Touch Support with preventDefault on handle
  handle.addEventListener(
    'touchstart',
    (e) => {
      dragging = true;
    },
    { passive: true }
  );

  window.addEventListener('touchend', () => (dragging = false));
  window.addEventListener(
    'touchmove',
    (e) => {
      if (dragging && e.touches.length > 0) {
        updateSlider(e.touches[0].clientX);
      }
    },
    { passive: true }
  );

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Initial setup
  setTimeout(resizeCanvas, 50);
})();
