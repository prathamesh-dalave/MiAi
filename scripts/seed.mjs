import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars. Ensure .env.local is populated with SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const categories = [
  { id: "chatbots", name: "AI Chatbots", description: "Fast, conversational AI models for general assistance and Q&A", icon: "💬" },
  { id: "content-writing", name: "Content Writing", description: "Generate blogs, marketing copy, and long-form articles", icon: "✍️" },
  { id: "image-generation", name: "Image Generation", description: "Create stunning visuals, logos, and art from text prompts", icon: "🖼️" },
  { id: "code-generation", name: "Code Generation", description: "Automate code writing, debugging, and architecture design.", icon: "💻" },
  { id: "audio-tools", name: "Audio Tools", description: "Convert text to lifelike speech and transcribe audio to text instantly.", icon: "🎙️" },
];

const tools = [
  { id: "gemini", name: "Gemini 2.5 Flash", description: "Google's flagship AI with live Google Search grounding for real-time 2026 answers", category: "chatbots" },
  { id: "mistral", name: "Cohere Command A", description: "Cohere's latest 2025 enterprise model with deep reasoning and current knowledge", category: "chatbots" },
  { id: "llama-write", name: "Gemini Writer", description: "Google AI powered by live search — writes content with verified, current 2026 facts", category: "content-writing" },
  { id: "mixtral-write", name: "Cohere Writer", description: "Cohere's Command A model optimized for long-form, factual, up-to-date content creation", category: "content-writing" },
  { id: "flux", name: "FLUX.1 [schnell]", description: "State of the art, wildly realistic open-source image generation model", category: "image-generation" },
  { id: "sdxl", name: "Stable Diffusion Turbo", description: "Ultra-stable image generation with Double-Flux Reliability (HF + Pollinations Failover)", category: "image-generation" },
  { id: "starcoder", name: "StarCoder 2", description: "Massive open-source model trained purely on 600+ programming languages", category: "code-generation" },
  { id: "codellama", name: "CodeLlama 70B", description: "Meta's specialized Llama architecture tuned entirely for coding tasks", category: "code-generation" },
  { id: "qwen-coder", name: "Qwen 2.5 Coder", description: "AliBaba's insanely capable programming and logic model", category: "code-generation" },
  { id: "whisper-stt", name: "Whisper V3 Transcriber", description: "Upload audio and get instant, accurate text transcriptions powered by Groq", category: "audio-tools" },
  { id: "deepgram-tts", name: "Deepgram Aura TTS", description: "Deepgram's ultra-fast neural text-to-speech with natural human voices", category: "audio-tools" },
];

async function seed() {
  console.log("Seeding Categories...");
  // Hard delete broken categories from live Database
  await supabase.from('categories').delete().eq('id', 'presentations');
  const { error: catErr } = await supabase.from('categories').upsert(categories);
  if (catErr) {
    console.error("Error inserting categories:", catErr);
    return;
  }
  console.log("✅ Categories seeded successfully.");

  console.log("Seeding Tools...");
  // Hard delete ghost/broken tools
  await supabase.from('tools').delete().in('id', ['llama3', 'claude-write', 'gpt-copy', 'marp', 'reveal', 'google-tts', 'azure-tts', 'aws-polly', 'meta-tts', 'speecht5-tts', 'bark-tts']);
  const { error: toolErr } = await supabase.from('tools').upsert(tools);
  if (toolErr) {
    console.error("Error inserting tools:", toolErr);
    return;
  }
  console.log("✅ Tools seeded successfully.");
}

seed();
