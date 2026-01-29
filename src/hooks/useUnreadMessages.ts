import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export function useUnreadMessages() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!user) return

        const fetchUnreadCount = async () => {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('is_read', false)

            if (!error) {
                setUnreadCount(count || 0)
            }
        }

        fetchUnreadCount()

        // Subscribe to NEW messages for this user
        const channel = supabase
            .channel('unread_messages')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT (new msg) and UPDATE (marking as read)
                    schema: 'public',
                    table: 'messages',
                },
                (payload: any) => {
                    const eventType = payload.eventType
                    if (eventType === 'INSERT') {
                        const newMsg = payload.new
                        if (newMsg && newMsg.receiver_id === user.id) {
                            setUnreadCount(prev => prev + 1)
                            toast('Nouveau message reçu !', 'info')
                        }
                    } else if (eventType === 'UPDATE' || eventType === 'DELETE') {
                        fetchUnreadCount()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, toast])

    return { unreadCount }
}
