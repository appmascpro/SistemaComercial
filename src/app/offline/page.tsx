import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
        CI
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Você está offline</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Sem conexão com a internet. Reconecte-se para acessar pedidos, cotações
        e clientes.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
