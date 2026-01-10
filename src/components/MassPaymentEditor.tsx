import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useCollaborators } from '@/hooks/useCollaborators'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Loader2, DollarSign, Users, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { usePrestations } from '@/hooks/usePrestations'
import { useCurrency } from '@/contexts/CurrencyContext'


export function MassPaymentEditor({ onCancel }: { onCancel?: () => void }) {
    const { collaborators, loading: loadingCollabs } = useCollaborators()
    const { user: currentUser } = useAuth()
    const { prestations, loading: loadingPrestations } = usePrestations()
    const { formatCurrency } = useCurrency()

    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedPrestation, setSelectedPrestation] = useState<string>('')
    const [commission, setCommission] = useState<string>('')
    const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [status, setStatus] = useState<'paid' | 'pending' | 'refused'>('paid')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleAll = () => {
        if (selectedUsers.length === collaborators.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(collaborators.map(c => c.id))
        }
    }

    const handleBatchPayment = async () => {
        if (selectedUsers.length === 0 || !commission || Number(commission) <= 0 || !selectedPrestation) {
            alert('Veuillez sélectionner au moins un collaborateur, une prestation et une commission valide.')
            return
        }

        const prestation = prestations.find(p => p.id === selectedPrestation)
        const prestationLabel = prestation?.name || selectedPrestation

        setLoading(true)
        try {
            const payments = selectedUsers.map(userId => ({
                user_id: userId,
                amount: Number(commission),
                description: prestationLabel,
                payment_date: paymentDate,
                payment_type: 'monthly' as const,
                status: status,
                created_by: currentUser?.id
            }))

            const { error } = await supabase.from('payments').insert(payments)
            if (error) throw error

            setSuccess(true)
            setSelectedUsers([])
            setCommission('')
            setSelectedPrestation('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Error batch paying:', error)
            alert('Erreur lors de l\'enregistrement des paiements.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Users className="w-5 h-5 text-purple-500" />
                        Paiement en Masse
                        <Badge variant="outline" className="ml-2 bg-purple-500/10 text-purple-600 border-purple-200 text-[10px] uppercase tracking-wider">
                            Mode Création
                        </Badge>
                    </CardTitle>
                    {onCancel && (
                        <Button variant="outline" size="sm" onClick={onCancel} className="text-slate-500 border-white/20">
                            Annuler
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Enregistrez une commission pour une prestation spécifique pour plusieurs collaborateurs.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2 lg:col-span-2">
                        <Label>Prestation réalisée</Label>
                        <Select
                            value={selectedPrestation}
                            onValueChange={(val) => {
                                setSelectedPrestation(val)
                                const p = prestations.find(pre => pre.id === val)
                                if (p) setCommission(p.price.toString())
                            }}
                        >
                            <SelectTrigger className="h-11 bg-white/50 dark:bg-slate-900/50">
                                <SelectValue placeholder={loadingPrestations ? "Chargement..." : "Choisir une prestation..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {prestations.filter(p => p.is_active).map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} ({formatCurrency(p.price)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Commission (CFA)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-9 h-11 bg-white/50 dark:bg-slate-900/50"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date de prestation</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="date"
                                className="pl-9 h-11 bg-white/50 dark:bg-slate-900/50"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Statut initial</Label>
                        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                            <SelectTrigger className="h-11 bg-white/50 dark:bg-slate-900/50">
                                <SelectValue placeholder="Choisir un statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">Payé ✅</SelectItem>
                                <SelectItem value="pending">En attente ⏳</SelectItem>
                                <SelectItem value="refused">Refusé ❌</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                            Bénéficiaires (Collaborateurs & Admins) ({selectedUsers.length})
                        </Label>
                        <Button variant="ghost" size="sm" onClick={toggleAll} className="text-purple-600 hover:text-purple-700">
                            {selectedUsers.length === collaborators.length ? "Tout désélectionner" : "Tout sélectionner"}
                        </Button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loadingCollabs ? (
                            <div className="col-span-full py-12 flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
                                <p className="text-xs text-slate-500">Chargement des collaborateurs...</p>
                            </div>
                        ) : collaborators.map(c => (
                            <div
                                key={c.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedUsers.includes(c.id)
                                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm"
                                    : "bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800"
                                    }`}
                                onClick={() => toggleUser(c.id)}
                            >
                                <Checkbox
                                    checked={selectedUsers.includes(c.id)}
                                    onCheckedChange={() => toggleUser(c.id)}
                                    className="data-[state=checked]:bg-purple-600 border-slate-300"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{c.first_name} {c.last_name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{c.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/20 font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    disabled={loading || selectedUsers.length === 0 || !selectedPrestation || !commission}
                    onClick={handleBatchPayment}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Traitement des paiements...
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle2 className="w-5 h-5 mr-3" />
                            Paiements effectués avec succès !
                        </>
                    ) : (
                        <>
                            Confirmer {selectedUsers.length} paiement(s) de commission
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
