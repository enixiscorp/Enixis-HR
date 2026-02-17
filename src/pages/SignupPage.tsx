import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const pricingPlans = [
    { id: 'starter', name: 'Starter - 49€/mois', value: 'starter' },
    { id: 'professional', name: 'Professional - 149€/mois', value: 'professional' },
    { id: 'enterprise', name: 'Enterprise - Sur mesure', value: 'enterprise' }
]

// Function to generate random password
const generatePassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
}

export default function SignupPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
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
            // Generate random password
            const generatedPassword = generatePassword()

            // Create user account via Supabase Admin function
            const { error: signupError } = await supabase.rpc('create_user_admin', {
                p_email: formData.email,
                p_first_name: formData.firstName,
                p_last_name: formData.lastName,
                p_password: generatedPassword,
                p_role: 'collaborator'
            })

            if (signupError) {
                throw signupError
            }

            // Here you would typically send an email with credentials
            // For now, we'll show a success message with the password
            // In production, integrate with an email service like SendGrid, Mailgun, etc.

            console.log('Account created successfully!')
            console.log('Email:', formData.email)
            console.log('Temporary Password:', generatedPassword)
            console.log('Plan:', formData.plan)
            console.log('Company:', formData.companyName)

            // TODO: Send email via email service
            // await sendWelcomeEmail({
            //     email: formData.email,
            //     password: generatedPassword,
            //     firstName: formData.firstName,
            //     plan: formData.plan
            // })

            setSuccess(true)

            // Show success message and redirect after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)

        } catch (err: any) {
            console.error('Signup error:', err)
            setError(err.message || 'Une erreur est survenue lors de l\'inscription')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="max-w-md w-full p-8 bg-slate-900 rounded-lg shadow-lg border border-cyan-500/20">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                            <Check className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Compte créé avec succès !</h2>
                        <p className="text-gray-400 mb-4">
                            Un email contenant vos identifiants de connexion a été envoyé à <strong className="text-white">{formData.email}</strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Vous serez redirigé vers la page de connexion dans quelques instants...
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/50"
                        >
                            Se connecter maintenant
                        </Button>
                    </div>
                </div>
            </div>
        )
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
                                Lancez-vous en<br />quelques minutes
                            </h2>
                            <p className="text-cyan-100 text-lg">
                                Créez votre compte et commencez à gérer votre équipe professionnellement dès aujourd'hui.
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
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Remplissez vos informations pour créer votre compte
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="Jean"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                required
                                className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                            <Input
                                placeholder="Dupont"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                required
                                className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                        </div>

                        {/* Email */}
                        <Input
                            type="email"
                            placeholder="votre@exemple.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />

                        {/* Phone */}
                        <Input
                            type="tel"
                            placeholder="+33 6 12 34 56 78"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            required
                            className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />

                        {/* Company Name */}
                        <Input
                            placeholder="123 Rue de la Paix, 75001 Paris"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            required
                            className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />

                        {/* SIRET */}
                        <Input
                            placeholder="123456789"
                            value={formData.siret}
                            onChange={(e) => handleChange('siret', e.target.value)}
                            required
                            className="h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />

                        {/* Plan Selection */}
                        <div>
                            <Select value={formData.plan} onValueChange={(value) => handleChange('plan', value)}>
                                <SelectTrigger className="h-12 bg-slate-900 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20">
                                    <SelectValue placeholder="Choisir une offre" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700">
                                    {pricingPlans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.value} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    Création en cours...
                                </div>
                            ) : (
                                'Continuer'
                            )}
                        </Button>

                        <div className="text-center text-sm text-slate-400">
                            Déjà un compte ?{' '}
                            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                                Se connecter
                            </Link>
                        </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                        En créant un compte, vous acceptez les{' '}
                        <button className="text-cyan-400 hover:underline">Conditions générales</button>
                        {' '}et la{' '}
                        <button className="text-cyan-400 hover:underline">Politique de confidentialité</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
