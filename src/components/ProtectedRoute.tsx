import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'collaborator' | 'admin' | 'super_admin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Check role-based access
    if (requiredRole && profile) {
        const roleHierarchy = {
            collaborator: 0,
            admin: 1,
            super_admin: 2,
        }

        const userRoleLevel = roleHierarchy[profile.role]
        const requiredRoleLevel = roleHierarchy[requiredRole]

        if (userRoleLevel < requiredRoleLevel) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center space-y-4 p-8">
                        <h1 className="text-4xl font-bold text-destructive">Accès refusé</h1>
                        <p className="text-muted-foreground">
                            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                        </p>
                    </div>
                </div>
            )
        }
    }

    return <>{children}</>
}
