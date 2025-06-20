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
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Home() {
  return (
    <div
      className="flex flex-col items-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('background.webp')` }}
    >
      <Card className="w-[90%] max-w-[700px] bg-white/80 my-10 hover:scale-1.05 transition-transform duration-300 ease-in-out mt-24 pt-6">
        {/* mt-20を追加して、ヘッダーの下にCardが表示されるようにマージンを設定 */}
        <CardContent className="flex flex-col md:flex-row items-center p-4">
          <div className="flex justify-center p-4 mb-4 md:mb-0 md:mx-6 max-w-xs">
            <Avatar className="w-32 h-32 border-4 border-blue-500">
              <AvatarImage src="/avatar.png" alt="Profile Picture" />
              <AvatarFallback>GM</AvatarFallback>
            </Avatar>
          </div>
          <div className="w-full">
            <div className="text-center md:text-left">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-800">
                  Genichi Maruo
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Web Developer | Creator
                </CardDescription>
              </CardHeader>
            </div>
            <div className="text-center md:text-left my-2 mx-6">
              <p className="text-blue-800 font-bold">
                所属: 大阪工業大学 / 情報科学研究科情報科学専攻 / M1
              </p>
            </div>
            <div className="text-center md:text-left my-2 mx-6">
              <p className="text-gray-700">
                カメラで認識した人物間の関係推定技術に関する研究を行っている大学院生。趣味でウェブ開発をしており、フロントエンド・バックエンド問わず学習中。
              </p>
            </div>
            <CardFooter className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <a
                  href="https://github.com/GenichiMaruo"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaGithub /> GitHub {/* アイコンとテキスト */}
                </a>
              </Button>
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <a
                  href="https://x.com/maru1010robo16"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaXTwitter /> X {/* アイコンとテキスト */}
                </a>
              </Button>
              <Button
                asChild
                variant="link"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <a
                  href="https://www.facebook.com/profile.php?id=100029838533241"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <FaFacebook /> Facebook {/* アイコンとテキスト */}
                </a>
              </Button>
            </CardFooter>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
