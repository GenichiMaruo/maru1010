import { projects } from "@/lib/projects";

// 掲載プロジェクトの technologies からプログラミング言語だけを数える
const languages = [
  { name: "TypeScript", className: "bg-syntax-type" },
  { name: "Python", className: "bg-syntax-number" },
  { name: "Java", className: "bg-syntax-tag" },
  { name: "C", className: "bg-syntax-fn" },
  { name: "Go", className: "bg-syntax-string" },
];

export function LanguageBar() {
  const counts = languages
    .map((lang) => ({
      ...lang,
      count: projects.filter((p) => p.technologies.includes(lang.name)).length,
    }))
    .filter((lang) => lang.count > 0)
    .sort((a, b) => b.count - a.count);
  const total = counts.reduce((sum, lang) => sum + lang.count, 0);
  if (total === 0) return null;

  return (
    <figure className="font-mono text-xs">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {counts.map((lang) => (
          <span
            key={lang.name}
            className={lang.className}
            style={{ width: `${(lang.count / total) * 100}%` }}
          />
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground">
        {counts.map((lang) => (
          <span key={lang.name} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${lang.className}`} />
            <span className="text-foreground">{lang.name}</span>
            <span>{lang.count}</span>
          </span>
        ))}
        <span className="text-syntax-comment">{"// 掲載プロジェクト数"}</span>
      </figcaption>
    </figure>
  );
}
