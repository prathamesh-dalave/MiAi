import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 flex flex-col items-center py-10 border-t border-white/5">
      <Sparkles className="footer-icon w-8 h-8 mb-3" />
      <p className="text-sm text-gray-500">© 2026 MiAi.</p>
    </footer>
  );
}
