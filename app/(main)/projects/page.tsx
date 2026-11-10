import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { ProjectArtwork } from "@/components/ProjectArtwork";
import { PageHeader } from "@/components/PageHeader";
import { TechTags } from "@/components/TechTags";
import { featuredProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "プロジェクト紹介 | maru1010.com",
  description: "Singulo、Worldgen Assist、NandTick、RenDot、PICO-88など、WebアプリとMinecraft MODの制作物を紹介します。",
};

const notes: Record<string, string> = {
  worldgenassist:
    "信頼できる参加者向けの実験的な Beta です。計算支援は初期状態で無効。有効化する構成では参加クライアントにシードが共有されます。",
  "singulo-arsenal": "Minecraft 1.21.1 / NeoForge、Singulo 本体 0.16 系向けの Beta。",
};

const primaryAction =
  "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-2 font-mono text-xs text-background transition-opacity hover:opacity-85";
const secondaryAction =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 font-mono text-xs text-foreground transition-colors hover:border-foreground/40";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <PageHeader
        command="ls ./projects"
        title="公開中のプロジェクト"
        lead="公開している Web アプリと Minecraft MOD です。"
      />

      <nav aria-label="プロジェクトへのショートカット" className="mt-8 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-sm">
        {featuredProjects.map((project) => (
          <a key={project.id} href={`#${project.id}`} className="text-syntax-type underline-offset-4 hover:underline">
            {project.id ?? project.title}/
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-8">
        {featuredProjects.map((project, index) => (
          <article key={project.id} id={project.id} className="scroll-mt-20 overflow-hidden rounded-lg border border-border bg-card">
            {/* エディタのタブ風ヘッダー */}
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2 font-mono text-xs">
              <p className="text-muted-foreground">
                <span className="text-syntax-comment">{String(index + 1).padStart(2, "0")}</span>
                <span className="mx-2 text-border">|</span>
                ~/projects/<span className="text-foreground">{project.id}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">{project.category}</span>
                {project.status && (
                  <span className="rounded-full border border-brand/40 px-2 py-0.5 text-brand">{project.status}</span>
                )}
              </p>
            </header>

            <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8 md:p-6">
              <div>
                <div className="overflow-hidden rounded-md border border-border">
                  {project.imageUrl ? (
                    <div className="relative aspect-[4/3]">
                      <Image src={project.imageUrl} alt={`${project.title}の画面`} fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
                    </div>
                  ) : (
                    <ProjectArtwork id={project.id} />
                  )}
                </div>
                <div className="mt-4">
                  <TechTags technologies={project.technologies} />
                </div>
              </div>

              <div className="flex flex-col">
                <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">{project.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-foreground/85">{project.description}</p>

                {project.features && (
                  <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {project.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5">
                        <span aria-hidden="true" className="font-mono text-brand">+</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {project.id && notes[project.id] && (
                  <p className="mt-5 rounded-md border-l-2 border-syntax-number bg-secondary/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-mono text-syntax-number">NOTE: </span>
                    {notes[project.id]}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {project.link?.map((url) => (
                    <Link key={url} href={url} className={primaryAction} {...(url.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {project.category === "Minecraft MOD" ? "配布ページ" : "アプリを開く"}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                  {project.github?.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={secondaryAction}>
                      <FaGithub className="h-3.5 w-3.5" />
                      ソースコード
                    </a>
                  ))}
                  {project.id === "pico88" && (
                    <Link href="/pico88" className={secondaryAction}>詳しい使い方</Link>
                  )}
                </div>

                {project.sources && (
                  <p className="mt-5 font-mono text-[11px] leading-relaxed text-syntax-comment">
                    {"// "}
                    {project.sources.map((source) => (
                      <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="mr-3 underline underline-offset-4 hover:text-foreground">
                        {source.label}
                      </a>
                    ))}
                    確認日 {project.verifiedAt}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-14 font-mono text-sm text-muted-foreground">
        <span className="text-brand">$</span> ハッカソンや過去の制作物は{" "}
        <Link href="/portfolio" className="text-syntax-keyword underline underline-offset-4">portfolio/</Link>
        {" "}にあります。
      </p>
    </div>
  );
}
