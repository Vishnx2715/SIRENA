/**
 * SONARIS — Main UI Controller & Tactical Interactivity
 * Handles Navigation, Web Audio Sonar Ping, Scroll Animations, Radar Sweep & Canvases
 * Optimized for Light Theme & Mobile Responsiveness
 */

(function () {
  'use strict';

  /* ---------------- 1. Scroll Progress Bar & Scroll To Top ---------------- */
  const progressEl = document.getElementById('scrollProgress');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  window.addEventListener(
    'scroll',
    () => {
      const scrollTotal =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (window.scrollY / (scrollTotal || 1)) * 100;
      if (progressEl) progressEl.style.width = scrolled + '%';

      if (scrollTopBtn) {
        if (window.scrollY > 300) {
          scrollTopBtn.classList.add('show');
        } else {
          scrollTopBtn.classList.remove('show');
        }
      }
    },
    { passive: true }
  );

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- 2. Scroll-Reveal IntersectionObserver ---------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.08 }
  );

  document
    .querySelectorAll('.scroll-reveal')
    .forEach((el) => revealObserver.observe(el));

  /* ---------------- 3. Interactive 3D Tilt Cards (Desktop Only) ---------------- */
  if (window.innerWidth > 768) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = -(y / (rect.height / 2)) * 4;
        const rotY = (x / (rect.width / 2)) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  /* ---------------- 4. Navbar Compact & Mobile Menu ---------------- */
  const navbar = document.getElementById('navbar');
  const logoBar = document.getElementById('govLogoBar');
  window.addEventListener(
    'scroll',
    () => {
      if (navbar) {
        const logoH = logoBar ? logoBar.offsetHeight : 68;
        if (window.scrollY > 30) {
          navbar.style.background = 'rgba(255, 255, 255, 0.97)';
          navbar.style.boxShadow = '0 4px 18px rgba(15, 23, 42, 0.08)';
        } else {
          navbar.style.background = 'rgba(255, 255, 255, 0.88)';
          navbar.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
        }
        navbar.style.top = logoH + 'px';
      }
    },
    { passive: true }
  );

  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('a, button').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && e.target !== navToggle) {
        mobileNav.classList.remove('open');
      }
    });
  }

  /* ---------------- 5. Web Audio API Synthetic Acoustic Sonar Ping ---------------- */
  let audioCtx = null;
  let audioEnabled = true;

  function playSonarPing() {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Classic Submarine Chirp Acoustic Ping
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Chirp frequency sweep: 900Hz -> 1400Hz -> 750Hz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

      // Reverberant decaying envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      // Bandpass filter to evoke underwater resonance
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(4.5, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }

  // Bind ping audio to primary buttons
  document.querySelectorAll('.btn-ping').forEach((btn) => {
    btn.addEventListener('click', () => {
      playSonarPing();
      btn.style.boxShadow = '0 0 25px rgba(2, 132, 199, 0.7)';
      setTimeout(() => {
        btn.style.boxShadow = '';
      }, 400);
    });
  });

  const audioToggleBtn = document.getElementById('audioToggle');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      audioToggleBtn.classList.toggle('active', audioEnabled);
      audioToggleBtn.setAttribute(
        'title',
        audioEnabled ? 'Acoustic Sonar Sound: ON' : 'Acoustic Sonar Sound: MUTED'
      );
      if (audioEnabled) playSonarPing();
    });
  }

  /* ---------------- 6. Side Comparison Canvases ---------------- */
  function drawSonarTexture(ctx, w, h, seed) {
    const img = ctx.createImageData(w, h);
    let s = seed;
    function rnd() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }

    for (let y = 0; y < h; y++) {
      const rowBase = 22 + Math.sin(y * 0.05 + seed) * 10 + Math.sin(y * 0.14) * 6;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let v = rowBase + rnd() * 28 + Math.sin(x * 0.06 + y * 0.02) * 8;
        v = Math.max(0, Math.min(255, v));
        img.data[i] = v * 0.08 + 6;
        img.data[i + 1] = v * 0.45 + 18;
        img.data[i + 2] = v * 0.75 + 34;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Fine hydrophone scanline grid
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function setupCanvas(id) {
    const c = document.getElementById(id);
    if (!c) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { c, ctx, w: rect.width, h: rect.height };
  }

  function renderComparisonCanvases() {
    // Draw Natural Seabed canvas
    const nat = setupCanvas('natCanvas');
    if (nat) {
      drawSonarTexture(nat.ctx, nat.w, nat.h, 1.8);
      nat.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      nat.ctx.setLineDash([4, 4]);
      nat.ctx.lineWidth = 1.5;
      nat.ctx.strokeRect(nat.w * 0.28, nat.h * 0.32, nat.w * 0.44, nat.h * 0.42);
      nat.ctx.fillStyle = '#ffffff';
      nat.ctx.font = '10px JetBrains Mono, monospace';
      nat.ctx.fillText('NATURAL SEDIMENT RIPPLE [REJECTED]', nat.w * 0.3, nat.h * 0.28);
    }

    // Draw Subsea Debris Canvas
    const man = setupCanvas('manCanvas');
    if (man) {
      drawSonarTexture(man.ctx, man.w, man.h, 8.4);
      man.ctx.strokeStyle = '#38bdf8';
      man.ctx.lineWidth = 2;
      man.ctx.strokeRect(man.w * 0.22, man.h * 0.32, man.w * 0.55, man.h * 0.28);
      man.ctx.fillStyle = '#38bdf8';
      man.ctx.font = 'bold 10.5px JetBrains Mono, monospace';
      man.ctx.fillText('CONFIRMED TARGET: PIPELINE SPAN [98.2%]', man.w * 0.24, man.h * 0.28);
    }
  }

  renderComparisonCanvases();
  window.addEventListener('resize', () => {
    setTimeout(renderComparisonCanvases, 100);
  });

  /* ---------------- 7. Problem Cards Diagram Styling ---------------- */
  [1, 2, 3, 4, 5].forEach((n) => {
    const el = document.getElementById('diag' + n);
    if (!el) return;
    el.style.background =
      'repeating-linear-gradient(90deg, rgba(2, 132, 199, 0.08) 0 2px, transparent 2px 8px)';
  });

  /* ---------------- 8. Pipeline Vertical Nodes ---------------- */
  const stages = [
    '01. HYDROACOUSTIC TELEMETRY INGESTION (XTF / JSF)',
    '02. NADIR TRACKING & GEOMETRIC PROJECTION',
    '03. ADAPTIVE LEE SPECKLE NOISE ATTENUATION',
    '04. LOCALIZED CLAHE CONTRAST EQUALIZATION',
    '05. DEEP LEARNING MULTI-CLASS OBB DETECTION',
    '06. ACOUSTIC SHADOW RAY-TRACING VERIFICATION',
    '07. WGS-84 GEOREFERENCING & SWATH FUSION',
    '08. STANDARDIZED GIS & PDF MISSION DOSSIER',
  ];
  const pipeVertEl = document.getElementById('pipelineVert');
  if (pipeVertEl) {
    stages.forEach((s, i) => {
      if (i > 0) {
        const c = document.createElement('div');
        c.className = 'pconnector';
        pipeVertEl.appendChild(c);
      }
      const n = document.createElement('div');
      n.className = 'pnode';
      n.textContent = s;
      pipeVertEl.appendChild(n);
    });
  }

  /* ---------------- 9. System Architecture Flow ---------------- */
  const archEl = document.getElementById('archDiagram');
  if (archEl) {
    const seq = [
      'SURVEY VESSEL / AUTONOMOUS AUV',
      'DUAL HIGH-FREQ SIDE-SCAN TRANSDUCER',
      'RAW SSS HYDROPHONE LOGS (.XTF / .JSF / NMEA)',
      'REAL-TIME INGESTION & LAYBACK CORRECTION',
      'NADIR DETECTION & SLANT-TO-GROUND RANGE',
      'ADAPTIVE LEE SPECKLE FILTER + CLAHE',
    ];
    seq.forEach((s, i) => {
      if (i > 0) {
        const c = document.createElement('div');
        c.className = 'arch-connector';
        archEl.appendChild(c);
      }
      const n = document.createElement('div');
      n.className = 'arch-node';
      n.textContent = s;
      archEl.appendChild(n);
    });

    const c1 = document.createElement('div');
    c1.className = 'arch-connector';
    archEl.appendChild(c1);

    const branch = document.createElement('div');
    branch.className = 'arch-node branch-wrap';
    branch.innerHTML = `
      <div class="arch-node small" style="color:var(--cyan-deep); font-weight:700; border-color:var(--cyan);">MAN-MADE OBJECT</div>
      <div class="arch-node small" style="color:var(--text-muted);">NATURAL BENTHIC</div>
      <div class="arch-node small" style="color:var(--amber);">ANOMALOUS TARGET</div>
    `;
    archEl.appendChild(branch);

    const c2 = document.createElement('div');
    c2.className = 'arch-connector';
    archEl.appendChild(c2);

    const branch2 = document.createElement('div');
    branch2.className = 'arch-node branch-wrap';
    branch2.innerHTML = `
      <div class="arch-node small">PIPELINE</div>
      <div class="arch-node small">SHIPWRECK</div>
      <div class="arch-node small">ORDNANCE / MINE</div>
      <div class="arch-node small">GHOST NET</div>
      <div class="arch-node small">CONTAINER</div>
    `;
    archEl.appendChild(branch2);

    [
      'PHYSICAL ACOUSTIC SHADOW RAY-TRACING',
      'WGS-84 / UTM GEOREFERENCING ENGINE',
      'GEOJSON / CSV / SHAPEFILE DELIVERABLES',
      'UNIFIED MISSION INTELLIGENCE DASHBOARD',
    ].forEach((s) => {
      const c = document.createElement('div');
      c.className = 'arch-connector';
      archEl.appendChild(c);
      const n = document.createElement('div');
      n.className = 'arch-node';
      n.textContent = s;
      archEl.appendChild(n);
    });
  }

  /* ---------------- 10. CTA Radar Sweep Animation ---------------- */
  const sweep = setupCanvas('ctaSweep');
  if (sweep) {
    let angle = 0;
    function drawSweep() {
      sweep.ctx.clearRect(0, 0, sweep.w, sweep.h);
      sweep.ctx.save();
      const cx = sweep.w / 2;
      const cy = sweep.h * 0.95;

      // Light theme radial glow
      const grad = sweep.ctx.createRadialGradient(cx, cy, 0, cx, cy, sweep.w * 0.65);
      grad.addColorStop(0, 'rgba(2, 132, 199, 0.1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      sweep.ctx.fillStyle = grad;
      sweep.ctx.fillRect(0, 0, sweep.w, sweep.h);

      // Radar rings
      for (let r = 70; r < sweep.w * 0.75; r += 70) {
        sweep.ctx.beginPath();
        sweep.ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
        sweep.ctx.strokeStyle = 'rgba(2, 132, 199, 0.12)';
        sweep.ctx.lineWidth = 1;
        sweep.ctx.stroke();
      }

      // Sweep Beam
      sweep.ctx.translate(cx, cy);
      sweep.ctx.rotate(angle);
      const sweepGrad = sweep.ctx.createLinearGradient(0, 0, sweep.w * 0.65, 0);
      sweepGrad.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      sweep.ctx.beginPath();
      sweep.ctx.moveTo(0, 0);
      sweep.ctx.arc(0, 0, sweep.w * 0.65, -0.28, 0.02);
      sweep.ctx.closePath();
      sweep.ctx.fillStyle = sweepGrad;
      sweep.ctx.fill();

      sweep.ctx.restore();
      angle += 0.008;
      requestAnimationFrame(drawSweep);
    }
    drawSweep();
  }
})();
