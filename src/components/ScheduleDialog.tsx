import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

interface ScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    onSuccess: () => void
    scheduleToEdit?: {
        id: string
        date: string
        start_time: string
        end_time: string
    } | null
}

export function ScheduleDialog({
    open,
    onOpenChange,
    userId,
    onSuccess,
    scheduleToEdit,
}: ScheduleDialogProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(scheduleToEdit?.date || '')
    const [startTime, setStartTime] = useState(scheduleToEdit?.start_time || '09:00')
    const [endTime, setEndTime] = useState(scheduleToEdit?.end_time || '17:00')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const scheduleData = {
                user_id: userId,
                date,
                start_time: startTime,
                end_time: endTime,
                status: 'scheduled',
            }

            if (scheduleToEdit) {
                const { error } = await supabase
                    .from('schedules')
                    .update(scheduleData)
                    .eq('id', scheduleToEdit.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('schedules').insert([scheduleData])
                if (error) throw error
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error saving schedule:', error)
            alert('Erreur lors de l\'enregistrement')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {scheduleToEdit ? 'Modifier l\'horaire' : 'Ajouter un horaire'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Début</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">Fin</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
