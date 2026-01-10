import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import {
    Plus,
    Search,
    Loader2,
    Edit2,
    Trash2,
    Package,
    DollarSign
} from 'lucide-react'
import { usePrestations, Prestation } from '@/hooks/usePrestations'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useToast } from '@/contexts/ToastContext'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from './ui/dialog'

export function PrestationManagement() {
    const {
        prestations,
        loading,
        addPrestation,
        updatePrestation,
        deletePrestation
    } = usePrestations()
    const { formatCurrency } = useCurrency()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [isActive, setIsActive] = useState(true)

    const handleAddClick = () => {
        setName('')
        setPrice('')
        setIsActive(true)
        setIsAdding(true)
    }

    const handleEditClick = (p: Prestation) => {
        setSelectedPrestation(p)
        setName(p.name)
        setPrice(p.price.toString())
        setIsActive(p.is_active)
        setIsEditing(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            let result
            if (isAdding) {
                result = await addPrestation(name, Number(price), isActive)
            } else if (selectedPrestation) {
                result = await updatePrestation(selectedPrestation.id, {
                    name,
                    price: Number(price),
                    is_active: isActive
                })
            }

            if (result?.success) {
                toast(isAdding ? 'Service ajouté.' : 'Service mis à jour.', 'success')
                setIsAdding(false)
                setIsEditing(false)
            } else {
                toast(result?.error || 'Une erreur est survenue.', 'error')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return

        const result = await deletePrestation(id)
        if (result.success) {
            toast('Service supprimé.', 'success')
        } else {
            toast(result.error || 'Erreur lors de la suppression.', 'error')
        }
    }

    const filteredPrestations = prestations.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des Services</h2>
                    <p className="text-slate-600 dark:text-slate-400">Gérez les prestations et produits proposés par Enixis Corp.</p>
                </div>
                <Button
                    onClick={handleAddClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4" /> Nouveau Service
                </Button>
            </div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Liste des Prestations</CardTitle>
                            <CardDescription>Configurez les tarifs et la disponibilité des services.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher un service..."
                                className="pl-9 bg-white/50 dark:bg-slate-800/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                            <p className="text-slate-500 font-medium">Chargement des services...</p>
                        </div>
                    ) : filteredPrestations.length === 0 ? (
                        <div className="py-20 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Aucun service trouvé.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPrestations.map(p => (
                                <div
                                    key={p.id}
                                    className={`p-4 rounded-2xl border transition-all ${p.is_active
                                        ? "bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800"
                                        : "bg-slate-50/50 dark:bg-slate-900/10 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate" title={p.name}>
                                                {p.name}
                                            </h3>
                                            <p className="text-lg font-bold text-purple-600 mt-1">
                                                {formatCurrency(p.price)}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.is_active
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            }`}>
                                            {p.is_active ? 'Actif' : 'Inactif'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                            onClick={() => handleEditClick(p)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={isAdding || isEditing} onOpenChange={(val) => {
                if (!val) {
                    setIsAdding(false)
                    setIsEditing(false)
                }
            }}>
                <DialogContent className="sm:max-w-[425px] border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {isAdding ? <><Plus className="w-5 h-5 text-purple-600" /> Ajouter un Service</> : <><Edit2 className="w-5 h-5 text-purple-600" /> Modifier le Service</>}
                        </DialogTitle>
                        <DialogDescription>
                            Entrez les détails du service ou produit.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Nom du Service</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Création de Site Web"
                                    required
                                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Prix (CFA)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">État du Service</Label>
                                    <p className="text-[10px] text-slate-500">Rendre ce service disponible pour les paiements.</p>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setIsEditing(false); }} className="flex-1">
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/20 transition-all font-bold"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAdding ? 'Créer le Service' : 'Mettre à jour')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
