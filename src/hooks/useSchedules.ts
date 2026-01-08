import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Schedule {
    id: string
    user_id: string
    date: string
    start_time: string
    end_time: string
    status: 'scheduled' | 'completed' | 'cancelled'
    created_by: string | null
    created_at: string
    updated_at: string
}

export function useSchedules(userId: string | undefined) {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchSchedules = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: true })

                if (error) throw error
                setSchedules(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching schedules')
            } finally {
                setLoading(false)
            }
        }

        fetchSchedules()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('schedules_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedules',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchSchedules()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId])

    const upcomingSchedules = schedules.filter(
        schedule => new Date(schedule.date) >= new Date() && schedule.status === 'scheduled'
    )

    const pastSchedules = schedules.filter(
        schedule => new Date(schedule.date) < new Date()
    )

    return { schedules, loading, error, upcomingSchedules, pastSchedules }
}
