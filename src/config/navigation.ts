import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  FlaskConical,
  MapPin,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Destaque no centro da barra inferior mobile */
  featured?: boolean;
}

export const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Visão geral do negócio",
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
    description: "Catálogo e preços",
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Cadastro e contatos",
  },
  {
    title: "Cotações",
    href: "/cotacoes",
    icon: FileText,
    description: "Propostas comerciais",
  },
  {
    title: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    description: "Vendas e faturamento",
  },
  {
    title: "Amostras",
    href: "/amostras",
    icon: FlaskConical,
    description: "Envio e follow-up",
  },
  {
    title: "Rotas",
    href: "/rotas",
    icon: MapPin,
    description: "Visitas e planejamento",
  },
  {
    title: "Comissões",
    href: "/comissoes",
    icon: Wallet,
    description: "Comissões de vendedores",
  },
];

export const settingsNavigation: NavItem = {
  title: "Configurações",
  href: "/configuracoes",
  icon: Settings,
  description: "Empresa e preferências",
};

/** Barra inferior mobile — 2 + destaque + 2 */
export const mobileBottomNavigation: NavItem[] = [
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
  },
  {
    title: "Cotações",
    href: "/cotacoes",
    icon: FileText,
    featured: true,
  },
  {
    title: "Amostras",
    href: "/amostras",
    icon: FlaskConical,
  },
  {
    title: "Rotas",
    href: "/rotas",
    icon: MapPin,
  },
];

/** Menu suspenso mobile (canto superior direito) */
export const mobileOverflowNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    title: "Comissões",
    href: "/comissoes",
    icon: Wallet,
  },
  settingsNavigation,
];

export function getPageTitle(pathname: string): string {
  const allNav = [
    ...mainNavigation,
    settingsNavigation,
    ...mobileBottomNavigation,
  ];
  const match = allNav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return match?.title ?? "ConectaInsumos";
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/dashboard";
}
