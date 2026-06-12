import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import Button from '../../components/ui/Button'
import { EyeIcon, EyeOffIcon } from '../../components/ui/PasswordIcons'
import styles from './Login.module.css'

export default function Register() {
  const session = useAuthStore((state) => state.session)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <img className={styles.logo} src="/img/logo_pulso_transparent.png" alt="Pulso Studio" />
        <p className={styles.subtitle}>Creá tu cuenta para entrar al panel de Pulso Studio</p>

        {success ? (
          <div className={styles.error} style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)' }}>
            Cuenta creada. Si pidió confirmación por email, revisá tu casilla antes de iniciar
            sesión. <Link to="/login">Ir al login</Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@pulsostudio.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Contraseña
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <Button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <p className={styles.subtitle} style={{ margin: 0, textAlign: 'center' }}>
              ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
