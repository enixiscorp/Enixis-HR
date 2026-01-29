import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface ScheduleWithProfile {
    id: string
    user_id: string
    date: string
    start_time: string
    end_time: string
    status: string
    breaks: any[]
    profiles: {
        first_name: string
        last_name: string
        avatar_url: string | null
    }
}

export function useAllSchedules() {
    const [schedules, setSchedules] = useState<ScheduleWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAllSchedules = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    *,
                    profiles:user_id (
                        first_name,
                        last_name,
                        avatar_url
                    )
                `)
                .order('date', { ascending: false })

            if (error) throw error
            setSchedules(data as any[] || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching all schedules')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllSchedules()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('all_schedules_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedules',
                },
                () => {
                    fetchAllSchedules()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const deleteSchedule = async (id: string) => {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id)

        if (error) throw error
        // Real-time will handle the update
    }

    const updateSchedule = async (id: string, updates: any) => {
        const { error } = await supabase
            .from('schedules')
            .update(updates)
            .eq('id', id)

        if (error) throw error
    }

    return { schedules, loading, error, deleteSchedule, updateSchedule, refresh: fetchAllSchedules }
}
