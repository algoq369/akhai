/**
 * Tag/bracket patterns and generic concept phrase patterns for depth annotations.
 * Extracted from patterns.ts to keep files under 500 lines.
 */

import type { AnnotationType, DepthAnnotation } from '@/lib/depth-annotations';

export interface DetectionPattern {
  type: AnnotationType;
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray, context: string) => Partial<DepthAnnotation> | null;
}

export const TAG_PATTERNS: DetectionPattern[] = [
  // FREE-TIER TAG PATTERNS ([TECHNICAL], [STRATEGIC], numbered steps, etc.)
  {
    type: 'detail',
    patterns: [
      /\[(?:TECHNICAL|STRATEGIC|CRITICAL|KEY|SUMMARY|INSIGHT|IMPORTANT|NOTE|CONSENSUS|ANALYSIS)\](?::?\s*)/gi,
      /\[(?:RELATED|NEXT|IMPACT|RISK|OPPORTUNITY|EXAMPLE|DRAFT\s*\d*|PERSPECTIVE|OVERVIEW)\](?::?\s*)/gi,
    ],
    extractor: (match) => {
      const tag = match[0].replace(/[\[\]:]/g, '').trim();
      const sigilMap: Record<string, string> = {
        TECHNICAL: '◊',
        STRATEGIC: '→',
        CRITICAL: '△',
        KEY: '◊',
        SUMMARY: '○',
        INSIGHT: '⊕',
        IMPORTANT: '△',
        NOTE: '◇',
        CONSENSUS: '⊕',
        ANALYSIS: '◊',
        DRAFT: '→',
        PERSPECTIVE: '☿',
        OVERVIEW: '○',
        RELATED: '☿',
        NEXT: '→',
        IMPACT: '⊕',
        RISK: '△',
        OPPORTUNITY: '⊕',
        EXAMPLE: '◇',
      };
      return {
        content: `${sigilMap[tag.toUpperCase()] || '◊'} ${tag}`,
        confidence: 0.85,
        expandQuery: `Explain the ${tag.toLowerCase()} aspects in more detail`,
      };
    },
  },
  {
    type: 'detail',
    patterns: [
      // Numbered steps pattern (1. Step description)
      /^\d+\.\s+(.{10,80})$/gm,
    ],
    extractor: (match) => {
      return {
        content: `→ Step progression`,
        confidence: 0.7,
      };
    },
  },
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
];
