import { useCollaborators } from '@/hooks/useCollaborators'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { PersonnelStatusList } from './PersonnelStatusList'
import { Clock, Loader2 } from 'lucide-react'

export function LiveActivityView() {
    const { collaborators, loading } = useCollaborators()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Activité en Temps Réel</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Consultez qui est actuellement en service, en pause ou en repos.
                </p>
            </div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-purple-600" />
                        Statuts de l'équipe
                    </CardTitle>
                    <CardDescription>
                        Mis à jour automatiquement en fonction du planning du jour.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                            <p className="text-slate-500 font-medium animate-pulse">Chargement de l'activité...</p>
                        </div>
                    ) : (
                        <PersonnelStatusList profiles={collaborators} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
