import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlatformSettings {
    id: string
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
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                setSettings(data)
            }
        } catch (err) {
            console.error('Error fetching platform settings:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const updateSettings = async (updates: Partial<PlatformSettings>) => {
        try {
            // Fetch latest ID to avoid duplicates
            const { data: latest } = await supabase
                .from('platform_settings')
                .select('id')
                .maybeSingle()

            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    id: latest?.id || settings?.id,
                    platform_name: 'HERIX',
                    is_singleton: true,
                    updated_at: new Date().toISOString(),
                    ...updates
                }, {
                    onConflict: 'id'
                })

            if (error) throw error
            await fetchSettings()
        } catch (err) {
            console.error('Error updating settings:', err)
            throw err
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return { settings, loading, updateSettings, refresh: fetchSettings }
}
