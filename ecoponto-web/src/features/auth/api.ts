export async function loginWithEmail(email: string, senha: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error ?? 'Erro ao fazer login')
  return data
}
