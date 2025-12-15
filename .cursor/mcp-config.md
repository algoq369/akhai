# MCP Configuration for ReactBits

## Recommended MCP Configuration
Add this to your global MCP config at `~/.cursor/mcp.json` or create a project-specific config:

```json
{
  "mcpServers": {
    "reactbits": {
      "registry": "https://reactbits.dev/r/{name}.json",
      "installPath": "/Users/sheirraza/akhai/packages/web/components/ui",
      "components": [
        "magic-bento",
        "flowing-menu",
        "galaxy",
        "decrypted-text"
      ],
      "settings": {
        "autoInstall": false,
        "colorScheme": "greyscale-only",
        "framework": "next",
        "typescript": true
      }
    }
  }
}
```

## Global MCP Config Location
`~/.cursor/mcp.json`

## How to Add
If you have an existing MCP config, merge the `reactbits` entry into your `mcpServers` object.

If you don't have an MCP config yet:
```bash
# Create the config file
cat > ~/.cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "reactbits": {
      "registry": "https://reactbits.dev/r/{name}.json",
      "installPath": "/Users/sheirraza/akhai/packages/web/components/ui",
      "components": ["magic-bento", "flowing-menu", "galaxy", "decrypted-text"]
    }
  }
}
EOF
```

## Notes
- This configuration helps Cursor AI understand where to fetch ReactBits components
- The `installPath` is project-specific
- `autoInstall: false` prevents automatic installation (manual review recommended)
- `colorScheme: "greyscale-only"` ensures grey-only design compliance
