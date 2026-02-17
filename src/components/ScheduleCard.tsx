import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSchedules } from '@/hooks/useSchedules'
import { useAbsenceRequests } from '@/hooks/useAbsenceRequests'
import { Calendar, Clock, Plus, Edit2, AlertCircle, FileDown } from 'lucide-react'
import { ScheduleDialog } from './ScheduleDialog'
import { AbsenceRequestDialog } from './AbsenceRequestDialog'
import { generateAbsencePDF } from '@/lib/exportUtils'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'

interface ScheduleCardProps {
    userId: string
    isEditable?: boolean
}

export default function ScheduleCard({ userId, isEditable = false }: ScheduleCardProps) {
    const { schedules, loading: schedulesLoading, upcomingSchedules } = useSchedules(userId)
    const { requests, loading: requestsLoading } = useAbsenceRequests(userId)
    const { settings } = usePlatformSettings()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false)
    const [scheduleToEdit, setScheduleToEdit] = useState<any>(null)

    const handleAddSchedule = () => {
        setScheduleToEdit(null)
        setIsDialogOpen(true)
    }

    const handleAddAbsence = () => {
        setIsAbsenceDialogOpen(true)
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

    const getAbsenceTypeLabel = (type: string) => {
        switch (type) {
            case 'repos': return 'Repos'
            case 'sick_leave': return 'Arrêt Maladie'
            case 'on_leave': return 'Congé'
            default: return type
        }
    }

    const loading = schedulesLoading || requestsLoading

    // Combine schedules and requests by date
    const allDays = Array.from(new Set([
        ...schedules.map(s => s.date),
        ...requests.map(r => r.date)
    ])).sort((a, b) => b.localeCompare(a)).slice(0, 10)

    return (
        <>
            <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            Horaires & Absences
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge className="text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                {upcomingSchedules.length} à venir
                            </Badge>
                            {/* Collaborators can now request absences via (+) */}
                            <Button size="sm" onClick={handleAddAbsence} className="h-8 w-8 p-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20" title="Demander une absence">
                                <Plus className="w-4 h-4" />
                            </Button>
                            {isEditable && (
                                <Button size="sm" onClick={handleAddSchedule} variant="outline" className="h-8 w-8 p-0" title="Ajouter un horaire">
                                    <Clock className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Chargement...</div>
                    ) : allDays.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Aucun horaire ou demande planifié
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {allDays.map((date) => {
                                const daySchedules = schedules.filter(s => s.date === date)
                                const dayRequests = requests.filter(r => r.date === date)

                                return (
                                    <div
                                        key={date}
                                        className="p-4 rounded-lg bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all group relative overflow-hidden"
                                    >
                                        <div className="mb-2 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Show existing schedules */}
                                            {daySchedules.map(schedule => (
                                                <div key={schedule.id} className="flex items-center justify-between text-sm pl-6">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                        </span>
                                                        <Badge variant={getStatusVariant(schedule.status)} className="scale-75 origin-left">
                                                            {getStatusLabel(schedule.status)}
                                                        </Badge>
                                                    </div>
                                                    {isEditable && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                                            onClick={() => handleEdit(schedule)}
                                                        >
                                                            <Edit2 className="w-3 h-3 text-slate-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Show absence requests with blinking status */}
                                            {dayRequests.map(request => (
                                                <div key={request.id} className="flex items-center justify-between text-sm pl-6">
                                                    <div className="flex items-center gap-2 font-medium text-cyan-400">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>{getAbsenceTypeLabel(request.type)}</span>
                                                        <Badge
                                                            variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'success' : 'destructive'}
                                                            className={`scale-75 origin-left ${request.status === 'pending' ? 'animate-[pulse_1.5s_infinite] bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : ''}`}
                                                        >
                                                            {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvé' : 'Refusé'}
                                                        </Badge>
                                                    </div>
                                                    {request.status !== 'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            title="Télécharger la confirmation"
                                                            onClick={() => generateAbsencePDF(request, (request as any).profile, settings)}
                                                        >
                                                            <FileDown className="w-3.5 h-3.5 text-slate-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ScheduleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                userId={userId}
                scheduleToEdit={scheduleToEdit}
                onSuccess={() => { }}
            />

            <AbsenceRequestDialog
                open={isAbsenceDialogOpen}
                onOpenChange={setIsAbsenceDialogOpen}
                userId={userId}
                onSuccess={() => { }}
            />
        </>
    )
}
