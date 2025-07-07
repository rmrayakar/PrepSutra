// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "rmrayakar2004@gmail.com";

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendAlertEmail(unreadCount: number) {
  const client = new SmtpClient();

  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("GMAIL_USER"),
    password: Deno.env.get("GMAIL_PASS"),
  });

  await client.send({
    from: Deno.env.get("GMAIL_USER"),
    to: ADMIN_EMAIL,
    subject: "PrepSutra: Unread Help Messages Alert",
    content: `There are currently ${unreadCount} unread help messages in the admin panel. Please check the dashboard.`,
  });

  await client.close();
}

serve(async (_req) => {
  // Count unread help messages
  const { count, error } = await supabase
    .from("help_messages")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if ((count || 0) > 10) {
    await sendAlertEmail(count!);
    return new Response(JSON.stringify({ alert: true, unread: count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ alert: false, unread: count }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
