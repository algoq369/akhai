"""AkhAI Guard Service — real NLI factuality scoring (V6 Block 3).
LettuceDetect (MIT, ModernBERT) token-level grounding: answer vs retrieved context.
Runs on a small EU CPU box (2 vCPU / 4GB, e.g. Hetzner CX22). NOT on the 1GB VPS (bench: peak 589MB).
"""
import os, time
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from lettucedetect.models.inference import HallucinationDetector

TOKEN = os.environ.get("GUARD_TOKEN", "")
detector = HallucinationDetector(
    method="transformer",
    model_path="KRLabsOrg/lettucedect-base-modernbert-en-v1",
)
app = FastAPI(title="akhai-guard", docs_url=None, redoc_url=None)


class CheckRequest(BaseModel):
    context: list[str]
    question: str = ""
    answer: str


@app.get("/health")
def health():
    return {"ok": True, "model": "lettucedect-base-modernbert-en-v1"}


@app.post("/check")
def check(req: CheckRequest, authorization: str = Header(default="")):
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="bad token")
    if not req.context or not req.answer.strip():
        raise HTTPException(status_code=422, detail="context and answer required")
    t0 = time.time()
    spans = detector.predict(
        context=req.context, question=req.question, answer=req.answer, output_format="spans"
    ) or []
    unsupported_chars = sum(max(0, s.get("end", 0) - s.get("start", 0)) for s in spans)
    score = max(0.0, round(1.0 - unsupported_chars / max(1, len(req.answer)), 3))
    return {"score": score, "spans": spans, "ms": int((time.time() - t0) * 1000)}
