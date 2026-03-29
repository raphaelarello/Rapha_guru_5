import type { WhatsAppProvider, WhatsAppSessionStatus, WhatsAppSendInput } from "./provider";

/**
 * NOTE: This is a scaffolding. To enable, install:
 *   pnpm add whatsapp-web.js qrcode
 * Requires headless Chromium and is heavier than Baileys.
 */
export class WebJsProvider implements WhatsAppProvider {
  readonly kind = "webjs" as const;

  async startSession(_sessionId: string): Promise<void> {
    throw new Error("WebJsProvider not enabled (install deps + implement).");
  }

  async getStatus(_sessionId: string): Promise<WhatsAppSessionStatus> {
    return { state: "DISCONNECTED" };
  }

  async logout(_sessionId: string): Promise<void> {}

  async send(_sessionId: string, _input: WhatsAppSendInput): Promise<void> {
    throw new Error("WebJsProvider not enabled.");
  }
}
