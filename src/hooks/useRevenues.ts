import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Revenue {
    id: string
    user_id: string
    amount: number
    date: string
    period_type: 'daily' | 'monthly' | 'quarterly' | 'yearly'
    description: string | null
    created_at: string
}

export function useRevenues(userId: string | undefined) {
    const [revenues, setRevenues] = useState<Revenue[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchRevenues = async () => {
            try {
                setLoading(true)
                let query = supabase
                    .from('revenues')
                    .select('*')
                    .order('date', { ascending: false })

                if (userId) {
                    query = query.eq('user_id', userId)
                }

                const { data, error } = await query

                if (error) throw error
                setRevenues(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching revenues')
            } finally {
                setLoading(false)
            }
        }

        fetchRevenues()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('revenues_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'revenues',
                    ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
                },
                () => {
                    fetchRevenues()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId])

    const totalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0)

    const revenuesByPeriod = (periodType?: Revenue['period_type']) => {
        if (!periodType) return revenues
        return revenues.filter(rev => rev.period_type === periodType)
    }

    return { revenues, loading, error, totalRevenue, revenuesByPeriod }
}
