import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

export function useCollaborators() {
    const [collaborators, setCollaborators] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCollaborators = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('first_name', { ascending: true })

            if (error) throw error
            setCollaborators(data || [])
        } catch (err) {
            console.error('Error fetching collaborators:', err)
            setError('Impossible de charger les collaborateurs')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCollaborators()

        // Subscribe to changes in the profiles table
        const subscription = supabase
            .channel('profiles_all_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    fetchCollaborators()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchCollaborators])

    return { collaborators, loading, error, refresh: fetchCollaborators }
}
