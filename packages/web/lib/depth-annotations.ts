/**
 * DEPTH ANNOTATIONS SYSTEM
 * 
 * Real-time depth generation for AI responses.
 * Adds grey subtitle annotations beneath key terms during streaming.
 * 
 * Annotation Types:
 * - ᶠ Fact: Verifiable data
 * - ᵐ Metric: Numbers, stats, percentages
 * - ᶜ Connection: Links to user context/memory
 * - ᵈ Detail: Expanded information
 * - ˢ Source: Citation hints
 * 
 * @module depth-annotations
 */

// ============ TYPES ============

export type AnnotationType = 'fact' | 'metric' | 'connection' | 'detail' | 'source';

export interface DepthAnnotation {
  id: string;
  type: AnnotationType;
  term: string;           // The term being annotated
  content: string;        // The annotation text
  position: number;       // Character position in text
  confidence: number;     // 0-1 confidence score
  expandable?: boolean;   // Can click to explore further
  expandQuery?: string;   // Query to run if clicked
  metadata?: Record<string, any>;
}

export interface AnnotatedSegment {
  text: string;
  annotations: DepthAnnotation[];
}

export interface DepthConfig {
  enabled: boolean;
  density: 'minimal' | 'standard' | 'maximum';
  showByDefault: boolean;
  annotationTypes: AnnotationType[];
}

// ============ SYMBOLS ============

export const DEPTH_SYMBOLS: Record<AnnotationType, string> = {
  fact: 'ᶠ',
  metric: 'ᵐ',
  connection: 'ᶜ',
  detail: 'ᵈ',
  source: 'ˢ',
};

export const DEPTH_COLORS: Record<AnnotationType, string> = {
  fact: 'text-blue-400/60',
  metric: 'text-emerald-400/60',
  connection: 'text-purple-400/60',
  detail: 'text-gray-400/60',
  source: 'text-amber-400/60',
};

// ============ DETECTION PATTERNS ============

interface DetectionPattern {
  type: AnnotationType;
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray, context: string) => Partial<DepthAnnotation> | null;
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  // GENERIC CONCEPT PHRASES (catch ANY important multi-word terms)
  {
    type: 'detail',
    patterns: [
      // PRIORITY 1: Capitalized proper nouns and technical terms (2-4 words)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g,

      // PRIORITY 2: Technical compound terms (adjective + technical noun)
      /\b(digital|virtual|augmented|artificial|quantum|neural|cognitive|distributed|decentralized|autonomous|smart|programmable|biometric|renewable|sustainable)\s+([a-z]+(?:\s+[a-z]+){0,2})\b/gi,

      // PRIORITY 3: Multi-word technical phrases (lowercase)
      /\b([a-z]+[-\s][a-z]+(?:[-\s][a-z]+)?)\s+(interface|system|network|protocol|technology|platform|infrastructure|framework|architecture|mechanism|algorithm|model|strategy|approach|methodology)\b/gi,

      // PRIORITY 4: Specific high-value terms
      /\b(neural\s+interface|brain[-\s]computer\s+interface|BCI)\b/gi,
      /\b(AGI|artificial\s+general\s+intelligence|AI\s+assistant)\b/gi,
      /\b(biosensors?|biometric\s+sensors?)\b/gi,
      /\b(OLED|micro[-\s]?LED|quantum[-\s]?dot)\s+(?:display|wallpaper|screen)/gi,
      /\b(retinal\s+projection|AR\s+glasses|mixed\s+reality)\b/gi,
      /\b(quantum[-\s]?resistant|post[-\s]?quantum)\s+(?:cryptography|encryption|chain)/gi,
      /\b(DeFi|decentralized\s+finance)\s+(?:protocols?|platform|ecosystem)/gi,
      /\b(smart\s+(?:contract|fabric|city|home|grid))\b/gi,
      /\b(autonomous\s+(?:vehicle|pod|drone|system))\b/gi,
      /\b(blockchain|distributed\s+ledger)\b/gi,
      /\b(machine\s+learning|deep\s+learning|reinforcement\s+learning)\b/gi,
      /\b(cloud\s+computing|edge\s+computing|fog\s+computing)\b/gi,

      // Financial & Economic
      /\b(CBDC|Central\s+Bank\s+Digital\s+Currency)\b/gi,
      /\b(crypto(?:currency)?\s+(?:portfolio|wallet|exchange|asset|market))\b/gi,
      /\b(carbon\s+(?:credit|offset|neutral|footprint)s?)\b/gi,
      /\b(social\s+credit\s+score)\b/gi,
      /\b(digital\s+(?:currency|payment|wallet|asset))\b/gi,

      // Urban & Infrastructure
      /\b(15[-\s]?minute\s+city|walkable\s+(?:city|neighborhood))\b/gi,
      /\b(subterranean\s+city|underground\s+(?:infrastructure|city))\b/gi,
      /\b(vertical\s+farm(?:ing)?|urban\s+agriculture)\b/gi,
      /\b(renewable\s+energy|solar\s+(?:panel|power)|wind\s+(?:turbine|power))\b/gi,

      // Scientific & Medical
      /\b(prefrontal\s+cortex|neural\s+pathway|brain\s+region)\b/gi,
      /\b(circadian\s+rhythm|sleep\s+cycle|wake\s+cycle)\b/gi,
      /\b(vitamin\s+[A-Z]|mineral\s+deficiency)\b/gi,
      /\b(health\s+(?:metric|monitor|tracker|sensor)s?)\b/gi,
      /\b(genetic\s+(?:engineering|modification|sequencing))\b/gi,
    ],
    extractor: (match, context) => {
      const term = match[0]
      let insight = ''
      let expandQuery = term

      // ============ SELECTIVITY FILTER ============
      // SKIP common/obvious terms that don't provide real insight

      // Reduced blocklist - only skip truly meaningless terms
      const BLOCKLIST = [
        // Only the most generic articles and pronouns
        /^(the|a|an|this|that)\s/i,

        // Only the most common 1-3 letter words
        /^(is|am|are|be|to|of|in|on|at|by|for|and|or|but|not|it)$/i,
      ]

      // Check blocklist
      for (const pattern of BLOCKLIST) {
        if (pattern.test(term)) {
          return null // Skip this term - too common/obvious
        }
      }

      // Allow more annotations - user wants maximum capabilities
      // Only skip if truly meaningless, not just generic

      // ============ SPECIFIC INSIGHTS (High-Value Terms Only) ============

      // DEMOGRAPHIC & POPULATION CONCEPTS
      if (/demographic\s+dividend/i.test(term)) {
        insight = `Demographic dividend — Population phenomenon where working-age population (typically ages 15-64) grows substantially larger relative to dependent populations (children under 15 and elderly over 65), creating window of economic opportunity · Occurs during specific phase of demographic transition: after mortality rates decline (so fewer infant/child deaths) but before birth rates fully adjust downward, resulting in temporary "bulge" generation of working-age adults · Mechanism: higher ratio of workers to dependents means more people producing economic value while fewer require support, enabling increased savings, investment, and consumption · Window typically lasts 20-50 years before aging of bulge generation reverses ratio · Historical examples: East Asian economic miracle (1960s-1990s Japan, South Korea, Taiwan, Singapore saw 6-9% annual GDP growth during dividend phase), China's rapid development (1980-2015 coincided with peak working-age population from 400M rural-to-urban migration), India currently in dividend phase (2018-2055 projected window) · Critical requirements to capitalize: education systems (train workforce with relevant skills), job creation (absorb young workers into productive employment), healthcare infrastructure (maintain population health and productivity), financial systems (channel increased savings into investment), infrastructure development (roads, power, communications enable economic activity) · Risks if mismanaged: youth unemployment ("youth bulge" becomes source of instability if jobs unavailable), skills mismatch (education system not aligned with labor market needs), premature aging (dividend window closes before achieving sustainable development) · Contrasts with demographic burden: when dependent populations outnumber workers, straining social support systems · Not automatic benefit—requires policy responses to convert population structure into economic gains`
        expandQuery = 'demographic dividend examples and requirements for success'
      } else if (/demographic\s+transition/i.test(term)) {
        insight = `Demographic transition — Theoretical model describing society's shift from high birth rates and high death rates (pre-industrial equilibrium with slow population growth) to low birth rates and low death rates (modern equilibrium with slow growth), passing through period of rapid population expansion · Four or five stages: Stage 1 (pre-transition: high birth/death rates balance, population stable), Stage 2 (early transition: death rates drop due to improved sanitation, medicine, food supply, but birth rates remain high, population expands rapidly), Stage 3 (late transition: birth rates begin declining as societies urbanize, women educated, children cost more than contribute economically), Stage 4 (post-transition: both rates low and balanced, population stable or slowly growing), Stage 5 (proposed: birth rates fall below replacement level 2.1 children per woman, population aging and potentially shrinking) · Drivers of mortality decline: public health improvements (clean water, sewage systems, vaccination), medical advances (antibiotics, surgical techniques, maternal care), agricultural productivity (better nutrition, food security), economic development (reduced poverty, improved living conditions) · Drivers of fertility decline: urbanization (children shift from economic assets on farms to costs in cities), education especially for women (delays marriage and childbearing, provides alternatives to motherhood), child survival (parents need fewer births when confident children will survive), contraception availability (separates sex from reproduction), women's labor force participation (opportunity cost of childrearing rises) · Timing varies: Europe/North America took 100-200 years (1750s-1950s), East Asia compressed into 40-60 years (1950s-2000s), some Sub-Saharan African countries still in early stages · Demographic dividend occurs during Stage 2-3 transition when death rates fallen but birth rates not yet adjusted · Implications: population momentum (even with falling fertility, young population structure means continued growth for decades), aging populations (low fertility + high longevity = inverted age pyramid), migration pressures (demographic imbalances between regions create push/pull factors)`
        expandQuery = 'demographic transition model stages and global patterns'
      }

      // Technology concepts
      else if (/neural\s+interface|BCI/i.test(term)) {
        insight = `Brain-computer interface (BCI) — Technology enabling direct communication pathway between brain's electrical activity and external devices, bypassing traditional neuromuscular channels (no need for movement or speech) · Two main categories: invasive (electrodes surgically implanted into brain tissue for high-resolution signal detection, used for medical applications), non-invasive (external sensors like EEG caps read brain activity through scalp, lower resolution but no surgery) · How it works: brain activity generates electrical signals (action potentials, local field potentials), electrodes detect these signals, signal processing algorithms decode patterns associated with intentions or states, decoded signals control external devices (cursor, robotic arm, communication system) or provide feedback to brain · Current applications: medical restoration (paralyzed individuals control prosthetic limbs or communication devices using thought alone, locked-in syndrome patients spell words by thinking), sensory substitution (visual information routed to other sensory cortex for blind individuals), seizure detection (monitor brain activity to predict epileptic episodes), research tools (understand neural coding and brain function) · Key challenges: signal quality degrades over time as scar tissue forms around implants, decoding accuracy limited by complexity of neural patterns, ethical questions about cognitive enhancement and privacy of thoughts, invasive approaches require surgery with associated risks · Brain signals used: motor cortex activity (imagining movement generates signals), visual attention (where person looks or focuses), P300 wave (brain response to target stimuli), steady-state evoked potentials (brain's rhythmic response to flickering stimuli) · Not mind reading: current technology detects patterns associated with specific tasks or intentions user has trained system on, cannot extract arbitrary thoughts or memories · Future directions: bidirectional interfaces (not just brain→device but device→brain sensory feedback), higher channel counts (thousands vs hundreds of electrodes for finer resolution), wireless and long-lasting implants, brain-to-brain communication`
        expandQuery = 'how brain-computer interfaces work and current capabilities'
      } else if (/AGI|artificial\s+general\s+intelligence/i.test(term)) {
        insight = `Artificial General Intelligence (AGI) — Hypothetical AI system capable of understanding, learning, and applying knowledge across any intellectual domain at human-level or beyond, not limited to narrow tasks · Distinguishing characteristics: transfer learning (apply knowledge from one domain to completely different domains without retraining), abstract reasoning (handle novel situations never seen in training data), common sense understanding (intuitive grasp of how world works without explicit programming), goal flexibility (pursue new objectives not specified by creators), self-improvement (enhance own capabilities), and general problem-solving (tackle any cognitive task humans can) · Contrasts with narrow/weak AI: current systems excel at specific tasks (AlphaGo plays Go at superhuman level, GPT generates text, computer vision identifies objects) but cannot transfer capabilities—chess AI cannot play checkers, language models cannot drive cars, image recognizers cannot understand speech · Key unsolved challenges: symbol grounding problem (connecting abstract symbols/words to real-world meanings and experiences), frame problem (knowing what's relevant in a given situation among infinite possible considerations), common sense reasoning (understanding unstated assumptions and implicit context humans take for granted), causality vs correlation (distinguishing genuine cause-effect from mere statistical patterns), embodiment question (does intelligence require physical interaction with world, or can it emerge from pure computation?) · Approaches being explored: scaling up neural networks with massive compute and data (brute force approach), neurosymbolic AI (combining neural learning with symbolic logic and rules), world models (building internal simulations of environment to plan and reason), cognitive architectures (explicitly modeling human mental processes like perception, memory, attention), evolutionary algorithms (evolving AI through selection pressures like biological evolution) · Why difficult: human intelligence emerges from billions of neurons with trillions of connections developed through evolutionary selection over millions of years plus individual learning over decades, compressed into single lifetime—replicating this artificially involves either reverse-engineering brain architecture (still not fully understood) or discovering different paths to general intelligence · Philosophical debates: can machine ever be truly conscious or just simulate intelligence (philosophical zombie problem), would AGI have rights and moral status, is human-level intelligence sufficient or will systems vastly exceed us (intelligence explosion), can we maintain control over systems smarter than creators (alignment problem) · Not to be confused with: superintelligence (far exceeding human cognitive abilities in all domains), consciousness (subjective first-person experience), sentience (capacity to feel and perceive)`
        expandQuery = 'AGI definition requirements and current progress toward general intelligence'
      } else if (/technological\s+leapfrogging/i.test(term)) {
        insight = `Technological leapfrogging — Phenomenon where developing regions bypass intermediate stages of technology adoption, jumping directly to more advanced systems without investing in legacy infrastructure · Classic examples: mobile phones (many African and Asian countries skipped landline telephone networks entirely, going straight to mobile cellular in 1990s-2000s, enabling banking, internet access, and services without copper wire infrastructure), renewable energy (some nations bypassing centralized fossil fuel power plants and electrical grids, deploying distributed solar/wind with microgrids instead), digital payments (societies moving from cash directly to mobile money like M-Pesa in Kenya, avoiding credit card infrastructure), satellite internet (remote areas accessing broadband via Starlink without ever having cable or DSL) · Enabling factors: older technology's infrastructure costs and lock-in effects (sunk costs in legacy systems prevent incumbents from upgrading, but newcomers face no such constraints), decreasing costs of newer technology (solar panels, smartphones, computing power all declining exponentially making advanced tech accessible), modularity and scalability (newer systems often more flexible and easier to deploy incrementally than all-or-nothing infrastructure projects), globalization and knowledge transfer (developing countries can adopt proven technologies without repeating R&D) · Advantages: cost savings (avoid expensive infrastructure buildout), faster deployment (newer tech often quicker to install), better performance (latest generation systems superior to legacy), environmental benefits (skip polluting intermediate stages) · Challenges and limitations: requires human capital (operating/maintaining advanced tech needs skills developing regions may lack), assumes technology neutrality (but older infrastructure sometimes more robust for local conditions), path dependency still matters (some technological transitions require intermediate steps), uneven adoption (benefits concentrate in cities while rural areas lag) · Historical precedent: industrialization varied across nations (Britain went through steam→coal→oil sequentially over 200 years, but late industrializers like South Korea compressed this into decades by adopting most advanced technologies available), Green Revolution (countries without established agriculture systems could adopt high-yield varieties and modern techniques directly) · Not automatic: leapfrogging requires supportive policies (regulation, education, infrastructure), access to capital, technology transfer mechanisms, and local adaptation · Double-edged: while avoiding sunk costs in obsolete tech, also miss cumulative learning and institutional development that occurs during gradual technological progression`
        expandQuery = 'technological leapfrogging examples mechanisms and conditions for success'
      } else if (/DeFi/i.test(term)) {
        insight = `Decentralized Finance protocols — Peer-to-peer financial services on blockchain · No traditional intermediaries`
        expandQuery = 'DeFi protocols comparison'
      } else if (/smart\s+contract/i.test(term)) {
        insight = `Self-executing blockchain contracts — Automated enforcement without intermediaries · Core to DeFi and Web3`
        expandQuery = 'smart contract use cases'
      } else if (/autonomous/i.test(term)) {
        insight = `Self-driving technology — AI-powered navigation without human input · Sensors, computer vision, and decision algorithms`
        expandQuery = 'autonomous vehicle technology'
      }

      // Financial concepts
      else if (/CBDC/i.test(term)) {
        insight = `Central Bank Digital Currency — Government-issued digital money · Programmable, traceable alternative to cash`
        expandQuery = 'CBDC implementation worldwide'
      } else if (/crypto\s+portfolio/i.test(term)) {
        insight = `Digital asset investment portfolio — Diversified cryptocurrency holdings · Managed exposure across multiple tokens`
        expandQuery = 'crypto portfolio strategies'
      } else if (/carbon\s+credit/i.test(term)) {
        insight = `Tradeable emission reduction certificates — One credit = one ton CO2 offset · Market-based climate solution`
        expandQuery = 'carbon credit trading markets'
      } else if (/social\s+credit/i.test(term)) {
        insight = `Behavioral scoring system — Tracks citizen conduct and compliance · Impacts access to services and opportunities`
        expandQuery = 'social credit score systems'
      }

      // Urban concepts
      else if (/15.minute\s+city/i.test(term)) {
        insight = `Urban planning concept — All essential services within 15-minute walk/bike · Reduces car dependency and emissions`
        expandQuery = '15-minute city examples'
      } else if (/subterranean\s+city/i.test(term)) {
        insight = `Underground urban development — Climate-controlled infrastructure below ground · Space efficiency and disaster resilience`
        expandQuery = 'underground cities Singapore'
      }

      // Scientific concepts
      else if (/prefrontal\s+cortex/i.test(term)) {
        insight = `Brain region for executive function — Decision-making, planning, and impulse control · Last area to fully mature (mid-20s)`
        expandQuery = 'prefrontal cortex functions'
      } else if (/circadian\s+rhythm|sleep\s+cycle/i.test(term)) {
        insight = `Internal 24-hour biological clock — Regulates sleep-wake patterns and hormone release · Light exposure is primary regulator`
        expandQuery = 'circadian rhythm optimization'
      } else if (/vitamin\s+[A-Z]/i.test(term)) {
        const vitamin = term.match(/vitamin\s+([A-Z])/i)?.[1]
        insight = `Essential micronutrient — Required for various bodily functions · Deficiency causes specific health issues`
        expandQuery = `vitamin ${vitamin} deficiency symptoms`
      }

      // NO DEFAULT FALLBACK - Only annotate terms with SPECIFIC insights
      // If we don't have specific knowledge about a term, don't create a generic annotation
      else {
        return null // Skip - no specific insight available for this term
      }

      // Final check: Only return annotation if we have actual insight
      if (!insight || insight.length < 50) {
        return null // Skip - no meaningful insight to provide
      }

      return {
        term,
        content: insight,
        expandable: true,
        expandQuery,
        confidence: 0.9 // Higher confidence since we only annotate what we know well
      }
    }
  },

  // METRICS: Numbers, percentages, measurements, valuations, revenue
  {
    type: 'metric',
    patterns: [
      /(\d+(?:\.\d+)?)\s*(%|percent)/gi,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(users?|customers?|people|downloads?|stars?|subscribers?)/gi,
      /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|[KMB])/gi,
      /\$(\d+(?:\.\d+)?[+]?)\s*(?:billion|million)/gi,
      /(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?|hours?|days?)/gi,
      /(\d+(?:\.\d+)?)\s*[xX]\s*(faster|slower|more|less)/gi,
      /(\d+)\s*(?:qubits?|tokens?|parameters?)/gi,
      /valued\s+at\s+\$(\d+(?:\.\d+)?)\s*(billion|million)/gi,
      /\$(\d+(?:\.\d+)?[M+]+)\s*(?:ARR|revenue|valuation)/gi,
      /over\s+(\d+(?:,\d{3})*)\s+(?:paid\s+)?subscribers?/gi,
      /\$(\d+)M\+?\s*(?:ARR|annual\s+revenue)/gi,
    ],
    extractor: (match, context) => {
      const text = match[0]
      let insight = text
      let expandQuery = ''

      // Extract number for analysis
      const numMatch = text.match(/\$?(\d+(?:\.\d+)?)\+?\s*(?:billion|million|[BMK]|%)?/i)
      const num = numMatch ? parseFloat(numMatch[1]) : 0

      // ============ SELECTIVITY FILTER FOR METRICS ============
      // Skip trivial/obvious numbers that don't provide real insight

      // Skip very small percentages (< 3%) unless in specific meaningful contexts
      if (/%|percent/i.test(text) && num < 3 && !/(growth|increase|margin|profit)/i.test(context)) {
        return null // Too small to be meaningful
      }

      // Skip small user counts (< 100,000) unless it's a specific milestone
      if (/(users?|customers?|subscribers?)/i.test(text) && num < 100000 && !/(million|thousand|over)/i.test(text)) {
        return null // Too small for meaningful network effects analysis
      }

      // Skip time metrics under 100ms unless performance-critical
      if (/(ms|milliseconds?)/i.test(text) && num < 100 && !/(latency|response|load)/i.test(context)) {
        return null // Sub-100ms not usually annotated
      }

      // Skip common small multipliers (2x, 3x) unless significant
      if (/[xX]/.test(text) && num < 5 && !/(faster|performance|improvement)/i.test(context)) {
        return null // Small multipliers too common
      }

      // SKIP financial metrics - these are business advice, not concepts
      // Only annotate users/subscribers with conceptual network effects explanation
      if (/valued\s+at|valuation|ARR|annual\s+revenue|revenue/i.test(text)) {
        return null // Skip valuations and revenue - financial metrics, not conceptual insights
      } else if (/subscribers?|users?|customers?/i.test(text)) {
        // CONCEPTUAL: Explain what user count means, not business metrics
        insight = `${text} — User base size indicating adoption scale and network reach · Contextualizing ${num.toLocaleString()} ${text.includes('subscriber') ? 'subscribers' : 'users'}: ${num >= 1000000000 ? 'represents over 12% of global population (8 billion), reaching extreme scale comparable to Facebook 3B, YouTube 2.7B, WhatsApp 2.5B - requires distributed infrastructure across continents' : num >= 100000000 ? 'represents significant global platform (1.25%+ of world population), comparable to LinkedIn 900M, Twitter 450M, Telegram 800M - major cultural and social impact' : num >= 10000000 ? 'represents meaningful user base reaching ~0.125% of global population, large enough for network effects and viral growth, comparable to messaging apps, streaming services, or productivity tools in growth phase' : num >= 1000000 ? 'represents million-user milestone indicating successful product adoption, crosses threshold where statistical analysis becomes meaningful, user cohorts reveal patterns, retention/engagement metrics stabilize' : num >= 100000 ? 'represents hundred-thousand users showing initial market validation, still small enough for founders to understand user segments qualitatively while large enough for quantitative patterns to emerge' : 'represents early adoption phase where qualitative feedback from individual users more valuable than aggregate statistics, focus on understanding why users engage rather than optimizing metrics'} · Network dynamics at this scale: ${num >= 100000000 ? 'massive network effects (value increases exponentially with users, new user benefits from existing content/connections), faces challenges of content moderation, diverse cultural contexts, regulatory scrutiny across jurisdictions' : num >= 10000000 ? 'strong network effects emerging (each new user adds value to existing users through content, connections, or marketplace liquidity), critical mass for viral growth mechanisms' : num >= 1000000 ? 'network effects beginning to compound (user-generated content, social connections, or marketplace transactions create value for other users), approaching critical mass thresholds' : 'network effects not yet significant (value primarily from product features not user network), growth driven by solving individual user problems rather than network participation'} · Engagement patterns: ${num >= 10000000 ? 'diverse user segments emerge (power users, casual users, dormant users), requiring personalization and segmentation strategies' : num >= 100000 ? 'user cohorts distinguishable (early adopters vs mainstream, heavy vs light users), enabling targeted approaches' : 'relatively homogeneous user base (mostly early adopters sharing similar characteristics), easier to serve but harder to broaden appeal'} · Technical infrastructure implications: ${num >= 100000000 ? 'requires distributed systems (database sharding, multi-region deployment, CDN networks), petabytes of data, sub-second global latency targets' : num >= 10000000 ? 'moving beyond single-server architectures to microservices, caching layers, load balancing, requires specialized infrastructure team' : num >= 100000 ? 'can still run on monolithic architecture with database optimization, but beginning to hit scaling constraints' : 'manageable with standard web hosting, single database, minimal specialized infrastructure'} · Historical adoption patterns: ${num >= 10000000 ? 'achieving 10M+ users historically took decades (telephone took 60+ years to reach 10M in early 1900s) but modern platforms achieve in months-years (Instagram 1 year, ChatGPT 2 months to reach 100M)' : num >= 1000000 ? 'million-user milestone historically marked major platforms but adoption accelerating (Facebook took 10 months to reach 1M in 2004, modern platforms reach in weeks-months if viral)' : 'in early phase where growth rate matters more than absolute numbers, doubling user base every month typical for products finding product-market fit'}`
        expandQuery = `What does ${text} user count mean for platform scale and adoption`
      } else if (/%|percent/i.test(text)) {
        // CONCEPTUAL: Explain what percentage means, not financial implications
        if (context && /growth|increase|rise|surge|jump|climb/i.test(context)) {
          if (num > 50) insight = `${text} growth rate — Indicates quantity increased by more than half its original value over measurement period (typically year-over-year) · Mathematical meaning: (new value - old value) / old value × 100, so doubling represents 100% growth, tripling is 200% growth · Compound growth implications: at ${num}% annual growth rate, quantity doubles approximately every ${(72/num).toFixed(1)} years (rule of 72: 72 / growth rate), grows 10x in ${(Math.log(10)/Math.log(1+num/100)).toFixed(1)} years · Context for interpretation: ${num}% national GDP growth would be historically exceptional (fastest sustained economic expansions: post-war Japan 9-10%, China 1980s-90s peaked at 14%, most mature economies 2-4% typical), ${num}% population growth extremely rapid (global average 1.0%, fastest countries 3-4% mainly from immigration/high birth rates), ${num}% technology adoption common during explosive platform phases (internet 1995-2000, smartphones 2007-2013, social media 2005-2012) · Diminishing returns principle: much easier to achieve ${num}% growth from small base (100 → ${100*(1+num/100)} adds ${num} units) than large base (1 million → ${(1000000*(1+num/100)/1000).toFixed(0)}K adds ${(num*10).toFixed(0)}K units) · Sustainability considerations: very high growth rates (>50%) rarely sustainable beyond 3-7 years as markets mature, early adopters saturate, competition emerges, and addressable populations become constrained · Distinguishing real vs nominal: must account for inflation (20% nominal growth with 15% inflation = only 4.3% real growth in constant dollars: (1.20/1.15 - 1) × 100)`
          else insight = `${text} growth rate — Indicates quantity increased by ${num}% of its original value over measurement period · Mathematical calculation: (new - old) / old × 100 · At ${num}% annual growth: doubles every ${(72/num).toFixed(1)} years (rule of 72), starting with 100 units reaches ${(100*Math.pow(1+num/100,5)).toFixed(0)} after 5 years of compounding · Context: ${num}% GDP growth ${num < 5 ? 'typical for mature economies, modest but sustainable' : 'exceptional for national economy, often indicates catch-up growth or resource boom'}, ${num}% population growth ${num < 2 ? 'moderate for developing regions' : 'very rapid, typically from high birth rates or immigration'}, ${num}% technology penetration typical during ${num < 20 ? 'saturation/late majority phase' : 'early adoption/rapid expansion phase'} · Compounding effect: growth multiplies not adds, so three years of ${num}% growth = ${(Math.pow(1+num/100,3)*100 - 100).toFixed(1)}% total (not ${num*3}%), calculated as (1.${num<10?'0':''}${Math.round(num)})³ - 1 · Baseline comparisons: global GDP grows ~3% annually, human population ~1%, internet users grew ~15% in 2010s slowing to ~8% in 2020s as penetration saturates`
          expandQuery = `What does ${text} growth rate mean mathematically and contextually`
        } else if (context && /margin|profit|efficiency|productivity/i.test(context)) {
          insight = `${text} ${context && /margin/i.test(context) ? 'margin' : 'metric'} — ${context && /margin/i.test(context) ? `Indicates ${num}% of revenue remains as profit after costs deducted · Calculation: (revenue - costs) / revenue × 100 · ` : ''}Meaning depends heavily on industry context: capital-light businesses (software, consulting, media) often achieve ${num > 30 ? 'very high' : num > 15 ? 'healthy' : 'moderate'} margins because incremental costs near zero, while capital-intensive businesses (manufacturing, retail, logistics) typically operate at lower margins due to physical goods, inventory, distribution costs · Industry benchmarks: software/SaaS 70-90% gross margins and 15-30% net margins typical, retail 2-10% net margins (groceries 1-3%, electronics 5-8%), manufacturing 5-15%, financial services 10-25%, healthcare 8-20% · Trade-offs: high margins usually indicate specialized/differentiated offerings with pricing power (luxury goods, proprietary technology, monopoly/oligopoly positions), low margins suggest commoditized products in competitive markets or heavy reinvestment phase (Amazon operated at <5% for years while building infrastructure) · Absolute vs relative profitability: $1M profit on $10M revenue (10% margin) same absolute dollars as $10M profit on $100M revenue (also 10% margin), but second business 10x larger scale · Operational leverage: fixed costs (rent, salaries, infrastructure) spread over more units as volume increases, so margins often improve with scale (Walmart 2.5% margins but $600B revenue = $15B profit)`
          expandQuery = `What does ${text} percentage mean in this industry context`
        } else {
          insight = `${text} — Percentage representing part-to-whole relationship, calculated as (part / whole) × 100 · Interpretation requires knowing: what is the whole (denominator)? what is the part (numerator)? over what time period or population? · Statistical considerations: sample size matters for reliability (percentages from small samples have wide confidence intervals: 50% from 20 people has ±22% margin of error at 95% confidence, but 50% from 1000 people only ±3%), sampling method affects representativeness (random sample vs self-selected survey respondents), correlation ≠ causation (two variables both showing ${num}% changes doesn't mean one caused the other) · Common percentage types: growth rates (change over time), market share (portion of total market), conversion rates (percentage completing action), margins (profit as percentage of revenue), yield (return as percentage of investment), probability (likelihood as percentage 0-100%) · Baseline for comparison essential: ${num}% sounds impressive but meaningless without context (${num}% of what? compared to what alternative? over what timeframe?) · Percentage vs percentage points: going from 10% to 15% is +5 percentage points but 50% relative increase (5/10 = 0.5 = 50%), often confused in reporting · Compound percentage: consecutive percentage changes multiply not add (up 20% then down 20% ≠ back to original, actually 0.8 × 1.2 = 0.96 = 4% net loss)`
          expandQuery = `How to interpret ${text} percentage in proper context`
        }
      }

      return {
        content: insight,
        confidence: 0.95,
        expandable: true,
        expandQuery: expandQuery || `Detailed analysis of ${text}`
      }
    },
  },
  
  // FACTS: Named entities, dates, definitions
  {
    type: 'fact',
    patterns: [
      /(?:founded|established|created|launched)\s+(?:in\s+)?(\d{4})/gi,
      /(?:CEO|founder|CTO|president)\s+(?:is\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /(?:headquartered|based)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|are|was|were)\s+(?:a|an|the)\s+/gi,
    ],
    extractor: (match, context) => ({
      content: match[0],
      confidence: 0.85,
    }),
  },

  // DETAILS: Companies, products, AI models, platforms, technologies
  {
    type: 'detail',
    patterns: [
      // AI Companies & Products
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

      // Business Models & Categories
      /\b(Large\s+Language\s+Models?)\s*\(LLMs?\)/gi,
      /\b(LLMs?\s+as\s+Services?)/gi,
      /\b(AI\s+Infrastructure)/gi,
      /\b(enterprise\s+(?:solutions?|adoption|AI))/gi,
      /\b(open-source\s+model)/gi,

      // Quantum Computing & Advanced Tech
      /\b(quantum\s+(?:computing|computer|advantage|error|internet|mechanics))/gi,
      /\b(quantum\s+entanglement)/gi,
      /\b(entanglement)/gi,
      /\b(decoherence)/gi,
      /\b(error\s+correction(?:\s+codes?)?)/gi,
      /\b(quantum\s+error)/gi,
      /\b(topological\s+qubits?)/gi,
      /\b(qubits?)/gi,
      /\b(hybrid\s+classical-quantum)/gi,
      /\b(variational\s+quantum)/gi,
      /\b(superposition)/gi,
      /\b(Bell\s+inequality)/gi,
      /\b(spooky\s+action)/gi,
      /\b(quantum\s+cryptography)/gi,
      /\b(multiverse)/gi,
      /\b(Many-Worlds\s+Interpretation)/gi,
      /\b(parallel\s+universes?)/gi,
      /\b(wave\s+function\s+collapse)/gi,

      // Government Programs & Research Agencies
      /\b(DARPA)/gi,
      /\b(Defense\s+Advanced\s+Research\s+Projects?\s+Agency)/gi,
      /\b(NSF|National\s+Science\s+Foundation)/gi,
      /\b(NIH|National\s+Institutes?\s+of\s+Health)/gi,
      /\b(NIST|National\s+Institute\s+of\s+Standards)/gi,
      /\b(DoE|Department\s+of\s+Energy)/gi,
      /\b(DoD|Department\s+of\s+Defense)/gi,
      /\b(ARPA-E)/gi,
      /\b(IARPA)/gi,
      /\b(Air\s+Force\s+Research\s+Laboratory)/gi,
      /\b(AFRL)/gi,
      /\b(Naval\s+Research\s+Laboratory)/gi,
      /\b(classified\s+programs?)/gi,
      /\b(special\s+access\s+programs?)/gi,
      /\b(SAP|Special\s+Access\s+Program)/gi,

      // UAP/UFO Disclosure & Phenomena
      /\b(UAP|Unidentified\s+Aerial\s+Phenomena?)/gi,
      /\b(UFO|Unidentified\s+Flying\s+Objects?)/gi,
      /\b(AARO|All-domain\s+Anomaly\s+Resolution\s+Office)/gi,
      /\b(Pentagon\s+UAP\s+(?:report|disclosure|investigation))/gi,
      /\b(Tic\s+Tac\s+(?:incident|encounter|UFO))/gi,
      /\b(Nimitz\s+encounter)/gi,
      /\b(AATIP|Advanced\s+Aerospace\s+Threat)/gi,
      /\b(disclosure\s+(?:timeline|events?|hearings?))/gi,
      /\b(congressional\s+UAP\s+hearing)/gi,
      /\b(Grusch\s+testimony)/gi,
      /\b(non-human\s+intelligence)/gi,
      /\b(craft\s+retrieval\s+programs?)/gi,

      // Patents & Intellectual Property
      /\b(patent|patents|patented)/gi,
      /\b(USPTO|US\s+Patent\s+Office)/gi,
      /\b(intellectual\s+property)/gi,
      /\b(prior\s+art)/gi,
      /\b(patent\s+portfolio)/gi,
      /\b(trade\s+secrets?)/gi,
      /\b(licensing\s+(?:deal|agreement))/gi,
      /\b(patent\s+infringement)/gi,
      /\b(provisional\s+patent)/gi,

      // Startup/Business Terms
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

      // AI Techniques & Architectures
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

      // AI Capabilities & Applications
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

      // AI Benchmarks & Evaluation
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

      // Biology & Life Sciences
      /\b(protein\s+(?:structure\s+)?prediction)/gi,
      /\b(AlphaFold)/gi,
      /\b(protein\s+folding)/gi,
      /\b(RNA|DNA\s+sequences?)/gi,
      /\b(RNA\s+and\s+DNA)/gi,
      /\b(genome\s+sequencing)/gi,
      /\b(genetic\s+engineering)/gi,
      /\b(bioinformatics)/gi,
      /\b(drug\s+discovery)/gi,
      /\b(clinical\s+trials?)/gi,
      /\b(antibody\s+design)/gi,

      // Scientific Concepts (Beyond Quantum)
      /\b(CRISPR|gene\s+editing)/gi,
      /\b(mRNA\s+(?:vaccine|technology))/gi,
      /\b(fusion\s+energy)/gi,
      /\b(tokamak)/gi,
      /\b(ITER\s+project)/gi,
      /\b(nuclear\s+fusion)/gi,
      /\b(cold\s+fusion)/gi,
      /\b(graphene)/gi,
      /\b(carbon\s+nanotubes?)/gi,
      /\b(metamaterials?)/gi,
      /\b(room-temperature\s+superconductor)/gi,
      /\b(LK-99)/gi,
      /\b(dark\s+matter)/gi,
      /\b(dark\s+energy)/gi,
      /\b(Higgs\s+boson)/gi,
      /\b(Large\s+Hadron\s+Collider)/gi,
      /\b(LHC)/gi,
      /\b(CERN)/gi,

      // Technical/Scientific terms
      /\b(tectonic\s+(?:plate|boundary|boundaries|zones?|areas?))/gi,
      /\b(central\s+continental\s+areas?)/gi,
      /\b(coastal\s+(?:terrain|regions?|areas?|zones?))/gi,
      /\b(natural\s+barriers?)/gi,
      /\b(bathymetry)/gi,
      /\b((?:eastern|western|northern|southern)\s+(?:Africa|Australia|Asia|Europe|America))/gi,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:Zones?|Areas?|Regions?))/gi,
      /\b(underwater\s+topography)/gi,
    ],
    extractor: (match, context) => {
      const term = match[0]

      // AI Companies & Products - CONCEPTUAL ONLY (no financial metrics)
      if (/OpenAI|ChatGPT|GPT-4|GPT/i.test(term)) {
        return {
          content: 'AI research organization known for large language models (LLMs) · ChatGPT popularized conversational AI (launched Nov 2022, reaching 100M users in 2 months - fastest consumer app adoption in history) · GPT-4 marked advancement in reasoning, multimodal capabilities (text + images) · API enables developers to integrate AI into applications · Key innovations: transformer architecture improvements, reinforcement learning from human feedback (RLHF), instruction-following · Competes with Anthropic (Claude), Google (Gemini), Meta (Llama)',
          confidence: 0.98,
          expandable: true,
          expandQuery: `OpenAI technology innovations and AI model evolution`
        }
      }
      if (/Anthropic|Claude/i.test(term)) {
        return {
          content: 'AI safety-focused research organization founded by former OpenAI researchers (2021) · Claude models emphasize harmlessness, honesty, helpfulness (Constitutional AI approach) · Technical strengths: extended context windows (200K tokens enabling full-book analysis), nuanced instruction-following, reduced hallucinations · AWS partnership provides cloud infrastructure · Competes with OpenAI (GPT), Google (Gemini) · Mission: build reliable, interpretable, steerable AI systems',
          confidence: 0.95,
          expandable: true,
          expandQuery: `Anthropic AI safety approach and Constitutional AI methodology`
        }
      }
      if (/Google.*(?:Bard|Gemini|PaLM)/i.test(term)) {
        return {
          content: 'Google\'s family of large language models · Gemini (successor to PaLM and Bard) offers multimodal capabilities (text, images, video, audio, code) · Integrated into Google Workspace (Gmail, Docs, Sheets for productivity) and Search · Technical advantage: access to Google\'s massive data corpus, compute infrastructure, and distribution channels · Competes with OpenAI (GPT-4), Anthropic (Claude) · Evolution: LaMDA → PaLM → Bard → Gemini showing rapid iteration',
          confidence: 0.95,
          expandable: true,
          expandQuery: `Google Gemini technical capabilities and Workspace integration`
        }
      }
      if (/Hugging\s+Face/i.test(term)) {
        return {
          content: 'Open-source AI platform hosting 500K+ machine learning models and 250K+ datasets · Community-driven: 10M+ developers collaborate, share models, and build applications · Infrastructure services: model hosting, inference API, AutoTrain for fine-tuning · Democratizes access to state-of-the-art AI (anyone can download and run models locally or via API) · Comparable to GitHub for AI models · Competes with closed platforms like AWS SageMaker, Google Vertex AI · Moat: network effects from community contributions',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Hugging Face platform capabilities and open-source AI ecosystem`
        }
      }
      if (/Stability\s+AI|Stable\s+Diffusion/i.test(term)) {
        return {
          content: 'AI company specializing in open-source generative models · Stable Diffusion: text-to-image model using latent diffusion (generates images from text descriptions) · Open-source approach allows anyone to run locally, modify, or integrate into applications (contrasts with closed systems like DALL-E, Midjourney) · Technical innovation: efficient latent space diffusion enabling generation on consumer GPUs · Applications: art creation, product design, game assets, marketing visuals · Challenges: balancing open-source ethos with sustainable business model',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Stable Diffusion technical architecture and open-source image generation`
        }
      }
      if (/GitHub\s+Copilot/i.test(term)) {
        return {
          content: 'AI-powered code completion tool integrated into development environments (VS Code, JetBrains, Neovim) · Powered by OpenAI Codex (LLM trained on public code repositories) · Functionality: suggests entire functions, translates comments to code, provides context-aware completions · Adoption metrics: developers report 40% code acceptance rate (nearly half of suggestions used) · Owned by Microsoft (GitHub parent) · Competes with Amazon CodeWhisperer, Tabnine · Controversy: training on public code raises copyright/licensing questions',
          confidence: 0.93,
          expandable: true,
          expandQuery: `GitHub Copilot subscriber growth, enterprise adoption, and developer productivity impact`
        }
      }
      if (/Character\.AI/i.test(term)) {
        return {
          content: 'AI chatbot platform allowing conversations with AI characters (fictional, historical, or user-created personalities) · Technology: large language models fine-tuned for personality consistency and engaging dialogue · Use cases: entertainment, companionship, roleplay, creative writing · Notable for extreme user engagement (avg 2+ hour sessions, significantly higher than typical social apps) · Competes with Replika (therapeutic focus), Snapchat My AI (social integration) · Raises questions about parasocial relationships and emotional attachment to AI',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Character.AI technology and user engagement patterns`
        }
      }
      if (/Jasper\s+AI/i.test(term)) {
        return {
          content: 'AI writing assistant specialized for marketing content · Applications: blog posts, ad copy, social media, product descriptions, email campaigns · Technology: large language models trained on marketing copy (emphasizes persuasive tone, SEO optimization, brand voice consistency) · Used by 100K+ marketers and content creators · Competes with Copy.ai, Writesonic, general-purpose tools like ChatGPT · Enterprise features: team collaboration, brand voice templates, workflow integrations with CMS platforms',
          confidence: 0.87,
          expandable: true,
          expandQuery: `Jasper AI content marketing capabilities and enterprise features`
        }
      }
      if (/Midjourney/i.test(term)) {
        return {
          content: 'AI image generation service accessed via Discord bot · Technology: diffusion models creating images from text prompts · Known for artistic, painterly aesthetic (distinguishable from Stable Diffusion\'s more photorealistic style) · Distribution model: Discord-native (users interact in shared servers, creating community around AI art) · 15M+ registered users, 2M+ paying subscribers · Competes with DALL-E (OpenAI), Stable Diffusion (open-source), Adobe Firefly (integrated into Creative Suite) · Bootstrapped and profitable (unusual in AI space)',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Midjourney artistic style and Discord-based community model`
        }
      }

      // Technical concepts - CONCEPTUAL ONLY
      if (/LLMs?|Large\s+Language\s+Models?/i.test(term)) {
        return {
          content: 'Large language models — Neural networks trained on massive text corpora (trillions of words) to understand and generate human-like text · Architecture: primarily transformers (attention mechanisms enabling parallel processing of long sequences) · Scale: billions to trillions of parameters (GPT-4 estimated 1.76T, PaLM 540B, Llama 2 70B) · Training process: unsupervised pre-training on general text, then supervised fine-tuning on specific tasks, often with reinforcement learning from human feedback (RLHF) · Capabilities: text generation, translation, summarization, question-answering, code generation, reasoning · Limitations: hallucinations (generating plausible but false information), lack of true understanding, training data cutoff dates, context window limits · Leading examples: OpenAI GPT series, Anthropic Claude, Google Gemini/PaLM, Meta Llama (open-source)',
          confidence: 0.95,
          expandable: true,
          expandQuery: `LLM architecture, training process, and technical capabilities`
        }
      }
      if (/AI\s+Infrastructure/i.test(term)) {
        return {
          content: 'AI infrastructure — Cloud platforms and tooling for deploying machine learning models at scale · Components: model hosting (serving predictions via API), fine-tuning (adapting pre-trained models to specific tasks), vector databases (storing embeddings for semantic search), inference optimization (reducing latency and cost) · Major platforms: AWS SageMaker (integrated with AWS ecosystem), Google Vertex AI (tight integration with TensorFlow/JAX), Azure ML (OpenAI partnership), Hugging Face (open-source focused) · Technical challenges: GPU availability and cost, model versioning, A/B testing, monitoring for drift, handling traffic spikes · Differs from traditional web infrastructure in compute intensity (GPUs vs CPUs), batch vs real-time processing trade-offs, model size constraints',
          confidence: 0.9,
          expandable: true,
          expandQuery: `AI infrastructure platforms and deployment challenges`
        }
      }
      if (/enterprise\s+(?:solutions?|adoption|AI)/i.test(term)) {
        return {
          content: '🏢 B2B AI deployments · ARPU: $50K-500K+/year (vs $10-20/mo consumer) · Adoption: 65% of enterprises testing AI (2024) · Use cases: customer service, code generation, document processing, data analysis · ROI: 15-40% productivity gains · Concerns: security, compliance, hallucinations',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Enterprise AI adoption trends, ROI metrics, and implementation challenges`
        }
      }
      if (/open-source\s+model/i.test(term)) {
        return {
          content: '📖 Freely available AI models · Examples: Meta Llama 2/3, Mistral, Falcon · Strategy: community-driven development, enterprise support revenue · Trade-off: lower costs but self-hosting complexity · Market: growing (30% of deployments) · Vendors: Hugging Face, Together AI, Replicate',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Open-source vs proprietary AI model economics and adoption patterns`
        }
      }

      // Quantum Computing & Advanced Tech
      if (/quantum\s+(?:computing|computer|advantage|error|internet)/i.test(term)) {
        return {
          content: '⚛️ Quantum computing · Leverage quantum mechanics for computation · Key challenges: decoherence, error rates, scalability · Applications: cryptography, drug discovery, optimization · Current state: 50-1000 qubits (noisy) · Timeline: 10+ years to fault-tolerant',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Latest breakthroughs in quantum computing and commercial readiness`
        }
      }
      if (/decoherence/i.test(term)) {
        return {
          content: '🌊 Quantum decoherence · Loss of quantum state due to environmental interaction · Main obstacle to practical quantum computing · Solutions: error correction codes, cryogenic cooling, topological qubits · Research focus: extending coherence time',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Decoherence mitigation strategies and current research`
        }
      }
      if (/(?:error\s+correction|quantum\s+error)/i.test(term)) {
        return {
          content: '🛡️ Quantum error correction · Uses multiple physical qubits to create logical qubits · Examples: surface codes, topological codes · Challenge: requires 1000s of physical qubits per logical qubit · Breakthrough needed for fault-tolerant quantum computing',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Progress in quantum error correction and threshold requirements`
        }
      }
      if (/(?:topological\s+qubits?|anyons)/i.test(term)) {
        return {
          content: '🔷 Topological qubits · Store information in global topology (immune to local errors) · Material: anyons in 2D materials · Companies: Microsoft (Station Q) · Status: experimental, not yet demonstrated at scale',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Topological qubits vs other approaches and commercialization timeline`
        }
      }
      if (/qubits?/i.test(term)) {
        return {
          content: '⚡ Qubits (quantum bits) · Fundamental unit of quantum information · Properties: superposition, entanglement · Types: superconducting, trapped ion, photonic, topological · Current record: ~1000 qubits (Google, IBM) · Challenge: maintaining quantum state',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Qubit technologies comparison and scalability roadmap`
        }
      }
      if (/(?:hybrid\s+classical-quantum|variational)/i.test(term)) {
        return {
          content: '🔀 Hybrid quantum-classical · Combines classical computers with quantum processors · Examples: VQE (chemistry), QAOA (optimization) · Advantage: near-term quantum utility with limited qubits · Use cases: materials science, drug discovery, logistics',
          confidence: 0.87,
          expandable: true,
          expandQuery: `Hybrid quantum algorithms and commercial applications`
        }
      }
      if (/quantum\s+entanglement|entanglement/i.test(term)) {
        return {
          content: '🎭 Quantum entanglement · Particles remain correlated regardless of distance · Einstein\'s "spooky action" · Key facts: instantaneous correlation (no communication), breaks classical physics, basis for quantum computing & cryptography · Verified: Bell tests (2015, 2022 Nobel Prize) · Applications: quantum teleportation, secure communication',
          confidence: 0.95,
          expandable: true,
          expandQuery: `How entanglement enables quantum computing and cryptography`
        }
      }
      if (/Bell\s+inequality|spooky\s+action/i.test(term)) {
        return {
          content: '🔔 Bell inequality violations · Proves quantum entanglement is real (not hidden variables) · First test: 1972 (Freedman-Clauser) · Definitive: 2015 (loophole-free) · 2022 Nobel Prize (Aspect, Clauser, Zeilinger) · Confirms nature is fundamentally non-local · Used to verify quantum systems',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Bell test experiments and implications for quantum theory`
        }
      }
      if (/quantum\s+cryptography/i.test(term)) {
        return {
          content: '🔐 Quantum cryptography (QKD) · Unbreakable encryption using quantum mechanics · Key distribution detects eavesdropping (collapses quantum state) · Commercial: ID Quantique, Toshiba · Networks: China (2000+ km), EU Quantum Internet Alliance · Limitation: distance (currently <1000 km without repeaters) · Post-quantum alternative: lattice-based crypto',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Quantum cryptography deployment and commercial adoption`
        }
      }
      if (/multiverse|parallel\s+universes?/i.test(term)) {
        return {
          content: '🌌 Multiverse theory · Multiple universes may exist simultaneously · Types: (1) Many-Worlds (quantum branching), (2) Cosmological (infinite space), (3) Eternal inflation (bubble universes) · Evidence: none direct, but explains fine-tuning · Status: speculative, unfalsifiable by current science · Proponents: Everett, Tegmark, Greene',
          confidence: 0.82,
          expandable: true,
          expandQuery: `Scientific evidence and criticisms of multiverse theory`
        }
      }
      if (/Many-Worlds\s+Interpretation/i.test(term)) {
        return {
          content: '🌿 Many-Worlds Interpretation (MWI) · Every quantum measurement branches reality into parallel universes · Proposed: Hugh Everett (1957) · All outcomes occur, each in separate branch · No wave function collapse · Avoids measurement problem · Criticism: unfalsifiable, Occam\'s razor violation · Support: ~20% of physicists (2011 poll)',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Many-Worlds Interpretation vs Copenhagen interpretation debate`
        }
      }
      if (/wave\s+function\s+collapse/i.test(term)) {
        return {
          content: '📉 Wave function collapse · Quantum superposition becomes definite state upon measurement · Copenhagen interpretation: collapse is real · Many-Worlds: no collapse, just branching · Decoherence theory: environment causes effective collapse · Measurement problem: still unsolved after 100 years · Experiments: delayed choice quantum eraser',
          confidence: 0.83,
          expandable: true,
          expandQuery: `Measurement problem and competing interpretations of quantum mechanics`
        }
      }
      if (/superposition/i.test(term)) {
        return {
          content: '⚡ Quantum superposition · Particle exists in multiple states simultaneously until measured · Famous example: Schrödinger\'s cat (alive + dead) · Mathematical: linear combination of eigenstates · Breaks down: decoherence from environment (~10⁻⁶ seconds for atoms) · Enables: quantum computing (qubits in 0+1 state) · Observed: double-slit experiment, quantum interference',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Superposition in quantum computing and experimental verification`
        }
      }

      // Technical/Scientific terms
      if (/tectonic/i.test(term)) {
        return {
          content: '🌍 Tectonic plates · Earth\'s lithosphere divided into ~15 major plates · Move 2-15 cm/year (continental drift) · Boundaries: divergent (new crust), convergent (subduction, mountains), transform (earthquakes) · Earthquakes: 90% occur at plate boundaries · Theory accepted: 1960s (Wegener vindicated) · Evidence: GPS measurements, seafloor spreading',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Tectonic plate movement and earthquake prediction`
        }
      }
      if (/bathymetry/i.test(term)) {
        return {
          content: '🌊 Bathymetry · Measurement of ocean floor depth · Methods: sonar, satellites, AUVs · Deepest: Mariana Trench (10,994m) · Average ocean depth: 3,688m · Applications: submarine navigation, resource exploration, climate modeling, tsunami prediction · Unmapped: ~80% of ocean floor at high resolution',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Ocean floor mapping technology and discoveries`
        }
      }
      if (/(eastern|western|northern|southern)\s+(Africa|Australia|Asia|Europe)/i.test(term)) {
        return {
          content: `🗺️ Geographic region · Distinct climate, geology, biodiversity · Cultural and economic characteristics vary by location · Scientific interest: natural resources, ecosystems, geological activity`,
          confidence: 0.8,
          expandable: true,
          expandQuery: `Regional characteristics and significance of ${term}`
        }
      }

      // Government Programs & Research Agencies
      if (/DARPA|Defense\s+Advanced\s+Research/i.test(term)) {
        return {
          content: '🛡️ DARPA · Defense Advanced Research Projects Agency · Budget: $4B+/year · Created: 1958 (response to Sputnik) · Achievements: internet (ARPANET), GPS, stealth tech, mRNA vaccines · Current focus: AI, hypersonics, quantum, biotech · Model: high-risk, high-reward research · Success rate: ~10% of projects transition to military use',
          confidence: 0.96,
          expandable: true,
          expandQuery: `DARPA current programs, budget allocation, and breakthrough technologies`
        }
      }
      if (/NSF|National\s+Science\s+Foundation/i.test(term)) {
        return {
          content: '🔬 NSF · National Science Foundation · Budget: $9.5B (2024) · Funds: 25% of federally-funded basic research at US universities · Focus: all non-medical sciences · Grants: competitive peer review (~20% acceptance) · Impact: 235 Nobel Prizes by NSF-funded researchers · Major programs: STEM education, infrastructure (telescopes, supercomputers)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `NSF grant programs, funding priorities, and scientific impact`
        }
      }
      if (/NIH|National\s+Institutes?\s+of\s+Health/i.test(term)) {
        return {
          content: '🧬 NIH · National Institutes of Health · Budget: $47B (2024) - largest biomedical research funder · 27 institutes & centers · Funds: 80% external (universities, hospitals), 10% intramural · Major: cancer research ($7B), NIAID ($6.3B), brain (BRAIN Initiative) · Achievements: COVID vaccines, cancer immunotherapy, gene therapy · Grants: R01 (investigator-initiated), ~20% funded',
          confidence: 0.95,
          expandable: true,
          expandQuery: `NIH funding priorities, major research breakthroughs, and grant success rates`
        }
      }
      if (/NIST|National\s+Institute\s+of\s+Standards/i.test(term)) {
        return {
          content: '📏 NIST · National Institute of Standards and Technology · Budget: $1.5B · Mission: measurement standards, technology innovation · Impact: defines kilogram, second, meter · Cybersecurity: NIST frameworks (widely adopted) · Quantum: post-quantum cryptography standards (2024) · Manufacturing: Advanced Manufacturing Technology Consortia',
          confidence: 0.92,
          expandable: true,
          expandQuery: `NIST standards, cybersecurity frameworks, and quantum cryptography`
        }
      }
      if (/classified\s+programs?|special\s+access\s+program|SAP/i.test(term)) {
        return {
          content: '🔒 Special Access Programs (SAP) · Highly classified government projects · Levels: Confidential, Secret, Top Secret, SCI (Sensitive Compartmented Information) · Black budget: estimated $50-80B annually (exact unknown) · Examples: stealth bomber (1980s), UAP research (alleged) · Oversight: limited Congressional access · Compartmentalization: need-to-know basis',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Declassified special access programs and black budget research`
        }
      }

      // UAP/UFO Disclosure
      if (/UAP|UFO|Unidentified\s+(?:Aerial|Flying)/i.test(term)) {
        return {
          content: '🛸 UAP · Unidentified Anomalous Phenomena · Pentagon confirmed: videos authentic (2020) · AARO: All-domain Anomaly Resolution Office (DoD) · Key incidents: Nimitz (2004), Roosevelt (2014-15), Tic Tac · Characteristics: hypersonic speeds, no propulsion, trans-medium travel · Congress: multiple hearings (2022-2024) · Stigma reducing in military/scientific community',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Pentagon UAP reports, AARO findings, and scientific analysis`
        }
      }
      if (/AARO|All-domain\s+Anomaly/i.test(term)) {
        return {
          content: '🏛️ AARO · All-domain Anomaly Resolution Office · Established: 2022 (DoD directive) · Mission: detect, identify, attribute UAP · Director: Dr. Sean Kirkpatrick (2022-2023), then Dr. Jon Kosloski · Reports: semi-annual to Congress · Cases: 800+ reviewed, most explained (balloons, drones), ~5% remain unexplained · Goal: transparency, science-based investigation',
          confidence: 0.93,
          expandable: true,
          expandQuery: `AARO UAP investigation findings and unexplained cases`
        }
      }
      if (/Nimitz\s+encounter|Tic\s+Tac/i.test(term)) {
        return {
          content: '✈️ Nimitz UAP Encounter (2004) · USS Nimitz carrier strike group · Pilots: Cmdr. David Fravor, Lt. Cmdr. Alex Dietrich · Object: "Tic Tac" shape, 40ft long, white · Behavior: instant acceleration (0-hypersonic), no wings/propulsion, jammed radar · Pentagon: video declassified 2017 · Significance: multiple sensors (radar, FLIR, eyewitness) · No conventional explanation accepted',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Nimitz encounter pilot testimony and sensor data analysis`
        }
      }
      if (/Grusch\s+testimony|non-human\s+intelligence|craft\s+retrieval/i.test(term)) {
        return {
          content: '🗣️ David Grusch Testimony (2023) · Former Air Force intel officer, UAP Task Force · Claims: US has retrieved "non-human" craft · Congressional hearing: July 2023 (under oath) · Allegations: crash retrieval programs, reverse engineering, biologics recovered · Verification: ICIG (Inspector General) found credible & urgent · Status: unverified publicly, calls for further investigation · Controversy: no physical evidence shown',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Grusch testimony credibility assessment and government response`
        }
      }

      // Patents & Intellectual Property
      if (/patent|USPTO|US\s+Patent/i.test(term)) {
        return {
          content: '📜 Patents · Exclusive rights for inventions (20 years from filing) · Types: utility (function), design (appearance), plant · USPTO: ~600K applications/year, ~350K granted · Cost: $5K-15K to file+prosecute · Requirements: novel, non-obvious, useful · Global: PCT (Patent Cooperation Treaty) for international · Top filers: IBM, Samsung, Canon · Defensive: prevent others from using, offensive: licensing revenue',
          confidence: 0.91,
          expandable: true,
          expandQuery: `Patent filing strategy, costs, and enforcement tactics`
        }
      }
      if (/intellectual\s+property|IP|trade\s+secrets?/i.test(term)) {
        return {
          content: 'Intellectual property (IP) — Legal rights protecting creations of the mind · Four main types: patents (inventions, processes), trademarks (brand identifiers), copyrights (creative works), trade secrets (confidential business information) · Duration: patents (20 years from filing), copyrights (author\'s life + 70 years), trademarks (renewable indefinitely while in use), trade secrets (until disclosed or reverse-engineered) · Trade-offs: patents require public disclosure in exchange for monopoly, trade secrets protect indefinitely but no recourse if independently discovered (e.g., Coca-Cola formula protected as trade secret for 130+ years) · Enforcement: patent litigation costly ($1M-5M for trial), copyright/trademark enforcement varies by jurisdiction, trade secrets rely on NDAs and security · Represents significant economic value (~38% of US GDP or $6.6T from IP-intensive industries) · Strategy: defensive (prevent others from using), offensive (license for revenue), patent pools (cross-licensing to avoid litigation)',
          confidence: 0.89,
          expandable: true,
          expandQuery: `Intellectual property types, protection mechanisms, and enforcement`
        }
      }

      // SKIP all startup/business financial terms - these are business advice, not concepts
      if (/Series\s+[A-F]\s+funding|seed\s+round|pre-seed|unicorn|ARR|MRR|burn\s+rate|runway|CAC|LTV|Y\s+Combinator|YC/i.test(term)) {
        return null // Skip financial/business metrics - not conceptual insights
      }
      if (/product-market\s+fit|PMF/i.test(term)) {
        return {
          content: 'Product-market fit (PMF) — State where product satisfies strong market demand · Concept coined by Marc Andreessen: "being in a good market with a product that can satisfy that market" · Indicators: users organically recommend product, growth accelerates without paid marketing, retention curves flatten (users stick around), support queries focus on advanced features not basics · Pre-PMF characteristics: slow/inconsistent growth, high churn, qualitative feedback suggests "nice to have" not "must have", founders push product rather than market pulling it · Post-PMF characteristics: sustainable organic growth, word-of-mouth acquisition, team struggles to keep up with demand, clear user archetypes emerge · Misconception: PMF is binary moment, but actually continuous spectrum and can be lost if market shifts or competitors improve · Sean Ellis test: survey users "how would you feel if you could no longer use this product?" — if >40% say "very disappointed" suggests strong PMF · Mistake: premature scaling (investing heavily in growth/infrastructure before achieving PMF wastes resources on wrong product)',
          confidence: 0.93,
          expandable: true,
          expandQuery: `Product-market fit validation methods and indicators`
        }
      }
      if (/Sequoia\s+Capital|a16z|Andreessen\s+Horowitz/i.test(term)) {
        return null // Skip VC firms - financial/investment entities, not conceptual insights
      }

      // AI Techniques & Architectures
      if (/RAG|Retrieval-Augmented\s+Generation|retrieval-augmented/i.test(term)) {
        return {
          content: '🔍 RAG · Retrieval-Augmented Generation · Combines LLM with external knowledge retrieval · How: (1) query → (2) fetch relevant docs → (3) LLM generates with context · Benefits: reduces hallucinations, up-to-date info, cites sources · Used by: ChatGPT (web browsing), Perplexity, Bing Chat · Vector DBs: Pinecone, Weaviate, Chroma · Accuracy: +40% vs pure LLM',
          confidence: 0.94,
          expandable: true,
          expandQuery: `RAG implementation best practices and vector database comparison`
        }
      }
      if (/multi-agent\s+systems?|agent\s+systems?/i.test(term)) {
        return {
          content: '🤖 Multi-Agent Systems · Multiple AI agents collaborating on tasks · Architecture: specialized agents (researcher, coder, critic) coordinate via messaging · Frameworks: AutoGPT, BabyAGI, CrewAI, MetaGPT · Benefits: task decomposition, parallel processing, specialization · Challenges: coordination overhead, cost ($0.50-2/complex task) · Use cases: software development, research, complex problem-solving',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Multi-agent AI frameworks comparison and deployment costs`
        }
      }
      if (/transformer\s+(?:models?|architecture)|attention\s+mechanism|self-attention/i.test(term)) {
        return {
          content: '🔄 Transformer Architecture · "Attention is All You Need" (2017 Google paper) · Mechanism: parallel processing with attention weights · Key innovation: self-attention replaces RNNs (faster, better long-range dependencies) · Powers: GPT, BERT, T5, all modern LLMs · Variants: encoder-only (BERT), decoder-only (GPT), encoder-decoder (T5) · Impact: enabled ChatGPT, AlphaFold, Stable Diffusion',
          confidence: 0.93,
          expandable: true,
          expandQuery: `Transformer architecture evolution and attention mechanism explained`
        }
      }
      if (/fine-tuning|fine-tuned/i.test(term)) {
        return {
          content: '⚙️ Fine-Tuning · Adapting pre-trained model to specific task · Process: start with base model → train on domain data → specialized model · Cost: $50-5K (LoRA), $5K-100K (full) · Time: hours to days · vs RAG: fine-tuning changes model weights, RAG adds context · Use when: specific style/format, domain expertise, consistent performance · Tools: Hugging Face, OpenAI API, Axolotl',
          confidence: 0.91,
          expandable: true,
          expandQuery: `Fine-tuning vs RAG cost comparison and use cases`
        }
      }
      if (/RLHF|reinforcement\s+learning\s+from\s+human\s+feedback/i.test(term)) {
        return {
          content: '👍 RLHF · Reinforcement Learning from Human Feedback · How: (1) humans rank outputs → (2) train reward model → (3) optimize LLM for higher rewards · Invented: OpenAI (InstructGPT 2022) · Impact: GPT-3 → ChatGPT transformation · Alternatives: RLAIF (AI feedback), Constitutional AI · Cost: $50K-500K (human labelers) · Result: helpful, harmless, honest AI',
          confidence: 0.93,
          expandable: true,
          expandQuery: `RLHF implementation costs and Constitutional AI comparison`
        }
      }
      if (/prompt\s+engineering/i.test(term)) {
        return {
          content: '✍️ Prompt Engineering · Crafting inputs to optimize LLM outputs · Techniques: few-shot (examples), chain-of-thought (reasoning steps), role-playing, constraints · Advanced: ReAct (reasoning+acting), Tree of Thoughts (exploration), self-consistency · Impact: +50% accuracy on complex tasks · Tools: LangChain, PromptBase · Skill: high-demand ($100-300/hr freelance) · Future: automated prompt optimization',
          confidence: 0.90,
          expandable: true,
          expandQuery: `Advanced prompt engineering techniques and optimization frameworks`
        }
      }
      if (/diffusion\s+models?/i.test(term)) {
        return {
          content: '🎨 Diffusion Models · Iterative denoising for image generation · Process: (1) add noise to image → (2) train model to reverse → (3) generate from pure noise · Invented: 2015 (Ho et al.), popularized 2022 · Models: Stable Diffusion, DALL-E 2, Midjourney · Quality: photorealistic, controllable · Speed: 50 steps (~5s GPU) vs GAN (~0.1s) · Applications: art, design, video, 3D',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Diffusion models vs GANs for image generation quality and speed`
        }
      }

      // AI Capabilities
      if (/image\s+generation|text-to-image|photorealistic/i.test(term)) {
        return {
          content: '🖼️ AI Image Generation · Text → photorealistic images · Leaders: Midjourney (best quality), DALL-E 3 (safety), Stable Diffusion (open-source) · Quality: indistinguishable from photos (many cases) · Speed: 10-60 seconds · Cost: $10-30/month unlimited · Use cases: marketing, design, concept art, product mockups · Controversy: copyright, artist displacement, deepfakes',
          confidence: 0.91,
          expandable: true,
          expandQuery: `AI image generation tools comparison and copyright issues`
        }
      }
      if (/code\s+generation|code\s+completion/i.test(term)) {
        return {
          content: '💻 AI Code Generation · Automated code from natural language · Tools: GitHub Copilot ($10/mo), ChatGPT, Cursor, Replit AI · Capabilities: autocomplete, refactor, debug, test generation, entire functions · Quality: 40% acceptance rate (Copilot) · Productivity: +55% faster (GitHub study 2022) · Languages: Python, JS, TS best; niche languages weaker · Concern: license compliance, security',
          confidence: 0.93,
          expandable: true,
          expandQuery: `GitHub Copilot vs Cursor productivity metrics and code quality`
        }
      }
      if (/speech\s+recognition|speech-to-text/i.test(term)) {
        return {
          content: '🎤 Speech Recognition · Audio → text transcription · State-of-art: OpenAI Whisper (open-source, 99 languages) · Accuracy: 95%+ (English, clean audio), 80-90% (accents, noise) · Speed: real-time on GPU · Cost: $0.006/minute (Whisper API), free (self-hosted) · Applications: transcription, voice assistants, accessibility · Competition: Google STT, AssemblyAI, Deepgram',
          confidence: 0.90,
          expandable: true,
          expandQuery: `OpenAI Whisper accuracy benchmarks across languages`
        }
      }
      if (/conversational\s+AI/i.test(term)) {
        return {
          content: '💬 Conversational AI · Natural dialogue systems · Components: NLU (intent), dialogue manager (context), NLG (response) · Modern: LLM-powered (ChatGPT, Claude, Gemini) vs rule-based (old) · Capabilities: multi-turn context, personality, task execution · Quality: pass Turing test (limited domains) · Applications: customer service, therapy (Woebot), companionship (Character.AI) · Metrics: engagement time, retention, user satisfaction',
          confidence: 0.89,
          expandable: true,
          expandQuery: `Conversational AI frameworks and engagement metrics`
        }
      }

      // AI Benchmarks
      if (/HumanEval/i.test(term)) {
        return {
          content: '🏆 HumanEval · Code generation benchmark (OpenAI 2021) · 164 Python programming problems with unit tests · Metrics: pass@1 (first attempt), pass@10 (best of 10) · Scores: GPT-4 (67% pass@1), Claude 3.5 (73%), GPT-3.5 (48%) · Limitations: Python only, simple problems, gameable · Alternatives: MBPP, APPS, CodeContests · Industry standard for code LLM evaluation',
          confidence: 0.92,
          expandable: true,
          expandQuery: `HumanEval benchmark scores across LLMs and limitations`
        }
      }
      if (/BigBench/i.test(term)) {
        return {
          content: '📚 BigBench · 200+ diverse AI tasks (Google 2022) · Coverage: reasoning, language, knowledge, math, code · Difficulty: beyond current AI (intentionally hard) · Subset: BIG-Bench Hard (23 hardest tasks) · Goal: measure general intelligence, not narrow skills · Results: frontier models still struggle (60-70% accuracy) · Used by: researchers to track AGI progress',
          confidence: 0.90,
          expandable: true,
          expandQuery: `BigBench Hard results and AGI capability measurement`
        }
      }
      if (/MMLU/i.test(term)) {
        return {
          content: '🎓 MMLU · Massive Multitask Language Understanding · 15,908 multiple-choice questions across 57 subjects · Domains: STEM, humanities, social sciences, professional · Difficulty: college/professional level · Scores: GPT-4 (86%), Claude 3.5 Opus (88%), human expert (~90%) · Significance: measures broad knowledge + reasoning · Limitation: multiple-choice, no creativity test',
          confidence: 0.93,
          expandable: true,
          expandQuery: `MMLU benchmark scores and subject-wise AI performance`
        }
      }

      // Biology & Life Sciences
      if (/protein\s+(?:structure\s+)?prediction|AlphaFold|protein\s+folding/i.test(term)) {
        return {
          content: '🧬 AlphaFold (Protein Prediction) · DeepMind AI predicts 3D protein structures from sequences · Accuracy: atomic-level (90% of residues within 1.5Å) · Impact: 50-year biology problem solved (2020) · Speed: minutes vs months/years (lab experiments) · Database: 200M+ structures (all known proteins) · Applications: drug discovery, enzyme design, disease research · 2024 Nobel Prize in Chemistry · AlphaFold 3: DNA, RNA, ligands',
          confidence: 0.96,
          expandable: true,
          expandQuery: `AlphaFold 3 capabilities and drug discovery applications`
        }
      }
      if (/RNA|DNA\s+sequences?|RNA\s+and\s+DNA/i.test(term)) {
        return {
          content: '🧬 RNA & DNA · Genetic code molecules · DNA: blueprint (4 bases: A,T,C,G), double helix, stable · RNA: messenger (A,U,C,G), single strand, temporary · AI applications: sequence analysis, variant prediction, drug targets · Tools: AlphaFold (structure), ESM-2 (protein from DNA), RNA-FM (RNA folding) · Breakthrough: mRNA vaccines (COVID), gene therapy · Market: genomics $50B, growing 15%/year',
          confidence: 0.91,
          expandable: true,
          expandQuery: `AI tools for genomic sequence analysis and drug discovery`
        }
      }
      if (/drug\s+discovery/i.test(term)) {
        return {
          content: '💊 AI Drug Discovery · AI accelerates molecule design + testing · Process: (1) target identification → (2) molecule generation → (3) property prediction → (4) synthesis → (5) trials · Speedup: 10 years → 2-3 years · Cost reduction: $2.6B → $500M-1B · Companies: Recursion, Insilico, BenevolentAI, Exscientia · Successes: COVID antivirals (Pfizer, designed in weeks) · AI models: AlphaFold, MoLFormer, generative chemistry',
          confidence: 0.93,
          expandable: true,
          expandQuery: `AI drug discovery success stories and clinical trial results`
        }
      }

      // Scientific Concepts (Beyond Quantum)
      if (/CRISPR|gene\s+editing/i.test(term)) {
        return {
          content: '✂️ CRISPR · Gene editing tool (Clustered Regularly Interspaced Short Palindromic Repeats) · Function: Cas9 enzyme cuts DNA at precise locations · Discovered: 2012 (Doudna, Charpentier - 2020 Nobel Prize) · Applications: disease treatment (sickle cell cure 2023), agriculture, biomanufacturing · Ethics: human germline editing controversy · Cost: $75 to edit genes (vs $1M+ pre-CRISPR) · Companies: Editas, CRISPR Therapeutics, Intellia',
          confidence: 0.96,
          expandable: true,
          expandQuery: `CRISPR clinical trials, FDA approvals, and ethical debates`
        }
      }
      if (/mRNA\s+(?:vaccine|technology)/i.test(term)) {
        return {
          content: '💉 mRNA Technology · Messenger RNA instructs cells to produce proteins · COVID vaccines: Pfizer-BioNTech, Moderna (90-95% efficacy) · Mechanism: lipid nanoparticles deliver mRNA → cells produce spike protein → immune response · Advantages: fast development (10 months vs 10 years), no live virus · Future: cancer vaccines (personalized), rare diseases, flu · Pioneers: Karikó & Weissman (2023 Nobel Prize) · Market: $50B+ (2023)',
          confidence: 0.95,
          expandable: true,
          expandQuery: `mRNA cancer vaccines in clinical trials and next-generation applications`
        }
      }
      if (/fusion\s+energy|tokamak|ITER|nuclear\s+fusion/i.test(term)) {
        return {
          content: '⚛️ Nuclear Fusion Energy · Fuse hydrogen atoms → helium + energy (same as Sun) · Holy grail: unlimited clean energy, no long-lived radioactive waste · Breakthrough: Dec 2022 - NIF achieved net energy gain (3.15 MJ in, 3.5 MJ out) · ITER: $25B international project (France), 2025 first plasma, 2035 full power · Tokamak: magnetic confinement (donut shape) · Challenges: 100M°C temps, containment, materials · Timeline: 2040s for commercial power (optimistic)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `Fusion energy breakthrough timeline and commercial viability`
        }
      }
      if (/graphene|carbon\s+nanotubes?/i.test(term)) {
        return {
          content: '🧪 Graphene · Single layer of carbon atoms (hexagonal lattice) · Properties: 200x stronger than steel, best conductor (heat, electricity), transparent, flexible · Discovered: 2004 (Geim, Novoselov - 2010 Nobel Prize) · Applications: batteries (5x capacity), flexible electronics, water filtration, biomedical sensors · Challenges: mass production costly, integration with existing tech · Market: $2B (2024), projected $30B (2030)',
          confidence: 0.93,
          expandable: true,
          expandQuery: `Graphene commercial applications and manufacturing scalability`
        }
      }
      if (/room-temperature\s+superconductor|LK-99/i.test(term)) {
        return {
          content: '🔌 Room-Temperature Superconductors · Zero electrical resistance at ambient conditions (no cooling needed) · Impact: lossless power grids, levitating trains, quantum computers · LK-99 (2023): claimed breakthrough (Korea), not replicated → debunked · Real progress: 2020 - superconductivity at 15°C but 2.6M atmospheres pressure · Challenges: pressure requirements, material stability, reproducibility · Timeline: decades away (if possible) · Holy grail of materials science',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Superconductor research breakthroughs and replication challenges`
        }
      }
      if (/dark\s+matter|dark\s+energy/i.test(term)) {
        return {
          content: '🌑 Dark Matter & Dark Energy · Dark matter: 27% of universe, invisible, only interacts via gravity · Evidence: galaxy rotation curves, gravitational lensing, CMB · Candidates: WIMPs, axions, primordial black holes · Dark energy: 68% of universe, causes accelerating expansion · Discovery: 1998 (Perlmutter, Schmidt, Riess - 2011 Nobel Prize) · Detection attempts: LUX-ZEPLIN, XENON, LHC · Mystery: nature of 95% of universe unknown',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Dark matter detection experiments and leading theories`
        }
      }
      if (/Higgs\s+boson|Large\s+Hadron\s+Collider|LHC|CERN/i.test(term)) {
        return {
          content: '⚛️ Higgs Boson & LHC · Higgs: "God particle", gives mass to other particles · Discovered: 2012 at CERN LHC (Higgs, Englert - 2013 Nobel Prize) · LHC: 27km ring, $10B, near Geneva · Collides protons at 99.999999% speed of light · Energy: 13 TeV (13 trillion electron volts) · Other discoveries: pentaquarks, tetraquarks · Next: High-Luminosity LHC (2029), Future Circular Collider (100km, $20B)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `LHC discoveries beyond Higgs boson and future collider plans`
        }
      }

      // Only return annotation if we have specific knowledge, otherwise skip
      return null
    },
  },
  
  // CONNECTIONS: References to user context
  {
    type: 'connection',
    patterns: [
      /(?:as\s+(?:you|we)\s+(?:mentioned|discussed|noted))/gi,
      /(?:related\s+to|connects?\s+to|similar\s+to)/gi,
      /(?:in\s+your\s+(?:previous|earlier|last))/gi,
      /(?:building\s+on|extending|following\s+up)/gi,
    ],
    extractor: (match, context) => ({
      content: match[0],
      confidence: 0.8,
    }),
  },
  
  // SOURCES: Citations, references
  {
    type: 'source',
    patterns: [
      /(?:according\s+to|per|via|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:\d{4}|study|report|paper))/gi,
      /\((?:source|ref|cite):\s*([^)]+)\)/gi,
      /(?:research\s+(?:by|from)|study\s+(?:by|from))\s+([A-Z][a-zA-Z\s]+)/gi,
    ],
    extractor: (match, context) => ({
      content: match[0],
      confidence: 0.75,
    }),
  },
];

// ============ HEBREW/KABBALISTIC TERM DETECTION ============

import { HEBREW_TERMS, HebrewTermKey } from '@/components/HebrewTerm';

const KABBALISTIC_TERMS = Object.keys(HEBREW_TERMS);

function detectHebrewTerms(text: string): DepthAnnotation[] {
  const annotations: DepthAnnotation[] = [];
  
  for (const termKey of KABBALISTIC_TERMS) {
    const term = HEBREW_TERMS[termKey as HebrewTermKey];
    if (!term) continue;
    
    // Match transliteration (case insensitive)
    const regex = new RegExp(`\\b${termKey}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      annotations.push({
        id: `hebrew-${termKey}-${match.index}`,
        type: 'detail',
        term: match[0],
        content: `${term.hebrew} · ${term.english}`,
        position: match.index,
        confidence: 1.0,
        expandable: true,
        expandQuery: `Explain the Kabbalistic concept of ${termKey} and its role in AI`,
        metadata: { hebrewTerm: termKey },
      });
    }
  }
  
  return annotations;
}

// ============ CORE DETECTION ENGINE ============

export function detectAnnotations(
  text: string,
  config: DepthConfig,
  userContext?: { topics?: string[]; previousQueries?: string[] }
): DepthAnnotation[] {
  console.log('[detectAnnotations] Called with:', {
    textLength: text.length,
    enabled: config.enabled,
    density: config.density,
    types: config.annotationTypes
  })

  if (!config.enabled) {
    console.log('[detectAnnotations] DISABLED - returning empty')
    return []
  }

  const annotations: DepthAnnotation[] = [];
  // More annotations for better insight - user wants maximum capabilities
  const maxAnnotations = config.density === 'minimal' ? 10 :
                         config.density === 'standard' ? 30 : 100;

  console.log('[detectAnnotations] Max annotations:', maxAnnotations, '(density:', config.density, ')')
  
  // Detect Hebrew/Kabbalistic terms first (highest priority)
  if (config.annotationTypes.includes('detail')) {
    annotations.push(...detectHebrewTerms(text));
  }
  
  // Run pattern detection
  for (const detector of DETECTION_PATTERNS) {
    if (!config.annotationTypes.includes(detector.type)) continue;
    
    for (const pattern of detector.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        const extracted = detector.extractor(match, text);
        if (!extracted) continue;
        
        annotations.push({
          id: `${detector.type}-${match.index}`,
          type: detector.type,
          term: match[0],
          content: extracted.content || match[0],
          position: match.index,
          confidence: extracted.confidence || 0.7,
          expandable: detector.type !== 'metric',
          ...extracted,
        });
      }
    }
  }
  
  // Detect connections to user context
  if (config.annotationTypes.includes('connection') && userContext?.topics) {
    for (const topic of userContext.topics) {
      const regex = new RegExp(`\\b${topic}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        annotations.push({
          id: `connection-topic-${match.index}`,
          type: 'connection',
          term: match[0],
          content: `From your memory · Topic: ${topic}`,
          position: match.index,
          confidence: 0.95,
          expandable: true,
          expandQuery: `Show me more about ${topic} from my history`,
        });
      }
    }
  }
  
  // Sort by position, dedupe overlapping, limit by density
  const sorted = annotations
    .sort((a, b) => a.position - b.position)
    .filter((ann, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      // Remove overlapping annotations (within 3 chars) - reduced from 10 for denser coverage
      return ann.position - prev.position > 3;
    })
    .slice(0, maxAnnotations);

  console.log('[detectAnnotations] FINAL:', {
    totalDetected: annotations.length,
    afterDedup: sorted.length,
    maxAllowed: maxAnnotations,
    density: config.density,
    sample: sorted.slice(0, 5).map(a => ({ type: a.type, term: a.term }))
  })

  return sorted;
}

// ============ STREAMING INTEGRATION ============

export interface StreamingDepthState {
  buffer: string;
  processedLength: number;
  annotations: DepthAnnotation[];
  pendingAnnotations: DepthAnnotation[];
}

export function createStreamingDepthState(): StreamingDepthState {
  return {
    buffer: '',
    processedLength: 0,
    annotations: [],
    pendingAnnotations: [],
  };
}

/**
 * Process streaming text chunk and extract annotations in real-time
 */
export function processStreamingChunk(
  state: StreamingDepthState,
  chunk: string,
  config: DepthConfig,
  userContext?: { topics?: string[]; previousQueries?: string[] }
): { state: StreamingDepthState; newAnnotations: DepthAnnotation[] } {
  // Add chunk to buffer
  state.buffer += chunk;
  
  // Only process complete sentences/phrases
  const lastSentenceEnd = Math.max(
    state.buffer.lastIndexOf('.'),
    state.buffer.lastIndexOf('!'),
    state.buffer.lastIndexOf('?'),
    state.buffer.lastIndexOf('\n')
  );
  
  if (lastSentenceEnd <= state.processedLength) {
    return { state, newAnnotations: [] };
  }
  
  // Process new complete text
  const textToProcess = state.buffer.substring(state.processedLength, lastSentenceEnd + 1);
  const newAnnotations = detectAnnotations(textToProcess, config, userContext);
  
  // Adjust positions relative to full buffer
  const adjustedAnnotations = newAnnotations.map(ann => ({
    ...ann,
    position: ann.position + state.processedLength,
  }));
  
  // Update state
  state.processedLength = lastSentenceEnd + 1;
  state.annotations.push(...adjustedAnnotations);
  
  return { state, newAnnotations: adjustedAnnotations };
}

// ============ SEGMENT BUILDER ============

/**
 * Build annotated segments from text and annotations
 */
export function buildAnnotatedSegments(
  text: string,
  annotations: DepthAnnotation[]
): AnnotatedSegment[] {
  if (annotations.length === 0) {
    return [{ text, annotations: [] }];
  }
  
  const segments: AnnotatedSegment[] = [];
  let lastEnd = 0;
  
  // Group annotations by their line/sentence
  const sortedAnnotations = [...annotations].sort((a, b) => a.position - b.position);
  
  for (const ann of sortedAnnotations) {
    // Find the end of the term
    const termEnd = ann.position + ann.term.length;
    
    // Find the end of the sentence containing this annotation
    let sentenceEnd = text.indexOf('.', termEnd);
    if (sentenceEnd === -1) sentenceEnd = text.indexOf('\n', termEnd);
    if (sentenceEnd === -1) sentenceEnd = text.length;
    
    // Add text before this sentence if there's a gap
    if (lastEnd < ann.position) {
      const textBefore = text.substring(lastEnd, sentenceEnd + 1);
      const annsInSegment = sortedAnnotations.filter(
        a => a.position >= lastEnd && a.position <= sentenceEnd
      );
      
      segments.push({
        text: textBefore,
        annotations: annsInSegment,
      });
      
      lastEnd = sentenceEnd + 1;
    }
  }
  
  // Add remaining text
  if (lastEnd < text.length) {
    segments.push({
      text: text.substring(lastEnd),
      annotations: [],
    });
  }
  
  return segments;
}

// ============ DEFAULT CONFIG ============

export const DEFAULT_DEPTH_CONFIG: DepthConfig = {
  enabled: true,
  density: 'maximum', // Maximum capabilities - show more insights per user request
  showByDefault: true,
  annotationTypes: ['fact', 'metric', 'connection', 'detail', 'source'],
};

export function getDepthConfig(): DepthConfig {
  if (typeof window === 'undefined') return DEFAULT_DEPTH_CONFIG;

  const stored = localStorage.getItem('akhai-depth-config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Allow maximum density - user wants maximum capabilities      return { ...DEFAULT_DEPTH_CONFIG, ...parsed };
    } catch {
      return DEFAULT_DEPTH_CONFIG;
    }
  }
  return DEFAULT_DEPTH_CONFIG;
}

export function saveDepthConfig(config: DepthConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('akhai-depth-config', JSON.stringify(config));
}
