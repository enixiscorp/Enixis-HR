import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read: boolean
}

export function useChat(receiverId: string | null) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user || !receiverId) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching messages:', error)
            } else {
                setMessages(data || [])
            }
            setLoading(false)
        }

        fetchMessages()

        // Subscribe to new messages sent to me or by me
        const channel = supabase
            .channel(`chat:${user.id}:${receiverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new as Message

                    // Only show messages belonging to this conversation
                    const isFromReceiverToMe = newMsg.sender_id === receiverId && newMsg.receiver_id === user.id
                    const isFromMeToReceiver = newMsg.sender_id === user.id && newMsg.receiver_id === receiverId

                    if (isFromReceiverToMe || isFromMeToReceiver) {
                        setMessages((prev) => {
                            // Avoid duplicates (e.g. if already added by sendMessage)
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg]
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, receiverId])

    const sendMessage = async (content: string) => {
        if (!user || !receiverId || !content.trim()) return

        const newMessage = {
            sender_id: user.id,
            receiver_id: receiverId,
            content: content.trim()
        }

        const { data, error } = await supabase
            .from('messages')
            .insert(newMessage)
            .select()
            .single()

        if (error) {
            console.error('Error sending message:', error)
            throw error
        }

        setMessages((prev) => [...prev, data as Message])
        return data as Message
    }

    return { messages, loading, sendMessage }
}
