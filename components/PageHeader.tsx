export function PageHeader({
  command,
  title,
  lead,
}: {
  command: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="font-mono text-xs text-muted-foreground">
        <span className="text-brand">$</span> {command}
      </p>
      <h1 className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {lead}
        </p>
      )}
    </header>
  );
}
