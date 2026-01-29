import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks/useProfiles'
import { usePrestations } from '@/hooks/usePrestations'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { DollarSign, Upload, Edit3, Trash2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { PaymentImporter } from './PaymentImporter'
import { PaymentImportRow } from '@/lib/paymentImportUtils'

interface PaymentRow {
    userId: string
    userName: string
    userEmail: string
    prestationId: string
    prestationName: string
    amount: number
    date: string
    status: 'paid' | 'pending' | 'refused'
}

export function MassPaymentEditor({ onCancel }: { onCancel?: () => void }) {
    const { user: currentUser } = useAuth()
    const { profiles, loading: loadingProfiles } = useProfiles()
    const { prestations } = usePrestations()
    const { toast } = useToast()
    const { formatCurrency } = useCurrency()

    const [mode, setMode] = useState<'select' | 'manual' | 'import'>('select')
    const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // For manual mode - selected users
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

    const collaboratorsAndAdmins = profiles.filter((p: any) =>
        p.role === 'collaborator' || p.role === 'admin' || p.role === 'super_admin'
    )

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleStartManualMode = () => {
        if (selectedUserIds.length === 0) {
            toast('Veuillez sélectionner au moins un collaborateur', 'error')
            return
        }

        const newRows: PaymentRow[] = selectedUserIds.map(userId => {
            const user = profiles.find((p: any) => p.id === userId)
            return {
                userId,
                userName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                userEmail: user?.email || '',
                prestationId: '',
                prestationName: '',
                amount: 0,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'paid' as const
            }
        })

        setPaymentRows(newRows)
        setMode('manual')
    }

    const handleUpdateRow = (index: number, field: keyof PaymentRow, value: any) => {
        setPaymentRows(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }

            // Auto-fill amount when prestation changes
            if (field === 'prestationId') {
                const prestation = prestations.find(p => p.id === value)
                if (prestation) {
                    updated[index].prestationName = prestation.name
                    updated[index].amount = prestation.price
                }
            }

            return updated
        })
    }

    const handleRemoveRow = (index: number) => {
        setPaymentRows(prev => prev.filter((_, i) => i !== index))
    }

    const handleImportComplete = async (importedData: PaymentImportRow[]) => {
        // Convert imported data to payment rows
        const rows: PaymentRow[] = []
        const errors: string[] = []

        for (const row of importedData) {
            // Find user by email
            const user = profiles.find(p => p.email.toLowerCase() === row.email.toLowerCase())
            if (!user) {
                errors.push(`Utilisateur introuvable: ${row.email}`)
                continue
            }

            // Find prestation by name
            const prestation = prestations.find((p: any) =>
                p.name.toLowerCase() === row.prestation.toLowerCase()
            )
            if (!prestation) {
                errors.push(`Prestation introuvable: ${row.prestation} (pour ${row.email})`)
                continue
            }

            rows.push({
                userId: user.id,
                userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                userEmail: user.email,
                prestationId: prestation.id,
                prestationName: prestation.name,
                amount: row.montant,
                date: row.date_prestation,
                status: row.statut || 'paid'
            })
        }

        if (errors.length > 0) {
            toast(`Import bloqué - ${errors.length} erreur(s) détectée(s)`, 'error')
            console.error('Import errors:', errors)
            return
        }

        setPaymentRows(rows)
        setMode('manual')
        toast(`${rows.length} paiement(s) importé(s) avec succès`, 'success')
    }

    const handleSubmitPayments = async () => {
        // Validate all rows
        const invalidRows = paymentRows.filter(row =>
            !row.prestationId || row.amount <= 0 || !row.date
        )

        if (invalidRows.length > 0) {
            toast('Certaines lignes sont incomplètes', 'error')
            return
        }

        setLoading(true)

        try {
            // Check for existing payments (same user + date + prestation)
            const { data: existingPayments } = await supabase
                .from('payments')
                .select('id, user_id, payment_date, description')

            const paymentsToInsert = []
            const paymentsToUpdate = []

            for (const row of paymentRows) {
                const existing = existingPayments?.find(p =>
                    p.user_id === row.userId &&
                    p.payment_date === row.date &&
                    p.description === row.prestationName
                )

                const paymentData = {
                    user_id: row.userId,
                    amount: row.amount,
                    description: row.prestationName,
                    payment_date: row.date,
                    payment_type: 'monthly' as const,
                    status: row.status,
                    created_by: currentUser?.id
                }

                if (existing) {
                    paymentsToUpdate.push({ id: existing.id, ...paymentData })
                } else {
                    paymentsToInsert.push(paymentData)
                }
            }

            // Insert new payments
            if (paymentsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('payments')
                    .insert(paymentsToInsert)

                if (insertError) throw insertError
            }

            // Update existing payments
            for (const payment of paymentsToUpdate) {
                const { id, ...updateData } = payment
                const { error: updateError } = await supabase
                    .from('payments')
                    .update(updateData)
                    .eq('id', id)

                if (updateError) throw updateError
            }

            setSuccess(true)
            toast(
                `${paymentsToInsert.length} paiement(s) créé(s), ${paymentsToUpdate.length} mis à jour`,
                'success'
            )

            setTimeout(() => {
                setSuccess(false)
                setMode('select')
                setPaymentRows([])
                setSelectedUserIds([])
                onCancel?.()
            }, 2000)

        } catch (err: any) {
            console.error('Error creating payments:', err)
            toast('Erreur lors de la création des paiements', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Mode Selection Screen
    if (mode === 'select') {
        return (
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Paiement en Masse
                                </CardTitle>
                                <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 text-xs uppercase font-bold">
                                    Mode Création
                                </Badge>
                            </div>
                            <CardDescription>
                                Choisissez votre méthode de création de paiements
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* User Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase text-slate-500">
                            1. Sélectionnez les bénéficiaires
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            {loadingProfiles ? (
                                <div className="col-span-full py-8 flex flex-col items-center text-slate-500">
                                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-2" />
                                    <p className="text-sm">Chargement des collaborateurs...</p>
                                </div>
                            ) : collaboratorsAndAdmins.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                                    Aucun collaborateur trouvé.
                                </div>
                            ) : (
                                collaboratorsAndAdmins.map((profile: any) => (
                                    <div
                                        key={profile.id}
                                        onClick={() => handleUserToggle(profile.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedUserIds.includes(profile.id)
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-500 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedUserIds.includes(profile.id)}
                                            onCheckedChange={() => handleUserToggle(profile.id)}
                                            className="pointer-events-none" // let the parent div handle click
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                {profile.first_name} {profile.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-xs text-slate-500 flex justify-between">
                            <span>{selectedUserIds.length} bénéficiaire(s) sélectionné(s)</span>
                            {selectedUserIds.length > 0 && (
                                <button onClick={() => setSelectedUserIds([])} className="text-purple-600 hover:underline">
                                    Tout désélectionner
                                </button>
                            )}
                        </p>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase text-slate-500">
                            2. Choisissez la méthode
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={handleStartManualMode}
                                disabled={selectedUserIds.length === 0}
                                className="h-auto py-6 flex-col gap-3 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            >
                                <Edit3 className="w-8 h-8" />
                                <div>
                                    <p className="font-bold">Saisie Manuelle</p>
                                    <p className="text-xs opacity-90">Éditer les bonus un par un</p>
                                </div>
                            </Button>

                            <Button
                                onClick={() => setMode('import')}
                                className="h-auto py-6 flex-col gap-3 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                            >
                                <Upload className="w-8 h-8" />
                                <div>
                                    <p className="font-bold">Import de Fichier</p>
                                    <p className="text-xs opacity-90">Excel, CSV ou PDF</p>
                                </div>
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" onClick={onCancel}>
                            Annuler
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Import Mode
    if (mode === 'import') {
        return (
            <PaymentImporter
                onImportComplete={handleImportComplete}
                onCancel={() => setMode('select')}
            />
        )
    }

    // Manual/Editing Mode
    return (
        <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                                Édition des Paiements
                            </CardTitle>
                            <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs uppercase font-bold">
                                {paymentRows.length} Paiement(s)
                            </Badge>
                        </div>
                        <CardDescription>
                            Configurez les prestations et montants pour chaque bénéficiaire
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Payment Rows Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                <th className="p-3 text-left font-semibold">Bénéficiaire</th>
                                <th className="p-3 text-left font-semibold">Prestation</th>
                                <th className="p-3 text-right font-semibold">Montant</th>
                                <th className="p-3 text-center font-semibold">Date</th>
                                <th className="p-3 text-center font-semibold">Statut</th>
                                <th className="p-3 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paymentRows.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {row.userName}
                                            </p>
                                            <p className="text-xs text-slate-500">{row.userEmail}</p>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Select
                                            value={row.prestationId}
                                            onValueChange={(val) => handleUpdateRow(index, 'prestationId', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choisir..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {prestations.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({formatCurrency(p.price)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-3">
                                        <Input
                                            type="number"
                                            value={row.amount}
                                            onChange={(e) => handleUpdateRow(index, 'amount', Number(e.target.value))}
                                            className="text-right"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <Input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => handleUpdateRow(index, 'date', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <Select
                                            value={row.status}
                                            onValueChange={(val: any) => handleUpdateRow(index, 'status', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Payé ✅</SelectItem>
                                                <SelectItem value="pending">En attente ⏳</SelectItem>
                                                <SelectItem value="refused">Refusé ❌</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveRow(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setMode('select')
                            setPaymentRows([])
                        }}
                        disabled={loading}
                    >
                        Retour
                    </Button>
                    <Button
                        onClick={handleSubmitPayments}
                        disabled={loading || paymentRows.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? (
                            'Traitement...'
                        ) : success ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Paiements créés !
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Créer {paymentRows.length} Paiement(s)
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
