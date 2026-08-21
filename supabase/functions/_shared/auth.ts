import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export async function requireAuth(
  req: Request,
): Promise<{ user: User; supabase: SupabaseClient }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Response("Unauthorized", { status: 401 });

  return { user: data.user, supabase };
}
