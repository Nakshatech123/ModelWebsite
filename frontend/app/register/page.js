
// 'use client'

// import { useState, useContext } from 'react'
// import Link from 'next/link'
// import styles from './auth.module.css'
// import { AuthContext } from '../AuthProvider' // Import AuthContext to use the login function

// const API = process.env.NEXT_PUBLIC_API_URL

// export default function RegisterPage() {
//   const { login } = useContext(AuthContext) // Get the login function from the context
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [secret, setSecret] = useState('')
//   const [error, setError] = useState('')
//   const [isLoading, setIsLoading] = useState(false)

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setIsLoading(true)

//     if (password.length < 8) {
//       setError('Password must be at least 8 characters long.')
//       setIsLoading(false)
//       return
//     }

//     try {
//       // Step 1: Attempt to register the new user
//       const regRes = await fetch(`${API}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, secret }),
//       })

//       const regData = await regRes.json()
//       if (!regRes.ok) {
//         throw new Error(regData.detail || 'Registration failed. Please try again.')
//       }

//       // Step 2: If registration is successful, automatically log the user in
//       const loginRes = await fetch(`${API}/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, secret }),
//       })

//       const loginData = await loginRes.json()
//       if (!loginRes.ok) {
//         // This is a fallback in case auto-login fails after a successful registration
//         throw new Error('Registration was successful, but auto-login failed. Please go to the login page.')
//       }

//       // Step 3: Use the login function from AuthContext to set the cookie and redirect to the dashboard
//       login(loginData.access_token)

//     } catch (err) {
//       setError(err.message)
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className={styles.wrapper}>
//       <form onSubmit={handleSubmit} className={styles.form}>
//         <h2>Register</h2>
//         {error && <p className={styles.error}>{error}</p>}
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//           disabled={isLoading}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           disabled={isLoading}
//         />
//         <input
//           type="text"
//           placeholder="Shared Secret"
//           value={secret}
//           onChange={(e) => setSecret(e.target.value)}
//           required
//           disabled={isLoading}
//         />
//         <button type="submit" disabled={isLoading}>
//           {isLoading ? 'Registering...' : 'Register'}
//         </button>
//         <p className={styles.toggle}>
//           Already have an account? <Link href="/login">Login</Link>
//         </p>
//       </form>
//     </div>
//   )
// }


'use client'

import { useState, useContext } from 'react'
import Link from 'next/link'
import styles from './auth.module.css'
import { AuthContext } from '../AuthProvider'

const API = process.env.NEXT_PUBLIC_API_URL

export default function RegisterPage() {
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setIsLoading(false)
      return
    }

    try {
      // ✅ Registration WITHOUT secret
      const regRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const regData = await regRes.json()
      if (!regRes.ok) {
        throw new Error(regData.detail || 'Registration failed. Please try again.')
      }

      // ✅ After registration, redirect to login
      window.location.href = '/login'

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Register</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
        <p className={styles.toggle}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  )
}
