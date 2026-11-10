import { CircuitBoard, Blocks, Grid3X3, Network, Orbit, Swords } from "lucide-react";

const artwork = {
  singulo: { Icon: Orbit, color: "text-syntax-keyword", label: "factory / gravity / space" },
  "singulo-arsenal": { Icon: Swords, color: "text-syntax-tag", label: "physics / equipment" },
  worldgenassist: { Icon: Network, color: "text-syntax-string", label: "terrain / distributed computing" },
  nandtick: { Icon: CircuitBoard, color: "text-syntax-type", label: "logic / circuits / ticks" },
  rendot: { Icon: Grid3X3, color: "text-syntax-number", label: "pixels / bits / encoding" },
};

export function ProjectArtwork({ id }: { id?: string }) {
  const { Icon, color, label } = artwork[id as keyof typeof artwork] ?? {
    Icon: Blocks,
    color: "text-syntax-fn",
    label: "project",
  };

  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden bg-secondary p-5 ${color}`}
    >
      <div className="absolute -right-8 -bottom-10 opacity-[0.14]">
        <Icon size={220} strokeWidth={1} />
      </div>
      <Icon className="h-8 w-8" strokeWidth={1.5} />
      <p className="relative font-mono text-[11px] text-syntax-comment">{`// ${label}`}</p>
    </div>
  );
}
