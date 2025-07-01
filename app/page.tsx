// app/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaFacebook, FaGithub, FaPlay, FaMicrochip } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex flex-col items-center min-h-screen bg-cover bg-center bg-no-repeat bg-gray-50 dark:bg-gray-900"
      style={{ backgroundImage: `url('background.webp')` }}
    >
      <Card className="w-[90%] max-w-[700px] bg-white/90 dark:bg-gray-900/90 my-10 hover:scale-105 transition-transform duration-300 ease-in-out mt-24 pt-6 border border-gray-200 dark:border-gray-700">
        <CardContent className="flex flex-col md:flex-row items-center p-4">
          <div className="flex justify-center p-4 mb-4 md:mb-0 md:mx-6 max-w-xs">
            <Avatar className="w-32 h-32 border-4 border-blue-500 dark:border-blue-400">
              <AvatarImage src="/avatar.png" alt="Profile Picture" />
              <AvatarFallback>GM</AvatarFallback>
            </Avatar>
          </div>
          <div className="w-full">
            <div className="text-center md:text-left">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-800 dark:text-blue-300">
                  Genichi Maruo
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Web Developer | Creator
                </CardDescription>
              </CardHeader>
            </div>
            <div className="text-center md:text-left my-2 mx-6">
              <p className="text-blue-800 dark:text-blue-300 font-bold">
                所属: 大阪工業大学 / 情報科学研究科情報科学専攻 / M1
              </p>
            </div>
            <div className="text-center md:text-left my-2 mx-6">
              <p className="text-gray-700 dark:text-gray-300">
                カメラで認識した人物間の関係推定技術に関する研究を行っている大学院生。趣味でウェブ開発をしており、フロントエンド・バックエンド問わず学習中。
              </p>
            </div>
            <CardFooter className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <a
                  href="https://github.com/GenichiMaruo"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaGithub /> GitHub
                </a>
              </Button>
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <a
                  href="https://x.com/maru1010robo16"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaXTwitter /> X
                </a>
              </Button>
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <a
                  href="https://www.facebook.com/profile.php?id=100029838533241"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaFacebook /> Facebook
                </a>
              </Button>
            </CardFooter>
          </div>
        </CardContent>
      </Card>

      {/* PICO-88 CTA Section */}
      <Card className="w-[90%] max-w-[700px] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/70 dark:to-purple-900/70 my-6 hover:scale-105 transition-transform duration-300 ease-in-out border border-blue-200 dark:border-blue-700">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 text-white rounded-full">
              <FaMicrochip className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-3 text-blue-800 dark:text-blue-200">
            🎮 PICO-88 シミュレータ
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-200 mb-4 text-base">
            ブラウザで体験できる8ビットコンピュータ！
            <br />
            アセンブリ言語プログラミングとレトロコンピューティングを学ぼう
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/pico88" className="flex items-center">
                <FaPlay className="mr-2" />
                詳細を見る
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-300 dark:text-blue-300 dark:hover:bg-blue-900/40">
              <a href="https://pico88.maru1010.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <FaMicrochip className="mr-2" />
                今すぐ体験
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
