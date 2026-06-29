import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  UserCog,
  BarChart3,
  ChevronDown,
} from "lucide-react";

import logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";
import { canAccessPath } from "../lib/access";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    path: "/dashboard",
  },
  {
    name: "Pencatatan Meter",
    icon: <ClipboardList size={18} />,
    path: "/pencatatan-meter",
  },
  {
    name: "Pelanggan",
    icon: <Users size={18} />,
    path: "/pelanggan",
  },
  {
    name: "Tagihan",
    icon: <FileText size={18} />,
    path: "/tagihan",
  },
  {
    name: "Pendapatan",
    icon: <FileText size={18} />,
    path: "/pendapatan",
  },
  {
    name: "Pengeluaran",
    icon: <FileText size={18} />,
    path: "/pengeluaran",
  },
  {
    name: "Kas Utama",
    icon: <FileText size={18} />,
    subItems: [
      { name: "Dashboard", path: "/kas-utama/dashboard" },
      { name: "Manajemen Kas", path: "/kas-utama" },
    ],
  },
  {
    name: "Kas Konsumen",
    icon: <FileText size={18} />,
    subItems: [
      { name: "Dashboard", path: "/kas-konsumen/dashboard" },
      { name: "Manajemen Kas", path: "/kas-konsumen" },
    ],
  },
  {
    name: "Users",
    icon: <UserCog size={18} />,
    path: "/users",
  },
  {
    name: "Laporan",
    icon: <BarChart3 size={18} />,
    subItems: [
      { name: "Laporan Tagihan", path: "/laporan/tagihan" },
      { name: "Laporan Pendapatan", path: "/laporan/pendapatan" },
      { name: "Laporan Tunggakan", path: "/laporan/tunggakan" },
      { name: "Laporan Laba Rugi", path: "/laporan/laba-rugi" },
    ],
  },
];

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = useState<string | null>("Laporan");

  const allowedNavItems = useMemo(() => {
    return navItems
      .map((item) => {
        if (item.subItems) {
          const allowedSubItems = item.subItems.filter((subItem) =>
            canAccessPath(user?.role, subItem.path)
          );

          if (allowedSubItems.length === 0) return null;
          return { ...item, subItems: allowedSubItems };
        }

        if (item.path && !canAccessPath(user?.role, item.path)) return null;
        return item;
      })
      .filter(Boolean) as NavItem[];
  }, [user?.role]);

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;

    if (item.subItems) {
      const isSubmenuOpen = openMenu === item.name;

      return (
        <div key={item.name}>
          <button
            onClick={() => setOpenMenu(isSubmenuOpen ? null : item.name)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.name}
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isSubmenuOpen && (
            <div className="ml-8 mt-1 space-y-1">
              {item.subItems.map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={onClose}
                  className={`block text-sm px-2 py-1 rounded ${
                    location.pathname === sub.path
                      ? "text-blue-600 font-medium"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.path!}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition ${
          isActive
            ? "bg-blue-100 text-blue-600"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {item.icon}
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <img src={logo} alt="Logo" className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Tirto Wening</h1>
          </div>

          <div className="custom-scrollbar space-y-2 overflow-y-auto pr-1">
            {allowedNavItems.map(renderItem)}
          </div>
        </div>
      </aside>
    </>
  );
}
