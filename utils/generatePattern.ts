interface PatternOptions {
  size: number;
  colors: string[];
  complexity: number;
  contrast: number;
}

export function generateGeometricPattern(options: PatternOptions): string {
  const { size, colors, complexity, contrast } = options;

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">`;

  // Background (using the first color)
  svg += `<rect width="${size}" height="${size}" fill="${colors[0]}" />`;

  // Number of shapes based on complexity
  const numShapes = Math.floor(5 + complexity * 50); // Increase the number of shapes for more randomness

  for (let i = 0; i < numShapes; i++) {
    const shapeType = Math.random() < 0.5 ? "circle" : "rect"; // 50% circle, 50% rect
    const colorIndex = Math.floor(Math.random() * (colors.length - 1)) + 1; // Exclude the first color (background)
    const color = colors[colorIndex];

    if (shapeType === "circle") {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const baseRadius = size * 0.02; // Smaller minimum radius
      const radiusVariation = size * 0.1 * complexity; // Smaller variation
      const r = baseRadius + Math.random() * radiusVariation;
      const opacity = 0.2 + contrast * 0.8; // Range from 0.2 to 1
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" fill-opacity="${opacity}" />`;
    } else {
      // rect
      const x = Math.random() * size;
      const y = Math.random() * size;
      const baseWidth = size * 0.05; // Smaller base width
      const widthVariation = size * 0.2 * complexity; // Smaller variation
      const width = baseWidth + Math.random() * widthVariation;
      const baseHeight = size * 0.05; // Smaller base height
      const heightVariation = size * 0.2 * complexity; // Smaller variation
      const height = baseHeight + Math.random() * heightVariation;
      const rotation = Math.random() * 360;
      const opacity = 0.2 + contrast * 0.8;
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" fill-opacity="${opacity}" transform="rotate(${rotation} ${
        x + width / 2
      } ${y + height / 2})" />`;
    }
  }

  svg += `</svg>`;
  return svg;
}

export function generatePattern(theme: "light" | "dark" = "light"): string {
  const lightColors = [
    "#f0f8ff", // 薄いブルー
    "#e6f3ff", // より薄いブルー
    "#dbeafe", // 青みがかった白
    "#e0e7ff", // ラベンダーブルー
    "#f3e8ff", // 薄い紫
    "#fdf2f8", // 薄いピンク
  ];

  const darkColors = [
    "#0f172a", // ダークブルー
    "#1e293b", // スレートグレー
    "#334155", // ミディアムグレー
    "#475569", // ライトグレー
    "#1e1b4b", // ダークインディゴ
    "#312e81", // インディゴ
  ];

  const colors = theme === "light" ? lightColors : darkColors;

  return generateGeometricPattern({
    size: 200,
    colors: colors,
    complexity: 0.3,
    contrast: theme === "light" ? 0.2 : 0.4,
  });
}
