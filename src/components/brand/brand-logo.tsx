import { APP_NAME, BRAND_LOGO_ICON, BRAND_LOGO_RECT } from "@/config/brand";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "login" | "sidebar" | "sidebar-collapsed" | "header";

const rectHeights: Record<Exclude<BrandLogoVariant, "sidebar-collapsed">, string> = {
  login: "h-32 w-auto max-w-full sm:h-36",
  sidebar: "h-full w-full max-w-full",
  header: "h-11 w-auto max-w-[min(72vw,280px)] sm:h-12",
};

const rectAlignment: Partial<
  Record<Exclude<BrandLogoVariant, "sidebar-collapsed">, string>
> = {
  login: "object-center mx-auto",
  sidebar: "object-contain object-center mx-auto",
  header: "object-left",
};

export function BrandLogo({
  variant = "sidebar",
  className,
}: {
  variant?: BrandLogoVariant;
  className?: string;
}) {
  if (variant === "sidebar-collapsed") {
    return (
      <img
        src={BRAND_LOGO_ICON}
        alt={APP_NAME}
        className={cn("h-9 w-9 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }

  return (
    <img
      src={BRAND_LOGO_RECT}
      alt={APP_NAME}
      className={cn(
        "block object-contain",
        rectHeights[variant],
        rectAlignment[variant],
        className
      )}
    />
  );
}
