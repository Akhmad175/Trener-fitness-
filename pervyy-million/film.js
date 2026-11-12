// THE FILM — "Первый миллион". Every frame is a pure function of t, timed from score.js.
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, S = globalThis.SCORE, Studio = globalThis.Studio, Shots = globalThis.Shots;
  const { T, BEAT, ev, clock } = S;
  const { clamp, lerp, ease, pulse } = U;
  const W = G.W, H = G.H;
  const GROUND = 1380;
  const INK = '#2A2433';

  // ---------- cast ----------
  const SKIN = '#EFC6A0';
  const BOY = { skin: SKIN, hair: '#6B4426', hairStyle: 'short', outfit: 'tee', shirt: '#7E95B8', bottoms: 'shorts', shorts: '#55606F', build: 'slim', shoes: '#5B4A3A' };
  const TEEN = { ...BOY, outfit: 'hoodie', shirt: '#3F6E8C', bottoms: 'pants', shorts: '#2F3442', shoes: '#E8E2D6' };
  const MAN = { ...BOY, hairStyle: 'quiff', outfit: 'shirt', shirt: '#F4F1EA', bottoms: 'pants', shorts: '#2C3A55', build: 'regular', facialHair: 'stubble', shoes: '#2A2A2A' };
  const MAN_SUIT = { ...MAN, outfit: 'suit', robe: '#2C3A55', trim: '#C8473B', shirt: '#FFFFFF' };
  const MOM = { skin: SKIN, hair: '#5A3A22', hairStyle: 'bun', outfit: 'dress', shirt: '#9C5A5E', build: 'regular', shoes: '#4A3A30' };
  const MOM_NEW = { ...MOM, shirt: '#D9765F' };
  const FRIEND1 = { skin: '#D9A77E', hair: '#2A1E18', hairStyle: 'curly', outfit: 'tee', shirt: '#E0A43B', bottoms: 'pants', shorts: '#3A3F4F', glasses: 'round' };
  const FRIEND2 = { skin: '#F3D2B5', hair: '#C9A15A', hairStyle: 'ponytail', outfit: 'hoodie', shirt: '#4E9A57', bottoms: 'pants', shorts: '#2F3442' };
  globalThis.CAST = { boy: BOY, teen: TEEN, man: MAN, mom: MOM, friend1: FRIEND1, friend2: FRIEND2 };

  const rub = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  const lastBefore = (list, t) => { let k = -1; for (let i = 0; i < list.length; i++) if (list[i].t <= t) k = i; return k; };
  // simple lip-sync: the mouth flaps while that character's line is playing
  const talk = (t, who, rest) => {
    const v = S.VO.find((l) => l.who === who && t >= l.at && t < l.at + l.dur - 0.08);
    if (!v) return rest;
    const ph = (t - v.at) * 9 + U.noise1(t * 6, 5) * 1.5;
    return Math.sin(ph * Math.PI) > 0 ? 'open' : (rest === 'smile' ? 'smile' : 'o');
  };

  // ---------- props ----------
  function wall(ctx, top, bottom, color, seed) {
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 300, 0, GROUND);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
    G.poly(ctx, [[-20, GROUND], [W + 20, GROUND], [W + 20, H + 20], [-20, H + 20]], { fill: color, lw: 5, seed, hatch: { color: 'rgba(0,0,0,0.12)', gap: 10 } });
  }
  function windowFrame(ctx, x, y, w, h, { sky = ['#1B2347', '#2E3A6B'], moon = true, rain = 0, t = 0, seed = 1 } = {}) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (moon) G.ellipse(ctx, x + w * 0.7, y + h * 0.3, 34, 34, { fill: '#F6E7B0', lw: 3, seed: seed + 3 });
    if (rain > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = `rgba(200,215,240,${0.6 * rain})`; ctx.lineWidth = 3;
      for (let i = 0; i < 26; i++) { const rx = x + U.hash(i, seed) * w, ry = y + ((U.hash(i, seed + 9) * h + t * 900) % h); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 10, ry + 34); ctx.stroke(); }
      ctx.restore();
    }
    G.rrect(ctx, x, y, w, h, 6, { stroke: INK, lw: 10, seed });
    G.line(ctx, [[x + w / 2, y], [x + w / 2, y + h]], { color: INK, lw: 8, seed: seed + 1 });
    G.line(ctx, [[x, y + h / 2], [x + w, y + h / 2]], { color: INK, lw: 8, seed: seed + 2 });
  }
  function bulb(ctx, x, t, on = 1) {
    const sway = Math.sin(t * 1.3) * 0.05;
    ctx.save(); ctx.translate(x, 0); ctx.rotate(sway);
    G.line(ctx, [[0, 0], [0, 520]], { color: INK, lw: 4, seed: 41 });
    if (on) {
      const gl = ctx.createRadialGradient(0, 545, 0, 0, 545, 420);
      gl.addColorStop(0, 'rgba(255,220,140,0.45)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = gl; ctx.fillRect(-420, 125, 840, 840);
    }
    G.ellipse(ctx, 0, 548, 26, 32, { fill: on ? '#FFE9A8' : '#CFC6B0', lw: 4, seed: 42 });
    ctx.restore();
  }
  function table(ctx, cx, top, w, color = '#8A5A3B') {
    G.rrect(ctx, cx - w / 2, top, w, 34, 6, { fill: color, lw: 6, seed: 51, hatch: { color: 'rgba(0,0,0,0.15)', gap: 9 } });
    G.rrect(ctx, cx - w / 2 + 30, top + 34, 26, GROUND - top - 34, 4, { fill: G.tint(color, -0.2), lw: 5, seed: 52 });
    G.rrect(ctx, cx + w / 2 - 56, top + 34, 26, GROUND - top - 34, 4, { fill: G.tint(color, -0.2), lw: 5, seed: 53 });
  }
  function stool(ctx, x, seat, w = 120, seed = 60) {
    G.rrect(ctx, x - w / 2, seat, w, 22, 5, { fill: '#6E4A35', lw: 5, seed });
    G.line(ctx, [[x - w / 2 + 16, seat + 22], [x - w / 2 + 8, GROUND]], { color: INK, lw: 8, seed: seed + 1 });
    G.line(ctx, [[x + w / 2 - 16, seat + 22], [x + w / 2 - 8, GROUND]], { color: INK, lw: 8, seed: seed + 2 });
  }
  function coin(ctx, x, y, r = 20, seed = 1) {
    G.ellipse(ctx, x, y, r, r * 0.92, { fill: '#F2B84B', lw: 4, seed });
    G.ellipse(ctx, x, y, r * 0.62, r * 0.56, { stroke: '#B07A1E', lw: 3, seed: seed + 1 });
  }
  function jar(ctx, x, y, fill, seed = 70) {
    const w = 120, h = 150;
    if (fill > 0) {
      const fh = (h - 20) * fill;
      for (let i = 0; i < Math.round(fill * 14); i++) coin(ctx, x - w / 2 + 25 + U.hash(i, 3) * (w - 50), y - 14 - U.hash(i, 4) * fh, 14, seed + 10 + i);
    }
    G.rrect(ctx, x - w / 2, y - h, w, h, 18, { stroke: INK, lw: 6, seed, fill: 'rgba(200,230,240,0.25)' });
    G.rrect(ctx, x - w / 2 - 8, y - h - 14, w + 16, 22, 6, { fill: '#C8473B', lw: 5, seed: seed + 1 });
  }
  function cloud(ctx, x, y, s, color, seed) {
    for (const [dx, dy, r] of [[-70, 10, 55], [0, -20, 75], [75, 8, 58], [20, 30, 60]]) G.ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.8, { fill: color, lw: 5, seed: seed + dx });
  }
  function panelBlock(ctx, x, w, h, color, seed) {
    G.rrect(ctx, x, GROUND - 180 - h, w, h, 4, { fill: color, lw: 5, seed, hatch: { color: 'rgba(0,0,0,0.08)', gap: 14 } });
    for (let r = 0; r < Math.floor(h / 70); r++) for (let c = 0; c < Math.floor(w / 60); c++) {
      const lit = U.hash(seed, r, c) > 0.45;
      ctx.fillStyle = lit ? '#BFD6E6' : '#7F93A6';
      ctx.fillRect(x + 18 + c * 60, GROUND - 180 - h + 22 + r * 70, 30, 36);
    }
  }
  function laptop(ctx, x, y, s, t, glow = '#9FD3FF', seed = 80) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    G.poly(ctx, [[-120, 0], [120, 0], [100, -150], [-100, -150]], { fill: '#3A3F4F', lw: 6, seed });
    ctx.fillStyle = glow; ctx.fillRect(-88, -138, 176, 120);
    for (let i = 0; i < 6; i++) { const lw = 40 + U.hash(i, Math.floor(t * 4)) * 100; ctx.fillStyle = 'rgba(30,40,70,0.5)'; ctx.fillRect(-78, -128 + i * 18, lw, 7); }
    G.rrect(ctx, -140, 0, 280, 18, 6, { fill: '#5A6070', lw: 6, seed: seed + 1 });
    ctx.restore();
  }
  function wallClock(ctx, x, y, r, t) {
    G.ellipse(ctx, x, y, r, r, { fill: '#FBF5E6', lw: 6, seed: 91 });
    const hrs = (t - ev.study) * 1.9, mins = (t - ev.study) * 23; // time flies
    G.line(ctx, [[x, y], [x + Math.sin(hrs) * r * 0.5, y - Math.cos(hrs) * r * 0.5]], { color: INK, lw: 7, seed: 92 });
    G.line(ctx, [[x, y], [x + Math.sin(mins) * r * 0.8, y - Math.cos(mins) * r * 0.8]], { color: INK, lw: 4, seed: 93 });
  }
  function sticky(ctx, x, y, text, color, rot, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    G.rrect(ctx, -95, -52, 190, 104, 4, { fill: color, lw: 4, seed });
    G.text(ctx, text, 0, 14, { size: 40, align: 'center', color: INK });
    ctx.restore();
  }
  function house(ctx, cx, t) {
    const base = GROUND - 30;
    G.rrect(ctx, cx - 300, base - 420, 600, 420, 6, { fill: '#F3E3C3', lw: 7, seed: 300, hatch: { color: 'rgba(120,80,40,0.12)', gap: 12 } });
    G.poly(ctx, [[cx - 350, base - 410], [cx, base - 640], [cx + 350, base - 410]], { fill: '#C8473B', lw: 7, seed: 301, hatch: { color: 'rgba(0,0,0,0.15)', gap: 10 } });
    G.rrect(ctx, cx + 170, base - 620, 60, 120, 4, { fill: '#8A5A3B', lw: 6, seed: 302 });
    for (const [wx, wy] of [[cx - 220, base - 330], [cx + 90, base - 330], [cx - 60, base - 560]]) windowFrame(ctx, wx, wy, 130, 120, { sky: ['#CFE8F7', '#A9D3EE'], moon: false, seed: wx });
    G.rrect(ctx, cx - 50, base - 200, 100, 200, 8, { fill: '#7A4E36', lw: 6, seed: 303 });
    G.ellipse(ctx, cx + 28, base - 100, 7, 7, { fill: '#F2B84B', lw: 3, seed: 304 });
    // fence + bushes
    for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 1) continue; G.rrect(ctx, cx + i * 75 - 10, base - 60, 20, 90, 4, { fill: '#FFFFFF', lw: 4, seed: 310 + i }); }
    G.line(ctx, [[cx - 460, base - 30], [cx - 60, base - 30]], { color: INK, lw: 6, seed: 330 });
    G.line(ctx, [[cx + 60, base - 30], [cx + 460, base - 30]], { color: INK, lw: 6, seed: 331 });
  }
  function keyIcon(ctx, x, y, s, rot, seed = 400) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.ellipse(ctx, 0, 0, 22, 22, { fill: '#F2B84B', lw: 5, seed });
    G.ellipse(ctx, 0, 0, 8, 8, { fill: '#FFF7D6', lw: 3, seed: seed + 1 });
    G.rrect(ctx, 18, -6, 60, 12, 3, { fill: '#F2B84B', lw: 4, seed: seed + 2 });
    G.rrect(ctx, 60, 4, 10, 16, 2, { fill: '#F2B84B', lw: 3, seed: seed + 3 });
    ctx.restore();
  }
  function sparkle(ctx, x, y, t, t0) {
    const a = t - t0; if (a < 0 || a > 1.2) return;
    const k = ease.outCubic(clamp(a / 0.5));
    G.rays(ctx, x, y, { n: 10, r0: 30 + 40 * k, r1: 60 + 90 * k, color: '#F2B84B', lw: 6, alpha: 1 - clamp((a - 0.4) / 0.8) });
  }
  function moneyCounter(ctx, x, y, v, size, color, k = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    G.text(ctx, rub(v), 0, 0, { size, align: 'center', color, stroke: '#FFFFFF', strokeW: size * 0.1 });
    ctx.restore();
  }

  // ---------- scenes ----------
  // 1) the poor flat at night; mum counts coins; the promise
  function sceneHome(ctx, t) {
    wall(ctx, '#3E4A6B', '#56506E', '#6B5545', 1);
    // peeling wallpaper patches
    G.poly(ctx, [[760, 620], [860, 600], [880, 700], [790, 730]], { fill: '#6A6F8C', lw: 3, seed: 5 });
    G.poly(ctx, [[150, 1050], [230, 1030], [250, 1110], [160, 1120]], { fill: '#6A6F8C', lw: 3, seed: 6 });
    windowFrame(ctx, 110, 540, 330, 300, { t, seed: 10 });
    bulb(ctx, 560, t);
    const counting = t >= ev.coinsFirst;
    const k = lastBefore(S.coinNotes, t);
    // mum (left) and Sasha (right), both seated at the table
    stool(ctx, 300, 1215, 130, 61);
    stool(ctx, 790, 1245, 110, 64);
    const coinsOut = k + 1;
    const lookAt = counting ? 0.2 : 0.5;
    Ch.person(ctx, {
      x: 300, y: 1215, pose: 'sit', s: 1.15, style: MOM,
      eyes: counting ? 'normal' : 'closed', brows: 'worried', mouth: 'flat', look: 0.6, lookY: 0.8,
      handR: counting ? [460 + (k % 3) * 30, 1170] : undefined, headRot: counting ? 0.06 : 0,
    });
    const promise = t >= ev.promise;
    Ch.person(ctx, {
      x: 790, y: 1245, pose: 'sit', s: 0.78, style: BOY,
      eyes: promise ? 'normal' : 'normal', brows: promise ? 'determined' : 'worried', mouth: talk(t, 'boy', promise ? 'flat' : 'wavy'),
      look: promise ? -0.1 : -lookAt, lookY: promise ? -0.5 : 0.6, headRot: promise ? -0.04 : 0.05,
    });
    table(ctx, 540, 1170, 600);
    // empty bowls + coins counted one by one (each one is a note)
    G.ellipse(ctx, 700, 1162, 60, 18, { fill: '#E9E1CF', lw: 4, seed: 20 });
    for (let i = 0; i < coinsOut; i++) {
      const n = S.coinNotes[i];
      const a = t - n.t;
      const drop = 1 - ease.outBounce(clamp(a / 0.3));
      coin(ctx, 420 + i * 46, 1158 - drop * 60, 19, 30 + i);
      if (a < 0.25) G.rays(ctx, 420 + i * 46, 1150, { n: 6, r0: 22, r1: 42, color: '#F2B84B', lw: 4, alpha: 1 - a / 0.25 });
    }
    if (t >= S.promiseLine.t) G.bubble(ctx, S.promiseLine.text, 690, 760, 780, 930, t, S.promiseLine.t, S.promiseLine.end, { size: 58 });
  }

  // 2) lemonade stand in the courtyard
  function sceneLemonade(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#8FCBEA'); sky.addColorStop(1, '#D7EEF6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    G.ellipse(ctx, 880, 520, 70, 70, { fill: '#F6D365', lw: 4, seed: 101 });
    cloud(ctx, 260 + Math.sin(t * 0.3) * 20, 560, 0.8, '#FFFFFF', 102);
    panelBlock(ctx, -40, 380, 520, '#C9C3B5', 110);
    panelBlock(ctx, 640, 480, 460, '#D8CDB6', 120);
    G.poly(ctx, [[-20, GROUND - 180], [W + 20, GROUND - 180], [W + 20, H + 20], [-20, H + 20]], { fill: '#7DB46C', lw: 5, seed: 130, hatch: { color: 'rgba(0,0,0,0.1)', gap: 10 } });
    const k = lastBefore(S.jarCoins, t);
    const total = k < 0 ? 0 : Math.round((S.LEMON_TOTAL * (k + 1)) / S.jarCoins.length / 50) * 50;
    // Sasha behind the stand
    const bounce = k >= 0 ? pulse(t, S.jarCoins[k].t, 8) : 0;
    Ch.person(ctx, { x: 620, y: GROUND, pose: 'stand', s: 0.95, style: BOY, eyes: 'happy', mouth: 'grin', blush: 0.4 + 0.4 * bounce, sy: 1 - 0.05 * bounce, gesture: k >= 3 ? 'thumbsUp' : 'wave' });
    // queue of neighbours on the left
    const q = [{ x: 200, style: { skin: '#E7BE98', hair: '#BFBFBF', hairStyle: 'bun', outfit: 'dress', shirt: '#7C9A6A' } },
      { x: 330, style: { skin: '#D9A77E', hair: '#2A1E18', hairStyle: 'short', outfit: 'tee', shirt: '#C8473B', bottoms: 'shorts', shorts: '#3A3F4F' } }];
    q.forEach((p, i) => Ch.person(ctx, { x: p.x, y: GROUND - 40 + i * 20, pose: 'stand', s: i === 0 ? 0.85 : 0.7, style: p.style, eyes: 'happy', mouth: 'smile', gesture: i === 1 && k >= 0 ? 'point' : undefined }));
    // the stand (in front of Sasha)
    G.rrect(ctx, 440, GROUND - 210, 360, 210, 8, { fill: '#F2D27A', lw: 7, seed: 140, hatch: { color: 'rgba(120,80,20,0.15)', gap: 10 } });
    for (let i = 0; i < 6; i++) G.rrect(ctx, 430 + i * 63, GROUND - 680, 63, 60, 4, { fill: i % 2 ? '#FFFFFF' : '#E46A5A', lw: 4, seed: 150 + i });
    G.line(ctx, [[450, GROUND - 620], [450, GROUND - 210]], { color: INK, lw: 8, seed: 160 });
    G.line(ctx, [[790, GROUND - 620], [790, GROUND - 210]], { color: INK, lw: 8, seed: 161 });
    G.text(ctx, 'ЛИМОНАД', 620, GROUND - 120, { size: 62, align: 'center', color: '#C8473B' });
    G.text(ctx, '20 ₽', 620, GROUND - 50, { size: 56, align: 'center', color: INK });
    jar(ctx, 740, GROUND - 210, clamp((k + 1) / S.jarCoins.length), 170);
    // coins flying in an arc into the jar, landing on their notes
    for (const c of S.jarCoins) {
      const a = t - (c.t - 0.45);
      if (a < 0 || a > 0.45) continue;
      const u = a / 0.45;
      coin(ctx, lerp(300, 740, u), lerp(GROUND - 520, GROUND - 300, u) - Math.sin(Math.PI * u) * 260, 18, 200 + c.i);
    }
    for (const c of S.jarCoins) sparkle(ctx, 740, GROUND - 350, t, c.t);
    const lk = k >= 0 ? 1 + 0.15 * pulse(t, S.jarCoins[k].t, 10) : 1;
    moneyCounter(ctx, 540, 560, total, 120, '#2F7A4E', lk);
  }

  // 3) nights of study
  function sceneStudy(ctx, t) {
    wall(ctx, '#2E3557', '#3D3F63', '#5A4A3E', 200);
    windowFrame(ctx, 700, 520, 280, 280, { t, seed: 210 });
    wallClock(ctx, 260, 620, 90, t);
    const notes = [['Python', '#F6E27A', -0.08], ['English', '#9FD3B6', 0.06], ['Продажи', '#F4A9A0', -0.04]];
    notes.forEach(([txt, col, rot], i) => { if (t >= ev.study + i * BEAT * 2) sticky(ctx, 200 + i * 230 + (i === 2 ? 0 : 0), 860 + (i % 2) * 40, txt, col, rot, 220 + i); });
    // desk lamp glow
    const gl = ctx.createRadialGradient(330, 1120, 0, 330, 1120, 520);
    gl.addColorStop(0, 'rgba(255,214,130,0.5)'); gl.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 600, W, 1000);
    stool(ctx, 640, 1235, 120, 230);
    Ch.person(ctx, { x: 640, y: 1235, pose: 'sit', s: 0.98, style: TEEN, eyes: 'normal', brows: 'determined', mouth: 'flat', look: -0.6, lookY: 0.5, gesture: 'typing' });
    table(ctx, 470, 1150, 560, '#6E4A35');
    laptop(ctx, 430, 1150, 0.9, t);
    // books pile up as the nights go by
    const nBooks = 1 + Math.floor(clamp((t - ev.study) / (T(8) - ev.study)) * 6);
    for (let i = 0; i < nBooks; i++) G.rrect(ctx, 220 - (i % 2) * 8, 1150 - 26 * (i + 1), 140, 24, 3, { fill: ['#C8473B', '#3F6E8C', '#E0A43B', '#4E9A57'][i % 4], lw: 4, seed: 240 + i });
    // the desk lamp
    G.line(ctx, [[640, 1150], [610, 1020], [520, 980]], { color: INK, lw: 8, seed: 250 });
    G.poly(ctx, [[480, 960], [560, 960], [540, 1010], [500, 1010]], { fill: '#E0A43B', lw: 5, seed: 251 });
  }

  // 4) the crash: grey, rain, sitting on a box
  function sceneFail(ctx, t) {
    wall(ctx, '#5E636E', '#6F737C', '#4E5157', 300);
    // the chart: up, up... crash (drawn at the cut)
    const cx = 120, cy = 440, cw = 840, ch = 260;
    G.rrect(ctx, cx, cy, cw, ch, 14, { fill: '#E8E6E1', lw: 6, seed: 310 });
    const pts = [[0, 0.2], [0.15, 0.32], [0.3, 0.45], [0.45, 0.58], [0.6, 0.7], [0.7, 0.74], [0.8, 0.1], [1, 0.03]];
    const P = pts.map(([u, v]) => [cx + 40 + u * (cw - 80), cy + ch - 40 - v * (ch - 80)]);
    G.line(ctx, P.slice(0, 6), { color: '#4E9A57', lw: 10, seed: 311 });
    G.line(ctx, P.slice(5), { color: '#C8473B', lw: 12, seed: 312 });
    G.text(ctx, '↓', P[6][0] + 40, P[6][1] - 20, { size: 90, color: '#C8473B' });
    // rain cloud over Sasha
    const rx = 560;
    cloud(ctx, rx, 780, 1.0, '#8B8F99', 320);
    ctx.save(); ctx.strokeStyle = 'rgba(160,190,230,0.8)'; ctx.lineWidth = 4;
    for (let i = 0; i < 22; i++) { const x = rx - 120 + U.hash(i, 7) * 240, y = 830 + ((U.hash(i, 8) * 420 + (t - ev.fail) * 700) % 420); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 26); ctx.stroke(); }
    ctx.restore();
    // a cardboard box seat
    G.rrect(ctx, 470, 1240, 180, 140, 6, { fill: '#B98A5A', lw: 6, seed: 330, hatch: { color: 'rgba(0,0,0,0.12)', gap: 10 } });
    Ch.person(ctx, { x: 560, y: 1250, pose: 'sit', s: 0.98, style: TEEN, eyes: 'closed', brows: 'worried', mouth: 'wavy', headRot: 0.12, headY: 14, sweat: true, gesture: 'facepalm' });
  }

  // 5) mum: "fall down, get up"
  function sceneMom(ctx, t) {
    const u = clamp((t - ev.mom) / (T(11) - ev.mom));
    wall(ctx, '#6E6A70', '#87776C', '#5A4F48', 300);
    // warm light breaks through as she speaks
    G.rays(ctx, 540, 760, { n: 14, r0: 80, r1: 1300, color: `rgba(255,214,140,${0.25 * u})`, lw: 60, spin: t * 0.05 });
    G.rrect(ctx, 470, 1240, 180, 140, 6, { fill: '#B98A5A', lw: 6, seed: 330, hatch: { color: 'rgba(0,0,0,0.12)', gap: 10 } });
    const up = t > T(10, 2.5);
    Ch.person(ctx, { x: 340, y: GROUND, pose: 'stand', s: 1.12, style: MOM, eyes: 'normal', brows: 'up', mouth: talk(t, 'mom', 'smile'), look: 0.5, lookY: 0.5, handR: [500, 1020] });
    Ch.person(ctx, { x: 560, y: 1250, pose: 'sit', s: 0.98, style: TEEN, eyes: up ? 'normal' : 'closed', brows: up ? 'determined' : 'worried', mouth: up ? 'smile' : 'flat', look: -0.5, lookY: up ? -0.6 : 0.3, headRot: up ? -0.05 : 0.08 });
    G.bubble(ctx, S.momLine.text, 540, 640, 380, 860, t, S.momLine.t, S.momLine.end, { size: 56 });
  }

  // 6) the climb: office, team, the chart grows on every beat
  function sceneRise(ctx, t) {
    const frozen = t >= ev.breath;
    const tt = frozen ? ev.breath - 1e-3 : t;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#F7E3C8'); sky.addColorStop(1, '#F1C9A5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // city through the big window
    for (let i = 0; i < 7; i++) { const bh = 220 + U.hash(i, 5) * 300; G.rrect(ctx, i * 160 - 20, GROUND - 260 - bh, 140, bh + 40, 4, { fill: G.tint('#B7A5C9', -0.1 * (i % 3)), lw: 4, seed: 500 + i }); }
    G.poly(ctx, [[-20, GROUND - 240], [W + 20, GROUND - 240], [W + 20, H + 20], [-20, H + 20]], { fill: '#E6D6BE', lw: 5, seed: 510, hatch: { color: 'rgba(120,80,40,0.1)', gap: 10 } });
    // chart card
    const cx = 90, cy = 640, cw = 900, ch = 280;
    G.rrect(ctx, cx, cy, cw, ch, 16, { fill: '#FFFDF7', lw: 6, seed: 520 });
    const n = S.riseBars.length;
    for (const b of S.riseBars) {
      const a = tt - b.t; if (a < 0) continue;
      const g = ease.outBack(clamp(a / 0.3), 1.6);
      const bh = (40 + (ch - 90) * Math.pow((b.i + 1) / n, 1.5)) * g;
      const bw = (cw - 80) / n - 10;
      G.rrect(ctx, cx + 40 + b.i * ((cw - 80) / n), cy + ch - 30 - bh, bw, bh, 5, { fill: b.i === n - 1 ? '#E0703E' : '#3FA89B', lw: 4, seed: 530 + b.i });
    }
    // money counter, stepping on the bar lines
    const rc = S.riseCounter;
    let v = 0; for (let i = 0; i < rc.length; i++) if (tt >= rc[i][0]) { const nx = rc[i + 1]; v = nx ? lerp(rc[i][1], nx[1], ease.outCubic(clamp((tt - rc[i][0]) / Math.min(0.6, nx[0] - rc[i][0])))) : rc[i][1]; }
    const tremble = frozen ? U.noise1(t * 50, 3) * 6 : 0;
    moneyCounter(ctx, 540 + tremble, 590, frozen ? 999999 : v, 104, '#2F7A4E');
    // the team
    Ch.person(ctx, { x: 820, y: GROUND - 40, pose: 'stand', s: 0.9, style: FRIEND2, eyes: frozen ? 'wide' : 'happy', mouth: frozen ? 'o' : 'smile', gesture: frozen ? undefined : 'typing', look: -0.5 });
    Ch.person(ctx, { x: 130, y: GROUND - 30, pose: 'stand', s: 0.95, style: FRIEND1, eyes: frozen ? 'wide' : 'happy', mouth: frozen ? 'o' : 'grin', gesture: frozen ? undefined : 'clap', look: 0.5 });
    Ch.person(ctx, { x: 480, y: GROUND, pose: 'stand', s: 1.12, style: MAN, eyes: frozen ? 'wide' : 'normal', brows: frozen ? 'up' : 'determined', mouth: frozen ? 'o' : 'smirk', gesture: frozen ? undefined : 'phone', look: 0.2, lookY: -0.4, sweat: frozen });
    laptop(ctx, 690, GROUND - 40, 0.7, tt, '#BEE3C9', 560);
  }

  // 7) THE DROP: 1 000 000 ₽
  function sceneDrop(ctx, t) {
    const a = t - ev.drop;
    ctx.fillStyle = '#2B2458'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(540, 900); ctx.rotate(a * 0.3);
    ctx.globalAlpha = 0.55 + 0.2 * pulse(t, ev.drop + Math.floor(a / BEAT) * BEAT, 8);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 ? '#F2B84B' : '#E0703E';
      const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 2400, Math.sin(a0) * 2400); ctx.lineTo(Math.cos(a1) * 2400, Math.sin(a1) * 2400); ctx.fill();
    }
    ctx.restore();
    const hop = (amp) => amp * Math.abs(Math.sin(Math.PI * clock.phase(t)));
    Ch.person(ctx, { x: 190, y: GROUND - hop(40), pose: 'stand', s: 0.9, style: FRIEND1, eyes: 'happy', mouth: 'open', gesture: 'cheer' });
    Ch.person(ctx, { x: 890, y: GROUND - hop(40), pose: 'stand', s: 0.88, style: FRIEND2, eyes: 'happy', mouth: 'open', gesture: 'cheer' });
    const j = clamp(a / 0.6);
    const jump = a < 0.6 ? 4 * 220 * j * (1 - j) : hop(70);
    Ch.person(ctx, { x: 540, y: GROUND - jump, pose: 'stand', s: 1.18, style: MAN, eyes: 'happy', mouth: 'open', blush: 0.8, gesture: 'cheer' });
    // the number stamps in on the drop
    const st = ease.outBack(clamp(a / 0.35), 2.2);
    const k = (2.2 - 1.2 * st) * (1 + 0.04 * pulse(t, ev.drop + Math.floor(a / BEAT) * BEAT, 8));
    ctx.save(); ctx.translate(540, 620); ctx.rotate(-0.05); ctx.scale(k, k);
    G.tornPaper(ctx, -440, -120, 880, 190, { fill: '#FFF7D6', seed: 700 });
    G.text(ctx, '1 000 000 ₽', 0, 40, { size: 132, align: 'center', color: '#2F7A4E' });
    ctx.restore();
    G.confetti(ctx, t, ev.drop, { n: 160, seed: 7, spawn: 2.5 });
  }

  // 8) a new house for mum
  function sceneHouse(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#9ED3EE'); sky.addColorStop(1, '#E4F3F8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    G.ellipse(ctx, 900, 470, 70, 70, { fill: '#F6D365', lw: 4, seed: 801 });
    cloud(ctx, 220 + (t - ev.house) * 15, 520, 0.7, '#FFFFFF', 802);
    G.poly(ctx, [[-20, GROUND - 60], [W + 20, GROUND - 60], [W + 20, H + 20], [-20, H + 20]], { fill: '#7DB46C', lw: 5, seed: 803, hatch: { color: 'rgba(0,0,0,0.1)', gap: 10 } });
    house(ctx, 540, t);
    const gave = t >= ev.keys;
    const hug = t >= T(17);
    const momX = hug ? 470 : 360, manX = hug ? 650 : 720;
    Ch.person(ctx, { x: momX, y: GROUND + 20, pose: 'stand', s: 1.08, style: MOM_NEW, eyes: gave ? 'happy' : 'wide', brows: 'up', mouth: gave ? 'grin' : 'o', blush: gave ? 0.9 : 0.3, handR: gave && !hug ? [520, 1060] : hug ? [600, 1000] : undefined, look: 0.5 });
    const handOut = !gave ? [lerp(700, 560, ease.inOutQuad(clamp((t - ev.house) / (ev.keys - ev.house)))), 1060] : hug ? [520, 990] : [560, 1060];
    Ch.person(ctx, { x: manX, y: GROUND + 20, pose: 'stand', s: 1.16, style: MAN_SUIT, eyes: 'happy', mouth: 'smile', blush: 0.5, handL: handOut, look: -0.5 });
    if (!hug) keyIcon(ctx, handOut[0] - 20, handOut[1] - 10, 1, -0.4 + Math.sin(t * 6) * 0.08);
    sparkle(ctx, handOut[0] - 10, handOut[1] - 20, t, ev.keys);
    if (hug) for (let i = 0; i < 4; i++) { const a = (t - T(17) + i * 0.4) % 1.6; G.heart(ctx, 560 + Math.sin(i * 2 + a * 3) * 70, 860 - a * 200, 2.2 * (1 - a / 1.6), { seed: 900 + i }); }
  }

  // 9) outro: the message
  function sceneOutro(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1C2046'); sky.addColorStop(0.7, '#5A3F6E'); sky.addColorStop(1, '#E0703E');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = U.hash(i, 1) * W, y = U.hash(i, 2) * 1100, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); G.star(ctx, x, y, 4 + 6 * U.hash(i, 3) * tw, { fill: '#FFF1D2', rot: i }); }
    // little house + two figures on the horizon
    ctx.save(); ctx.translate(540, GROUND); ctx.scale(0.45, 0.45); ctx.translate(-540, -GROUND);
    house(ctx, 540, t);
    Ch.person(ctx, { x: 380, y: GROUND + 20, pose: 'stand', s: 1.08, style: MOM_NEW, eyes: 'closed', mouth: 'smile', blush: 0.6 });
    Ch.person(ctx, { x: 700, y: GROUND + 20, pose: 'stand', s: 1.16, style: MAN_SUIT, eyes: 'closed', mouth: 'smile' });
    ctx.restore();
    const E = S.endText;
    const y0 = 640;
    E.lines.forEach((l, i) => {
      const p = ease.inOutQuad(clamp((t - l.t) / l.d));
      if (p <= 0) return;
      const size = i === 2 ? 104 : 84;
      const y = y0 + i * 150;
      const w = G.measure(ctx, l.w, size);
      ctx.save(); ctx.beginPath(); ctx.rect(540 - w / 2 - 10, y - size, (w + 20) * p, size * 1.6); ctx.clip();
      G.text(ctx, l.w, 540, y, { size, align: 'center', color: i === 2 ? '#F6D365' : '#F6EBD6' });
      ctx.restore();
    });
    const sa = clamp((t - E.sub.t) / 0.6);
    if (sa > 0) G.text(ctx, E.sub.text, 540, y0 + 470, { size: 56, align: 'center', color: '#E9DCC3', alpha: sa });
  }

  const film = Shots.film([
    { at: 0, draw: sceneHome, cam: (s) => ({ x: 0, y: 0, zoom: lerp(1.0, 1.12, ease.inOutQuad(clamp((s.t - 0) / (ev.lemonade))) ) }) },
    { at: ev.lemonade, draw: sceneLemonade, in: 'cut' },
    { at: ev.study, draw: sceneStudy, in: 'cut', cam: (s) => ({ zoom: lerp(1, 1.06, s.u) }) },
    { at: ev.fail, draw: sceneFail, in: 'cut' },
    { at: ev.mom, draw: sceneMom, in: { type: 'dip', dur: 0.5, color: '#FFF4DC' } },
    { at: ev.rise, draw: sceneRise, in: 'cut', cam: (s) => ({ zoom: lerp(1, 1.08, s.u) }) },
    { at: ev.drop, draw: sceneDrop, in: 'cut' },
    { at: ev.house, draw: sceneHouse, in: 'cut' },
    { at: ev.outro, draw: sceneOutro, in: { type: 'dip', dur: 0.6, color: '#1C2046' } },
  ], { end: S.DURATION });

  Studio.film({
    draw(ctx, t) {
      if (t < 0.2) return;
      const shake = t >= ev.drop && t < ev.house ? 20 * Math.exp(-(t - ev.drop) * 5) : 0;
      ctx.save();
      ctx.translate(U.noise1(t * 30, 1) * shake, U.noise1(t * 30, 2) * shake);
      film(ctx, t);
      ctx.restore();
      // grey wash in the bad times, a held-breath darkening before the drop
      if (t >= ev.fail && t < ev.mom) { ctx.fillStyle = 'rgba(60,70,90,0.18)'; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.breath && t < ev.drop) { ctx.fillStyle = 'rgba(10,8,20,0.45)'; ctx.fillRect(0, 0, W, H); }
      const flash = t >= ev.drop ? 0.85 * Math.exp(-(t - ev.drop) * 12) : 0;
      if (flash > 0.01) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, W, H); }
      const fl2 = t >= ev.fail ? 0.6 * Math.exp(-(t - ev.fail) * 14) : 0;
      if (fl2 > 0.01 && t < ev.mom) { ctx.fillStyle = `rgba(20,20,30,${fl2})`; ctx.fillRect(0, 0, W, H); }
      for (const c of S.captions) G.caption(ctx, c, t);
    },
    post: { paper: 0.5, vignette: 0.35, grain: 0.06 },
  });
})();
