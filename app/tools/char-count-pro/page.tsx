"use client";

import { useEffect } from "react";
import { generateGeometricPattern } from "@/utils/generatePattern";
import CharCountProEditor from "@/components/tools/CharCountProEditor";

export default function CharCountProPage() {
  useEffect(() => {
    const lightPatternOptions = {
      size: 300,
      colors: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc"],
      complexity: Math.random() * 0.3 + 0.3,
      contrast: Math.random() * 0.4 + 0.3,
    };
    const darkPatternOptions = {
      size: 300,
      colors: ["#0c1429", "#1e293b", "#334155", "#475569"],
      complexity: Math.random() * 0.3 + 0.3,
      contrast: Math.random() * 0.4 + 0.3,
    };

    const lightSvg = generateGeometricPattern(lightPatternOptions);
    const darkSvg = generateGeometricPattern(darkPatternOptions);

    document.documentElement.style.setProperty(
      "--char-count-pro-pattern-light",
      `url('data:image/svg+xml;utf8,${encodeURIComponent(lightSvg)}')`
    );
    document.documentElement.style.setProperty(
      "--char-count-pro-pattern-dark",
      `url('data:image/svg+xml;utf8,${encodeURIComponent(darkSvg)}')`
    );
  }, []);

  return (
    <div className="h-screen bg-cyan-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300 ease-in-out">
      {/* Full Screen Editor */}
      <div className="relative z-[2] h-full">
        <CharCountProEditor />
      </div>
    </div>
  );
}
