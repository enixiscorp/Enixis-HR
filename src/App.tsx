import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { Toaster } from '@/components/ui/Toaster'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <CurrencyProvider>
                        <Router>
                            <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/login" element={<Navigate to="/" replace />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <DashboardPage />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </Router>
                    </CurrencyProvider>
                </AuthProvider>
                <Toaster />
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App
