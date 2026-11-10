"use client";

import { useEffect, useRef } from "react";

/**
 * 背景で動くライフゲーム（Conway's Game of Life, B3/S23, トーラス境界）。
 * - セルはシンタックス色で塗り、死んだセルは数世代かけてフェードアウトする
 * - カーソルの通り道にセルが生まれ、何もない所をクリックするとグライダーが出る
 * - prefers-reduced-motion では止まった 1 フレームだけを描く
 */
const CELL = 16; // マスの間隔(px)
const GAP = 3;
const TICK_MS = 140;
const FADE_STEPS = 6;
const PALETTE = ["--syntax-type", "--syntax-keyword", "--syntax-number", "--syntax-string", "--syntax-tag", "--syntax-fn"];

/**
 * CSS 変数の oklch() を canvas 用の rgb() に変換する。
 * canvas の fillStyle が oklch() を解釈できない Safari のバージョンがあるため、JS 側で変換しておく。
 */
function toCanvasColor(value: string): string {
  const m = value.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return value || "gray";
  const L = m[2] ? Number(m[1]) / 100 : Number(m[1]);
  const C = Number(m[3]);
  const h = (Number(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ].map((x) => {
    const c = Math.min(1, Math.max(0, x));
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  });
  return `rgb(${rgb.join(", ")})`;
}

export function LifeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    let alive = new Uint8Array(0); // 0/1
    let hue = new Uint8Array(0); // パレットの番号
    let fade = new Uint8Array(0); // 死んでからの残り表示
    let colors: string[] = [];
    let generation = 0;

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      colors = PALETTE.map((name) => toCanvasColor(style.getPropertyValue(name).trim()));
    };

    const idx = (x: number, y: number) => ((y + rows) % rows) * cols + ((x + cols) % cols);

    const seed = (density: number, x0 = 0, y0 = 0, w = cols, h = rows) => {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          if (Math.random() < density) {
            const i = idx(x, y);
            alive[i] = 1;
            hue[i] = Math.floor(Math.random() * PALETTE.length);
          }
        }
      }
    };

    const resize = () => {
      // canvas 自身の大きさを使う（iOS ではアドレスバーの出し入れで innerHeight が変わるため）
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nextCols = Math.ceil(width / CELL);
      const nextRows = Math.ceil(height / CELL);
      if (nextCols === cols && nextRows === rows) return;
      const first = cols === 0;
      // サイズが変わっても盤面は引き継ぐ（スクロールや回転のたびにリセットしない）
      const prev = { alive, hue, fade, cols, rows };
      cols = nextCols;
      rows = nextRows;
      alive = new Uint8Array(cols * rows);
      hue = new Uint8Array(cols * rows);
      fade = new Uint8Array(cols * rows);
      for (let y = 0; y < Math.min(rows, prev.rows); y++) {
        for (let x = 0; x < Math.min(cols, prev.cols); x++) {
          const from = y * prev.cols + x;
          const to = y * cols + x;
          alive[to] = prev.alive[from];
          hue[to] = prev.hue[from];
          fade[to] = prev.fade[from];
        }
      }
      if (!first) {
        // 広がった部分にだけ新しくセルをまく
        if (cols > prev.cols) seed(0.3, prev.cols, 0, cols - prev.cols, rows);
        if (rows > prev.rows) seed(0.3, 0, prev.rows, Math.min(cols, prev.cols), rows - prev.rows);
        return;
      }
      seed(0.3);
      // ランダムな初期状態はノイズに見えるので、少し進めてから表示する
      for (let k = 0; k < 40; k++) step();
    };

    function step() {
      const next = new Uint8Array(cols * rows);
      const nextHue = new Uint8Array(cols * rows);
      let population = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let n = 0;
          // 生まれるセルは周りで一番多い色を受け継ぐ
          const votes = new Uint8Array(PALETTE.length);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const j = idx(x + dx, y + dy);
              if (alive[j]) {
                n++;
                votes[hue[j]]++;
              }
            }
          }
          const i = y * cols + x;
          if (alive[i] ? n === 2 || n === 3 : n === 3) {
            next[i] = 1;
            population++;
            nextHue[i] = alive[i] ? hue[i] : votes.indexOf(Math.max(...votes));
          } else if (alive[i]) {
            fade[i] = FADE_STEPS;
            nextHue[i] = hue[i];
          } else {
            if (fade[i] > 0) fade[i]--;
            nextHue[i] = hue[i];
          }
        }
      }
      alive = next;
      hue = nextHue;
      generation++;
      // 寂しくなったり固まったりしたら、ランダムな一角に「スープ」を足す
      if (population < cols * rows * 0.03 || generation % 400 === 0) {
        const w = Math.max(6, Math.floor(cols / 4));
        const h = Math.max(6, Math.floor(rows / 4));
        seed(0.35, Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), w, h);
      }
    }

    const draw = () => {
      const dark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const size = CELL - GAP;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const a = alive[i] ? 1 : fade[i] / (FADE_STEPS * 2.5);
          if (a <= 0) continue;
          ctx.globalAlpha = a * (dark ? 0.3 : 0.22);
          ctx.fillStyle = colors[hue[i]];
          ctx.fillRect(x * CELL, y * CELL, size, size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const spawnAt = (clientX: number, clientY: number) => {
      const cx = Math.floor(clientX / CELL);
      const cy = Math.floor(clientY / CELL);
      const c = Math.floor(Math.random() * PALETTE.length);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.random() < 0.5) {
            const i = idx(cx + dx, cy + dy);
            alive[i] = 1;
            hue[i] = c;
          }
        }
      }
    };

    const glider = (clientX: number, clientY: number) => {
      const cx = Math.floor(clientX / CELL);
      const cy = Math.floor(clientY / CELL);
      const c = Math.floor(Math.random() * PALETTE.length);
      // 進む向きはランダム
      const sx = Math.random() < 0.5 ? 1 : -1;
      const sy = Math.random() < 0.5 ? 1 : -1;
      for (const [x, y] of [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]) {
        const i = idx(cx + (x - 1) * sx, cy + (y - 1) * sy);
        alive[i] = 1;
        hue[i] = c;
      }
    };

    readColors();
    resize();
    draw();
    if (reduceMotion) return;

    let lastSpawn = 0;
    let down: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      // タッチはスクロール操作と区別できないので、セルを生むのはマウス・ペンだけ
      if (e.pointerType === "touch") return;
      const now = performance.now();
      if (now - lastSpawn < 60) return;
      lastSpawn = now;
      spawnAt(e.clientX, e.clientY);
    };
    // iOS Safari はリンク以外の要素へのタップで click を window まで届けないことがあるので、
    // pointerdown → pointerup の位置がほぼ同じなら「タップ / クリック」とみなす
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      const start = down;
      down = null;
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return;
      if ((e.target as Element | null)?.closest?.("a, button, input, textarea, select")) return;
      glider(e.clientX, e.clientY);
      draw();
    };
    const onResize = () => {
      resize();
      draw();
    };
    // テーマ切り替え時に色を読み直す
    const observer = new MutationObserver(() => {
      readColors();
      draw();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    let timer = 0;
    const loop = () => {
      if (!document.hidden) {
        step();
        draw();
      }
      timer = window.setTimeout(loop, TICK_MS);
    };
    timer = window.setTimeout(loop, TICK_MS);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="life-mask pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
