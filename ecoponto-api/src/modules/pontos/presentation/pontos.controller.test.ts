import assert from 'node:assert/strict'
import test from 'node:test'
import { PontosController } from './pontos.controller.js'
import { PontosService } from '../application/pontos.service.js'

test('controller list envia a lista filtrada do Prisma', async () => {
  const points = [
    {
      id: 'p1',
      nome: 'Ponto Central',
      endereco: 'Rua A',
      cidade: 'Vitória',
      estado: 'ES',
      lat: -20.648,
      lng: -40.515,
      status: 'ATIVO',
      confiabilidade: 0.9,
      residuos: [],
      _count: { confirmacoes: 3, mensagens: 1 },
    },
  ]

  const fakePrisma = {
    ponto: {
      findMany: async () => points,
    },
  } as any

  const controller = new PontosController(new PontosService(), fakePrisma)

  const req = {
    query: {
      q: 'Central',
      lat: '-20.648',
      lng: '-40.515',
      raio: '5000',
    },
  } as any

  const sent: unknown[] = []
  const reply = {
    send(payload: unknown) {
      sent.push(payload)
      return payload
    },
  } as any

  await controller.list(req, reply)

  assert.equal(sent.length, 1)
  assert.equal((sent[0] as Array<{ id: string }>)[0].id, 'p1')
})

test('controller create guarda uma proposta sem publicar o ponto', async () => {
  let proposalData: Record<string, unknown> | undefined
  const fakePrisma = {
    propostaPonto: {
      create: async (args: { data: Record<string, unknown> }) => {
        proposalData = args.data
        return { id: 'proposal-1', ...args.data }
      },
    },
    ponto: { create: async () => { throw new Error('Ponto não deve ser publicado antes dos votos') } },
  } as any

  const controller = new PontosController(new PontosService(), fakePrisma)

  const req = {
    user: { sub: 'user-1' },
    body: {
      nome: 'Novo Ponto',
      endereco: 'Rua B',
      cidade: 'Vitória',
      lat: -20.6,
      lng: -40.5,
    },
  } as any

  const sent: Array<{ statusCode?: number; payload?: unknown }> = []
  const reply = {
    status(code: number) {
      sent.push({ statusCode: code })
      return {
        send: (payload: unknown) => {
          sent.push({ payload })
          return payload
        },
      }
    },
    send(payload: unknown) {
      sent.push({ payload })
      return payload
    },
  } as any

  await controller.create(req, reply)

  assert.equal(sent.some((item) => item.statusCode === 201), true)
  assert.equal(proposalData?.tipo, 'CRIAR')
  assert.equal(proposalData?.pais, undefined)
  assert.equal((proposalData?.dados as { pais: string }).pais, 'Brasil')
})

test('controller create mantém o país informado na proposta', async () => {
  let proposalData: Record<string, unknown> | undefined
  const controller = new PontosController(new PontosService(), {
    propostaPonto: {
      create: async (args: { data: Record<string, unknown> }) => {
        proposalData = args.data
        return { id: 'proposal-2', ...args.data }
      },
    },
  } as any)

  const reply = {
    status: () => ({ send: (payload: unknown) => payload }),
  } as any

  await controller.create({
    user: { sub: 'user-1' },
    body: {
      nome: 'Novo Ponto',
      endereco: 'Rua B',
      cidade: 'Lisboa',
      pais: ' Portugal ',
      lat: 38.7,
      lng: -9.1,
    },
  } as any, reply)

  assert.equal((proposalData?.dados as { pais: string }).pais, 'Portugal')
})

test('controller update registra uma edição sem alterar o ponto publicado', async () => {
  let proposalData: Record<string, unknown> | undefined
  const controller = new PontosController(new PontosService(), {
    ponto: {
      findUnique: async () => ({ id: 'point-1', nome: 'Ponto atual' }),
      update: async () => { throw new Error('Ponto não deve ser alterado antes dos votos') },
    },
    propostaPonto: {
      create: async (args: { data: Record<string, unknown> }) => {
        proposalData = args.data
        return { id: 'proposal-edit', ...args.data }
      },
    },
  } as any)
  const reply = {
    status: () => ({ send: (payload: unknown) => payload }),
  } as any

  await controller.update({
    params: { id: 'point-1' },
    user: { sub: 'user-1' },
    body: {
      nome: 'Novo nome',
      endereco: 'Rua B',
      cidade: 'Vitória',
      estado: 'ES',
      pais: 'Brasil',
      lat: -20.6,
      lng: -40.5,
    },
  } as any, reply)

  assert.equal(proposalData?.tipo, 'EDITAR')
  assert.equal(proposalData?.ponto_id, 'point-1')
  assert.equal((proposalData?.dados as { nome: string }).nome, 'Novo nome')
})

test('controller só publica um novo ponto após atingir o quórum comunitário', async () => {
  const proposta = {
    id: 'proposal-1',
    tipo: 'CRIAR',
    status: 'PENDENTE',
    autor_id: 'author-1',
    ponto_id: null,
    dados: {
      nome: 'Novo ponto',
      endereco: 'Rua B',
      cidade: 'Vitória',
      estado: 'ES',
      pais: 'Brasil',
      lat: -20.6,
      lng: -40.5,
    },
  }
  const votos = [{ aprova: true }, { aprova: true }]
  let createdPoint: Record<string, unknown> | undefined
  let updatedProposal: Record<string, unknown> | undefined
  const tx = {
    votoPropostaPonto: {
      upsert: async () => { votos.push({ aprova: true }) },
      findMany: async () => votos,
    },
    ponto: {
      create: async (args: { data: Record<string, unknown> }) => {
        createdPoint = args.data
        return { id: 'approved-point' }
      },
    },
    propostaPonto: {
      update: async (args: { data: Record<string, unknown> }) => {
        updatedProposal = args.data
        return { ...proposta, ...args.data }
      },
    },
  }
  const controller = new PontosController(new PontosService(), {
    propostaPonto: { findUnique: async () => proposta },
    $transaction: async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx),
  } as any)
  let response: any
  const reply = { send: (payload: unknown) => { response = payload; return payload } } as any

  await controller.voteProposal({
    params: { propostaId: 'proposal-1' },
    user: { sub: 'voter-3' },
    body: { aprova: true },
  } as any, reply)

  assert.equal(createdPoint?.nome, 'Novo ponto')
  assert.equal(createdPoint?.criado_por_id, 'author-1')
  assert.equal(createdPoint?.status, 'ATIVO')
  assert.deepEqual(updatedProposal, {
    status: 'APROVADA',
    confirmacoes: 3,
    contestacoes: 0,
    ponto_id: 'approved-point',
  })
  assert.equal(response.status, 'APROVADA')
})

test('controller aplica uma edição aprovada ao ponto existente', async () => {
  const proposta = {
    id: 'proposal-edit',
    tipo: 'EDITAR',
    status: 'PENDENTE',
    autor_id: 'author-1',
    ponto_id: 'point-1',
    dados: {
      nome: 'Nome corrigido',
      endereco: 'Rua B',
      cidade: 'Vitória',
      estado: 'ES',
      pais: 'Brasil',
      lat: -20.6,
      lng: -40.5,
    },
  }
  const votos = [{ aprova: true }, { aprova: true }]
  let pointUpdate: Record<string, unknown> | undefined
  let pointCreateCalled = false
  const tx = {
    votoPropostaPonto: {
      upsert: async () => { votos.push({ aprova: true }) },
      findMany: async () => votos,
    },
    ponto: {
      create: async () => { pointCreateCalled = true; return { id: 'unexpected' } },
      update: async (args: { data: Record<string, unknown> }) => { pointUpdate = args.data; return {} },
    },
    propostaPonto: {
      update: async (args: { data: Record<string, unknown> }) => ({ ...proposta, ...args.data }),
    },
  }
  const controller = new PontosController(new PontosService(), {
    propostaPonto: { findUnique: async () => proposta },
    $transaction: async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx),
  } as any)
  const reply = { send: (payload: unknown) => payload } as any

  await controller.voteProposal({
    params: { propostaId: 'proposal-edit' },
    user: { sub: 'voter-3' },
    body: { aprova: true },
  } as any, reply)

  assert.equal(pointUpdate?.nome, 'Nome corrigido')
  assert.equal(pointCreateCalled, false)
})

test('controller rejeita voto do autor da própria proposta', async () => {
  let transactionStarted = false
  const controller = new PontosController(new PontosService(), {
    propostaPonto: {
      findUnique: async () => ({
        id: 'proposal-1',
        status: 'PENDENTE',
        autor_id: 'author-1',
        ponto_id: null,
      }),
    },
    $transaction: async () => { transactionStarted = true },
  } as any)
  let statusCode = 0
  const reply = {
    status: (code: number) => {
      statusCode = code
      return { send: (payload: unknown) => payload }
    },
  } as any

  await controller.voteProposal({
    params: { propostaId: 'proposal-1' },
    user: { sub: 'author-1' },
    body: { aprova: true },
  } as any, reply)

  assert.equal(statusCode, 403)
  assert.equal(transactionStarted, false)
})
