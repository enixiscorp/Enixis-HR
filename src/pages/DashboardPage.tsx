import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StatsCard from '@/components/StatsCard'
import RevenueCard from '@/components/RevenueCard'
import ScheduleCard from '@/components/ScheduleCard'
import PaymentHistoryCard from '@/components/PaymentHistoryCard'
import { LogOut, DollarSign, Calendar, Wallet, Users, Building2 } from 'lucide-react'
import { useRevenues } from '@/hooks/useRevenues'
import { useSchedules } from '@/hooks/useSchedules'
import { usePayments } from '@/hooks/usePayments'

export default function DashboardPage() {
    const { user, profile, signOut } = useAuth()
    const { totalRevenue, loading: revenuesLoading } = useRevenues(user?.id)
    const { upcomingSchedules, loading: schedulesLoading } = useSchedules(user?.id)
    const { totalPaid, pendingPayments, loading: paymentsLoading } = usePayments(user?.id)

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
        }
        return user?.email?.[0].toUpperCase() || 'U'
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Enixis HR
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Tableau de bord
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-purple-500">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {profile?.first_name && profile?.last_name
                                            ? `${profile.first_name} ${profile.last_name}`
                                            : user?.email}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                                        {profile?.role || 'Utilisateur'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => signOut()}
                                variant="outline"
                                className="flex items-center space-x-2 border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Bienvenue, {profile?.first_name || user?.email?.split('@')[0]}! 👋
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Voici un aperçu de votre activité
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Revenus totaux"
                        value={revenuesLoading ? '...' : formatCurrency(totalRevenue)}
                        icon={DollarSign}
                        gradient="from-green-500 to-emerald-600"
                    />
                    <StatsCard
                        title="Horaires à venir"
                        value={schedulesLoading ? '...' : upcomingSchedules.length}
                        icon={Calendar}
                        gradient="from-blue-500 to-cyan-600"
                    />
                    <StatsCard
                        title="Paiements reçus"
                        value={paymentsLoading ? '...' : formatCurrency(totalPaid)}
                        icon={Wallet}
                        gradient="from-purple-500 to-pink-600"
                    />
                    <StatsCard
                        title="En attente"
                        value={paymentsLoading ? '...' : pendingPayments.length}
                        icon={Wallet}
                        gradient="from-orange-500 to-red-600"
                    />
                </div>

                {/* Admin Section */}
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-700 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Panneau d'administration
                            </h3>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                            En tant qu'{profile?.role === 'super_admin' ? 'administrateur principal' : 'administrateur'},
                            vous avez accès aux fonctionnalités de gestion des collaborateurs.
                        </p>
                        <div className="flex gap-3">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                Gérer les collaborateurs
                            </Button>
                            <Button variant="outline">
                                Voir les rapports
                            </Button>
                        </div>
                    </div>
                )}

                {/* Data Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {user?.id && (
                        <>
                            <RevenueCard userId={user.id} />
                            <ScheduleCard userId={user.id} />
                            <div className="lg:col-span-2">
                                <PaymentHistoryCard userId={user.id} />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
