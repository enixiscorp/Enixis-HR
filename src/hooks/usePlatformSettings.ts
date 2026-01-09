import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlatformSettings {
    id: string
    logo_url: string | null
    platform_name: string
    updated_at: string
}

export function usePlatformSettings() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows'
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
    }

    const updateLogo = async (url: string) => {
        try {
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    id: settings?.id || undefined,
                    logo_url: url,
                    platform_name: 'Enixis HR'
                })

            if (error) throw error
            await fetchSettings()
        } catch (err) {
            console.error('Error updating logo:', err)
            throw err
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    return { settings, loading, updateLogo, refresh: fetchSettings }
}
