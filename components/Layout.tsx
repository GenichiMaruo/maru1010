// components/Layout.tsx
import Header from "./Header";
import { PatternBackground } from "./PatternBackground";

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  return (
    <>
      {/* サブページ共通の模様。トップページは動くライフゲームで覆う */}
      <PatternBackground />
      {showHeader && <Header />}
      <main>{children}</main>
    </>
  );
};

export default Layout;
