import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { RevenueChart } from './RevenueChart'
import { MassPaymentEditor } from './MassPaymentEditor'
import { PaymentReporting } from './PaymentReporting'
import { PaymentImporter } from './PaymentImporter'
import { PaymentImportRow } from '@/lib/paymentImportUtils'
import { useRevenues } from '@/hooks/useRevenues'
import { usePayments, Payment } from '@/hooks/usePayments'
import { PaymentStatus } from '@/types/database'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useToast } from '@/contexts/ToastContext'
import {
    Plus,
    Mail,
    FileDown,
    Edit2,
    Search,
    Loader2,
    Calendar as CalendarIcon,
    DollarSign,
    CheckCircle2,
    XCircle,
    RotateCw
} from 'lucide-react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from './ui/dialog'
import { generatePaymentPDF } from '@/lib/exportUtils'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { usePrestations } from '@/hooks/usePrestations'

interface PaymentManagementProps {
    view?: 'history' | 'evolution' | 'all'
}

export function PaymentManagement({ view = 'all' }: PaymentManagementProps) {
    const { profile, isAdmin } = useAuth()
    const {
        payments,
        loading: paymentsLoading,
        refresh: refreshPayments
    } = usePayments(isAdmin ? undefined : profile?.id)
    const { revenues } = useRevenues(isAdmin ? undefined : profile?.id)
    const { prestations, loading: loadingPrestations } = usePrestations()
    const { toast } = useToast()
    const { formatCurrency } = useCurrency()
    const { settings } = usePlatformSettings() // For logo in PDF

    const chartData = revenues.map(r => ({ date: r.date, amount: Number(r.amount) }))

    const [isMassPaying, setIsMassPaying] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Edit states
    const [isEditing, setIsEditing] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [isImporting, setIsImporting] = useState(false)


    const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
        try {
            const { data: updatedPayment, error } = await supabase
                .from('payments')
                .update({ status: newStatus as any })
                .eq('id', paymentId)
                .select('*, profiles:user_id(*)')
                .single()

            if (error) throw error

            // If marked as paid, sync to revenues
            if (newStatus === 'paid' && updatedPayment) {
                const { error: revError } = await supabase.from('revenues').insert({
                    user_id: updatedPayment.user_id,
                    amount: updatedPayment.amount,
                    date: updatedPayment.payment_date,
                    period_type: 'monthly',
                    description: updatedPayment.description || 'Paiement validé'
                })
                if (revError) console.error('Error syncing to revenues:', revError)
            }

            toast(`Statut mis à jour : ${newStatus === 'paid' ? 'Payé' : 'Refusé'}`, 'success')
        } catch (err: any) {
            console.error('Error updating status:', err)
            toast('Erreur lors du changement de statut.', 'error')
        }
    }

    // Edit form state
    const [editAmount, setEditAmount] = useState('')
    const [editType, setEditType] = useState<any>('')
    const [editDate, setEditDate] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editStatus, setEditStatus] = useState<PaymentStatus>('pending')

    const handleSendEmail = (payment: Payment) => {
        const name = payment.profiles ? `${payment.profiles.first_name} ${payment.profiles.last_name}` : 'Collaborateur'
        const email = payment.profiles?.email || 'email-inconnu@enixis.com'

        toast(`Un email avec le bulletin de paye a été simulé pour ${name} (${email})`, 'success')
    }

    const handleEditClick = (payment: Payment) => {
        setSelectedPayment(payment)
        setEditAmount(payment.amount.toString())
        setEditType(payment.payment_type)
        setEditDate(payment.payment_date)
        setEditDescription(payment.description || '')
        setEditStatus(payment.status)
        setIsEditing(true)
    }

    const handleUpdatePayment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!selectedPayment) return

        setSubmitting(true)
        try {
            const updatedData = {
                amount: Number(editAmount),
                payment_type: editType,
                payment_date: editDate,
                description: editDescription,
                status: editStatus
            }

            // Update the payment
            const { error: updateError } = await supabase
                .from('payments')
                .update(updatedData)
                .eq('id', selectedPayment.id)

            if (updateError) throw updateError

            // If status changed to 'paid', sync to revenues
            if (editStatus === 'paid' && selectedPayment.status !== 'paid') {
                const { error: revError } = await supabase.from('revenues').insert({
                    user_id: selectedPayment.user_id,
                    amount: Number(editAmount),
                    date: editDate,
                    period_type: 'monthly',
                    description: editDescription || 'Paiement validé'
                })
                if (revError) console.error('Error syncing to revenues:', revError)
            }

            toast('Paiement mis à jour avec succès', 'success')
            setIsEditing(false)
            refreshPayments()
        } catch (err: any) {
            console.error('Error updating payment:', err)
            toast(err.message || 'Erreur lors de la mise à jour', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleImportComplete = async (data: PaymentImportRow[]) => {
        setSubmitting(true)
        try {
            // 1. Get profiles to map email to user_id
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, email')

            if (profileError) throw profileError

            const paymentsToInsert = data.map(row => {
                const profile = profiles?.find(p => p.email?.toLowerCase() === row.email.toLowerCase())
                return {
                    user_id: profile?.id,
                    amount: row.montant,
                    payment_date: row.date_prestation,
                    payment_type: 'monthly',
                    status: 'paid' as const,
                    description: row.prestation,
                    created_by: profile?.id
                }
            }).filter(p => p.user_id) // Skip rows if email not found

            if (paymentsToInsert.length === 0) {
                toast("Aucun collaborateur correspondant trouvé pour les emails fournis.", "error")
                return
            }

            // 2. Insert into payments
            const { data: insertedPayments, error: paymentError } = await supabase
                .from('payments')
                .insert(paymentsToInsert)
                .select()

            if (paymentError) throw paymentError

            // 3. Sync to revenues
            if (insertedPayments && insertedPayments.length > 0) {
                const revenuesToInsert = insertedPayments.map(p => ({
                    user_id: p.user_id,
                    amount: p.amount,
                    date: p.payment_date,
                    period_type: 'monthly',
                    description: p.description || 'Import de paiement'
                }))
                const { error: revError } = await supabase.from('revenues').insert(revenuesToInsert)
                if (revError) console.error('Error syncing to revenues during import:', revError)
            }

            toast(`${paymentsToInsert.length} paiements importés et synchronisés avec succès.`, "success")
            refreshPayments()
            setIsImporting(false)
        } catch (err: any) {
            console.error('Error importing payments:', err)
            toast(err.message || "Erreur lors de l'importation.", "error")
        } finally {
            setSubmitting(false)
        }
    }

    const filteredPayments = payments.filter(p => {
        const name = `${p.profiles?.first_name} ${p.profiles?.last_name}`.toLowerCase()
        return name.includes(searchTerm.toLowerCase())
    })

    const filteredTotal = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const filteredPaid = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const filteredPending = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des Paiements</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        {isAdmin
                            ? "Administrez les revenus et bulletins de paye de l'équipe."
                            : "Consultez l'évolution de vos revenus et téléchargez vos bulletins."}
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 h-10"
                                onClick={() => setIsImporting(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Importer (Excel/CSV)
                            </Button>
                        </div>
                        <Button
                            onClick={() => setIsMassPaying(!isMassPaying)}
                            className={cn(
                                "gap-2 transition-all hover:scale-105 shadow-lg h-10",
                                isMassPaying
                                    ? "bg-slate-800 hover:bg-slate-900 text-white"
                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                            )}
                        >
                            {isMassPaying ? (
                                <>Retour à l'Historique</>
                            ) : (
                                <><Plus className="w-4 h-4" /> Paiement en Masse</>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {isImporting && isAdmin && (
                <div className="mb-8">
                    <PaymentImporter
                        onImportComplete={handleImportComplete}
                        onCancel={() => setIsImporting(false)}
                    />
                </div>
            )}

            {isMassPaying && isAdmin && (
                <div className="mb-8">
                    <MassPaymentEditor
                        onCancel={() => setIsMassPaying(false)}
                        onSuccess={() => refreshPayments()}
                    />
                </div>
            )}

            {isAdmin && !isMassPaying && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white/40 backdrop-blur-sm border-white/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Sélectionné</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(filteredTotal)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-purple-600/20" />
                        </CardContent>
                    </Card>
                    <Card className="bg-white/40 backdrop-blur-sm border-white/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Payé Sélectionné</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(filteredPaid)}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-600/20" />
                        </CardContent>
                    </Card>
                    <Card className="bg-white/40 backdrop-blur-sm border-white/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">En Attente Sélectionné</p>
                                <p className="text-xl font-bold text-amber-600">{formatCurrency(filteredPending)}</p>
                            </div>
                            <RotateCw className="w-8 h-8 text-amber-600/20" />
                        </CardContent>
                    </Card>
                </div>
            )}

            {(view === 'history' || view === 'all') && !isMassPaying && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Historique de Paiements</CardTitle>
                                <CardDescription>Les derniers paiements effectués sur la plateforme.</CardDescription>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-slate-400 hover:text-purple-600 shrink-0"
                                        onClick={() => refreshPayments()}
                                        title="Rafraîchir les données"
                                    >
                                        <RotateCw className={cn("w-4 h-4", paymentsLoading && "animate-spin")} />
                                    </Button>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher un collaborateur..."
                                            className="pl-9 bg-white/50 dark:bg-slate-800/50"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paymentsLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                                <p className="text-slate-500 font-medium animate-pulse">Chargement des transactions...</p>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="py-20 text-center space-y-2">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-semibold">Aucun paiement trouvé</p>
                                <p className="text-slate-500 text-sm">Ajustez votre recherche ou effectuez un nouveau paiement.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                                            <th className="py-4 px-2 font-semibold">Collaborateur</th>
                                            <th className="py-4 px-2 font-semibold">Prestation</th>
                                            <th className="py-4 px-2 font-semibold text-center">Statut</th>
                                            <th className="py-4 px-2 font-semibold text-center">Date</th>
                                            <th className="py-4 px-2 font-semibold text-right">Commission</th>
                                            <th className="py-4 px-2 font-semibold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {filteredPayments.map(payment => (
                                            <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-xs uppercase shadow-sm">
                                                            {payment.profiles?.first_name?.[0] || '?'}{payment.profiles?.last_name?.[0] || ''}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                {payment.profiles?.first_name || ''} {payment.profiles?.last_name || ''}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 font-medium">
                                                                {payment.profiles?.role === 'super_admin' ? 'Super Admin' :
                                                                    payment.profiles?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={payment.description || 'Paiement standard'}>
                                                        {payment.description || 'Paiement standard'}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="flex justify-center">
                                                        {payment.status === 'paid' ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] uppercase font-bold">
                                                                Payé
                                                            </Badge>
                                                        ) : payment.status === 'refused' ? (
                                                            <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px] uppercase font-bold">
                                                                Refusé
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] uppercase font-bold">
                                                                En attente
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 dark:text-white text-sm font-medium">
                                                            {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: fr })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            Prestation
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                        {formatCurrency(payment.amount)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isAdmin && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                                    onClick={() => handleEditClick(payment)}
                                                                    title="Éditer"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                {payment.status !== 'paid' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                                        onClick={() => handleStatusUpdate(payment.id, 'paid')}
                                                                        title="Confirmer le paiement"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                {payment.status !== 'refused' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        onClick={() => handleStatusUpdate(payment.id, 'refused')}
                                                                        title="Refuser le paiement"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            title="Envoyer par email"
                                                            onClick={() => handleSendEmail(payment)}
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Bulletin PDF"
                                                            onClick={() => generatePaymentPDF(
                                                                {
                                                                    id: payment.id,
                                                                    amount: payment.amount,
                                                                    payment_date: payment.payment_date,
                                                                    payment_type: payment.payment_type,
                                                                    status: payment.status
                                                                },
                                                                {
                                                                    id: payment.user_id,
                                                                    first_name: payment.profiles?.first_name || '',
                                                                    last_name: payment.profiles?.last_name || '',
                                                                    role: payment.profiles?.role as any || 'collaborator',
                                                                    email: payment.profiles?.email || '',
                                                                    status: 'active'
                                                                },
                                                                settings?.logo_url || null
                                                            )}
                                                        >
                                                            <FileDown className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )
            }

            {/* Analytical Curve */}
            {
                (view === 'evolution' || view === 'all') && !isMassPaying && (
                    <RevenueChart
                        data={chartData}
                        title={isAdmin ? "Revenu Global de la Plateforme" : "Mon Évolution Financière"}
                        description={isAdmin ? "Performance cumulée de tous les collaborateurs" : "Suivi de vos prestations et bonus"}
                    />
                )
            }

            {!isMassPaying && isAdmin && <PaymentReporting />}

            {/* Edit Payment Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-purple-600" />
                            Modifier le Paiement
                        </DialogTitle>
                        <DialogDescription>
                            Ajustez les détails de la transaction pour {selectedPayment?.profiles?.first_name} {selectedPayment?.profiles?.last_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePayment} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prestation" className="text-xs font-bold uppercase text-slate-500">Prestation</Label>
                                <Select value={editDescription} onValueChange={setEditDescription}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50">
                                        <SelectValue placeholder={loadingPrestations ? "Chargement..." : "Choisir une prestation"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {prestations.map((p) => (
                                            <SelectItem key={p.id} value={p.name}>
                                                {p.name} ({formatCurrency(p.price)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-bold uppercase text-slate-500">Montant (CFA)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        required
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-xs font-bold uppercase text-slate-500">Périodicité</Label>
                                <Select value={editType} onValueChange={setEditType}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50">
                                        <SelectValue placeholder="Choisir un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        <SelectItem value="biweekly">Bimensuel</SelectItem>
                                        <SelectItem value="monthly">Mensuel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs font-bold uppercase text-slate-500">Statut</Label>
                                <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50">
                                        <SelectValue placeholder="Choisir un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Payé ✅</SelectItem>
                                        <SelectItem value="pending">En attente ⏳</SelectItem>
                                        <SelectItem value="refused">Refusé ❌</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-bold uppercase text-slate-500">Date de paiement</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="date"
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        required
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/20 transition-all"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mettre à jour'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}
