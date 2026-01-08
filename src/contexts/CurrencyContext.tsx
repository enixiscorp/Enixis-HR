import React, { createContext, useContext, useState, useEffect } from 'react'



interface CurrencyContextType {
    currency: string
    setCurrency: (code: string) => void
    formatCurrency: (amount: number) => string
}

// Default to XOF as requested
const DEFAULT_CURRENCY = 'XOF'

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY)

    useEffect(() => {
        const savedCurrency = localStorage.getItem('enixis_currency')
        if (savedCurrency) {
            setCurrencyState(savedCurrency)
        }
    }, [])

    const setCurrency = (code: string) => {
        setCurrencyState(code)
        localStorage.setItem('enixis_currency', code)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
