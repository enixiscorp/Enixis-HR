import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import {
    Users,
    ShieldCheck,
    ShieldAlert,
    RefreshCcw,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Building2
} from 'lucide-react'

export default function SubscriptionManagement() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching users:', error)
        } else {
            setUsers(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
        setUpdating(userId)
        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: !currentStatus,
                status: !currentStatus ? 'active' : 'suspended'
            })
            .eq('id', userId)

        if (error) {
            alert('Erreur: ' + error.message)
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, is_approved: !currentStatus, status: !currentStatus ? 'active' : 'suspended' } : (u as any)))
        }
        setUpdating(null)
    }

    const handleUpdateDates = async (userId: string, start: string, end: string) => {
        setUpdating(userId)
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_start: start,
                subscription_end: end
            })
            .eq('id', userId)

        if (error) {
            alert('Erreur: ' + error.message)
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_start: start, subscription_end: end } : (u as any)))
        }
        setUpdating(null)
    }

    const handleRenewSubscription = async (userId: string, currentEnd: string | null) => {
        setUpdating(userId)
        const newEnd = new Date(currentEnd || new Date())
        newEnd.setMonth(newEnd.getMonth() + 1) // Default renew +1 month
        const nextEnd = newEnd.toISOString()

        // Update user and their team
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_end: nextEnd })
            .or(`id.eq.${userId},parent_id.eq.${userId}`)

        if (error) {
            alert('Erreur lors du renouvellement: ' + error.message)
        } else {
            fetchUsers() // Refresh all to see team updates
        }
        setUpdating(null)
    }

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(search.toLowerCase())
    )

    const isExpired = (date: string | null) => {
        if (!date) return true
        return new Date(date) < new Date()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-cyan-400" />
                        Gestion des Abonnements
                    </h2>
                    <p className="text-slate-400 mt-1">Gérez les accès, les validations et les durées de souscription.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Rechercher..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-800 text-white focus:border-cyan-500/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <Clock className="w-12 h-12 text-cyan-500/20 mx-auto animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Chargement des comptes...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-800">
                        <XCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Aucun utilisateur trouvé.</p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <Card key={user.id} className="bg-slate-900/50 backdrop-blur border-slate-800 hover:border-cyan-500/30 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/10">
                                            <Users className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-none">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                                            {user.company_name && (
                                                <div className="flex items-center gap-1.5 text-xs text-cyan-500/60 mt-2 font-medium">
                                                    <Building2 className="w-3 h-3" />
                                                    {user.company_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats/Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant={user.is_approved ? "default" : "destructive"} className={user.is_approved ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"}>
                                            {user.is_approved ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {user.is_approved ? 'Activé' : 'En attente'}
                                        </Badge>
                                        <Badge variant="outline" className={isExpired(user.subscription_end) ? "text-red-400 border-red-400/20" : "text-cyan-400 border-cyan-400/20"}>
                                            {isExpired(user.subscription_end) ? 'Expiré' : 'Actif'}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700">
                                            {user.role}
                                        </Badge>
                                    </div>

                                    {/* Date Management */}
                                    <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] uppercase font-black text-slate-500 ml-1">Début</label>
                                            <Input
                                                type="date"
                                                value={user.subscription_start?.split('T')[0] || ''}
                                                onChange={(e) => handleUpdateDates(user.id, e.target.value, user.subscription_end || '')}
                                                className="bg-black/40 border-slate-800 h-9 text-xs"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] uppercase font-black text-slate-500 ml-1">Expiration</label>
                                            <Input
                                                type="date"
                                                value={user.subscription_end?.split('T')[0] || ''}
                                                onChange={(e) => handleUpdateDates(user.id, user.subscription_start || '', e.target.value)}
                                                className="bg-black/40 border-slate-800 h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 w-full xl:w-auto">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updating === user.id}
                                            onClick={() => handleToggleApproval(user.id, !!user.is_approved)}
                                            className={user.is_approved
                                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1 xl:flex-none h-10"
                                                : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex-1 xl:flex-none h-10"}
                                        >
                                            {user.is_approved ? <ShieldAlert className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                            {user.is_approved ? 'Désactiver' : 'Activer'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={updating === user.id}
                                            onClick={() => handleRenewSubscription(user.id, user.subscription_end)}
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex-1 xl:flex-none h-10 px-6 font-bold"
                                        >
                                            <RefreshCcw className={`w-4 h-4 mr-2 ${updating === user.id ? 'animate-spin' : ''}`} />
                                            Renouveler
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
