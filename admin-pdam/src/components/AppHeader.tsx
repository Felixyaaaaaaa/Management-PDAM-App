import { useState, useRef, useEffect, useContext } from "react"
import { User, LogOut, ChevronDown, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"

type AppHeaderProps = {
  onToggleSidebar: () => void
}

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-red-100", text: "text-red-700" },
  reads: { bg: "bg-sky-100", text: "text-sky-700" },
  bendahara: { bg: "bg-purple-100", text: "text-purple-700" },
  petugas: { bg: "bg-blue-100", text: "text-blue-700" },
}

const getRoleBadgeColor = (role: string | null | undefined) =>
  roleBadgeColors[String(role || "").toLowerCase()] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
  }

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const auth = useContext(AuthContext)
  const user = auth?.user
  const logout = auth?.logout
  const roleBadgeColor = getRoleBadgeColor(user?.role)

  const [open, setOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown kalau klik luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout?.()
    navigate("/")
    setIsLogoutDialogOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 h-16 border-b bg-white px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
        >
          <User size={18} />
          <span className="text-sm font-medium">
            {user?.name || "User"}
          </span>
          <ChevronDown size={16} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-md py-2 z-50">
            <div className="px-4 py-2 text-xs text-gray-500">
              Role:{" "}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColor.bg} ${roleBadgeColor.text}`}
              >
                {user?.role || "-"}
              </span>
            </div>

            <button
              onClick={() => {
                setOpen(false)
                setIsLogoutDialogOpen(true)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin logout dari aplikasi?
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
            >
              Ya, Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
