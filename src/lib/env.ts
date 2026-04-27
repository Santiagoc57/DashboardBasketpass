export const appEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  appTimezone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Bogota",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "soporte@basketproduction.pro",
  allowGuestMiJornadaAccess: process.env.ALLOW_GUEST_MI_JORNADA === "true",
  portalGeminiApiKey: process.env.PORTAL_GEMINI_API_KEY ?? "",
  portalGeminiModel: process.env.PORTAL_GEMINI_MODEL ?? "gemini-2.5-flash",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  operationalAlertWebhookUrl: process.env.OPERATION_ALERT_WEBHOOK_URL ?? "",
  robomotionWhatsAppWebhookUrl:
    process.env.ROBOMOTION_WHATSAPP_WEBHOOK_URL ?? "",
  robomotionWhatsAppWebhookToken:
    process.env.ROBOMOTION_WHATSAPP_WEBHOOK_TOKEN ?? "",
};

export const isSupabaseConfigured = Boolean(
  appEnv.supabaseUrl && appEnv.supabaseAnonKey,
);

export function assertSupabaseEnv() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export function assertServiceRoleKey() {
  if (!appEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. The CSV importer requires a service role key.",
    );
  }
}
