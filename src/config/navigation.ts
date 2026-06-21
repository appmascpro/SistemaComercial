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
