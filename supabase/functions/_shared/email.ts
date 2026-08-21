export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function inviteHtml(orgName: string, inviteUrl: string): string {
  return `<p>Você foi convidado para ${escapeHtml(orgName)}.</p>
<p><a href="${inviteUrl}">Aceitar convite</a></p>`;
}

export async function sendInviteEmail(to: string, orgName: string, inviteUrl: string): Promise<void> {
  // Implementar via SMTP ou Resend conforme configuração do projeto.
  // Nunca logar o conteúdo do email nem o token do convite.
  throw new Error("sendInviteEmail: configurar provedor de email antes de usar em produção");
}
