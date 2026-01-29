import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Profile {
    id: string
    first_name: string
    last_name: string
    email: string
    role: 'collaborator' | 'admin' | 'super_admin'
    status: string
    avatar_url: string | null
}

export function useProfiles() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, email, role, status, avatar_url')
                    .order('first_name')

                if (error) throw error
                setProfiles(data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching profiles')
            } finally {
                setLoading(false)
            }
        }

        fetchProfiles()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('profiles_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    fetchProfiles()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return { profiles, loading, error }
}
