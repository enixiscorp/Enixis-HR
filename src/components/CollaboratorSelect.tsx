import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useCollaborators } from '@/hooks/useCollaborators'

interface CollaboratorSelectProps {
    value: string
    onValueChange: (value: string) => void
}

export function CollaboratorSelect({ value, onValueChange }: CollaboratorSelectProps) {
    const { collaborators, loading } = useCollaborators()

    if (loading) {
        return <div className="text-sm text-slate-500">Chargement...</div>
    }

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Sélectionner un collaborateur" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="global">Vue Globale (Tous)</SelectItem>
                {collaborators.map((collaborator) => (
                    <SelectItem key={collaborator.id} value={collaborator.id}>
                        {collaborator.first_name} {collaborator.last_name} ({collaborator.role})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
