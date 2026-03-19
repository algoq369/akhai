Read /Users/sheirraza/akhai/CLAUDE.md for project rules.

CRITICAL BUG: Side Canal topic extraction is hardcoded to Anthropic API which has no credits.
This breaks: Mindmap panel (no topics), Insight panel (no data), depth annotations (no context).

FIX lib/side-canal.ts — Make extractTopics() and generateSynopsis() use free tier when Anthropic fails.

APPROACH:
1. In lib/side-canal.ts, find the two fetch calls to api.anthropic.com (lines ~75 and ~380)
2. Wrap each in a try/catch. If Anthropic fails (400/401/402/429), fall back to OpenRouter:
   - URL: https://openrouter.ai/api/v1/chat/completions
   - Model: meta-llama/llama-3.3-70b-instruct:free
   - API Key: process.env.OPENROUTER_API_KEY
   - Headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" }
   - Body format: OpenAI-compatible { model, messages: [{role:"user", content}], max_tokens }
   - Parse: response.choices[0].message.content (not response.content[0].text)

3. OR simpler: Check AKHAI_FREE_MODE at the top. If true, use OpenRouter directly (skip Anthropic entirely).
   This avoids the failed Anthropic call + retry delay.

4. Keep the same system prompt and extraction logic — just swap the API endpoint and response parsing.

5. After fix, verify by restarting server and checking:
   curl -s -X POST http://localhost:3000/api/auth/dev-login -c /tmp/c
   curl -s -b /tmp/c -X POST http://localhost:3000/api/simple-query \
     -H "Content-Type: application/json" \
     -d '{"query":"Compare quantum computing and classical computing","methodology":"auto"}' \
     | python3 -c "import json,sys; d=json.load(sys.stdin); print('Topics:', len(d.get('sideCanal',{}).get('suggestions',[]))); print('Extracted:', d.get('sideCanal',{}).get('topicsExtracted',False))"

   Expected: Topics > 0, Extracted: True

6. Commit: git add -A && git commit -m "fix: Side Canal uses free tier (OpenRouter) when Anthropic unavailable"

IMPORTANT: Don't break the Anthropic path — when credits are refilled it should use Anthropic again.
The check should be: if AKHAI_FREE_MODE=true OR if ANTHROPIC_API_KEY is missing, use OpenRouter.
