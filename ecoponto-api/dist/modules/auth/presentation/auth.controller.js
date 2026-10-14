import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma.js';
import { AuthService } from '../application/auth.service.js';
export class AuthController {
    service;
    prismaClient;
    constructor(service = new AuthService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    getJwtSigner(req) {
        return req.jwt ?? req.server?.jwt;
    }
    async register(req, reply) {
        const body = req.body;
        const validation = this.service.validateRegister(body);
        if (!validation.ok) {
            return reply.status(400).send({ error: validation.error });
        }
        const { email, nome, senha, tipo, cidade } = body;
        const existe = await this.prismaClient.usuario.findUnique({ where: { email } });
        if (existe)
            return reply.status(409).send({ error: 'Email já cadastrado' });
        const usuario = await this.prismaClient.usuario.create({
            data: {
                email,
                senha_hash: await bcrypt.hash(senha, 12),
                nome,
                tipo: tipo ?? 'PF',
                cidade,
            },
            select: { id: true, email: true, nome: true, tipo: true, role: true, cidade: true, avatar_url: true, criado_em: true },
        });
        const jwtSigner = this.getJwtSigner(req);
        if (!jwtSigner)
            return reply.status(500).send({ error: 'JWT não inicializado' });
        const token = this.service.createToken(jwtSigner, usuario);
        return reply.status(201).send({ token, usuario });
    }
    async login(req, reply) {
        const body = req.body;
        const validation = this.service.validateLogin(body);
        if (!validation.ok) {
            return reply.status(400).send({ error: validation.error });
        }
        const { email, senha } = body;
        const usuario = await this.prismaClient.usuario.findUnique({ where: { email } });
        if (!usuario)
            return reply.status(401).send({ error: 'Credenciais inválidas' });
        if (usuario.status === 'BLOQUEADO') {
            return reply.status(403).send({ error: 'Conta bloqueada' });
        }
        if (usuario.senha_hash && !(await bcrypt.compare(senha, usuario.senha_hash))) {
            return reply.status(401).send({ error: 'Credenciais inválidas' });
        }
        if (!usuario.senha_hash) {
            await this.prismaClient.usuario.update({
                where: { id: usuario.id },
                data: { senha_hash: await bcrypt.hash(senha, 12) },
            });
        }
        const jwtSigner = this.getJwtSigner(req);
        if (!jwtSigner)
            return reply.status(500).send({ error: 'JWT não inicializado' });
        const token = this.service.createToken(jwtSigner, usuario);
        const { senha_hash: _senhaHash, ...usuarioSeguro } = usuario;
        return reply.send({ token, usuario: usuarioSeguro });
    }
}
