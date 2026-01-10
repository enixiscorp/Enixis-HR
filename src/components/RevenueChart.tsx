import { useMemo, useState } from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { format, startOfMonth, startOfYear, eachDayOfInterval, eachMonthOfInterval, subMonths, isSameDay, isSameMonth, subYears } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { TrendingUp, Calendar } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'

interface RevenueData {
    date: string
    amount: number
}

interface RevenueChartProps {
    data: RevenueData[]
    title?: string
    description?: string
}

type PeriodFilter = 'day' | 'month' | 'quarter' | 'semester' | 'year'

export function RevenueChart({ data, title = "Évolution du Revenu", description }: RevenueChartProps) {
    const [period, setPeriod] = useState<PeriodFilter>('month')
    const { formatCurrency } = useCurrency()

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return []

        const now = new Date()
        let startDate: Date
        let formatStr: string
        let interval: Date[]

        switch (period) {
            case 'day':
                startDate = subMonths(now, 1) // Last 30 days
                formatStr = 'dd MMM'
                interval = eachDayOfInterval({ start: startDate, end: now })
                break
            case 'month':
                startDate = subYears(now, 1) // Last 12 months
                formatStr = 'MMM yyyy'
                interval = eachMonthOfInterval({ start: startDate, end: now })
                break
            case 'quarter':
                startDate = subYears(now, 2)
                formatStr = 'QQQ yyyy'
                // Recharts will handle grouping if we provide monthly data or we group manually
                interval = eachMonthOfInterval({ start: startDate, end: now }).filter((_, i) => i % 3 === 0)
                break
            case 'year':
                startDate = subYears(now, 5)
                formatStr = 'yyyy'
                interval = Array.from({ length: 6 }, (_, i) => startOfYear(subYears(now, 5 - i)))
                break
            case 'semester':
                startDate = subYears(now, 3)
                formatStr = 'MMM yyyy'
                interval = eachMonthOfInterval({ start: startDate, end: now }).filter((_, i) => i % 6 === 0)
                break
            default:
                startDate = subMonths(now, 6)
                formatStr = 'MMM'
                interval = eachMonthOfInterval({ start: startDate, end: now })
        }

        return interval.map(date => {
            const label = format(date, formatStr, { locale: fr })
            const amount = data
                .filter(d => {
                    const dDate = new Date(d.date)
                    if (period === 'day') return isSameDay(dDate, date)
                    if (period === 'month') return isSameMonth(dDate, date)
                    if (period === 'quarter') return dDate >= date && dDate < startOfMonth(subMonths(date, -3))
                    if (period === 'semester') return dDate >= date && dDate < startOfMonth(subMonths(date, -6))
                    if (period === 'year') return dDate.getFullYear() === date.getFullYear()
                    return false
                })
                .reduce((sum, d) => sum + d.amount, 0)

            return { label, amount, date: date.toISOString() }
        })
    }, [data, period])

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description || "Visualisation de la performance financière"}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                        <SelectTrigger className="w-[140px] bg-white/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Par jour</SelectItem>
                            <SelectItem value="month">Par mois</SelectItem>
                            <SelectItem value="quarter">Par trimestre</SelectItem>
                            <SelectItem value="semester">Par semestre</SelectItem>
                            <SelectItem value="year">Par année</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value: number) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                                labelStyle={{ color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#9333ea"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
