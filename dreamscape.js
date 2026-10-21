// An original procedural scene: no image assets or external visual services.
export function createDreamscape(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, x = 0, velocity = 0, phase = 0, lastPaint = 0, direction = 1, colorPhase = 0;
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
      if (motion) { phase += dt * (.12 + (active ? mids * .8 : 0)); colorPhase += dt / 32; }
      if (now - lastPaint < 30) return; lastPaint = now;
      ctx.clearRect(0, 0, width, height);
      const strength = motion ? intensity : 0;
      const pulse = active ? bass * strength : 0;
      canvas.style.setProperty('--recoil', `${x.toFixed(3)}px`);
      const palette = [[105,210,181],[79,150,220],[139,106,208],[65,157,156],[105,210,181]];
      function colorAt(position) {
        const f=((position%1)+1)%1*(palette.length-1), index=Math.floor(f), blend=(1-Math.cos((f-index)*Math.PI))/2;
        return palette[index].map((v,i)=>Math.round(v+(palette[index+1][i]-v)*blend));
      }
      const colors = Array.from({length:4},(_,i)=>colorAt(colorPhase+i*.19));
      const root=document.documentElement.style;
      root.setProperty('--scene-color',colors[0].join(' '));
      root.setProperty('--scene-secondary',colors[1].join(' '));
      root.setProperty('--cover-color-a',`rgb(${colorAt(colorPhase*1.15+.15).join(' ')})`);
      root.setProperty('--cover-color-b',`rgb(${colorAt(colorPhase*1.15+.44).join(' ')})`);
      root.setProperty('--cover-color-c',`rgb(${colorAt(colorPhase*1.15+.72).join(' ')})`);
      root.setProperty('--orb-color-a',`rgb(${colorAt(-colorPhase+.35).join(' ')})`);
      root.setProperty('--orb-color-b',`rgb(${colorAt(-colorPhase+.65).join(' ')})`);
      root.setProperty('--orb-color-c',`rgb(${colorAt(-colorPhase+.92).join(' ')})`);
      ctx.globalCompositeOperation = 'screen';
      for (let layer = 0; layer < 4; layer++) {
        const centerX = width * (.15 + layer * .24) + Math.sin(phase + layer) * width * .12;
        const centerY = height * (.2 + (layer % 2) * .45);
        const radius = Math.max(width, height) * (.32 + pulse * .1);
        const glow = ctx.createRadialGradient(centerX + x * (layer + 1), centerY, 0, centerX, centerY, radius);
        glow.addColorStop(0, `rgba(${colors[layer].join(",")},.42)`); glow.addColorStop(.5, `rgba(${colors[layer].join(",")},.15)`); glow.addColorStop(1, `rgba(${colors[layer].join(",")},0)`);
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      }
      // Phosphor columns and a geometric scope, drawn procedurally.
      for (let col = 0; col < Math.ceil(width / 15); col++) {
        const cx = col * 15 + Math.sin(col * .31 + phase) * (2 + Math.abs(x));
        const brightness = .035 + .08 * (.5 + .5 * Math.sin(col * .7 + phase * 2));
        ctx.fillStyle = `rgba(${colors[col % 4].join(",")},${brightness + pulse * .09})`;
        for (let row = 0; row < Math.ceil(height / 13); row++) {
          const shift = Math.sin(row * .09 + phase + col * .13) * x;
          ctx.fillRect(cx + shift, row * 13, 3, 6);
        }
      }
      ctx.save();ctx.translate(width * .77 + x * 3, height * .36);
      const radius=Math.min(width*.19,200);
      ctx.strokeStyle=`rgba(${colors[1].join(',')},.20)`;ctx.lineWidth=1;
      for(let ring=0;ring<3;ring++) {ctx.beginPath();ctx.arc(0,0,radius*(.5+ring*.25)+pulse*15,0,Math.PI*2);ctx.stroke()}
      ctx.beginPath();ctx.moveTo(-radius*1.3,0);ctx.lineTo(radius*1.3,0);ctx.moveTo(0,-radius*1.3);ctx.lineTo(0,radius*1.3);ctx.stroke();
      ctx.beginPath();for(let point=0;point<90;point++){const u=point/89,px=(u-.5)*radius*2.5,py=Math.sin(u*35+phase*6)*Math.sin(u*Math.PI)*(12+pulse*radius*.65);if(!point)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.restore();
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
        ribbon.addColorStop(0, '#55a36a00'); ribbon.addColorStop(.25, `rgba(${colors[0].join(",")},${.12 + t * .12})`); ribbon.addColorStop(.55, `rgba(${colors[2].join(",")},${.18 + pulse * .16})`); ribbon.addColorStop(.8, '#b9e6a438'); ribbon.addColorStop(1, '#b9e6a400');
        ctx.strokeStyle = ribbon; ctx.lineWidth = i % 5 === 0 ? 2 : .8; ctx.stroke();
      }
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    }
  };
}
