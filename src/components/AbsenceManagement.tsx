import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Check, X, AlertCircle, Clock, Calendar, User, FileDown, Trash2 } from 'lucide-react'
import { AbsenceRequest, Profile } from '@/types/database'
import { generateAbsencePDF } from '@/lib/exportUtils'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'

export function AbsenceManagement() {
    const [requests, setRequests] = useState<(AbsenceRequest & { profile: Profile })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
    const { settings } = usePlatformSettings()

    const fetchAllRequests = async () => {
        try {
            setLoading(true)
            setError(null)
            const { data, error } = await supabase
                .from('absence_requests')
                .select(`
                    *,
                    profile:profiles!user_id(*)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRequests(data as (AbsenceRequest & { profile: Profile })[] || [])
        } catch (err: any) {
            console.error('Error fetching all requests:', err)
            setError(err.message || 'Erreur lors du chargement des demandes')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllRequests()

        const subscription = supabase
            .channel('all_absence_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'absence_requests' }, () => {
                fetchAllRequests()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleDelete = async (requestId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return

        try {
            const { error } = await supabase
                .from('absence_requests')
                .delete()
                .eq('id', requestId)

            if (error) throw error
            fetchAllRequests()
        } catch (error: any) {
            console.error('Error deleting request:', error)
            alert(`Erreur lors de la suppression : ${error.message || 'Erreur inconnue'}`)
        }
    }

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            const note = adminNotes[requestId] || ''

            const { error } = await supabase
                .from('absence_requests')
                .update({
                    status,
                    admin_notes: note,
                    processed_at: new Date().toISOString(),
                    processed_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', requestId)

            if (error) throw error

            // Clear note for this request
            setAdminNotes(prev => {
                const newNotes = { ...prev }
                delete newNotes[requestId]
                return newNotes
            })

            fetchAllRequests()
        } catch (error: any) {
            console.error('Error updating request status:', error)
            alert(`Erreur lors de la mise à jour : ${error.message || 'Erreur inconnue'}`)
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

    const pendingRequests = requests.filter(r => r.status === 'pending')
    const historyRequests = requests.filter(r => r.status !== 'pending')

    return (
        <div className="space-y-6">
            <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-cyan-400" />
                        <div>
                            <CardTitle className="text-2xl font-black text-white">
                                Demandes d'Absence en Attente
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Validez ou refusez les demandes des collaborateurs.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Chargement des demandes...</div>
                    ) : error ? (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-semibold">Erreur de chargement</span>
                            </div>
                            <p className="text-sm">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchAllRequests} className="mt-4">
                                Réessayer
                            </Button>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-cyan-500/20">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20 text-cyan-500" />
                            <p>Aucune demande en attente</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingRequests.map(request => (
                                <div key={request.id} className="p-4 rounded-xl bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <User className="w-4 h-4 text-cyan-400 shrink-0" />
                                                <span className="font-black text-white truncate">
                                                    {request.profile?.first_name ?? ''} {request.profile?.last_name ?? ''}
                                                </span>
                                            </div>
                                            <Badge className="text-[10px] h-5 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                                                {getAbsenceTypeLabel(request.type)}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                                                <span>{new Date(request.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
                                            </div>
                                            {request.reason && (
                                                <div className="flex items-start gap-1">
                                                    <span className="shrink-0 text-slate-400">"</span>
                                                    <span className="italic line-clamp-2 md:line-clamp-none">{request.reason}</span>
                                                    <span className="shrink-0 text-slate-400">"</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Admin Note Input */}
                                        <div className="mt-2 text-xs">
                                            <label className="block text-gray-400 mb-1">Motif de validation (optionnel):</label>
                                            <textarea
                                                className="w-full p-2 rounded-lg bg-black/20 border border-cyan-500/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 transition-all outline-none"
                                                rows={2}
                                                placeholder="Saisissez la raison de votre accord ou refus..."
                                                value={adminNotes[request.id] || ''}
                                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 self-end">
                                        <Button
                                            size="sm"
                                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white text-xs h-9"
                                            onClick={() => handleAction(request.id, 'approved')}
                                        >
                                            <Check className="w-3.5 h-3.5 mr-1" /> Approver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1 md:flex-none text-xs h-9"
                                            onClick={() => handleAction(request.id, 'rejected')}
                                        >
                                            <X className="w-3.5 h-3.5 mr-1" /> Refuser
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 text-gray-500 hover:text-red-400 hover:bg-white/5"
                                            onClick={() => handleDelete(request.id)}
                                            title="Supprimer la demande"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {
                historyRequests.length > 0 && (
                    <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg opacity-80">
                        <CardHeader>
                            <CardTitle className="text-lg font-black text-white">Historique des Demandes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-cyan-500/20">
                                            <th className="py-2 px-4 text-gray-400">Collaborateur</th>
                                            <th className="py-2 px-4 text-gray-400">Date</th>
                                            <th className="py-2 px-4 text-gray-400">Type</th>
                                            <th className="py-2 px-4 text-gray-400">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyRequests.slice(0, 10).map(request => (
                                            <tr key={request.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-2 px-4 text-white font-medium">{request.profile?.first_name ?? ''} {request.profile?.last_name ?? ''}</td>
                                                <td className="py-2 px-4 text-gray-300">{new Date(request.date).toLocaleDateString()}</td>
                                                <td className="py-2 px-4 text-gray-300 truncate">{getAbsenceTypeLabel(request.type)}</td>
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={request.status === 'approved' ? 'success' : 'destructive'} className="scale-75">
                                                            {request.status === 'approved' ? 'Approuvé' : 'Refusé'}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-gray-400 hover:text-cyan-400 gap-1"
                                                            onClick={() => generateAbsencePDF(request, request.profile, settings)}
                                                        >
                                                            <FileDown className="w-3.5 h-3.5" />
                                                            <span className="text-xs">Télécharger</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-gray-500 hover:text-red-400 gap-1"
                                                            onClick={() => handleDelete(request.id)}
                                                            title="Supprimer de l'historique"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span className="text-xs">Supprimer</span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    )
}
