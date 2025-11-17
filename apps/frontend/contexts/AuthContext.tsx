'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import type { LoginRequest, LoginResponse } from '@mcigroupfrance/testazure-shared';

// On réutilise le type User depuis le shared package (single source of truth)
type User = LoginResponse['user'];

// Ce que le Context va exposer à tous les composants
interface AuthContextType {
  user: User | null;              // L'utilisateur connecté (ou null si pas connecté)
  token: string | null;           // Le JWT token
  isLoading: boolean;             // true pendant le chargement initial
  login: (credentials: LoginRequest) => Promise<void>;  // Fonction pour se connecter
  logout: () => void;             // Fonction pour se déconnecter
}

// Création du Context (vide au début)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider = Composant qui enrobe l'app et fournit les données
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // États React pour stocker user, token, loading
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect se déclenche AU MONTAGE du composant (= au démarrage de l'app)
  useEffect(() => {
    const loadUser = async () => {
      // On cherche si un token existe dans le localStorage
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        setToken(storedToken);
        try {
          // On appelle l'API pour récupérer les infos utilisateur
          const userData = await authApi.me();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Si le token est invalide, on le supprime
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);  // Chargement terminé
    };

    loadUser();
  }, []); // [] = ne s'exécute qu'une seule fois au montage

  // Fonction de login
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      setUser(response.user);
      // On stocke le token dans localStorage pour le garder après refresh
      localStorage.setItem('token', response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;  // On remonte l'erreur pour l'afficher dans le formulaire
    }
  };

  // Fonction de logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // On rend le Provider avec toutes les valeurs accessibles
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le Context facilement
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
