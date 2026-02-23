import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    isAdmin: boolean
    isSuperAdmin: boolean
    isApproved: boolean
    isSubscriptionActive: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string, userEmail?: string) => {
        try {
            console.log('Auth: Fetching profile for ID:', userId);

            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            // If profile not found and it's the master email, try to create it
            if (error && (error as any).code === 'PGRST116' && userEmail === 'contacteccorp@gmail.com') {
                console.log('Auth: Master email detected with missing profile. Creating super_admin profile...');
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .upsert([
                        {
                            id: userId,
                            email: userEmail,
                            first_name: 'Admin',
                            last_name: 'Principal',
                            role: 'super_admin',
                            status: 'active'
                        }
                    ])
                    .select()
                    .single()

                if (!createError) {
                    data = newProfile
                    error = null
                    console.log('Auth: Super Admin profile created successfully')
                } else {
                    console.error('Auth: Failed to create Super Admin profile:', createError)
                }
            }

            if (error) {
                console.error('Auth: Profile fetch error:', error);
                throw error
            }

            console.log('Auth: Profile loaded successfully:', data?.role);
            setProfile(data)
        } catch (error) {
            console.error('Auth: fetchProfile failed:', error)
            setProfile(null)
        }
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id, user.email)
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signOut = async () => {
        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_logout_at: new Date().toISOString() })
                    .eq('id', user.id)
            } catch (err) {
                console.error('Error updating logout timestamp:', err)
            }
        }
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || user?.email === 'contacteccorp@gmail.com'
    const isSuperAdmin = profile?.role === 'super_admin' || user?.email === 'contacteccorp@gmail.com'

    // Check if user is approved and subscription is active
    const isApproved = profile?.is_approved === true || isSuperAdmin
    const isSubscriptionActive = isSuperAdmin || (
        profile?.subscription_end ? new Date(profile.subscription_end) > new Date() : false
    )

    const value = {
        user,
        profile,
        session,
        loading,
        signIn,
        signOut,
        refreshProfile,
        isAdmin,
        isSuperAdmin,
        isApproved,
        isSubscriptionActive,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
