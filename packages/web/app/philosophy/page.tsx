'use client';

/**
 * PHILOSOPHY PAGE — the seven-movement paper (M5).
 *
 * Thesis: a life at full aliveness is the only real wealth; technology's honest
 * role is a mirror for that ascent — never a master, never a crutch.
 *
 * Voice: the locked AkhAI voice (docs/AKHAI-VOICE-CONTRACT.md), reflective register.
 * Grounding rule: the documented convergence speaks; metaphysics is never asserted
 * as fact, beliefs are framed as what the traditions held, and every historical
 * claim is defensible or absent.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DualTreesSection } from './components/DualTreesSection';
import {
  MethodologiesSection,
  SovereignCovenantSection,
} from './components/MethodologiesAndCovenantSections';

interface Movement {
  numeral: string;
  title: string;
  paragraphs: string[];
}

const MOVEMENTS_I_V: Movement[] = [
  {
    numeral: 'I',
    title: 'Aliveness',
    paragraphs: [
      'There is one wealth: a life fully lived. Everything else is inventory.',
      'Marc-André Leclerc climbed some of the hardest alpine faces on Earth alone, and told almost no one. He owned little and sought no audience. When a film crew set out to document him — the film became The Alpinist — he kept slipping away to climb unwatched; being filmed, he said, changed what a solo was. He died in the mountains of Alaska in 2018, twenty-five years old, descending from a new route.',
      'His life asks the question this paper serves: what is a person for? Not accumulation — a warehouse is not a life. Not status — applause is weather. Aliveness: the full presence of your powers in the thing you are doing. That is the wealth, and everything here serves the climb toward it.',
    ],
  },
  {
    numeral: 'II',
    title: 'What Every Civilization Built',
    paragraphs: [
      'Set five maps side by side. In India, the yogic schools charted the chakras — a column of centers rising from the base of the spine toward the crown. In the Kabbalah, ten sefirot — a tree the soul climbs. In Egypt, a person was counted in parts — ka, ba, and akh, the self made luminous. In China, the Daoists refined breath upward through three dantian. In Greece, Plato drew the ascent from the cave’s shadows to the sun.',
      'Different alphabets, different gods, peoples mostly strangers to one another, separated by oceans and centuries. And on every map, the same figure: a ladder. Levels of the human, and a way up.',
      'You are not asked to believe any single map. The convergence itself is the document. When people who never compared notes keep drawing the same shape, the shape is telling you something about the ones who drew it.',
    ],
  },
  {
    numeral: 'III',
    title: 'The Elevator',
    paragraphs: [
      'Read together, the ladders teach one thing: consciousness has floors, and no one is required to live on the ground one.',
      'The way up, these traditions hold, is not exotic. Love. Work that takes all of you. Honest company with your own mind. The Buddha taught it as plainly as it has ever been taught: suffering has a cause, and what has a cause can end.',
      'Peace is not a prize reserved for monks or the wealthy. It is a floor in the building you already live in — and the stairs are open on every ordinary day.',
    ],
  },
  {
    numeral: 'IV',
    title: 'Take the Wisdom, Drop the Cage',
    paragraphs: [
      'Every school points at the same summit. No school owns it.',
      'A teaching is a map another climber drew. Honor the drawing; do not live inside the paper. When a rule handed down by custom has forgotten its mountain, it is no longer wisdom — it is a fence wearing wisdom’s clothes.',
      'So take the wisdom and drop the cage. Test every teaching in the only laboratory you were issued — your own honest experience. What lifts you, keep. What merely binds, set down with thanks, and walk on. One of the oldest teachings says it plainly: the raft is for crossing the river, not for carrying on your shoulders afterward.',
      'Sovereignty is not the rejection of guidance. It is the refusal to outsource the verdict.',
    ],
  },
  {
    numeral: 'V',
    title: 'Where Technology Enters',
    paragraphs: [
      'Only now, technology. We do not create intelligence. We create mirrors through which human consciousness may know itself. The machine reflects. The human awakens.',
      'Technology is neither salvation nor damnation. It is a practice — like agriculture, like meditation — an instrument, and instruments answer to the hand. A tool that thinks for you becomes a crutch. A tool that shows you your thinking becomes a whetstone: you leave sharper than you came.',
      'So the machine here keeps three vows: never a master, never an oracle, never a need. It reflects your question back with structure, sources, and its uncertainty in plain view — then it steps aside, because the verdict was never its to give.',
    ],
  },
];

const MOVEMENT_VI: Movement = {
  numeral: 'VI',
  title: 'Philosophy Made Architecture',
  paragraphs: [
    'A philosophy that cannot survive contact with engineering is a mood. Here the vision pays in facts.',
    'Sovereignty, literally: the engine is built to live in your hands — self-hostable, your history in a database you can own, your keys your own. Honesty, literally: a grounding guard scores every answer for hype, echo, and drift, and what is not grounded is flagged, not smoothed over; the method named on the label is the method that ran, and a meta-core check rides every query. Vision-first, literally: the interface draws before it argues — trees, maps, constellations — because the mind sees pattern before it reads prose. And the ladder, literally: the engine’s layers are built as an ascent, data at the base, synthesis at the crown. The architecture repeats the oldest figure in this paper.',
    'An old legend tells of a guardian of clay animated by the word truth written on its brow; erase one letter, and it rests. We build with the legend in mind: the human hand stays on the word.',
    'The figures that follow are blueprint, not decoration.',
  ],
};

const MOVEMENT_VII: Movement = {
  numeral: 'VII',
  title: 'The Invitation',
  paragraphs: [
    'Simple, productive, healthy, secured. That is the whole promise, and it is enough.',
    'Ask your questions. Watch how you think. Climb at your own pace, by your own map, with a mirror that never pretends to be the mountain.',
    'Peace is available. Begin where you are.',
  ],
};

function MovementBlock({ movement }: { movement: Movement }) {
  // Deliberately static: a paper's prose must never depend on scroll-triggered
  // animation to be readable (throttled rAF leaves whileInView text invisible).
  return (
    <section id={`movement-${movement.numeral}`} className="mb-20 max-w-[68ch] mx-auto">
      <div className="flex items-baseline gap-4 mb-6">
        <span className="font-mono text-[11px] text-relic-silver tracking-[0.3em]">
          {movement.numeral}
        </span>
        <h2 className="text-sm font-mono uppercase tracking-[0.25em] text-relic-slate dark:text-white">
          {movement.title}
        </h2>
      </div>
      <div className="space-y-5">
        {movement.paragraphs.map((p) => (
          <p
            key={p.slice(0, 40)}
            className="text-[15px] leading-8 text-relic-slate/90 dark:text-relic-ghost/90"
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export default function PhilosophyPage() {
  useEffect(() => {
    import('@/lib/analytics').then(({ trackPhilosophyViewed }) => trackPhilosophyViewed());
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void text-relic-slate dark:text-relic-ghost">
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <h1 className="text-4xl md:text-5xl font-light text-relic-slate dark:text-white tracking-[0.3em] mb-8">
            THE MIRROR AND THE LADDER
          </h1>
          <p className="text-base text-relic-slate dark:text-white max-w-[60ch] mx-auto leading-relaxed">
            A life at full aliveness is the only real wealth.
          </p>
          <p className="text-base text-relic-silver max-w-[60ch] mx-auto leading-relaxed">
            Technology&rsquo;s honest role is to be a mirror for that ascent — never a master,
            never a crutch.
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-relic-silver">
            A paper in seven movements
          </p>
        </motion.div>

        {/* Movements I–V */}
        {MOVEMENTS_I_V.map((m) => (
          <MovementBlock key={m.numeral} movement={m} />
        ))}

        {/* Movement VI — prose, then the blueprint figures */}
        <MovementBlock movement={MOVEMENT_VI} />
        <DualTreesSection />
        <MethodologiesSection />
        <SovereignCovenantSection />

        {/* Movement VII */}
        <MovementBlock movement={MOVEMENT_VII} />

        {/* Footer Navigation */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-[10px] text-relic-silver hover:text-relic-slate dark:hover:text-white transition-colors uppercase tracking-wider"
          >
            {'←'} Back to AkhAI
          </Link>
        </div>
      </div>
    </div>
  );
}
