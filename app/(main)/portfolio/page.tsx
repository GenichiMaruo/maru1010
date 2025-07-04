"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import projects from "./projects.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { FaLink, FaGithub } from "react-icons/fa";
import { generatePattern } from "@/utils/generatePattern";

import TiptapRenderer from "@/components/TiptapRenderer";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string[];
  github?: string[];
  details?: string;
  duration?: string;
  award?: string;
}

export default function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [backgroundPattern, setBackgroundPattern] = useState<string>("");

  useEffect(() => {
    // ライト/ダークモードの状態を検出
    const isDark = document.documentElement.classList.contains("dark");
    const pattern = generatePattern(isDark ? "dark" : "light");
    const dataUrl = `data:image/svg+xml;base64,${btoa(pattern)}`;
    setBackgroundPattern(dataUrl);

    // ダークモード切り替えの監視
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains("dark");
      const newPattern = generatePattern(isDarkNow ? "dark" : "light");
      const newDataUrl = `data:image/svg+xml;base64,${btoa(newPattern)}`;
      setBackgroundPattern(newDataUrl);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col portfolio-background transition-colors duration-300 ease-in-out"
      style={{
        backgroundImage: backgroundPattern
          ? `url(${backgroundPattern})`
          : undefined,
      }}
    >
      <main className="flex-grow relative z-[2]">
        <div className="container mx-auto p-4 pt-24 pb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 pb-3 bg-clip-text text-transparent leading-tight bg-gradient-to-r from-pink-500 via-purple-600 to-violet-500 hover:tracking-wide transition-all duration-300 ease-in-out [text-shadow:0_0_8px_rgba(236,72,153,0.3),_0_0_15px_rgba(139,92,246,0.2)]">
            My Portfolio
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={index}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </div>
      </main>
      <footer className="relative z-[2] w-full text-center p-4 sm:p-6 border-t border-gray-300/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm">
        <div className="container mx-auto">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            &copy; {new Date().getFullYear()} Genichi Maruo. All rights
            reserved.
          </p>
          <div className="flex justify-center items-center space-x-4 mt-3 sm:mt-4">
            <Link
              href="https://github.com/GenichiMaruo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
            >
              <FaGithub className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </div>
        </div>
      </footer>

      <Dialog
        open={!!selectedProject}
        onOpenChange={() => setSelectedProject(null)}
      >
        <DialogContent className="w-full max-w-5xl sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          {selectedProject && (
            <div>
              <DialogHeader className="mb-6 border-b dark:border-gray-700 pb-4">
                <DialogTitle className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {selectedProject.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 text-gray-700 dark:text-gray-300">
                {selectedProject.imageUrl && (
                  <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg mb-6 border dark:border-gray-700">
                    <Image
                      src={selectedProject.imageUrl}
                      alt={selectedProject.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {(selectedProject.duration || selectedProject.award) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                    {selectedProject.duration && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">
                          期間
                        </h3>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedProject.duration}
                        </p>
                      </div>
                    )}
                    {selectedProject.award && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">
                          受賞歴
                        </h3>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedProject.award}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedProject.details && (
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      プロジェクト概要
                    </h3>
                    <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                      <TiptapRenderer
                        markdownContent={selectedProject.details}
                      />
                    </div>
                  </div>
                )}

                {(selectedProject.link ||
                  (selectedProject.github &&
                    selectedProject.github.length > 0)) && (
                  <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      関連リンク
                    </h3>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {selectedProject.link &&
                        Array.isArray(selectedProject.link) &&
                        selectedProject.link.map((url, idx) => (
                          <Button
                            asChild
                            variant="outline"
                            key={idx}
                            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
                          >
                            <Link
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <FaLink className="mr-2 h-4 w-4" />
                              Webサイト/デモ
                              {selectedProject.link &&
                              selectedProject.link.length > 1
                                ? ` ${idx + 1}`
                                : ""}
                            </Link>
                          </Button>
                        ))}
                      {selectedProject.github &&
                        selectedProject.github.map((repoUrl, index) => (
                          <Button
                            asChild
                            variant="outline"
                            key={index}
                            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
                          >
                            <Link
                              href={repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <FaGithub className="mr-2 h-4 w-4" />
                              GitHubリポジトリ{" "}
                              {selectedProject.github &&
                              selectedProject.github.length > 1
                                ? index + 1
                                : ""}
                            </Link>
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogClose asChild className="mt-8">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  閉じる
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden py-0"
      onClick={onClick}
    >
      {project.imageUrl && (
        <div className="relative h-56 sm:h-64 w-full">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader className="px-5">
        <CardTitle className="text-primary text-xl font-semibold dark:text-white">
          {project.title}
        </CardTitle>
        {project.duration && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            期間: {project.duration}
          </p>
        )}
        <CardDescription className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 flex flex-col flex-grow">
        <div className="mt-auto">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-400">
              使用した技術:
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.4)] hover:scale-105 cursor-pointer px-2 py-1"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t dark:border-gray-700/50">
            {/* リンク表示エリアの修正 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              {/* Webサイト/デモ リンク */}
              {project.link && project.link.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    variant="link"
                    className="p-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Link
                      href={project.link[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaLink className="mr-1" />
                      {project.link.length > 1 ? "関連リンク 1" : "関連リンク"}
                    </Link>
                  </Button>
                  {project.link.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          他{project.link.length - 1}件{" "}
                          {/* もしくは <BsThreeDots /> のようなアイコン */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        onClick={(e) => e.stopPropagation()}
                        className="dark:bg-gray-800"
                      >
                        {project.link.slice(1).map((url, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            asChild
                            className="cursor-pointer dark:hover:bg-gray-700"
                          >
                            <Link
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center w-full"
                            >
                              <FaLink className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                              関連リンク {idx + 2}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              {/* GitHub リポジトリ リンク */}
              {project.github && project.github.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    variant="link"
                    className="p-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <Link
                      href={project.github[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaGithub className="mr-1" />
                      {project.github.length > 1 ? "GitHub 1" : "GitHub"}
                    </Link>
                  </Button>
                  {project.github.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          他{project.github.length - 1}件{" "}
                          {/* もしくは <BsThreeDots /> のようなアイコン */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        onClick={(e) => e.stopPropagation()}
                        className="dark:bg-gray-800"
                      >
                        {project.github.slice(1).map((repoUrl, index) => (
                          <DropdownMenuItem
                            key={index}
                            asChild
                            className="cursor-pointer dark:hover:bg-gray-700"
                          >
                            <Link
                              href={repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center w-full"
                            >
                              <FaGithub className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" />
                              GitHub {index + 2}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
              onClick={(e) => {
                e.stopPropagation();
                onClick(); // 詳細を見るボタンの既存の onClick
              }}
            >
              詳細を見る
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
