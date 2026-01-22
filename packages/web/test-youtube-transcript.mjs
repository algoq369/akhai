import { YoutubeTranscript } from 'youtube-transcript';

async function test() {
  console.log('🧪 Testing youtube-transcript package...\n');

  const tests = [
    { id: 'aircAruvnKk', name: '3Blue1Brown - Neural Networks' },
    { id: '97OTUsDVuTk', name: 'UFC Year In Review 2025' },
  ];

  for (const test of tests) {
    console.log(`\n📹 Testing: ${test.name}`);
    console.log(`   Video ID: ${test.id}`);

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(test.id);

      if (!transcript || transcript.length === 0) {
        console.log('   ❌ No transcript available\n');
        continue;
      }

      console.log(`   ✅ SUCCESS!`);
      console.log(`   Items: ${transcript.length}`);
      console.log(`   Duration: ~${Math.round(transcript[transcript.length - 1].offset / 1000 / 60)} minutes`);

      const fullText = transcript.map(t => t.text).join(' ');
      console.log(`   Length: ${fullText.length} characters`);
      console.log(`   Preview: ${fullText.slice(0, 150)}...\n`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
}

test().catch(console.error);
