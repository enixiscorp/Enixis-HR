import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Save, Image as ImageIcon, CheckCircle2, Sun, Moon, Monitor } from 'lucide-react'

import { PaymentReporting } from './PaymentReporting'

export function PlatformSettings() {
    const { settings, updateLogo } = usePlatformSettings()
    const { theme, setTheme } = useTheme()
    const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '')
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSuccess(false)
        try {
            await updateLogo(logoUrl)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            alert('Erreur lors de la mise à jour du logo')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Building2 className="w-6 h-6 text-pink-600" />
                        Personnalisation
                    </CardTitle>
                    <CardDescription>
                        Personnalisez l'apparence de Enixis HR pour tous les utilisateurs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <Label htmlFor="logoUrl" className="text-lg font-semibold text-slate-900 dark:text-white">Logo de Enixis Corp</Label>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-slate-400" />
                                    )}
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="logoUrl" className="text-slate-700 dark:text-slate-300">URL du Logo (PNG/SVG recommandé)</Label>
                                        <Input
                                            id="logoUrl"
                                            placeholder="https://votre-stockage.com/logo.png"
                                            value={logoUrl}
                                            onChange={e => setLogoUrl(e.target.value)}
                                            className="bg-white/50 dark:bg-slate-800/50"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Conseil : Utilisez une URL directe vers votre logo. Il sera affiché dans l'entête et sur vos preuves de paiement PDF.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-pink-600 hover:bg-pink-700 text-white"
                                    >
                                        {saving ? 'Enregistrement...' : success ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Enregistré</> : <><Save className="w-4 h-4 mr-2" /> Enregistrer les modifications</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <PaymentReporting />

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Monitor className="w-6 h-6 text-purple-600" />
                        Préférences d'affichage
                    </CardTitle>
                    <CardDescription>
                        Choisissez le thème qui vous convient le mieux.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Thème de la plateforme</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 ${theme === 'light' ? 'bg-purple-600' : ''}`}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="w-6 h-6" />
                                <span>Clair</span>
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 ${theme === 'dark' ? 'bg-purple-600' : ''}`}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="w-6 h-6" />
                                <span>Sombre</span>
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 ${theme === 'system' ? 'bg-purple-600' : ''}`}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="w-6 h-6" />
                                <span>Système</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
