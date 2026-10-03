import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";

const FROM = process.env.RESEND_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
const NOTIFY = process.env.ORDERS_NOTIFY_EMAIL ?? SITE.email;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY manquant : courriel non envoyé.");
    return null;
  }
  return new Resend(key);
}

type SendArgs = { to: string | string[]; subject: string; html: string; replyTo?: string };

export async function sendEmail(args: SendArgs): Promise<boolean> {
  const resend = client();
  if (!resend) return false;
  const { error } = await resend.emails.send({ from: FROM, ...args });
  if (error) {
    console.error("[email] échec", error);
    return false;
  }
  return true;
}

export const ORDERS_NOTIFY_EMAIL = NOTIFY;

// ---------- Gabarits ----------

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f1ea;font-family:Georgia,serif;color:#1c1a17">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#6b665c;margin:0 0 24px">${esc(SITE.name)} · ${esc(SITE.tagline)}</p>
    <h1 style="font-size:26px;font-weight:normal;margin:0 0 24px">${esc(title)}</h1>
    ${body}
    <hr style="border:0;border-top:1px solid #d8d2c4;margin:32px 0">
    <p style="font-size:12px;color:#6b665c;margin:0">${esc(SITE.address.street)}, ${esc(SITE.address.city)} · ${esc(SITE.phone)} · ${esc(SITE.email)}</p>
  </div></body></html>`;
}

export type OrderEmailLine = { name: string; attributes?: Record<string, string> | null; quantity: number; unitPrice: number; lineTotal: number };
export type OrderEmailData = {
  number: string;
  customerName: string;
  email: string;
  phone?: string | null;
  fulfillment: "PICKUP" | "DELIVERY";
  shipping?: Record<string, string | undefined> | null;
  customerNote?: string | null;
  lines: OrderEmailLine[];
  subtotal: number;
  url: string;
};

const money = (n: number) => `${n.toFixed(2).replace(".", ",")} $`;

function linesTable(d: OrderEmailData): string {
  const rows = d.lines
    .map((l) => {
      const attrs = l.attributes && Object.keys(l.attributes).length ? `<br><span style="font-size:12px;color:#6b665c">${esc(Object.values(l.attributes).join(" · "))}</span>` : "";
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e1d5">${esc(l.name)}${attrs}</td><td style="padding:8px;border-bottom:1px solid #e6e1d5;text-align:center">${l.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e6e1d5;text-align:right;font-family:Menlo,monospace;font-size:13px">${money(l.lineTotal)}</td></tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}<tr><td colspan="2" style="padding:12px 0;text-align:right">Sous-total (avant taxes)</td><td style="padding:12px 0;text-align:right;font-family:Menlo,monospace">${money(d.subtotal)}</td></tr></table>`;
}

function shippingBlock(d: OrderEmailData): string {
  if (d.fulfillment === "PICKUP") return `<p style="font-size:14px"><strong>Cueillette</strong> à la boutique, ${esc(SITE.address.street)}, ${esc(SITE.address.city)}.</p>`;
  const s = d.shipping ?? {};
  const addr = [s.address1, s.address2, [s.city, s.state, s.postcode].filter(Boolean).join(", ")].filter(Boolean).map((x) => esc(String(x))).join("<br>");
  return `<p style="font-size:14px"><strong>Livraison</strong> — les frais de transport seront confirmés avec vous.<br>${addr}</p>`;
}

export function customerOrderEmail(d: OrderEmailData): { subject: string; html: string } {
  const body = `
    <p style="font-size:15px;line-height:1.5">Bonjour ${esc(d.customerName)},<br>nous avons bien reçu votre commande <strong>${esc(d.number)}</strong>. Un commis vous contactera pour confirmer les détails et le paiement.</p>
    ${linesTable(d)}
    ${shippingBlock(d)}
    ${d.customerNote ? `<p style="font-size:14px"><strong>Votre note :</strong> ${esc(d.customerNote)}</p>` : ""}
    <p style="margin:32px 0"><a href="${esc(d.url)}" style="display:inline-block;background:#1c1a17;color:#f4f1ea;padding:14px 24px;text-decoration:none;font-family:Menlo,monospace;font-size:12px;letter-spacing:.15em;text-transform:uppercase">Voir ma commande</a></p>`;
  return { subject: `Commande ${d.number} reçue — ${SITE.name}`, html: layout("Merci pour votre commande", body) };
}

export function staffOrderEmail(d: OrderEmailData): { subject: string; html: string } {
  const body = `
    <p style="font-size:15px;line-height:1.5"><strong>${esc(d.customerName)}</strong><br>${esc(d.email)}${d.phone ? `<br>${esc(d.phone)}` : ""}</p>
    ${linesTable(d)}
    ${shippingBlock(d)}
    ${d.customerNote ? `<p style="font-size:14px"><strong>Note du client :</strong> ${esc(d.customerNote)}</p>` : ""}
    <p style="margin:32px 0"><a href="${esc(d.url)}" style="display:inline-block;background:#1c1a17;color:#f4f1ea;padding:14px 24px;text-decoration:none;font-family:Menlo,monospace;font-size:12px;letter-spacing:.15em;text-transform:uppercase">Ouvrir dans la gestion</a></p>`;
  return { subject: `Nouvelle commande ${d.number} — ${d.customerName}`, html: layout(`Nouvelle commande ${d.number}`, body) };
}
