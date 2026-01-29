import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Send, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Profile } from '@/types/database'
import { format } from 'date-fns'

interface ChatDialogProps {
    receiver: Profile | null
    isOpen: boolean
    onClose: () => void
}

export function ChatDialog({ receiver, isOpen, onClose }: ChatDialogProps) {
    const { user } = useAuth()
    const { messages, loading, sendMessage } = useChat(receiver?.id || null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            await sendMessage(newMessage)
            setNewMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    if (!receiver) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] h-[600px] flex flex-col p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-purple-500">
                            <AvatarImage src={receiver.avatar_url || undefined} />
                            <AvatarFallback className="bg-purple-600 text-white">
                                {receiver.first_name?.[0]}{receiver.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                {receiver.first_name} {receiver.last_name}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50"
                >
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Send className="w-6 h-6 opacity-20" />
                            </div>
                            <p className="text-sm">Envoyez le premier message !</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === user?.id
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[80%] rounded-2xl px-4 py-2 shadow-sm
                                        ${isMe
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}
                                    `}>
                                        <p className="text-sm line-height-relaxed">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-white/10 flex gap-2">
                    <Input
                        placeholder="Écrivez un message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none focus-visible:ring-purple-500"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || sending}
                        className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 shadow-lg shadow-purple-500/20"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
