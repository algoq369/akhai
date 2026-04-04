/**
 * AI/Tech topic detail patterns for depth annotations.
 * Extracted from patterns.ts to keep files under 500 lines.
 */

import type { AnnotationType, DepthAnnotation } from '@/lib/depth-annotations';
import type { DetectionPattern } from './patterns-general';

// Object 1: AI Companies & Products + Business Models
const aiCompaniesPattern: DetectionPattern = {
  type: 'detail',
  patterns: [
    /\b(OpenAI'?s?\s+(?:GPT|ChatGPT|GPT-[0-9]|API)(?:\s+models?)?)/gi,
    /\b(ChatGPT|GPT-4|GPT-3\.5)/gi,
    /\b(Anthropic'?s?\s+Claude)/gi,
    /\b(Google'?s?\s+(?:Bard|Gemini|PaLM))/gi,
    /\b(Hugging\s+Face)/gi,
    /\b(Stability\s+AI)/gi,
    /\b(Stable\s+Diffusion)/gi,
    /\b(GitHub\s+Copilot)/gi,
    /\b(Character\.AI)/gi,
    /\b(Jasper\s+AI)/gi,
    /\b(Midjourney)/gi,
    /\b(Claude(?:\s+\d)?)/gi,
    /\b(Large\s+Language\s+Models?)\s*\(LLMs?\)/gi,
    /\b(LLMs?\s+as\s+Services?)/gi,
    /\b(AI\s+Infrastructure)/gi,
    /\b(enterprise\s+(?:solutions?|adoption|AI))/gi,
    /\b(open-source\s+model)/gi,
  ],
  extractor: (match, context) => {
    const term = match[0];
    if (/OpenAI|ChatGPT|GPT-4|GPT/i.test(term)) {
      return {
        content:
          'AI research organization known for large language models (LLMs) · ChatGPT popularized conversational AI (launched Nov 2022, reaching 100M users in 2 months - fastest consumer app adoption in history) · GPT-4 marked advancement in reasoning, multimodal capabilities (text + images) · API enables developers to integrate AI into applications · Key innovations: transformer architecture improvements, reinforcement learning from human feedback (RLHF), instruction-following · Competes with Anthropic (Claude), Google (Gemini), Meta (Llama)',
        confidence: 0.98,
        expandable: true,
        expandQuery: `OpenAI technology innovations and AI model evolution`,
      };
    }
    if (/Anthropic|Claude/i.test(term)) {
      return {
        content:
          'AI safety-focused research organization founded by former OpenAI researchers (2021) · Claude models emphasize harmlessness, honesty, helpfulness (Constitutional AI approach) · Technical strengths: extended context windows (200K tokens enabling full-book analysis), nuanced instruction-following, reduced hallucinations · AWS partnership provides cloud infrastructure · Competes with OpenAI (GPT), Google (Gemini) · Mission: build reliable, interpretable, steerable AI systems',
        confidence: 0.95,
        expandable: true,
        expandQuery: `Anthropic AI safety approach and Constitutional AI methodology`,
      };
    }
    if (/Google.*(?:Bard|Gemini|PaLM)/i.test(term)) {
      return {
        content:
          "Google's family of large language models · Gemini (successor to PaLM and Bard) offers multimodal capabilities (text, images, video, audio, code) · Integrated into Google Workspace (Gmail, Docs, Sheets for productivity) and Search · Technical advantage: access to Google's massive data corpus, compute infrastructure, and distribution channels · Competes with OpenAI (GPT-4), Anthropic (Claude) · Evolution: LaMDA → PaLM → Bard → Gemini showing rapid iteration",
        confidence: 0.95,
        expandable: true,
        expandQuery: `Google Gemini technical capabilities and Workspace integration`,
      };
    }
    if (/Hugging\s+Face/i.test(term)) {
      return {
        content:
          'Open-source AI platform hosting 500K+ machine learning models and 250K+ datasets · Community-driven: 10M+ developers collaborate, share models, and build applications · Infrastructure services: model hosting, inference API, AutoTrain for fine-tuning · Democratizes access to state-of-the-art AI (anyone can download and run models locally or via API) · Comparable to GitHub for AI models · Competes with closed platforms like AWS SageMaker, Google Vertex AI · Moat: network effects from community contributions',
        confidence: 0.92,
        expandable: true,
        expandQuery: `Hugging Face platform capabilities and open-source AI ecosystem`,
      };
    }
    if (/Stability\s+AI|Stable\s+Diffusion/i.test(term)) {
      return {
        content:
          'AI company specializing in open-source generative models · Stable Diffusion: text-to-image model using latent diffusion (generates images from text descriptions) · Open-source approach allows anyone to run locally, modify, or integrate into applications (contrasts with closed systems like DALL-E, Midjourney) · Technical innovation: efficient latent space diffusion enabling generation on consumer GPUs · Applications: art creation, product design, game assets, marketing visuals · Challenges: balancing open-source ethos with sustainable business model',
        confidence: 0.88,
        expandable: true,
        expandQuery: `Stable Diffusion technical architecture and open-source image generation`,
      };
    }
    if (/GitHub\s+Copilot/i.test(term)) {
      return {
        content:
          'AI-powered code completion tool integrated into development environments (VS Code, JetBrains, Neovim) · Powered by OpenAI Codex (LLM trained on public code repositories) · Functionality: suggests entire functions, translates comments to code, provides context-aware completions · Adoption metrics: developers report 40% code acceptance rate (nearly half of suggestions used) · Owned by Microsoft (GitHub parent) · Competes with Amazon CodeWhisperer, Tabnine · Controversy: training on public code raises copyright/licensing questions',
        confidence: 0.93,
        expandable: true,
        expandQuery: `GitHub Copilot subscriber growth, enterprise adoption, and developer productivity impact`,
      };
    }
    if (/Character\.AI/i.test(term)) {
      return {
        content:
          'AI chatbot platform allowing conversations with AI characters (fictional, historical, or user-created personalities) · Technology: large language models fine-tuned for personality consistency and engaging dialogue · Use cases: entertainment, companionship, roleplay, creative writing · Notable for extreme user engagement (avg 2+ hour sessions, significantly higher than typical social apps) · Competes with Replika (therapeutic focus), Snapchat My AI (social integration) · Raises questions about parasocial relationships and emotional attachment to AI',
        confidence: 0.85,
        expandable: true,
        expandQuery: `Character.AI technology and user engagement patterns`,
      };
    }
    if (/Jasper\s+AI/i.test(term)) {
      return {
        content:
          'AI writing assistant specialized for marketing content · Applications: blog posts, ad copy, social media, product descriptions, email campaigns · Technology: large language models trained on marketing copy (emphasizes persuasive tone, SEO optimization, brand voice consistency) · Used by 100K+ marketers and content creators · Competes with Copy.ai, Writesonic, general-purpose tools like ChatGPT · Enterprise features: team collaboration, brand voice templates, workflow integrations with CMS platforms',
        confidence: 0.87,
        expandable: true,
        expandQuery: `Jasper AI content marketing capabilities and enterprise features`,
      };
    }
    if (/Midjourney/i.test(term)) {
      return {
        content:
          "AI image generation service accessed via Discord bot · Technology: diffusion models creating images from text prompts · Known for artistic, painterly aesthetic (distinguishable from Stable Diffusion's more photorealistic style) · Distribution model: Discord-native (users interact in shared servers, creating community around AI art) · 15M+ registered users, 2M+ paying subscribers · Competes with DALL-E (OpenAI), Stable Diffusion (open-source), Adobe Firefly (integrated into Creative Suite) · Bootstrapped and profitable (unusual in AI space)",
        confidence: 0.9,
        expandable: true,
        expandQuery: `Midjourney artistic style and Discord-based community model`,
      };
    }
    if (/LLMs?|Large\s+Language\s+Models?/i.test(term)) {
      return {
        content:
          'Large language models — Neural networks trained on massive text corpora (trillions of words) to understand and generate human-like text · Architecture: primarily transformers (attention mechanisms enabling parallel processing of long sequences) · Scale: billions to trillions of parameters (GPT-4 estimated 1.76T, PaLM 540B, Llama 2 70B) · Training process: unsupervised pre-training on general text, then supervised fine-tuning on specific tasks, often with reinforcement learning from human feedback (RLHF) · Capabilities: text generation, translation, summarization, question-answering, code generation, reasoning · Limitations: hallucinations (generating plausible but false information), lack of true understanding, training data cutoff dates, context window limits · Leading examples: OpenAI GPT series, Anthropic Claude, Google Gemini/PaLM, Meta Llama (open-source)',
        confidence: 0.95,
        expandable: true,
        expandQuery: `LLM architecture, training process, and technical capabilities`,
      };
    }
    if (/AI\s+Infrastructure/i.test(term)) {
      return {
        content:
          'AI infrastructure — Cloud platforms and tooling for deploying machine learning models at scale · Components: model hosting (serving predictions via API), fine-tuning (adapting pre-trained models to specific tasks), vector databases (storing embeddings for semantic search), inference optimization (reducing latency and cost) · Major platforms: AWS SageMaker (integrated with AWS ecosystem), Google Vertex AI (tight integration with TensorFlow/JAX), Azure ML (OpenAI partnership), Hugging Face (open-source focused) · Technical challenges: GPU availability and cost, model versioning, A/B testing, monitoring for drift, handling traffic spikes · Differs from traditional web infrastructure in compute intensity (GPUs vs CPUs), batch vs real-time processing trade-offs, model size constraints',
        confidence: 0.9,
        expandable: true,
        expandQuery: `AI infrastructure platforms and deployment challenges`,
      };
    }
    if (/enterprise\s+(?:solutions?|adoption|AI)/i.test(term)) {
      return {
        content:
          '🏢 B2B AI deployments · ARPU: $50K-500K+/year (vs $10-20/mo consumer) · Adoption: 65% of enterprises testing AI (2024) · Use cases: customer service, code generation, document processing, data analysis · ROI: 15-40% productivity gains · Concerns: security, compliance, hallucinations',
        confidence: 0.88,
        expandable: true,
        expandQuery: `Enterprise AI adoption trends, ROI metrics, and implementation challenges`,
      };
    }
    if (/open-source\s+model/i.test(term)) {
      return {
        content:
          '📖 Freely available AI models · Examples: Meta Llama 2/3, Mistral, Falcon · Strategy: community-driven development, enterprise support revenue · Trade-off: lower costs but self-hosting complexity · Market: growing (30% of deployments) · Vendors: Hugging Face, Together AI, Replicate',
        confidence: 0.85,
        expandable: true,
        expandQuery: `Open-source vs proprietary AI model economics and adoption patterns`,
      };
    }
    return null;
  },
};

// Object 2: AI Techniques & Architectures
const aiTechniquesPattern: DetectionPattern = {
  type: 'detail',
  patterns: [
    /\b(RAG|Retrieval-Augmented\s+Generation)/gi,
    /\b(retrieval-augmented)/gi,
    /\b(multi-agent\s+systems?)/gi,
    /\b(agent\s+systems?)/gi,
    /\b(transformer\s+(?:models?|architecture))/gi,
    /\b(attention\s+mechanism)/gi,
    /\b(self-attention)/gi,
    /\b(fine-tuning|fine-tuned)/gi,
    /\b(RLHF|reinforcement\s+learning\s+from\s+human\s+feedback)/gi,
    /\b(prompt\s+engineering)/gi,
    /\b(few-shot\s+learning)/gi,
    /\b(zero-shot\s+learning)/gi,
    /\b(chain-of-thought)/gi,
    /\b(in-context\s+learning)/gi,
    /\b(embeddings?)/gi,
    /\b(vector\s+(?:database|embeddings?))/gi,
    /\b(neural\s+networks?)/gi,
    /\b(deep\s+learning)/gi,
    /\b(convolutional\s+neural)/gi,
    /\b(recurrent\s+neural)/gi,
    /\b(GAN|generative\s+adversarial)/gi,
    /\b(diffusion\s+models?)/gi,
    /\b(variational\s+autoencoder)/gi,
    /\b(VAE)/gi,
  ],
  extractor: (match, context) => {
    const term = match[0];
    if (/RAG|Retrieval-Augmented\s+Generation|retrieval-augmented/i.test(term)) {
      return {
        content:
          '🔍 RAG · Retrieval-Augmented Generation · Combines LLM with external knowledge retrieval · How: (1) query → (2) fetch relevant docs → (3) LLM generates with context · Benefits: reduces hallucinations, up-to-date info, cites sources · Used by: ChatGPT (web browsing), Perplexity, Bing Chat · Vector DBs: Pinecone, Weaviate, Chroma · Accuracy: +40% vs pure LLM',
        confidence: 0.94,
        expandable: true,
        expandQuery: `RAG implementation best practices and vector database comparison`,
      };
    }
    if (/multi-agent\s+systems?|agent\s+systems?/i.test(term)) {
      return {
        content:
          '🤖 Multi-Agent Systems · Multiple AI agents collaborating on tasks · Architecture: specialized agents (researcher, coder, critic) coordinate via messaging · Frameworks: AutoGPT, BabyAGI, CrewAI, MetaGPT · Benefits: task decomposition, parallel processing, specialization · Challenges: coordination overhead, cost ($0.50-2/complex task) · Use cases: software development, research, complex problem-solving',
        confidence: 0.92,
        expandable: true,
        expandQuery: `Multi-agent AI frameworks comparison and deployment costs`,
      };
    }
    if (/transformer\s+(?:models?|architecture)|attention\s+mechanism|self-attention/i.test(term)) {
      return {
        content:
          '🔄 Transformer Architecture · "Attention is All You Need" (2017 Google paper) · Mechanism: parallel processing with attention weights · Key innovation: self-attention replaces RNNs (faster, better long-range dependencies) · Powers: GPT, BERT, T5, all modern LLMs · Variants: encoder-only (BERT), decoder-only (GPT), encoder-decoder (T5) · Impact: enabled ChatGPT, AlphaFold, Stable Diffusion',
        confidence: 0.93,
        expandable: true,
        expandQuery: `Transformer architecture evolution and attention mechanism explained`,
      };
    }
    if (/fine-tuning|fine-tuned/i.test(term)) {
      return {
        content:
          '⚙️ Fine-Tuning · Adapting pre-trained model to specific task · Process: start with base model → train on domain data → specialized model · Cost: $50-5K (LoRA), $5K-100K (full) · Time: hours to days · vs RAG: fine-tuning changes model weights, RAG adds context · Use when: specific style/format, domain expertise, consistent performance · Tools: Hugging Face, OpenAI API, Axolotl',
        confidence: 0.91,
        expandable: true,
        expandQuery: `Fine-tuning vs RAG cost comparison and use cases`,
      };
    }
    if (/RLHF|reinforcement\s+learning\s+from\s+human\s+feedback/i.test(term)) {
      return {
        content:
          '👍 RLHF · Reinforcement Learning from Human Feedback · How: (1) humans rank outputs → (2) train reward model → (3) optimize LLM for higher rewards · Invented: OpenAI (InstructGPT 2022) · Impact: GPT-3 → ChatGPT transformation · Alternatives: RLAIF (AI feedback), Constitutional AI · Cost: $50K-500K (human labelers) · Result: helpful, harmless, honest AI',
        confidence: 0.93,
        expandable: true,
        expandQuery: `RLHF implementation costs and Constitutional AI comparison`,
      };
    }
    if (/prompt\s+engineering/i.test(term)) {
      return {
        content:
          '✍️ Prompt Engineering · Crafting inputs to optimize LLM outputs · Techniques: few-shot (examples), chain-of-thought (reasoning steps), role-playing, constraints · Advanced: ReAct (reasoning+acting), Tree of Thoughts (exploration), self-consistency · Impact: +50% accuracy on complex tasks · Tools: LangChain, PromptBase · Skill: high-demand ($100-300/hr freelance) · Future: automated prompt optimization',
        confidence: 0.9,
        expandable: true,
        expandQuery: `Advanced prompt engineering techniques and optimization frameworks`,
      };
    }
    if (/diffusion\s+models?/i.test(term)) {
      return {
        content:
          '🎨 Diffusion Models · Iterative denoising for image generation · Process: (1) add noise to image → (2) train model to reverse → (3) generate from pure noise · Invented: 2015 (Ho et al.), popularized 2022 · Models: Stable Diffusion, DALL-E 2, Midjourney · Quality: photorealistic, controllable · Speed: 50 steps (~5s GPU) vs GAN (~0.1s) · Applications: art, design, video, 3D',
        confidence: 0.92,
        expandable: true,
        expandQuery: `Diffusion models vs GANs for image generation quality and speed`,
      };
    }
    return null;
  },
};

// Object 3: AI Capabilities & Applications
const aiCapabilitiesPattern: DetectionPattern = {
  type: 'detail',
  patterns: [
    /\b(image\s+generation)/gi,
    /\b(text-to-image)/gi,
    /\b(image-to-text)/gi,
    /\b(photorealistic)/gi,
    /\b(code\s+generation)/gi,
    /\b(code\s+completion)/gi,
    /\b(speech\s+recognition)/gi,
    /\b(speech-to-text)/gi,
    /\b(text-to-speech)/gi,
    /\b(natural\s+language\s+processing)/gi,
    /\b(NLP)/gi,
    /\b(computer\s+vision)/gi,
    /\b(object\s+detection)/gi,
    /\b(semantic\s+search)/gi,
    /\b(conversational\s+AI)/gi,
    /\b(sentiment\s+analysis)/gi,
    /\b(named\s+entity\s+recognition)/gi,
    /\b(machine\s+translation)/gi,
  ],
  extractor: (match, context) => {
    const term = match[0];
    if (/image\s+generation|text-to-image|photorealistic/i.test(term)) {
      return {
        content:
          '🖼️ AI Image Generation · Text → photorealistic images · Leaders: Midjourney (best quality), DALL-E 3 (safety), Stable Diffusion (open-source) · Quality: indistinguishable from photos (many cases) · Speed: 10-60 seconds · Cost: $10-30/month unlimited · Use cases: marketing, design, concept art, product mockups · Controversy: copyright, artist displacement, deepfakes',
        confidence: 0.91,
        expandable: true,
        expandQuery: `AI image generation tools comparison and copyright issues`,
      };
    }
    if (/code\s+generation|code\s+completion/i.test(term)) {
      return {
        content:
          '💻 AI Code Generation · Automated code from natural language · Tools: GitHub Copilot ($10/mo), ChatGPT, Cursor, Replit AI · Capabilities: autocomplete, refactor, debug, test generation, entire functions · Quality: 40% acceptance rate (Copilot) · Productivity: +55% faster (GitHub study 2022) · Languages: Python, JS, TS best; niche languages weaker · Concern: license compliance, security',
        confidence: 0.93,
        expandable: true,
        expandQuery: `GitHub Copilot vs Cursor productivity metrics and code quality`,
      };
    }
    if (/speech\s+recognition|speech-to-text/i.test(term)) {
      return {
        content:
          '🎤 Speech Recognition · Audio → text transcription · State-of-art: OpenAI Whisper (open-source, 99 languages) · Accuracy: 95%+ (English, clean audio), 80-90% (accents, noise) · Speed: real-time on GPU · Cost: $0.006/minute (Whisper API), free (self-hosted) · Applications: transcription, voice assistants, accessibility · Competition: Google STT, AssemblyAI, Deepgram',
        confidence: 0.9,
        expandable: true,
        expandQuery: `OpenAI Whisper accuracy benchmarks across languages`,
      };
    }
    if (/conversational\s+AI/i.test(term)) {
      return {
        content:
          '💬 Conversational AI · Natural dialogue systems · Components: NLU (intent), dialogue manager (context), NLG (response) · Modern: LLM-powered (ChatGPT, Claude, Gemini) vs rule-based (old) · Capabilities: multi-turn context, personality, task execution · Quality: pass Turing test (limited domains) · Applications: customer service, therapy (Woebot), companionship (Character.AI) · Metrics: engagement time, retention, user satisfaction',
        confidence: 0.89,
        expandable: true,
        expandQuery: `Conversational AI frameworks and engagement metrics`,
      };
    }
    return null;
  },
};

// Object 4: AI Benchmarks & Evaluation
const aiBenchmarksPattern: DetectionPattern = {
  type: 'detail',
  patterns: [
    /\b(HumanEval)/gi,
    /\b(BigBench)/gi,
    /\b(MMLU)/gi,
    /\b(HellaSwag)/gi,
    /\b(TruthfulQA)/gi,
    /\b(GSM8K)/gi,
    /\b(MATH\s+benchmark)/gi,
    /\b(benchmark\s+(?:scores?|tests?|results?))/gi,
    /\b(pass@1|pass@10)/gi,
    /\b(accuracy\s+score)/gi,
  ],
  extractor: (match, context) => {
    const term = match[0];
    if (/HumanEval/i.test(term)) {
      return {
        content:
          '🏆 HumanEval · Code generation benchmark (OpenAI 2021) · 164 Python programming problems with unit tests · Metrics: pass@1 (first attempt), pass@10 (best of 10) · Scores: GPT-4 (67% pass@1), Claude 3.5 (73%), GPT-3.5 (48%) · Limitations: Python only, simple problems, gameable · Alternatives: MBPP, APPS, CodeContests · Industry standard for code LLM evaluation',
        confidence: 0.92,
        expandable: true,
        expandQuery: `HumanEval benchmark scores across LLMs and limitations`,
      };
    }
    if (/BigBench/i.test(term)) {
      return {
        content:
          '📚 BigBench · 200+ diverse AI tasks (Google 2022) · Coverage: reasoning, language, knowledge, math, code · Difficulty: beyond current AI (intentionally hard) · Subset: BIG-Bench Hard (23 hardest tasks) · Goal: measure general intelligence, not narrow skills · Results: frontier models still struggle (60-70% accuracy) · Used by: researchers to track AGI progress',
        confidence: 0.9,
        expandable: true,
        expandQuery: `BigBench Hard results and AGI capability measurement`,
      };
    }
    if (/MMLU/i.test(term)) {
      return {
        content:
          '🎓 MMLU · Massive Multitask Language Understanding · 15,908 multiple-choice questions across 57 subjects · Domains: STEM, humanities, social sciences, professional · Difficulty: college/professional level · Scores: GPT-4 (86%), Claude 3.5 Opus (88%), human expert (~90%) · Significance: measures broad knowledge + reasoning · Limitation: multiple-choice, no creativity test',
        confidence: 0.93,
        expandable: true,
        expandQuery: `MMLU benchmark scores and subject-wise AI performance`,
      };
    }
    return null;
  },
};

// Object 5: Patents, IP & Startup/Business Terms
const patentsBusinessPattern: DetectionPattern = {
  type: 'detail',
  patterns: [
    /\b(patent|patents|patented)/gi,
    /\b(USPTO|US\s+Patent\s+Office)/gi,
    /\b(intellectual\s+property)/gi,
    /\b(prior\s+art)/gi,
    /\b(patent\s+portfolio)/gi,
    /\b(trade\s+secrets?)/gi,
    /\b(licensing\s+(?:deal|agreement))/gi,
    /\b(patent\s+infringement)/gi,
    /\b(provisional\s+patent)/gi,
    /\b(Series\s+[A-F]\s+funding)/gi,
    /\b(pre-seed|seed\s+round)/gi,
    /\b(unicorn\s+(?:startup|company))/gi,
    /\b((?:ARR|MRR)\s*\(Annual|Monthly\s+Recurring\s+Revenue\))/gi,
    /\b(burn\s+rate)/gi,
    /\b(runway\s+\(cash\))/gi,
    /\b(product-market\s+fit)/gi,
    /\b(go-to-market\s+strategy)/gi,
    /\b(GTM\s+strategy)/gi,
    /\b(customer\s+acquisition\s+cost)/gi,
    /\b(CAC|LTV)/gi,
    /\b(churn\s+rate)/gi,
    /\b(YC|Y\s+Combinator)/gi,
    /\b(Sequoia\s+Capital)/gi,
    /\b(a16z|Andreessen\s+Horowitz)/gi,
  ],
  extractor: (match, context) => {
    const term = match[0];
    if (/patent|USPTO|US\s+Patent/i.test(term)) {
      return {
        content:
          '📜 Patents · Exclusive rights for inventions (20 years from filing) · Types: utility (function), design (appearance), plant · USPTO: ~600K applications/year, ~350K granted · Cost: $5K-15K to file+prosecute · Requirements: novel, non-obvious, useful · Global: PCT (Patent Cooperation Treaty) for international · Top filers: IBM, Samsung, Canon · Defensive: prevent others from using, offensive: licensing revenue',
        confidence: 0.91,
        expandable: true,
        expandQuery: `Patent filing strategy, costs, and enforcement tactics`,
      };
    }
    if (/intellectual\s+property|IP|trade\s+secrets?/i.test(term)) {
      return {
        content:
          "Intellectual property (IP) — Legal rights protecting creations of the mind · Four main types: patents (inventions, processes), trademarks (brand identifiers), copyrights (creative works), trade secrets (confidential business information) · Duration: patents (20 years from filing), copyrights (author's life + 70 years), trademarks (renewable indefinitely while in use), trade secrets (until disclosed or reverse-engineered) · Trade-offs: patents require public disclosure in exchange for monopoly, trade secrets protect indefinitely but no recourse if independently discovered (e.g., Coca-Cola formula protected as trade secret for 130+ years) · Enforcement: patent litigation costly ($1M-5M for trial), copyright/trademark enforcement varies by jurisdiction, trade secrets rely on NDAs and security · Represents significant economic value (~38% of US GDP or $6.6T from IP-intensive industries) · Strategy: defensive (prevent others from using), offensive (license for revenue), patent pools (cross-licensing to avoid litigation)",
        confidence: 0.89,
        expandable: true,
        expandQuery: `Intellectual property types, protection mechanisms, and enforcement`,
      };
    }
    // Skip all startup/business financial terms
    if (
      /Series\s+[A-F]\s+funding|seed\s+round|pre-seed|unicorn|ARR|MRR|burn\s+rate|runway|CAC|LTV|Y\s+Combinator|YC/i.test(
        term
      )
    ) {
      return null;
    }
    if (/product-market\s+fit|PMF/i.test(term)) {
      return {
        content:
          'Product-market fit (PMF) — State where product satisfies strong market demand · Concept coined by Marc Andreessen: "being in a good market with a product that can satisfy that market" · Indicators: users organically recommend product, growth accelerates without paid marketing, retention curves flatten (users stick around), support queries focus on advanced features not basics · Pre-PMF characteristics: slow/inconsistent growth, high churn, qualitative feedback suggests "nice to have" not "must have", founders push product rather than market pulling it · Post-PMF characteristics: sustainable organic growth, word-of-mouth acquisition, team struggles to keep up with demand, clear user archetypes emerge · Misconception: PMF is binary moment, but actually continuous spectrum and can be lost if market shifts or competitors improve · Sean Ellis test: survey users "how would you feel if you could no longer use this product?" — if >40% say "very disappointed" suggests strong PMF · Mistake: premature scaling (investing heavily in growth/infrastructure before achieving PMF wastes resources on wrong product)',
        confidence: 0.93,
        expandable: true,
        expandQuery: `Product-market fit validation methods and indicators`,
      };
    }
    if (/Sequoia\s+Capital|a16z|Andreessen\s+Horowitz/i.test(term)) {
      return null; // Skip VC firms - financial/investment entities, not conceptual insights
    }
    return null;
  },
};

export const TECH_PATTERNS: DetectionPattern[] = [
  aiCompaniesPattern,
  aiTechniquesPattern,
  aiCapabilitiesPattern,
  aiBenchmarksPattern,
  patentsBusinessPattern,
];
