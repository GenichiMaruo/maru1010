"use client";

import { useState } from "react";
import Image from "next/image";
import { FaLink, FaGithub } from "react-icons/fa";
import { projects, type Project } from "@/lib/projects";
import { ProjectArtwork } from "@/components/ProjectArtwork";
import { PageHeader } from "@/components/PageHeader";
import { TechTags } from "@/components/TechTags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TiptapRenderer from "@/components/TiptapRenderer";

const linkButton =
  "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 font-mono text-xs text-foreground transition-colors hover:border-foreground/40";

export default function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <PageHeader
        command="git log --all -- ./portfolio"
        title="これまでの制作物"
        lead="Web アプリ、学習用シミュレータ、Minecraft MOD、ハッカソンの制作記録。"
      />

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id ?? index}
            project={project}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto p-6 sm:max-w-2xl sm:p-10">
          {selectedProject && (
            <div>
              <DialogHeader className="text-left">
                {selectedProject.category && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {selectedProject.category}
                    {selectedProject.status && <span className="ml-2 text-brand">{selectedProject.status}</span>}
                  </p>
                )}
                <DialogTitle className="font-mono text-3xl font-semibold tracking-tight">
                  {selectedProject.title}
                </DialogTitle>
                <DialogDescription className="pt-1 text-base leading-relaxed">
                  {selectedProject.description}
                </DialogDescription>
              </DialogHeader>

              {selectedProject.imageUrl && (
                <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <Image src={selectedProject.imageUrl} alt={selectedProject.title} fill className="object-cover" />
                </div>
              )}

              {(selectedProject.duration || selectedProject.award) && (
                <dl className="mt-8 grid grid-cols-1 gap-6 border-y border-border py-5 sm:grid-cols-2">
                  {selectedProject.duration && (
                    <div>
                      <dt className="text-xs text-muted-foreground">期間</dt>
                      <dd className="mt-1 text-foreground">{selectedProject.duration}</dd>
                    </div>
                  )}
                  {selectedProject.award && (
                    <div>
                      <dt className="text-xs text-muted-foreground">受賞歴</dt>
                      <dd className="mt-1 text-foreground">{selectedProject.award}</dd>
                    </div>
                  )}
                </dl>
              )}

              {selectedProject.details && (
                <div className="prose prose-sm mt-8 max-w-none prose-a:text-syntax-type sm:prose-base dark:prose-invert">
                  <TiptapRenderer key={selectedProject.title} markdownContent={selectedProject.details} />
                </div>
              )}

              <div className="mt-8">
                <TechTags technologies={selectedProject.technologies} />
              </div>

              {(selectedProject.link?.length || selectedProject.github?.length) ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {selectedProject.link?.map((url, idx) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={linkButton}>
                      <FaLink className="h-3.5 w-3.5" />
                      Webサイト/デモ{selectedProject.link!.length > 1 ? ` ${idx + 1}` : ""}
                    </a>
                  ))}
                  {selectedProject.github?.map((url, idx) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={linkButton}>
                      <FaGithub className="h-3.5 w-3.5" />
                      GitHub{selectedProject.github!.length > 1 ? ` ${idx + 1}` : ""}
                    </a>
                  ))}
                </div>
              ) : null}

              {selectedProject.sources && (
                <p className="mt-6 font-mono text-[11px] leading-relaxed text-syntax-comment">
                  {"// "}
                  {selectedProject.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="mr-3 underline underline-offset-4 hover:text-foreground">
                      {source.label}
                    </a>
                  ))}
                  確認日：{selectedProject.verifiedAt}
                  {selectedProject.repositoryCreatedAt && ` · リポジトリ作成：${selectedProject.repositoryCreatedAt}`}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="overflow-hidden border-b border-border">
        {project.imageUrl ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={project.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <ProjectArtwork id={project.id} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
      <p className="font-mono text-[11px] text-muted-foreground">
        {[project.category, project.duration].filter(Boolean).join(" · ")}
      </p>
      <h2 className="mt-1.5 font-mono text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-syntax-type">
        {project.title}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>
      {project.award && (
        <p className="mt-3 font-mono text-[11px] text-syntax-number">★ {project.award}</p>
      )}
      </div>
    </button>
  );
}
