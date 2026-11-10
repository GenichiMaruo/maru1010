/**
 * サブページ用の静的な背景模様。
 * トップの動くライフゲームと同じマス目（16px）に、有名なパターン
 * （グライダー・宇宙船・ブロック・ビーハイブなど）を止まった状態で散らす。
 * インライン SVG なので CSS 変数の色がそのまま使え、テーマ切り替えにも追従する。
 */
const CELL = 16;
const SIZE = CELL - 3;
const TILE = 48; // タイルの一辺（マス数）。768px ごとに繰り返す

type Shape = { x: number; y: number; cells: [number, number][]; color: string };

const shapes: Shape[] = [
  // グライダー
  { x: 3, y: 4, color: "var(--syntax-type)", cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] },
  // 軽量級宇宙船 (LWSS)
  { x: 30, y: 8, color: "var(--syntax-keyword)", cells: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]] },
  // ブロック
  { x: 20, y: 2, color: "var(--syntax-string)", cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  // ビーハイブ
  { x: 41, y: 22, color: "var(--syntax-number)", cells: [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2]] },
  // ブリンカー
  { x: 12, y: 20, color: "var(--syntax-tag)", cells: [[0, 0], [1, 0], [2, 0]] },
  // ローフ
  { x: 23, y: 33, color: "var(--syntax-fn)", cells: [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [3, 2], [2, 3]] },
  // タブ
  { x: 4, y: 37, color: "var(--syntax-string)", cells: [[1, 0], [0, 1], [2, 1], [1, 2]] },
  // グライダー（逆向き）
  { x: 38, y: 40, color: "var(--syntax-tag)", cells: [[1, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  // ボート
  { x: 33, y: 28, color: "var(--syntax-type)", cells: [[0, 0], [1, 0], [0, 1], [2, 1], [1, 2]] },
  // トード（ヒキガエル）
  { x: 14, y: 10, color: "var(--syntax-number)", cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]] },
];

export function PatternBackground() {
  return (
    <svg aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full">
      <defs>
        <pattern id="life-dots" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <rect x={SIZE / 2 - 0.75} y={SIZE / 2 - 0.75} width={1.5} height={1.5} fill="var(--muted-foreground)" opacity={0.28} />
        </pattern>
        <pattern id="life-shapes" width={TILE * CELL} height={TILE * CELL} patternUnits="userSpaceOnUse">
          {shapes.map((shape, i) =>
            shape.cells.map(([cx, cy]) => (
              <rect
                key={`${i}-${cx}-${cy}`}
                x={(shape.x + cx) * CELL}
                y={(shape.y + cy) * CELL}
                width={SIZE}
                height={SIZE}
                rx={2}
                fill={shape.color}
              />
            ))
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#life-dots)" />
      <rect width="100%" height="100%" fill="url(#life-shapes)" className="opacity-[0.13] dark:opacity-[0.2]" />
    </svg>
  );
}
