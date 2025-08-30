

// 'use client'

// import { createContext, useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import Cookies from 'js-cookie'

// export const AuthContext = createContext()

// const API = process.env.NEXT_PUBLIC_API_URL;

// export default function AuthProvider({ children }) {
//   const router = useRouter()
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   // useEffect(() => {
//   //   const validateToken = async () => {
//   //     const token = Cookies.get('auth_token');
//   //     if (token) {
//   //       try {
//   //         const res = await fetch(`${API}/auth/me`, {
//   //           headers: {
//   //             'Authorization': `Bearer ${token}`
//   //           }
//   //         });

//   //         if (res.ok) {
//   //           const userData = await res.json();
//   //           setUser(userData);
//   //           // Also sync local storage on initial load
//   //           localStorage.setItem('user.email', userData.email);
//   //           localStorage.setItem('isLoggedIn', 'true');
//   //         } else {
//   //           // If token is invalid, log the user out completely
//   //           logout();
//   //         }
//   //       } catch (error) {
//   //         console.error("Token validation failed", error);
//   //         logout();
//   //       }
//   //     }
//   //     setLoading(false);
//   //   };

//   //   validateToken();
//   // }, []);

// useEffect(() => {
//   const token = Cookies.get('auth_token');
//   console.log('AuthProvider useEffect: token', token);
//   if (token) {
//     fetch(`${API}/auth/me`, {
//       headers: { 'Authorization': `Bearer ${token}` }
//     })
//       .then(res => {
//         console.log('auth/me response', res.status);
//         if (res.ok) return res.json();
//         throw new Error('Invalid token');
//       })
//       .then(userData => {
//         setUser(userData);
//         localStorage.setItem('user.email', userData.email);
//         localStorage.setItem('isLoggedIn', 'true');
//       })
//       .catch((err) => {
//         console.log('auth/me error', err);
//         logout();
//       })
//       .finally(() => setLoading(false));
//   } else {
//     setLoading(false);
//   }
// }, []);


//   const login = (token, email) => {
//     Cookies.set('auth_token', token, {
//       expires: 7,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//     })
    
//     // ✅ --- UPDATE LOCAL STORAGE ON LOGIN ---
//     // This is the crucial fix. It saves the new email to the browser's memory.
//     localStorage.setItem('user.email', email);
//     localStorage.setItem('isLoggedIn', 'true');

//     setUser({ email: email });
//     router.replace('/dashboard')
//   }

//   // const logout = () => {
//   //   // Remove the authentication token from cookies
//   //   Cookies.remove('auth_token');
    
//   //   // Clear user data from Local Storage
//   //   localStorage.removeItem('user.email');
//   //   localStorage.removeItem('isLoggedIn');

//   //   // Clear the user state in the application
//   //   setUser(null);
    
//   //   // Redirect to the login page
//   //   router.replace('/login');
//   // }


//   const logout = () => {
//   Cookies.remove('auth_token');
//   localStorage.removeItem('user.email');
//   localStorage.removeItem('isLoggedIn');
//   setUser(null);
//   if (window.location.pathname !== '/login') {
//     router.replace('/login');
//   }
// }

//   const value = { user, loading, login, logout };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }




'use client'

import { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export const AuthContext = createContext()

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Validate token when app loads or refresh happens
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then(userData => {
          setUser(userData);
          localStorage.setItem('user.email', userData.email);
          localStorage.setItem('isLoggedIn', 'true');
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, email) => {
    Cookies.set('auth_token', token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    // ✅ Update local storage
    localStorage.setItem('user.email', email);
    localStorage.setItem('isLoggedIn', 'true');

    setUser({ email });
    router.replace('/dashboard')
  }

  const logout = () => {
    Cookies.remove('auth_token');
    localStorage.removeItem('user.email');
    localStorage.removeItem('isLoggedIn');
    setUser(null);
    if (window.location.pathname !== '/login') {
      router.replace('/login');
    }
  }

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
