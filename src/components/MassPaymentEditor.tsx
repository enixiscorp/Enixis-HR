import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks/useProfiles'
import { usePrestations } from '@/hooks/usePrestations'
import { useToast } from '@/contexts/ToastContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabase'
import { Users, Banknote, Calendar, CheckCircle2, Save, X, Search, Loader2, Plus } from 'lucide-react'

interface MassPaymentEditorProps {
    onCancel: () => void
    onSuccess?: () => void
}

export function MassPaymentEditor({ onCancel, onSuccess }: MassPaymentEditorProps) {
    const { user: currentUser } = useAuth()
    const { profiles } = useProfiles()
    const { prestations, loading: loadingPrestations } = usePrestations()
    const { toast } = useToast()
    const { formatCurrency } = useCurrency()

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [selectedPrestationId, setSelectedPrestationId] = useState<string>('')
    const [status, setStatus] = useState<'pending' | 'paid' | 'refused'>('paid')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter collaborators and admins (beneficiaries)
    const beneficiaries = profiles.filter(p => {
        const matchesRole = p.role === 'collaborator' || p.role === 'admin' || p.role === 'super_admin'
        const matchesSearch = searchTerm.trim() === '' ||
            p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesRole && matchesSearch
    })

    const handleUserToggle = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        )
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(beneficiaries.map(p => p.id))
        } else {
            setSelectedUserIds([])
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedUserIds.length === 0) {
            toast('Veuillez sélectionner au moins un bénéficiaire', 'error')
            return
        }
        if (!selectedPrestationId) {
            toast('Veuillez sélectionner une prestation', 'error')
            return
        }

        const selectedPrestation = prestations.find(p => p.id === selectedPrestationId)
        if (!selectedPrestation) return

        setSaving(true)
        try {
            const payments = selectedUserIds.map(userId => ({
                user_id: userId,
                amount: selectedPrestation.price,
                payment_date: paymentDate,
                payment_type: 'monthly', // Default to monthly
                status: status,
                description: selectedPrestation.name,
                created_by: currentUser?.id
            }))

            const { error: paymentError, data: insertedPayments } = await supabase.from('payments').insert(payments).select()
            if (paymentError) throw paymentError

            // If status is paid, we also insert into revenues table for stats/charts
            if (status === 'paid' && insertedPayments) {
                const revenues = insertedPayments.map(p => ({
                    user_id: p.user_id,
                    amount: p.amount,
                    date: p.payment_date,
                    period_type: 'monthly',
                    description: p.description
                }))
                const { error: revError } = await supabase.from('revenues').insert(revenues)
                if (revError) console.error('Error syncing to revenues:', revError)
            }

            toast(`${payments.length} paiements créés et synchronisés avec succès`, 'success')
            if (onSuccess) onSuccess()
            onCancel()
        } catch (err: any) {
            console.error('Error creating payments:', err)
            toast(err.message || 'Erreur lors de la création', 'error')
        } finally {
            setSaving(false)
        }
    }

    const selectedPrestationData = prestations.find(p => p.id === selectedPrestationId)

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg border border-purple-500/30">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Banknote className="w-6 h-6 text-purple-600" />
                            Paiement de Masse
                        </CardTitle>
                        <CardDescription>
                            Créez rapidement des paiements pour plusieurs collaborateurs.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT: Beneficiary Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    Bénéficiaires ({selectedUserIds.length})
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={beneficiaries.length > 0 && selectedUserIds.length === beneficiaries.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all" className="cursor-pointer">Tout cocher</Label>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Chercher et ajouter un bénéficiaire..."
                                    className="pl-9 bg-white/50 dark:bg-slate-800"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onFocus={() => {
                                        if (searchTerm === '') setSearchTerm(' ')
                                    }}
                                />
                                {searchTerm.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto p-2 space-y-1">
                                        <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">Résultats</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-purple-600 hover:text-purple-700"
                                                onClick={() => {
                                                    const toAdd = beneficiaries.filter(b => !selectedUserIds.includes(b.id)).map(b => b.id)
                                                    setSelectedUserIds(prev => [...prev, ...toAdd])
                                                    setSearchTerm('')
                                                }}
                                            >
                                                Tout ajouter
                                            </Button>
                                        </div>
                                        {beneficiaries.filter(b => !selectedUserIds.includes(b.id)).length === 0 ? (
                                            <p className="text-xs text-slate-500 p-2 text-center">Aucun autre bénéficiaire trouvé</p>
                                        ) : (
                                            beneficiaries.filter(b => !selectedUserIds.includes(b.id)).map(profile => (
                                                <div
                                                    key={profile.id}
                                                    onClick={() => {
                                                        handleUserToggle(profile.id)
                                                        setSearchTerm('')
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                {profile.first_name} {profile.last_name}
                                                            </p>
                                                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 uppercase bg-slate-50 dark:bg-slate-800">
                                                                {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Admin' : 'Collab'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
                                                    </div>
                                                    <Plus className="w-3 h-3 text-slate-400" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500 px-1">Sélectionnés ({selectedUserIds.length})</Label>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 h-[300px] overflow-y-auto p-2 space-y-2">
                                    {selectedUserIds.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                            Utilisez la recherche pour ajouter des bénéficiaires.
                                        </div>
                                    ) : (
                                        selectedUserIds.map(id => {
                                            const profile = profiles.find(p => p.id === id)
                                            if (!profile) return null
                                            return (
                                                <div
                                                    key={id}
                                                    className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/30 rounded-md shadow-sm"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{profile.first_name} {profile.last_name}</p>
                                                        <p className="text-[10px] text-slate-500 truncate">Collaborateur</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                        onClick={() => handleUserToggle(id)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Payment Details */}
                        <div className="space-y-6">
                            <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Label className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                    Détails du Paiement
                                </Label>

                                {/* Prestation Selection */}
                                <div className="space-y-2">
                                    <Label>Service / Prestation</Label>
                                    <Select
                                        value={selectedPrestationId}
                                        onValueChange={setSelectedPrestationId}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-slate-800">
                                            <SelectValue placeholder="Sélectionner une prestation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingPrestations ? (
                                                <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                            ) : (
                                                prestations.filter(p => p.is_active).map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} - {formatCurrency(p.price)}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Selection */}
                                <div className="space-y-2">
                                    <Label>Statut Initial</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="bg-white dark:bg-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">Payé (immédiat)</SelectItem>
                                            <SelectItem value="pending">En attente (à valider plus tard)</SelectItem>
                                            <SelectItem value="refused">Refusé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Selection */}
                                <div className="space-y-2">
                                    <Label>Date d'édition</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="date"
                                            className="pl-9 bg-white dark:bg-slate-800"
                                            value={paymentDate}
                                            onChange={e => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Cette date sera assignée à tous les paiements créés.
                                    </p>
                                </div>

                                {/* Summary */}
                                {selectedPrestationData && (
                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
                                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Résumé</p>
                                        <div className="flex justify-between text-sm">
                                            <span>Montant unitaire :</span>
                                            <span className="font-bold">{formatCurrency(selectedPrestationData.price)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span>Nombre de bénéficiaires :</span>
                                            <span className="font-bold">{selectedUserIds.length}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-purple-700 dark:text-purple-300 mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                                            <span>Total Estimé :</span>
                                            <span>{formatCurrency(selectedPrestationData.price * selectedUserIds.length)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={saving || selectedUserIds.length === 0 || !selectedPrestationId}
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Enregistrer {selectedUserIds.length} Paiement(s)
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
