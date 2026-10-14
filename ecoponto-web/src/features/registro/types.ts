import type { FormEvent } from 'react'

export type TipoRegistro = 'fp' | 'emp'

export type RegistroFormProps = {
  tipo: TipoRegistro
  onTipoChange: (next: TipoRegistro) => void
}

export type RegistroFormViewProps = {
  tipo: TipoRegistro
  campos: Record<string, string>
  setCampo: (key: string, value: string) => void
  estado: string
  cidade: string
  setLocalizacao: (next: { estado: string; cidade: string }) => void
  tipoAtuacao: string
  setTipoAtuacao: (value: string) => void
  erro: string
  loading: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}
