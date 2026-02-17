import { Wallet, FileDown, Table, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePayments } from '@/hooks/usePayments'
import { useCurrency } from '@/contexts/CurrencyContext'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useCollaborators } from '@/hooks/useCollaborators'
import { generatePaymentPDF, generatePaymentExcel } from '@/lib/exportUtils'

interface PaymentHistoryCardProps {
    userId: string
}

export default function PaymentHistoryCard({ userId }: PaymentHistoryCardProps) {
    const { payments, loading, totalPaidAmount, pendingPayments } = usePayments(userId)
    const { formatCurrency } = useCurrency()
    const { settings } = usePlatformSettings()
    const { collaborators } = useCollaborators()

    const currentCollaborator = collaborators.find(c => c.id === userId)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success'
            case 'failed':
                return 'destructive'
            case 'pending':
                return 'pending'
            default:
                return 'secondary'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid':
                return 'Payé'
            case 'failed':
                return 'Échoué'
            case 'pending':
                return 'En attente'
            default:
                return status
        }
    }

    const getPaymentTypeLabel = (type: string) => {
        switch (type) {
            case 'weekly':
                return 'Hebdomadaire'
            case 'biweekly':
                return 'Bihebdomadaire'
            case 'monthly':
                return 'Mensuel'
            default:
                return type
        }
    }

    return (
        <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        Historique des paiements
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total payé</p>
                        <p className="text-xl font-black text-cyan-400">{formatCurrency(totalPaidAmount)}</p>
                    </div>
                </div>
                {pendingPayments.length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            {pendingPayments.length} paiement(s) en attente
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-slate-500">Chargement...</div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        Aucun paiement enregistré
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="p-4 rounded-lg bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                {formatCurrency(Number(payment.amount))}
                                            </p>
                                            <Badge variant={getStatusVariant(payment.status)} className="text-[10px] h-5">
                                                {getStatusLabel(payment.status)}
                                            </Badge>
                                        </div>
                                        {payment.description && (
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {payment.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-cyan-500" />
                                                {formatDate(payment.payment_date)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Table className="w-3 h-3 text-cyan-500" />
                                                {getPaymentTypeLabel(payment.payment_type)}
                                            </div>
                                        </div>
                                    </div>
                                    {payment.status === 'paid' && (
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 h-9"
                                                title="Exporter en PDF"
                                                onClick={() => generatePaymentPDF(payment, currentCollaborator, settings?.logo_url || null)}
                                            >
                                                <FileDown className="w-4 h-4 mr-2" />
                                                <span className="sm:hidden text-xs">PDF</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none border-blue-500/30 hover:bg-blue-500/10 text-blue-400 h-9"
                                                title="Exporter en Excel"
                                                onClick={() => generatePaymentExcel(payment, currentCollaborator)}
                                            >
                                                <Table className="w-4 h-4 mr-2" />
                                                <span className="sm:hidden text-xs">Excel</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
