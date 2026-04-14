export interface Tool {
  id: string;
  name: string;
  description: string;
  poweredBy: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "chatbots",
    name: "AI Chatbots",
    icon: "💬",
    description: "Fast, conversational AI models for general assistance and Q&A",
  },
  {
    id: "content-writing",
    name: "Content Writing",
    icon: "✍️",
    description: "Generate blogs, articles, marketing copy, and social media posts",
  },
  {
    id: "image-generation",
    name: "Image Generation",
    icon: "🖼️",
    description: "Create high-quality AI imagery instantly",
  },
  {
    id: "code-generation",
    name: "Code Generation",
    icon: "💻",
    description: "Write, debug, and explain code using AI models",
  },
  {
    id: "presentations",
    name: "Presentations",
    icon: "🎨",
    description: "Lightning-fast slide outline and text generation",
  },
];

export const tools: Tool[] = [
  // AI Chatbots
  {
    id: "gemini",
    name: "Google Gemini 1.5",
    description: "Google's powerful multimodal AI for conversations and analysis",
    poweredBy: "Gemini API",
    category: "chatbots",
  },
  {
    id: "llama3-chat",
    name: "Meta Llama 3",
    description: "Meta's open-source LLM with lightning-fast responses",
    poweredBy: "Groq API",
    category: "chatbots",
  },
  {
    id: "mistral",
    name: "Mistral 8x7B",
    description: "High-quality mixture-of-experts model for complex reasoning",
    poweredBy: "Groq API",
    category: "chatbots",
  },
  {
    id: "cohere-command",
    name: "Cohere Command R",
    description: "Enterprise-grade AI optimized for real-world tasks",
    poweredBy: "Cohere API",
    category: "chatbots",
  },

  // Content Writing
  {
    id: "gemini-writer",
    name: "Gemini Copywriter",
    description: "Create polished marketing copy and blog articles",
    poweredBy: "Gemini API",
    category: "content-writing",
  },
  {
    id: "llama3-marketer",
    name: "Llama 3 Marketer",
    description: "Generate SEO-optimized content and social media posts",
    poweredBy: "Groq API",
    category: "content-writing",
  },
  {
    id: "cohere-blog",
    name: "Cohere Blog Master",
    description: "Long-form blog writing with structured outlines",
    poweredBy: "Cohere API",
    category: "content-writing",
  },

  // Image Generation
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    description: "High-resolution, photorealistic image generation",
    poweredBy: "HuggingFace API",
    category: "image-generation",
  },
  {
    id: "flux-dev",
    name: "FLUX.1 [dev]",
    description: "Next-generation image model with exceptional detail",
    poweredBy: "HuggingFace API",
    category: "image-generation",
  },
  {
    id: "sd-core",
    name: "Stable Image Core",
    description: "Fast, versatile image generation for creative projects",
    poweredBy: "HuggingFace API",
    category: "image-generation",
  },

  // Code Generation
  {
    id: "gemini-coder",
    name: "Gemini Coder",
    description: "Full-stack code generation with detailed explanations",
    poweredBy: "Gemini API",
    category: "code-generation",
  },
  {
    id: "codellama",
    name: "CodeLlama 70B",
    description: "Meta's specialized model for code completion and debugging",
    poweredBy: "Groq API",
    category: "code-generation",
  },
  {
    id: "starcoder",
    name: "StarCoder",
    description: "Open-source code model trained on 80+ programming languages",
    poweredBy: "HuggingFace API",
    category: "code-generation",
  },

  // Presentations
  {
    id: "llama3-pitch",
    name: "Llama 3 Pitch Deck",
    description: "Generate professional pitch deck outlines instantly",
    poweredBy: "Groq API",
    category: "presentations",
  },
  {
    id: "gemini-presenter",
    name: "Gemini Presenter",
    description: "Create structured slides with key talking points",
    poweredBy: "Gemini API",
    category: "presentations",
  },
];

export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((tool) => tool.category === categoryId);
}
