import { useEffect, useRef } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useAppDialog } from "../context/AppDialogContext"

interface RoleRouteProps {
  allow: string[]
}

export default function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth()
  const dialog = useAppDialog()
  const navigate = useNavigate()
  const hasShownRef = useRef(false)
  const isUnauthorized = Boolean(user && !allow.includes(user.role))
  const fallback = "/"

  useEffect(() => {
    if (!isUnauthorized || !user || hasShownRef.current) return
    hasShownRef.current = true
    const run = async () => {
      await dialog.alert("Anda tidak memiliki akses ke fitur ini.", "Akses Ditolak")
      navigate(fallback, { replace: true })
    }
    run()
  }, [isUnauthorized, user, dialog, navigate, fallback])

  if (!user) return <Navigate to="/login" replace />
  if (isUnauthorized) return null

  return <Outlet />
}
