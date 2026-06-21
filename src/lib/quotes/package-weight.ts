/** Extrai peso em kg da embalagem (campo size_value ou nome "25 kg"). */
export function getPackageSizeKg(packageInfo: {
  size_value?: number | null;
  name: string;
}): number {
  if (packageInfo.size_value != null && packageInfo.size_value > 0) {
    return Number(packageInfo.size_value);
  }

  const match = packageInfo.name.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (match) {
    return Number(match[1].replace(",", "."));
  }

  return 1;
}

/** Peso total = quantidade de embalagens × kg por embalagem. */
export function lineWeightKg(
  packageQuantity: number,
  packageSizeKg: number
): number {
  return Math.round(packageQuantity * packageSizeKg * 10000) / 10000;
}
