import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { useCollaborators } from '@/hooks/useCollaborators'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Filter, FileSpreadsheet, Search } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { ReportGenerator } from '@/lib/ReportGenerator'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'

export function PaymentReporting() {
    const { collaborators, loading: loadingCollabs } = useCollaborators()
    const { settings } = usePlatformSettings()
    const [selectedUser, setSelectedUser] = useState<string>('all')
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })
    const [loading, setLoading] = useState(false)

    const fetchPaymentData = async () => {
        let query = supabase
            .from('payments')
            .select(`
                amount,
                payment_date,
                status,
                user_id,
                profiles (
                    first_name,
                    last_name
                )
            `)
            .gte('payment_date', dateRange.start)
            .lte('payment_date', dateRange.end)

        if (selectedUser !== 'all') {
            query = query.eq('user_id', selectedUser)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching payments:', error)
            alert('Erreur lors de la récupération des données de paiement.')
            return null
        }

        return data.map((p: any) => ({
            date: p.payment_date,
            collaboratorName: `${p.profiles.first_name} ${p.profiles.last_name}`,
            period: 'Mensuel', // This could be dynamic based on your logic
            amount: p.amount,
            status: p.status === 'paid' ? 'Payé' : 'En attente'
        }))
    }

    const handleExportPDF = async () => {
        setLoading(true)
        const data = await fetchPaymentData()
        if (data && data.length > 0) {
            const title = selectedUser === 'all'
                ? 'Rapport de Paiements Global'
                : `Rapport de Paiements - ${data[0].collaboratorName}`

            await ReportGenerator.generatePDF(title, data, settings?.logo_url)
        } else if (data) {
            alert('Aucun paiement trouvé pour cette période.')
        }
        setLoading(false)
    }

    const handleExportExcel = async () => {
        setLoading(true)
        const data = await fetchPaymentData()
        if (data && data.length > 0) {
            const title = selectedUser === 'all'
                ? 'Rapport_Paiements_Global'
                : `Rapport_Paiements_${data[0].collaboratorName.replace(/\s+/g, '_')}`

            ReportGenerator.generateExcel(title, data)
        } else if (data) {
            alert('Aucun paiement trouvé pour cette période.')
        }
        setLoading(false)
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Reporting & Exports
                </CardTitle>
                <CardDescription>
                    Générez des rapports de paiement en PDF ou Excel avec filtres personnalisés.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Collaborator Filter */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Collaborateur
                        </Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="bg-white/50 dark:bg-slate-800">
                                <SelectValue placeholder="Tous les collaborateurs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les collaborateurs</SelectItem>
                                {collaborators.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.first_name} {c.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-2">
                        <Label>Du</Label>
                        <input
                            type="date"
                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800 text-sm"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Au</Label>
                        <input
                            type="date"
                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800 text-sm"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={handleExportPDF}
                        disabled={loading || loadingCollabs}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Exporter en PDF (avec Logo)
                    </Button>
                    <Button
                        onClick={handleExportExcel}
                        disabled={loading || loadingCollabs}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Exporter en Excel (Sans Logo)
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
