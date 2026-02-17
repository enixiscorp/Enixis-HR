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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-emerald-600">
                            HERIX
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                            <Globe className="w-3 h-3 mr-1" />
                            Powered by Enixis
                        </Badge>
                        <Link to="/login">
                            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm text-emerald-800 font-medium">Nouvelle génération de gestion RH</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
                            Gérez votre équipe{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                en toute simplicité
                            </span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Plateforme complète de gestion RH : personnel, équipes, paiements, chat interne, évolution de carrière et suivi des revenus.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-emerald-200">
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 h-auto">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-emerald-100 bg-white hover:shadow-lg hover:shadow-emerald-100 transition-all">
                                <CardContent className="p-6">
                                    <feature.icon className="w-10 h-10 text-emerald-600 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-600">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl font-black text-slate-900">Tarifs transparents</h2>
                        <p className="text-slate-600">Choisissez l'offre adaptée à la taille de votre équipe</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "border-2 transition-all",
                                    plan.highlighted
                                        ? "border-emerald-500 bg-white shadow-xl shadow-emerald-200 scale-105"
                                        : "border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-lg"
                                )}
                            >
                                <CardContent className="p-8">
                                    {plan.highlighted && (
                                        <Badge className="mb-4 bg-emerald-500 text-white">Le plus populaire</Badge>
                                    )}
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
                                    <div className="mb-6">
                                        <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                        <span className="text-slate-600">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/signup">
                                        <Button
                                            className={cn(
                                                "w-full",
                                                plan.highlighted
                                                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                                                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
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
            <footer className="py-8 border-t border-emerald-100 bg-white">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} HERIX - Tous droits réservés
                </div>
            </footer>
        </div>
    )
}
