// An original procedural scene: no image assets or external visual services.
export function createDreamscape(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, x = 0, velocity = 0, phase = 0, lastPaint = 0, direction = 1;
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize(); window.addEventListener('resize', resize);
  return {
    hit(strength) { direction *= -1; velocity += direction * 330 * strength; },
    draw(now, dt, sound) {
      if (!ctx || document.hidden) return;
      const { bass, mids, highs, active, motion, intensity } = sound;
      if (!motion || !intensity) { x = 0; velocity = 0; }
      // Damped spring: an immediate impact followed by a short elastic recoil.
      const step = Math.min(dt, 1 / 30);
      velocity += (-130 * x - 9 * velocity) * step;
      x = Math.max(-24, Math.min(24, x + velocity * step));
      if (motion) phase += dt * (.12 + (active ? mids * .8 : 0));
      if (now - lastPaint < 30) return; lastPaint = now;
      ctx.clearRect(0, 0, width, height);
      const strength = motion ? intensity : 0;
      const pulse = active ? bass * strength : 0;
      canvas.style.setProperty('--recoil', `${x.toFixed(3)}px`);
      const colors = ['#4876d4', '#9b59cf', '#dc79ac', '#4ebbb7'];
      ctx.globalCompositeOperation = 'screen';
      for (let layer = 0; layer < 4; layer++) {
        const centerX = width * (.15 + layer * .24) + Math.sin(phase + layer) * width * .12;
        const centerY = height * (.2 + (layer % 2) * .45);
        const radius = Math.max(width, height) * (.32 + pulse * .1);
        const glow = ctx.createRadialGradient(centerX + x * (layer + 1), centerY, 0, centerX, centerY, radius);
        glow.addColorStop(0, `${colors[layer]}44`); glow.addColorStop(.5, `${colors[layer]}18`); glow.addColorStop(1, `${colors[layer]}00`);
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      }
      ctx.save(); ctx.translate(width * .65 + x * 2, height * .48 - Math.abs(x) * 1.5);
      ctx.rotate(-.4 + x * .002); ctx.scale(1 + pulse * .13, 1 - pulse * .06);
      // Layered curved filaments form a flowing, translucent fabric.
      const spread = Math.min(width, 1300);
      for (let i = 0; i < 31; i++) {
        const t = i / 30, offset = (t - .5) * height * .36;
        ctx.beginPath();
        for (let segment = 0; segment <= 55; segment++) {
          const u = segment / 55, px = (u - .5) * spread * 1.5;
          const envelope = Math.sin(u * Math.PI);
          const py = offset + Math.sin(u * 7 + phase + t * 3) * height * .17 * envelope + Math.sin(u * 15 - phase * 1.5) * (20 + highs * strength * 70) * envelope + x * Math.sin(u * 12 + t * 5) * envelope * 2;
          if (segment === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        const ribbon = ctx.createLinearGradient(-spread * .7, 0, spread * .7, 0);
        ribbon.addColorStop(0, '#688ed000'); ribbon.addColorStop(.25, `rgba(93,184,200,${.12 + t * .12})`); ribbon.addColorStop(.55, `rgba(182,133,224,${.18 + pulse * .16})`); ribbon.addColorStop(.8, '#eb96be38'); ribbon.addColorStop(1, '#eb96be00');
        ctx.strokeStyle = ribbon; ctx.lineWidth = i % 5 === 0 ? 2 : .8; ctx.stroke();
      }
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    }
  };
}
