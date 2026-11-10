// 言語にはシンタックス色の丸を付け、それ以外はグレーにする
const languageColor: Record<string, string> = {
  TypeScript: "bg-syntax-type",
  Python: "bg-syntax-number",
  Java: "bg-syntax-tag",
  C: "bg-syntax-fn",
  Go: "bg-syntax-string",
};

export function TechTags({ technologies }: { technologies: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5 font-mono text-[11px]">
      {technologies.map((tech) => (
        <li
          key={tech}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${languageColor[tech] ?? "bg-muted-foreground/40"}`}
          />
          {tech}
        </li>
      ))}
    </ul>
  );
}
