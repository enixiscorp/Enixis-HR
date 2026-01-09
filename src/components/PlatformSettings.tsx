import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { Building2, Save, Image as ImageIcon, CheckCircle2 } from 'lucide-react'

export function PlatformSettings() {
    const { settings, updateLogo } = usePlatformSettings()
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
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-pink-600" />
                    Paramètres de la Plateforme
                </CardTitle>
                <CardDescription>
                    Personnalisez l'apparence de Enixis HR pour tous les utilisateurs.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <Label htmlFor="logoUrl" className="text-lg font-semibold">Logo de Enixis Corp</Label>
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
                                    <Label htmlFor="logoUrl">URL du Logo (PNG/SVG recommandé)</Label>
                                    <Input
                                        id="logoUrl"
                                        placeholder="https://votre-stockage.com/logo.png"
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        className="bg-white/10"
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
    )
}
