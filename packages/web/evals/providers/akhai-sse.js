// Custom promptfoo provider: drives the REAL engine via /api/simple-query SSE.
// ASSUMPTION (calibrate on first run): events arrive as `data: {json}` lines with
// {stage, status, data}; answer text accumulates from string `data` payloads.
const BASE = process.env.AKHAI_BASE_URL || 'http://localhost:3000';

class AkhaiSSEProvider {
  id() { return 'akhai-sse'; }
  async callApi(prompt) {
    const body = {
      query: prompt,
      methodology: 'auto',
      conversationHistory: [],
      legendMode: false,
      clientQueryId: (globalThis.crypto?.randomUUID?.() || String(Date.now())),
    };
    const res = await fetch(`${BASE}/api/simple-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok || !res.body) {
      return { error: `HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}` };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', answer = '', methodology = null, stages = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const ev = JSON.parse(raw);
          if (ev.stage) stages.push(ev.stage);
          if (ev.methodology) methodology = ev.methodology;
          if (typeof ev.data === 'string' && !/^(Analyzing|Connecting)/.test(ev.data)) answer += ev.data;
          if (ev.response && typeof ev.response === 'string') answer = ev.response;
        } catch { /* non-JSON keepalive */ }
      }
    }
    return { output: answer.trim(), metadata: { methodology, stages: [...new Set(stages)] } };
  }
}
module.exports = AkhaiSSEProvider;
