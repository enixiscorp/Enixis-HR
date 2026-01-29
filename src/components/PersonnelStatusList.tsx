import { useState, useEffect, useCallback } from 'react'
import { Badge } from './ui/badge'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { Clock, Coffee, Briefcase, Home, CheckCircle2, Activity, UserX, MessageSquare, RotateCw, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ChatDialog } from './ChatDialog'
import { useNextWorkDay } from '@/hooks/useNextWorkDay'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PersonnelStatusListProps {
    profiles: Profile[]
}

type WorkStatus = 'working' | 'late' | 'break' | 'off' | 'scheduled' | 'finished' | 'online_unplanned' | 'online' | 'absent'

export function PersonnelStatusList({ profiles }: PersonnelStatusListProps) {
    const [schedules, setSchedules] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [selectedReceiver, setSelectedReceiver] = useState<Profile | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Fetch next shifts for all users
    const userIds = profiles.map(p => p.id)
    const { nextSchedules } = useNextWorkDay(userIds)

    const fetchTodaySchedules = useCallback(async () => {
        try {
            setLoading(true)
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .eq('date', today)
            setSchedules(data || [])
        } catch (err) {
            console.error('Error fetching schedules:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTodaySchedules()

        // Subscribe to real-time changes for today's schedules
        const today = new Date().toISOString().split('T')[0]
        const channel = supabase
            .channel('today_schedules')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedules',
                    filter: `date=eq.${today}`
                },
                () => {
                    fetchTodaySchedules()
                }
            )
            .subscribe()

        // Update time every minute to refresh status labels
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    const getStatus = (userId: string): { status: WorkStatus; label: string; color: string; icon: any } => {
        const profile = profiles.find(p => p.id === userId)
        const schedule = schedules.find(s => s.user_id === userId)

        const now = currentTime
        const nowTime = now.getHours() * 60 + now.getMinutes()

        // Check for presence in last 10 minutes
        const isRecentlyActive = profile?.last_seen_at &&
            (now.getTime() - new Date(profile.last_seen_at).getTime()) < 10 * 60 * 1000

        if (!schedule) {
            if (isRecentlyActive) return { status: 'online_unplanned', label: 'En ligne - Non Programmé', color: 'bg-emerald-100 text-emerald-600', icon: Activity }
            return { status: 'off', label: 'Repos', color: 'bg-slate-100 text-slate-500', icon: Home }
        }

        const [startH, startM] = schedule.start_time.split(':').map(Number)
        const [endH, endM] = schedule.end_time.split(':').map(Number)
        const startTime = startH * 60 + startM
        const endTime = endH * 60 + endM

        // Handle explicit statuses
        if (schedule.status === 'sick') return { status: 'off', label: 'Maladie', color: 'bg-red-100/50 text-red-600', icon: Activity }
        if (schedule.status === 'absent') return { status: 'absent', label: 'Absent', color: 'bg-red-100 text-red-600', icon: UserX }
        if (schedule.status === 'off') {
            if (isRecentlyActive) return { status: 'online_unplanned', label: 'Repos (En ligne)', color: 'bg-emerald-100 text-emerald-600', icon: Activity }
            return { status: 'off', label: 'Repos (Planifié)', color: 'bg-slate-100 text-slate-500', icon: Home }
        }

        if (nowTime < startTime) {
            if (isRecentlyActive) return { status: 'online', label: 'En ligne (Avant service)', color: 'bg-emerald-100 text-emerald-600', icon: Activity }
            return { status: 'scheduled', label: `Commence à ${schedule.start_time}`, color: 'bg-blue-100 text-blue-600', icon: Clock }
        }

        if (nowTime > endTime) {
            if (isRecentlyActive) return { status: 'online', label: 'En ligne (Après service)', color: 'bg-emerald-100 text-emerald-600', icon: Activity }
            return { status: 'finished', label: 'Terminé', color: 'bg-slate-100 text-slate-500', icon: CheckCircle2 }
        }

        // Within work hours
        if (!isRecentlyActive) {
            return { status: 'absent', label: 'Absent', color: 'bg-red-100 text-red-600', icon: UserX }
        }

        // Check for Late
        // If online but arrive significantly after start time
        if (profile?.last_seen_at) {
            const firstActivityToday = new Date(profile.last_seen_at)
            const activityTime = firstActivityToday.getHours() * 60 + firstActivityToday.getMinutes()
            const lateMinutes = activityTime - startTime

            // If they are currently working but were late
            if (lateMinutes > 5) { // 5 minutes threshold
                return { status: 'working', label: `En Retard de ${lateMinutes} min`, color: 'bg-orange-100 text-orange-600', icon: Clock }
            }
        }

        // Check breaks
        if (schedule.breaks && Array.isArray(schedule.breaks)) {
            for (const brk of schedule.breaks) {
                const [brkH, brkM] = brk.time.split(':').map(Number)
                const brkStart = brkH * 60 + brkM
                const brkEnd = brkStart + Number(brk.type)

                if (nowTime >= brkStart && nowTime < brkEnd) {
                    return { status: 'break', label: 'En Pause', color: 'bg-orange-100 text-orange-600', icon: Coffee }
                }
            }
        }

        return { status: 'working', label: 'En Service', color: 'bg-emerald-100 text-emerald-600', icon: Briefcase }
    }

    // Sort: Working > Online > Break > Scheduled > Finished > Off > Absent
    const sortedProfiles = [...profiles].sort((a, b) => {
        const statusPriority = { working: 0, online: 1, online_unplanned: 1, late: 2, break: 3, scheduled: 4, finished: 5, off: 6, absent: 7 }
        const statusA = getStatus(a.id).status
        const statusB = getStatus(b.id).status
        return statusPriority[statusA] - statusPriority[statusB]
    })

    // Import CheckCircle2 here since I used it above but forgot to import
    // Wait, I can't import inside function. The tool will error if I import undefined.
    // I need to add CheckCircle2 to imports.

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Statut des Collaborateurs</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-purple-600"
                    onClick={() => fetchTodaySchedules()}
                    disabled={loading}
                    title="Rafraîchir les statuts"
                >
                    <RotateCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProfiles.map(profile => {
                    const statusInfo = getStatus(profile.id)
                    const Icon = statusInfo.icon
                    const nextShift = nextSchedules[profile.id]

                    return (
                        <HoverCard key={profile.id} openDelay={200}>
                            <HoverCardTrigger asChild>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/50 transition-all group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-slate-500">{profile.first_name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                                {profile.first_name ?? ''} {profile.last_name ?? ''}
                                            </p>
                                            <p className="text-[10px] text-slate-500 capitalize">{profile.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(statusInfo.color, "border-none px-2 py-0.5 text-[10px] font-medium")}>
                                            <Icon className="w-3 h-3 mr-1" />
                                            {statusInfo.label}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedReceiver(profile)
                                                setIsChatOpen(true)
                                            }}
                                            className="w-8 h-8 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 animate-pulse-border"
                                            title="Démarrer une discussion"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 p-0 border-white/10 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl">
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-slate-500 text-lg">{profile.first_name?.[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {profile.first_name} {profile.last_name}
                                            </h4>
                                            <p className="text-[10px] text-slate-500">{profile.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Planning prévu</p>
                                        {nextShift ? (
                                            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3">
                                                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-indigo-900 dark:text-white capitalize">
                                                        {nextShift.date === new Date().toISOString().split('T')[0] ? "Aujourd'hui" : format(new Date(nextShift.date), 'EEEE d MMMM', { locale: fr })}
                                                    </p>
                                                    <div className="flex items-center text-xs text-indigo-700 dark:text-indigo-300">
                                                        <span>{nextShift.start_time}</span>
                                                        <ArrowRight className="w-3 h-3 mx-1" />
                                                        <span>{nextShift.end_time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-500 text-xs italic">
                                                Aucun planning programmé
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        {profile.last_seen_at && (
                                            <p className="text-[10px] text-slate-400 text-right italic">
                                                Dernière activité : {format(new Date(profile.last_seen_at), 'HH:mm', { locale: fr })}
                                            </p>
                                        )}
                                        {profile.last_logout_at && (
                                            <p className="text-[10px] text-purple-400 text-right italic font-medium">
                                                Déconnexion manuelle : {format(new Date(profile.last_logout_at), 'HH:mm', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )
                })}
            </div>

            <ChatDialog
                receiver={selectedReceiver}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />

            <style>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
                }
                .animate-pulse-border {
                    animation: pulse-border 2s infinite;
                    border-radius: 9999px;
                }
            `}</style>
        </div>
    )
}
