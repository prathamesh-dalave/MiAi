import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { History, Search, Trash2, ExternalLink, Calendar, MessageSquare, Image as ImageIcon, Music, Code } from "lucide-react";
import Link from "next/link";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import Navbar from "@/components/Navbar";

// Helper to get icon based on tool
function getToolIcon(toolId: string) {
  if (toolId.includes("chat") || toolId === "gemini" || toolId === "mistral") return <MessageSquare className="w-4 h-4" />;
  if (toolId.includes("img") || toolId === "flux" || toolId === "sdxl") return <ImageIcon className="w-4 h-4" />;
  if (toolId.includes("audio") || toolId.includes("tts") || toolId.includes("stt")) return <Music className="w-4 h-4" />;
  if (toolId.includes("code")) return <Code className="w-4 h-4" />;
  return <Search className="w-4 h-4" />;
}

export default async function HistoryPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: history = [] } = await supabase
    .from("user_prompts_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">
      <BackgroundBlobs />
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <History className="text-purple-500 w-8 h-8" />
              My History
            </h1>
            <p className="text-gray-400">Review and manage your past AI generations.</p>
          </div>
          
          <div className="flex items-center gap-3 p-1 rounded-2xl bg-white/5 border border-white/10">
            <div className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/20">
              {history?.length || 0} Saved Generations
            </div>
          </div>
        </div>

        {history && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item: any) => (
              <div 
                key={item.id} 
                className="tool-card group rounded-3xl p-6 border border-white/5 bg-white/[0.02] flex flex-col hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-xs font-semibold text-gray-400">
                    {getToolIcon(item.tool_id)}
                    {item.tool_id.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90 mb-2 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </h3>
                  
                  {item.response === "[Image Output Buffer]" ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/10 flex items-center gap-3">
                      <ImageIcon className="w-8 h-8 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-purple-300">Image Generated</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Use "Try Again" to regenerate</p>
                      </div>
                    </div>
                  ) : item.response === "[Audio Output Buffer]" ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/10 flex items-center gap-3">
                      <Music className="w-8 h-8 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-cyan-300">Audio Generated</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Use "Try Again" to regenerate</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-gray-400 bg-opacity-50 max-h-32 overflow-hidden relative">
                      <p className="leading-relaxed italic">
                        {item.response.length > 200 
                          ? item.response.substring(0, 200) + "..." 
                          : item.response}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                  <Link 
                    href={`/tool/${item.tool_id}`}
                    className="flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Try Again
                  </Link>
                  <button className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <History className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No history found</h2>
            <p className="text-gray-500 max-w-sm mb-8">
              You haven't generated anything yet or you were not logged in during your last session.
            </p>
            <Link 
              href="/" 
              className="btn-gradient px-8 py-3 rounded-xl font-bold text-white shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
              Start Creating
            </Link>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-12 border-t border-white/5 text-center mt-20">
        <p className="text-gray-600 text-xs tracking-widest uppercase">
          MiAi &copy; 2026
        </p>
      </footer>
    </div>
  );
}
