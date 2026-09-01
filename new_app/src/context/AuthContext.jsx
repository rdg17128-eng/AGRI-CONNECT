import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('kisan_user');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [role, setRole] = useState(() => {
        return localStorage.getItem('kisan_role') || localStorage.getItem('kisan_portal') || null;
    });
    const [loading, setLoading] = useState(true);
    const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);

    // Sync state to local storage for portal persistence across reloads
    const persistAuth = (userData, userRole) => {
        setUser(userData);
        setRole(userRole);
        if (userData) {
            localStorage.setItem('kisan_user', JSON.stringify(userData));
            localStorage.setItem('agri_user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('kisan_user');
            localStorage.removeItem('agri_user');
        }
        if (userRole) {
            localStorage.setItem('kisan_role', userRole);
            localStorage.setItem('kisan_portal', userRole);
            localStorage.setItem('agri_portal', userRole);
        } else {
            localStorage.removeItem('kisan_role');
            localStorage.removeItem('kisan_portal');
            localStorage.removeItem('agri_portal');
        }
    };

    // Check user role from Supabase session
    const processSupabaseUser = async (sbUser) => {
        if (!sbUser) {
            return;
        }

        // Check if role is stored in user_metadata
        let userRole = sbUser.user_metadata?.role || null;
        let profileData = null;

        // If not in metadata, check role tables
        if (!userRole) {
            try {
                // Check farmers
                const { data: farmer } = await supabase.from('farmers').select('*').or(`phone.eq.${sbUser.phone || ''},name.eq.${sbUser.email || ''}`).maybeSingle();
                if (farmer) {
                    userRole = 'farmers';
                    profileData = farmer;
                } else {
                    // Check buyers
                    const { data: buyer } = await supabase.from('buyers').select('*').or(`phone.eq.${sbUser.phone || ''},name.eq.${sbUser.email || ''}`).maybeSingle();
                    if (buyer) {
                        userRole = 'buyers';
                        profileData = buyer;
                    } else {
                        // Check transport_providers
                        const { data: trans } = await supabase.from('transport_providers').select('*').or(`phone.eq.${sbUser.phone || ''},name.eq.${sbUser.email || ''}`).maybeSingle();
                        if (trans) {
                            userRole = 'transporters';
                            profileData = trans;
                        }
                    }
                }
            } catch (err) {
                console.warn("Error querying role tables for Supabase user:", err);
            }
        }

        if (userRole) {
            const finalUser = {
                id: sbUser.id,
                email: sbUser.email,
                name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Kisan User',
                phone: sbUser.phone || sbUser.user_metadata?.phone || '9876543210',
                role: userRole,
                avatar: sbUser.user_metadata?.avatar_url || null,
                ...profileData
            };
            persistAuth(finalUser, userRole);
            setNeedsRoleSelection(false);
            setGoogleUser(null);
        } else {
            // New Google account without an assigned role
            setGoogleUser(sbUser);
            setNeedsRoleSelection(true);
        }
    };

    useEffect(() => {
        // Initialize Supabase Auth Session
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);
            if (event === 'SIGNED_IN' && newSession?.user) {
                await processSupabaseUser(newSession.user);
            } else if (event === 'SIGNED_OUT') {
                persistAuth(null, null);
                setNeedsRoleSelection(false);
                setGoogleUser(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Trigger Supabase Google OAuth
    const signInWithGoogle = async (intendedRole = null) => {
        if (intendedRole) {
            localStorage.setItem('kisan_intended_role', intendedRole);
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) {
            console.error("Google OAuth error:", error);
            throw error;
        }
    };

    // Assign Role to New Google User
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

            // 2. Insert into the respective database table
            const tableName = selectedRole === 'transporters' ? 'transport_providers' : selectedRole;
            const phone = extraData.phone || activeUser.phone || '9' + Math.floor(100000000 + Math.random() * 900000000);
            const name = extraData.name || activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'Kisan User';

            const roleProfile = {
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
                console.warn(`Supabase upsert to ${tableName} failed (using memory profile):`, tableErr);
            }

            const completeUser = {
                id: activeUser.id,
                email: activeUser.email,
                ...roleProfile
            };

            persistAuth(completeUser, selectedRole);
            setNeedsRoleSelection(false);
            setGoogleUser(null);
            return completeUser;
        } catch (err) {
            console.error("Role assignment error:", err);
            throw err;
        }
    };

    // Phone / PIN Login
    const loginWithPhone = (userData, userRole) => {
        persistAuth(userData, userRole);
    };

    // Explicit Logout
    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("SignOut notice:", e);
        }
        persistAuth(null, null);
        setNeedsRoleSelection(false);
        setGoogleUser(null);
        localStorage.removeItem('kisan_active_tab');
        localStorage.removeItem('agri_active_tab');
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
