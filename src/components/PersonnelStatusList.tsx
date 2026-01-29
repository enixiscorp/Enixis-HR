import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { Clock, Coffee, Briefcase, Home, CheckCircle2, Activity, UserX } from 'lucide-react'

interface PersonnelStatusListProps {
    profiles: Profile[]
}

type WorkStatus = 'working' | 'break' | 'off' | 'scheduled' | 'finished'

export function PersonnelStatusList({ profiles }: PersonnelStatusListProps) {
    const [schedules, setSchedules] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const fetchTodaySchedules = async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .eq('date', today)
            setSchedules(data || [])
        }

        fetchTodaySchedules()

        // Update time every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const getStatus = (userId: string): { status: WorkStatus; label: string; color: string; icon: any } => {
        const schedule = schedules.find(s => s.user_id === userId)
        if (!schedule) return { status: 'off', label: 'Repos', color: 'bg-slate-100 text-slate-500', icon: Home }

        const now = currentTime
        const nowTime = now.getHours() * 60 + now.getMinutes()

        const [startH, startM] = schedule.start_time.split(':').map(Number)
        const [endH, endM] = schedule.end_time.split(':').map(Number)
        const startTime = startH * 60 + startM
        const endTime = endH * 60 + endM

        // Handle explicit statuses
        if (schedule.status === 'sick') return { status: 'off', label: 'Maladie', color: 'bg-red-100 text-red-600', icon: Activity }
        if (schedule.status === 'absent') return { status: 'off', label: 'Absence', color: 'bg-orange-100 text-orange-600', icon: UserX }
        if (schedule.status === 'off') return { status: 'off', label: 'Repos (Planifié)', color: 'bg-slate-100 text-slate-500', icon: Home }

        if (nowTime < startTime) return { status: 'scheduled', label: `Commence à ${schedule.start_time}`, color: 'bg-blue-100 text-blue-600', icon: Clock }
        if (nowTime > endTime) return { status: 'finished', label: 'Terminé', color: 'bg-slate-100 text-slate-500', icon: CheckCircle2 }

        // Check breaks
        // Breaks format: [{ type: '15', time: '10:30' }]
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

    // Sort: Working > Break > Scheduled > Finished > Off
    const sortedProfiles = [...profiles].sort((a, b) => {
        const statusPriority = { working: 0, break: 1, scheduled: 2, finished: 3, off: 4 }
        const statusA = getStatus(a.id).status
        const statusB = getStatus(b.id).status
        return statusPriority[statusA] - statusPriority[statusB]
    })

    // Import CheckCircle2 here since I used it above but forgot to import
    // Wait, I can't import inside function. The tool will error if I import undefined.
    // I need to add CheckCircle2 to imports.

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProfiles.map(profile => {
                    const statusInfo = getStatus(profile.id)
                    const Icon = statusInfo.icon

                    return (
                        <div key={profile.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-slate-500">{profile.first_name?.[0] || '?'}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile.first_name} {profile.last_name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
                                </div>
                            </div>
                            <Badge className={`${statusInfo.color} border-none`}>
                                <Icon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                            </Badge>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
