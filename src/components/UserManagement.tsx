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
import { Users, UserPlus, Shield, ShieldAlert, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent } from './ui/tabs'
import { supabase } from '@/lib/supabase'
import { UserRole, UserStatus, Profile } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export function UserManagement() {
    const { profile: currentAdmin } = useAuth()
    const { collaborators, loading, refresh } = useCollaborators()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

    // Form state for creation
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'collaborator' as UserRole
    })

    // Form state for editing
    const [editData, setEditData] = useState({
        role: 'collaborator' as UserRole,
        status: 'active' as UserStatus
    })

    const { toast } = useToast()
    const isSuperAdmin = currentAdmin?.role === 'super_admin'

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const { error } = await supabase.rpc('create_user_admin', {
                p_email: formData.email,
                p_password: formData.password,
                p_first_name: formData.firstName,
                p_last_name: formData.lastName,
                p_role: formData.role
            })

            if (error) throw error

            setIsCreateDialogOpen(false)
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'collaborator' })
            refresh()
            toast('Compte et profil créés avec succès !', 'success')
        } catch (err: any) {
            console.error('Error creating user:', err)
            toast(err.message || 'Erreur lors de la création du compte.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditUser = (user: Profile) => {
        setSelectedUser(user)
        setEditData({
            role: user.role,
            status: user.status
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) return
        setSubmitting(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editData.role,
                    status: editData.status
                })
                .eq('id', selectedUser.id)

            if (error) throw error

            setIsEditDialogOpen(false)
            refresh()
            toast('Profil mis à jour avec succès !', 'success')
        } catch (err: any) {
            console.error('Error updating user:', err)
            toast(err.message || 'Erreur lors de la mise à jour.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteUser = async (user: Profile) => {
        if (user.role === 'super_admin') {
            toast('Impossible de supprimer un Super Administrateur.', 'warning')
            return
        }

        if (user.role === 'admin' && !isSuperAdmin) {
            toast('Seul un Super Administrateur peut supprimer un compte Administrateur.', 'warning')
            return
        }

        const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.first_name} ${user.last_name} ? Cette action est irréversible.`)
        if (!confirmed) return

        setSubmitting(true)
        try {
            const { error } = await supabase.rpc('delete_user_admin', {
                p_user_id: user.id
            })

            if (error) throw error

            refresh()
            toast('Utilisateur supprimé avec succès.', 'success')
        } catch (err: any) {
            console.error('Error deleting user:', err)
            toast(err.message || 'Erreur lors de la suppression.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="list" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    {/* Super Admin Notice */}
                    {isSuperAdmin && (
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-purple-800 shadow-sm animate-in fade-in slide-in-from-top-4">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <p className="text-xs font-medium">
                                Mode Super Admin : Vous avez le contrôle total sur les Administrateurs et Collaborateurs.
                            </p>
                        </div>
                    )}
                </div>

                <TabsContent value="list" className="mt-0">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Users className="w-6 h-6 text-purple-600" />
                                    Gestion des Utilisateurs
                                </CardTitle>
                                <CardDescription>
                                    Consultez et gérez les comptes des collaborateurs et administrateurs.
                                </CardDescription>
                            </div>

                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Nouveau Compte
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-white/10">
                                    <DialogHeader>
                                        <DialogTitle>Créer un nouveau compte</DialogTitle>
                                        <DialogDescription>
                                            Configurez les accès d'un nouveau membre.
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
                                                    className="bg-white/50 dark:bg-slate-800"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Nom</Label>
                                                <Input
                                                    id="lastName"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                    required
                                                    className="bg-white/50 dark:bg-slate-800"
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
                                                className="bg-white/50 dark:bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Mot de passe provisoire</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                className="bg-white/50 dark:bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Rôle</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                                            >
                                                <SelectTrigger className="bg-white/50 dark:bg-slate-800">
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
                                            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                                                {submitting ? 'Création...' : 'Créer le compte'}
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
                                <>
                                    {/* Mobile View: Cards */}
                                    <div className="grid grid-cols-1 gap-4 md:hidden">
                                        {collaborators.map(user => (
                                            <div key={user.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">{user.id.substring(0, 8)}...</div>
                                                    </div>
                                                    <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                                        {user.status === 'active' ? 'Actif' : user.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        {user.role === 'super_admin' ? (
                                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                                        ) : user.role === 'admin' ? (
                                                            <Shield className="w-4 h-4 text-purple-500" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-blue-500" />
                                                        )}
                                                        <span className="capitalize text-xs text-slate-700 dark:text-slate-300">
                                                            {user.role === 'collaborator' ? 'Collaborateur' :
                                                                user.role === 'admin' ? 'Administrateur' : 'Super Admin'}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="h-8 px-2">
                                                            <Edit2 className="w-3 h-3 mr-1" />
                                                            Éditer
                                                        </Button>
                                                        {user.role !== 'super_admin' && (isSuperAdmin || user.role === 'collaborator') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50/10"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden md:block overflow-x-auto">
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
                                                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {user.first_name} {user.last_name}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{user.id.substring(0, 8)}...</div>
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
                                                                <span className="capitalize text-sm text-slate-700 dark:text-slate-300">
                                                                    {user.role === 'collaborator' ? 'Collaborateur' :
                                                                        user.role === 'admin' ? 'Administrateur' : 'Super Admin'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                                                {user.status === 'active' ? 'Actif' : user.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                                                    <Edit2 className="w-4 h-4 mr-1 text-slate-600" />
                                                                    Éditer
                                                                </Button>
                                                                {user.role !== 'super_admin' && (isSuperAdmin || user.role === 'collaborator') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteUser(user)}
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-white/10">
                            <DialogHeader>
                                <DialogTitle>Modifier le profil</DialogTitle>
                                <DialogDescription>
                                    Modifiez le rôle ou le statut de {selectedUser?.first_name} {selectedUser?.last_name}.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Rôle</Label>
                                    {selectedUser?.role === 'super_admin' && !isSuperAdmin ? (
                                        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2 text-orange-800">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs">Profil Super Admin protégé.</span>
                                        </div>
                                    ) : (
                                        <Select
                                            value={editData.role}
                                            onValueChange={(val: any) => setEditData({ ...editData, role: val })}
                                        >
                                            <SelectTrigger className="bg-white/50 dark:bg-slate-800">
                                                <SelectValue placeholder="Choisir un rôle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="collaborator">Collaborateur</SelectItem>
                                                <SelectItem value="admin">Administrateur</SelectItem>
                                                <SelectItem value="super_admin">Super Administrateur</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status">Statut</Label>
                                    <Select
                                        value={editData.status}
                                        onValueChange={(val: any) => setEditData({ ...editData, status: val })}
                                    >
                                        <SelectTrigger className="bg-white/50 dark:bg-slate-800">
                                            <SelectValue placeholder="Choisir un statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Actif</SelectItem>
                                            <SelectItem value="on_leave">En Congé</SelectItem>
                                            <SelectItem value="suspended">Suspendu</SelectItem>
                                            <SelectItem value="terminated">Contrat Terminé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                        {submitting ? 'Mise à jour...' : 'Enregistrer les modifications'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    )
}
