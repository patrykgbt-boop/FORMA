// FORMA — iOS PWA background rest reminders.
// The function uses explicit bearer-token validation because the cron worker
// authenticates with a separate high-entropy X-Forma-Worker secret.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const url = Deno.env.get("SUPABASE_URL");
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !secret) throw new Error("Supabase server configuration missing");

const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-forma-worker",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function output(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}
function equalSecret(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function configRow() {
  const { data, error } = await db.from("forma_push_config").select("vapid_keys,cron_token").eq("id", 1).single();
  if (error || !data) throw new Error("Push configuration unavailable");
  return data;
}
async function vapidPair() {
  let current = await configRow();
  if (!current.vapid_keys) {
    const newPair = await webpush.generateVapidKeys({ extractable: true });
    const exported = await webpush.exportVapidKeys(newPair);
    const { error } = await db.from("forma_push_config")
      .update({ vapid_keys: exported, updated_at: new Date().toISOString() })
      .eq("id", 1).is("vapid_keys", null);
    if (error) throw error;
    current = await configRow();
  }
  if (!current.vapid_keys) throw new Error("VAPID keys not initialized");
  return webpush.importVapidKeys(current.vapid_keys);
}
async function authenticatedUser(req: Request) {
  const bearer = req.headers.get("Authorization") || "";
  const token = bearer.startsWith("Bearer ") ? bearer.substring(7) : "";
  if (!token || token.length > 8192) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : (data.user || null);
}
function deviceIdFrom(body: Record<string, unknown>): string | null {
  const deviceId = body.deviceId;
  return typeof deviceId === "string" && uuidRE.test(deviceId) ? deviceId : null;
}
function validEndpoint(endpoint: string): boolean {
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.hash) return false;
    const host = parsed.hostname.toLowerCase();
    return host === "fcm.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".push.apple.com") ||
      host === "push.apple.com" ||
      host.endsWith(".notify.windows.com");
  } catch { return false; }
}
async function sendPush(subscription: { endpoint: string; p256dh: string; auth_secret: string }, payload: Record<string, unknown>) {
  const vapid = await vapidPair();
  const appServer = await webpush.ApplicationServer.new({
    contactInformation: "mailto:forma-push@users.noreply.github.com",
    vapidKeys: vapid,
  });
  const subscriber = appServer.subscribe({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth_secret },
  });
  await subscriber.pushTextMessage(JSON.stringify(payload), {
    urgency: webpush.Urgency.High,
    ttl: 90,
    topic: "forma-rest",
  });
}
async function processDue() {
  const { data: due, error } = await db.from("forma_push_jobs")
    .select("id,user_id,device_id,timer_id,due_at,label")
    .eq("state", "pending").lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true }).limit(30);
  if (error) throw error;
  let sent = 0, failed = 0;
  for (const job of due || []) {
    // A single worker claims each pending job. Repeated cron calls cannot send it twice.
    const now = new Date().toISOString();
    const { data: claimed, error: claimError } = await db.from("forma_push_jobs")
      .update({ state: "sending", claimed_at: now, updated_at: now })
      .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "pending")
      .select("id,user_id,device_id,timer_id,label").maybeSingle();
    if (claimError || !claimed) continue;
    try {
      const { data: sub, error: subError } = await db.from("forma_push_subscriptions")
        .select("id,endpoint,p256dh,auth_secret")
        .eq("user_id", job.user_id).eq("device_id", job.device_id).maybeSingle();
      if (subError || !sub) throw new Error("No active push subscription");
      const { data: active } = await db.from("forma_push_jobs")
        .select("timer_id,state").eq("id",job.id).maybeSingle();
      if (active?.state !== "sending" || active.timer_id !== job.timer_id) continue;
      try {
        await sendPush(sub, {
          type: "rest-finished",
          title: "FORMA • Przerwa zakończona",
          body: job.label.slice(0, 180),
          timerId: job.timer_id,
          url: "/",
        });
      } catch (cause) {
        const code = cause instanceof webpush.PushMessageError ? cause.response.status : null;
        if (code === 404 || code === 410) {
          await db.from("forma_push_subscriptions").delete().eq("id", sub.id);
        }
        throw cause;
      }
      await db.from("forma_push_jobs")
        .update({ state: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_text: null })
        .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "sending");
      sent++;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "push failed";
      console.error("FORMA rest push delivery failed:", message);
      await db.from("forma_push_jobs")
        .update({ state: "failed", error_text: message.substring(0, 250), updated_at: new Date().toISOString() })
        .eq("id", job.id).eq("timer_id", job.timer_id).eq("state", "sending");
      failed++;
    }
  }
  return { processed: (due || []).length, sent, failed };
}
async function handleRequest(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return output({ error: "Method not allowed" }, 405);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid JSON");
  } catch { return output({ error: "Invalid JSON body" }, 400); }

  if (body.action === "bootstrap") {
    const internal = req.headers.get("X-Forma-Worker") || "";
    const config = await configRow();
    if (!equalSecret(internal, config.cron_token)) return output({ error: "Unauthorized" }, 401);
    const publicKey = await webpush.exportApplicationServerKey(await vapidPair());
    return output({ ready: true, publicKey });
  }

  if (body.action === "tick") {
    const internal = req.headers.get("X-Forma-Worker") || "";
    const config = await configRow();
    if (!equalSecret(internal, config.cron_token)) return output({ error: "Unauthorized" }, 401);
    return output(await processDue());
  }

  const user = await authenticatedUser(req);
  if (!user) return output({ error: "Please sign in to FORMA" }, 401);

  if (body.action === "config") {
    const publicKey = await webpush.exportApplicationServerKey(await vapidPair());
    return output({ publicKey });
  }

  const deviceId = deviceIdFrom(body);
  if (!deviceId) return output({ error: "Invalid device ID" }, 400);

  if (body.action === "register") {
    const sub = body.subscription as Record<string, unknown> | undefined;
    const keys = sub?.keys as Record<string, unknown> | undefined;
    const endpoint = sub?.endpoint;
    if (typeof endpoint !== "string" || endpoint.length > 4096 || !validEndpoint(endpoint) ||
        typeof keys?.p256dh !== "string" || keys.p256dh.length > 512 || keys.p256dh.length < 10 ||
        typeof keys?.auth !== "string" || keys.auth.length > 512 || keys.auth.length < 8) {
      return output({ error: "Invalid Web Push subscription" }, 400);
    }
    const { error } = await db.from("forma_push_subscriptions").upsert({
      user_id: user.id, device_id: deviceId, endpoint, p256dh: keys.p256dh,
      auth_secret: keys.auth, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,device_id" });
    if (error) throw error;
    return output({ registered: true });
  }

  if (body.action === "unregister") {
    const { error } = await db.from("forma_push_subscriptions")
      .delete().eq("user_id", user.id).eq("device_id", deviceId);
    if (error) throw error;
    await db.from("forma_push_jobs").update({ state: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("device_id", deviceId).in("state", ["pending","sending"]);
    return output({ registered: false });
  }

  if (body.action === "test") {
    const { data: sub } = await db.from("forma_push_subscriptions")
      .select("id,endpoint,p256dh,auth_secret").eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if (!sub) return output({ error: "No push subscription on this device" }, 409);
    try {
      await sendPush(sub, {
        type: "rest-test",
        title: "FORMA • Test powiadomień",
        body: "Powiadomienia są aktywne. Zablokuj ekran i przetestuj je podczas treningu.",
        url: "/",
      });
      return output({ sent: true });
    } catch (e) {
      const status = e instanceof webpush.PushMessageError ? e.response.status : 502;
      if ([404,410].includes(status)) await db.from("forma_push_subscriptions").delete().eq("id",sub.id);
      console.error("FORMA test push failed", e instanceof Error ? e.message : String(e));
      return output({ error: "Test notification failed; please retry" }, 502);
    }
  }

  if (body.action === "schedule") {
    const timerId = body.timerId, dueAt = body.dueAt, label = body.label;
    if (typeof timerId !== "string" || !uuidRE.test(timerId) ||
        typeof dueAt !== "string" || !Number.isFinite(Date.parse(dueAt)) ||
        typeof label !== "string" || label.length < 1 || label.length > 200) {
      return output({ error: "Invalid timer data" }, 400);
    }
    const delay = Date.parse(dueAt) - Date.now();
    if (delay < -5000 || delay > 20 * 60 * 1000) return output({ error: "Timer deadline out of range" }, 400);
    const { data: sub } = await db.from("forma_push_subscriptions")
      .select("id").eq("user_id",user.id).eq("device_id",deviceId).maybeSingle();
    if (!sub) return output({ error: "Push notifications not enabled on this device" }, 409);
    const { error } = await db.from("forma_push_jobs").upsert({
      user_id:user.id,device_id:deviceId,timer_id:timerId,due_at:new Date(dueAt).toISOString(),
      label,state:"pending",claimed_at:null,sent_at:null,error_text:null,updated_at:new Date().toISOString()
    },{onConflict:"user_id,device_id"});
    if (error) throw error;
    return output({ scheduled:true,dueAt });
  }

  if (body.action === "cancel") {
    if (typeof body.timerId !== "string" || !uuidRE.test(body.timerId)) return output({ error: "Invalid timer ID" }, 400);
    const { error } = await db.from("forma_push_jobs")
      .update({ state:"cancelled",updated_at:new Date().toISOString() })
      .eq("user_id",user.id).eq("device_id",deviceId).eq("timer_id",body.timerId)
      .in("state",["pending","sending"]);
    if (error) throw error;
    return output({ cancelled:true });
  }

  return output({ error:"Unknown action" }, 400);
}
Deno.serve(async(req) => {
  try {
    return await handleRequest(req);
  } catch (e) {
    console.error("FORMA background reminders error", e instanceof Error ? e.message : String(e));
    return output({ error: "Temporary push service error" }, 503);
  }
});
