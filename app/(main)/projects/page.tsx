import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FaMicrochip,
  FaPencilAlt,
  FaGithub,
  FaPlay,
  FaChartBar,
  FaKeyboard,
  FaCode,
  FaCogs,
  FaRocket,
  FaDesktop,
  FaFileCode,
  FaMarkdown,
} from "react-icons/fa";

export default function ProjectsPage() {
  const projects = [
    {
      id: "pico88",
      title: "PICO-88 シミュレータ",
      subtitle: "8ビットコンピュータシミュレータ",
      description:
        "ブラウザで動作する本格的な8ビットコンピュータシミュレータ。アセンブリ言語でプログラミングを学べます。",
      longDescription:
        "PICO-88は、教育目的で開発された8ビットコンピュータのシミュレータです。実際のCPUアーキテクチャを忠実に再現し、アセンブリ言語プログラミングの基礎から応用まで学習できます。レジスタ、メモリ、I/Oの概念を視覚的に理解できる設計になっています。",
      icon: FaMicrochip,
      gradient: "from-blue-500 to-purple-600",
      bgGradient:
        "from-blue-50 to-purple-50 dark:from-blue-900/70 dark:to-purple-900/70",
      borderColor: "border-blue-200 dark:border-blue-700",
      technologies: [
        {
          name: "TypeScript",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        },
        {
          name: "React",
          color:
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
        },
        {
          name: "Next.js",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        },
        {
          name: "Assembly",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        },
        {
          name: "CPU Simulation",
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        },
      ],
      features: [
        { icon: FaDesktop, text: "リアルタイムCPU状態表示" },
        { icon: FaCode, text: "アセンブリコードエディタ" },
        { icon: FaCogs, text: "ステップ実行とデバッグ" },
        { icon: FaFileCode, text: "豊富なサンプルプログラム" },
      ],
      links: [
        {
          type: "demo",
          url: "https://pico88.maru1010.com",
          text: "デモを試す",
          external: true,
        },
        {
          type: "detail",
          url: "/pico88",
          text: "詳細ページ",
          external: false,
        },
      ],
      github: ["https://github.com/GenichiMaruo/pico-88"],
    },
    {
      id: "char-count-pro",
      title: "CHAR COUNT PRO",
      subtitle: "高機能マークダウンエディタ",
      description:
        "リアルタイム文字数カウント、diff表示、タスク管理機能を備えた次世代テキストエディタです。",
      longDescription:
        "CHAR COUNT PROは、ライターや開発者のために設計された高機能なマークダウンエディタです。リアルタイムでの文字数・単語数カウント、変更差分の視覚化、タスクリスト管理など、テキスト作業を効率化する機能を豊富に搭載しています。",
      icon: FaPencilAlt,
      gradient: "from-green-500 to-blue-500",
      bgGradient:
        "from-green-50 to-blue-50 dark:from-green-900/70 dark:to-blue-900/70",
      borderColor: "border-green-200 dark:border-green-700",
      technologies: [
        {
          name: "TypeScript",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        },
        {
          name: "React",
          color:
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
        },
        {
          name: "Tiptap",
          color:
            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        },
        {
          name: "Tailwind CSS",
          color:
            "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
        },
        {
          name: "shadcn/ui",
          color:
            "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
        },
      ],
      features: [
        { icon: FaChartBar, text: "リアルタイム統計表示" },
        { icon: FaMarkdown, text: "リッチマークダウン対応" },
        { icon: FaKeyboard, text: "豊富なキーボードショートカット" },
        { icon: FaRocket, text: "高速・軽量動作" },
      ],
      links: [
        {
          type: "demo",
          url: "/tools/char-count-pro",
          text: "今すぐ使う",
          external: false,
        },
        {
          type: "detail",
          url: "/tools",
          text: "ツール一覧",
          external: false,
        },
      ],
      github: ["https://github.com/GenichiMaruo/maru1010"],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダーセクション */}
        <div className="text-center mb-12 mt-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            プロジェクト紹介
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            技術への情熱から生まれた、実用的で教育的なWebアプリケーション。
            <br />
            ここでは「なぜ作ったか」「どんな技術を使ったか」「どこにこだわったか」など、開発者視点のストーリーも交えて紹介します。
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              TypeScript
            </Badge>
            <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
              React
            </Badge>
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Next.js
            </Badge>
            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
              Tailwind CSS
            </Badge>
            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              shadcn/ui
            </Badge>
          </div>
        </div>

        {/* プロジェクト一覧 */}
        <div className="space-y-16">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`overflow-hidden ${project.borderColor} hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]`}
            >
              <div className={`bg-gradient-to-r ${project.bgGradient}`}>
                <CardContent className="p-8">
                  <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* 左側：プロジェクト情報 */}
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-4 bg-gradient-to-r ${project.gradient} text-white rounded-xl shadow-lg`}
                        >
                          <project.icon className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            {project.title}
                          </h2>
                          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                            {project.subtitle}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                          {project.longDescription}
                        </p>
                        {/* 開発背景・こだわり */}
                        {project.id === "pico88" && (
                          <>
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mt-4 mb-1">
                              開発背景・こだわり
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                「CPUの仕組みを体感的に学べる教材がほしい」という思いから開発。
                              </li>
                              <li>
                                UI/UXは「レトロ感」と「直感的操作」を両立。
                              </li>
                              <li>
                                アセンブリの実行ステップやレジスタ変化をリアルタイムで可視化。
                              </li>
                            </ul>
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mt-4 mb-1">
                              技術選定理由
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                TypeScript＋Reactで「状態管理」と「UI描画」を柔軟に実装。
                              </li>
                              <li>
                                Next.jsでSSR/SSG対応し、学習教材としても高速表示。
                              </li>
                            </ul>
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mt-4 mb-1">
                              今後の展望
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                より多くのCPU命令セットやI/Oデバイスの追加。
                              </li>
                              <li>ユーザー投稿型のサンプルプログラム集。</li>
                            </ul>
                          </>
                        )}
                        {project.id === "char-count-pro" && (
                          <>
                            <h4 className="font-semibold text-green-700 dark:text-green-300 mt-4 mb-1">
                              開発背景・こだわり
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                「文章執筆やコーディングをもっと快適にしたい」という思いから開発。
                              </li>
                              <li>
                                リアルタイムでの文字数・差分・タスク管理を一画面で実現。
                              </li>
                              <li>
                                エディタ部分はTiptap＋TailwindでカスタムUIを徹底追求。
                              </li>
                            </ul>
                            <h4 className="font-semibold text-green-700 dark:text-green-300 mt-4 mb-1">
                              技術選定理由
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                Tiptapで「拡張性」と「リッチな編集体験」を両立。
                              </li>
                              <li>
                                shadcn/uiでモダンなダイアログやボタンを実装。
                              </li>
                            </ul>
                            <h4 className="font-semibold text-green-700 dark:text-green-300 mt-4 mb-1">
                              今後の展望
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                              <li>
                                LaTeX・PDFエクスポートやAI校正支援の追加。
                              </li>
                              <li>
                                カスタムショートカットやテーマ切替の強化。
                              </li>
                            </ul>
                          </>
                        )}
                      </div>

                      {/* 技術スタック */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          使用技術
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <Badge
                              key={techIndex}
                              className={`${tech.color} border-0 px-3 py-1`}
                            >
                              {tech.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-wrap gap-3 pt-4">
                        {project.links.map((link, linkIndex) => (
                          <Button
                            key={linkIndex}
                            asChild
                            className={
                              link.type === "demo"
                                ? `bg-gradient-to-r ${project.gradient} hover:shadow-lg text-white border-0`
                                : "variant-outline"
                            }
                          >
                            {link.external ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <FaPlay className="h-4 w-4" />
                                {link.text}
                              </a>
                            ) : (
                              <Link
                                href={link.url}
                                className="flex items-center gap-2"
                              >
                                <FaPlay className="h-4 w-4" />
                                {link.text}
                              </Link>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* 右側：機能一覧 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        主な機能
                      </h3>
                      <div className="grid gap-3">
                        {project.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                          >
                            <feature.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* GitHubリンク */}
                      {project.github && project.github.length > 0 ? (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full pt-4"
                        >
                          <a
                            href={project.github[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <FaGithub className="h-4 w-4 mr-2" />
                            ソースコード
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full pt-4"
                          disabled
                        >
                          <FaGithub className="h-4 w-4 mr-2" />
                          ソースコード（準備中）
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* フッターCTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            他のプロジェクトも見てみませんか？
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            ポートフォリオページで更多くのプロジェクトをご覧いただけます
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Link href="/portfolio">ポートフォリオを見る</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
