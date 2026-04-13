import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-5">
      <Link href="/" className="flex items-center gap-2 group">
        <Sparkles className="logo-icon w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="text-xl font-bold tracking-tight text-white">
          MiAi
        </span>
      </Link>
    </nav>
  );
}
