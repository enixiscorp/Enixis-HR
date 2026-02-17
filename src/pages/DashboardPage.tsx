import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import StatsCard from '@/components/StatsCard'
import RevenueCard from '@/components/RevenueCard'
import ScheduleCard from '@/components/ScheduleCard'
import PaymentHistoryCard from '@/components/PaymentHistoryCard'
import { CollaboratorSelect } from '@/components/CollaboratorSelect'
import { UserManagement } from '@/components/UserManagement'
import { PlatformSettings } from '@/components/PlatformSettings'
import {
    DollarSign,
    Calendar,
    Wallet,
    Users,
    AlertTriangle
} from 'lucide-react'
import { useSchedules } from '@/hooks/useSchedules'
import { usePayments } from '@/hooks/usePayments'
import { currencies } from '@/constants/currencies'
import { AbsenceManagement } from '@/components/AbsenceManagement'
import { PrestationManagement } from '@/components/PrestationManagement'
import { MassScheduleEditor } from '@/components/MassScheduleEditor'
import { Sidebar } from '@/components/Sidebar'
import { PaymentManagement } from '@/components/PaymentManagement'
import { LiveActivityView } from '@/components/LiveActivityView'

export default function DashboardPage() {
    const { user, profile, signOut, isAdmin, isSuperAdmin } = useAuth()
    const { currency, setCurrency, formatCurrency } = useCurrency()
    const { settings } = usePlatformSettings()

    // State to track which user's data we are viewing
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(user?.id)

    // Sync activeTab with URL parameter
    const [activeTab, setActiveTabInternal] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get('tab') || 'overview'
    })

    const setActiveTab = (tab: string) => {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', tab)
        window.history.pushState({}, '', url)
        setActiveTabInternal(tab)
    }

    // Handle back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search)
            setActiveTabInternal(params.get('tab') || 'overview')
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    // Presence heartbeat: Update last_seen_at every 5 minutes
    useEffect(() => {
        if (!user?.id) return

        const updatePresence = async () => {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', user.id)
            } catch (err) {
                console.error('Failed to update presence:', err)
            }
        }

        updatePresence()
        const interval = setInterval(updatePresence, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [user?.id])

    // Update selectedUserId when user loads if not already set

    const { upcomingSchedules, loading: schedulesLoading } = useSchedules(selectedUserId === 'global' ? undefined : selectedUserId)
    const { totalAmount, totalPaidAmount, totalPendingAmount, loading: paymentsLoading } = usePayments(selectedUserId === 'global' ? undefined : selectedUserId)

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
        }
        return user?.email?.[0].toUpperCase() || 'U'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white flex">
            {/* Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                onSignOut={signOut}
                logoUrl={settings?.logo_url}
            />

            <div className="flex-1 flex flex-col min-w-0 ml-16">
                {/* Header */}
                <header className="bg-black/40 backdrop-blur-xl border-b border-cyan-500/20 shadow-sm sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {activeTab === 'overview' ? 'Tableau de bord' :
                                        activeTab === 'activity' ? 'Activité Directe' :
                                            activeTab === 'users' ? 'Gestion des Collaborateurs' :
                                                activeTab === 'payments' ? 'Historique des Paiements' :
                                                    activeTab === 'evolution' ? 'Mon Évolution Financière' :
                                                        activeTab === 'schedules' ? 'Édition de Masse des Plannings' :
                                                            activeTab === 'absences' ? 'Demandes d\'absences' :
                                                                activeTab === 'prestations' ? 'Gestion des Services' :
                                                                    'Configuration Platforme'}
                                </h1>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto">
                                {/* Currency Selector */}
                                <div className="flex items-center gap-2">
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="w-[100px] md:w-[150px] h-9 bg-white/50 backdrop-blur-sm">
                                            <SelectValue placeholder="Devise" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>
                                                    {c.symbol} <span className="hidden md:inline">- {c.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                                            {profile?.first_name || user?.email?.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 capitalize">
                                            {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role || '...'}
                                        </p>
                                    </div>
                                    <Avatar className="w-9 h-9 md:w-10 md:h-10 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20 shrink-0">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs font-semibold">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Admin Role Confirmation Notification */}
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

                    <Tabs value={activeTab} className="space-y-8">
                        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
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

                            {/* Super Admin Filters - Only Super Admin can view other profiles */}
                            {isSuperAdmin && (
                                <div className="flex flex-col sm:flex-row gap-4 bg-gray-800/50 p-4 rounded-2xl border border-cyan-500/20 shadow-xl backdrop-blur-md">
                                    <div className="flex items-center gap-2 px-2">
                                        <Users className="w-5 h-5 text-cyan-400" />
                                        <span className="font-semibold text-gray-200">Vue Collaborateur :</span>
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
                                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
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
                                    value={paymentsLoading ? '...' : formatCurrency(totalAmount)}
                                    icon={DollarSign}
                                    gradient="from-green-500 to-emerald-600"
                                />
                                <StatsCard
                                    title="Horaires à venir"
                                    value={schedulesLoading ? '...' : upcomingSchedules.length > 0 ? `${upcomingSchedules.length} assignés` : 'Repos (Aucun)'}
                                    icon={Calendar}
                                    gradient="from-blue-500 to-cyan-600"
                                />
                                <StatsCard
                                    title="Paiements reçus"
                                    value={paymentsLoading ? '...' : formatCurrency(totalPaidAmount)}
                                    icon={Wallet}
                                    gradient="from-purple-500 to-pink-600"
                                />
                                <StatsCard
                                    title="En attente"
                                    value={paymentsLoading ? '...' : formatCurrency(totalPendingAmount)}
                                    icon={Wallet}
                                    gradient="from-orange-500 to-red-600"
                                />
                            </div>


                            {/* Data Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {selectedUserId && (
                                    <>
                                        <RevenueCard userId={selectedUserId === 'global' ? undefined : selectedUserId} />
                                        <ScheduleCard
                                            userId={selectedUserId === 'global' ? undefined : selectedUserId}
                                            isEditable={isAdmin}
                                        />
                                        <div className="lg:col-span-2">
                                            <PaymentHistoryCard userId={selectedUserId === 'global' ? undefined : selectedUserId} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-4">
                            <LiveActivityView />
                        </TabsContent>

                        <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4">
                            <UserManagement />
                        </TabsContent>

                        <TabsContent value="payments" className="animate-in fade-in slide-in-from-bottom-4">
                            <PaymentManagement view="history" />
                        </TabsContent>

                        <TabsContent value="evolution" className="animate-in fade-in slide-in-from-bottom-4">
                            <PaymentManagement view="evolution" />
                        </TabsContent>

                        <TabsContent value="schedules" className="animate-in fade-in slide-in-from-bottom-4">
                            <MassScheduleEditor onNavigate={setActiveTab} />
                        </TabsContent>

                        <TabsContent value="absences" className="animate-in fade-in slide-in-from-bottom-4">
                            <AbsenceManagement />
                        </TabsContent>

                        <TabsContent value="prestations" className="animate-in fade-in slide-in-from-bottom-4">
                            <PrestationManagement />
                        </TabsContent>

                        <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4">
                            <PlatformSettings />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
