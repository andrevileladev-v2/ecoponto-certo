import type { FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma.js'
import { AuthService } from '../application/auth.service.js'

export class AuthController {
  constructor(
    private readonly service: AuthService = new AuthService(),
    private readonly prismaClient = prisma,
  ) {}

  private getJwtSigner(req: FastifyRequest) {
    return (req as any).jwt ?? (req.server as any)?.jwt
  }

  async register(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any
    const validation = this.service.validateRegister(body)
    if (!validation.ok) {
      return reply.status(400).send({ error: validation.error })
    }

    const { email, nome, senha, tipo, cidade, estado, razaoSocial, cnpj, tipoAtuacao, whatsapp } = body

    const existe = await this.prismaClient.usuario.findUnique({ where: { email } })
    if (existe) return reply.status(409).send({ error: 'Email já cadastrado' })

    if (tipo === 'EMPRESA' && cnpj) {
      const cnpjExistente = await this.prismaClient.empresa.findUnique({ where: { cnpj } })
      if (cnpjExistente) return reply.status(409).send({ error: 'CNPJ já cadastrado' })
    }

    const usuario = await this.prismaClient.usuario.create({
      data: {
        email,
        senha_hash: await bcrypt.hash(senha, 12),
        nome,
        tipo: tipo ?? 'PF',
        cidade,
        estado,
        ...(tipo === 'EMPRESA'
          ? {
              empresa: {
                create: {
                  razao_social: razaoSocial,
                  cnpj: cnpj || null,
                  whatsapp: whatsapp || null,
                  tipo_atuacao: tipoAtuacao,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        nome: true,
        tipo: true,
        role: true,
        cidade: true,
        estado: true,
        avatar_url: true,
        mostrar_no_dashboard: true,
        criado_em: true,
        empresa: true,
      },
    })

    const jwtSigner = this.getJwtSigner(req)
    if (!jwtSigner) return reply.status(500).send({ error: 'JWT não inicializado' })

    const token = this.service.createToken(jwtSigner, usuario)
    return reply.status(201).send({ token, usuario })
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any
    const validation = this.service.validateLogin(body)
    if (!validation.ok) {
      return reply.status(400).send({ error: validation.error })
    }

    const { email, senha } = body
    const usuario = await this.prismaClient.usuario.findUnique({ where: { email } })
    if (!usuario) return reply.status(401).send({ error: 'Credenciais inválidas' })

    if (usuario.status === 'BLOQUEADO') {
      return reply.status(403).send({ error: 'Conta bloqueada' })
    }

    if (usuario.senha_hash && !(await bcrypt.compare(senha, usuario.senha_hash))) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    if (!usuario.senha_hash) {
      await this.prismaClient.usuario.update({
        where: { id: usuario.id },
        data: { senha_hash: await bcrypt.hash(senha, 12) },
      })
    }

    const jwtSigner = this.getJwtSigner(req)
    if (!jwtSigner) return reply.status(500).send({ error: 'JWT não inicializado' })

    const token = this.service.createToken(jwtSigner, usuario)
    const { senha_hash: _senhaHash, ...usuarioSeguro } = usuario
    return reply.send({ token, usuario: usuarioSeguro })
  }
}
