Read CLI_PROMPT_PAGE_SPLIT.md for the full plan.

Execute the page.tsx split refactor:
1. Create components/home/ directory
2. Start with FooterBar.tsx (smallest, cleanest)
3. Then InputSection.tsx
4. Then MessageArea.tsx (biggest impact)
5. Build-check after each extraction: AKHAI_FREE_MODE=true npx next build
6. git commit after each successful build

Rules:
- Keep ALL state in page.tsx
- New components receive props only
- No behavior changes
- Verify build passes between each extraction
