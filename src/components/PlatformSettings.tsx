import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useTheme } from '@/contexts/ThemeContext'
import { Building2, Save, Image as ImageIcon, CheckCircle2, Sun, Moon, Monitor } from 'lucide-react'


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
            <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-black flex items-center gap-2 text-white">
                        <Building2 className="w-6 h-6 text-cyan-400" />
                        Personnalisation
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Personnalisez l'apparence de Enixis HR pour tous les utilisateurs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <Label htmlFor="logoUrl" className="text-lg font-black text-white">Logo de Enixis Corp</Label>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-32 h-32 rounded-xl bg-black/20 border-2 border-dashed border-cyan-500/20 flex items-center justify-center overflow-hidden">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-gray-600" />
                                    )}
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="logoUrl" className="text-gray-400">URL du Logo (PNG/SVG recommandé)</Label>
                                        <Input
                                            id="logoUrl"
                                            placeholder="https://votre-stockage.com/logo.png"
                                            value={logoUrl}
                                            onChange={e => setLogoUrl(e.target.value)}
                                            className="bg-black/20 border-cyan-500/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50"
                                        />
                                        <p className="text-xs text-gray-500 italic">
                                            Conseil : Utilisez une URL directe vers votre logo. Il sera affiché dans l'entête et sur vos preuves de paiement PDF.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                                    >
                                        {saving ? 'Enregistrement...' : success ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Enregistré</> : <><Save className="w-4 h-4 mr-2" /> Enregistrer les modifications</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>


            <Card className="border-cyan-500/20 bg-gray-800/50 backdrop-blur shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-black flex items-center gap-2 text-white">
                        <Monitor className="w-6 h-6 text-cyan-400" />
                        Préférences d'affichage
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Choisissez le thème qui vous convient le mieux.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-400">Thème de la plateforme</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 transition-all ${theme === 'light' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0' : 'bg-black/20 border-cyan-500/10 text-gray-400 hover:text-white'}`}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="w-6 h-6" />
                                <span className="text-xs font-black">Clair</span>
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0' : 'bg-black/20 border-cyan-500/10 text-gray-400 hover:text-white'}`}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="w-6 h-6" />
                                <span className="text-xs font-black">Sombre</span>
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                className={`flex flex-col gap-2 h-20 transition-all ${theme === 'system' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0' : 'bg-black/20 border-cyan-500/10 text-gray-400 hover:text-white'}`}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="w-6 h-6" />
                                <span className="text-xs font-black">Système</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
