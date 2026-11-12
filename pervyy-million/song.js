// THE SONG — renders every sound from the score into out/music.wav.
//   node song.js   (STEMS=1 also writes out/stem-*.wav, LUFS=-14 masters to a loudness)
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), pad = bus(), keys = bus(), lead = bus(), brass = bus(), fx = bus();
const verb = bus(), dly = bus();

// ---------- drums ----------
const K = I.kick(), SN = I.snare(), CL = I.clap(), HC = [I.hat(false, 11), I.hat(false, 12)], HO = I.hat(true, 14), CR = I.crash(18);
const SH = [I.shaker(1, 15), I.shaker(0.6, 16)];
const kicks = [];
const inRange = (t, [a, b]) => t >= a - 1e-6 && t < b - 1e-6;
// groove: lemonade + study (bars 4-7): kick on 1 and 3, clap on 2 and 4, shaker 8ths
clock.eachStep(4, 8, 8, (t, b, s) => {
  if (s === 0 || s === 4 || (s === 7 && b % 2)) { drums.addMono(K, t, s === 7 ? 0.6 : 0.9); kicks.push(t); }
  if (s === 2 || s === 6) { drums.addMono(CL, t, 0.5); verb.addMono(CL, t, 0.25); }
  drums.addMono(SH[s % 2], t, s % 2 ? 0.1 : 0.16, 0.3);
});
// fail: a lonely half-time heartbeat
clock.eachStep(8, 10, 2, (t) => { fx.addMono(I.heartbeat(), t, 0.35); });
// rise (bars 11-13): four-on-the-floor building up, then the roll into the held breath
clock.eachStep(11, 14, 8, (t, b, s) => {
  if (t >= ev.breath) return;
  if (s % 2 === 0) { drums.addMono(K, t, 0.85); kicks.push(t); }
  if (s === 2 || s === 6) { drums.addMono(SN, t, 0.35); drums.addMono(CL, t, 0.35); }
  if (b >= 12) drums.addMono(HC[s % 2], t, 0.14, -0.3);
});
for (let i = 0; i < 6; i++) drums.addMono(SN, T(13, 1.5) + i * BEAT / 4, 0.18 + i * 0.04, 0.05); // roll, ends an 8th before the breath
// drop + house (bars 14-17): full groove
clock.eachStep(14, 18, 16, (t, b, s) => {
  if (s % 4 === 0) { drums.addMono(K, t, 0.95); kicks.push(t); }
  if (s % 8 === 4) { drums.addMono(SN, t, 0.45); drums.addMono(CL, t, 0.4); verb.addMono(CL, t, 0.25); }
  drums.addMono(HC[s % 2], t, s % 2 ? 0.16 : 0.09, -0.3);
  if (s % 4 === 2) drums.addMono(HO, t, 0.1, 0.3);
});
drums.addMono(CR, ev.drop, 0.5, -0.2);
drums.addMono(CR, ev.house, 0.3, 0.2);
drums.addMono(CR, ev.outro, 0.25, 0);

// ---------- bass ----------
for (const c of sc.chords) {
  const live = (c.t0 >= ev.lemonade && c.t0 < ev.fail) || (c.t0 >= ev.rise && c.t0 < ev.outro);
  const soft = c.t0 >= ev.fail && c.t0 < ev.rise;
  if (!live && !soft) continue;
  const R = c.bass + 12;
  if (soft) { bass.addMono(I.bass(R, c.t1 - c.t0, { bright: 0.1, sub: 0.9 }), c.t0, 0.45); continue; }
  for (let t = c.t0; t < c.t1 - 1e-6; t += BEAT / 2) {
    if (t >= ev.breath && t < ev.drop) continue;
    const k = Math.round((t - c.t0) / (BEAT / 2));
    const big = c.t0 >= ev.drop;
    bass.addMono(I.bass(k % 2 && big ? R + 12 : R, BEAT / 2 * 0.85, { sub: big ? 0.9 : 0.6 }), t, 0.55);
  }
}
bass.addMono(I.bass(m('C2'), 3, { bright: 0.2, sub: 1 }), ev.outro, 0.45);

// ---------- pads (everywhere, darker in the sad part) ----------
for (const c of sc.chords) {
  let t1 = c.t1;
  if (c.t0 < ev.breath && c.t1 > ev.breath) t1 = ev.breath;
  if (c.t0 >= ev.breath && c.t0 < ev.drop) continue;
  const bright = c.t0 >= ev.drop && c.t0 < ev.outro;
  const opts = bright ? { cutoff: 2800, attack: 0.05 } : { cutoff: c.t0 >= ev.fail && c.t0 < ev.rise ? 700 : 1100, attack: 0.4, release: 1.2 };
  for (const n of c.notes) { const { L, R } = I.padNote(n, Math.max(0.2, t1 - c.t0), opts); pad.addStereo(L, R, c.t0, 0.09); }
}

// ---------- keys: music box, the coins, the jar, the clock ----------
for (const n of sc.musicbox) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.2); verb.addMono(mb, n.t, 0.2); dly.addMono(mb, n.t, 0.06); }
for (const n of sc.coinNotes) { // each coin mum puts down is a note
  const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, (n.i % 2 ? 0.25 : -0.25)); verb.addMono(mb, n.t, 0.22);
  fx.addMono(I.bell(2400 + n.i * 90, 0.12, 2, 3.1), n.t, 0.08);
}
for (const c of sc.jarCoins) { // every customer's coin rings the marimba
  const x = I.marimba(c.midi, { thock: 0.2 }); keys.addMono(x, c.t, 0.5, 0.2); verb.addMono(x, c.t, 0.18);
  fx.addMono(I.bell(3200 + c.i * 120, 0.08, 1.5, 2.7), c.t, 0.1, 0.2);
}
for (const t of sc.ticks) fx.addMono(I.woodTick(1.2), t, 0.12, -0.3);
for (const b of sc.riseBars) { const p = I.pluck(b.midi, { decay: 0.35, cutoff: 3500 }); keys.addMono(p, b.t, 0.35, (b.i % 2 ? 0.3 : -0.3)); dly.addMono(p, b.t, 0.08); }

// ---------- leads ----------
for (const n of sc.lead) { const p = I.pluck(n.midi + 12, { decay: 0.4, cutoff: 3000 }); lead.addMono(p, n.t, 0.32); dly.addMono(p, n.t, 0.1); }
for (const n of sc.sad) { const e = I.epiano(n.midi + 12, n.dur * 1.1); lead.addMono(e, n.t, 0.4); verb.addMono(e, n.t, 0.3); }
for (const n of sc.brass) {
  const a = I.brassNote(n.midi, n.dur * 0.92), b = I.brassNote(n.midi - 12, n.dur * 0.92, { bright: 0.8, seed: 99 });
  brass.addStereo(a.L, a.R, n.t, 0.3); brass.addStereo(b.L, b.R, n.t, 0.15);
  verb.addStereo(a.L, a.R, n.t, 0.1); dly.addStereo(a.L, a.R, n.t, 0.05);
}
// strings swell under the house scene
for (const c of sc.chords) if (c.t0 >= ev.house && c.t0 < ev.outro) for (const n of c.notes) { const s = I.strings(n + 12, c.t1 - c.t0); brass.addStereo(s.L, s.R, c.t0, 0.05); }

// ---------- fx tied to events ----------
fx.addMono(I.thud(70, 0.1), ev.lemonade, 0.35);
fx.addMono(I.paperFwip(1.1, 3), ev.promise - 0.03, 0.25);
fx.addMono(I.bwomp(), ev.fail, 0.55);
fx.addMono(I.thud(55, 0.2), ev.fail, 0.7);
fx.addMono(I.noiseSweep(T(10) - T(8), 900, 300, { q: 0.5, pink: true }), ev.fail + 0.2, 0.06); // rain
fx.addMono(I.noiseSweep(ev.breath - T(12), 200, 9000, { q: 0.9, shape: (x) => x * x, pink: true }), T(12), 0.4); // riser into the breath
fx.addMono(I.subBoom(2.4), ev.drop, 0.75);
fx.addMono(I.whoosh ? I.whoosh() : I.noiseSweep(0.4, 600, 4000, { q: 1 }), ev.house - 0.35, 0.2);
fx.addMono(I.ting(m('E6')), ev.keys, 0.3);
fx.addMono(I.bell(1800, 0.6, 2, 3.5), ev.keys, 0.15);
for (const l of sc.endText.lines) fx.addMono(I.scribble(l.d, Math.round(l.t * 7)), l.t, 0.16);
for (const c of sc.captions) fx.addMono(I.paperFwip(0.9, Math.round(c.t * 10)), c.t - 0.03, 0.14, -0.2);

// ---------- voiceover: load each line, duck the music under it ----------
const voice = bus();
for (const v of sc.VO) {
  const b = MIX.loadAudio(path.join(__dirname, 'voice', v.id + '.wav'), { at: v.at, length: DURATION });
  b.mixInto(voice, (v.who === 'narrator' ? 1.0 : 1.1) * (v.at >= sc.ev.drop && v.at < sc.ev.house ? 1.4 : 1));
}
MIX.duck([drums, bass, pad, keys, lead, brass, fx, verb, dly], voice, { depth: 0.72, attack: 0.03, release: 0.35, threshold: 0.03 });

// ---------- mix ----------
MIX.sidechain([pad, bass], kicks.filter((t) => t >= ev.drop && t < ev.outro));
const stems = {
  drums, bass, pad, keys, lead, brass, fx, voice,
  verb: reverb(verb, { room: 0.84, damp: 0.3 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3500),
};
const GAIN = { voice: 2.0, drums: 0.42, bass: 0.7, pad: 2.4, keys: 0.9, lead: 1.0, brass: 1.9, fx: 0.8, verb: 1, dly: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath, ev.drop); // the held breath is truly silent
MIX.fadeOut(mix, DURATION - 1.8, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
