import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlatformSettings {
    id: string
    user_id: string | null
    logo_url: string | null
    platform_name: string
    location: string
    company_address: string | null
    startup_name: string | null
    updated_at: string
}

export function usePlatformSettings() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchSettings = useCallback(async () => {
        try {
            // Get the current user's ID
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch settings for this specific user
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Error fetching platform settings:', error)
                setLoading(false)
                return
            }

            if (data) {
                setSettings(data)
            } else {
                // No settings yet for this admin — this is fine, they'll create on first save
                setSettings(null)
            }
        } catch (err) {
            console.error('Error fetching platform settings:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const updateSettings = async (updates: Partial<PlatformSettings>) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non authentifié')

        const payload = {
            user_id: user.id,
            platform_name: updates.startup_name || settings?.platform_name || 'HERIX',
            updated_at: new Date().toISOString(),
            ...updates
        }

        // Use upsert on user_id conflict (one row per admin)
        const { error } = await supabase
            .from('platform_settings')
            .upsert(payload, { onConflict: 'user_id' })

        if (error) {
            console.error('Error updating settings:', error)
            throw error
        }

        await fetchSettings()
    }

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return { settings, loading, updateSettings, refresh: fetchSettings }
}
