// components/Header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaHome } from "react-icons/fa";
import { FaFolder, FaToolbox } from "react-icons/fa6"; 
import { ModeToggle } from "@/components/mode-toggle";

const Header = () => {
  return (
    <nav
      className="fixed top-4 left-1/2 transform -translate-x-1/2
                    bg-white/80 dark:bg-gray-900/80 rounded-full px-4 py-2 shadow-lg
                    flex gap-3 justify-center items-center z-50
                    backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
    >
      <Button asChild variant="link" className="p-2">
        <Link
          href="/"
          className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1
                     text-gray-700 dark:text-gray-200"
        >
          <FaHome />
          <span className="hidden sm:block">Home</span>
        </Link>
      </Button>
      <Button asChild variant="link" className="p-2">
        <Link
          href="/portfolio"
          className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1
                     text-gray-700 dark:text-gray-200"
        >
          <FaFolder />
          <span className="hidden sm:block">Portfolio</span>
        </Link>
      </Button>
      <Button asChild variant="link" className="p-2">
        <Link
          href="/tools"
          className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1
                     text-gray-700 dark:text-gray-200"
        >
          <FaToolbox />
          <span className="hidden sm:block">Tools</span>
        </Link>
      </Button>
      <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-1" />
      <ModeToggle />
    </nav>
  );
};

export default Header;
