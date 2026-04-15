"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BackgroundBlobs from "@/components/BackgroundBlobs";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for the confirmation link!" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <BackgroundBlobs />

      {/* Back to Home */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="tool-card rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <Sparkles className="logo-icon w-10 h-10 mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-400 text-center text-sm">
              {isLogin 
                ? "Sign in to access your AI generation history." 
                : "Join MiAi to start saving your creative journey."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm border ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-xs text-gray-500 uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3.5 font-medium text-gray-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
