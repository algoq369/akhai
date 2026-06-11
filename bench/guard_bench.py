#!/usr/bin/env python3
"""Block 3 gate: LettuceDetect CPU bench — RAM + latency truth before integration (V6)."""
import time, sys, platform, resource, statistics

DIV = 1024 * 1024 if sys.platform == "darwin" else 1024  # ru_maxrss: bytes on macOS, KB on linux
def rss_mb():
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / DIV

base = rss_mb()
t0 = time.time()
from lettucedetect.models.inference import HallucinationDetector
det = HallucinationDetector(
    method="transformer",
    model_path="KRLabsOrg/lettucedect-base-modernbert-en-v1",
)
load_s = time.time() - t0
loaded = rss_mb()

context = ["AkhAI is a sovereign AI research engine built in Norway. "
           "It routes queries through seven reasoning methodologies and verifies answers "
           "against a retrieval store. The free tier allows 50K tokens per day. " * 12]
question = "Describe AkhAI and its free tier."
grounded = ("AkhAI is a sovereign AI research engine that routes queries through seven "
            "reasoning methodologies. Its free tier allows 50K tokens per day.")
halluc = ("AkhAI was founded in 1995 by NASA, has four billion users in Antarctica, "
          "and its free tier allows 900 million tokens per day on Mars.")

# warm-up (first call pays tokenizer/jit costs)
t = time.time(); det.predict(context=context, question=question, answer=grounded, output_format="spans")
warm_ms = (time.time() - t) * 1000

lat = []
flagged = 0
for i in range(12):
    ans = halluc if i % 2 else grounded
    t = time.time()
    spans = det.predict(context=context, question=question, answer=ans, output_format="spans")
    lat.append((time.time() - t) * 1000)
    if i % 2 and spans: flagged += 1

peak = rss_mb()
lat.sort()
p50 = statistics.median(lat); p95 = lat[int(len(lat) * 0.95) - 1]
print(f"platform        : {platform.machine()} / {platform.processor()}")
print(f"model load      : {load_s:.1f}s")
print(f"RSS base/loaded/peak : {base:.0f} / {loaded:.0f} / {peak:.0f} MB")
print(f"warm-up call    : {warm_ms:.0f} ms")
print(f"latency p50/p95 : {p50:.0f} / {p95:.0f} ms   (n=12, ~700-token ctx)")
print(f"halluc detection: flagged {flagged}/6 fabricated answers")
print()
VPS_FACTOR = 3.5  # M3 single-thread -> budget VPS vCPU honesty multiplier
print(f"VPS-projected p50/p95 : ~{p50*VPS_FACTOR:.0f} / ~{p95*VPS_FACTOR:.0f} ms")
budget = 1024 - 500  # 1GB box minus node+pm2+caddy steady state
verdict = "PASS-1GB" if peak < budget else ("PASS-2GB/CPU-BOX" if peak < 1600 else "GPU-OR-QUANT")
print(f"RAM verdict     : peak {peak:.0f} MB vs ~{budget} MB free on 1GB VPS -> {verdict}")
