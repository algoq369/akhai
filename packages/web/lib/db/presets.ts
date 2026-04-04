import { db } from '@/lib/database';

/**
 * Insert preset tree configurations if they don't exist.
 * Called from database.ts on module load.
 */
export function insertPresetTreeConfigurations() {
  try {
    const existingPresets = db
      .prepare('SELECT COUNT(*) as count FROM tree_configurations WHERE user_id IS NULL')
      .get() as { count: number };

    if (existingPresets.count === 0) {
      const insertPreset = db.prepare(`
        INSERT INTO tree_configurations (user_id, name, description, is_active, layer_weights, antipattern_suppression, pillar_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Balanced - Default configuration
      insertPreset.run(
        null,
        'Balanced',
        'Default balanced configuration with equal emphasis on all Layers',
        0,
        JSON.stringify({
          '1': 0.5,
          '2': 0.5,
          '3': 0.5,
          '4': 0.5,
          '5': 0.5,
          '6': 0.5,
          '7': 0.5,
          '8': 0.5,
          '9': 0.5,
          '10': 0.5,
          '11': 0.5,
        }),
        JSON.stringify({
          '1': 0.5,
          '2': 0.5,
          '3': 0.5,
          '4': 0.5,
          '5': 0.5,
          '6': 0.5,
          '7': 0.5,
          '8': 0.5,
          '9': 0.5,
          '10': 0.5,
          '11': 0.5,
          '12': 0.5,
        }),
        JSON.stringify({ left: 0.33, middle: 0.34, right: 0.33 })
      );

      // Analytical - Emphasizes logic and understanding
      insertPreset.run(
        null,
        'Analytical',
        'Emphasizes logic, understanding, and structured reasoning (Reasoning, Encoder, Classifier)',
        0,
        JSON.stringify({
          '1': 0.3,
          '2': 0.9,
          '3': 0.9,
          '4': 0.4,
          '5': 0.7,
          '6': 0.5,
          '7': 0.4,
          '8': 0.8,
          '9': 0.5,
          '10': 0.6,
          '11': 0.4,
        }),
        JSON.stringify({
          '1': 0.8,
          '2': 0.2,
          '3': 0.3,
          '4': 0.7,
          '5': 0.6,
          '6': 0.5,
          '7': 0.6,
          '8': 0.2,
          '9': 0.7,
          '10': 0.6,
          '11': 0.5,
          '12': 0.3,
        }),
        JSON.stringify({ left: 0.2, middle: 0.6, right: 0.2 })
      );

      // Compassionate - Emphasizes empathy and harmony
      insertPreset.run(
        null,
        'Compassionate',
        'Emphasizes empathy, mercy, and harmonious integration (Expansion, Attention, Generative)',
        0,
        JSON.stringify({
          '1': 0.4,
          '2': 0.5,
          '3': 0.6,
          '4': 0.9,
          '5': 0.3,
          '6': 0.9,
          '7': 0.7,
          '8': 0.5,
          '9': 0.6,
          '10': 0.5,
          '11': 0.5,
        }),
        JSON.stringify({
          '1': 0.6,
          '2': 0.5,
          '3': 0.5,
          '4': 0.3,
          '5': 0.9,
          '6': 0.2,
          '7': 0.4,
          '8': 0.5,
          '9': 0.4,
          '10': 0.5,
          '11': 0.6,
          '12': 0.5,
        }),
        JSON.stringify({ left: 0.1, middle: 0.7, right: 0.2 })
      );

      // Creative - Emphasizes imagination and possibility
      insertPreset.run(
        null,
        'Creative',
        'Emphasizes imagination, creative expression, and innovative thinking (Generative, Executor, Reasoning)',
        0,
        JSON.stringify({
          '1': 0.5,
          '2': 0.8,
          '3': 0.7,
          '4': 0.6,
          '5': 0.5,
          '6': 0.7,
          '7': 0.9,
          '8': 0.6,
          '9': 0.9,
          '10': 0.5,
          '11': 0.6,
        }),
        JSON.stringify({
          '1': 0.5,
          '2': 0.4,
          '3': 0.4,
          '4': 0.5,
          '5': 0.6,
          '6': 0.4,
          '7': 0.2,
          '8': 0.4,
          '9': 0.1,
          '10': 0.3,
          '11': 0.5,
          '12': 0.6,
        }),
        JSON.stringify({ left: 0.15, middle: 0.45, right: 0.4 })
      );

      console.log(
        '✅ Inserted 4 preset tree configurations (Balanced, Analytical, Compassionate, Creative)'
      );
    }
  } catch (error) {
    console.error('Failed to insert preset tree configurations:', error);
  }
}
