// Original procedural atmosphere: soft cloud volumes, refracted light, and drifting dust.
// The haze is painted at low resolution so it stays soft without full-screen blur filters.
export function createDreamscape(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const fog = document.createElement('canvas');
  const fogCtx = fog.getContext('2d', { alpha: true });
  let width = 0, height = 0, x = 0, velocity = 0;
  let phase = 0, lastPaint = 0, direction = 1, colorPhase = 0, glowBoost = 0;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : 0));
  const dust = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 137.508 + 29) % 997) / 997,
    y: ((i * 263.17 + 91) % 991) / 991,
    size: .45 + (i % 4) * .2,
    speed: .12 + (i % 7) * .027,
  }));
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    const fogRatio = Math.min(.38, 530 / Math.max(width, height));
    fog.width = Math.max(1, Math.round(width * fogRatio));
    fog.height = Math.max(1, Math.round(height * fogRatio));
  }
  resize(); window.addEventListener('resize', resize);

  function cloud(cx, cy, rx, ry, color, opacity) {
    fogCtx.save();
    fogCtx.translate(cx * fog.width, cy * fog.height);
    fogCtx.scale(rx * fog.width, ry * fog.height);
    const glow = fogCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, `rgba(${color},${opacity})`);
    glow.addColorStop(.34, `rgba(${color},${opacity * .56})`);
    glow.addColorStop(.72, `rgba(${color},${opacity * .12})`);
    glow.addColorStop(1, `rgba(${color},0)`);
    fogCtx.fillStyle = glow; fogCtx.fillRect(-1, -1, 2, 2);
    fogCtx.restore();
  }
  return {
    hit(strength) {
      direction *= -1;
      velocity = clamp(velocity + direction * 220 * clamp(strength, 0, 1), -170, 170);
    },
    draw(now, dt, sound) {
      if (!ctx || !fogCtx || document.hidden || !width || !height) return;
      const { motion, active } = sound;
      const intensity = clamp(sound.intensity, 0, 1);
      const bass = clamp(sound.bass, 0, 1), mids = clamp(sound.mids, 0, 1), highs = clamp(sound.highs, 0, 1);
      const elapsed = clamp(dt, 0, .05);
      const targetBoost = motion ? clamp(sound.boost, 0, 1) * intensity : 0;
      glowBoost += (targetBoost - glowBoost) * (1 - Math.exp(-elapsed / .5));
      if (!motion) glowBoost = 0;
      if (!motion || !intensity) { x = 0; velocity = 0; }
      const step = Math.min(elapsed, 1 / 30);
      velocity += (-130 * x - 9 * velocity) * step;
      x = clamp(x + velocity * step, -24, 24);
      if (motion) {
        phase += elapsed * (.075 + (active ? Math.min(.16, mids * .25) : 0));
        colorPhase = (colorPhase + elapsed / 56) % 20;
      }
      if (now - lastPaint < 32) return;
      lastPaint = now;
      const pulse = motion ? bass * intensity : 0;
      canvas.style.setProperty('--recoil', `${x.toFixed(3)}px`);
      const palette = [[95,198,190], [91,140,227], [135,104,204], [172,137,221], [81,179,165], [95,198,190]];
      function colorAt(position) {
        const f = ((position % 1) + 1) % 1 * (palette.length - 1);
        const index = Math.floor(f), blend = (1 - Math.cos((f - index) * Math.PI)) / 2;
        const mixed = palette[index].map((v, i) => v + (palette[index + 1][i] - v) * blend);
        const mean = mixed.reduce((sum, v) => sum + v, 0) / 3;
        return mixed.map(v => Math.round(clamp(mean + (v - mean) * (.9 + glowBoost * 1.5), 0, 255)));
      }
      const colors = Array.from({ length: 5 }, (_, i) => colorAt(colorPhase + i * .19));
      const root = document.documentElement.style;
      root.setProperty('--scene-color', colors[0].join(' '));
      root.setProperty('--scene-secondary', colors[1].join(' '));
      for (const [letter, offset] of [['a', .15], ['b', .44], ['c', .72]]) {
        root.setProperty(`--cover-color-${letter}`, `rgb(${colorAt(colorPhase * 1.15 + offset).join(' ')})`);
      }
      for (const [letter, offset] of [['a', .35], ['b', .65], ['c', .92]]) {
        root.setProperty(`--orb-color-${letter}`, `rgb(${colorAt(-colorPhase + offset).join(' ')})`);
      }

      ctx.clearRect(0, 0, width, height);
      fogCtx.clearRect(0, 0, fog.width, fog.height);
      fogCtx.globalCompositeOperation = 'screen';
      const drift = phase * .45;
      const luminance = .34 + glowBoost * .22;
      // Overlapping elliptical volumes form a slow, uneven sea of light.
      for (let layer = 0; layer < 7; layer++) {
        const cx = .1 + layer * .145 + Math.sin(drift + layer * 1.8) * .12 + x / width;
        const cy = .26 + Math.sin(layer * 2.3 + drift * .7) * .25;
        cloud(cx, cy, .37 + layer % 2 * .1, .34 + layer % 3 * .075, colors[layer % 5].join(','), luminance * (layer % 2 ? .9 : .64));
      }
      cloud(.15 + Math.sin(drift * .4) * .12, .86, .65, .32, colors[2].join(','), luminance * .75);
      cloud(.82, .65 + Math.cos(drift * .6) * .12, .52, .43, colors[0].join(','), luminance * .8);
      // A broad translucent aurora folds across the cloud field; no hard stripes.
      for (let ribbon = 0; ribbon < 3; ribbon++) {
        const y = .32 + ribbon * .18;
        for (let veil = 0; veil < 4; veil++) {
          fogCtx.beginPath();
          for (let segment = 0; segment <= 38; segment++) {
            const u = segment / 38;
            const py = y + Math.sin(u * 5.5 + phase * .65 + ribbon) * .12 + Math.sin(u * 9 - phase * .4) * .035 + veil * .008;
            const px = (u * 1.3 - .15) * fog.width;
            const bentY = py * fog.height + x * Math.sin(u * 7) * .15;
            if (!segment) fogCtx.moveTo(px, bentY); else fogCtx.lineTo(px, bentY);
          }
          const light = fogCtx.createLinearGradient(0, 0, fog.width, 0);
          const color = colors[(ribbon + 1) % 5].join(',');
          light.addColorStop(0, `rgba(${color},0)`);
          light.addColorStop(.35, `rgba(${color},${.03 + glowBoost * .025})`);
          light.addColorStop(.68, `rgba(${color},${.07 + glowBoost * .055})`);
          light.addColorStop(1, `rgba(${color},0)`);
          fogCtx.strokeStyle = light; fogCtx.lineWidth = (11 + veil * 11) * fog.height / 250;
          fogCtx.stroke();
        }
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(fog, 0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      // Thin, irregular light contours preserve the original signal-ribbon identity.
      ctx.save();
      ctx.translate(width * .6 + x * 1.7, height * .48 - Math.abs(x));
      ctx.rotate(-.3 + x * .0015);
      const spread = Math.min(width, 1500);
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        ctx.beginPath();
        for (let segment = 0; segment <= 48; segment++) {
          const u = segment / 48;
          const px = (u - .5) * spread * 1.5;
          const envelope = Math.sin(u * Math.PI);
          const py = (t - .5) * height * .27 + Math.sin(u * 6 + phase * .6 + t * 2) * height * .14 * envelope + Math.sin(u * 13 - phase) * (12 + highs * intensity * 35) * envelope + x * Math.sin(u * 10 + t * 4) * envelope;
          if (!segment) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        const color = colors[i % 5].join(',');
        const thread = ctx.createLinearGradient(-spread * .7, 0, spread * .7, 0);
        thread.addColorStop(0, `rgba(${color},0)`);
        thread.addColorStop(.4, `rgba(${color},${.055 + pulse * .04})`);
        thread.addColorStop(.72, `rgba(${color},${.14 + pulse * .05})`);
        thread.addColorStop(1, `rgba(${color},0)`);
        ctx.strokeStyle = thread; ctx.lineWidth = i % 4 === 0 ? 1.2 : .65; ctx.stroke();
      }
      ctx.restore();

      // Partial lens arcs and sparse dust give depth without a repetitive grid.
      ctx.save();
      ctx.translate(width * .76 + x * 1.2, height * .39);
      ctx.rotate(-.55 + Math.sin(phase * .2) * .12);
      const radius = Math.min(width * .24, 300);
      for (let lens = 0; lens < 3; lens++) {
        ctx.strokeStyle = `rgba(${colors[(lens + 2) % 5].join(',')},${.06 + lens * .025})`;
        ctx.lineWidth = lens === 1 ? .8 : .45;
        ctx.beginPath(); ctx.ellipse(0, 0, radius * (1 + lens * .17), radius * (.33 + lens * .13), 0, .15, Math.PI * 1.55); ctx.stroke();
      }
      ctx.restore();
      const count = width < 700 ? 16 : dust.length;
      for (let i = 0; i < count; i++) {
        const mote = dust[i];
        const mx = mote.x * width + Math.sin(phase * mote.speed + i) * 17 + x * .2;
        const my = mote.y * height + Math.cos(phase * mote.speed * .8 + i) * 14;
        const alpha = .12 + (.5 + .5 * Math.sin(phase * .5 + i * 1.7)) * .24;
        ctx.fillStyle = `rgba(220,234,245,${alpha})`;
        ctx.beginPath(); ctx.arc(mx, my, mote.size, 0, Math.PI * 2); ctx.fill();
      }
      // A handful of faint vertical remnants retain an analog-memory feel.
      ctx.fillStyle = `rgba(${colors[1].join(',')},.035)`;
      for (let i = 0; i < 5; i++) ctx.fillRect(width * ((i * .239 + .07) % 1), height * .18, .5, height * .62);
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
