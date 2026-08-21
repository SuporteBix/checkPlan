import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service role — nunca expor este client ou a chave para o frontend.
export function getAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
