import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Payment {
    id: string
    user_id: string
    amount: number
    payment_date: string
    payment_type: 'weekly' | 'biweekly' | 'monthly'
    status: 'pending' | 'paid' | 'failed' | 'refused'
    description: string | null
    created_by: string | null
    created_at: string
    profiles?: {
        first_name: string
        last_name: string
        email: string
        role: string
        avatar_url: string | null
    }
}

export function usePayments(userId: string | undefined) {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true)
                let query = supabase
                    .from('payments')
                    .select('*, profiles:user_id(first_name, last_name, email, role, avatar_url), description')
                    .order('payment_date', { ascending: false })

                if (userId) {
                    query = query.eq('user_id', userId)
                }

                const { data, error } = await query

                if (error) throw error
                setPayments(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching payments')
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('payments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payments',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchPayments()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId])

    const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, payment) => sum + Number(payment.amount), 0)

    const pendingPayments = payments.filter(p => p.status === 'pending')

    return { payments, loading, error, totalPaid, pendingPayments }
}
