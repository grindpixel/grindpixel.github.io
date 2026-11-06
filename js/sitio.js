// GrindPixel Studio · the site's life: the night sky, things showing as they scroll in, tilting cards, counters,
// the studio's mark (home), the lands' carousel and a playable little Gem Scape board (the game's page).
(function(){
'use strict';
const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GEMS = ['#e8475b', '#ff9d3c', '#ffe14d', '#3fd17a', '#4c8dff', '#b46cff', '#e9f0ff'];
const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => [...(el || document).querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);

// ---- the sky: pixel stars on three depths (they drift with the scroll and the pointer), shooting stars, gem sparks rising
function sky(){
  const cv = document.createElement('canvas'); cv.id = 'sky'; document.body.prepend(cv);
  const g = cv.getContext('2d');
  let W, H, D, stars = [], sparks = [], shoot = null, nextShoot = 2;
  let mx = 0, my = 0, tx = 0, ty = 0;
  const size = () => {
    D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * D; cv.height = H * D;
    const n = Math.round(W * H / 5200);
    stars = Array.from({length:n}, () => ({x:Math.random() * W, y:Math.random() * H * 1.6, z:[0.15, 0.35, 0.7][Math.random() * 3 | 0], p:Math.random() * 6.28, s:Math.random() < 0.12 ? 2 : 1, c:Math.random() < 0.15 ? '#ffe9a8' : Math.random() < 0.2 ? '#b9c6ff' : '#ffffff'}));
  };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { tx = (e.clientX / W - 0.5) * 2; ty = (e.clientY / H - 0.5) * 2; });
  let last = performance.now();
  (function frame(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    const sc = scrollY;
    g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
    for (const s of stars){
      const y = ((s.y - sc * s.z - my * 12 * s.z) % (H * 1.6) + H * 1.6) % (H * 1.6), x = s.x - mx * 16 * s.z;
      if (y > H) continue;
      const tw = CALM ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(now / 1000 * (0.6 + s.z) + s.p));
      g.globalAlpha = tw * (0.35 + s.z); g.fillStyle = s.c; g.fillRect(Math.round(x), Math.round(y), s.s, s.s);
      if (s.s === 2 && tw > 0.85){ g.globalAlpha = (tw - 0.85) * 3; g.fillRect(Math.round(x) - 2, Math.round(y) + 0.5, 6, 1); g.fillRect(Math.round(x) + 0.5, Math.round(y) - 2, 1, 6); }
    }
    if (!CALM){
      // a gem spark now and then, rising slowly from the bottom
      if (sparks.length < 18 && Math.random() < dt * 1.6) sparks.push({x:rnd(0, W), y:H + 6, v:rnd(14, 34), c:GEMS[Math.random() * 7 | 0], p:rnd(0, 6.28), life:0});
      for (const s of sparks){ s.y -= s.v * dt; s.life += dt; s.x += Math.sin(now / 900 + s.p) * 0.2; }
      sparks = sparks.filter(s => s.y > -10);
      for (const s of sparks){ const a = Math.min(1, s.life) * Math.min(1, s.y / (H * 0.5)); g.globalAlpha = a * 0.7; g.fillStyle = s.c; const x = Math.round(s.x), y = Math.round(s.y); g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
      // a shooting star
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0){ shoot = {x:rnd(W * 0.2, W), y:rnd(0, H * 0.4), vx:-rnd(380, 560), vy:rnd(140, 220), t:0}; nextShoot = rnd(4, 9); }
      if (shoot){
        shoot.t += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt;
        for (let i = 0; i < 18; i++){ g.globalAlpha = (1 - i / 18) * Math.min(1, 1.4 - shoot.t); g.fillStyle = i < 2 ? '#fff' : '#ffe9a8'; g.fillRect(Math.round(shoot.x - shoot.vx * i * 0.006), Math.round(shoot.y - shoot.vy * i * 0.006), i < 2 ? 2 : 1, 1); }
        if (shoot.t > 1.4) shoot = null;
      }
    }
    g.globalAlpha = 1;
    requestAnimationFrame(frame);
  })(last);
}

// ---- things show as they scroll in ([data-rv], their children one after another with [data-rv-kids])
function reveal(){
  const els = $$('[data-rv], [data-rv-kids] > *');
  if (CALM || location.hash === '#todo' || !('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('in')); return; }   // (#todo: everything at once, for full-page screenshots)
  $$('[data-rv-kids]').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.08) + 's')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:0.12, rootMargin:'0px 0px -6% 0px'});
  els.forEach(e => io.observe(e));
}

// ---- cards lean towards the pointer, with a glint following it
function tilt(){
  if (CALM || matchMedia('(hover: none)').matches) return;
  for (const el of $$('.tilt')){
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
      el.style.setProperty('--gx', (x * 100) + '%'); el.style.setProperty('--gy', (y * 100) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }
}

// ---- numbers count up when they come in sight ([data-count])
function counters(){
  const els = $$('[data-count]');
  const run = el => { const n = +el.dataset.count, t0 = performance.now(); (function f(now){ const k = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(n * e); if (k < 1) requestAnimationFrame(f); })(t0); };
  if (CALM || !('IntersectionObserver' in window)){ els.forEach(e => e.textContent = e.dataset.count); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ run(e.target); io.unobserve(e.target); } }), {threshold:0.6});
  els.forEach(e => io.observe(e));
}

// ---- the studio's mark (home): the diamond, its broken tip hovering over the crack, the name built cell by cell; a tap
// breaks it again
function mark(){
  const cv = $('#marca'); if (!cv || !window.MARCA) return;
  const M = window.MARCA, g = cv.getContext('2d');
  const rows = M.nombre.renglones, CELL = 7, GAP = 2;
  const nameW = Math.max(...rows.map(r => r.columnas * CELL * r.escala)), nameH = rows.reduce((a, r) => a + M.nombre.filas * CELL * r.escala, 0) + GAP * CELL;
  const DIA = 90.5, S = 2.1;   // the diamond's span in its units, drawn ×S
  const LW = Math.max(nameW, DIA * S) + 40, LH = DIA * S + 46 + nameH + 30;
  let D, scale, born = performance.now(), burst = -10, hover = 0, px = 0, py = 0, tpx = 0, tpy = 0;
  const cells = [];
  let y0 = 0;
  rows.forEach((r, ri) => {
    const c = CELL * r.escala, w = r.columnas * c, x0 = (LW - w) / 2;
    for (const [cx, cy, li] of r.celdas) cells.push({x:x0 + cx * c, y:y0 + cy * c, s:Math.ceil(c), li, fx:rnd(-160, 160), fy:rnd(-120, 60)});
    y0 += M.nombre.filas * c + GAP * CELL;
  });
  const fit = () => { D = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth; scale = w / LW; cv.width = w * D; cv.height = LH * scale * D; cv.style.height = (LH * scale) + 'px'; };
  fit(); addEventListener('resize', fit);
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); tpx = (e.clientX - r.left) / r.width - 0.5; tpy = (e.clientY - r.top) / r.height - 0.5; hover = 1; });
  cv.addEventListener('pointerleave', () => { tpx = tpy = 0; hover = 0; });
  cv.addEventListener('click', () => { burst = performance.now(); });
  const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const poly = (pts, ox, oy, rot, cx, cy) => { g.beginPath(); pts.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, c = Math.cos(rot), s = Math.sin(rot); const X = cx + dx * c - dy * s + ox, Y = cy + dx * s + dy * c + oy; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill(); };
  (function frame(now){
    const t = (now - born) / 1000, tb = (now - burst) / 1000;
    px += (tpx - px) * 0.06; py += (tpy - py) * 0.06;
    g.setTransform(D * scale, 0, 0, D * scale, 0, 0); g.clearRect(0, 0, LW, LH);
    // the diamond
    const cx = LW / 2 - 32 * S, cy = 30 + 13.3 * S;
    g.save(); g.translate(cx + px * 10, cy + py * 8); g.scale(S, S);
    const a = CALM ? 1 : ease(t / 0.9);
    g.globalAlpha = a;
    g.shadowColor = '#e8bf5c'; g.shadowBlur = 18 + 10 * Math.sin(t * 2);
    g.fillStyle = '#fff'; poly(M.solido, 0, (1 - a) * 18, 0, 0, 0);
    g.shadowBlur = 0;
    // the pieces of the tip: they hover over the crack, bob, follow the pointer; a tap throws them out and they come back
    M.trozos.forEach((p, i) => {
      const k = CALM ? 1 : ease((t - 0.7 - i * 0.07) / 0.8);
      const b = Math.sin(t * 1.6 + i) * 1.4, kb = tb < 1.6 ? Math.sin(Math.min(1, tb / 1.6) * Math.PI) : 0;
      const lift = 3 + hover * 2 + kb * 30;
      const ox = p.velocidad[0] * (0.25 + kb * 2.2) + px * (4 + i), oy = p.velocidad[1] * (0.18 + kb * 1.6) - lift * k + b + py * 3;
      g.globalAlpha = k; g.fillStyle = '#fff';
      poly(p.poligono, ox * k, oy * k + (1 - k) * 12, (p.giro_grados * (0.6 + kb * 6) + Math.sin(t + i) * 3) * Math.PI / 180 * k, p.centro[0], p.centro[1]);
    });
    g.restore();
    // the name: each letter's cells fly in, in order
    g.globalAlpha = 1;
    const ny = 30 + DIA * S + 16;
    for (const c of cells){
      const k = CALM ? 1 : ease((t - 1.1 - c.li * 0.07) / 0.55);
      if (k <= 0) continue;
      g.globalAlpha = k; g.fillStyle = c.li >= 10 ? '#cfd3f2' : '#fff';
      g.fillRect(c.x + c.fx * (1 - k) + px * 4, ny + c.y + c.fy * (1 - k) + py * 3, c.s - 0.6, c.s - 0.6);
    }
    requestAnimationFrame(frame);
  })(born);
}

// ---- the lands' carousel: arrows, the dots, the glow takes the land's colour
function lands(){
  const sc = $('.carrusel'); if (!sc) return;
  const items = $$('.carrusel > *', sc.parentNode), dots = $('.cdots'), box = sc.closest('section');
  items.forEach((it, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Tierra ' + (i + 1)); b.onclick = () => it.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); dots.appendChild(b); });
  const step = d => { const w = items[0].getBoundingClientRect().width + 22; sc.scrollBy({left:d * w, behavior:'smooth'}); };
  $('.cprev').onclick = () => step(-1); $('.cnext').onclick = () => step(1);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.intersectionRatio > 0.6){ const i = items.indexOf(e.target); $$('button', dots).forEach((b, j) => b.classList.toggle('on', i === j)); box.style.setProperty('--land', e.target.dataset.c); } }), {root:sc, threshold:[0.6]});
  items.forEach(it => io.observe(it));
}

// ---- a playable little board (the game's page): thin arrows in the seven colours, each leaves along its own path when
// nothing stands in its way; built backwards so it always has a way out
function board(){
  const cv = $('#tablero'); if (!cv) return;
  const g = cv.getContext('2d'), COLS = 7, ROWS = 8, C = 14, PAD = 6, W = COLS * C + PAD * 2, H = ROWS * C + PAD * 2;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const hud = {hearts:$('#tHearts'), left:$('#tLeft'), msg:$('#tMsg'), again:$('#tAgain')};
  let arrows, occ, hearts, idle, fx = [], over = false, seed = 0;
  cv.width = W; cv.height = H;
  const inside = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
  const key = (x, y) => y * COLS + x;
  function build(){
    for (let tries = 0; tries < 60; tries++){
      const o = new Array(COLS * ROWS).fill(-1), list = [];
      for (let k = 0; k < 900 && o.filter(v => v >= 0).length < COLS * ROWS * 0.72; k++){
        const hx = Math.random() * COLS | 0, hy = Math.random() * ROWS | 0;
        if (o[key(hx, hy)] >= 0) continue;
        const [dx, dy] = DIRS[Math.random() * 4 | 0];
        const exit = []; let ex = hx + dx, ey = hy + dy, ok = true;
        while (inside(ex, ey)){ if (o[key(ex, ey)] >= 0){ ok = false; break; } exit.push(key(ex, ey)); ex += dx; ey += dy; }
        if (!ok) continue;
        const cells = [[hx, hy]], len = 2 + (Math.random() * 4 | 0); let [cx, cy] = [hx, hy], [ddx, ddy] = [dx, dy];
        while (cells.length < len){
          const opts = cells.length === 1 ? [[ddx, ddy]] : [[ddx, ddy], [ddx, ddy], [ddx, ddy], [ddy, ddx], [-ddy, -ddx]].sort(() => Math.random() - 0.5);   // (straight behind the head: a turn there hid which way it points)
          let moved = false;
          for (const [sx, sy] of opts){ const nx = cx - sx, ny = cy - sy; if (!inside(nx, ny) || o[key(nx, ny)] >= 0 || cells.some(([a, b]) => a === nx && b === ny) || exit.includes(key(nx, ny))) continue; cells.push([nx, ny]); cx = nx; cy = ny; ddx = sx; ddy = sy; moved = true; break; }
          if (!moved) break;
        }
        if (cells.length < 2) continue;
        const id = list.length; for (const [x, y] of cells) o[key(x, y)] = id;
        const path = cells.slice().reverse(); let [lx, ly] = [hx, hy];
        for (let i = 0; i < Math.max(COLS, ROWS) + cells.length + 1; i++){ lx += dx; ly += dy; path.push([lx, ly]); }
        list.push({cells, path, n:cells.length, d:[dx, dy], c:GEMS[(id + seed) % 7], s:0, go:false, gone:false, bump:0, shake:0});
      }
      if (list.length >= 9){ arrows = list; occ = o; return; }
    }
  }
  function reset(fresh){
    if (fresh || !arrows){ seed = Math.random() * 7 | 0; build(); }
    else { arrows.forEach(a => { a.s = 0; a.go = a.gone = false; a.bump = a.shake = 0; }); occ = new Array(COLS * ROWS).fill(-1); arrows.forEach((a, i) => a.cells.forEach(([x, y]) => occ[key(x, y)] = i)); }
    hearts = 3; over = false; idle = 0; hud.msg.textContent = ''; hud.again.hidden = true; ui();
  }
  function ui(){
    hud.hearts.innerHTML = [0, 1, 2].map(i => `<i class="${i < hearts ? '' : 'off'}"></i>`).join('');
    hud.left.textContent = arrows.filter(a => !a.gone && !a.go).length;
  }
  const blockAt = a => { const [hx, hy] = a.cells[0], [dx, dy] = a.d; let x = hx + dx, y = hy + dy, n = 1; while (inside(x, y)){ if (occ[key(x, y)] >= 0) return n; x += dx; y += dy; n++; } return 0; };
  function tap(e){
    if (over) return;
    const r = cv.getBoundingClientRect(), x = Math.floor(((e.clientX - r.left) / r.width * W - PAD) / C), y = Math.floor(((e.clientY - r.top) / r.height * H - PAD) / C);
    if (!inside(x, y)) return;
    const id = occ[key(x, y)]; if (id < 0) return;
    const a = arrows[id]; idle = 0;
    const b = blockAt(a);
    if (b){ a.bump = b - 0.55; a.shake = 1; hearts--; ui(); flash(a.cells[0], '#ff4466');
      if (hearts <= 0){ over = true; hud.msg.textContent = 'Sin corazones: el orden importa.'; hud.again.textContent = 'REINTENTAR'; hud.again.hidden = false; hud.again.onclick = () => reset(false); }
      return; }
    a.go = true; for (const [cx, cy] of a.cells) occ[key(cx, cy)] = -1; ui();
    if (arrows.every(q => q.go)) setTimeout(win, 650);
  }
  function flash([x, y], c){ for (let i = 0; i < 10; i++) fx.push({x:PAD + x * C + C / 2, y:PAD + y * C + C / 2, vx:rnd(-40, 40), vy:rnd(-40, 40), c, t:0, life:rnd(0.3, 0.6)}); }
  function win(){
    over = true; hud.msg.textContent = '¡Tablero vacío! Así se juega Gem Scape.'; hud.again.textContent = 'OTRO TABLERO'; hud.again.hidden = false; hud.again.onclick = () => reset(true);
    for (let i = 0; i < 70; i++) fx.push({x:W / 2, y:H / 2, vx:rnd(-90, 90), vy:rnd(-110, 50), c:GEMS[i % 7], t:0, life:rnd(0.8, 1.6), grav:1});
  }
  cv.addEventListener('pointerdown', tap);
  const at = (a, u) => { const i = Math.max(0, Math.min(a.path.length - 2, Math.floor(u))), f = u - i, p = a.path[i], q = a.path[i + 1]; return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]; };
  const px = v => PAD + v * C + C / 2;
  function seg(x1, y1, x2, y2){ const x = Math.round(Math.min(x1, x2)), y = Math.round(Math.min(y1, y2)); g.fillRect(x - 1, y - 1, Math.round(Math.abs(x2 - x1)) + 2, Math.round(Math.abs(y2 - y1)) + 2); }
  function drawArrow(a, now){
    const s = a.s + (a.bump > 0 ? Math.sin(Math.min(1, a.shake) * Math.PI) * a.bump : 0);
    const pts = [at(a, s)]; for (let i = Math.floor(s) + 1; i < s + a.n - 1; i++) pts.push(a.path[i]); pts.push(at(a, s + a.n - 1));
    const P = pts.map(([x, y]) => [px(x), px(y)]);
    const hint = !over && idle > 5 && a === hinted;
    g.fillStyle = a.shake > 0 && a.bump > 0 ? '#ff6b7d' : a.c;
    if (hint){ g.globalAlpha = 0.5 + 0.5 * Math.sin(now / 160); }
    for (let i = 0; i < P.length - 1; i++) seg(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]);
    // the head: a little chevron
    const [hx, hy] = P[P.length - 1], [dx, dy] = a.d, X = Math.round(hx), Y = Math.round(hy);
    for (let k = 1; k <= 2; k++){ const bx = X - dx * k * 1.5, by = Y - dy * k * 1.5; g.fillRect(Math.round(bx + dy * k * 1.5) - 1, Math.round(by + dx * k * 1.5) - 1, 2, 2); g.fillRect(Math.round(bx - dy * k * 1.5) - 1, Math.round(by - dx * k * 1.5) - 1, 2, 2); }
    g.fillRect(X - 1 + dx, Y - 1 + dy, 2, 2);
    // the tail: a small gem dot
    g.fillStyle = '#ffffff'; g.globalAlpha *= 0.55; g.fillRect(Math.round(P[0][0]) - 1, Math.round(P[0][1]) - 1, 2, 2);
    g.globalAlpha = 1;
  }
  let hinted = null, last = performance.now();
  function frame(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now; idle += dt;
    if (idle > 5 && (!hinted || hinted.go || blockAt(hinted))) hinted = arrows.find(a => !a.go && !blockAt(a)) || null;
    g.clearRect(0, 0, W, H);
    // the board: dark tiles, a dotted grid, a gold frame
    g.fillStyle = '#0d0f2a'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#161a44'; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) g.fillRect(PAD + x * C, PAD + y * C, C, C);
    g.fillStyle = '#2a2f6a'; for (let y = 0; y <= ROWS; y++) for (let x = 0; x <= COLS; x++) g.fillRect(PAD + x * C, PAD + y * C, 1, 1);
    g.save(); g.beginPath(); g.rect(PAD - 2, PAD - 2, COLS * C + 4, ROWS * C + 4); g.clip();
    for (const a of arrows){
      if (a.gone) continue;
      if (a.go){ a.s += dt * (8 + a.s * 3); if (a.s > a.path.length - a.n - 1) a.gone = true; }
      if (a.shake > 0){ a.shake += dt * 2.6; if (a.shake >= 1){ a.shake = 0; a.bump = 0; } }
      drawArrow(a, now);
    }
    g.restore();
    g.strokeStyle = '#e8bf5c'; g.lineWidth = 2; g.strokeRect(PAD - 3, PAD - 3, COLS * C + 6, ROWS * C + 6);
    g.strokeStyle = '#8a5d10'; g.lineWidth = 1; g.strokeRect(PAD - 4.5, PAD - 4.5, COLS * C + 9, ROWS * C + 9);
    for (const p of fx){ p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.grav) p.vy += 140 * dt; g.globalAlpha = Math.max(0, 1 - p.t / p.life); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    fx = fx.filter(p => p.t < p.life); g.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  reset(true); requestAnimationFrame(frame);
}

// ---- the page's top bar darkens once the page scrolls
function bar(){ const b = $('.bar'); if (!b) return; const f = () => b.classList.toggle('solid', scrollY > 30); f(); addEventListener('scroll', f, {passive:true}); }

sky(); reveal(); tilt(); counters(); mark(); lands(); board(); bar();
})();
