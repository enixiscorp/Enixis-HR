import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    gradient: string
}

export default function StatsCard({ title, value, icon: Icon, trend, gradient }: StatsCardProps) {
    return (
        <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400 mb-1">
                            {title}
                        </p>
                        <h3 className="text-3xl font-black text-white">
                            {value}
                        </h3>
                        {trend && (
                            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-cyan-400' : 'text-red-400'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </p>
                        )}
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-cyan-500/20`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
