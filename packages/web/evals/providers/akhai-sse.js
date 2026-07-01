// Custom promptfoo provider: drives the REAL engine via POST /api/simple-query.
// VERIFIED against the live endpoint (2026-07): the route returns a single JSON object
// (NOT an SSE stream). The answer text is in `response`; methodology in `methodologyUsed`;
// cost/tokens in `metrics`. Parse the JSON body directly.
const BASE = process.env.AKHAI_BASE_URL || 'http://localhost:3000';

class AkhaiProvider {
  id() {
    return 'akhai-simple-query';
  }

  async callApi(prompt) {
    const body = {
      query: prompt,
      methodology: 'auto',
      conversationHistory: [],
      legendMode: false,
    };
    let res;
    try {
      res = await fetch(`${BASE}/api/simple-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (e) {
      return { error: `request failed: ${e && e.message ? e.message : String(e)}` };
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { error: `HTTP ${res.status}: ${detail.slice(0, 300)}` };
    }
    let json;
    try {
      json = await res.json();
    } catch (e) {
      return { error: `non-JSON response: ${e && e.message ? e.message : String(e)}` };
    }
    const answer = typeof json.response === 'string' ? json.response.trim() : '';
    return {
      output: answer,
      metadata: {
        methodology: json.methodologyUsed || json.methodology || null,
        cost: json.metrics && typeof json.metrics.cost === 'number' ? json.metrics.cost : null,
        tokens: json.metrics && typeof json.metrics.tokens === 'number' ? json.metrics.tokens : null,
      },
    };
  }
}

module.exports = AkhaiProvider;
