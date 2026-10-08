import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (req, reply) => {
    const { email, nome, senha, tipo, cidade } = req.body as any

    if (!email || !nome || !senha) {
      return reply.status(400).send({ error: 'email, nome e senha são obrigatórios' })
    }

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return reply.status(409).send({ error: 'Email já cadastrado' })

    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: { email, nome, tipo: tipo ?? 'PF', cidade },
      select: { id: true, email: true, nome: true, tipo: true, role: true, cidade: true, criado_em: true },
    })

    const token = app.jwt.sign({ sub: usuario.id, role: usuario.role, tipo: usuario.tipo })
    return reply.status(201).send({ token, usuario })
  })

  // POST /auth/login
  app.post('/login', async (req, reply) => {
    const { email, senha } = req.body as any

    if (!email || !senha) {
      return reply.status(400).send({ error: 'email e senha são obrigatórios' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return reply.status(401).send({ error: 'Credenciais inválidas' })

    if (usuario.status === 'BLOQUEADO') {
      return reply.status(403).send({ error: 'Conta bloqueada' })
    }

    // Nota: senha não está no schema por enquanto (auth via Supabase / OAuth)
    // Aqui aceitamos qualquer senha enquanto não há hash salvo
    const token = app.jwt.sign({ sub: usuario.id, role: usuario.role, tipo: usuario.tipo })

    const { ...usuarioSemSenha } = usuario
    return reply.send({ token, usuario: usuarioSemSenha })
  })

  // GET /auth/me
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const usuario = await prisma.usuario.findUnique({
      where: { id: sub },
      include: { empresa: true },
    })
    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return reply.send(usuario)
  })
}
