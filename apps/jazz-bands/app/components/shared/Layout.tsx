import { Outlet } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { Band } from "~/lib/types";

interface LayoutProps {
  band: Band;
}

export function Layout({ band }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="skip-to-content absolute top-0 left-0 z-50 -translate-y-full bg-blue-600 text-white px-4 py-2 transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Header band={band} />
      <main id="main-content" className="flex-1">
        <Outlet context={{ band }} />
      </main>
      <Footer band={band} />
    </div>
  );
}
