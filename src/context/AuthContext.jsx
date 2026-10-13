import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isDriverMode, setIsDriverMode] = useState(() => {
    return localStorage.getItem('vanshift:auth_mode') === 'driver'
  })
  const [activeDriver, setActiveDriver] = useState(() => {
    return localStorage.getItem('vanshift:driver') || ''
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  const loginAdmin = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setIsDriverMode(false)
    localStorage.removeItem('vanshift:auth_mode')
    return cred.user
  }

  const loginDriver = (driverName) => {
    if (!driverName || !driverName.trim()) {
      throw new Error('Please enter or select your driver name.')
    }
    const clean = driverName.trim()
    setIsDriverMode(true)
    setActiveDriver(clean)
    localStorage.setItem('vanshift:auth_mode', 'driver')
    localStorage.setItem('vanshift:driver', clean)
  }

  const logout = async () => {
    try {
      if (user) {
        await fbSignOut(auth)
      }
    } catch {
      // ignore signout errors
    } finally {
      setUser(null)
      setIsDriverMode(false)
      localStorage.removeItem('vanshift:auth_mode')
    }
  }

  const isAuthenticated = Boolean(user || isDriverMode)
  const isAdmin = Boolean(user)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isDriverMode,
        isAuthenticated,
        activeDriver,
        authLoading,
        loginAdmin,
        loginDriver,
        logout,
        setActiveDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
