/**
 * SONARIS — Real-time 3D Bathymetric Sonar & 2D Acoustic Waterfall Visualizer
 * Powered by Three.js WebGL & Canvas 2D
 * Responsive for Mobile & Desktop with Touch Support
 */

(function () {
  const container = document.getElementById('hero3DContainer');
  if (!container || typeof THREE === 'undefined') return;

  // WebGL Scene Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081a2e);
  scene.fog = new THREE.FogExp2(0x081a2e, 0.016);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 34, 52);
  camera.lookAt(0, -2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  // 3D Seabed Bathymetric Geometry
  const wSeg = 55, hSeg = 55;
  const geo = new THREE.PlaneGeometry(76, 76, wSeg, hSeg);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Multiscale oceanic bathymetry
    let y = Math.sin(x * 0.16) * 2.4 + Math.cos(z * 0.2) * 2.2;
    y += Math.sin(x * 0.04 + z * 0.04) * 4.8;

    // Shipwreck Target elevation
    const distWreck = Math.sqrt((x - 14) * (x - 14) + (z - 6) * (z - 6));
    if (distWreck < 7) {
      y += (7 - distWreck) * 0.9;
    }

    // Subsea Pipeline Ridge
    if (Math.abs(x + 12) < 3.2 && Math.abs(z) < 24) {
      y += 2.6;
    }

    // Trench depression
    if (Math.abs(z + 16) < 4) {
      y -= 3.2;
    }

    pos.setY(i, y - 6);
  }
  geo.computeVertexNormals();

  // Oceanic Shaded Benthic Material
  const mat = new THREE.MeshPhongMaterial({
    color: 0x0a324d,
    emissive: 0x031828,
    specular: 0x0284c7,
    shininess: 35,
    wireframe: false,
    flatShading: true,
  });
  const terrain = new THREE.Mesh(geo, mat);
  scene.add(terrain);

  // Bioluminescent Bathymetric Wireframe Overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
  const wireframe = new THREE.Mesh(geo, wireMat);
  wireframe.position.y += 0.08;
  scene.add(wireframe);

  // Illumination
  const ambLight = new THREE.AmbientLight(0x0e3b5e, 1.4);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
  dirLight.position.set(25, 45, 25);
  scene.add(dirLight);

  const subLight = new THREE.PointLight(0x10b981, 2.2, 45);
  subLight.position.set(-10, 10, -5);
  scene.add(subLight);

  // Sonar Acoustic Beam Wave (Moving Swath Line)
  const beamGeo = new THREE.PlaneGeometry(80, 2.8);
  beamGeo.rotateX(-Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -1.8;
  scene.add(beam);

  // Detected Targets (Beacons & Vertical Reticle Pillars)
  const targets = [
    { x: 14, z: 6, color: 0x0284c7, label: 'SHIPWRECK' },
    { x: -12, z: -4, color: 0x10b981, label: 'PIPELINE' },
    { x: 8, z: -15, color: 0xd97706, label: 'ANOMALY' },
  ];
  const beacons = [];

  targets.forEach((t) => {
    // Vertical laser coordinate marker
    const bGeo = new THREE.CylinderGeometry(0.18, 0.18, 12, 8);
    const bMat = new THREE.MeshBasicMaterial({
      color: t.color,
      transparent: true,
      opacity: 0.9,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(t.x, 1, t.z);

    // Glowing sonar pulse ring on seabed
    const rGeo = new THREE.RingGeometry(0.9, 1.6, 24);
    rGeo.rotateX(-Math.PI / 2);
    const rMat = new THREE.MeshBasicMaterial({
      color: t.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(t.x, -2.4, t.z);

    scene.add(bMesh);
    scene.add(rMesh);
    beacons.push({ bMesh, rMesh });
  });

  // Interactive Drag & Parallax Handling (Mouse & Touch)
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let targetRotY = 0, targetRotX = 0.18;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('mouseup', () => (isDragging = false));

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      targetRotY = nx * 0.35;
      return;
    }
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    targetRotY += dx * 0.008;
    targetRotX += dy * 0.008;
    targetRotX = Math.max(-0.15, Math.min(0.75, targetRotX));
  });

  // Mobile Touch Drag for 3D rotation
  container.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener('touchend', () => (isDragging = false));

  container.addEventListener(
    'touchmove',
    (e) => {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - prevX;
        const dy = e.touches[0].clientY - prevY;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.008;
        targetRotX = Math.max(-0.15, Math.min(0.75, targetRotX));
      }
    },
    { passive: true }
  );

  // Animation Loop
  let beamZ = -34;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // Beam swath progression
    beamZ += 19 * dt;
    if (beamZ > 34) beamZ = -34;
    beam.position.z = beamZ;

    // Beacon ring pulses
    const elapsed = clock.getElapsedTime();
    beacons.forEach((b) => {
      const scale = 1 + Math.sin(elapsed * 4.2) * 0.35;
      b.rMesh.scale.set(scale, 1, scale);
    });

    // Smooth camera inertia
    scene.rotation.y += (targetRotY - scene.rotation.y) * 0.06;
    scene.rotation.x += (targetRotX - scene.rotation.x) * 0.06;

    renderer.render(scene, camera);
  }
  animate();

  function handleResize() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', handleResize);
  setTimeout(handleResize, 100);

  // 2D Acoustic Sonogram / 3D Bathymetry Toggles
  const btn3D = document.getElementById('btn3D');
  const btn2D = document.getElementById('btn2D');
  const canvas2D = document.getElementById('hero2DCanvas');

  function renderHero2D(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.parentElement.clientWidth;
    const h = c.parentElement.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);

    // Draw realistic acoustic waterfall raster
    const img = ctx.createImageData(w, h);
    let s = 4.2;
    function rnd() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    }

    for (let y = 0; y < h; y++) {
      const rowBase = 24 + Math.sin(y * 0.05) * 12 + Math.cos(y * 0.12) * 6;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let v = rowBase + rnd() * 32 + Math.sin(x * 0.05 + y * 0.02) * 10;
        v = Math.max(0, Math.min(255, v));
        img.data[i] = v * 0.1 + 8; // R
        img.data[i + 1] = v * 0.55 + 24; // G
        img.data[i + 2] = v * 0.85 + 46; // B
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Overlay scan lines
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Tactical Bounding Boxes
    const scale = w < 500 ? 0.7 : 1;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(30 * scale, 50 * scale, 140 * scale, 70 * scale);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('TARGET #01 // SHIPWRECK · 98.4%', 34 * scale, 42 * scale);

    ctx.strokeStyle = '#059669';
    ctx.strokeRect(200 * scale, 130 * scale, 170 * scale, 50 * scale);
    ctx.fillStyle = '#059669';
    ctx.fillText('TARGET #02 // PIPELINE · 94.1%', 204 * scale, 122 * scale);
  }

  if (btn2D && btn3D && canvas2D) {
    btn2D.addEventListener('click', () => {
      btn2D.classList.add('active');
      btn3D.classList.remove('active');
      renderer.domElement.style.display = 'none';
      canvas2D.style.display = 'block';
      renderHero2D(canvas2D);
    });

    btn3D.addEventListener('click', () => {
      btn3D.classList.add('active');
      btn2D.classList.remove('active');
      canvas2D.style.display = 'none';
      renderer.domElement.style.display = 'block';
    });
  }
})();
