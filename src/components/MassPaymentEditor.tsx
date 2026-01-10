import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useCollaborators } from '@/hooks/useCollaborators'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Checkbox } from './ui/checkbox'
import { Loader2, DollarSign, Users, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

export function MassPaymentEditor() {
    const { collaborators, loading: loadingCollabs } = useCollaborators()
    const { user: currentUser } = useAuth()

    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [amount, setAmount] = useState<string>('')
    const [paymentType, setPaymentType] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')
    const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleAll = () => {
        if (selectedUsers.length === collaborators.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(collaborators.map(c => c.id))
        }
    }

    const handleBatchPayment = async () => {
        if (selectedUsers.length === 0 || !amount || Number(amount) <= 0) {
            alert('Veuillez sélectionner au moins un collaborateur et un montant valide.')
            return
        }

        setLoading(true)
        try {
            const payments = selectedUsers.map(userId => ({
                user_id: userId,
                amount: Number(amount),
                payment_date: paymentDate,
                payment_type: paymentType,
                status: 'paid',
                created_by: currentUser?.id
            }))

            const { error } = await supabase.from('payments').insert(payments)
            if (error) throw error

            setSuccess(true)
            setSelectedUsers([])
            setAmount('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Error batch paying:', error)
            alert('Erreur lors de l\'enregistrement des paiements.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Users className="w-5 h-5 text-purple-500" />
                    Paiement en Masse
                </CardTitle>
                <CardDescription>
                    Enregistrez un paiement identique pour plusieurs collaborateurs simultanément.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Montant par personne</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-9 h-11"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Périodicité</Label>
                        <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                <SelectItem value="biweekly">Bihebdomadaire</SelectItem>
                                <SelectItem value="monthly">Mensuel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date de paiement</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="date"
                                className="pl-9 h-11"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                            Sélectionner les collaborateurs ({selectedUsers.length})
                        </Label>
                        <Button variant="ghost" size="sm" onClick={toggleAll}>
                            {selectedUsers.length === collaborators.length ? "Tout désélectionner" : "Tout sélectionner"}
                        </Button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {loadingCollabs ? (
                            <div className="col-span-full py-8 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>
                        ) : collaborators.map(c => (
                            <div
                                key={c.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedUsers.includes(c.id)
                                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                    : "bg-white/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    }`}
                                onClick={() => toggleUser(c.id)}
                            >
                                <Checkbox
                                    checked={selectedUsers.includes(c.id)}
                                    onCheckedChange={() => toggleUser(c.id)}
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                                    <p className="text-[10px] text-slate-500">{c.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    disabled={loading || selectedUsers.length === 0}
                    onClick={handleBatchPayment}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Traitement en cours...
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Paiements enregistrés !
                        </>
                    ) : (
                        <>
                            Effectuer {selectedUsers.length} paiement(s)
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
