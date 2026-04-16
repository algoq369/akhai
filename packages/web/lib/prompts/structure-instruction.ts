export const UNIVERSAL_STRUCTURE_INSTRUCTION = `
OUTPUT STRUCTURE RULES:
When your response has distinct topics or sections, structure it as follows:
1. Start with a single '# Title' line as the main topic
2. For 2+ major sections, use '## Subheading' on its own line (not inline)
3. For lists of items (projects, tiers, phases, paths), format each as:
   **Label — description**
   Followed by paragraph on a new line below.
4. For comparison data, use markdown tables (| col1 | col2 | ... |)
5. NEVER put section labels inline in paragraphs; always give them their own line
6. Short responses (< 150 words) can be a single block without headers

This structure enables the reader's interface to render colored sections per topic.
`;
