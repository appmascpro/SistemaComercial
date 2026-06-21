"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importProfiles } from "@/lib/products/import/profiles";
import { createFileImportProvider } from "@/lib/products/import/providers";
import { toPersistRows } from "@/lib/products/import/validate-rows";
import type {
  ImportProfileId,
  ImportPersistResult,
  ParsedImportResult,
} from "@/lib/products/import/types";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 100;

export function ProductImportWizard() {
  const [profileId, setProfileId] = useState<ImportProfileId>("tavares");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImportResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportPersistResult | null>(
    null
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const importableCount = useMemo(
    () => (parsed ? toPersistRows(parsed.rows).length : 0),
    [parsed]
  );

  const criticalIssues = useMemo(
    () => parsed?.issues.filter((i) => i.severity === "error") ?? [],
    [parsed]
  );

  const warningIssues = useMemo(
    () => parsed?.issues.filter((i) => i.severity === "warning") ?? [],
    [parsed]
  );

  const previewRows = useMemo(
    () => parsed?.rows.slice(0, PREVIEW_LIMIT) ?? [],
    [parsed]
  );

  const handleFileChange = useCallback(
    async (selected: File | null) => {
      setFile(selected);
      setParsed(null);
      setImportResult(null);
      setParseError(null);

      if (!selected) return;

      setIsParsing(true);
      try {
        const provider = createFileImportProvider({
          file: selected,
          profileId,
        });
        const result = await provider.read();
        setParsed(result);
      } catch (error) {
        setParseError(
          error instanceof Error ? error.message : "Erro ao ler planilha."
        );
      } finally {
        setIsParsing(false);
      }
    },
    [profileId]
  );

  const handleProfileChange = (nextProfile: ImportProfileId) => {
    setProfileId(nextProfile);
    if (file) {
      void handleFileChange(file);
    }
  };

  const handleImport = async () => {
    if (!parsed || importableCount === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: parsed.fileName,
          profileId: parsed.profileId,
          rows: toPersistRows(parsed.rows),
        }),
      });

      const result = (await response.json()) as ImportPersistResult;

      if (!response.ok && !result.message) {
        throw new Error("Falha na importação.");
      }

      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        totalRows: parsed.rows.length,
        successRows: 0,
        errorRows: parsed.rows.length,
        errors: [
          {
            rowNumber: 0,
            message:
              error instanceof Error ? error.message : "Falha na importação.",
          },
        ],
        message: "Falha ao importar produtos.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Importar produtos"
        description="Envie uma planilha Excel ou CSV, revise a prévia e importe para o catálogo."
        action={
          <Link
            href="/produtos"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>1. Configuração</CardTitle>
            <CardDescription>
              Escolha o perfil de colunas e envie o arquivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Perfil de importação
              </label>
              <select
                value={profileId}
                onChange={(e) =>
                  handleProfileChange(e.target.value as ImportProfileId)
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {importProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {
                  importProfiles.find((profile) => profile.id === profileId)
                    ?.description
                }
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Arquivo (.xlsx ou .csv)
              </label>
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                  file
                    ? "border-brand-300 bg-brand-50/50"
                    : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/30"
                )}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) =>
                    void handleFileChange(e.target.files?.[0] ?? null)
                  }
                />
                {isParsing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-brand-600" />
                )}
                <p className="mt-3 text-sm font-medium text-slate-800">
                  {file ? file.name : "Clique para selecionar"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Suporta .xlsx ou .csv (planilha Tavares com ;)
                </p>
              </label>
            </div>

            {parseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {parseError}
              </div>
            )}

            {parsed && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p>
                  <span className="font-medium">Linhas lidas:</span>{" "}
                  {parsed.rows.length}
                </p>
                <p className="text-emerald-700">
                  <span className="font-medium">Prontas para importar:</span>{" "}
                  {importableCount}
                </p>
                {(parsed.skippedCount ?? 0) > 0 && (
                  <p className="text-amber-700">
                    <span className="font-medium">Ignoradas:</span>{" "}
                    {parsed.skippedCount} (sem preço ou produto)
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Modo tolerante: colunas de ICMS com fórmula são ignoradas.
                  Linhas com problema são puladas; o restante é importado.
                </p>
                {parsed.ignoredHeaders.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {parsed.ignoredHeaders.length} coluna(s) de fórmula ignorada(s)
                    (ICMS calculado no backend)
                  </p>
                )}
                {parsed.unmappedHeaders.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Extras: {parsed.unmappedHeaders.slice(0, 4).join(", ")}
                    {parsed.unmappedHeaders.length > 4 ? "..." : ""}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {parsed && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>2. Validação</CardTitle>
                  <CardDescription>
                    Avisos não bloqueiam. Só impede se nenhuma linha puder ser
                    importada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalIssues.length === 0 && importableCount > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {importableCount} produto(s) prontos para importar.
                    </div>
                  ) : criticalIssues.length === 0 && importableCount === 0 ? (
                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Nenhuma linha válida para importar.
                    </div>
                  ) : (
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {criticalIssues.map((issue, index) => (
                        <div
                          key={`${issue.rowNumber}-${index}`}
                          className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {issue.rowNumber > 0
                              ? `Linha ${issue.rowNumber}: `
                              : ""}
                            {issue.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {warningIssues.length > 0 && (
                    <div className="max-h-32 space-y-2 overflow-y-auto">
                      {warningIssues.slice(0, 10).map((issue, index) => (
                        <div
                          key={`warn-${issue.rowNumber}-${index}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                        >
                          Linha {issue.rowNumber}: {issue.message}
                        </div>
                      ))}
                      {warningIssues.length > 10 && (
                        <p className="text-xs text-slate-500">
                          + {warningIssues.length - 10} avisos
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>3. Prévia</CardTitle>
                    <CardDescription>
                      Primeiras {PREVIEW_LIMIT} linhas da planilha mapeada.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => void handleImport()}
                    disabled={importableCount === 0 || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importando… (~1 min)
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importar {importableCount} produto(s)
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            #
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            Produto
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            Descrição
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            NCM
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            Embalagens
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            Moeda
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            Preço NET
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            Mín (liq.)
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            Máx (liq.)
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            IPI%
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            INCI
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewRows.map((row) => {
                          const rowErrors = criticalIssues.filter(
                            (issue) => issue.rowNumber === row.rowNumber
                          );
                          return (
                            <tr
                              key={row.rowNumber}
                              className={cn(
                                rowErrors.length > 0 && "bg-red-50/60"
                              )}
                            >
                              <td className="px-3 py-2 text-slate-500">
                                {row.rowNumber}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {row.commercial_name ?? "—"}
                              </td>
                              <td className="px-3 py-2 max-w-[160px] truncate">
                                {row.description ?? "—"}
                              </td>
                              <td className="px-3 py-2">{row.ncm ?? "—"}</td>
                              <td className="px-3 py-2">
                                {row.packages.length > 0
                                  ? row.packages.map((p) => p.name).join(", ")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">{row.currency ?? "—"}</td>
                              <td className="px-3 py-2 text-right">
                                {row.net_price?.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                }) ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.min_price?.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                }) ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.max_price?.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                }) ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {row.ipi_rate ?? "—"}
                              </td>
                              <td className="px-3 py-2 max-w-[180px] truncate">
                                {row.inci_name ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {parsed.rows.length > PREVIEW_LIMIT && (
                    <p className="mt-2 text-xs text-slate-500">
                      Exibindo {PREVIEW_LIMIT} de {parsed.rows.length} linhas.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!parsed && !isParsing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Upload className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-sm text-slate-500">
                  Envie uma planilha para ver a validação e a prévia aqui.
                </p>
              </CardContent>
            </Card>
          )}

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da importação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    importResult.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  )}
                >
                  {importResult.message}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-xl font-semibold">{importResult.totalRows}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Importados</p>
                    <p className="text-xl font-semibold text-emerald-600">
                      {importResult.successRows}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Erros</p>
                    <p className="text-xl font-semibold text-red-600">
                      {importResult.errorRows}
                    </p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                      >
                        Linha {error.rowNumber}: {error.message}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
