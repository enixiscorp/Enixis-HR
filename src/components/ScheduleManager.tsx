import { useState } from 'react'
import { useAllSchedules, ScheduleWithProfile } from '@/hooks/useAllSchedules'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
    Search,
    Trash2,
    Edit2,
    Clock,
    Home,
    Activity,
    UserX,
    Filter,
    Loader2,
    CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Label } from './ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from './ui/dialog'
import { useToast } from '@/contexts/ToastContext'

export function ScheduleManager() {
    const { schedules, loading, deleteSchedule, updateSchedule } = useAllSchedules()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [dateFilter, setDateFilter] = useState('')

    const [editingSchedule, setEditingSchedule] = useState<ScheduleWithProfile | null>(null)
    const [editData, setEditData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        status: ''
    })

    const filteredSchedules = schedules.filter(s => {
        const nameMatch = `${s.profiles?.first_name ?? ''} ${s.profiles?.last_name ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        const dateMatch = dateFilter ? s.date === dateFilter : true
        return nameMatch && dateMatch
    })

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) return
        try {
            await deleteSchedule(id)
            toast('Planning supprimé avec succès', 'success')
        } catch (err) {
            toast('Erreur lors de la suppression', 'error')
        }
    }

    const handleEdit = (schedule: ScheduleWithProfile) => {
        setEditingSchedule(schedule)
        setEditData({
            date: schedule.date,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            status: schedule.status
        })
    }

    const handleSaveEdit = async () => {
        if (!editingSchedule) return
        try {
            await updateSchedule(editingSchedule.id, {
                date: editData.date,
                start_time: editData.startTime,
                end_time: editData.endTime,
                status: editData.status
            })
            setEditingSchedule(null)
            toast('Planning mis à jour', 'success')
        } catch (err) {
            toast('Erreur lors de la mise à jour', 'error')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Prévu</Badge>
            case 'off': return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1"><Home className="w-3 h-3" /> Repos</Badge>
            case 'sick': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><Activity className="w-3 h-3" /> Maladie</Badge>
            case 'absent': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1"><UserX className="w-3 h-3" /> Absence</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg mt-8">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Filter className="w-5 h-5 text-indigo-500" />
                            Gestion des Plannings Édités
                        </CardTitle>
                        <CardDescription>Consultez et modifiez les horaires de tous les collaborateurs.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Chercher un nom..."
                                className="pl-9 w-full sm:w-48 bg-white/50 dark:bg-slate-800"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Input
                            type="date"
                            className="bg-white/50 dark:bg-slate-800 w-full sm:w-auto"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        Chargement des plannings...
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        Aucun planning trouvé pour ces critères.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="py-4 px-2 font-semibold">Collaborateur</th>
                                    <th className="py-4 px-2 font-semibold">Date</th>
                                    <th className="py-4 px-2 font-semibold">Horaires</th>
                                    <th className="py-4 px-2 font-semibold">Status</th>
                                    <th className="py-4 px-2 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filteredSchedules.map(schedule => (
                                    <tr key={schedule.id} className="hover:bg-white/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {schedule.profiles.first_name?.[0]}{schedule.profiles.last_name?.[0]}
                                                </div>
                                                <div className="font-medium text-slate-900 dark:text-white text-sm">
                                                    {schedule.profiles.first_name} {schedule.profiles.last_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-sm">
                                            {format(new Date(schedule.date), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="py-4 px-2 text-sm">
                                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {schedule.start_time} - {schedule.end_time}
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            {getStatusBadge(schedule.status)}
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                                    onClick={() => handleEdit(schedule)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                    onClick={() => handleDelete(schedule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Edit Dialog */}
            <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Modifier le Planning</DialogTitle>
                        <DialogDescription>
                            Modifiez la date, les horaires ou marquez une absence.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Collaborateur</Label>
                            <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                                {editingSchedule?.profiles.first_name} {editingSchedule?.profiles.last_name}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Date</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editData.date}
                                onChange={e => setEditData({ ...editData, date: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-start">Début</Label>
                                <Input
                                    id="edit-start"
                                    type="time"
                                    value={editData.startTime}
                                    onChange={e => setEditData({ ...editData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-end">Fin</Label>
                                <Input
                                    id="edit-end"
                                    type="time"
                                    value={editData.endTime}
                                    onChange={e => setEditData({ ...editData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status / Type de journée</Label>
                            <Select
                                value={editData.status}
                                onValueChange={val => setEditData({ ...editData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Normal (Horaires Prévus)</SelectItem>
                                    <SelectItem value="off">Repos</SelectItem>
                                    <SelectItem value="sick">Maladie</SelectItem>
                                    <SelectItem value="absent">Absence (Non justifiée)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSchedule(null)}>Annuler</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveEdit}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
