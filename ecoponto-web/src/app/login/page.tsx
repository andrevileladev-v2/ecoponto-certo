'use client'

import { LoginForm } from '@/features/login/components/LoginForm'
import { useLoginForm } from '@/features/login/useLoginForm'

export default function LoginPage() {
  return <LoginForm {...useLoginForm()} />
}
