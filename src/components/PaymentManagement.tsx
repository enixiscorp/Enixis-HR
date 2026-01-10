import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { RevenueChart } from './RevenueChart'
import { MassPaymentEditor } from './MassPaymentEditor'
import { useRevenues } from '@/hooks/useRevenues'
import { usePayments, Payment } from '@/hooks/usePayments'
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
    DollarSign
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

export function PaymentManagement() {
    const { profile } = useAuth()
    const { settings } = usePlatformSettings()
    const { prestations, loading: loadingPrestations } = usePrestations()
    const { formatCurrency } = useCurrency()
    const { toast } = useToast()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const { revenues } = useRevenues(isAdmin ? undefined : profile?.id)
    const { payments, loading: paymentsLoading } = usePayments(isAdmin ? undefined : profile?.id)

    const chartData = revenues.map(r => ({ date: r.date, amount: Number(r.amount) }))

    const [searchTerm, setSearchTerm] = useState('')
    const [isMassPaying, setIsMassPaying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Edit form state
    const [editAmount, setEditAmount] = useState('')
    const [editType, setEditType] = useState<any>('')
    const [editDate, setEditDate] = useState('')
    const [editDescription, setEditDescription] = useState('')

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
        setIsEditing(true)
    }

    const handleUpdatePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPayment) return
        setSubmitting(true)

        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    amount: Number(editAmount),
                    payment_type: editType,
                    payment_date: editDate,
                    description: editDescription
                })
                .eq('id', selectedPayment.id)

            if (error) throw error

            toast('Paiement mis à jour avec succès.', 'success')
            setIsEditing(false)
        } catch (err: any) {
            console.error('Error updating payment:', err)
            toast(err.message || 'Erreur lors de la mise à jour.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredPayments = payments.filter(p => {
        const name = `${p.profiles?.first_name} ${p.profiles?.last_name}`.toLowerCase()
        return name.includes(searchTerm.toLowerCase())
    })

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
                    <Button
                        onClick={() => setIsMassPaying(!isMassPaying)}
                        className={cn(
                            "gap-2 transition-all hover:scale-105 shadow-lg",
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
                )}
            </div>

            {/* Analytical Curve */}
            <RevenueChart
                data={chartData}
                title={isAdmin ? "Revenu Global de la Plateforme" : "Mon Évolution Financière"}
                description={isAdmin ? "Performance cumulée de tous les collaborateurs" : "Suivi de vos prestations et bonus"}
            />

            {isMassPaying ? (
                <MassPaymentEditor onCancel={() => setIsMassPaying(false)} />
            ) : (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Historique de Paiements</CardTitle>
                                <CardDescription>Les derniers paiements effectués sur la plateforme.</CardDescription>
                            </div>
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
                                                <td className="py-4 px-2 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 dark:text-white text-sm font-medium">
                                                            {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: fr })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {format(new Date(payment.payment_date), 'EEEE', { locale: fr })}
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
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                                onClick={() => handleEditClick(payment)}
                                                                title="Éditer"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
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
            )}

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
        </div>
    )
}
