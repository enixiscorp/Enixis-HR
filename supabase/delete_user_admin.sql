-- ENIXIS HR - User Deletion Logic with Protection
-- This script adds a secure user deletion function that protects Super Admins.

CREATE OR REPLACE FUNCTION public.delete_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_caller_role user_role;
    v_target_role user_role;
BEGIN
    -- 1. Get the role of the person calling the function
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- 2. Get the role of the person to be deleted
    SELECT role INTO v_target_role FROM public.profiles WHERE id = p_user_id;

    -- 3. Safety checks
    
    -- Check if target exists
    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Utilisateur introuvable.';
    END IF;

    -- PROTECTION: Super Admin cannot be deleted
    IF v_target_role = 'super_admin' THEN
        RAISE EXCEPTION 'Le Super Administrateur ne peut pas être supprimé.';
    END IF;

    -- PROTECTION: Only Super Admin can delete Admins
    IF v_target_role = 'admin' AND v_caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Seul un Super Administrateur peut supprimer un Administrateur.';
    END IF;

    -- GENERAL PROTECTION: Only Admins or Super Admins can delete anyone
    IF v_caller_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Accès refusé : Droits insuffisants pour supprimer un utilisateur.';
    END IF;

    -- 4. Perform deletion
    -- Deleting from auth.users will cascade to public.profiles due to the FK constraint
    DELETE FROM auth.users WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_admin(UUID) TO service_role;
