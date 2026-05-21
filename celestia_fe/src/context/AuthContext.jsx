import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem('isLoggedIn') === 'true'
  )

  function login(email) {
    sessionStorage.setItem('isLoggedIn', 'true')
    sessionStorage.setItem('userEmail', email)
    setIsLoggedIn(true)
  }

  function logout() {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userEmail')
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
