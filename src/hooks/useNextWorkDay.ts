import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface NextSchedule {
    user_id: string
    date: string
    start_time: string
    end_time: string
    status: string
}

export function useNextWorkDay(userIds: string[]) {
    const [nextSchedules, setNextSchedules] = useState<Record<string, NextSchedule>>({})
    const [loading, setLoading] = useState(false)

    const fetchNextSchedules = useCallback(async () => {
        if (userIds.length === 0) return

        setLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]

            // For each user, get their next non-off schedule after today
            const { data, error } = await supabase
                .from('schedules')
                .select('user_id, date, start_time, end_time, status')
                .in('user_id', userIds)
                .gt('date', today)
                .neq('status', 'off')
                .order('date', { ascending: true })

            if (error) throw error

            // Group by user_id and take the first one (earliest)
            const schedulesMap: Record<string, NextSchedule> = {}
            data?.forEach(s => {
                if (!schedulesMap[s.user_id]) {
                    schedulesMap[s.user_id] = s
                }
            })

            setNextSchedules(schedulesMap)
        } catch (err) {
            console.error('Error fetching next schedules:', err)
        } finally {
            setLoading(false)
        }
    }, [userIds])

    useEffect(() => {
        fetchNextSchedules()
    }, [userIds])

    return { nextSchedules, loading, refresh: fetchNextSchedules }
}
