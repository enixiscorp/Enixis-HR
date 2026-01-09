import { useState } from 'react'
import { useCollaborators } from '@/hooks/useCollaborators'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from './ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select'
import { Label } from './ui/label'
import { Users, UserPlus, Shield, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function UserManagement() {
    const { collaborators, loading, refresh } = useCollaborators()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'collaborator' as 'collaborator' | 'admin' | 'super_admin'
    })

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // NOTE: Client-side creation without Edge Functions is limited.
            // We'll use the 'invite' approach or inform the user.
            // For now, we'll try to create a profile entry, 
            // but the user MUST still exist in Auth.

            // In a real app, you'd call a Supabase Edge Function here.
            // For this project, we'll suggest creating in Auth first.

            alert("Accès Administrateur : Veuillez vous assurer que l'utilisateur est déjà créé dans l'onglet 'Authentication' de Supabase avec cet email. Ce formulaire va maintenant configurer son profil Enixis HR.")

            const { data: authUser } = await supabase.from('profiles').select('id').eq('id', formData.email).single(); // This is just a placeholder logic

            // Since we can't create Auth users from client easily (requires service key)
            // We will just inform and then insert into profiles if they know the UID
            // Or better: we'll follow the flow that profiles are updated when they first log in,
            // but admins can PRE-CREATE profiles.

            const { error } = await supabase.from('profiles').insert({
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: formData.role,
                status: 'active'
            })

            if (error) throw error

            setIsCreateDialogOpen(false)
            refresh()
        } catch (err) {
            console.error('Error creating user profile:', err)
            alert('Erreur lors de la configuration du profil. L\'utilisateur doit exister dans Supabase Auth.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-600" />
                        Gestion des Utilisateurs
                    </CardTitle>
                    <CardDescription>
                        Consultez et gérez les comptes des collaborateurs et administrateurs.
                    </CardDescription>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Nouveau Compte
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Créer un nouveau compte</DialogTitle>
                            <DialogDescription>
                                Configurez le profil d'un nouveau membre. L'utilisateur doit être préalablement créé dans Supabase Auth.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rôle</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="collaborator">Collaborateur</SelectItem>
                                        <SelectItem value="admin">Administrateur</SelectItem>
                                        <SelectItem value="super_admin">Super Administrateur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Création...' : 'Créer le profil'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Chargement des utilisateurs...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Nom</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Rôle</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Statut</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collaborators.map(user => (
                                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {user.first_name} {user.last_name}
                                            </div>
                                            <div className="text-xs text-slate-500">ID: {user.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1">
                                                {user.role === 'super_admin' ? (
                                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                                ) : user.role === 'admin' ? (
                                                    <Shield className="w-4 h-4 text-purple-500" />
                                                ) : (
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                )}
                                                <span className="capitalize text-sm">{user.role.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                                {user.status === 'active' ? 'Actif' : user.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button variant="ghost" size="sm">Éditer</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
