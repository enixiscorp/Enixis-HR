import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { AbsenceType } from '@/types/database'

interface AbsenceRequestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId?: string
    onSuccess: () => void
}

export function AbsenceRequestDialog({
    open,
    onOpenChange,
    userId,
    onSuccess,
}: AbsenceRequestDialogProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState('')
    const [type, setType] = useState<AbsenceType>('repos')
    const [reason, setReason] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.from('absence_requests').insert([
                {
                    user_id: userId,
                    date,
                    type,
                    reason,
                    status: 'pending'
                }
            ])

            if (error) throw error

            onSuccess()
            onOpenChange(false)
            setDate('')
            setReason('')
        } catch (error: any) {
            console.error('Error saving absence request:', error)
            alert(error.message || 'Erreur lors de l\'enregistrement de la demande')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-white/10">
                <DialogHeader>
                    <DialogTitle>Nouvelle demande d'absence</DialogTitle>
                    <DialogDescription>
                        Choisissez une date et le type de demande (Repos, Maladie ou Congé).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="req-date">Date</Label>
                        <Input
                            id="req-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="bg-white/50 dark:bg-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="req-type">Type de demande</Label>
                        <Select value={type} onValueChange={(val: AbsenceType) => setType(val)}>
                            <SelectTrigger id="req-type" className="bg-white/50 dark:bg-slate-800">
                                <SelectValue placeholder="Choisir un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="repos">Repos</SelectItem>
                                <SelectItem value="sick_leave">Arrêt Maladie</SelectItem>
                                <SelectItem value="on_leave">Congé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="req-reason">Motif (optionnel)</Label>
                        <Input
                            id="req-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Rendez-vous médical..."
                            className="bg-white/50 dark:bg-slate-800"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            {loading ? 'Envoi...' : 'Envoyer la demande'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
