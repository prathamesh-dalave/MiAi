"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, History, User, LogOut, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Initial check
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-sm bg-black/5 border-b border-white/5">
      <Link href="/" className="flex items-center gap-3 group">
        <Sparkles className="logo-icon w-7 h-7 group-hover:scale-110 transition-transform" />
        <span className="text-2xl font-bold tracking-tight text-white">
          MiAi
        </span>
      </Link>

      <div className="flex items-center gap-4 md:gap-6">
        {user ? (
          <>
            <Link 
              href="/history" 
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">My History</span>
            </Link>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Signed in as</span>
                <span className="text-xs font-medium text-purple-300 max-w-[120px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-all text-gray-400 border border-white/5"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <Link 
            href="/auth" 
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
