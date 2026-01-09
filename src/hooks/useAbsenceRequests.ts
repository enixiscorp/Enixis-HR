import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AbsenceRequest } from '@/types/database'

export function useAbsenceRequests(userId: string | undefined) {
    const [requests, setRequests] = useState<AbsenceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchRequests = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('absence_requests')
                    .select('*, profile:profiles!user_id(*)')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })

                if (error) throw error
                setRequests(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching absence requests')
            } finally {
                setLoading(false)
            }
        }

        fetchRequests()

        const subscription = supabase
            .channel('absence_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'absence_requests',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchRequests()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId])

    return { requests, loading, error, refresh: () => { } }
}
