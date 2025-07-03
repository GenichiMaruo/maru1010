"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FaGithub,
  FaExternalLinkAlt,
  FaPlay,
  FaBook,
  FaCode,
  FaGamepad,
  FaMicrochip,
} from "react-icons/fa";
import { PICO88Icon } from "@/components/PICO88Icon";

export default function PICO88ClientPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const features = [
    {
      icon: <FaMicrochip className="w-6 h-6" />,
      title: "8ビットアーキテクチャ",
      description: "シンプルな8ビットCPU設計で、コンピュータの基本原理を学習",
    },
    {
      icon: <FaCode className="w-6 h-6" />,
      title: "アセンブリ言語",
      description: "低レベルプログラミングとハードウェア制御の基礎を習得",
    },
    {
      icon: <FaGamepad className="w-6 h-6" />,
      title: "ゲーム開発",
      description: "制約の中での創造性を発揮し、レトロなゲームを作成",
    },
    {
      icon: <FaBook className="w-6 h-6" />,
      title: "教育リソース",
      description: "ドキュメントとサンプルコードで学習をサポート",
    },
  ];

  const demoCode = `; PICO-88 アセンブリ言語サンプル
; 画面に緑の横棒を描画するプログラム

MOV R2, #8      ; Y座標は8で固定
MOV R3, #11     ; 色は11(緑)で固定
MOV R1, #0      ; X座標を0からスタート

LOOP_START:
    PLOT            ; (X, 8)に緑の点を描く

    INC R1          ; X座標(R1)を1増やす
    CMP R1, #16     ; R1が16になったか？
    JNZ LOOP_START  ; Zフラグが0なら(16でなければ)LOOP_STARTへ飛べ！

HLT             ; プログラム終了`;

  const tabs = [
    { id: "overview", label: "概要", icon: <FaBook className="w-4 h-4" /> },
    { id: "demo", label: "デモ", icon: <FaPlay className="w-4 h-4" /> },
    {
      id: "code",
      label: "サンプルコード",
      icon: <FaCode className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="grid-pattern"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-48 pb-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <PICO88Icon className="w-12 h-12" fill="white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PICO-88
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              ブラウザで体験できる教育・ホビー用途の8ビット仮想コンピュータ。アセンブリ言語プログラミングとレトロコンピューティングを学ぼう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Link
                  href="https://pico88.maru1010.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaPlay className="mr-2" />
                  オンラインで試す
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link
                  href="https://github.com/MaruoGenIchi/PICO-88"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="mr-2" />
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              特徴
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4 text-purple-600 dark:text-purple-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center mb-8 gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <Card>
                <CardHeader>
                  <CardTitle>PICO-88について</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    PICO-88は、教育とホビー目的で設計された8ビット仮想コンピュータです。
                    1980年代のホームコンピュータにインスパイアされ、シンプルながらも完全な
                    コンピュータシステムをブラウザ上で再現しています。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                        技術仕様
                      </h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• 8ビットCPU</li>
                        <li>• 256バイトメモリ</li>
                        <li>• 32x32ピクセルディスプレイ</li>
                        <li>• 16色パレット</li>
                        <li>• キーボード入力</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                        学習内容
                      </h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• コンピュータアーキテクチャ</li>
                        <li>• アセンブリ言語</li>
                        <li>• メモリ管理</li>
                        <li>• I/O制御</li>
                        <li>• ゲーム開発</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "demo" && (
              <Card>
                <CardHeader>
                  <CardTitle>ライブデモ</CardTitle>
                  <CardDescription>
                    実際のPICO-88エミュレータを体験してみましょう
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <FaGamepad className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        PICO-88エミュレータはこちらで体験できます
                      </p>
                      <Button asChild>
                        <Link
                          href="https://pico88.maru1010.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaExternalLinkAlt className="mr-2" />
                          デモを開く
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">1. エディタ</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        アセンブリコードを入力
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">2. アセンブル</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        機械語に変換
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">3. 実行</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        結果を画面で確認
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "code" && (
              <Card>
                <CardHeader>
                  <CardTitle>サンプルコード</CardTitle>
                  <CardDescription>
                    PICO-88アセンブリ言語の基本的な例
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-800 dark:text-gray-200">
                      {demoCode}
                    </code>
                  </pre>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                      コードの説明
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>
                        • <code>MOV R2, #8</code>: Y座標を8に設定
                      </li>
                      <li>
                        • <code>MOV R3, #11</code>: 描画色を11(緑)に設定
                      </li>
                      <li>
                        • <code>PLOT</code>: 指定座標に点を描画
                      </li>
                      <li>
                        • <code>INC R1</code>: X座標を1増加
                      </li>
                      <li>
                        • <code>CMP</code>, <code>JNZ</code>:
                        条件分岐でループ制御
                      </li>
                      <li>
                        • <code>HLT</code>: プログラムを停止
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
              技術スタック
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "React",
                "TypeScript",
                "Next.js",
                "Tailwind CSS",
                "Zustand",
                "Cloudflare Pages",
                "GitHub Actions",
              ].map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-sm py-1 px-3"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              今すぐ始めよう
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              PICO-88で8ビットコンピュータの世界を探検し、アセンブリ言語プログラミングを学びましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Link
                  href="https://pico88.maru1010.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaPlay className="mr-2" />
                  今すぐ試す
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link
                  href="https://github.com/MaruoGenIchi/PICO-88"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="mr-2" />
                  ソースコード
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
