import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import Breadcrumbs from "./Breadcrumbs"

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-40 h-[60px] flex items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 lg:px-6 shrink-0">
      {/* Left: Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0" />
        <Separator orientation="vertical" className="h-5 flex-shrink-0" />
        <Breadcrumbs />
      </div>

      {/* Right: Notif + User */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 pl-2 pr-3 gap-2 text-sm font-normal hover:bg-muted rounded-md"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 border border-border flex items-center justify-center text-primary flex-shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline text-foreground font-medium max-w-[120px] truncate">
                {user?.identifier ?? "Admin"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 mt-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {user?.identifier ?? "Administrator"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role ?? "admin"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-3.5 w-3.5" /> Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-3.5 w-3.5" /> Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
