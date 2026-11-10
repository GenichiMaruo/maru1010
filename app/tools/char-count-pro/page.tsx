"use client";

import dynamic from "next/dynamic";

// 文書はブラウザ（localStorage）に保存しているので、サーバーでは描画しない
const ProWorkspace = dynamic(() => import("@/components/tools/pro/ProWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-background font-mono text-xs text-muted-foreground">
      loading char-count-pro…
    </div>
  ),
});

export default function CharCountProPage() {
  return <ProWorkspace />;
}
