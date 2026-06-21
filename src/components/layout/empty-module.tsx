import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface EmptyModuleProps {
  title: string;
  description: string;
}

export function EmptyModule({ title, description }: EmptyModuleProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Construction className="h-7 w-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
        <p className="mt-6 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
          Módulo em desenvolvimento
        </p>
      </CardContent>
    </Card>
  );
}
