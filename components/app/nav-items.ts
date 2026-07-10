import {
  LayoutDashboard,
  Images,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/my-content", label: "İçeriklerim", icon: Images },
  { href: "/payments", label: "Ödeme", icon: CreditCard },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];
