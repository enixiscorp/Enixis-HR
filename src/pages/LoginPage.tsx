import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Sparkles, Eye, EyeOff, Check } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { signIn } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signIn(formData.email, formData.password)
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Erreur de connexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Cyan Gradient */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
                {/* Animated background circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-7 h-7 text-cyan-500" />
                        </div>
                        <h1 className="text-3xl font-black">HERIX</h1>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold mb-4">
                                Gérez votre équipe<br />en toute simplicité
                            </h2>
                            <p className="text-cyan-100 text-lg">
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

                <div className="text-sm text-cyan-100 relative z-10">
                    © {new Date().getFullYear()} HERIX - Tous droits réservés
                </div>
            </div>

            {/* Right Panel - Black/Dark Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Accédez à votre espace RH
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <Input
                                type="email"
                                placeholder="votre@email.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                                className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mot de passe"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                                className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <button type="button" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                                Mot de passe oublié ?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/50"
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

                        {/* Sign Up Link */}
                        <div className="text-center text-sm text-slate-400">
                            Pas encore de compte ?{' '}
                            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                                Créer un compte
                            </Link>
                        </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                        En vous connectant, vous acceptez les{' '}
                        <button className="text-cyan-400 hover:underline">Conditions générales</button>
                        {' '}et la{' '}
                        <button className="text-cyan-400 hover:underline">Politique de confidentialité</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
