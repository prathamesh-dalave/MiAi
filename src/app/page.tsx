"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBlobs from "@/components/BackgroundBlobs";

export default function Home() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: catData } = await supabase.from("categories").select("*");
      const { data: toolData } = await supabase.from("tools").select("*");
      if (catData) setCategories(catData);
      if (toolData) setTools(toolData);
    }
    loadData();
  }, []);

  const searchResults = query.trim() !== "" 
    ? tools.filter(t => {
        const q = query.toLowerCase();
        let matchStr = `${t.name} ${t.description} ${t.category}`.toLowerCase();
        if (t.category === "presentations") matchStr += " ppt powerpoint presentation slides format";
        if (t.category === "content-writing") matchStr += " writer blog text summarize wording document essay paragraph";
        if (t.category === "code-generation") matchStr += " code program debug syntax developer";
        if (t.category === "image-generation") matchStr += " image picture photo graphic draw visual";
        if (t.category === "chatbots") matchStr += " chat bot assistant answer ask questions";
        return matchStr.includes(q);
      })
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundBlobs />
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-8 md:pt-24 md:pb-12">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-center gradient-text leading-tight">
          Explore. Compare. Execute.
        </h1>
        <p className="mt-4 text-base md:text-lg text-gray-400 text-center max-w-xl">
          Discover and test AI tools instantly. No login required.
        </p>

        {/* Search Bar */}
        <div className="search-bar mt-10 flex items-center w-full max-w-2xl rounded-full px-6 py-3">
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: 'Create a PPT', 'Explain code', 'Summarize text'..."
            className="flex-1 bg-transparent text-sm md:text-base text-white placeholder-gray-500 outline-none"
          />
          <button
            id="search-btn"
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white cursor-pointer ml-3 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </section>

      {/* ── Search Results ── */}
      {query.trim() !== "" && (
        <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-8 pb-4">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            Search Results for &quot;{query}&quot;
          </h3>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="tool-card rounded-2xl p-6 flex flex-col justify-between min-h-[200px]"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{tool.name}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-3">{tool.description}</p>
                  </div>
                  <span className="btn-try-now mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-medium text-gray-300">
                    Try Now <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">No tools found matching your search. Try different keywords.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Available Tools Section ── */}
      <section className={`relative z-10 px-6 md:px-12 lg:px-20 pb-20 ${query.trim() !== "" ? "pt-12 border-t border-white/5 mt-8" : "pt-16"}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
          Available Tools
        </h2>

        {/* Category Cards Grid */}
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              id={`cat-${cat.id}`}
              className="tool-card rounded-2xl p-6 flex flex-col justify-between min-h-[200px] w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <div>
                <span className="text-3xl mb-3 block">{cat.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <span className="btn-try-now mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-medium text-gray-300">
                Try Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
