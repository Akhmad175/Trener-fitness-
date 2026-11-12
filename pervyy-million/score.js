// THE SCORE — "Первый миллион": a boy from a poor family earns his first million.
// Single source of truth for music AND picture. 96 BPM: 1 beat = 0.625 s, 1 bar = 2.5 s.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const clock = makeClock({ bpm: 96, offset: 0.4 });
  const { T, BEAT } = clock;
  const DURATION = T(20) + 2.2; // ~52.6 s

  // ---------- story sections (bars) ----------
  const S = {
    home: [0, T(2)], // the poor flat at night
    coins: [T(2), T(4)], // mum counts every coin; the promise
    lemonade: [T(4), T(6)], // first money: a lemonade stand
    study: [T(6), T(8)], // nights of study
    fail: [T(8), T(10)], // the first business goes bust
    mom: [T(10), T(11)], // "fall down, get up"
    rise: [T(11), T(13, 3)], // the climb
    breath: [T(13, 3), T(14)], // silence at 999 999
    drop: [T(14), T(16)], // 1 000 000 ₽
    house: [T(16), T(18)], // a new house for mum
    outro: [T(18), DURATION],
  };

  // ---------- harmony ----------
  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E2' },
    Fmaj7: { notes: ['A3', 'C4', 'E4', 'F4'], bass: 'F1' },
    Cadd9: { notes: ['G3', 'C4', 'D4', 'E4'], bass: 'C2' },
  }, [
    [0, 0, 4, 'Am'], [1, 0, 4, 'F'],
    [2, 0, 4, 'C'], [3, 0, 4, 'G'],
    [4, 0, 2, 'Am'], [4, 2, 2, 'F'], [5, 0, 2, 'C'], [5, 2, 2, 'G'],
    [6, 0, 2, 'Am'], [6, 2, 2, 'F'], [7, 0, 2, 'C'], [7, 2, 2, 'G'],
    [8, 0, 4, 'Dm'], [9, 0, 2, 'Am'], [9, 2, 2, 'E'],
    [10, 0, 2, 'F'], [10, 2, 2, 'C'],
    [11, 0, 2, 'Am'], [11, 2, 2, 'F'], [12, 0, 2, 'C'], [12, 2, 2, 'G'], [13, 0, 2, 'F'], [13, 2, 2, 'G'],
    [14, 0, 2, 'C'], [14, 2, 2, 'G'], [15, 0, 2, 'Am'], [15, 2, 2, 'F'],
    [16, 0, 2, 'C'], [16, 2, 2, 'G'], [17, 0, 2, 'F'], [17, 2, 2, 'C'],
    [18, 0, 4, 'Fmaj7'], [19, 0, 4, 'Cadd9'], [20, 0, 4, 'Cadd9'],
  ]);

  // ---------- melodies (8th-note grid: [note, start8th, dur8ths]) ----------
  const HOOK = {
    a: [['E5', 0, 2], ['C5', 2, 1], ['D5', 3, 1], ['E5', 4, 2], ['G5', 6, 2]],
    b: [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]],
    c: [['E5', 0, 2], ['C5', 2, 1], ['D5', 3, 1], ['E5', 4, 2], ['A5', 6, 2]],
    d: [['G5', 0, 2], ['F5', 2, 1], ['E5', 3, 1], ['D5', 4, 2], ['C5', 6, 2]],
    sadA: [['A4', 0, 3], ['C5', 3, 1], ['B4', 4, 2], ['A4', 6, 2]],
    sadB: [['D5', 0, 3], ['C5', 3, 1], ['B4', 4, 4]],
    end: [['E5', 0, 2], ['D5', 2, 2], ['C5', 4, 4]],
  };

  const ev = {
    coinsFirst: T(2, 0),
    promise: T(3, 2), // "Я всё изменю."
    lemonade: T(4), // cut + the drums arrive
    study: T(6),
    fail: T(8), // the chart crashes
    mom: T(10),
    rise: T(11),
    breath: T(13, 3),
    drop: T(14),
    house: T(16),
    keys: T(16, 2), // he hands mum the keys
    outro: T(18),
    end: T(20),
  };

  // Mum counts coins: every coin that drops on the table is a music-box note.
  const coinNotes = [...placeBar(clock, [['C6', 0, 2], ['E6', 2, 2], ['G6', 4, 2], ['E6', 6, 2]], 2), ...placeBar(clock, [['D6', 0, 2], ['B5', 2, 2]], 3)]
    .map((n, i) => ({ ...n, i }));

  // Lemonade: every customer's coin into the jar is a marimba note (and +200 ₽).
  const jarCoins = [];
  [[4, 1], [4, 2], [4, 3], [5, 0], [5, 1], [5, 2], [5, 3]].forEach(([b, k], i) => {
    jarCoins.push({ t: T(b, k), midi: m(['C5', 'E5', 'G5', 'A5', 'G5', 'C6', 'E6'][i]), i });
  });
  const LEMON_TOTAL = 1500;

  // Study: the clock ticks on every beat (wood ticks).
  const ticks = []; clock.eachStep(6, 8, 4, (t) => ticks.push(t));

  // Rise: one chart bar grows on each beat, each one a rising pluck.
  const riseBars = [];
  const RISE_SCALE = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];
  clock.eachStep(11, 14, 4, (t, b, s) => {
    if (t >= T(13, 3) - 1e-6) return;
    const i = riseBars.length;
    riseBars.push({ t, i, midi: m(RISE_SCALE[i % RISE_SCALE.length]) });
  });
  // the money counter during the rise: steps on every bar line
  const riseCounter = [[T(11), 0], [T(12), 120000], [T(13), 450000], [T(13, 2), 820000], [T(13, 3) - 0.05, 999999]];

  // Music box at the start and the end, the brass hook on the drop.
  const musicbox = [
    ...placeBar(clock, HOOK.a, 0, 0), ...placeBar(clock, HOOK.b, 1, 0),
    ...placeBar(clock, HOOK.c, 18, 0), ...placeBar(clock, HOOK.end, 19, 0),
  ];
  const lead = [ // groove lead (pluck) for lemonade + study
    ...placeBar(clock, HOOK.a, 4, -12), ...placeBar(clock, HOOK.b, 5, -12),
    ...placeBar(clock, HOOK.c, 6, -12), ...placeBar(clock, HOOK.d, 7, -12),
  ];
  const sad = [...placeBar(clock, HOOK.sadA, 8, -12), ...placeBar(clock, HOOK.sadB, 9, -12), ...placeBar(clock, HOOK.end, 10, -12)];
  const brass = [
    ...placeBar(clock, HOOK.a, 14, 0), ...placeBar(clock, HOOK.d, 15, 0),
    ...placeBar(clock, HOOK.c, 16, 0), ...placeBar(clock, HOOK.end, 17, 0),
  ];

  const markers = {
    lemonade: { t: ev.lemonade, sync: 'av' }, // hard cut + first kick
    fail: { t: ev.fail, sync: 'av' }, // the crash: cut to the grey scene + thud
    breath: ev.breath,
    drop: { t: ev.drop, sync: 'av' }, // flash + crash + sub boom: 1 000 000 ₽
    house: { t: ev.house, sync: 'v' }, // cut to the new house
    keys: ev.keys,
    outro: ev.outro,
  };

  // ---------- captions (Russian, kept inside SAFE) ----------
  const cx = SAFE.x + 10;
  const capY = SAFE.y + 10, capY2 = SAFE.y + 130;
  const captions = [
    { t: T(0, 1), end: T(1, 3.6), text: 'Это Саша. 10 лет.', x: cx, y: capY, rot: -0.03, size: 72 },
    { t: T(1, 0), end: T(1, 3.6), text: 'Денег всегда не хватало.', x: cx + 20, y: capY2, rot: 0.03, size: 62 },
    { t: T(2, 0), end: T(3, 1.6), text: 'Мама считала каждую монету.', x: cx, y: capY, rot: 0.02, size: 60 },
    { t: T(4, 0), end: T(5, 3.6), text: 'Первые деньги:', x: cx, y: capY, rot: -0.02, size: 66 },
    { t: T(4, 1), end: T(5, 3.6), text: 'лимонад во дворе', x: cx + 160, y: capY2, rot: 0.03, size: 62 },
    { t: T(6, 0), end: T(7, 3.6), text: 'Саша, 15 лет. Учился ночами:', x: cx, y: capY, rot: 0.02, size: 58 },
    { t: T(6, 2), end: T(7, 3.6), text: 'код, английский, продажи', x: cx + 30, y: capY2, rot: -0.03, size: 60 },
    { t: T(8, 0), end: T(9, 3.6), text: 'Первый бизнес прогорел.', x: cx, y: capY, rot: -0.03, size: 64 },
    { t: T(8, 2), end: T(9, 3.6), text: 'Долг: 200 000 ₽', x: cx + 120, y: capY2, rot: 0.03, size: 64 },
    { t: T(11, 0), end: T(12, 3.6), text: 'Саша, 19 лет. Новая идея.', x: cx, y: capY, rot: 0.02, size: 62 },
    { t: T(12, 0), end: T(13, 2.6), text: 'Команда. Каждый день — шаг.', x: cx, y: capY2, rot: -0.02, size: 58 },
    { t: T(16, 0), end: T(17, 3.6), text: 'Первым делом —', x: cx, y: capY, rot: -0.02, size: 66 },
    { t: T(16, 1), end: T(17, 3.6), text: 'новый дом для мамы.', x: cx + 120, y: capY2, rot: 0.03, size: 62 },
  ];
  const momLine = { t: T(10, 0.5), end: T(10, 3.9), text: 'Упал — вставай. Я в тебя верю.' };
  const promiseLine = { t: ev.promise, end: T(3, 3.9), text: 'Я всё изменю.' };
  const endText = {
    lines: [
      { w: 'Первый миллион —', t: T(18, 0), d: 0.6 },
      { w: 'это не про деньги.', t: T(18, 2), d: 0.6 },
      { w: 'Это про путь.', t: T(19, 0), d: 0.6 },
    ],
    sub: { t: T(19, 2), text: 'Саша, 21 год' },
  };

  // ---------- voiceover (RHVoice, Russian; files in voice/, made by voice/make.sh) ----------
  // at = start time, dur = measured file length. The music ducks under every line.
  const VO = [
    { id: 'n01', at: 0.9, dur: 2.05, who: 'narrator', text: 'Это Саша. Ему десять лет.' },
    { id: 'n02', at: T(1, 0.5), dur: 2.40, who: 'narrator', text: 'В их семье денег всегда не хватало.' },
    { id: 'n03', at: T(2, 0.5), dur: 2.26, who: 'narrator', text: 'Мама пересчитывала каждую монету.' },
    { id: 's01', at: T(3, 2), dur: 0.82, who: 'boy', text: 'Я всё изменю.' },
    { id: 'n04', at: T(4, 0.5), dur: 2.88, who: 'narrator', text: 'Первые деньги он заработал на лимонаде во дворе.' },
    { id: 'n05', at: T(5, 1.5), dur: 1.57, who: 'narrator', text: 'Полторы тысячи рублей!' },
    { id: 'n06', at: T(6, 0.5), dur: 4.23, who: 'narrator', text: 'В пятнадцать он учился по ночам: код, английский, продажи.' },
    { id: 'n07', at: T(8, 1), dur: 3.42, who: 'narrator', text: 'Первый бизнес прогорел. Долг — двести тысяч.' },
    { id: 'm01', at: T(10, 0.5), dur: 1.92, who: 'mom', text: 'Упал — вставай. Я в тебя верю.' },
    { id: 'n08', at: T(11, 0.5), dur: 3.36, who: 'narrator', text: 'В девятнадцать — новая идея и маленькая команда.' },
    { id: 'n09', at: T(12, 2), dur: 1.93, who: 'narrator', text: 'Каждый день — шаг вперёд.' },
    { id: 'n10', at: T(14, 2), dur: 1.29, who: 'narrator', text: 'Его первый миллион!' },
    { id: 'n11', at: T(16, 0.5), dur: 2.50, who: 'narrator', text: 'И первым делом — новый дом для мамы.' },
    { id: 'n12', at: T(18, 0) + 0.1, dur: 2.38, who: 'narrator', text: 'Первый миллион — это не про деньги.' },
    { id: 'n13', at: T(19, 0) + 0.1, dur: 0.94, who: 'narrator', text: 'Это про путь.' },
  ];
  for (let i = 1; i < VO.length; i++) if (VO[i].at < VO[i - 1].at + VO[i - 1].dur) throw new Error('voice lines overlap: ' + VO[i].id);
  if (VO.some((v) => v.at < T(13, 3) && v.at + v.dur > T(13, 3))) throw new Error('a voice line runs into the held breath');

  const SCORE = {
    FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, HOOK, ev, markers,
    coinNotes, jarCoins, LEMON_TOTAL, ticks, riseBars, riseCounter, musicbox, lead, sad, brass,
    captions, momLine, promiseLine, endText, VO,
  };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
