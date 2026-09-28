/**
 * SONARIS — Mission Intelligence Dashboard & Live Telemetry Telemetry Stream
 * Animated statistics, SVG telemetry charts, and live sector metrics
 * Optimized for Light Theme & Mobile
 */

(function () {
  // Stat Counter Animation triggered on intersection
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.dval').forEach((d) => {
            if (d.dataset.done) return;
            d.dataset.done = '1';
            const target = parseFloat(d.dataset.count);
            const suffix = d.dataset.suffix || '';
            let cur = 0;
            const step = Math.max(target / 45, 0.2);
            const timer = setInterval(() => {
              cur += step;
              if (cur >= target) {
                cur = target;
                clearInterval(timer);
              }
              d.textContent =
                (Number.isInteger(target) ? Math.round(cur) : cur.toFixed(1)) +
                suffix;
            }, 24);
          });
          statObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const dashStats = document.querySelector('.dash-stats-grid');
  if (dashStats) statObserver.observe(dashStats);

  // SVG Bar Chart Generator (Light Theme)
  function renderBarChart(svgEl, data, primaryColor, highlightColor) {
    if (!svgEl) return;
    const w = 240, h = 110;
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const max = Math.max(...data.map((d) => d.v));
    const bw = w / data.length;

    svgEl.innerHTML = data
      .map((d, i) => {
        const bh = (d.v / max) * 72;
        const color = d.highlight ? highlightColor : primaryColor;
        const x = i * bw + 6;
        const width = bw - 12;
        const y = 88 - bh;
        return `
        <rect x="${x}" y="${y}" width="${width}" height="${bh}" rx="2" fill="${color}" opacity="0.9" class="chart-bar">
          <title>${d.l}: ${d.v}</title>
        </rect>
        <text x="${i * bw + bw / 2}" y="104" font-size="9" fill="#64748b" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="600">${d.l}</text>
        <text x="${i * bw + bw / 2}" y="${y - 4}" font-size="8.5" fill="#0f172a" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700">${d.v}</text>
      `;
      })
      .join('');
  }

  // SVG Line / Area Spline Chart Generator (Light Theme)
  function renderAreaChart(svgEl, data, strokeColor) {
    if (!svgEl) return;
    const w = 240, h = 110;
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * (w - 20) + 10;
      const y = 85 - ((v - min) / range) * 58;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M 10,88 L ${pts.join(' L ')} L ${w - 10},88 Z`;

    svgEl.innerHTML = `
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${pathD}" fill="url(#areaGrad)"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
      ${data
        .map((v, i) => {
          const x = (i / (data.length - 1)) * (w - 20) + 10;
          const y = 85 - ((v - min) / range) * 58;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.5"/>`;
        })
        .join('')}
      <line x1="10" y1="88" x2="${w - 10}" y2="88" stroke="rgba(15, 23, 42, 0.12)" stroke-width="1"/>
    `;
  }

  // Render Charts
  const chart1 = document.getElementById('chart1');
  const chart2 = document.getElementById('chart2');
  const chart3 = document.getElementById('chart3');

  if (chart1) {
    renderBarChart(
      chart1,
      [
        { l: 'PIPE', v: 9, highlight: false },
        { l: 'WRECK', v: 7, highlight: false },
        { l: 'UXO', v: 3, highlight: true },
        { l: 'NET', v: 12, highlight: false },
        { l: 'UNK', v: 6, highlight: false },
      ],
      '#0284c7',
      '#d97706'
    );
  }

  if (chart2) {
    renderBarChart(
      chart2,
      [
        { l: 'HIGH', v: 24, highlight: false },
        { l: 'MED', v: 8, highlight: false },
        { l: 'LOW', v: 5, highlight: true },
      ],
      '#059669',
      '#dc2626'
    );
  }

  if (chart3) {
    renderAreaChart(
      chart3,
      [2, 4, 3, 7, 9, 8, 12, 10, 15, 13, 16, 18],
      '#0284c7'
    );
  }

  // Simulated Dynamic Telemetry Stream
  const pingLatencyEl = document.getElementById('telemLatency');
  const pingVelEl = document.getElementById('telemVel');
  const clockEl = document.getElementById('telemClock');

  if (clockEl || pingLatencyEl || pingVelEl) {
    setInterval(() => {
      // Live clock
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toISOString().substring(11, 23) + 'Z';
      }
      // Micro jitter in water column velocity
      if (pingVelEl) {
        const base = 1482.1;
        const jitter = (Math.random() - 0.5) * 0.4;
        pingVelEl.textContent = (base + jitter).toFixed(1) + ' m/s';
      }
      // Latency jitter
      if (pingLatencyEl) {
        const l = 4.1 + Math.random() * 0.3;
        pingLatencyEl.textContent = l.toFixed(1) + 'ms';
      }
    }, 1000);
  }
})();
