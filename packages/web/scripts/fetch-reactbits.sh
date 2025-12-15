#!/bin/bash
# Fetch ReactBits components
# Usage: ./scripts/fetch-reactbits.sh [component-name]

set -e

COMPONENTS=("magic-bento" "flowing-menu" "galaxy" "decrypted-text")
BASE_URL="https://reactbits.dev/r"
OUTPUT_DIR="./components/ui"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}ReactBits Component Fetcher${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# If a specific component is provided as argument, fetch only that
if [ ! -z "$1" ]; then
    COMPONENTS=("$1")
fi

for comp in "${COMPONENTS[@]}"; do
    echo -e "\n${YELLOW}Fetching${NC} $comp..."

    # Fetch component metadata
    RESPONSE=$(curl -s "$BASE_URL/$comp.json")

    if [ -z "$RESPONSE" ]; then
        echo -e "${RED}✗${NC} Failed to fetch $comp"
        continue
    fi

    # Save raw JSON for inspection
    echo "$RESPONSE" > "/tmp/$comp.json"

    # Try to extract component code using jq
    if command -v jq &> /dev/null; then
        # Extract files from JSON
        FILES_COUNT=$(echo "$RESPONSE" | jq -r '.files | length' 2>/dev/null || echo "0")

        if [ "$FILES_COUNT" -gt 0 ]; then
            for i in $(seq 0 $((FILES_COUNT - 1))); do
                FILENAME=$(echo "$RESPONSE" | jq -r ".files[$i].name" 2>/dev/null)
                CONTENT=$(echo "$RESPONSE" | jq -r ".files[$i].content" 2>/dev/null)

                if [ ! -z "$FILENAME" ] && [ ! -z "$CONTENT" ]; then
                    echo "$CONTENT" > "$OUTPUT_DIR/$FILENAME"
                    echo -e "${GREEN}✓${NC} Saved to $OUTPUT_DIR/$FILENAME"
                fi
            done
        else
            echo -e "${RED}✗${NC} No files found in response for $comp"
            echo "   JSON saved to /tmp/$comp.json for manual inspection"
        fi
    else
        echo -e "${YELLOW}⚠${NC}  jq not installed - saving raw JSON to /tmp/$comp.json"
        echo "   Install jq with: brew install jq"
    fi
done

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Done!${NC} Components saved to $OUTPUT_DIR"
echo ""
echo "Note: ReactBits may not provide direct source code."
echo "Check /tmp/*.json for raw responses."
echo "You may need to manually create components based on the demos."
