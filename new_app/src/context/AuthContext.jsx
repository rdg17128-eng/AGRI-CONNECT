import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);

    // Process authenticated Supabase user
    const processSupabaseUser = async (sbUser) => {
        if (!sbUser) {
            setUser(null);
            setRole(null);
            setNeedsRoleSelection(false);
            setGoogleUser(null);
            return;
        }

        // 1. Check if user clicked a specific portal before OAuth
        // If the user picked a specific portal (e.g. Farmer, Mill, Transporter),
        // immediately prioritize that portal without asking for role selection!
        const intendedRole = localStorage.getItem('kisan_intended_role');
        let userRole = null;
        let profileData = null;

        if (intendedRole) {
            userRole = intendedRole;
            localStorage.removeItem('kisan_intended_role');
            try {
                await supabase.auth.updateUser({ data: { role: intendedRole } });
            } catch (uErr) {
                console.warn("Error updating user role metadata:", uErr);
            }
        } else {
            // 2. Check if role is stored in Supabase Auth user_metadata
            userRole = sbUser.user_metadata?.role || null;
        }

        // 3. Look up existing profile in the role table
        const targetTable = userRole === 'transporters' ? 'transport_providers' : (userRole || 'farmers');
        if (userRole && sbUser.email) {
            try {
                const { data } = await supabase.from(targetTable).select('*').eq('email', sbUser.email).maybeSingle();
                if (data) {
                    profileData = data;
                }
            } catch (tErr) {
                console.warn(`Profile lookup in ${targetTable}:`, tErr);
            }
        }

        // 4. If no role was pre-selected or in metadata, check all tables by email
        if (!userRole && sbUser.email) {
            try {
                const { data: farmer } = await supabase.from('farmers').select('*').eq('email', sbUser.email).maybeSingle();
                if (farmer) {
                    userRole = 'farmers';
                    profileData = farmer;
                }
            } catch (err) {
                console.warn("Farmers table lookup:", err);
            }

            if (!userRole) {
                try {
                    const { data: buyer } = await supabase.from('buyers').select('*').eq('email', sbUser.email).maybeSingle();
                    if (buyer) {
                        userRole = 'buyers';
                        profileData = buyer;
                    }
                } catch (err) {
                    console.warn("Buyers table lookup:", err);
                }
            }

            if (!userRole) {
                try {
                    const { data: trans } = await supabase.from('transport_providers').select('*').eq('email', sbUser.email).maybeSingle();
                    if (trans) {
                        userRole = 'transporters';
                        profileData = trans;
                    }
                } catch (err) {
                    console.warn("Transporters table lookup:", err);
                }
            }

            if (!userRole) {
                try {
                    const { data: consumer } = await supabase.from('consumers').select('*').eq('email', sbUser.email).maybeSingle();
                    if (consumer) {
                        userRole = 'consumers';
                        profileData = consumer;
                    }
                } catch (err) {
                    console.warn("Consumers table lookup:", err);
                }
            }
        }

        // 5. Final role resolution:
        if (userRole) {
            const finalUser = {
                id: sbUser.id,
                email: sbUser.email,
                name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Kisan Member',
                phone: sbUser.phone || sbUser.user_metadata?.phone || '',
                role: userRole,
                avatar: sbUser.user_metadata?.avatar_url || null,
                ...profileData
            };

            // If new user profile in database table is missing, auto-create it
            if (!profileData && sbUser.email) {
                try {
                    const newProfile = {
                        email: sbUser.email,
                        phone: finalUser.phone || '9' + Math.floor(100000000 + Math.random() * 900000000),
                        pin: '1234',
                        name: finalUser.name,
                        role: userRole,
                        created_at: new Date().toISOString()
                    };
                    await supabase.from(targetTable).upsert(newProfile);
                } catch (insErr) {
                    console.warn(`Auto-creating initial profile in ${targetTable}:`, insErr);
                }
            }

            setUser(finalUser);
            setRole(userRole);
            setNeedsRoleSelection(false);
            setGoogleUser(null);
        } else {
            // Only if absolutely no role could be inferred, show role selection
            setGoogleUser(sbUser);
            setNeedsRoleSelection(true);
        }
    };

    useEffect(() => {
        // Initialize Supabase Auth Session (Source of Truth)
        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                if (initialSession?.user) {
                    await processSupabaseUser(initialSession.user);
                }
            } catch (err) {
                console.error("Supabase getSession error:", err);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        // Listen to Supabase Auth State changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);
            if (event === 'SIGNED_IN' && newSession?.user) {
                await processSupabaseUser(newSession.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                setNeedsRoleSelection(false);
                setGoogleUser(null);
                localStorage.removeItem('kisan_active_tab');
                localStorage.removeItem('agri_active_tab');
                localStorage.removeItem('kisan_intended_role');
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Trigger Supabase Google OAuth
    // Stores the selected portal role so that returning users go straight to that portal
    const signInWithGoogle = async (intendedRole = null) => {
        try {
            if (intendedRole) {
                localStorage.setItem('kisan_intended_role', intendedRole);
            }
            localStorage.setItem('kisan_auth_origin', window.location.origin);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) {
                console.error("Google OAuth error:", error);
                throw new Error("Google sign-in failed. Please try again.");
            }
        } catch (err) {
            console.error("Google sign-in error:", err);
            throw new Error("Google sign-in failed. Please try again.");
        }
    };

    // Assign Role to New Google User (if needed)
    const assignRoleToGoogleUser = async (selectedRole, extraData = {}) => {
        const activeUser = googleUser || session?.user;
        if (!activeUser) {
            throw new Error("No active Google session found.");
        }

        try {
            // 1. Update Supabase Auth user metadata
            await supabase.auth.updateUser({
                data: {
                    role: selectedRole,
                    ...extraData
                }
            });

            // 2. Upsert profile into the respective role table in Supabase
            const tableName = selectedRole === 'transporters' ? 'transport_providers' : selectedRole;
            const phone = extraData.phone || activeUser.phone || '9' + Math.floor(100000000 + Math.random() * 900000000);
            const name = extraData.name || activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'Kisan User';

            const roleProfile = {
                email: activeUser.email,
                phone: phone,
                pin: '1234',
                name: name,
                role: selectedRole,
                created_at: new Date().toISOString(),
                ...extraData
            };

            try {
                await supabase.from(tableName).upsert(roleProfile);
            } catch (tableErr) {
                console.warn(`Supabase upsert to ${tableName} notice:`, tableErr);
            }

            const completeUser = {
                id: activeUser.id,
                email: activeUser.email,
                ...roleProfile
            };

            setUser(completeUser);
            setRole(selectedRole);
            setNeedsRoleSelection(false);
            setGoogleUser(null);
            return completeUser;
        } catch (err) {
            console.error("Role assignment error:", err);
            throw new Error("Failed to assign role. Please try again.");
        }
    };

    // Phone / PIN Login
    const loginWithPhone = (userData, userRole) => {
        setUser(userData);
        setRole(userRole);
    };

    // Explicit Logout
    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("SignOut notice:", e);
        }
        setUser(null);
        setRole(null);
        setNeedsRoleSelection(false);
        setGoogleUser(null);
        localStorage.removeItem('kisan_active_tab');
        localStorage.removeItem('agri_active_tab');
        localStorage.removeItem('kisan_intended_role');
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            role,
            loading,
            needsRoleSelection,
            googleUser,
            signInWithGoogle,
            assignRoleToGoogleUser,
            loginWithPhone,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
