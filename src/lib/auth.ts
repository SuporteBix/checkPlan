import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });
}

/**
 * Mantém o cache de sessão do TanStack Query sincronizado com eventos do
 * Supabase Auth (login/logout em outra aba, expiração de token). Assinatura
 * de evento externo — não é busca de dados, por isso vive num useEffect.
 */
export function useAuthSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    });
    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);
}
