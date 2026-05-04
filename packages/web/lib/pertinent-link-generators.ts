/**
 * Pertinent Link Generators - Domain-specific link generation
 *
 * Extracted from pertinent-links.ts to keep files under 500 lines.
 * Each function appends domain-specific links to the provided array.
 */

import type { PertinentLink } from './pertinent-links';

export interface QueryIntent {
  isResearch: boolean;
  isImplementation: boolean;
  isExplanation: boolean;
  isComparison: boolean;
  isNews: boolean;
  isCode: boolean;
  isVideo: boolean;
  isDiscussion: boolean;
  isData: boolean;
  isScientific: boolean;
  isTech: boolean;
  isAI: boolean;
  isClimate: boolean;
  isHealth: boolean;
  isEconomic: boolean;
  isFinance: boolean;
  isScience: boolean;
  isCrypto: boolean;
  isPolicy: boolean;
  isQuantum: boolean;
  isUAP: boolean;
  isPatent: boolean;
  isGovernment: boolean;
  isAerospace: boolean;
  isBiomedical: boolean;
  isEngineering: boolean;
}

/** Quantum computing - specialized research sources */
export function addQuantumLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `arxiv-quantum-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://arxiv.org/search/?query=${encodedMain}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`,
    title: `${mainEntity} - Quantum Physics Papers`,
    source: 'ArXiv Quantum',
    description: `Latest quantum computing and physics research papers`,
    relevance: 0.98,
  });

  links.push({
    id: `qutip-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://qutip.org/docs/latest/index.html`,
    title: `Quantum Toolbox - Documentation`,
    source: 'QuTiP',
    description: `Open-source quantum computing framework and simulations`,
    relevance: 0.94,
  });

  links.push({
    id: `aps-quantum-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://journals.aps.org/prx/`,
    title: `Physical Review X - Quantum Research`,
    source: 'APS Physics',
    description: `High-impact quantum physics journal articles`,
    relevance: 0.96,
  });
}

/** UAP/UFO - Government and research sources */
export function addUAPLinks(links: PertinentLink[]): void {
  links.push({
    id: `nasa-uap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://science.nasa.gov/uap/`,
    title: `NASA UAP Independent Study`,
    source: 'NASA',
    description: `Official NASA research on Unidentified Anomalous Phenomena`,
    relevance: 0.98,
  });

  links.push({
    id: `dod-uap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.defense.gov/News/Releases/Release/Article/3249894/dod-announces-establishment-of-all-domain-anomaly-resolution-office/`,
    title: `DoD All-domain Anomaly Resolution Office`,
    source: 'Department of Defense',
    description: `Official Pentagon UAP investigation office (AARO)`,
    relevance: 0.97,
  });

  links.push({
    id: `dni-uap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.dni.gov/index.php/newsroom/reports-publications`,
    title: `DNI UAP Reports`,
    source: 'Director of National Intelligence',
    description: `Declassified UAP reports and congressional briefings`,
    relevance: 0.96,
  });
}

/** Patents - Patent databases */
export function addPatentLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `patents-google-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://patents.google.com/?q=${encodedMain}&oq=${encodedMain}`,
    title: `${mainEntity} - Patent Search`,
    source: 'Google Patents',
    description: `USPTO and worldwide patent database search`,
    relevance: 0.97,
  });

  links.push({
    id: `uspto-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://ppubs.uspto.gov/pubwebapp/static/pages/ppubsbasic.html`,
    title: `USPTO Patent Database`,
    source: 'USPTO',
    description: `Official United States Patent and Trademark Office database`,
    relevance: 0.96,
  });

  links.push({
    id: `espacenet-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://worldwide.espacenet.com/?locale=en_EP`,
    title: `Espacenet - Global Patents`,
    source: 'European Patent Office',
    description: `Access to over 140 million patent documents worldwide`,
    relevance: 0.95,
  });
}

/** Government/DARPA - .gov research sources */
export function addGovernmentLinks(links: PertinentLink[]): void {
  links.push({
    id: `darpa-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.darpa.mil/news-events/recent-news`,
    title: `DARPA News & Programs`,
    source: 'DARPA',
    description: `Defense Advanced Research Projects Agency announcements`,
    relevance: 0.97,
  });

  links.push({
    id: `foia-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.foia.gov/search.html`,
    title: `FOIA Document Search`,
    source: 'FOIA.gov',
    description: `Freedom of Information Act declassified documents`,
    relevance: 0.95,
  });

  links.push({
    id: `nist-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.nist.gov/publications`,
    title: `NIST Publications`,
    source: 'NIST',
    description: `National Institute of Standards and Technology research`,
    relevance: 0.94,
  });
}

/** Aerospace - NASA and space research */
export function addAerospaceLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `nasa-ntrs-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://ntrs.nasa.gov/search?q=${encodedMain}`,
    title: `${mainEntity} - NASA Research`,
    source: 'NASA NTRS',
    description: `NASA Technical Reports Server - aerospace research`,
    relevance: 0.98,
  });

  links.push({
    id: `nasa-science-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://science.nasa.gov/`,
    title: `NASA Science Missions`,
    source: 'NASA',
    description: `Official NASA science mission data and discoveries`,
    relevance: 0.96,
  });

  links.push({
    id: `aiaa-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://arc.aiaa.org/`,
    title: `AIAA Aerospace Research`,
    source: 'AIAA',
    description: `American Institute of Aeronautics and Astronautics journal`,
    relevance: 0.94,
  });
}

/** Biomedical - PubMed and medical research */
export function addBiomedicalLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `pubmed-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedMain}`,
    title: `${mainEntity} - Medical Research`,
    source: 'PubMed',
    description: `National Library of Medicine biomedical literature database`,
    relevance: 0.98,
  });

  links.push({
    id: `nih-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.nih.gov/search-results?search_api_fulltext=${encodedMain}`,
    title: `${mainEntity} - NIH Research`,
    source: 'NIH',
    description: `National Institutes of Health research findings`,
    relevance: 0.96,
  });

  links.push({
    id: `clinicaltrials-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://clinicaltrials.gov/search?term=${encodedMain}`,
    title: `${mainEntity} - Clinical Trials`,
    source: 'ClinicalTrials.gov',
    description: `Active and completed clinical research trials database`,
    relevance: 0.95,
  });
}

/** Engineering - IEEE and technical standards */
export function addEngineeringLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `ieee-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodedMain}`,
    title: `${mainEntity} - IEEE Papers`,
    source: 'IEEE Xplore',
    description: `Institute of Electrical and Electronics Engineers research`,
    relevance: 0.97,
  });

  links.push({
    id: `acm-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://dl.acm.org/action/doSearch?AllField=${encodedMain}`,
    title: `${mainEntity} - ACM Digital Library`,
    source: 'ACM',
    description: `Association for Computing Machinery technical papers`,
    relevance: 0.95,
  });
}

/** Financial/Economic sources */
export function addFinanceLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `bloomberg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.bloomberg.com/search?query=${encodedMain}`,
    title: `${mainEntity} - Bloomberg Markets`,
    source: 'Bloomberg',
    description: `Financial news, analysis, and market data for ${mainEntity}`,
    relevance: 0.96,
  });

  links.push({
    id: `ft-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.ft.com/search?q=${encodedMain}`,
    title: `${mainEntity} - Financial Times`,
    source: 'Financial Times',
    description: `Global business and economic insights on ${mainEntity}`,
    relevance: 0.95,
  });

  links.push({
    id: `fed-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.federalreserve.gov/search.htm?q=${encodedMain}`,
    title: `${mainEntity} - Federal Reserve`,
    source: 'Federal Reserve',
    description: `Central bank data and policy analysis`,
    relevance: 0.94,
  });
}

/** Crypto/Blockchain sources */
export function addCryptoLinks(
  links: PertinentLink[],
  encodedMain: string,
  mainEntity: string
): void {
  links.push({
    id: `cmc-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://coinmarketcap.com/currencies/${encodedMain.toLowerCase()}/`,
    title: `${mainEntity} - Price & Market Data`,
    source: 'CoinMarketCap',
    description: `Real-time price, market cap, and trading data for ${mainEntity}`,
    relevance: 0.97,
  });

  links.push({
    id: `crypto-twitter-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://twitter.com/search?q=%23${encodedMain}%20crypto&f=live`,
    title: `${mainEntity} - Crypto Twitter`,
    source: 'Crypto Twitter',
    description: `Live tweets, alpha, and community sentiment on ${mainEntity}`,
    relevance: 0.91,
  });

  links.push({
    id: `coindesk-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.coindesk.com/search?q=${encodedMain}`,
    title: `${mainEntity} - Crypto News`,
    source: 'CoinDesk',
    description: `Breaking news and in-depth analysis for ${mainEntity}`,
    relevance: 0.93,
  });

  links.push({
    id: `messari-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://messari.io/research`,
    title: `${mainEntity} - Research Reports`,
    source: 'Messari',
    description: `Professional-grade crypto research and analysis`,
    relevance: 0.94,
  });

  links.push({
    id: `theblock-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    url: `https://www.theblock.co/search?query=${encodedMain}`,
    title: `${mainEntity} - Technical Analysis`,
    source: 'The Block',
    description: `On-chain data and technical crypto analysis`,
    relevance: 0.92,
  });
}
