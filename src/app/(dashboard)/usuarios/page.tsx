import { PageHeader } from "@/components/layout/page-header";
import { InviteUserForm } from "@/components/users/invite-user-form";
import { UsersTable } from "@/components/users/users-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { getTeamMembersForTenant } from "@/lib/users/queries";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const profile = await requireAdminProfile();
  const members = await getTeamMembersForTenant(profile.tenant_id);
  const activeCount = members.filter((member) => member.is_active).length;

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={`${activeCount} usuário(s) ativo(s) na equipe. Cadastre vendedores e gerencie acessos.`}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cadastrar novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipe ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable members={members} currentUserId={profile.id} />
        </CardContent>
      </Card>
    </div>
  );
}
