// components/Header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaHome } from "react-icons/fa";
import { FaFolder, FaToolbox } from "react-icons/fa6"; // アイコンをインポート

const Header = () => {
  return (
    <nav
      className="fixed top-4 left-1/2 transform -translate-x-1/2
                    bg-white/80 rounded-full px-4 py-2 shadow-lg
                    flex gap-5 justify-center z-50
                    backdrop-blur-md border border-gray-200/50"
    >
      <Button asChild variant="link">
        <Link
          href="/"
          className="hover:text-blue-500 transition-colors duration-200 flex items-center gap-1"
        >
          <FaHome />
          <span className="hidden sm:block">Home</span>
        </Link>
      </Button>
      <Button asChild variant="link">
        <Link
          href="/portfolio"
          className="hover:text-blue-500 transition-colors duration-200 flex items-center gap-1"
        >
          <FaFolder />
          <span className="hidden sm:block">Portfolio</span>
        </Link>
      </Button>
      <Button asChild variant="link">
        <Link
          href="/tools"
          className="hover:text-blue-500 transition-colors duration-200 flex items-center gap-1"
        >
          <FaToolbox />
          <span className="hidden sm:block">Tools</span>
        </Link>
      </Button>
    </nav>
  );
};

export default Header;
