// Lightweight Discord webhook utility — no dependencies
// Set DISCORD_DEPLOY, DISCORD_ERRORS, DISCORD_ALERTS in .env

const WEBHOOKS = {
  deploy: process.env.DISCORD_DEPLOY,
  errors: process.env.DISCORD_ERRORS,
  alerts: process.env.DISCORD_ALERTS,
} as const;

type Channel = keyof typeof WEBHOOKS;

export async function notify(
  channel: Channel,
  title: string,
  description: string,
  color = 0x2ecc71
): Promise<void> {
  const url = WEBHOOKS[channel];
  if (!url) return; // silently skip if webhook not configured

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description: description.slice(0, 2000),
            color,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // never let notification failures crash the app
  }
}

// Convenience colors
export const Colors = {
  success: 0x2ecc71,
  error: 0xe74c3c,
  warning: 0xf39c12,
  info: 0x3498db,
} as const;
