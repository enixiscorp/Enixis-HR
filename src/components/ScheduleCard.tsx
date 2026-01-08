import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSchedules } from '@/hooks/useSchedules'
import { Calendar, Clock, Plus, Edit2 } from 'lucide-react'
import { ScheduleDialog } from './ScheduleDialog'

interface ScheduleCardProps {
    userId: string
    isEditable?: boolean
}

export default function ScheduleCard({ userId, isEditable = false }: ScheduleCardProps) {
    const { schedules, loading, upcomingSchedules } = useSchedules(userId)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [scheduleToEdit, setScheduleToEdit] = useState<any>(null)

    const handleAdd = () => {
        setScheduleToEdit(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (schedule: any) => {
        setScheduleToEdit(schedule)
        setIsDialogOpen(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const formatTime = (timeString: string) => {
        return timeString.slice(0, 5) // HH:MM format
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success'
            case 'cancelled':
                return 'destructive'
            case 'scheduled':
                return 'default'
            default:
                return 'secondary'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Complété'
            case 'cancelled':
                return 'Annulé'
            case 'scheduled':
                return 'Planifié'
            default:
                return status
        }
    }

    return (
        <>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            Horaires
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-sm">
                                {upcomingSchedules.length} à venir
                            </Badge>
                            {isEditable && (
                                <Button size="sm" onClick={handleAdd} className="h-8 w-8 p-0">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Chargement...</div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Aucun horaire planifié
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {schedules.slice(0, 10).map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(schedule.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {formatTime(schedule.start_time)} -{' '}
                                                    {formatTime(schedule.end_time)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusVariant(schedule.status)}>
                                                {getStatusLabel(schedule.status)}
                                            </Badge>
                                            {isEditable && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                                    onClick={() => handleEdit(schedule)}
                                                >
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ScheduleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                userId={userId}
                scheduleToEdit={scheduleToEdit}
                onSuccess={() => {
                    // Refresh is handled by realtime subscription in hook
                }}
            />
        </>
    )
}
