import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useCollaborators } from '@/hooks/useCollaborators'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, Clock, Users, Coffee, Save, CheckCircle2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { ScheduleManager } from './ScheduleManager'

export function MassScheduleEditor() {
    const { collaborators, loading } = useCollaborators()
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const [scheduleData, setScheduleData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        breaks: [
            { type: '15', time: '10:30' },
            { type: '30', time: '13:00' },
            { type: '15', time: '15:30' }
        ] as { type: '15' | '30' | '60', time: string }[]
    })

    const handleToggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(collaborators.map(c => c.id))
        } else {
            setSelectedUsers([])
        }
    }

    const updateBreak = (index: number, field: 'type' | 'time', value: string) => {
        const newBreaks = [...scheduleData.breaks]
        newBreaks[index] = { ...newBreaks[index], [field]: value }
        setScheduleData({ ...scheduleData, breaks: newBreaks })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedUsers.length === 0) {
            alert('Veuillez sélectionner au moins un collaborateur.')
            return
        }

        setSubmitting(true)
        setSuccess(false)

        try {
            const schedules = selectedUsers.map(userId => ({
                user_id: userId,
                date: scheduleData.date,
                start_time: scheduleData.startTime,
                end_time: scheduleData.endTime,
                status: 'scheduled',
                breaks: scheduleData.breaks
            }))

            const { error } = await supabase
                .from('schedules')
                .insert(schedules)

            if (error) throw error

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            setSelectedUsers([])
        } catch (err: any) {
            console.error('Error saving mass schedules:', err)
            alert(err.message || 'Erreur lors de la planification.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <CalendarIcon className="w-6 h-6 text-indigo-600" />
                        Édition de Masse des Plannings
                    </CardTitle>
                    <CardDescription>
                        Planifiez les horaires et les pauses pour plusieurs collaborateurs en une seule fois.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Collaborator Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Sélection des Collaborateurs
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={selectedUsers.length === collaborators.length && collaborators.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all" className="text-sm cursor-pointer">Tout sélectionner</Label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white/30 dark:bg-slate-900/30">
                                {loading ? (
                                    <div className="col-span-full text-center py-4">Chargement...</div>
                                ) : collaborators.length === 0 ? (
                                    <div className="col-span-full text-center py-4 text-slate-500">Aucun collaborateur trouvé.</div>
                                ) : (
                                    collaborators.map(user => (
                                        <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => handleToggleUser(user.id)}
                                            />
                                            <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                                                {user.first_name} {user.last_name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Time Work */}
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    Horaires de Travail
                                </Label>
                                <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white/30 dark:bg-slate-900/30">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={scheduleData.date}
                                            onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                                            className="bg-white/50 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="startTime">Début</Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={scheduleData.startTime}
                                                onChange={e => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                                                className="bg-white/50 dark:bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endTime">Fin</Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                value={scheduleData.endTime}
                                                onChange={e => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                                                className="bg-white/50 dark:bg-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Breaks */}
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Coffee className="w-5 h-5 text-indigo-500" />
                                    Pauses (Max 3)
                                </Label>
                                <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white/30 dark:bg-slate-900/30">
                                    {scheduleData.breaks.map((brk, idx) => (
                                        <div key={idx} className="grid grid-cols-2 gap-4 items-end">
                                            <div className="space-y-2">
                                                <Label>Durée Pause {idx + 1}</Label>
                                                <Select
                                                    value={brk.type}
                                                    onValueChange={val => updateBreak(idx, 'type', val)}
                                                >
                                                    <SelectTrigger className="bg-white/50 dark:bg-slate-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="15">15 minutes</SelectItem>
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="60">1 heure</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Heure Pause {idx + 1}</Label>
                                                <Input
                                                    type="time"
                                                    value={brk.time}
                                                    onChange={e => updateBreak(idx, 'time', e.target.value)}
                                                    className="bg-white/50 dark:bg-slate-800"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting || selectedUsers.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg font-semibold shadow-lg shadow-indigo-500/20"
                        >
                            {submitting ? 'Planification en cours...' : success ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Plannings Enregistrés</> : <><Save className="w-5 h-5 mr-2" /> Enregistrer les Plannings pour {selectedUsers.length} personne(s)</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <ScheduleManager />
        </>
    )
}
