// components/Layout.tsx
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  return (
    <>
      {showHeader && <Header />}
      <main>{children}</main>
    </>
  );
};

export default Layout;
