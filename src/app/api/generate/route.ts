import { NextResponse } from "next/server";
import { supabase as browserSupabase } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

// Tool Provider Mapping Decoder
type ProviderType = "Groq" | "GeminiGrounded" | "Cohere" | "HuggingFace" | "GroqWhisper" | "DeepgramTTS" | "Pollinations";

interface ToolConfig {
  provider: ProviderType;
  model: string;
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  // ── AI Chatbots (all search-grounded for real-time 2026 info) ──
  "gemini": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "mistral": { provider: "Cohere", model: "command-a-03-2025" },

  // ── Content Writing (search-grounded for factual, current content) ──
  "llama-write": { provider: "GeminiGrounded", model: "gemini-2.5-flash" },
  "mixtral-write": { provider: "Cohere", model: "command-a-03-2025" },

  // ── Code Generation (Groq for speed — code doesn't need live news) ──
  "codellama": { provider: "Groq", model: "meta-llama/llama-4-scout-17b-16e-instruct" },
  "starcoder": { provider: "Groq", model: "qwen/qwen3-32b" },
  "qwen-coder": { provider: "Groq", model: "qwen/qwen3-32b" }, 

  // ── Image Generation (100% Free, No credits/keys needed) ──
  "flux": { provider: "Pollinations", model: "flux" },
  "flux-dev": { provider: "Pollinations", model: "flux" },
  "sdxl": { provider: "Pollinations", model: "flux" },
  "sd-core": { provider: "Pollinations", model: "flux" },

  // ── Audio Tools ──
  "whisper-stt": { provider: "GroqWhisper", model: "whisper-large-v3" },
  "deepgram-tts": { provider: "DeepgramTTS", model: "aura-2-thalia-en" },
};

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
      toolId = formData.get("toolId") as string;
      category = formData.get("category") as string;
      audioFile = formData.get("audio") as File | null;
    } else {
      const body = await req.json();
      prompt = body.prompt;
      toolId = body.toolId;
      category = body.category;
    }

    if ((!prompt && !audioFile) || !toolId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let config = TOOL_CONFIG[toolId];
    if (!config && category === "image-generation") {
      config = { provider: "Pollinations", model: toolId.includes("sd") ? "turbo" : "flux" };
    }
    if (!config) {
      return NextResponse.json({ error: "Invalid tool configuration or deprecated tool" }, { status: 400 });
    }

    let resultText = "";
    let isImage = false;
    let isAudio = false;

    // ── SYSTEM PROMPT INJECTION ──
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let systemPrompt = `You are a helpful, professional AI assistant. Today's date is ${currentDate}. Provide the most current and up-to-date information available.`;
    if (category === "code-generation") {
      systemPrompt = `You are an expert Senior Software Engineer with knowledge current to ${currentDate}. Provide ONLY the code formatted in standard Markdown blocks. NO conversational filler.`;
    } else if (category === "content-writing") {
      systemPrompt = `You are a world-class content writer. Today's date is ${currentDate}. Write engaging, factually accurate, and up-to-date content using the latest information from web search results.`;
    }

    // ═══════════════════════════════════════════
    // IMAGE GENERATION (Pollinations AI — 100% Free & Unlimited)
    // ═══════════════════════════════════════════
    if (config.provider === "Pollinations" || config.provider === "HuggingFace" || category === "image-generation") {
      isImage = true;
      let imgResponse: Response | null = null;
      let usedMimeType = "image/jpeg";
      
      const seed = Math.floor(Math.random() * 2147483647);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const selectedModel = config.model || "flux";

      // Headers support optional free API key from enter.pollinations.ai to eliminate watermarks
      const fetchHeaders: Record<string, string> = {
        "Accept": "image/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MiAi/1.0",
      };
      if (POLLINATIONS_API_KEY) {
        fetchHeaders["Authorization"] = `Bearer ${POLLINATIONS_API_KEY}`;
      }

      // Multi-layer resilient endpoint strategy for Pollinations AI:
      // 1. Primary: FLUX model with explicit nologo flag and dimensions
      // 2. Alternative backend: gen.pollinations.ai endpoint
      // 3. Resilient fallback: Base endpoint with nologo
      // 4. Safe fallback: Compact parameter URL
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

      // Hugging Face fallback if available and Pollinations was unreachable
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
    // GROQ (Chat Completions)
    // ═══════════════════════════════════════════
    } else if (config.provider === "Groq") {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in backend.");
      
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API Error: ${errText}`);
      }
      
      const data = await res.json();
      resultText = data.choices[0].message.content;

    // ═══════════════════════════════════════════
    // GEMINI GROUNDED (Google Search + Gemini)
    // ═══════════════════════════════════════════
    } else if (config.provider === "GeminiGrounded") {
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in backend.");

      const combinedPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
      let geminiRes: Response | null = null;
      let retries = 3;
      let delay = 1000;

      while (retries > 0) {
        geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: combinedPrompt }] }],
            tools: [{ googleSearch: {} }]
          })
        });

        if (geminiRes.status === 429 || geminiRes.status === 503) {
          console.log(`Gemini High Demand (${geminiRes.status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2; // Exponential backoff
          continue;
        }
        break;
      }

      if (!geminiRes || !geminiRes.ok) {
        const errText = geminiRes ? await geminiRes.text() : "Connection failed";
        if (geminiRes?.status === 429 || geminiRes?.status === 503) {
          throw new Error("Gemini is currently facing extremely high demand. Please try again in a few seconds.");
        }
        throw new Error(`Gemini Grounded Error: ${errText}`);
      }
      
      const data = await geminiRes.json();
      resultText = data.candidates[0].content.parts
        .filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join("");

    // ═══════════════════════════════════════════
    // COHERE (Command R+ with Web Search)
    // ═══════════════════════════════════════════
    } else if (config.provider === "Cohere") {
      if (!COHERE_API_KEY) throw new Error("COHERE_API_KEY is missing. Get a free key at https://dashboard.cohere.com");

      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cohere API Error: ${errText}`);
      }

      const data = await res.json();
      resultText = data.message.content[0].text;

    // ═══════════════════════════════════════════
    // GROQ WHISPER (Speech-to-Text)
    // ═══════════════════════════════════════════
    } else if (config.provider === "GroqWhisper") {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in backend.");
      if (!audioFile) throw new Error("No audio file provided for transcription.");

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", config.model);
      formData.append("response_format", "text");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq Whisper Error: ${errText}`);
      }

      resultText = await res.text();

    // ═══════════════════════════════════════════
    // DEEPGRAM AURA (Text-to-Speech)
    // ═══════════════════════════════════════════
    } else if (config.provider === "DeepgramTTS") {
      if (!DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is missing.");
      isAudio = true;

      const res = await fetch(`https://api.deepgram.com/v1/speak?model=${config.model}&encoding=mp3`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: prompt }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Deepgram TTS Error: ${errText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      resultText = `data:audio/mpeg;base64,${base64}`;
    }

    // ── BACKGROUND LOGGING TO SUPABASE (FAIL-SAFE) ──
    try {
      // Check for user session server-side
      const serverSupabase = await createServerSupabase();
      const { data: { user } } = await serverSupabase.auth.getUser();

      await serverSupabase.from("user_prompts_history").insert({
        tool_id: toolId,
        prompt: isAudio ? prompt : (audioFile ? "[Audio Upload]" : prompt),
        response: isImage ? "[Image Output Buffer]" : isAudio ? "[Audio Output Buffer]" : resultText,
        user_id: user?.id || null // Automatically links to user if logged in, otherwise stays null for guests
      });
    } catch (logError) {
      console.warn("History Logging Warning (Non-Blocker): ", logError);
      // We don't throw here so the user isn't blocked by a logging failure
    }

    return NextResponse.json({ success: true, response: resultText, isImage, isAudio });

  } catch (error: any) {
    console.error("MiAi Switchboard Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to generate. Network request failed." }, { status: 500 });
  }
}
