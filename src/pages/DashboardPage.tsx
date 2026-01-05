import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function DashboardPage() {
    const { user, profile, signOut } = useAuth()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Enixis HR
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Tableau de bord
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => signOut()}
                            variant="outline"
                            className="flex items-center space-x-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Déconnexion</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Bienvenue, {profile?.first_name || user?.email}! 👋
                    </h2>

                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                Informations du profil
                            </h3>
                            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                <p><strong>Email:</strong> {user?.email}</p>
                                <p><strong>Rôle:</strong> {profile?.role || 'Non défini'}</p>
                                <p><strong>Statut:</strong> {profile?.status || 'Non défini'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                🚀 Prochaines étapes
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                <li>Configuration de l'authentification à deux facteurs (2FA)</li>
                                <li>Compléter votre profil</li>
                                <li>Consulter vos revenus et horaires</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
