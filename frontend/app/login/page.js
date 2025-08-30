

// 'use client'

// import { useState, useContext } from 'react'
// import Link from 'next/link'
// import { AuthContext } from '../AuthProvider'
// import styles from './auth.module.css'

// const API = process.env.NEXT_PUBLIC_API_URL

// export default function LoginPage() {
//   const { login } = useContext(AuthContext)
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [secret, setSecret] = useState('')
//   const [error, setError] = useState('')

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')

//     try {
//       const res = await fetch(`${API}/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, secret }),
//       })
//       const data = await res.json()

//       if (!res.ok) {
//         throw new Error(data.detail || 'Login failed. Please check your credentials.')
//       }

//       // ✅ The user's email is now passed to the login function.
//       login(data.access_token, email)
//     } catch (err) {
//       setError(err.message)
//     }
//   }

//   return (
//     <div className={styles.wrapper}>
//       <form onSubmit={handleSubmit} className={styles.form}>
//         <h2>Login</h2>
//         {error && <p className={styles.error}>{error}</p>}
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <input
//           type="text"
//           placeholder="Shared Secret"
//           value={secret}
//           onChange={(e) => setSecret(e.target.value)}
//           required
//         />
//         <button type="submit">Login</button>
//         <p className={styles.toggle}>
//           New here? <Link href="/register">Register</Link>
//         </p>
//       </form>
//     </div>
//   )
// }



'use client'

import { useState, useContext } from 'react'
import Link from 'next/link'
import { AuthContext } from '../AuthProvider'
import styles from './auth.module.css'

const API = process.env.NEXT_PUBLIC_API_URL

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')   // ✅ Added secret key input
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, secret }), // ✅ include secret
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.')
      }

      // ✅ Pass token + email to AuthContext
      login(data.access_token, data.email)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Secret Key"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p className={styles.toggle}>
          New here? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}
