/**
 * Science/research topic detection patterns for depth annotations.
 * Extracted from patterns.ts to keep files under 500 lines.
 */

import type { AnnotationType, DepthAnnotation } from '@/lib/depth-annotations';
import type { DetectionPattern } from './patterns-general';

export const SCIENCE_PATTERNS: DetectionPattern[] = [
  // Object 1: Quantum Computing & Advanced Tech
  {
    type: 'detail',
    patterns: [
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
    ],
    extractor: (match, context) => {
      const term = match[0];

      if (/quantum\s+(?:computing|computer|advantage|error|internet)/i.test(term)) {
        return {
          content:
            '⚛️ Quantum computing · Leverage quantum mechanics for computation · Key challenges: decoherence, error rates, scalability · Applications: cryptography, drug discovery, optimization · Current state: 50-1000 qubits (noisy) · Timeline: 10+ years to fault-tolerant',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Latest breakthroughs in quantum computing and commercial readiness`,
        };
      }
      if (/decoherence/i.test(term)) {
        return {
          content:
            '🌊 Quantum decoherence · Loss of quantum state due to environmental interaction · Main obstacle to practical quantum computing · Solutions: error correction codes, cryogenic cooling, topological qubits · Research focus: extending coherence time',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Decoherence mitigation strategies and current research`,
        };
      }
      if (/(?:error\s+correction|quantum\s+error)/i.test(term)) {
        return {
          content:
            '🛡️ Quantum error correction · Uses multiple physical qubits to create logical qubits · Examples: surface codes, topological codes · Challenge: requires 1000s of physical qubits per logical qubit · Breakthrough needed for fault-tolerant quantum computing',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Progress in quantum error correction and threshold requirements`,
        };
      }
      if (/(?:topological\s+qubits?|anyons)/i.test(term)) {
        return {
          content:
            '🔷 Topological qubits · Store information in global topology (immune to local errors) · Material: anyons in 2D materials · Companies: Microsoft (Station Q) · Status: experimental, not yet demonstrated at scale',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Topological qubits vs other approaches and commercialization timeline`,
        };
      }
      if (/qubits?/i.test(term)) {
        return {
          content:
            '⚡ Qubits (quantum bits) · Fundamental unit of quantum information · Properties: superposition, entanglement · Types: superconducting, trapped ion, photonic, topological · Current record: ~1000 qubits (Google, IBM) · Challenge: maintaining quantum state',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Qubit technologies comparison and scalability roadmap`,
        };
      }
      if (/(?:hybrid\s+classical-quantum|variational)/i.test(term)) {
        return {
          content:
            '🔀 Hybrid quantum-classical · Combines classical computers with quantum processors · Examples: VQE (chemistry), QAOA (optimization) · Advantage: near-term quantum utility with limited qubits · Use cases: materials science, drug discovery, logistics',
          confidence: 0.87,
          expandable: true,
          expandQuery: `Hybrid quantum algorithms and commercial applications`,
        };
      }
      if (/quantum\s+entanglement|entanglement/i.test(term)) {
        return {
          content:
            '🎭 Quantum entanglement · Particles remain correlated regardless of distance · Einstein\'s "spooky action" · Key facts: instantaneous correlation (no communication), breaks classical physics, basis for quantum computing & cryptography · Verified: Bell tests (2015, 2022 Nobel Prize) · Applications: quantum teleportation, secure communication',
          confidence: 0.95,
          expandable: true,
          expandQuery: `How entanglement enables quantum computing and cryptography`,
        };
      }
      if (/Bell\s+inequality|spooky\s+action/i.test(term)) {
        return {
          content:
            '🔔 Bell inequality violations · Proves quantum entanglement is real (not hidden variables) · First test: 1972 (Freedman-Clauser) · Definitive: 2015 (loophole-free) · 2022 Nobel Prize (Aspect, Clauser, Zeilinger) · Confirms nature is fundamentally non-local · Used to verify quantum systems',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Bell test experiments and implications for quantum theory`,
        };
      }
      if (/quantum\s+cryptography/i.test(term)) {
        return {
          content:
            '🔐 Quantum cryptography (QKD) · Unbreakable encryption using quantum mechanics · Key distribution detects eavesdropping (collapses quantum state) · Commercial: ID Quantique, Toshiba · Networks: China (2000+ km), EU Quantum Internet Alliance · Limitation: distance (currently <1000 km without repeaters) · Post-quantum alternative: lattice-based crypto',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Quantum cryptography deployment and commercial adoption`,
        };
      }
      if (/multiverse|parallel\s+universes?/i.test(term)) {
        return {
          content:
            '🌌 Multiverse theory · Multiple universes may exist simultaneously · Types: (1) Many-Worlds (quantum branching), (2) Cosmological (infinite space), (3) Eternal inflation (bubble universes) · Evidence: none direct, but explains fine-tuning · Status: speculative, unfalsifiable by current science · Proponents: Everett, Tegmark, Greene',
          confidence: 0.82,
          expandable: true,
          expandQuery: `Scientific evidence and criticisms of multiverse theory`,
        };
      }
      if (/Many-Worlds\s+Interpretation/i.test(term)) {
        return {
          content:
            "🌿 Many-Worlds Interpretation (MWI) · Every quantum measurement branches reality into parallel universes · Proposed: Hugh Everett (1957) · All outcomes occur, each in separate branch · No wave function collapse · Avoids measurement problem · Criticism: unfalsifiable, Occam's razor violation · Support: ~20% of physicists (2011 poll)",
          confidence: 0.85,
          expandable: true,
          expandQuery: `Many-Worlds Interpretation vs Copenhagen interpretation debate`,
        };
      }
      if (/wave\s+function\s+collapse/i.test(term)) {
        return {
          content:
            '📉 Wave function collapse · Quantum superposition becomes definite state upon measurement · Copenhagen interpretation: collapse is real · Many-Worlds: no collapse, just branching · Decoherence theory: environment causes effective collapse · Measurement problem: still unsolved after 100 years · Experiments: delayed choice quantum eraser',
          confidence: 0.83,
          expandable: true,
          expandQuery: `Measurement problem and competing interpretations of quantum mechanics`,
        };
      }
      if (/superposition/i.test(term)) {
        return {
          content:
            "⚡ Quantum superposition · Particle exists in multiple states simultaneously until measured · Famous example: Schrödinger's cat (alive + dead) · Mathematical: linear combination of eigenstates · Breaks down: decoherence from environment (~10⁻⁶ seconds for atoms) · Enables: quantum computing (qubits in 0+1 state) · Observed: double-slit experiment, quantum interference",
          confidence: 0.9,
          expandable: true,
          expandQuery: `Superposition in quantum computing and experimental verification`,
        };
      }

      return null;
    },
  },

  // Object 2: Government Programs & Research Agencies
  {
    type: 'detail',
    patterns: [
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
    ],
    extractor: (match, context) => {
      const term = match[0];

      if (/DARPA|Defense\s+Advanced\s+Research/i.test(term)) {
        return {
          content:
            '🛡️ DARPA · Defense Advanced Research Projects Agency · Budget: $4B+/year · Created: 1958 (response to Sputnik) · Achievements: internet (ARPANET), GPS, stealth tech, mRNA vaccines · Current focus: AI, hypersonics, quantum, biotech · Model: high-risk, high-reward research · Success rate: ~10% of projects transition to military use',
          confidence: 0.96,
          expandable: true,
          expandQuery: `DARPA current programs, budget allocation, and breakthrough technologies`,
        };
      }
      if (/NSF|National\s+Science\s+Foundation/i.test(term)) {
        return {
          content:
            '🔬 NSF · National Science Foundation · Budget: $9.5B (2024) · Funds: 25% of federally-funded basic research at US universities · Focus: all non-medical sciences · Grants: competitive peer review (~20% acceptance) · Impact: 235 Nobel Prizes by NSF-funded researchers · Major programs: STEM education, infrastructure (telescopes, supercomputers)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `NSF grant programs, funding priorities, and scientific impact`,
        };
      }
      if (/NIH|National\s+Institutes?\s+of\s+Health/i.test(term)) {
        return {
          content:
            '🧬 NIH · National Institutes of Health · Budget: $47B (2024) - largest biomedical research funder · 27 institutes & centers · Funds: 80% external (universities, hospitals), 10% intramural · Major: cancer research ($7B), NIAID ($6.3B), brain (BRAIN Initiative) · Achievements: COVID vaccines, cancer immunotherapy, gene therapy · Grants: R01 (investigator-initiated), ~20% funded',
          confidence: 0.95,
          expandable: true,
          expandQuery: `NIH funding priorities, major research breakthroughs, and grant success rates`,
        };
      }
      if (/NIST|National\s+Institute\s+of\s+Standards/i.test(term)) {
        return {
          content:
            '📏 NIST · National Institute of Standards and Technology · Budget: $1.5B · Mission: measurement standards, technology innovation · Impact: defines kilogram, second, meter · Cybersecurity: NIST frameworks (widely adopted) · Quantum: post-quantum cryptography standards (2024) · Manufacturing: Advanced Manufacturing Technology Consortia',
          confidence: 0.92,
          expandable: true,
          expandQuery: `NIST standards, cybersecurity frameworks, and quantum cryptography`,
        };
      }
      if (/classified\s+programs?|special\s+access\s+program|SAP/i.test(term)) {
        return {
          content:
            '🔒 Special Access Programs (SAP) · Highly classified government projects · Levels: Confidential, Secret, Top Secret, SCI (Sensitive Compartmented Information) · Black budget: estimated $50-80B annually (exact unknown) · Examples: stealth bomber (1980s), UAP research (alleged) · Oversight: limited Congressional access · Compartmentalization: need-to-know basis',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Declassified special access programs and black budget research`,
        };
      }

      return null;
    },
  },

  // Object 3: UAP/UFO Disclosure & Phenomena
  {
    type: 'detail',
    patterns: [
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
    ],
    extractor: (match, context) => {
      const term = match[0];

      if (/UAP|UFO|Unidentified\s+(?:Aerial|Flying)/i.test(term)) {
        return {
          content:
            '🛸 UAP · Unidentified Anomalous Phenomena · Pentagon confirmed: videos authentic (2020) · AARO: All-domain Anomaly Resolution Office (DoD) · Key incidents: Nimitz (2004), Roosevelt (2014-15), Tic Tac · Characteristics: hypersonic speeds, no propulsion, trans-medium travel · Congress: multiple hearings (2022-2024) · Stigma reducing in military/scientific community',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Pentagon UAP reports, AARO findings, and scientific analysis`,
        };
      }
      if (/AARO|All-domain\s+Anomaly/i.test(term)) {
        return {
          content:
            '🏛️ AARO · All-domain Anomaly Resolution Office · Established: 2022 (DoD directive) · Mission: detect, identify, attribute UAP · Director: Dr. Sean Kirkpatrick (2022-2023), then Dr. Jon Kosloski · Reports: semi-annual to Congress · Cases: 800+ reviewed, most explained (balloons, drones), ~5% remain unexplained · Goal: transparency, science-based investigation',
          confidence: 0.93,
          expandable: true,
          expandQuery: `AARO UAP investigation findings and unexplained cases`,
        };
      }
      if (/Nimitz\s+encounter|Tic\s+Tac/i.test(term)) {
        return {
          content:
            '✈️ Nimitz UAP Encounter (2004) · USS Nimitz carrier strike group · Pilots: Cmdr. David Fravor, Lt. Cmdr. Alex Dietrich · Object: "Tic Tac" shape, 40ft long, white · Behavior: instant acceleration (0-hypersonic), no wings/propulsion, jammed radar · Pentagon: video declassified 2017 · Significance: multiple sensors (radar, FLIR, eyewitness) · No conventional explanation accepted',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Nimitz encounter pilot testimony and sensor data analysis`,
        };
      }
      if (/Grusch\s+testimony|non-human\s+intelligence|craft\s+retrieval/i.test(term)) {
        return {
          content:
            '🗣️ David Grusch Testimony (2023) · Former Air Force intel officer, UAP Task Force · Claims: US has retrieved "non-human" craft · Congressional hearing: July 2023 (under oath) · Allegations: crash retrieval programs, reverse engineering, biologics recovered · Verification: ICIG (Inspector General) found credible & urgent · Status: unverified publicly, calls for further investigation · Controversy: no physical evidence shown',
          confidence: 0.85,
          expandable: true,
          expandQuery: `Grusch testimony credibility assessment and government response`,
        };
      }

      return null;
    },
  },

  // Object 4: Biology & Life Sciences
  {
    type: 'detail',
    patterns: [
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
    ],
    extractor: (match, context) => {
      const term = match[0];

      if (/protein\s+(?:structure\s+)?prediction|AlphaFold|protein\s+folding/i.test(term)) {
        return {
          content:
            '🧬 AlphaFold (Protein Prediction) · DeepMind AI predicts 3D protein structures from sequences · Accuracy: atomic-level (90% of residues within 1.5Å) · Impact: 50-year biology problem solved (2020) · Speed: minutes vs months/years (lab experiments) · Database: 200M+ structures (all known proteins) · Applications: drug discovery, enzyme design, disease research · 2024 Nobel Prize in Chemistry · AlphaFold 3: DNA, RNA, ligands',
          confidence: 0.96,
          expandable: true,
          expandQuery: `AlphaFold 3 capabilities and drug discovery applications`,
        };
      }
      if (/RNA|DNA\s+sequences?|RNA\s+and\s+DNA/i.test(term)) {
        return {
          content:
            '🧬 RNA & DNA · Genetic code molecules · DNA: blueprint (4 bases: A,T,C,G), double helix, stable · RNA: messenger (A,U,C,G), single strand, temporary · AI applications: sequence analysis, variant prediction, drug targets · Tools: AlphaFold (structure), ESM-2 (protein from DNA), RNA-FM (RNA folding) · Breakthrough: mRNA vaccines (COVID), gene therapy · Market: genomics $50B, growing 15%/year',
          confidence: 0.91,
          expandable: true,
          expandQuery: `AI tools for genomic sequence analysis and drug discovery`,
        };
      }
      if (/drug\s+discovery/i.test(term)) {
        return {
          content:
            '💊 AI Drug Discovery · AI accelerates molecule design + testing · Process: (1) target identification → (2) molecule generation → (3) property prediction → (4) synthesis → (5) trials · Speedup: 10 years → 2-3 years · Cost reduction: $2.6B → $500M-1B · Companies: Recursion, Insilico, BenevolentAI, Exscientia · Successes: COVID antivirals (Pfizer, designed in weeks) · AI models: AlphaFold, MoLFormer, generative chemistry',
          confidence: 0.93,
          expandable: true,
          expandQuery: `AI drug discovery success stories and clinical trial results`,
        };
      }

      return null;
    },
  },

  // Object 5: Scientific Concepts (Beyond Quantum)
  {
    type: 'detail',
    patterns: [
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
    ],
    extractor: (match, context) => {
      const term = match[0];

      if (/CRISPR|gene\s+editing/i.test(term)) {
        return {
          content:
            '✂️ CRISPR · Gene editing tool (Clustered Regularly Interspaced Short Palindromic Repeats) · Function: Cas9 enzyme cuts DNA at precise locations · Discovered: 2012 (Doudna, Charpentier - 2020 Nobel Prize) · Applications: disease treatment (sickle cell cure 2023), agriculture, biomanufacturing · Ethics: human germline editing controversy · Cost: $75 to edit genes (vs $1M+ pre-CRISPR) · Companies: Editas, CRISPR Therapeutics, Intellia',
          confidence: 0.96,
          expandable: true,
          expandQuery: `CRISPR clinical trials, FDA approvals, and ethical debates`,
        };
      }
      if (/mRNA\s+(?:vaccine|technology)/i.test(term)) {
        return {
          content:
            '💉 mRNA Technology · Messenger RNA instructs cells to produce proteins · COVID vaccines: Pfizer-BioNTech, Moderna (90-95% efficacy) · Mechanism: lipid nanoparticles deliver mRNA → cells produce spike protein → immune response · Advantages: fast development (10 months vs 10 years), no live virus · Future: cancer vaccines (personalized), rare diseases, flu · Pioneers: Karikó & Weissman (2023 Nobel Prize) · Market: $50B+ (2023)',
          confidence: 0.95,
          expandable: true,
          expandQuery: `mRNA cancer vaccines in clinical trials and next-generation applications`,
        };
      }
      if (/fusion\s+energy|tokamak|ITER|nuclear\s+fusion/i.test(term)) {
        return {
          content:
            '⚛️ Nuclear Fusion Energy · Fuse hydrogen atoms → helium + energy (same as Sun) · Holy grail: unlimited clean energy, no long-lived radioactive waste · Breakthrough: Dec 2022 - NIF achieved net energy gain (3.15 MJ in, 3.5 MJ out) · ITER: $25B international project (France), 2025 first plasma, 2035 full power · Tokamak: magnetic confinement (donut shape) · Challenges: 100M°C temps, containment, materials · Timeline: 2040s for commercial power (optimistic)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `Fusion energy breakthrough timeline and commercial viability`,
        };
      }
      if (/graphene|carbon\s+nanotubes?/i.test(term)) {
        return {
          content:
            '🧪 Graphene · Single layer of carbon atoms (hexagonal lattice) · Properties: 200x stronger than steel, best conductor (heat, electricity), transparent, flexible · Discovered: 2004 (Geim, Novoselov - 2010 Nobel Prize) · Applications: batteries (5x capacity), flexible electronics, water filtration, biomedical sensors · Challenges: mass production costly, integration with existing tech · Market: $2B (2024), projected $30B (2030)',
          confidence: 0.93,
          expandable: true,
          expandQuery: `Graphene commercial applications and manufacturing scalability`,
        };
      }
      if (/room-temperature\s+superconductor|LK-99/i.test(term)) {
        return {
          content:
            '🔌 Room-Temperature Superconductors · Zero electrical resistance at ambient conditions (no cooling needed) · Impact: lossless power grids, levitating trains, quantum computers · LK-99 (2023): claimed breakthrough (Korea), not replicated → debunked · Real progress: 2020 - superconductivity at 15°C but 2.6M atmospheres pressure · Challenges: pressure requirements, material stability, reproducibility · Timeline: decades away (if possible) · Holy grail of materials science',
          confidence: 0.88,
          expandable: true,
          expandQuery: `Superconductor research breakthroughs and replication challenges`,
        };
      }
      if (/dark\s+matter|dark\s+energy/i.test(term)) {
        return {
          content:
            '🌑 Dark Matter & Dark Energy · Dark matter: 27% of universe, invisible, only interacts via gravity · Evidence: galaxy rotation curves, gravitational lensing, CMB · Candidates: WIMPs, axions, primordial black holes · Dark energy: 68% of universe, causes accelerating expansion · Discovery: 1998 (Perlmutter, Schmidt, Riess - 2011 Nobel Prize) · Detection attempts: LUX-ZEPLIN, XENON, LHC · Mystery: nature of 95% of universe unknown',
          confidence: 0.92,
          expandable: true,
          expandQuery: `Dark matter detection experiments and leading theories`,
        };
      }
      if (/Higgs\s+boson|Large\s+Hadron\s+Collider|LHC|CERN/i.test(term)) {
        return {
          content:
            '⚛️ Higgs Boson & LHC · Higgs: "God particle", gives mass to other particles · Discovered: 2012 at CERN LHC (Higgs, Englert - 2013 Nobel Prize) · LHC: 27km ring, $10B, near Geneva · Collides protons at 99.999999% speed of light · Energy: 13 TeV (13 trillion electron volts) · Other discoveries: pentaquarks, tetraquarks · Next: High-Luminosity LHC (2029), Future Circular Collider (100km, $20B)',
          confidence: 0.94,
          expandable: true,
          expandQuery: `LHC discoveries beyond Higgs boson and future collider plans`,
        };
      }

      return null;
    },
  },

  // Object 6: Technical/Scientific (geographic/tectonic)
  {
    type: 'detail',
    patterns: [
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
      const term = match[0];

      if (/tectonic/i.test(term)) {
        return {
          content:
            "🌍 Tectonic plates · Earth's lithosphere divided into ~15 major plates · Move 2-15 cm/year (continental drift) · Boundaries: divergent (new crust), convergent (subduction, mountains), transform (earthquakes) · Earthquakes: 90% occur at plate boundaries · Theory accepted: 1960s (Wegener vindicated) · Evidence: GPS measurements, seafloor spreading",
          confidence: 0.85,
          expandable: true,
          expandQuery: `Tectonic plate movement and earthquake prediction`,
        };
      }
      if (/bathymetry/i.test(term)) {
        return {
          content:
            '🌊 Bathymetry · Measurement of ocean floor depth · Methods: sonar, satellites, AUVs · Deepest: Mariana Trench (10,994m) · Average ocean depth: 3,688m · Applications: submarine navigation, resource exploration, climate modeling, tsunami prediction · Unmapped: ~80% of ocean floor at high resolution',
          confidence: 0.9,
          expandable: true,
          expandQuery: `Ocean floor mapping technology and discoveries`,
        };
      }
      if (/(eastern|western|northern|southern)\s+(Africa|Australia|Asia|Europe)/i.test(term)) {
        return {
          content: `🗺️ Geographic region · Distinct climate, geology, biodiversity · Cultural and economic characteristics vary by location · Scientific interest: natural resources, ecosystems, geological activity`,
          confidence: 0.8,
          expandable: true,
          expandQuery: `Regional characteristics and significance of ${term}`,
        };
      }

      return null;
    },
  },
];
