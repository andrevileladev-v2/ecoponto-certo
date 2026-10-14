import type { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma.js'
import { UsuariosService } from '../application/usuarios.service.js'

export class UsuariosController {
  constructor(
    private readonly service: UsuariosService = new UsuariosService(),
    private readonly prismaClient = prisma,
  ) {}

  async me(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const usuario = await this.prismaClient.usuario.findUnique({
      where: { id: sub },
      select: {
        id: true,
        email: true,
        nome: true,
        tipo: true,
        role: true,
        status: true,
        cidade: true,
        estado: true,
        avatar_url: true,
        mostrar_no_dashboard: true,
        criado_em: true,
        empresa: true,
        _count: {
          select: {
            pontos_criados: true,
            entregas: true,
            salvos: true,
          },
        },
      },
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return reply.send(usuario)
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const { nome, cidade, estado, email, avatar_url, mostrar_no_dashboard, senha_atual, senha_nova } = req.body as {
      nome?: string
      cidade?: string | null
      estado?: string | null
      email?: string
      avatar_url?: string | null
      mostrar_no_dashboard?: boolean
      senha_atual?: string
      senha_nova?: string
    }

    if (nome !== undefined && !nome.trim()) {
      return reply.status(400).send({ error: 'Nome não pode ficar vazio' })
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return reply.status(400).send({ error: 'Email inválido' })
    }
    if (avatar_url?.trim()) {
      try {
        const avatar = new URL(avatar_url.trim())
        if (!['http:', 'https:'].includes(avatar.protocol)) {
          return reply.status(400).send({ error: 'A foto deve usar um endereço HTTP ou HTTPS' })
        }
      } catch {
        return reply.status(400).send({ error: 'Endereço da foto inválido' })
      }
    }
    if (senha_atual && !senha_nova) {
      return reply.status(400).send({ error: 'Informe a nova senha' })
    }
    if (senha_nova && senha_nova.length < 8) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 8 caracteres' })
    }

    const atual = await this.prismaClient.usuario.findUnique({
      where: { id: sub },
      select: { id: true, senha_hash: true },
    })
    if (!atual) return reply.status(404).send({ error: 'Usuário não encontrado' })

    if (senha_nova && atual.senha_hash) {
      if (!senha_atual) return reply.status(400).send({ error: 'Informe a senha atual' })
      if (!(await bcrypt.compare(senha_atual, atual.senha_hash))) {
        return reply.status(400).send({ error: 'Senha atual incorreta' })
      }
    }

    if (email !== undefined) {
      const emailExistente = await this.prismaClient.usuario.findUnique({
        where: { email: email.trim() },
        select: { id: true },
      })
      if (emailExistente && emailExistente.id !== sub) {
        return reply.status(409).send({ error: 'Email já está em uso' })
      }
    }

    const usuario = await this.prismaClient.usuario.update({
      where: { id: sub },
      data: {
        nome: nome?.trim(),
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        email: email?.trim(),
        avatar_url: avatar_url?.trim() || null,
        mostrar_no_dashboard,
        senha_hash: senha_nova ? await bcrypt.hash(senha_nova, 12) : undefined,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        tipo: true,
        role: true,
        status: true,
        cidade: true,
        estado: true,
        avatar_url: true,
        mostrar_no_dashboard: true,
        criado_em: true,
      },
    })
    return reply.send(usuario)
  }

  async saved(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const salvos = await this.prismaClient.pontoSalvo.findMany({
      where: { usuario_id: sub },
      include: {
        ponto: {
          include: {
            residuos: {
              where: { status: 'CONFIRMADO' },
              include: { residuo: true },
            },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    })
    return reply.send(salvos.map((salvo) => salvo.ponto))
  }

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { q, status, tipo, limit, offset } = req.query as any
    const where = this.service.buildListWhere({ q, status, tipo })

    const [total, usuarios] = await this.prismaClient.$transaction([
      this.prismaClient.usuario.count({ where }),
      this.prismaClient.usuario.findMany({
        where,
        include: {
          empresa: true,
          _count: { select: { pontos_criados: true, entregas: true } },
        },
        orderBy: { criado_em: 'desc' },
        take: Number(limit) || 20,
        skip: Number(offset) || 0,
      }),
    ])

    return reply.send({
      total,
      data: usuarios.map(({ senha_hash: _senhaHash, ...usuario }) => usuario),
    })
  }

  async detail(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const usuario = await this.prismaClient.usuario.findUnique({
      where: { id },
      include: {
        empresa: true,
        _count: { select: { pontos_criados: true, entregas: true } },
      },
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    const { senha_hash: _senhaHash, ...usuarioSeguro } = usuario
    return reply.send(usuarioSeguro)
  }

  async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { status } = req.body as any
    const validation = this.service.validateStatus(status)
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const usuario = await this.prismaClient.usuario.update({
      where: { id },
      data: { status },
      select: { id: true, nome: true, email: true, status: true },
    })
    return reply.send(usuario)
  }

  async updateRole(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { role } = req.body as any
    const validation = this.service.validateRole(role)
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const usuario = await this.prismaClient.usuario.update({
      where: { id },
      data: { role },
      select: { id: true, nome: true, email: true, role: true },
    })
    return reply.send(usuario)
  }
}
