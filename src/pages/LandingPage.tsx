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
        price: '25€',
        period: ' / mois (15.000 XOF)',
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
        price: '40€',
        period: ' / 3 mois (25.000 XOF)',
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-cyan-500/20">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                            HERIX
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-300">
                            <Globe className="w-3 h-3 mr-1" />
                            Powered by Enixis
                        </Badge>
                        <Link to="/login">
                            <Button variant="outline" className="border-cyan-400 text-cyan-300 hover:bg-cyan-500/20">
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-sm text-cyan-300 font-medium">Nouvelle génération de gestion RH</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                            Gérez votre équipe{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                en toute simplicité
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Plateforme complète de gestion RH : personnel, équipes, paiements, chat interne, évolution de carrière et suivi des revenus.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-cyan-500/50">
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 text-lg px-8 py-6 h-auto">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-cyan-500/20 bg-gray-800/50 backdrop-blur hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                                <CardContent className="p-6">
                                    <feature.icon className="w-10 h-10 text-cyan-400 mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-400">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4 bg-black/40">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl font-black text-white">Tarifs transparents</h2>
                        <p className="text-gray-400">Choisissez l'offre adaptée à la taille de votre équipe</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "border-2 transition-all",
                                    plan.highlighted
                                        ? "border-cyan-500 bg-gray-800/80 backdrop-blur shadow-xl shadow-cyan-500/20 scale-105"
                                        : "border-cyan-500/20 bg-gray-800/50 backdrop-blur hover:border-cyan-500/40 hover:shadow-lg"
                                )}
                            >
                                <CardContent className="p-8">
                                    {plan.highlighted && (
                                        <Badge className="mb-4 bg-cyan-500 text-white">Le plus populaire</Badge>
                                    )}
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-white">{plan.price}</span>
                                        <span className="text-gray-400">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                                <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/signup">
                                        <Button
                                            className={cn(
                                                "w-full",
                                                plan.highlighted
                                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/50"
                                                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
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
            <footer className="py-8 border-t border-cyan-500/20 bg-black">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} HERIX - Tous droits réservés
                </div>
            </footer>
        </div>
    )
}
