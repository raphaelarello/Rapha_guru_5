import type { WhatsAppProvider, WhatsAppSessionStatus, WhatsAppSendInput } from "./provider";

/**
 * NOTE: This is a scaffolding. To enable, install:
 *   pnpm add @whiskeysockets/baileys qrcode
 * and implement persistence for auth state (db or encrypted filesystem).
 */
export class BaileysProvider implements WhatsAppProvider {
  readonly kind = "baileys" as const;

  async startSession(_sessionId: string): Promise<void> {
    throw new Error("BaileysProvider not enabled (install deps + implement).");
  }

  async getStatus(_sessionId: string): Promise<WhatsAppSessionStatus> {
    return { state: "DISCONNECTED" };
  }

  async logout(_sessionId: string): Promise<void> {}

  async send(_sessionId: string, _input: WhatsAppSendInput): Promise<void> {
    throw new Error("BaileysProvider not enabled.");
  }
}
