// 07.09 Slim CRM Landing 2 — provider adapters (spec §6).
// Telnyx for SMS, Resend for email, behind the MessageTransport seam.
// These adapters are NEVER instantiated with real keys in this landing:
// the accounts are Jen-gated acts, and both send flags ship OFF. An
// adapter built without its key throws provider_not_configured rather
// than sending — dark by construction.

import type { MessageTransport } from "./crmMessages";

export interface TelnyxConfig {
  apiKey?: string;
  fromNumber?: string;
  fetchFn?: typeof fetch;
}

export function telnyxRequest(cfg: TelnyxConfig, msg: { destination: string; body: string }) {
  return {
    url: "https://api.telnyx.com/v2/messages",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey ?? ""}`,
      },
      body: JSON.stringify({ from: cfg.fromNumber ?? "", to: `+1${msg.destination}`, text: msg.body }),
    },
  };
}

export function telnyxTransport(cfg: TelnyxConfig): MessageTransport {
  return {
    name: "telnyx",
    async send(msg) {
      if (!cfg.apiKey || !cfg.fromNumber) throw new Error("provider_not_configured");
      const { url, init } = telnyxRequest(cfg, msg);
      const res = await (cfg.fetchFn ?? fetch)(url, init);
      if (!res.ok) throw new Error(`telnyx_http_${res.status}`);
      const data = (await res.json()) as { data?: { id?: string } };
      return { providerMessageId: data.data?.id ?? "unknown" };
    },
  };
}

export interface ResendConfig {
  apiKey?: string;
  fromAddress?: string;
  fetchFn?: typeof fetch;
}

export function resendRequest(cfg: ResendConfig, msg: { destination: string; body: string; subject: string | null }) {
  return {
    url: "https://api.resend.com/emails",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey ?? ""}`,
      },
      body: JSON.stringify({
        from: cfg.fromAddress ?? "",
        to: [msg.destination],
        subject: msg.subject ?? "",
        text: msg.body,
      }),
    },
  };
}

export function resendTransport(cfg: ResendConfig): MessageTransport {
  return {
    name: "resend",
    async send(msg) {
      if (!cfg.apiKey || !cfg.fromAddress) throw new Error("provider_not_configured");
      const { url, init } = resendRequest(cfg, msg);
      const res = await (cfg.fetchFn ?? fetch)(url, init);
      if (!res.ok) throw new Error(`resend_http_${res.status}`);
      const data = (await res.json()) as { id?: string };
      return { providerMessageId: data.id ?? "unknown" };
    },
  };
}
