import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Sparkles, Check } from 'lucide-react'

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
                setError(error.message === 'Invalid login credentials'
                    ? 'Identifiants incorrects'
                    : error.message)
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError('Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Green */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-500 to-emerald-600 p-12 flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-black">HERIX</h1>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold mb-4">
                                Gérez votre équipe<br />en toute simplicité
                            </h2>
                            <p className="text-emerald-100 text-lg">
                                Rejoignez des milliers de professionnels qui font confiance à HERIX pour leur gestion RH.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5" />
                                <span>Configuration en moins de 5 minutes</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5" />
                                <span>Aucune carte bancaire requise</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5" />
                                <span>Essai gratuit de 14 jours</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-emerald-100">
                    © {new Date().getFullYear()} HERIX - Tous droits réservés
                </div>
            </div>

            {/* Right Panel - White Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            Accédez à votre espace RH
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div>
                            <Input
                                type="email"
                                placeholder="edemcyrille@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 text-slate-900 pr-12 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Connexion...
                                </div>
                            ) : (
                                'Se connecter'
                            )}
                        </Button>

                        <div className="text-center text-sm text-slate-600">
                            Pas encore de compte ?{' '}
                            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                Créer un compte
                            </Link>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                        En créant un compte, vous acceptez les{' '}
                        <button className="text-emerald-600 hover:underline">Conditions générales</button>
                        {' '}et la{' '}
                        <button className="text-emerald-600 hover:underline">Politique de confidentialité</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
