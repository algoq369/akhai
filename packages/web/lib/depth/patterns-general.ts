/**
 * General detection patterns for depth annotations
 */

import type { AnnotationType, DepthAnnotation } from '@/lib/depth-annotations';
import { isLikelyPersonName } from '@/lib/depth/person-name-blocklist';

export interface DetectionPattern {
  type: AnnotationType;
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray, context: string) => Partial<DepthAnnotation> | null;
}

export const GENERAL_PATTERNS: DetectionPattern[] = [
  // SPECIFIC CONCEPT PHRASES (only high-value named terms)
  {
    type: 'detail',
    patterns: [
      // Specific high-value terms
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
      const term = match[0];
      let insight = '';
      let expandQuery = term;

      // ============ SELECTIVITY FILTER ============
      // SKIP common/obvious terms that don't provide real insight

      // Reduced blocklist - only skip truly meaningless terms
      const BLOCKLIST = [
        // Only the most generic articles and pronouns
        /^(the|a|an|this|that)\s/i,

        // Only the most common 1-3 letter words
        /^(is|am|are|be|to|of|in|on|at|by|for|and|or|but|not|it)$/i,
      ];

      // Check blocklist
      for (const pattern of BLOCKLIST) {
        if (pattern.test(term)) {
          return null; // Skip this term - too common/obvious
        }
      }

      // Allow more annotations - user wants maximum capabilities
      // Only skip if truly meaningless, not just generic

      // ============ SPECIFIC INSIGHTS (High-Value Terms Only) ============

      // DEMOGRAPHIC & POPULATION CONCEPTS
      if (/demographic\s+dividend/i.test(term)) {
        insight = `Demographic dividend — Population phenomenon where working-age population (typically ages 15-64) grows substantially larger relative to dependent populations (children under 15 and elderly over 65), creating window of economic opportunity · Occurs during specific phase of demographic transition: after mortality rates decline (so fewer infant/child deaths) but before birth rates fully adjust downward, resulting in temporary "bulge" generation of working-age adults · Mechanism: higher ratio of workers to dependents means more people producing economic value while fewer require support, enabling increased savings, investment, and consumption · Window typically lasts 20-50 years before aging of bulge generation reverses ratio · Historical examples: East Asian economic miracle (1960s-1990s Japan, South Korea, Taiwan, Singapore saw 6-9% annual GDP growth during dividend phase), China's rapid development (1980-2015 coincided with peak working-age population from 400M rural-to-urban migration), India currently in dividend phase (2018-2055 projected window) · Critical requirements to capitalize: education systems (train workforce with relevant skills), job creation (absorb young workers into productive employment), healthcare infrastructure (maintain population health and productivity), financial systems (channel increased savings into investment), infrastructure development (roads, power, communications enable economic activity) · Risks if mismanaged: youth unemployment ("youth bulge" becomes source of instability if jobs unavailable), skills mismatch (education system not aligned with labor market needs), premature aging (dividend window closes before achieving sustainable development) · Contrasts with demographic burden: when dependent populations outnumber workers, straining social support systems · Not automatic benefit—requires policy responses to convert population structure into economic gains`;
        expandQuery = 'demographic dividend examples and requirements for success';
      } else if (/demographic\s+transition/i.test(term)) {
        insight = `Demographic transition — Theoretical model describing society's shift from high birth rates and high death rates (pre-industrial equilibrium with slow population growth) to low birth rates and low death rates (modern equilibrium with slow growth), passing through period of rapid population expansion · Four or five stages: Stage 1 (pre-transition: high birth/death rates balance, population stable), Stage 2 (early transition: death rates drop due to improved sanitation, medicine, food supply, but birth rates remain high, population expands rapidly), Stage 3 (late transition: birth rates begin declining as societies urbanize, women educated, children cost more than contribute economically), Stage 4 (post-transition: both rates low and balanced, population stable or slowly growing), Stage 5 (proposed: birth rates fall below replacement level 2.1 children per woman, population aging and potentially shrinking) · Drivers of mortality decline: public health improvements (clean water, sewage systems, vaccination), medical advances (antibiotics, surgical techniques, maternal care), agricultural productivity (better nutrition, food security), economic development (reduced poverty, improved living conditions) · Drivers of fertility decline: urbanization (children shift from economic assets on farms to costs in cities), education especially for women (delays marriage and childbearing, provides alternatives to motherhood), child survival (parents need fewer births when confident children will survive), contraception availability (separates sex from reproduction), women's labor force participation (opportunity cost of childrearing rises) · Timing varies: Europe/North America took 100-200 years (1750s-1950s), East Asia compressed into 40-60 years (1950s-2000s), some Sub-Saharan African countries still in early stages · Demographic dividend occurs during Stage 2-3 transition when death rates fallen but birth rates not yet adjusted · Implications: population momentum (even with falling fertility, young population structure means continued growth for decades), aging populations (low fertility + high longevity = inverted age pyramid), migration pressures (demographic imbalances between regions create push/pull factors)`;
        expandQuery = 'demographic transition model stages and global patterns';
      }

      // Technology concepts
      else if (/neural\s+interface|BCI/i.test(term)) {
        insight = `Brain-computer interface (BCI) — Technology enabling direct communication pathway between brain's electrical activity and external devices, bypassing traditional neuromuscular channels (no need for movement or speech) · Two main categories: invasive (electrodes surgically implanted into brain tissue for high-resolution signal detection, used for medical applications), non-invasive (external sensors like EEG caps read brain activity through scalp, lower resolution but no surgery) · How it works: brain activity generates electrical signals (action potentials, local field potentials), electrodes detect these signals, signal processing algorithms decode patterns associated with intentions or states, decoded signals control external devices (cursor, robotic arm, communication system) or provide feedback to brain · Current applications: medical restoration (paralyzed individuals control prosthetic limbs or communication devices using thought alone, locked-in syndrome patients spell words by thinking), sensory substitution (visual information routed to other sensory cortex for blind individuals), seizure detection (monitor brain activity to predict epileptic episodes), research tools (understand neural coding and brain function) · Key challenges: signal quality degrades over time as scar tissue forms around implants, decoding accuracy limited by complexity of neural patterns, ethical questions about cognitive enhancement and privacy of thoughts, invasive approaches require surgery with associated risks · Brain signals used: motor cortex activity (imagining movement generates signals), visual attention (where person looks or focuses), P300 wave (brain response to target stimuli), steady-state evoked potentials (brain's rhythmic response to flickering stimuli) · Not mind reading: current technology detects patterns associated with specific tasks or intentions user has trained system on, cannot extract arbitrary thoughts or memories · Future directions: bidirectional interfaces (not just brain→device but device→brain sensory feedback), higher channel counts (thousands vs hundreds of electrodes for finer resolution), wireless and long-lasting implants, brain-to-brain communication`;
        expandQuery = 'how brain-computer interfaces work and current capabilities';
      } else if (/AGI|artificial\s+general\s+intelligence/i.test(term)) {
        insight = `Artificial General Intelligence (AGI) — Hypothetical AI system capable of understanding, learning, and applying knowledge across any intellectual domain at human-level or beyond, not limited to narrow tasks · Distinguishing characteristics: transfer learning (apply knowledge from one domain to completely different domains without retraining), abstract reasoning (handle novel situations never seen in training data), common sense understanding (intuitive grasp of how world works without explicit programming), goal flexibility (pursue new objectives not specified by creators), self-improvement (enhance own capabilities), and general problem-solving (tackle any cognitive task humans can) · Contrasts with narrow/weak AI: current systems excel at specific tasks (AlphaGo plays Go at superhuman level, GPT generates text, computer vision identifies objects) but cannot transfer capabilities—chess AI cannot play checkers, language models cannot drive cars, image recognizers cannot understand speech · Key unsolved challenges: symbol grounding problem (connecting abstract symbols/words to real-world meanings and experiences), frame problem (knowing what's relevant in a given situation among infinite possible considerations), common sense reasoning (understanding unstated assumptions and implicit context humans take for granted), causality vs correlation (distinguishing genuine cause-effect from mere statistical patterns), embodiment question (does intelligence require physical interaction with world, or can it emerge from pure computation?) · Approaches being explored: scaling up neural networks with massive compute and data (brute force approach), neurosymbolic AI (combining neural learning with symbolic logic and rules), world models (building internal simulations of environment to plan and reason), cognitive architectures (explicitly modeling human mental processes like perception, memory, attention), evolutionary algorithms (evolving AI through selection pressures like biological evolution) · Why difficult: human intelligence emerges from billions of neurons with trillions of connections developed through evolutionary selection over millions of years plus individual learning over decades, compressed into single lifetime—replicating this artificially involves either reverse-engineering brain architecture (still not fully understood) or discovering different paths to general intelligence · Philosophical debates: can machine ever be truly conscious or just simulate intelligence (philosophical zombie problem), would AGI have rights and moral status, is human-level intelligence sufficient or will systems vastly exceed us (intelligence explosion), can we maintain control over systems smarter than creators (alignment problem) · Not to be confused with: superintelligence (far exceeding human cognitive abilities in all domains), consciousness (subjective first-person experience), sentience (capacity to feel and perceive)`;
        expandQuery =
          'AGI definition requirements and current progress toward general intelligence';
      } else if (/technological\s+leapfrogging/i.test(term)) {
        insight = `Technological leapfrogging — Phenomenon where developing regions bypass intermediate stages of technology adoption, jumping directly to more advanced systems without investing in legacy infrastructure · Classic examples: mobile phones (many African and Asian countries skipped landline telephone networks entirely, going straight to mobile cellular in 1990s-2000s, enabling banking, internet access, and services without copper wire infrastructure), renewable energy (some nations bypassing centralized fossil fuel power plants and electrical grids, deploying distributed solar/wind with microgrids instead), digital payments (societies moving from cash directly to mobile money like M-Pesa in Kenya, avoiding credit card infrastructure), satellite internet (remote areas accessing broadband via Starlink without ever having cable or DSL) · Enabling factors: older technology's infrastructure costs and lock-in effects (sunk costs in legacy systems prevent incumbents from upgrading, but newcomers face no such constraints), decreasing costs of newer technology (solar panels, smartphones, computing power all declining exponentially making advanced tech accessible), modularity and scalability (newer systems often more flexible and easier to deploy incrementally than all-or-nothing infrastructure projects), globalization and knowledge transfer (developing countries can adopt proven technologies without repeating R&D) · Advantages: cost savings (avoid expensive infrastructure buildout), faster deployment (newer tech often quicker to install), better performance (latest generation systems superior to legacy), environmental benefits (skip polluting intermediate stages) · Challenges and limitations: requires human capital (operating/maintaining advanced tech needs skills developing regions may lack), assumes technology neutrality (but older infrastructure sometimes more robust for local conditions), path dependency still matters (some technological transitions require intermediate steps), uneven adoption (benefits concentrate in cities while rural areas lag) · Historical precedent: industrialization varied across nations (Britain went through steam→coal→oil sequentially over 200 years, but late industrializers like South Korea compressed this into decades by adopting most advanced technologies available), Green Revolution (countries without established agriculture systems could adopt high-yield varieties and modern techniques directly) · Not automatic: leapfrogging requires supportive policies (regulation, education, infrastructure), access to capital, technology transfer mechanisms, and local adaptation · Double-edged: while avoiding sunk costs in obsolete tech, also miss cumulative learning and institutional development that occurs during gradual technological progression`;
        expandQuery = 'technological leapfrogging examples mechanisms and conditions for success';
      } else if (/DeFi/i.test(term)) {
        insight = `Decentralized Finance protocols — Peer-to-peer financial services on blockchain · No traditional intermediaries`;
        expandQuery = 'DeFi protocols comparison';
      } else if (/smart\s+contract/i.test(term)) {
        insight = `Self-executing blockchain contracts — Automated enforcement without intermediaries · Core to DeFi and Web3`;
        expandQuery = 'smart contract use cases';
      } else if (/autonomous/i.test(term)) {
        insight = `Self-driving technology — AI-powered navigation without human input · Sensors, computer vision, and decision algorithms`;
        expandQuery = 'autonomous vehicle technology';
      }

      // Financial concepts
      else if (/CBDC/i.test(term)) {
        insight = `Central Bank Digital Currency — Government-issued digital money · Programmable, traceable alternative to cash`;
        expandQuery = 'CBDC implementation worldwide';
      } else if (/crypto\s+portfolio/i.test(term)) {
        insight = `Digital asset investment portfolio — Diversified cryptocurrency holdings · Managed exposure across multiple tokens`;
        expandQuery = 'crypto portfolio strategies';
      } else if (/carbon\s+credit/i.test(term)) {
        insight = `Tradeable emission reduction certificates — One credit = one ton CO2 offset · Market-based climate solution`;
        expandQuery = 'carbon credit trading markets';
      } else if (/social\s+credit/i.test(term)) {
        insight = `Behavioral scoring system — Tracks citizen conduct and compliance · Impacts access to services and opportunities`;
        expandQuery = 'social credit score systems';
      }

      // Urban concepts
      else if (/15.minute\s+city/i.test(term)) {
        insight = `Urban planning concept — All essential services within 15-minute walk/bike · Reduces car dependency and emissions`;
        expandQuery = '15-minute city examples';
      } else if (/subterranean\s+city/i.test(term)) {
        insight = `Underground urban development — Climate-controlled infrastructure below ground · Space efficiency and disaster resilience`;
        expandQuery = 'underground cities Singapore';
      }

      // Scientific concepts
      else if (/prefrontal\s+cortex/i.test(term)) {
        insight = `Brain region for executive function — Decision-making, planning, and impulse control · Last area to fully mature (mid-20s)`;
        expandQuery = 'prefrontal cortex functions';
      } else if (/circadian\s+rhythm|sleep\s+cycle/i.test(term)) {
        insight = `Internal 24-hour biological clock — Regulates sleep-wake patterns and hormone release · Light exposure is primary regulator`;
        expandQuery = 'circadian rhythm optimization';
      } else if (/vitamin\s+[A-Z]/i.test(term)) {
        const vitamin = term.match(/vitamin\s+([A-Z])/i)?.[1];
        insight = `Essential micronutrient — Required for various bodily functions · Deficiency causes specific health issues`;
        expandQuery = `vitamin ${vitamin} deficiency symptoms`;
      }

      // Generic fallback for recognized multi-word terms (proper nouns, technical phrases)
      // Extract surrounding sentence for contextual annotation
      else if (term.split(/\s+/).length >= 2 && term.length >= 8) {
        // Find the sentence containing this term for context
        const termPos = context.indexOf(term);
        if (termPos >= 0) {
          const beforeTerm = context.substring(Math.max(0, termPos - 200), termPos);
          const afterTerm = context.substring(
            termPos + term.length,
            Math.min(context.length, termPos + term.length + 200)
          );
          const sentStart = Math.max(
            beforeTerm.lastIndexOf('.'),
            beforeTerm.lastIndexOf('!'),
            beforeTerm.lastIndexOf('?'),
            beforeTerm.lastIndexOf('\n')
          );
          const sentEnd = Math.min(
            afterTerm.indexOf('.') >= 0 ? afterTerm.indexOf('.') : 999,
            afterTerm.indexOf('!') >= 0 ? afterTerm.indexOf('!') : 999,
            afterTerm.indexOf('?') >= 0 ? afterTerm.indexOf('?') : 999
          );
          const sentBefore =
            sentStart >= 0 ? beforeTerm.substring(sentStart + 1).trim() : beforeTerm.trim();
          const sentAfter =
            sentEnd < 999
              ? afterTerm.substring(0, sentEnd + 1).trim()
              : afterTerm.substring(0, 120).trim();
          const fullSentence = `${sentBefore}${term}${sentAfter}`.replace(/[#*`\-]/g, '').trim();
          if (fullSentence.length > 30) {
            insight = `${term} · ${fullSentence.length > 200 ? fullSentence.substring(0, 197) + '...' : fullSentence}`;
          } else {
            insight = `${term} — key concept in this analysis · Related to the broader discussion of ${context.split(/[.!?]/)[0]?.trim().substring(0, 80) || 'this topic'}`;
          }
        } else {
          insight = `${term} — key concept referenced in this response`;
        }
        expandQuery = `Explain ${term} in detail with examples and connections`;
      } else {
        return null; // Single short word — skip
      }

      // Final check: Only return annotation if we have actual insight
      if (!insight || insight.length < 50) {
        return null; // Skip - no meaningful insight to provide
      }

      return {
        term,
        content: insight,
        expandable: true,
        expandQuery,
        confidence: 0.9, // Higher confidence since we only annotate what we know well
      };
    },
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
      /(\d+)[-\s]*(?:qubits?|tokens?|parameters?)/gi,
      /valued\s+at\s+\$(\d+(?:\.\d+)?)\s*(billion|million)/gi,
      /\$(\d+(?:\.\d+)?[M+]+)\s*(?:ARR|revenue|valuation)/gi,
      /over\s+(\d+(?:,\d{3})*)\s+(?:paid\s+)?subscribers?/gi,
      /\$(\d+)M\+?\s*(?:ARR|annual\s+revenue)/gi,
    ],
    extractor: (match, context) => {
      const text = match[0];
      let insight = text;
      let expandQuery = '';

      // Extract number for analysis
      const numMatch = text.match(/\$?(\d+(?:\.\d+)?)\+?\s*(?:billion|million|[BMK]|%)?/i);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;

      // ============ SELECTIVITY FILTER FOR METRICS ============
      // Skip trivial/obvious numbers that don't provide real insight

      // Skip very small percentages (< 3%) unless in specific meaningful contexts
      if (/%|percent/i.test(text) && num < 3 && !/(growth|increase|margin|profit)/i.test(context)) {
        return null; // Too small to be meaningful
      }

      // Skip small user counts (< 100,000) unless it's a specific milestone
      if (
        /(users?|customers?|subscribers?)/i.test(text) &&
        num < 100000 &&
        !/(million|thousand|over)/i.test(text)
      ) {
        return null; // Too small for meaningful network effects analysis
      }

      // Skip time metrics under 100ms unless performance-critical
      if (
        /(ms|milliseconds?)/i.test(text) &&
        num < 100 &&
        !/(latency|response|load)/i.test(context)
      ) {
        return null; // Sub-100ms not usually annotated
      }

      // Skip common small multipliers (2x, 3x) unless significant
      if (/[xX]/.test(text) && num < 5 && !/(faster|performance|improvement)/i.test(context)) {
        return null; // Small multipliers too common
      }

      // SKIP financial metrics - these are business advice, not concepts
      // Only annotate users/subscribers with conceptual network effects explanation
      if (/valued\s+at|valuation|ARR|annual\s+revenue|revenue/i.test(text)) {
        return null; // Skip valuations and revenue - financial metrics, not conceptual insights
      } else if (/subscribers?|users?|customers?/i.test(text)) {
        // CONCEPTUAL: Explain what user count means, not business metrics
        insight = `${text} — User base size indicating adoption scale and network reach · Contextualizing ${num.toLocaleString()} ${text.includes('subscriber') ? 'subscribers' : 'users'}: ${num >= 1000000000 ? 'represents over 12% of global population (8 billion), reaching extreme scale comparable to Facebook 3B, YouTube 2.7B, WhatsApp 2.5B - requires distributed infrastructure across continents' : num >= 100000000 ? 'represents significant global platform (1.25%+ of world population), comparable to LinkedIn 900M, Twitter 450M, Telegram 800M - major cultural and social impact' : num >= 10000000 ? 'represents meaningful user base reaching ~0.125% of global population, large enough for network effects and viral growth, comparable to messaging apps, streaming services, or productivity tools in growth phase' : num >= 1000000 ? 'represents million-user milestone indicating successful product adoption, crosses threshold where statistical analysis becomes meaningful, user cohorts reveal patterns, retention/engagement metrics stabilize' : num >= 100000 ? 'represents hundred-thousand users showing initial market validation, still small enough for founders to understand user segments qualitatively while large enough for quantitative patterns to emerge' : 'represents early adoption phase where qualitative feedback from individual users more valuable than aggregate statistics, focus on understanding why users engage rather than optimizing metrics'} · Network dynamics at this scale: ${num >= 100000000 ? 'massive network effects (value increases exponentially with users, new user benefits from existing content/connections), faces challenges of content moderation, diverse cultural contexts, regulatory scrutiny across jurisdictions' : num >= 10000000 ? 'strong network effects emerging (each new user adds value to existing users through content, connections, or marketplace liquidity), critical mass for viral growth mechanisms' : num >= 1000000 ? 'network effects beginning to compound (user-generated content, social connections, or marketplace transactions create value for other users), approaching critical mass thresholds' : 'network effects not yet significant (value primarily from product features not user network), growth driven by solving individual user problems rather than network participation'} · Engagement patterns: ${num >= 10000000 ? 'diverse user segments emerge (power users, casual users, dormant users), requiring personalization and segmentation strategies' : num >= 100000 ? 'user cohorts distinguishable (early adopters vs mainstream, heavy vs light users), enabling targeted approaches' : 'relatively homogeneous user base (mostly early adopters sharing similar characteristics), easier to serve but harder to broaden appeal'} · Technical infrastructure implications: ${num >= 100000000 ? 'requires distributed systems (database sharding, multi-region deployment, CDN networks), petabytes of data, sub-second global latency targets' : num >= 10000000 ? 'moving beyond single-server architectures to microservices, caching layers, load balancing, requires specialized infrastructure team' : num >= 100000 ? 'can still run on monolithic architecture with database optimization, but beginning to hit scaling constraints' : 'manageable with standard web hosting, single database, minimal specialized infrastructure'} · Historical adoption patterns: ${num >= 10000000 ? 'achieving 10M+ users historically took decades (telephone took 60+ years to reach 10M in early 1900s) but modern platforms achieve in months-years (Instagram 1 year, ChatGPT 2 months to reach 100M)' : num >= 1000000 ? 'million-user milestone historically marked major platforms but adoption accelerating (Facebook took 10 months to reach 1M in 2004, modern platforms reach in weeks-months if viral)' : 'in early phase where growth rate matters more than absolute numbers, doubling user base every month typical for products finding product-market fit'}`;
        expandQuery = `What does ${text} user count mean for platform scale and adoption`;
      } else if (/%|percent/i.test(text)) {
        // CONCEPTUAL: Explain what percentage means, not financial implications
        if (context && /growth|increase|rise|surge|jump|climb/i.test(context)) {
          if (num > 50)
            insight = `${text} growth rate — Indicates quantity increased by more than half its original value over measurement period (typically year-over-year) · Mathematical meaning: (new value - old value) / old value × 100, so doubling represents 100% growth, tripling is 200% growth · Compound growth implications: at ${num}% annual growth rate, quantity doubles approximately every ${(72 / num).toFixed(1)} years (rule of 72: 72 / growth rate), grows 10x in ${(Math.log(10) / Math.log(1 + num / 100)).toFixed(1)} years · Context for interpretation: ${num}% national GDP growth would be historically exceptional (fastest sustained economic expansions: post-war Japan 9-10%, China 1980s-90s peaked at 14%, most mature economies 2-4% typical), ${num}% population growth extremely rapid (global average 1.0%, fastest countries 3-4% mainly from immigration/high birth rates), ${num}% technology adoption common during explosive platform phases (internet 1995-2000, smartphones 2007-2013, social media 2005-2012) · Diminishing returns principle: much easier to achieve ${num}% growth from small base (100 → ${100 * (1 + num / 100)} adds ${num} units) than large base (1 million → ${((1000000 * (1 + num / 100)) / 1000).toFixed(0)}K adds ${(num * 10).toFixed(0)}K units) · Sustainability considerations: very high growth rates (>50%) rarely sustainable beyond 3-7 years as markets mature, early adopters saturate, competition emerges, and addressable populations become constrained · Distinguishing real vs nominal: must account for inflation (20% nominal growth with 15% inflation = only 4.3% real growth in constant dollars: (1.20/1.15 - 1) × 100)`;
          else
            insight = `${text} growth rate — Indicates quantity increased by ${num}% of its original value over measurement period · Mathematical calculation: (new - old) / old × 100 · At ${num}% annual growth: doubles every ${(72 / num).toFixed(1)} years (rule of 72), starting with 100 units reaches ${(100 * Math.pow(1 + num / 100, 5)).toFixed(0)} after 5 years of compounding · Context: ${num}% GDP growth ${num < 5 ? 'typical for mature economies, modest but sustainable' : 'exceptional for national economy, often indicates catch-up growth or resource boom'}, ${num}% population growth ${num < 2 ? 'moderate for developing regions' : 'very rapid, typically from high birth rates or immigration'}, ${num}% technology penetration typical during ${num < 20 ? 'saturation/late majority phase' : 'early adoption/rapid expansion phase'} · Compounding effect: growth multiplies not adds, so three years of ${num}% growth = ${(Math.pow(1 + num / 100, 3) * 100 - 100).toFixed(1)}% total (not ${num * 3}%), calculated as (1.${num < 10 ? '0' : ''}${Math.round(num)})³ - 1 · Baseline comparisons: global GDP grows ~3% annually, human population ~1%, internet users grew ~15% in 2010s slowing to ~8% in 2020s as penetration saturates`;
          expandQuery = `What does ${text} growth rate mean mathematically and contextually`;
        } else if (context && /margin|profit|efficiency|productivity/i.test(context)) {
          insight = `${text} ${context && /margin/i.test(context) ? 'margin' : 'metric'} — ${context && /margin/i.test(context) ? `Indicates ${num}% of revenue remains as profit after costs deducted · Calculation: (revenue - costs) / revenue × 100 · ` : ''}Meaning depends heavily on industry context: capital-light businesses (software, consulting, media) often achieve ${num > 30 ? 'very high' : num > 15 ? 'healthy' : 'moderate'} margins because incremental costs near zero, while capital-intensive businesses (manufacturing, retail, logistics) typically operate at lower margins due to physical goods, inventory, distribution costs · Industry benchmarks: software/SaaS 70-90% gross margins and 15-30% net margins typical, retail 2-10% net margins (groceries 1-3%, electronics 5-8%), manufacturing 5-15%, financial services 10-25%, healthcare 8-20% · Trade-offs: high margins usually indicate specialized/differentiated offerings with pricing power (luxury goods, proprietary technology, monopoly/oligopoly positions), low margins suggest commoditized products in competitive markets or heavy reinvestment phase (Amazon operated at <5% for years while building infrastructure) · Absolute vs relative profitability: $1M profit on $10M revenue (10% margin) same absolute dollars as $10M profit on $100M revenue (also 10% margin), but second business 10x larger scale · Operational leverage: fixed costs (rent, salaries, infrastructure) spread over more units as volume increases, so margins often improve with scale (Walmart 2.5% margins but $600B revenue = $15B profit)`;
          expandQuery = `What does ${text} percentage mean in this industry context`;
        } else {
          insight = `${text} — Percentage representing part-to-whole relationship, calculated as (part / whole) × 100 · Interpretation requires knowing: what is the whole (denominator)? what is the part (numerator)? over what time period or population? · Statistical considerations: sample size matters for reliability (percentages from small samples have wide confidence intervals: 50% from 20 people has ±22% margin of error at 95% confidence, but 50% from 1000 people only ±3%), sampling method affects representativeness (random sample vs self-selected survey respondents), correlation ≠ causation (two variables both showing ${num}% changes doesn't mean one caused the other) · Common percentage types: growth rates (change over time), market share (portion of total market), conversion rates (percentage completing action), margins (profit as percentage of revenue), yield (return as percentage of investment), probability (likelihood as percentage 0-100%) · Baseline for comparison essential: ${num}% sounds impressive but meaningless without context (${num}% of what? compared to what alternative? over what timeframe?) · Percentage vs percentage points: going from 10% to 15% is +5 percentage points but 50% relative increase (5/10 = 0.5 = 50%), often confused in reporting · Compound percentage: consecutive percentage changes multiply not add (up 20% then down 20% ≠ back to original, actually 0.8 × 1.2 = 0.96 = 4% net loss)`;
          expandQuery = `How to interpret ${text} percentage in proper context`;
        }
      }

      return {
        content: insight.length > 200 ? insight.substring(0, 197) + '...' : insight,
        confidence: 0.95,
        expandable: true,
        expandQuery: expandQuery || `Detailed analysis of ${text}`,
      };
    },
  },

  // PERSON NAMES: Detect named individuals with role context for biographical hints
  {
    type: 'detail',
    patterns: [
      // 1. Role + Name: 'president Jean-Claude Trichet', 'Prince Bernhard'
      /\b(?:president|chairman|chair|director|minister|chancellor|governor|CEO|CTO|CFO|founder|secretary|ambassador|commissioner|professor|admiral|general|commander|prince|king|queen|leader|head)\s+([A-Z][\w\u00C0-\u024F]+(?:[-\s][A-Z][\w\u00C0-\u024F]+){0,3})/gi,

      // 2. Name + Role: 'Jean-Claude Trichet, former ECB president'
      /([A-Z][\w\u00C0-\u024F]+(?:[-\s][A-Z][\w\u00C0-\u024F]+){1,3}),?\s+(?:former|current|then|acting|ex-|the)?\s*(?:president|chairman|chair|director|minister|CEO|CTO|CFO|founder|secretary|governor|head|leader)\b/gi,

      // 3. Passive: 'chaired by Paul Volcker', 'founded 1954 by David Rockefeller'
      /(?:chaired|led|headed|founded|created|attended|joined|appointed|established|organized|run)\s+(?:(?:in\s+)?\d{4}\s+)?(?:by|previously\s+by)\s+([A-Z][\w\u00C0-\u024F-]+(?:[,\s]+(?:and\s+)?[A-Z][\w\u00C0-\u024F-]+){1,5})/gi,

      // 4. List after colon/label: 'Key figures: Henry Kissinger, Eric Schmidt'
      /(?:figures?|members?|attendees?|participants?|leaders?|invitees?|people|names?)(?:\s+include)?[:]\s*([A-Z][\w\u00C0-\u024F]+(?:[-\s][A-Z][\w\u00C0-\u024F]+)(?:[,]\s*(?:and\s+)?[A-Z][\w\u00C0-\u024F]+(?:[-\s][A-Z][\w\u00C0-\u024F]+))*)/gi,

      // 5. Possessive name: "Van Rompuy's EU presidency", "Kissinger's influence"
      /([A-Z][\w\u00C0-\u024F]+(?:[-\s][A-Z][\w\u00C0-\u024F]+){0,2})'s\s+(?:EU|UN|NATO|IMF|WEF|ECB|WHO|G\d+|presidency|tenure|leadership|administration|influence|role|vision|era|legacy|approach|strategy|policy|agenda)\b/gi,

      // 6. Name + verb (standalone context): 'Kissinger attended', 'Rockefeller founded'
      /\b([A-Z][\w\u00C0-\u024F]{2,15}(?:\s+[A-Z][\w\u00C0-\u024F]{2,15}){0,2})\s+(?:attended|founded|chaired|led|organized|proposed|argued|warned|predicted|advocated|negotiated|brokered|shaped|influenced|transformed)\b/gi,
    ],
    extractor: (match, context) => {
      const fullMatch = match[0];
      // Extract the actual name (first capture group or derive from match)
      const rawName = (match[1] || '').trim();

      // If match contains multiple names (from list patterns), take first name only
      const names = rawName.split(/,\s*(?:and\s+)?/).filter((n) => /^[A-Z]/.test(n));
      const primaryName = names[0] || rawName;
      if (!primaryName || primaryName.length < 4) return null;

      // Blocklist gate: reject title phrases ("Secretary General", "Prime Minister")
      // and institutional names ("Board Directors", "European Commission") that pass
      // the regex but aren't actual people.
      if (!isLikelyPersonName(primaryName)) return null;

      // Extract surrounding role context (±100 chars around the match)
      const matchPos = context.indexOf(fullMatch);
      const start = Math.max(0, matchPos - 100);
      const end = Math.min(context.length, matchPos + fullMatch.length + 100);
      const surrounding = context.substring(start, end).replace(/\n/g, ' ').trim();

      // Build biographical hint from context
      const roleMatch = fullMatch.match(
        /(?:president|chairman|chair|director|minister|chancellor|governor|CEO|CTO|CFO|founder|secretary|ambassador|commissioner|professor|head|leader|prince|king|queen)/i
      );
      const role = roleMatch ? roleMatch[0] : 'notable figure';

      const orgMatch = surrounding.match(
        /(?:of|at|for)\s+(?:the\s+)?([A-Z][A-Za-z\s&]+?)(?:\s*[,.\-—(]|$)/
      );
      const org = orgMatch ? orgMatch[1].trim() : '';

      const timeMatch = surrounding.match(
        /\b(19\d{2}|20\d{2})(?:\s*[-–]\s*(19\d{2}|20\d{2}|present))?\b/
      );
      const period = timeMatch
        ? timeMatch[2]
          ? `${timeMatch[1]}–${timeMatch[2]}`
          : timeMatch[1]
        : '';

      const content = `${primaryName} — ${role}${org ? ' of ' + org : ''}${period ? ' (' + period + ')' : ''}. Mentioned in context of ${surrounding.substring(0, 80).trim()}…`;

      return {
        content,
        confidence: 0.9,
        expandable: true,
        expandQuery: `Who is ${primaryName}? Biography, career, and significance`,
      };
    },
  },

  // FACTS: Named entities, dates, definitions
  {
    type: 'fact',
    patterns: [
      /(?:founded|established|created|launched)\s+(?:in\s+)?(\d{4})/gi,
      /(?:CEO|founder|CTO|president)\s+(?:is\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /(?:headquartered|based)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    ],
    extractor: (match, context) => {
      const text = match[0];
      // 'founded in 1954' → 'Established 1954 — X years of operation'
      const yearMatch = text.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const age = new Date().getFullYear() - year;
        return {
          content: `Established ${year} — ${age} years of continuous operation. Historical context: founded during ${year < 1950 ? 'post-WWII reconstruction era' : year < 1970 ? 'Cold War / Bretton Woods era' : year < 1990 ? 'late Cold War / deregulation era' : year < 2010 ? 'post-Cold War globalization era' : 'digital transformation era'}.`,
          confidence: 0.85,
          expandQuery: `History and founding of this institution since ${year}`,
        };
      }
      // CEO/president + Name → role-based insight
      const roleNameMatch = text.match(
        /(?:CEO|founder|CTO|president)\s+(?:is\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)/i
      );
      if (roleNameMatch) {
        return {
          content: `${roleNameMatch[1]} — current leadership. Click to explore biography and career.`,
          confidence: 0.85,
          expandQuery: `Who is ${roleNameMatch[1]}? Biography and career`,
        };
      }
      // headquartered in X → geographic insight
      const hqMatch = text.match(
        /(?:headquartered|based)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
      );
      if (hqMatch) {
        return {
          content: `Based in ${hqMatch[1]} — geographic positioning suggests ${/London|New York|Geneva|Zurich|Singapore|Hong Kong/i.test(hqMatch[1]) ? 'global financial center proximity' : /Washington|Brussels|Beijing/i.test(hqMatch[1]) ? 'proximity to political power' : /San Francisco|Palo Alto|Seattle/i.test(hqMatch[1]) ? 'Silicon Valley / tech ecosystem' : 'regional focus'}.`,
          confidence: 0.85,
          expandQuery: `Why is this organization based in ${hqMatch[1]}?`,
        };
      }
      return { content: text, confidence: 0.7 };
    },
  },
];
