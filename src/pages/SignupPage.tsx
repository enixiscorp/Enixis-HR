import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const pricingPlans = [
    { id: 'starter', name: 'Starter - 49€/mois', value: 'starter' },
    { id: 'professional', name: 'Professional - 149€/mois', value: 'professional' },
    { id: 'enterprise', name: 'Enterprise - Sur mesure', value: 'enterprise' }
]

export default function SignupPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        address: '',
        siret: '',
        plan: 'professional'
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Signup using Supabase Auth
            const { error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        company_name: formData.companyName,
                        plan: formData.plan,
                        role: 'collaborator' // Every individual signup starts as collaborator/owner of their space
                    }
                }
            })

            if (signupError) throw signupError

            setSuccess(true)
        } catch (err: any) {
            console.error('Signup error:', err)
            setError(err.message || 'Une erreur est survenue lors de l\'inscription')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                <div className="max-w-md w-full p-8 bg-slate-900 rounded-2xl shadow-2xl border border-cyan-500/20">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 animate-pulse">
                            <Check className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">Inscription réussie !</h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Un email d'activation a été envoyé à <strong className="text-white">{formData.email}</strong>.
                            Vérifiez votre boîte de réception pour confirmer votre compte.
                        </p>

                        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-8">
                            <p className="text-sm text-cyan-400 font-medium leading-relaxed">
                                ⚠️ Important : Votre accès au tableau de bord HERIX sera activé par un administrateur après validation de votre souscription.
                            </p>
                        </div>

                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold text-lg shadow-lg shadow-cyan-500/30"
                        >
                            Retour à la connexion
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex bg-slate-950 font-sans">
            {/* Left Panel - Cyan Gradient (Hidden on small screens) */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <Sparkles className="w-8 h-8 text-cyan-200" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter">HERIX</h1>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <h2 className="text-5xl font-black mb-6 leading-tight">
                                Rejoignez le futur <br />de la gestion RH
                            </h2>
                            <p className="text-cyan-100 text-xl font-medium opacity-80 leading-relaxed">
                                Une solution premium pour des équipes d'exception. <br />
                                Gérez plannings, paiements et absences en un clic.
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {[
                                "Activation en moins de 48h",
                                "Conforme aux normes européennes",
                                "Support premium 24/7",
                                "Zéro frais cachés"
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
                                        <Check className="w-5 h-5 text-cyan-200" />
                                    </div>
                                    <span className="text-lg font-medium opacity-90">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-sm font-medium text-cyan-100/60 relative z-10 flex items-center gap-4">
                    <span>© {new Date().getFullYear()} HERIX Corp.</span>
                    <span className="w-1 h-1 bg-cyan-100/40 rounded-full" />
                    <span>Lomé, Togo</span>
                </div>
            </div>

            {/* Right Panel - Modern Signup Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-lg py-12">
                    <div className="mb-12 text-center lg:text-left">
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                            Commencez votre expérience
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Créez votre compte administrateur en quelques secondes.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-shake">
                                <p className="text-sm text-red-400 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Prénom</label>
                                <Input
                                    placeholder="Jean"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    required
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Nom</label>
                                <Input
                                    placeholder="Dupont"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    required
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 ml-1">Adresse Email Professionnelle</label>
                            <Input
                                type="email"
                                placeholder="votre@entreprise.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                                className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-slate-400 ml-1">Mot de passe</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 8 caractères"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Company Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Entreprise</label>
                                <Input
                                    placeholder="Nom de la société"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    required
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Téléphone</label>
                                <Input
                                    type="tel"
                                    placeholder="+228 XX XX XX XX"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    required
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/10 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 ml-1">Plan de souscription</label>
                            <Select value={formData.plan} onValueChange={(value) => handleChange('plan', value)}>
                                <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800 text-white focus:border-cyan-500/50 rounded-xl">
                                    <SelectValue placeholder="Choisir une offre" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {pricingPlans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.value} className="text-white hover:bg-slate-800 focus:bg-cyan-500/20">
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:scale-[1.02] transition-all duration-300 text-white font-black text-lg shadow-2xl shadow-cyan-500/30 rounded-2xl"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Initialisation...
                                    </div>
                                ) : (
                                    'Démarrer l\'aventure'
                                )}
                            </Button>
                        </div>

                        <div className="text-center text-slate-400 font-medium">
                            Déjà membre ?{' '}
                            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-black transition-colors underline-offset-4 hover:underline">
                                Connectez-vous
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
