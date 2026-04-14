"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Copy, Check, Sparkles, Upload, Mic, Download, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { notFound } from "next/navigation";
// Real API integration handled via /api/generate

interface ToolPageProps {
  params: Promise<{ id: string }>;
}

export default function ToolPage({ params }: ToolPageProps) {
  const { id } = use(params);

  const [tool, setTool] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadTool() {
      const { data: toolData } = await supabase.from("tools").select("*").eq("id", id).single();
      if (!toolData) {
        notFound();
        return;
      }
      setTool(toolData);
      
      const { data: catData } = await supabase.from("categories").select("*").eq("id", toolData.category).single();
      setCategory(catData);
      setIsFetching(false);
    }
    loadTool();
  }, [id]);

  const isSTT = tool?.id === "whisper-stt";
  const isTTSTool = tool?.id === "deepgram-tts";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum 10MB allowed.");
        return;
      }
      setAudioFile(file);
      toast.success(`File loaded: ${file.name}`);
    }
  };

  const handleSubmit = async () => {
    if (isSTT && !audioFile) {
      toast.error("Please upload an audio file first.");
      return;
    }
    if (!isSTT && !prompt.trim()) return;

    setIsLoading(true);
    setOutput("");

    try {
      let res: Response;

      if (isSTT && audioFile) {
        // Whisper STT: Send as multipart form data
        const formData = new FormData();
        formData.append("audio", audioFile);
        formData.append("toolId", tool.id);
        formData.append("category", tool.category);
        formData.append("prompt", "Transcribe this audio");

        res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });
      } else {
        // Standard JSON request
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt,
            toolId: tool.id,
            category: tool.category,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Generation failed.");
        return;
      }

      setOutput(data.response);
      toast.success("Generation complete!");
    } catch (error) {
      toast.error("Failed to connect to the generation server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isFetching || !tool) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
          <p className="text-gray-400">Loading tool environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundBlobs />
      <Navbar />

      <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-10 pb-20">
        {/* Breadcrumb */}
        <Link
          href={`/category/${tool.category}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {category?.name ?? "Category"}
        </Link>

        {/* Tool Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white">
              {tool.name}
            </h1>
          </div>
          <p className="text-base text-gray-400">{tool.description}</p>
        </div>

        {/* Emulator Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input Panel */}
          <div className="tool-card rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <Sparkles className="absolute inset-0 m-auto w-24 h-24 text-cyan-400 opacity-[0.03] pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Input
              </h2>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            
            {isSTT ? (
              /* ── Audio File Upload for Whisper STT ── */
              <div className="relative z-10 flex-1 min-h-[250px] flex flex-col items-center justify-center gap-4 bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-6 hover:border-purple-500/40 transition-colors">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-300 font-medium">Upload an audio file to transcribe</p>
                  <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A — Max 10MB</p>
                </div>
                {audioFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2">
                      <Mic className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">{audioFile.name}</span>
                      <button 
                        onClick={() => setAudioFile(null)}
                        className="ml-2 p-0.5 hover:bg-purple-500/20 rounded-full transition-colors group"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setAudioFile(null)}
                      className="text-xs text-gray-500 hover:text-purple-400 underline underline-offset-4 transition-colors"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer bg-white/5 border border-white/10 hover:border-purple-500/40 text-sm text-gray-300 px-6 py-2 rounded-full transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose File
                    <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            ) : (
              /* ── Standard Text Input ── */
              <textarea
                id="tool-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  tool.category === "image-generation"
                    ? "Describe the image you want to generate..."
                    : tool.category === "code-generation"
                    ? "Describe what code you need or paste code to explain..."
                    : isTTSTool
                    ? "Type the text you want to convert to speech..."
                    : "Type your message or prompt here..."
                }
                className="relative z-10 flex-1 min-h-[250px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 outline-none resize-none focus:border-purple-500/40 transition-colors"
              />
            )}



            {tool.category === "code-generation" && (
              <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-white/5 px-2 py-1 rounded border border-white/10">TypeScript</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/10">Python</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/10">React</span>
                <span>Supported</span>
              </div>
            )}

            {isTTSTool && (
              <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-white/5 px-2 py-1 rounded border border-white/10">🔊 Neural Voice</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/10">MP3 Output</span>
                <span>Auto-Download</span>
              </div>
            )}

            <button
              id="tool-submit"
              onClick={handleSubmit}
              disabled={isLoading || (isSTT ? !audioFile : !prompt.trim())}
              className="relative z-10 btn-gradient mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isSTT ? "Transcribing..." : isTTSTool ? "Synthesizing..." : "Generating..."}
                </>
              ) : (
                <>
                  {isSTT ? <Upload className="w-4 h-4" /> : isTTSTool ? <Mic className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {isSTT ? "Transcribe" : isTTSTool ? "Generate Speech" : "Run"}
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="tool-card rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <Sparkles className="absolute inset-0 m-auto w-24 h-24 text-purple-400 opacity-[0.03] pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Output
              </h2>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="relative z-10 flex-1 min-h-[250px] bg-[#0a0a0f]/60 border border-white/10 rounded-xl p-4 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <span className="text-sm">{isSTT ? "Transcribing audio..." : isTTSTool ? "Synthesizing speech..." : "Generating response..."}</span>
                </div>
              ) : output ? (
                output.startsWith("data:image") ? (
                  <div className="flex flex-col items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={output} alt="Generated AI Visual" className="rounded-xl w-full h-auto object-contain border border-white/10" />
                    <a
                      href={output}
                      download={`MiAi-Image-${Date.now()}.jpg`}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 border border-purple-500/30 px-6 py-2 rounded-full font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Image
                    </a>
                  </div>
                ) : output.startsWith("data:audio") ? (
                  /* ── Audio Player for TTS Output ── */
                  <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center animate-pulse">
                      <Mic className="w-10 h-10 text-purple-400" />
                    </div>
                    <audio controls src={output} className="w-full max-w-md" />
                    <a
                      href={output}
                      download={`MiAi-Audio-${Date.now()}.mp3`}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-full"
                    >
                      <Download className="w-4 h-4" />
                      Download MP3
                    </a>
                  </div>
                ) : (
                  <pre className={`text-sm text-gray-300 whitespace-pre-wrap leading-relaxed ${tool.category === 'code-generation' ? 'font-mono text-cyan-100' : 'font-sans'}`}>
                    {output}
                  </pre>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500 text-center">
                    {isSTT ? "Transcription will appear here after you upload and submit audio." 
                      : isTTSTool ? "Audio player will appear here after you generate speech."
                      : "Output will appear here after you run a prompt."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
