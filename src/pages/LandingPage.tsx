import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Sparkles,
    Check,
    Users,
    DollarSign,
    Calendar,
    BarChart3,
    Shield,
    Zap,
    Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'signup'
type PricingTier = 'starter' | 'professional' | 'enterprise'

const pricingPlans = [
    {
        id: 'starter' as PricingTier,
        name: 'Starter',
        price: '49€',
        period: '/mois',
        description: 'Parfait pour les petites équipes',
        features: [
            'Jusqu\'à 10 collaborateurs',
            'Gestion des paiements',
            'Plannings de base',
            'Support email',
            'Rapports mensuels'
        ],
        highlighted: false
    },
    {
        id: 'professional' as PricingTier,
        name: 'Professional',
        price: '149€',
        period: '/mois',
        description: 'Pour les équipes en croissance',
        features: [
            'Jusqu\'à 50 collaborateurs',
            'Toutes les fonctionnalités Starter',
            'Plannings avancés',
            'Analytics détaillés',
            'Support prioritaire',
            'API Access',
            'Exports illimités'
        ],
        highlighted: true
    },
    {
        id: 'enterprise' as PricingTier,
        name: 'Enterprise',
        price: 'Sur mesure',
        period: '',
        description: 'Solution personnalisée',
        features: [
            'Collaborateurs illimités',
            'Toutes les fonctionnalités Pro',
            'Support dédié 24/7',
            'Onboarding personnalisé',
            'SLA garanti',
            'Infrastructure dédiée',
            'Audit de sécurité'
        ],
        highlighted: false
    }
]

const features = [
    {
        icon: Users,
        title: 'Gestion RH Simplifiée',
        description: 'Gérez vos collaborateurs, leurs profils et leurs statuts en quelques clics'
    },
    {
        icon: DollarSign,
        title: 'Paiements Automatisés',
        description: 'Suivez et gérez les paiements avec exports PDF et Excel automatiques'
    },
    {
        icon: Calendar,
        title: 'Planification Intelligente',
        description: 'Créez et modifiez les plannings d\'équipe avec gestion des pauses'
    },
    {
        icon: BarChart3,
        title: 'Analytics en Temps Réel',
        description: 'Tableaux de bord et statistiques pour piloter votre activité'
    },
    {
        icon: Shield,
        title: 'Sécurité Avancée',
        description: 'Authentification sécurisée et contrôle d\'accès par rôles'
    },
    {
        icon: Zap,
        title: 'Interface Moderne',
        description: 'Expérience utilisateur fluide et intuitive sur tous les appareils'
    }
]

export default function LandingPage() {
    const [authMode, setAuthMode] = useState<AuthMode>('login')
    const [selectedPlan, setSelectedPlan] = useState<PricingTier>('professional')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [companyName, setCompanyName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (authMode === 'login') {
                const { error } = await signIn(email, password)
                if (error) {
                    setError(error.message === 'Invalid login credentials'
                        ? 'Identifiants incorrects'
                        : error.message)
                } else {
                    navigate('/dashboard')
                }
            } else {
                // For signup, we'll just show a message for now
                setError('L\'inscription est réservée aux administrateurs. Contactez votre responsable.')
            }
        } catch (err) {
            setError('Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            HERIX
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60">
                            <Globe className="w-3 h-3 mr-1" />
                            Powered by Enixis
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-6 mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-sm text-white/60">Nouvelle génération de gestion RH</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                            Simplifiez votre{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                gestion RH
                            </span>
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Une plateforme tout-en-un pour gérer vos équipes, plannings, paiements et performances avec efficacité et modernité.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all">
                                <CardContent className="p-6">
                                    <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-white/60">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4 bg-black/20">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl font-black text-white">Tarifs transparents</h2>
                        <p className="text-white/60">Choisissez l'offre adaptée à la taille de votre équipe</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "border-2 transition-all cursor-pointer hover:scale-105",
                                    plan.highlighted
                                        ? "border-purple-500 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl scale-105"
                                        : "border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20"
                                )}
                                onClick={() => {
                                    setSelectedPlan(plan.id)
                                    setAuthMode('signup')
                                }}
                            >
                                <CardContent className="p-8">
                                    {plan.highlighted && (
                                        <Badge className="mb-4 bg-purple-500 text-white">Le plus populaire</Badge>
                                    )}
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-white/60 text-sm mb-6">{plan.description}</p>
                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-white">{plan.price}</span>
                                        <span className="text-white/60">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                                                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={cn(
                                            "w-full",
                                            plan.highlighted
                                                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                : "bg-white/10 hover:bg-white/20 text-white"
                                        )}
                                        onClick={() => {
                                            setSelectedPlan(plan.id)
                                            setAuthMode('signup')
                                        }}
                                    >
                                        Commencer
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Auth Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-md">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-2xl">
                        <CardContent className="p-8">
                            {/* Auth Tabs */}
                            <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg font-medium transition-all",
                                        authMode === 'login'
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                            : "text-white/60 hover:text-white"
                                    )}
                                >
                                    Connexion
                                </button>
                                <button
                                    onClick={() => setAuthMode('signup')}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg font-medium transition-all",
                                        authMode === 'signup'
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                            : "text-white/60 hover:text-white"
                                    )}
                                >
                                    Créer un compte
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <p className="text-sm text-red-200 text-center">{error}</p>
                                    </div>
                                )}

                                {authMode === 'signup' && (
                                    <>
                                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                            <p className="text-sm text-purple-200 text-center">
                                                Offre sélectionnée : <span className="font-bold">
                                                    {pricingPlans.find(p => p.id === selectedPlan)?.name}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label htmlFor="company" className="text-sm font-medium text-white/80 flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4" />
                                                Nom de l'entreprise
                                            </label>
                                            <Input
                                                id="company"
                                                type="text"
                                                placeholder="Votre entreprise"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                                                required={authMode === 'signup'}
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-white/80 flex items-center gap-2 mb-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nom@entreprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="text-sm font-medium text-white/80 flex items-center gap-2 mb-2">
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
                                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 pr-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {authMode === 'login' ? 'Connexion...' : 'Création...'}
                                        </div>
                                    ) : authMode === 'login' ? (
                                        'Se connecter'
                                    ) : (
                                        'Créer mon compte'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-white/10">
                <div className="container mx-auto px-4 text-center text-white/40 text-sm">
                    © {new Date().getFullYear()} HERIX - Tous droits réservés
                </div>
            </footer>
        </div>
    )
}
