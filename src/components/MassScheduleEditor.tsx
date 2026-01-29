import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useProfiles } from '@/hooks/useProfiles'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, Clock, Users, Coffee, Save, CheckCircle2, Search, X, Plus } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { ScheduleManager } from './ScheduleManager'

interface MassScheduleEditorProps {
    onNavigate?: (tab: string) => void
}

export function MassScheduleEditor({ onNavigate }: MassScheduleEditorProps) {
    const { profiles: collaborators } = useProfiles()
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredCollaborators = collaborators.filter(c =>
        c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <CalendarIcon className="w-6 h-6 text-indigo-600" />
                                Édition de Masse des Plannings
                            </CardTitle>
                            <CardDescription>
                                Planifiez les horaires et les pauses pour plusieurs collaborateurs en une seule fois.
                            </CardDescription>
                        </div>
                        {onNavigate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate('activity')}
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Voir l'Activité Directe
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Collaborator Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Bénéficiaires ({selectedUsers.length})
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={collaborators.length > 0 && selectedUsers.length === collaborators.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all" className="text-sm cursor-pointer">Tout sélectionner</Label>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Chercher et ajouter un collaborateur..."
                                    className="pl-9 bg-white/50 dark:bg-slate-800"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto p-2 space-y-1">
                                        <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">Résultats</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700"
                                                onClick={() => {
                                                    const toAdd = filteredCollaborators.filter(c => !selectedUsers.includes(c.id)).map(c => c.id)
                                                    setSelectedUsers(prev => [...prev, ...toAdd])
                                                    setSearchTerm('')
                                                }}
                                            >
                                                Tout ajouter
                                            </Button>
                                        </div>
                                        {filteredCollaborators.filter(c => !selectedUsers.includes(c.id)).length === 0 ? (
                                            <p className="text-xs text-slate-500 p-2 text-center">Aucun autre collaborateur trouvé</p>
                                        ) : (
                                            filteredCollaborators.filter(c => !selectedUsers.includes(c.id)).map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => {
                                                        handleToggleUser(user.id)
                                                        setSearchTerm('')
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md cursor-pointer transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        {(user.first_name?.[0] || '')}{(user.last_name?.[0] || '')}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                            {user.first_name ?? ''} {user.last_name ?? ''}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 truncate">{user.email ?? 'Pas d\'email'}</p>
                                                    </div>
                                                    <Plus className="w-3 h-3 text-slate-400" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500 px-1">Sélectionnés ({selectedUsers.length})</Label>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 h-[200px] overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {selectedUsers.length === 0 ? (
                                        <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                            Utilisez la recherche pour ajouter des collaborateurs.
                                        </div>
                                    ) : (
                                        selectedUsers.map(id => {
                                            const user = collaborators.find(c => c.id === id)
                                            if (!user) return null
                                            return (
                                                <div
                                                    key={id}
                                                    className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 rounded-md shadow-sm"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {(user.first_name?.[0] || '')}{(user.last_name?.[0] || '')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold truncate">{user.first_name ?? ''} {user.last_name ?? ''}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-red-500 shrink-0"
                                                        onClick={() => handleToggleUser(id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
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
