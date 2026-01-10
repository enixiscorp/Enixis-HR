import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { RevenueChart } from './RevenueChart'
import { MassPaymentEditor } from './MassPaymentEditor'
import { useCollaborators } from '@/hooks/useCollaborators'
import { useRevenues } from '@/hooks/useRevenues'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
    Plus,
    Mail,
    FileDown,
    Edit2,
    Search
} from 'lucide-react'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { generatePaymentPDF } from '@/lib/exportUtils'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useAuth } from '@/contexts/AuthContext'
import { Profile } from '@/types/database'

export function PaymentManagement() {
    const { profile } = useAuth()
    const { collaborators } = useCollaborators()
    const { settings } = usePlatformSettings()
    const { formatCurrency } = useCurrency()

    // We fetch all revenues if admin, or just own if collaborator
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const { revenues } = useRevenues(isAdmin ? undefined : profile?.id) // Need to handle undefined in hook

    // For the chart, we need a flat structure
    const chartData = revenues.map(r => ({ date: r.date, amount: Number(r.amount) }))

    const [searchTerm, setSearchTerm] = useState('')
    const [isMassPaying, setIsMassPaying] = useState(false)

    // Simulation of "Send Email"
    const handleSendEmail = (_payment: any, collaborator: Profile) => {
        // Mock email sending
        alert(`Un email avec le bulletin de paye a été envoyé à ${collaborator.first_name || ''} ${collaborator.last_name || ''} (${collaborator.email || 'email-inconnu@enixis.com'})`)
    }

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
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        {isMassPaying ? "Voir l'Historique" : <><Plus className="w-4 h-4" /> Paiement en Masse</>}
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
                <MassPaymentEditor />
            ) : (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Historique Récents</CardTitle>
                                <CardDescription>Les derniers paiements effectués ou en attente.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Rechercher un collaborateur..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow_x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                                        <th className="py-4 px-2 font-medium">Collaborateur</th>
                                        <th className="py-4 px-2 font-medium text-center">Date</th>
                                        <th className="py-4 px-2 font-medium text-center">Type</th>
                                        <th className="py-4 px-2 font-medium text-right">Montant</th>
                                        <th className="py-4 px-2 font-medium text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Mocking some rows for UI demonstration if hook is empty or processing filter */}
                                    {collaborators.filter(c =>
                                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(collab => (
                                        <tr key={collab.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-xs uppercase">
                                                        {collab.first_name[0]}{collab.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                            {collab.first_name || ''} {collab.last_name || ''}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500">{collab.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-center text-slate-600 dark:text-slate-400 text-sm">
                                                12 Jan 2026
                                            </td>
                                            <td className="py-4 px-2 text-center">
                                                <Badge variant="outline" className="text-[10px] border-slate-200">Mensuel</Badge>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(1250)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600"
                                                        title="Éditer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                                        title="Envoyer par email"
                                                        onClick={() => handleSendEmail({}, collab)}
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                                        title="Bulletin PDF"
                                                        onClick={() => generatePaymentPDF({ id: 'dummy', amount: 1250, payment_date: new Date().toISOString(), payment_type: 'monthly', status: 'paid' }, collab, settings?.logo_url || null)}
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
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
