import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Payment {
    id: string
    user_id: string
    amount: number
    payment_date: string
    payment_type: 'weekly' | 'biweekly' | 'monthly'
    status: 'pending' | 'paid' | 'failed'
    created_by: string | null
    created_at: string
}

export function usePayments(userId: string | undefined) {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchPayments = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('user_id', userId)
                    .order('payment_date', { ascending: false })

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
