import { APP_NAME, BRAND_LOGO_ICON, BRAND_LOGO_RECT } from "@/config/brand";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "login" | "sidebar" | "sidebar-collapsed" | "header";

const rectHeights: Record<Exclude<BrandLogoVariant, "sidebar-collapsed">, string> = {
  login: "h-24 sm:h-28",
  sidebar: "h-10",
  header: "h-8",
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
        "w-auto max-w-full object-contain",
        rectHeights[variant],
        className
      )}
    />
  );
}
