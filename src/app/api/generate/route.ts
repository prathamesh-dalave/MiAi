import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

type ProviderType = "Groq" | "GeminiGrounded" | "Cohere" | "HuggingFace" | "GroqWhisper" | "DeepgramTTS" | "Pollinations";

interface ToolConfig {
  provider: ProviderType;
  model: string;
}

// Comprehensive registry covering all 15 frontend tools + aliases + audio tools
const TOOL_CONFIG: Record<string, ToolConfig> = {
  // ── AI Chatbots ──
  "gemini": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "llama3-chat": { provider: "Groq", model: "openai/gpt-oss-120b" },
  "mistral": { provider: "Cohere", model: "command-a-03-2025" },
  "cohere-command": { provider: "Cohere", model: "command-a-03-2025" },

  // ── Content Writing ──
  "gemini-writer": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "llama3-marketer": { provider: "Groq", model: "openai/gpt-oss-120b" },
  "llama-write": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "mixtral-write": { provider: "Cohere", model: "command-a-03-2025" },
  "cohere-blog": { provider: "Cohere", model: "command-a-03-2025" },

  // ── Code Generation ──
  "gemini-coder": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "codellama": { provider: "Groq", model: "qwen/qwen3.8-27b" },
  "starcoder": { provider: "Groq", model: "qwen/qwen3.8-27b" },
  "qwen-coder": { provider: "Groq", model: "qwen/qwen3.8-27b" },

  // ── Presentations ──
  "llama3-pitch": { provider: "Groq", model: "openai/gpt-oss-120b" },
  "gemini-presenter": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },

  // ── Image Generation (100% Free, Unlimited) ──
  "flux": { provider: "Pollinations", model: "flux" },
  "flux-dev": { provider: "Pollinations", model: "flux" },
  "sdxl": { provider: "Pollinations", model: "flux" },
  "sd-core": { provider: "Pollinations", model: "flux" },

  // ── Audio Tools ──
  "whisper-stt": { provider: "GroqWhisper", model: "whisper-large-v3" },
  "deepgram-tts": { provider: "DeepgramTTS", model: "aura-2-thalia-en" },
};

// ── GROQ HELPER (with multi-model fallback) ──
async function runGroq(prompt: string, systemPrompt: string, preferredModel?: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured.");
  const candidateModels = [preferredModel, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter(Boolean) as string[];

  for (const m of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {
      console.warn(`Groq model ${m} failed:`, e);
    }
  }
  throw new Error("All Groq models failed.");
}

// ── GEMINI HELPER (with grounded search + plain prompt + Groq fallback) ──
async function runGemini(prompt: string, systemPrompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
  if (GEMINI_API_KEY) {
    const combinedPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

    // 1. Try with Google Search Grounding
    try {
      const groundedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: combinedPrompt }] }],
          tools: [{ google_search: {} }]
        })
      });
      if (groundedRes.ok) {
        const data = await groundedRes.json();
        const text = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.text)?.map((p: any) => p.text)?.join("");
        if (text) return text;
      }
    } catch (e) {
      console.warn("Gemini Search Grounding attempt failed, trying standard:", e);
    }

    // 2. Try standard prompt without tools
    try {
      const stdRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: combinedPrompt }] }]
        })
      });
      if (stdRes.ok) {
        const data = await stdRes.json();
        const text = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.text)?.map((p: any) => p.text)?.join("");
        if (text) return text;
      }
    } catch (e) {
      console.warn("Gemini standard attempt failed:", e);
    }
  }

  // 3. Fallback to Groq if Gemini fails or is rate-limited
  if (GROQ_API_KEY) {
    console.log("Cascading Gemini request to Groq high-capacity engine...");
    return await runGroq(prompt, systemPrompt, "openai/gpt-oss-120b");
  }

  throw new Error("Both Gemini and fallback AI engines were unable to fulfill the request.");
}

// ── COHERE HELPER (with Groq fallback) ──
async function runCohere(prompt: string, systemPrompt: string, model: string = "command-a-03-2025"): Promise<string> {
  if (COHERE_API_KEY) {
    try {
      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.message?.content?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn("Cohere call failed, cascading to fallback:", e);
    }
  }

  // Fallback to Groq or Gemini
  if (GROQ_API_KEY) {
    return await runGroq(prompt, systemPrompt, "openai/gpt-oss-120b");
  }
  if (GEMINI_API_KEY) {
    return await runGemini(prompt, systemPrompt);
  }

  throw new Error("Cohere and fallback engines failed.");
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    
    let prompt = "";
    let toolId = "";
    let category = "";
    let audioFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      prompt = (formData.get("prompt") as string) || "Transcribe this audio";
      toolId = (formData.get("toolId") as string) || "";
      category = (formData.get("category") as string) || "";
      audioFile = formData.get("audio") as File | null;
    } else {
      const body = await req.json();
      prompt = body.prompt || "";
      toolId = body.toolId || "";
      category = body.category || "";
    }

    if ((!prompt && !audioFile) || !toolId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve tool configuration with comprehensive fallback
    let config = TOOL_CONFIG[toolId];
    if (!config) {
      if (category === "image-generation") {
        config = { provider: "Pollinations", model: "flux" };
      } else if (category === "code-generation") {
        config = { provider: "Groq", model: "qwen/qwen3.8-27b" };
      } else if (category === "presentations") {
        config = { provider: "Groq", model: "openai/gpt-oss-120b" };
      } else if (category === "content-writing") {
        config = { provider: "GeminiGrounded", model: "gemini-2.5-flash" };
      } else if (category === "chatbots") {
        config = { provider: "GeminiGrounded", model: "gemini-2.5-flash" };
      } else if (toolId.includes("stt") || toolId.includes("whisper")) {
        config = { provider: "GroqWhisper", model: "whisper-large-v3" };
      } else if (toolId.includes("tts") || toolId.includes("speech") || toolId.includes("audio")) {
        config = { provider: "DeepgramTTS", model: "aura-2-thalia-en" };
      } else {
        config = { provider: "Groq", model: "qwen/qwen3.8-27b" };
      }
    }

    let resultText = "";
    let isImage = false;
    let isAudio = false;

    // ── SYSTEM PROMPTS ──
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let systemPrompt = `You are a helpful, professional AI assistant. Today's date is ${currentDate}. Provide accurate, up-to-date responses.`;
    if (category === "code-generation") {
      systemPrompt = `You are an expert Senior Software Engineer. Provide ONLY the code formatted in standard Markdown blocks with concise comments. Avoid unnecessary pleasantries.`;
    } else if (category === "content-writing") {
      systemPrompt = `You are a world-class content writer. Write engaging, factually sound, and beautifully formatted content.`;
    } else if (category === "presentations") {
      systemPrompt = `You are an executive pitch deck and presentation expert. Provide structured, slide-by-slide outlines with clear bullet points, speaker notes, and key takeaways.`;
    }

    // ═══════════════════════════════════════════
    // IMAGE GENERATION (Pollinations AI)
    // ═══════════════════════════════════════════
    if (config.provider === "Pollinations" || config.provider === "HuggingFace" || category === "image-generation") {
      isImage = true;
      let imgResponse: Response | null = null;
      let usedMimeType = "image/jpeg";
      
      const seed = Math.floor(Math.random() * 2147483647);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const selectedModel = config.model || "flux";

      const fetchHeaders: Record<string, string> = {
        "Accept": "image/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MiAi/1.0",
      };
      if (POLLINATIONS_API_KEY) {
        fetchHeaders["Authorization"] = `Bearer ${POLLINATIONS_API_KEY}`;
      }

      const candidateUrls = [
        `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${selectedModel}&seed=${seed}&nologo=true&width=1024&height=1024`,
        `https://gen.pollinations.ai/image/${encodedPrompt}?model=${selectedModel}&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true&width=1024&height=1024`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true`,
      ];

      for (const url of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const res = await fetch(url, {
            signal: controller.signal,
            headers: fetchHeaders,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const cType = res.headers.get("content-type") || "";
            if (cType.includes("image") || cType.includes("octet-stream") || !cType.includes("html")) {
              imgResponse = res;
              usedMimeType = cType.includes("image") ? cType : "image/jpeg";
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`Pollinations fetch attempt failed for ${url}:`, fetchErr);
        }
      }

      // Hugging Face fallback if available
      if (!imgResponse && HUGGINGFACE_API_KEY) {
        try {
          const hfRes = await fetch("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", {
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
          });
          if (hfRes.ok) {
            imgResponse = hfRes;
            usedMimeType = "image/jpeg";
          }
        } catch (hfErr) {
          console.warn("HuggingFace fallback failed:", hfErr);
        }
      }

      if (!imgResponse || !imgResponse.ok) {
        throw new Error("Image generation services are temporarily busy. Please try again in a few moments.");
      }

      const arrayBuffer = await imgResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      resultText = `data:${usedMimeType};base64,${base64}`;

    // ═══════════════════════════════════════════
    // GROQ CHAT & CODE COMPLETIONS
    // ═══════════════════════════════════════════
    } else if (config.provider === "Groq") {
      try {
        resultText = await runGroq(prompt, systemPrompt, config.model);
      } catch (err) {
        console.warn("Groq execution failed, cascading to Gemini:", err);
        resultText = await runGemini(prompt, systemPrompt);
      }

    // ═══════════════════════════════════════════
    // GEMINI GROUNDED
    // ═══════════════════════════════════════════
    } else if (config.provider === "GeminiGrounded") {
      resultText = await runGemini(prompt, systemPrompt, config.model);

    // ═══════════════════════════════════════════
    // COHERE
    // ═══════════════════════════════════════════
    } else if (config.provider === "Cohere") {
      resultText = await runCohere(prompt, systemPrompt, config.model);

    // ═══════════════════════════════════════════
    // GROQ WHISPER (Speech-to-Text)
    // ═══════════════════════════════════════════
    } else if (config.provider === "GroqWhisper") {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in backend.");
      if (!audioFile) throw new Error("No audio file provided for transcription.");

      const candidateModels = ["whisper-large-v3", "whisper-large-v3-turbo"];
      let whisperSuccess = false;

      for (const m of candidateModels) {
        try {
          const formData = new FormData();
          formData.append("file", audioFile);
          formData.append("model", m);
          formData.append("response_format", "text");

          const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: formData,
          });

          if (res.ok) {
            resultText = await res.text();
            whisperSuccess = true;
            break;
          }
        } catch (e) {
          console.warn(`Whisper model ${m} attempt failed:`, e);
        }
      }

      if (!whisperSuccess) {
        throw new Error("Whisper transcription failed on all available models.");
      }

    // ═══════════════════════════════════════════
    // DEEPGRAM AURA (Text-to-Speech)
    // ═══════════════════════════════════════════
    } else if (config.provider === "DeepgramTTS") {
      if (!DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is missing.");
      isAudio = true;

      const candidateVoices = [config.model, "aura-2-thalia-en", "aura-asteria-en", "aura-luna-en"].filter(Boolean) as string[];
      let ttsSuccess = false;

      for (const voice of candidateVoices) {
        try {
          const res = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3`, {
            method: "POST",
            headers: {
              "Authorization": `Token ${DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: prompt }),
          });

          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            resultText = `data:audio/mpeg;base64,${base64}`;
            ttsSuccess = true;
            break;
          }
        } catch (e) {
          console.warn(`Deepgram voice ${voice} failed:`, e);
        }
      }

      if (!ttsSuccess) {
        throw new Error("Text-to-speech synthesis failed. Deepgram service unavailable.");
      }
    }

    // ── BACKGROUND LOGGING TO SUPABASE (NON-BLOCKING) ──
    try {
      const serverSupabase = await createServerSupabase();
      const { data: { user } } = await serverSupabase.auth.getUser();

      await serverSupabase.from("user_prompts_history").insert({
        tool_id: toolId,
        prompt: isAudio ? prompt : (audioFile ? "[Audio Upload]" : prompt),
        response: isImage ? "[Image Output Buffer]" : isAudio ? "[Audio Output Buffer]" : resultText,
        user_id: user?.id || null,
      });
    } catch (logError) {
      console.warn("History Logging Warning (Non-Blocker):", logError);
    }

    return NextResponse.json({ success: true, response: resultText, isImage, isAudio });

  } catch (error: any) {
    console.error("MiAi Switchboard Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate. Network request failed." }, { status: 500 });
  }
}
