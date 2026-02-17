import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRevenues } from '@/hooks/useRevenues'
import { DollarSign, TrendingUp } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { RevenueChart } from './RevenueChart'

interface RevenueCardProps {
    userId?: string
}

export default function RevenueCard({ userId }: RevenueCardProps) {
    const { revenues, loading, totalRevenue, revenuesByPeriod } = useRevenues(userId)
    const { formatCurrency } = useCurrency()
    const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly' | 'all'>('all')

    const displayRevenues = selectedPeriod === 'all' ? revenues : revenuesByPeriod(selectedPeriod)

    const chartData = useMemo(() => {
        return revenues.map(r => ({
            date: r.date,
            amount: Number(r.amount)
        }))
    }, [revenues])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        Revenus
                    </CardTitle>
                    <div className="flex items-center gap-2 text-2xl font-black text-cyan-400">
                        <TrendingUp className="w-6 h-6" />
                        {formatCurrency(totalRevenue)}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 h-[250px] w-full">
                    <RevenueChart
                        data={chartData}
                        title=""
                    />
                </div>

                {/* Period Filter */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {(['all', 'daily', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-cyan-300'
                                }`}
                        >
                            {period === 'all' ? 'Tous' : period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Revenue List */}
                {loading ? (
                    <div className="text-center py-8 text-slate-500">Chargement...</div>
                ) : displayRevenues.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        Aucun revenu trouvé pour cette période
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {displayRevenues.map((revenue) => (
                            <div
                                key={revenue.id}
                                className="p-4 rounded-lg bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {formatCurrency(Number(revenue.amount))}
                                            </p>
                                            <Badge variant="secondary" className="text-xs">
                                                {revenue.period_type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(revenue.date)}
                                        </p>
                                        {revenue.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                {revenue.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
