export type LoginFormState = {
  email: string
  senha: string
  erro: string
  loading: boolean
}

export type LoginFormProps = LoginFormState & {
  setEmail: (value: string) => void
  setSenha: (value: string) => void
  setErro: (value: string) => void
  setLoading: (value: boolean) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void
}
