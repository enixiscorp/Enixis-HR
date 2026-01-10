import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Prestation {
    id: string
    name: string
    description: string | null
    price: number
    is_active: boolean
    created_at: string
}

export function usePrestations() {
    const [prestations, setPrestations] = useState<Prestation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPrestations = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('prestations')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setPrestations(data || [])
        } catch (err: any) {
            console.error('Error fetching prestations:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    const addPrestation = async (name: string, price: number, is_active: boolean = true) => {
        try {
            const { error } = await supabase
                .from('prestations')
                .insert([{ name, price, is_active }])
            if (error) throw error
            await fetchPrestations()
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    const updatePrestation = async (id: string, updates: Partial<Prestation>) => {
        try {
            const { error } = await supabase
                .from('prestations')
                .update(updates)
                .eq('id', id)
            if (error) throw error
            await fetchPrestations()
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    const deletePrestation = async (id: string) => {
        try {
            const { error } = await supabase
                .from('prestations')
                .delete()
                .eq('id', id)
            if (error) throw error
            await fetchPrestations()
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    useEffect(() => {
        fetchPrestations()
    }, [fetchPrestations])

    return {
        prestations,
        loading,
        error,
        refresh: fetchPrestations,
        addPrestation,
        updatePrestation,
        deletePrestation
    }
}
