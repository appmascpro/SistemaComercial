import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50/40 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="mx-auto flex justify-center px-1">
            <BrandLogo variant="login" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Acesse sua conta para continuar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            {params.error === "auth_callback" && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Não foi possível concluir a autenticação. Tente novamente.
              </p>
            )}
            {params.error === "profile_missing" && (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Login ok, mas o perfil não foi encontrado. Verifique se{" "}
                <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> está
                configurada na Vercel e se o usuário existe em{" "}
                <strong>profiles</strong>.
              </p>
            )}
            <LoginForm nextPath={nextPath} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          TC Química · Tavares Chemical
        </p>
      </div>
    </div>
  );
}
