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
import { generateGeometricPattern } from "@/utils/generatePattern";
import projects from "./projects.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { FaLink, FaGithub } from "react-icons/fa";

import TiptapRenderer from "@/components/TiptapRenderer";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  link?: string;
  github?: string;
  details?: string;
  duration?: string;
  award?: string;
}

export default function Portfolio() {
  const [patternSvg, setPatternSvg] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const patternOptions = {
      size: 300,
      colors: ["#f0f4f8", "#d9e2ec", "#bcccdc", "#9fb3c8"],
      complexity: Math.random(),
      contrast: Math.random(),
    };
    const svg = generateGeometricPattern(patternOptions);
    setPatternSvg(svg);
  }, []);

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(
      patternSvg
    )}')`,
    backgroundColor: "#f0f4f8",
    position: "relative", // backgroundStyle 自体には position: relative は必須ではないが、子要素の absolute の基準になる
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(138, 161, 230, 0.5)", // 青みがかった半透明のオーバーレイ
    zIndex: 1,
  };

  // contentStyle は main 要素のクラスに統合されたため削除

  return (
    <div className="min-h-screen flex flex-col" style={backgroundStyle}>
      <div style={overlayStyle}></div>

      <main className="flex-grow relative z-[2]">
        {/* メインコンテンツエリア */}
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

      {/* Footer */}
      <footer className="relative z-[2] w-full text-center p-4 sm:p-6 border-t border-gray-300/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm">
        <div className="container mx-auto">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            &copy; {new Date().getFullYear()} Genichi Maruo. All rights
            reserved.
            {/* "My Portfolio" の部分はご自身の名前やプロジェクト名に変更してください */}
          </p>
          <div className="flex justify-center items-center space-x-4 mt-3 sm:mt-4">
            <Link
              href="https://github.com/GenichiMaruo" // TODO: あなたのGitHubプロフィールURLに置き換えてください
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
        <DialogContent className="w-full max-w-5xl sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 p-6 sm:p-8 rounded-lg shadow-xl">
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

                {(selectedProject.link || selectedProject.github) && (
                  <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      関連リンク
                    </h3>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {selectedProject.link && (
                        <Button
                          asChild
                          variant="outline"
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
                        >
                          <Link
                            href={selectedProject.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <FaLink className="mr-2 h-4 w-4" /> Webサイト/デモ
                          </Link>
                        </Button>
                      )}
                      {selectedProject.github && (
                        <Button
                          asChild
                          variant="outline"
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
                        >
                          <Link
                            href={selectedProject.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <FaGithub className="mr-2 h-4 w-4" />
                            GitHubリポジトリ
                          </Link>
                        </Button>
                      )}
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
            <div className="flex flex-wrap gap-2 mb-4">
              {project.link && (
                <Button
                  asChild
                  variant="link"
                  className="p-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Link
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaLink className="mr-1" />
                    関連リンク
                  </Link>
                </Button>
              )}
              {project.github && (
                <Button
                  asChild
                  variant="link"
                  className="p-1 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <Link
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaGithub className="mr-1" />
                    GitHub
                  </Link>
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full dark:text-white dark:border-gray-600 dark:hover:bg-gray-700/50"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
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
