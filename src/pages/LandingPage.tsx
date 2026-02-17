import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Sparkles,
    Check,
    Users,
    DollarSign,
    Calendar,
    BarChart3,
    Shield,
    Zap,
    Globe,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
                        <Link to="/login">
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                Se connecter
                            </Button>
                        </Link>
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

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 h-auto">
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 h-auto">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
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
                                    "border-2 transition-all",
                                    plan.highlighted
                                        ? "border-purple-500 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl scale-105"
                                        : "border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20"
                                )}
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
                                    <Link to="/signup">
                                        <Button
                                            className={cn(
                                                "w-full",
                                                plan.highlighted
                                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                    : "bg-white/10 hover:bg-white/20 text-white"
                                            )}
                                        >
                                            Commencer
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
