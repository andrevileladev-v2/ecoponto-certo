import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthService } from './auth.service.js'

const service = new AuthService()

test('validateRegister rejeita dados obrigatórios faltando', () => {
  const result = service.validateRegister({ email: '', nome: 'Ana' })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'email, nome e senha são obrigatórios')
})

test('validateRegister exige senha com pelo menos 8 caracteres', () => {
  const result = service.validateRegister({ email: 'ana@example.com', nome: 'Ana', senha: 'curta' })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'a senha deve ter pelo menos 8 caracteres')
})

test('validateRegister exige cidade e estado', () => {
  const result = service.validateRegister({ email: 'ana@example.com', nome: 'Ana', senha: 'senha-segura' })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'cidade e estado são obrigatórios')
})

test('validateRegister exige dados da empresa quando tipo é EMPRESA', () => {
  const result = service.validateRegister({
    email: 'empresa@example.com',
    nome: 'Empresa',
    senha: 'senha-segura',
    cidade: 'Guarapari',
    estado: 'ES',
    tipo: 'EMPRESA',
  })
  assert.equal(result.ok, false)
  assert.equal(result.error, 'razão social, CNPJ e tipo de atuação são obrigatórios para conta empresarial')
})

test('validateRegister aceita cadastro de empresa completo', () => {
  const result = service.validateRegister({
    email: 'empresa@example.com',
    nome: 'Empresa',
    senha: 'senha-segura',
    cidade: 'Guarapari',
    estado: 'ES',
    tipo: 'EMPRESA',
    razaoSocial: 'Cooperativa Verde Ltda',
    cnpj: '00.000.000/0001-00',
    tipoAtuacao: 'Cooperativa de reciclagem',
  })
  assert.equal(result.ok, true)
})

test('createToken gera payload com sub, role e tipo', () => {
  const token = service.createToken(
    { sign: (payload) => JSON.stringify(payload) },
    { id: 'user-1', role: 'USER', tipo: 'PF' },
  )

  const payload = JSON.parse(token)
  assert.equal(payload.sub, 'user-1')
  assert.equal(payload.role, 'USER')
  assert.equal(payload.tipo, 'PF')
})
