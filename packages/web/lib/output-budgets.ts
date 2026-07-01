// Per-methodology output ceilings. Output tokens are ~4-5x input price, so right-size to the task.
// These are CEILINGS (safety + worst-case cost protection), set generously above observed output
// to avoid truncating legitimate answers. Bumping a budget = edit here only.
export const OUTPUT_BUDGETS: Record<string, number> = {
  direct: 1500, // quick factual answer
  cod: 2000, // chain-of-draft, concise
  react: 2500, // synthesize search results
  pas: 3000, // plan-and-solve
  sc: 3500, // self-consistency, multi-path converging
  tot: 4096, // tree-of-thoughts, deepest — keep the max
  auto: 3000, // safety default; auto resolves to a real methodology upstream
};

export function maxTokensFor(methodology: string): number {
  return OUTPUT_BUDGETS[methodology] ?? 4096;
}
