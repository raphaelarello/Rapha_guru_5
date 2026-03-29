export type WhatsAppSessionStatus =
  | { state: "DISCONNECTED" }
  | { state: "QR"; qr: string }
  | { state: "CONNECTED"; me?: string };

export type WhatsAppProviderKind = "baileys" | "webjs";

export type WhatsAppSendInput = { to: string; message: string };

export interface WhatsAppProvider {
  readonly kind: WhatsAppProviderKind;
  startSession(sessionId: string): Promise<void>;
  getStatus(sessionId: string): Promise<WhatsAppSessionStatus>;
  logout(sessionId: string): Promise<void>;
  send(sessionId: string, input: WhatsAppSendInput): Promise<void>;
}
