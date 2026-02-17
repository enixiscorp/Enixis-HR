import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await signIn(email, password)

            if (error) {
                setError(error.message)
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
            {/* Animated background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-2xl animate-pulse delay-1000" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
                {/* Logo and brand section */}
                <div className="w-full max-w-md mb-8">
                    <div className="text-center space-y-4">
                        {/* Logo */}
                        <div className="inline-flex items-center justify-center mb-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse" />
                                <div className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                    <Sparkles className="w-8 h-8 text-purple-400" />
                                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 tracking-tight">
                                        HERIX
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Powered by tag */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full animate-pulse">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            <div className="w-2 h-2 bg-emerald-400 rounded-full absolute" />
                            <span className="text-xs font-medium text-white/60">Powered by Enixis</span>
                        </div>

                        <p className="text-lg text-white/60 font-light">
                            Gestion RH Nouvelle Génération
                        </p>
                    </div>
                </div>

                {/* Login card */}
                <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
                    <CardContent className="pt-8 pb-8 px-8">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Bienvenue</h2>
                                <p className="text-sm text-white/50">Connectez-vous pour continuer</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                                        <p className="text-sm text-red-200 text-center">{error}</p>
                                    </div>
                                )}

                                {/* Email field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-white/80 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Adresse email
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nom@exemple.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-white/80 flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 pr-12 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Connexion en cours...
                                        </div>
                                    ) : (
                                        'Se connecter'
                                    )}
                                </Button>
                            </form>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-center text-sm text-white/40">
                                    Besoin d'aide ? Contactez votre administrateur
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-white/30">
                        © {new Date().getFullYear()} HERIX - Tous droits réservés
                    </p>
                </div>
            </div>
        </div>
    )
}
