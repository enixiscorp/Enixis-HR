import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StatsCard from '@/components/StatsCard'
import RevenueCard from '@/components/RevenueCard'
import ScheduleCard from '@/components/ScheduleCard'
import PaymentHistoryCard from '@/components/PaymentHistoryCard'
import { CollaboratorSelect } from '@/components/CollaboratorSelect'
import { UserManagement } from '@/components/UserManagement'
import { PlatformSettings } from '@/components/PlatformSettings'
import {
    LogOut,
    DollarSign,
    Calendar,
    Wallet,
    Users,
    Building2,
    Settings,
    LayoutDashboard,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react'
import { useRevenues } from '@/hooks/useRevenues'
import { useSchedules } from '@/hooks/useSchedules'
import { usePayments } from '@/hooks/usePayments'
import { currencies } from '@/constants/currencies'

export default function DashboardPage() {
    const { user, profile, signOut } = useAuth()
    const { currency, setCurrency, formatCurrency } = useCurrency()
    const { settings } = usePlatformSettings()

    // State to track which user's data we are viewing
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(user?.id)
    const [activeTab, setActiveTab] = useState('overview')

    // Update selectedUserId when user loads if not already set
    useEffect(() => {
        if (user?.id && !selectedUserId) {
            setSelectedUserId(user.id)
        }
    }, [user, selectedUserId])

    // Data hooks now use the selectedUserId
    const { totalRevenue, loading: revenuesLoading } = useRevenues(selectedUserId)
    const { upcomingSchedules, loading: schedulesLoading } = useSchedules(selectedUserId)
    const { totalPaid, pendingPayments, loading: paymentsLoading } = usePayments(selectedUserId)

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const isSuperAdmin = profile?.role === 'super_admin'

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
        }
        return user?.email?.[0].toUpperCase() || 'U'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Enixis HR
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Plateforme RH
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Currency Selector */}
                            <div className="flex items-center gap-2">
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="w-[180px] h-9 bg-white/50 backdrop-blur-sm">
                                        <SelectValue placeholder="Devise" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.symbol} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

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
                                    <div className="flex items-center gap-1">
                                        {isAdmin && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                                        <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                                            {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role || 'Chargement...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => signOut()}
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2 border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Admin Role Confirmation Notification (Debugging helper for user) */}
                {user && !profile && (
                    <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3 text-orange-800 shadow-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Profil introuvable</p>
                            <p className="text-xs">
                                Votre profil n'a pas encore été créé ou lié à votre email.
                                Exécutez le script SQL fourni dans Supabase pour obtenir vos accès Administrateur.
                            </p>
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Bienvenue, {profile?.first_name || user?.email?.split('@')[0]}! 👋
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                {isAdmin
                                    ? "Interface de gestion administrative Enixis HR."
                                    : "Consultez vos revenus et horaires de travail."}
                            </p>
                        </div>

                        {isAdmin && (
                            <TabsList className="bg-white/50 backdrop-blur-sm border border-slate-200 p-1">
                                <TabsTrigger value="overview" className="flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Bord
                                </TabsTrigger>
                                <TabsTrigger value="users" className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Collaborateurs
                                </TabsTrigger>
                                {isSuperAdmin && (
                                    <TabsTrigger value="settings" className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Configuration
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        )}
                    </div>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Admin Filters */}
                        {isAdmin && (
                            <div className="flex flex-col sm:flex-row gap-4 bg-white/60 p-4 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md">
                                <div className="flex items-center gap-2 px-2">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-slate-700">Vue Collaborateur :</span>
                                </div>
                                <CollaboratorSelect
                                    value={selectedUserId || ''}
                                    onValueChange={setSelectedUserId}
                                />
                                {selectedUserId !== user?.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedUserId(user?.id)}
                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    >
                                        Retour à ma vue
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                        {/* Data Cards Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {selectedUserId && (
                                <>
                                    <RevenueCard userId={selectedUserId} />
                                    <ScheduleCard
                                        userId={selectedUserId}
                                        isEditable={isAdmin}
                                    />
                                    <div className="lg:col-span-2">
                                        <PaymentHistoryCard userId={selectedUserId} />
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4">
                        <PlatformSettings />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
