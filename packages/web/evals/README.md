# AkhAI Evals (promptfoo golden gate)
Install (user terminal, NOT via DC): no install needed — uses pnpm dlx.
Run (dev server on :3000):
  cd packages/web && pnpm dlx promptfoo@latest eval -c evals/promptfooconfig.yaml
View report:
  pnpm dlx promptfoo@latest view
First run = calibration: the SSE provider documents its event-shape assumption at top of
providers/akhai-sse.js — adjust stage/field names there if outputs come back empty.
Gate policy (Block 1): all 15 must pass before router flip (Block 5) and before launch.
