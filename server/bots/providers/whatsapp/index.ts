import { BaileysProvider } from "./baileys";
import { WebJsProvider } from "./webjs";
import type { WhatsAppProvider } from "./provider";

export function getWhatsAppProvider(): WhatsAppProvider {
  const kind = (process.env.WHATSAPP_PROVIDER || "baileys").toLowerCase();
  if (kind === "webjs") return new WebJsProvider();
  return new BaileysProvider();
}

export * from "./provider";
