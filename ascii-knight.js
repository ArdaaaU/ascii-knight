/**
 * ASCII Knight Engine - High Performance Reverse-Engineered Simulation
 * Faithful recreation of the original masterpiece with modular configuration.
 */

(function () {
  "use strict";

  // Default configuration presets
  const THEMES = {
    classic: {
      name: "Classic Twilight",
      bg: [0x14, 0x15, 0x18],
      knight: [0.64, 0.66, 0.70],
      red: [0.80, 0.09, 0.11],
      redDark: [0.34, 0.02, 0.04],
      grassFar: [0.20, 0.27, 0.26],
      grassNear: [0.32, 0.50, 0.28],
      grassTip: [0.82, 0.72, 0.40]
    },
    bloodmoon: {
      name: "Blood Moon",
      bg: [0x18, 0x0c, 0x10],
      knight: [0.75, 0.60, 0.62],
      red: [0.96, 0.18, 0.15],
      redDark: [0.48, 0.05, 0.08],
      grassFar: [0.32, 0.15, 0.18],
      grassNear: [0.48, 0.18, 0.24],
      grassTip: [0.95, 0.55, 0.42]
    },
    emerald: {
      name: "Emerald Aurora",
      bg: [0x0c, 0x16, 0x14],
      knight: [0.65, 0.78, 0.74],
      red: [0.12, 0.82, 0.62],
      redDark: [0.03, 0.35, 0.25],
      grassFar: [0.15, 0.30, 0.26],
      grassNear: [0.22, 0.52, 0.38],
      grassTip: [0.55, 0.95, 0.75]
    },
    cyberpunk: {
      name: "Neon Synth",
      bg: [0x10, 0x0e, 0x20],
      knight: [0.72, 0.70, 0.95],
      red: [0.95, 0.15, 0.65],
      redDark: [0.45, 0.05, 0.30],
      grassFar: [0.18, 0.18, 0.45],
      grassNear: [0.22, 0.45, 0.75],
      grassTip: [0.35, 0.92, 0.98]
    },
    amber: {
      name: "Golden Hour",
      bg: [0x1a, 0x12, 0x0c],
      knight: [0.80, 0.72, 0.65],
      red: [0.95, 0.42, 0.10],
      redDark: [0.48, 0.16, 0.04],
      grassFar: [0.35, 0.25, 0.18],
      grassNear: [0.58, 0.45, 0.22],
      grassTip: [0.98, 0.88, 0.55]
    }
  };

  class AsciiKnightSim {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.audio = window.KnightAudio ? new window.KnightAudio() : null;

      // Simulation parameters
      this.params = {
        loop: 2.4,          // Cycle duration for seamless loop
        wave: 3.2,          // Cloth wave displacement strength
        glow: 0.5,          // Bloom glow intensity
        breath: 0.9,        // Knight breathing vertical movement
        sway: 0.7,          // Knight subtle horizontal sway
        cloak: 3.2,         // Billowing ragged cloak displacement
        grassWind: 2.0,     // Wind force on grass
        grassHeight: 1.7,   // Grass blade height multiplier
        horizon: 0.56,      // Horizon line ratio (0 to 1)
        fontSize: 12,       // Pixel font size
        fps: 30,            // Target FPS
        theme: "classic",   // Active color palette
        paused: false       // Play/pause state
      };

      Object.assign(this.params, options);

      // Character sets
      this.BUCKETS = [" ", ".", ":-", "=+", "*%", "#", "@"];
      this.LEVELS = [0.06, 0.18, 0.32, 0.48, 0.64, 0.80];
      this.GRASS_CHARS = "|/\\',." + "+xX%&";
      this.G_PIPE = 0;
      this.G_SLASH = 1;
      this.G_BACK = 2;
      this.G_TICK = 3;
      this.G_COMMA = 4;
      this.G_DOT = 5;
      this.FABRIC = 6;

      this.TAU = Math.PI * 2;
      this.lastDraw = -1e9;
      this.timeOffset = 0;
      this.lastNow = performance.now();
      this.fpsCounter = 0;
      this.currentFps = 30;
      this.fpsTimer = performance.now();

      this.initKnightData();
      this.initDimensions();
      this.initBuffers();
      this.initMasks();
      this.initGrass();
      this.initScarf();

      this.startLoop();
    }

    initKnightData() {
      this.KNIGHT = window.KNIGHT_DATA;
      if (!this.KNIGHT) {
        console.error("Knight data not loaded!");
        return;
      }
      this.KC = this.KNIGHT.cols;
      this.KR = this.KNIGHT.rows;
      this.knightLum = new Float32Array(this.KC * this.KR);
      this.KNIGHT.data.forEach((row, r) => {
        for (let c = 0; c < this.KC; c++) {
          this.knightLum[r * this.KC + c] = parseInt(row[c], 16) / 15;
        }
      });

      // Mask dilation to prevent grass from piercing small gaps
      this.knightMask = new Uint8Array(this.KC * this.KR);
      for (let r = 0; r < this.KR; r++) {
        for (let c = 0; c < this.KC; c++) {
          let on = 0;
          for (let dr = -1; dr <= 1 && !on; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const rr = r + dr, cc = c + dc;
              if (rr >= 0 && rr < this.KR && cc >= 0 && cc < this.KC && this.knightLum[rr * this.KC + cc] > 0.08) {
                on = 1;
                break;
              }
            }
          }
          this.knightMask[r * this.KC + c] = on;
        }
      }

      // Cloak trailing edge wave weight
      this.CLOAK_PAD = 8;
      this.cloakW = new Float32Array(this.KR * (this.KC + this.CLOAK_PAD));
      for (let r = 0; r < this.KR; r++) {
        for (let c = 0; c < this.KC + this.CLOAK_PAD; c++) {
          this.cloakW[r * (this.KC + this.CLOAK_PAD) + c] =
            this.smoothstep(this.KC * 0.63, this.KC * 0.97, c) *
            this.smoothstep(12, 22, r) *
            (1 - this.smoothstep(96, 106, r)) *
            (0.6 + 0.4 * this.smoothstep(40, 90, r));
        }
      }
    }

    initDimensions() {
      const probe = document.createElement("canvas").getContext("2d");
      const fontStr = `${this.params.fontSize}px Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace`;
      probe.font = fontStr;
      this.font = fontStr;
      this.CW = Math.max(1, Math.round(probe.measureText("M").width));
      this.CH = this.params.fontSize;

      const fitCols = (rows) => Math.round(rows * this.CH / this.CW * window.innerWidth / Math.max(1, window.innerHeight));
      this.ROWS = Math.max(this.KR, Math.min(260, Math.round(this.KC * this.CW / this.CH * window.innerHeight / Math.max(1, window.innerWidth))));
      this.COLS = Math.max(this.KC, Math.min(560, fitCols(this.ROWS)));
      this.N = this.COLS * this.ROWS;
      this.KX = Math.floor((this.COLS - this.KC) / 2);
      this.KY = this.ROWS - this.KR;

      this.W = this.COLS * this.CW;
      this.H = this.ROWS * this.CH;
      this.canvas.width = this.W;
      this.canvas.height = this.H;
    }

    initBuffers() {
      this.Xc = new Float32Array(this.COLS);
      this.Yr = new Float32Array(this.ROWS);
      for (let c = 0; c < this.COLS; c++) this.Xc[c] = (c + 0.5) * 0.5;
      for (let r = 0; r < this.ROWS; r++) this.Yr[r] = r + 0.5;

      this.lum = new Float32Array(this.N);
      this.rgb = new Float32Array(this.N * 3);
      this.isKnight = new Uint8Array(this.N);
      this.glyph = new Int8Array(this.N);
      this.SEG = new Float64Array(40 * 9);

      // Offscreen canvas for fast pixel write
      this.asciiCanvas = document.createElement("canvas");
      this.asciiCanvas.width = this.W;
      this.asciiCanvas.height = this.H;
      this.actx = this.asciiCanvas.getContext("2d");
      this.imgData = this.actx.createImageData(this.W, this.H);
      this.px32 = new Uint32Array(this.imgData.data.buffer);

      // Glow blur canvases (downscaled /2, /4, /8)
      this.glowA = document.createElement("canvas");
      this.glowB = document.createElement("canvas");
      this.glowC = document.createElement("canvas");
      [[this.glowA, 2], [this.glowB, 4], [this.glowC, 8]].forEach(([g, s]) => {
        g.width = Math.ceil(this.W / s);
        g.height = Math.ceil(this.H / s);
      });
    }

    initMasks() {
      this.START = [];
      this.COUNT = this.BUCKETS.map((b) => b.length);
      this.BUCKETS.reduce((s, b, k) => {
        this.START[k] = s;
        return s + b.length;
      }, 0);

      this.GRASS0 = this.BUCKETS.join("").length;
      const allChars = [...this.BUCKETS.join("") + this.GRASS_CHARS];

      this.MASKS = allChars.map((ch) => {
        const g = document.createElement("canvas");
        g.width = this.CW;
        g.height = this.CH;
        const gx = g.getContext("2d");
        gx.font = this.font;
        gx.textBaseline = "middle";
        gx.fillStyle = "#fff";
        gx.fillText(ch, 0, this.CH / 2);
        const d = gx.getImageData(0, 0, this.CW, this.CH).data;
        const m = new Uint8Array(this.CW * this.CH);
        for (let k = 0; k < m.length; k++) m[k] = d[k * 4 + 3];
        return m;
      });
    }

    initScarf() {
      this.STRANDS = [
        { root: [42, 24], ctrl: [55, 17], tip: [75, 8.5], width: 4.6, amp: 0.9, ph: 0.0 },
        { root: [40, 26], ctrl: [56, 24], tip: [77, 30], width: 5.6, amp: 1.0, ph: 1.9 },
        { root: [47, 20], ctrl: [60, 12], tip: [78, 4], width: 1.1, amp: 1.3, ph: 0.9 },
        { root: [52, 29], ctrl: [64, 32], tip: [79, 38], width: 1.3, amp: 1.2, ph: 2.7 }
      ];
      this.WRAP = [
        { pts: [[24.5, 27], [27, 29.5], [31, 30.5], [35, 28.5], [39, 26]], hws: [3.2, 3.6, 3.4, 3.2, 3.0] },
        { pts: [[30, 30], [31.5, 32.5], [33, 33.6]], hws: [1.8, 1.5, 1.0] }
      ];

      const OX = this.KX * 0.5, OY = this.KY;
      for (const S of this.STRANDS) {
        for (const P of [S.root, S.ctrl, S.tip]) {
          P[0] += OX;
          P[1] += OY;
        }
      }
      for (const W of this.WRAP) {
        for (const P of W.pts) {
          P[0] += OX;
          P[1] += OY;
        }
      }

      this.AV = Array.from({ length: 20 }, (_, k) => k / 19);
    }

    initGrass() {
      this.H0 = this.ROWS * this.params.horizon;
      this.BLADES = [];
      const n = Math.round(this.COLS * 5.5);
      for (let k = 0; k < n; k++) {
        const depth = Math.pow(this.rnd(k, 1), 0.75);
        this.BLADES.push({
          x: this.rnd(k, 2) * this.COLS * 0.5,
          y: this.H0 + depth * (this.ROWS + 3 - this.H0),
          depth,
          h: (0.8 + 10 * this.params.grassHeight * depth * depth) *
             (0.45 + 1.0 * Math.pow(this.rnd(k, 3), 1.4)) *
             (0.8 + 0.2 * this.params.grassHeight),
          lean0: 0.15 + (this.rnd(k, 4) - 0.5) * 0.35,
          ph: this.rnd(k, 5) * this.TAU,
          tint: this.rnd(k, 6)
        });
      }
      this.BLADES.sort((a, b) => a.y - b.y);
      this.FRONT_FROM = this.BLADES.findIndex((B) => B.y > this.ROWS - 4);

      // Fluff spores
      this.FLUFF = Array.from({ length: Math.round(this.COLS / 3.5) }, (_, k) => ({
        k,
        x0: this.rnd(k, 11) * this.COLS * 0.5,
        y0: this.H0 * (0.25 + 0.95 * this.rnd(k, 12)),
        laps: 1 + (k % 2),
        bob: 1 + 3 * this.rnd(k, 13),
        ph: this.rnd(k, 14) * this.TAU
      }));
    }

    // Mathematical helpers
    clamp(x, lo = 0, hi = 1) { return x < lo ? lo : x > hi ? hi : x; }
    smoothstep(a, b, x) { const t = this.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
    hash3(a, b, c) {
      let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      return (h ^ (h >>> 16)) >>> 0;
    }
    rnd(k, n) { return this.hash3(k, n, 5150) / 4294967296; }
    lerp3(a, b, k) {
      k = this.clamp(k);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }

    set(i, l, col) {
      this.lum[i] = l;
      this.isKnight[i] = 0;
      this.glyph[i] = -1;
      const j = i * 3;
      this.rgb[j] = col[0];
      this.rgb[j + 1] = col[1];
      this.rgb[j + 2] = col[2];
    }

    brush(pts, hws, av, fn) {
      const n = pts.length, ns = n - 1;
      let ymin = 1e9, ymax = -1e9, maxw = 0;
      for (let k = 0; k < n; k++) {
        ymin = Math.min(ymin, pts[k][1]);
        ymax = Math.max(ymax, pts[k][1]);
        maxw = Math.max(maxw, hws[k]);
      }
      for (let s = 0; s < ns; s++) {
        const o = s * 9, ax = pts[s][0], ay = pts[s][1], dx = pts[s + 1][0] - ax, dy = pts[s + 1][1] - ay;
        this.SEG[o] = ax;
        this.SEG[o + 1] = ay;
        this.SEG[o + 2] = dx;
        this.SEG[o + 3] = dy;
        this.SEG[o + 4] = 1 / (dx * dx + dy * dy + 1e-9);
        this.SEG[o + 5] = hws[s];
        this.SEG[o + 6] = hws[s + 1] - hws[s];
        this.SEG[o + 7] = av[s];
        this.SEG[o + 8] = av[s + 1] - av[s];
      }
      const r0 = Math.max(0, Math.floor(ymin - maxw - 1)), r1 = Math.min(this.ROWS, Math.ceil(ymax + maxw + 1));
      for (let r = r0; r < r1; r++) {
        const py = this.Yr[r];
        let rx0 = 1e9, rx1 = -1e9;
        for (let s = 0, o = 0; s < ns; s++, o += 9) {
          const pw = Math.max(this.SEG[o + 5], this.SEG[o + 5] + this.SEG[o + 6]) + 1;
          const ya = this.SEG[o + 1], yb = ya + this.SEG[o + 3];
          if (py < Math.min(ya, yb) - pw || py > Math.max(ya, yb) + pw) continue;
          const xa = this.SEG[o], xb = xa + this.SEG[o + 2];
          rx0 = Math.min(rx0, Math.min(xa, xb) - pw);
          rx1 = Math.max(rx1, Math.max(xa, xb) + pw);
        }
        if (rx0 > rx1) continue;
        const c0 = Math.max(0, Math.floor(rx0 * 2)), c1 = Math.min(this.COLS, Math.ceil(rx1 * 2));
        for (let c = c0; c < c1; c++) {
          const px = this.Xc[c];
          let best = 1, bestS = -1, bestU = 0;
          for (let s = 0, o = 0; s < ns; s++, o += 9) {
            const qx = px - this.SEG[o], qy = py - this.SEG[o + 1], dx = this.SEG[o + 2], dy = this.SEG[o + 3];
            let u = (qx * dx + qy * dy) * this.SEG[o + 4];
            u = u < 0 ? 0 : u > 1 ? 1 : u;
            const ex = qx - dx * u, ey = qy - dy * u;
            let hw = this.SEG[o + 5] + this.SEG[o + 6] * u;
            if (hw < 1e-3) hw = 1e-3;
            const q2 = (ex * ex + ey * ey) / (hw * hw);
            if (q2 < best) { best = q2; bestS = s; bestU = u; }
          }
          if (bestS < 0) continue;
          const o = bestS * 9, cr = this.SEG[o + 2] * (py - this.SEG[o + 1]) - this.SEG[o + 3] * (px - this.SEG[o]);
          fn(r * this.COLS + c, this.SEG[o + 7] + this.SEG[o + 8] * bestU, Math.sqrt(best) * (cr > 0 ? 1 : cr < 0 ? -1 : 0), r, c);
        }
      }
    }

    strandPoints(S, t, k) {
      const pts = [], hws = [];
      const [R, Cp, T] = [S.root, S.ctrl, S.tip];
      const loop = this.params.loop;
      for (let i = 0; i < 20; i++) {
        const s = i / 19, u = 1 - s;
        const bx = u * u * R[0] + 2 * u * s * Cp[0] + s * s * T[0];
        const by = u * u * R[1] + 2 * u * s * Cp[1] + s * s * T[1];
        const tx = 2 * u * (Cp[0] - R[0]) + 2 * s * (T[0] - Cp[0]);
        const ty = 2 * u * (Cp[1] - R[1]) + 2 * s * (T[1] - Cp[1]);
        const tl = Math.hypot(tx, ty) + 1e-9, nx = -ty / tl, ny = tx / tl;

        const w1 = Math.sin(this.TAU * (1.3 * s - t / loop) + S.ph);
        const w2 = Math.sin(this.TAU * (2.6 * s - 2 * t / loop) + S.ph * 1.7);
        const d = this.params.wave * S.amp * (Math.pow(s, 1.35) * w1 + 0.35 * s * s * w2);
        pts.push([bx + nx * d, by + ny * d]);
        const twist = 0.78 + 0.22 * Math.sin(this.TAU * (1.7 * s - t / loop) + S.ph + 1);
        hws.push(S.width * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, s * 1.2))) * twist * (1 - 0.25 * s));
      }
      return { pts, hws };
    }

    cloth(pts, hws, t, k, tatter, ph, currentTheme) {
      const lin = (n) => Array.from({ length: n }, (_, idx) => idx / (n - 1));
      const loop = this.params.loop;
      this.brush(pts, hws, pts.length === 20 ? this.AV : lin(pts.length), (i, a, q, r, c) => {
        const thr = tatter ? this.smoothstep(0.82, 1.0, a) : 0;
        if (thr > 0) {
          const hn = this.hash3(Math.floor(a * 55), Math.floor((q + 1) * 2.5), k + 7) % 1000 / 1000;
          if (hn < thr * 0.45 || Math.abs(q) > 1 - 0.35 * thr * (this.hash3(Math.floor(a * 40), k, 3) % 1000 / 1000)) return;
        }
        const crest = 0.5 + 0.5 * Math.cos(this.TAU * (1.3 * a - t / loop) + ph + Math.PI / 2);
        const across = 0.92 + 0.08 * Math.cos(q * Math.PI);
        const rolled = 1 - 0.22 * this.smoothstep(0.72, 1, Math.abs(q));
        const l = (0.4 + 0.32 * crest) * across * rolled;
        const col = this.lerp3(currentTheme.redDark, currentTheme.red, 0.2 + 0.8 * crest);
        this.set(i, l, col);
        this.glyph[i] = this.FABRIC + Math.max(0, Math.min(4, Math.floor((l - 0.26) / 0.1)));
      });
    }

    scarf(t, currentTheme) {
      this.STRANDS.forEach((S, k) => {
        const { pts, hws } = this.strandPoints(S, t, k);
        this.cloth(pts, hws, t, k, true, S.ph, currentTheme);
      });
      const loop = this.params.loop;
      const wob = 0.35 * Math.sin(this.TAU * t / loop);
      this.WRAP.forEach((P, k) => {
        this.cloth(P.pts.map(([x, y], i) => [x, y + wob * Math.sin(i * 1.3 + k)]), P.hws, t, 9 + k, false, 0.7 + k, currentTheme);
      });

      // Torn trailing thread particles
      const NP = 22;
      for (let p = 0; p < NP; p++) {
        const S = this.STRANDS[p % this.STRANDS.length];
        const ph = ((t / (loop * 2) + p / NP) % 1 + 1) % 1;
        const { pts } = this.strandPoints(S, t, p % this.STRANDS.length);
        const at = pts[Math.min(19, 14 + (this.hash3(p, 2, 9) % 6))];
        const dir = [S.tip[0] - S.ctrl[0], S.tip[1] - S.ctrl[1]], dl = Math.hypot(dir[0], dir[1]);
        const dist = ph * (6 + 10 * this.rnd(p, 3));
        const x = at[0] + dir[0] / dl * dist + 1.5 * Math.sin(this.TAU * ph * 2 + p);
        const y = at[1] + dir[1] / dl * dist - ph * (2 + 4 * this.rnd(p, 4));
        const c = Math.floor(x * 2), r = Math.floor(y);
        if (c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) continue;
        const i = r * this.COLS + c, l = 0.68 * (1 - 0.7 * ph) * this.smoothstep(0, 0.08, ph);
        if (l > this.lum[i]) {
          this.set(i, l, currentTheme.red);
          this.glyph[i] = this.FABRIC;
        }
      }
    }

    wind(x, t) {
      const P2 = 2 * this.params.loop;
      const gust = Math.pow(0.5 + 0.5 * Math.sin(this.TAU * (x / 60 - t / P2)), 3);
      return this.params.grassWind * (0.18 + 0.55 * gust + 0.12 * Math.sin(this.TAU * (x / 17 - 2 * t / P2) + 1.3));
    }

    blades(t, from, to, currentTheme) {
      const P2 = 2 * this.params.loop;
      for (let k = from; k < to; k++) {
        const B = this.BLADES[k], w = this.wind(B.x, t);
        let lean = B.lean0 + w * (0.6 + 0.6 * B.depth) +
          (0.35 * Math.sin(this.TAU * 3 * t / P2 + B.ph) + 0.15 * Math.sin(this.TAU * 5 * t / P2 + B.ph * 1.7)) * (0.5 + B.depth);
        lean = Math.max(-1.1, Math.min(1.5, lean));
        const sheen = Math.pow(0.5 + 0.5 * Math.sin(this.TAU * (B.x / 60 - t / P2) - 0.3), 3);
        const h = k >= this.FRONT_FROM && this.FRONT_FROM >= 0 ? Math.min(B.h, 10) : B.h;
        const steps = Math.max(1, Math.round(h));
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = B.x + lean * h * 0.55 * u * u, y = B.y - h * u;
          const r = Math.floor(y), c = Math.floor(x * 2);
          if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue;
          const i = r * this.COLS + c;
          const slope = 2.2 * lean * u;
          const g = B.depth < 0.1 ? (u > 0.5 ? this.G_TICK : this.G_DOT) :
            u > 0.9 && steps > 2 ? (slope > 0.5 ? this.G_TICK : this.G_COMMA) :
            slope > 0.6 ? this.G_SLASH : slope < -0.6 ? this.G_BACK : this.G_PIPE;
          const l = (0.12 + 0.32 * B.depth) * (0.7 + 0.3 * u) * (0.75 + 0.7 * sheen * u);
          let col = this.lerp3(currentTheme.grassFar, currentTheme.grassNear, B.depth);
          col = this.lerp3(col, currentTheme.grassTip, u * u * (0.25 + 0.35 * B.tint) + 0.45 * sheen * u);
          if (l >= this.lum[i]) {
            this.set(i, l, col);
            this.glyph[i] = g;
          }
        }
      }
    }

    fluff(t, currentTheme) {
      const P2 = 2 * this.params.loop;
      const span = this.COLS * 0.5;
      for (const F of this.FLUFF) {
        const x = (F.x0 + span * F.laps * t / P2) % span;
        const y = F.y0 + F.bob * Math.sin(this.TAU * t / P2 + F.ph);
        const r = Math.floor(y), c = Math.floor(x * 2);
        if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue;
        const i = r * this.COLS + c;
        if (this.lum[i] < 0.1) {
          this.set(i, 0.42, currentTheme.grassTip);
          this.glyph[i] = F.k % 3 ? this.G_DOT : this.FABRIC;
        }
      }
    }

    sampleKnight(x, y) {
      if (x < 0 || y < 0 || x > this.KC - 1 || y > this.KR - 1) return 0;
      const c0 = Math.floor(x), r0 = Math.floor(y), c1 = Math.min(this.KC - 1, c0 + 1), r1 = Math.min(this.KR - 1, r0 + 1);
      const fx = x - c0, fy = y - r0;
      return (this.knightLum[r0 * this.KC + c0] * (1 - fx) + this.knightLum[r0 * this.KC + c1] * fx) * (1 - fy) +
             (this.knightLum[r1 * this.KC + c0] * (1 - fx) + this.knightLum[r1 * this.KC + c1] * fx) * fy;
    }

    scene(t) {
      const currentTheme = THEMES[this.params.theme] || THEMES.classic;
      this.lum.fill(0);
      this.glyph.fill(-1);
      this.isKnight.fill(0);

      this.blades(t, 0, this.FRONT_FROM < 0 ? this.BLADES.length : this.FRONT_FROM, currentTheme);
      this.fluff(t, currentTheme);

      const loop = this.params.loop;
      const P2 = 2 * loop;
      const breath = this.params.breath * (0.5 - 0.5 * Math.cos(this.TAU * t / P2));
      const sway = this.params.sway * Math.sin(this.TAU * t / P2 + 0.8);

      for (let r = 0; r < this.KR; r++) {
        const wgt = this.smoothstep(this.KR * 0.92, this.KR * 0.35, r);
        const rowLift = r + breath * wgt, rowSway = sway * wgt * wgt;
        for (let c = 0; c < this.KC + this.CLOAK_PAD; c++) {
          const tc = c + this.KX;
          if (tc >= this.COLS) break;

          const w = this.cloakW[r * (this.KC + this.CLOAK_PAD) + c];
          let dx = 0, dy = 0;
          if (w > 0) {
            dx = this.params.cloak * w * (0.35 + 0.55 * Math.sin(this.TAU * (t / loop - r / 22 - c / 45)) +
                 0.3 * Math.sin(this.TAU * (2 * t / loop - r / 9) + 1.1));
            dy = 0.35 * this.params.cloak * w * Math.sin(this.TAU * (t / loop - c / 16) + 0.5);
          }
          const sx = c - dx + rowSway, sy = rowLift - dy;
          const L = this.sampleKnight(sx, sy);
          const i = (r + this.KY) * this.COLS + tc, j = i * 3;
          if (L < 0.06) {
            const mr = Math.round(sy), mc = Math.round(sx);
            if (mr >= 0 && mr < this.KR && mc >= 0 && mc < this.KC && this.knightMask[mr * this.KC + mc]) {
              this.lum[i] = 0;
            }
            continue;
          }
          this.lum[i] = L;
          this.glyph[i] = -1;
          this.isKnight[i] = 1;
          this.rgb[j] = currentTheme.knight[0];
          this.rgb[j + 1] = currentTheme.knight[1];
          this.rgb[j + 2] = currentTheme.knight[2];
        }
      }

      if (this.FRONT_FROM >= 0) {
        this.blades(t, this.FRONT_FROM, this.BLADES.length, currentTheme);
      }
      this.scarf(t, currentTheme);

      // Sound update
      if (this.audio && !this.audio.isMuted) {
        const gust = Math.pow(0.5 + 0.5 * Math.sin(this.TAU * (-t / P2)), 3);
        this.audio.update(this.params.grassWind, gust);
      }
    }

    draw() {
      const currentTheme = THEMES[this.params.theme] || THEMES.classic;
      this.px32.fill(0);

      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const i = r * this.COLS + c, L = this.lum[i];
          let m;
          if (this.glyph[i] >= 0) {
            m = this.MASKS[this.GRASS0 + this.glyph[i]];
          } else {
            let level = 0;
            while (level < this.LEVELS.length && L >= this.LEVELS[level]) level++;
            if (level === 0) continue;
            m = this.MASKS[this.START[level] + this.hash3(r, c, 1) % this.COUNT[level]];
          }
          const k = (this.isKnight[i] ? 0.9 : 0.6 + 0.45 * L) * 255, j = i * 3;
          const pr = Math.min(255, this.rgb[j] * k) | 0;
          const pg = Math.min(255, this.rgb[j + 1] * k) | 0;
          const pb = Math.min(255, this.rgb[j + 2] * k) | 0;
          const col = (pb << 16) | (pg << 8) | pr;
          let o0 = (r * this.CH) * this.W + c * this.CW, mi = 0;
          for (let y = 0; y < this.CH; y++, o0 += this.W) {
            for (let x = 0; x < this.CW; x++, mi++) {
              const v = m[mi];
              if (v) this.px32[o0 + x] = (v << 24) | col;
            }
          }
        }
      }

      this.actx.putImageData(this.imgData, 0, 0);

      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = `rgb(${currentTheme.bg.join(",")})`;
      this.ctx.fillRect(0, 0, this.W, this.H);
      this.ctx.drawImage(this.asciiCanvas, 0, 0);

      // Multi-tier Bloom / Glow
      if (this.params.glow > 0) {
        let src = this.asciiCanvas;
        for (const g of [this.glowA, this.glowB, this.glowC]) {
          const gx = g.getContext("2d");
          gx.clearRect(0, 0, g.width, g.height);
          gx.drawImage(src, 0, 0, g.width, g.height);
          src = g;
        }
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.globalAlpha = this.params.glow;
        this.ctx.drawImage(this.glowC, 0, 0, this.W, this.H);
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.globalAlpha = 1;
      }
    }

    startLoop() {
      const tick = (now) => {
        if (!this.params.paused) {
          const delta = (now - this.lastNow) / 1000;
          this.timeOffset += delta;
        }
        this.lastNow = now;

        if (now - this.lastDraw >= 1000 / this.params.fps - 2) {
          this.lastDraw = now;
          this.scene(this.timeOffset);
          this.draw();

          // FPS monitoring
          this.fpsCounter++;
          if (now - this.fpsTimer >= 1000) {
            this.currentFps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = now;
            if (this.onFpsUpdate) {
              this.onFpsUpdate(this.currentFps, this.COLS, this.ROWS);
            }
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    handleResize() {
      const fitCols = (rows) => Math.round(rows * this.CH / this.CW * window.innerWidth / Math.max(1, window.innerHeight));
      const rows = Math.max(this.KR, Math.min(260, Math.round(this.KC * this.CW / this.CH * window.innerHeight / Math.max(1, window.innerWidth))));
      const cols = Math.max(this.KC, Math.min(560, fitCols(rows)));
      if (Math.abs(cols - this.COLS) > 4 || Math.abs(rows - this.ROWS) > 4) {
        this.initDimensions();
        this.initBuffers();
        this.initGrass();
        this.initScarf();
      }
    }

    getAsciiText() {
      // Export current frame as raw plain text ASCII
      const lines = [];
      for (let r = 0; r < this.ROWS; r++) {
        let line = "";
        for (let c = 0; c < this.COLS; c++) {
          const i = r * this.COLS + c, L = this.lum[i];
          if (this.glyph[i] >= 0) {
            const allChars = this.BUCKETS.join("") + this.GRASS_CHARS;
            line += allChars[this.GRASS0 + this.glyph[i]] || " ";
          } else {
            let level = 0;
            while (level < this.LEVELS.length && L >= this.LEVELS[level]) level++;
            if (level === 0) {
              line += " ";
            } else {
              const bucket = this.BUCKETS[level];
              line += bucket[this.hash3(r, c, 1) % bucket.length];
            }
          }
        }
        lines.push(line.trimEnd());
      }
      return lines.join("\n");
    }

    takeScreenshot() {
      const link = document.createElement("a");
      link.download = `ascii-knight-${Date.now()}.png`;
      link.href = this.canvas.toDataURL("image/png");
      link.click();
    }
  }

  window.AsciiKnightSim = AsciiKnightSim;
  window.ASCII_KNIGHT_THEMES = THEMES;
})();
