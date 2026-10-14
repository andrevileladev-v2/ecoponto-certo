import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma.js';
import { UsuariosService } from '../application/usuarios.service.js';
export class UsuariosController {
    service;
    prismaClient;
    constructor(service = new UsuariosService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async me(req, reply) {
        const { sub } = req.user;
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
                avatar_url: true,
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
        });
        if (!usuario)
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        return reply.send(usuario);
    }
    async updateProfile(req, reply) {
        const { sub } = req.user;
        const { nome, cidade, email, avatar_url, senha_atual, senha_nova } = req.body;
        if (nome !== undefined && !nome.trim()) {
            return reply.status(400).send({ error: 'Nome não pode ficar vazio' });
        }
        if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return reply.status(400).send({ error: 'Email inválido' });
        }
        if (senha_atual && !senha_nova) {
            return reply.status(400).send({ error: 'Informe a nova senha' });
        }
        if (senha_nova && senha_nova.length < 8) {
            return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 8 caracteres' });
        }
        const atual = await this.prismaClient.usuario.findUnique({
            where: { id: sub },
            select: { id: true, senha_hash: true },
        });
        if (!atual)
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        if (senha_nova && atual.senha_hash) {
            if (!senha_atual)
                return reply.status(400).send({ error: 'Informe a senha atual' });
            if (!(await bcrypt.compare(senha_atual, atual.senha_hash))) {
                return reply.status(400).send({ error: 'Senha atual incorreta' });
            }
        }
        if (email !== undefined) {
            const emailExistente = await this.prismaClient.usuario.findUnique({
                where: { email: email.trim() },
                select: { id: true },
            });
            if (emailExistente && emailExistente.id !== sub) {
                return reply.status(409).send({ error: 'Email já está em uso' });
            }
        }
        const usuario = await this.prismaClient.usuario.update({
            where: { id: sub },
            data: {
                nome: nome?.trim(),
                cidade: cidade?.trim() || null,
                email: email?.trim(),
                avatar_url: avatar_url?.trim() || null,
                senha_hash: senha_nova ? await bcrypt.hash(senha_nova, 12) : undefined,
            },
            select: { id: true, email: true, nome: true, tipo: true, role: true, cidade: true, avatar_url: true, criado_em: true },
        });
        return reply.send(usuario);
    }
    async saved(req, reply) {
        const { sub } = req.user;
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
        });
        return reply.send(salvos.map((salvo) => salvo.ponto));
    }
    async list(req, reply) {
        const { q, status, tipo, limit, offset } = req.query;
        const where = this.service.buildListWhere({ q, status, tipo });
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
        ]);
        return reply.send({
            total,
            data: usuarios.map(({ senha_hash: _senhaHash, ...usuario }) => usuario),
        });
    }
    async detail(req, reply) {
        const { id } = req.params;
        const usuario = await this.prismaClient.usuario.findUnique({
            where: { id },
            include: {
                empresa: true,
                _count: { select: { pontos_criados: true, entregas: true } },
            },
        });
        if (!usuario)
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        const { senha_hash: _senhaHash, ...usuarioSeguro } = usuario;
        return reply.send(usuarioSeguro);
    }
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = req.body;
        const validation = this.service.validateStatus(status);
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const usuario = await this.prismaClient.usuario.update({
            where: { id },
            data: { status },
            select: { id: true, nome: true, email: true, status: true },
        });
        return reply.send(usuario);
    }
    async updateRole(req, reply) {
        const { id } = req.params;
        const { role } = req.body;
        const validation = this.service.validateRole(role);
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const usuario = await this.prismaClient.usuario.update({
            where: { id },
            data: { role },
            select: { id: true, nome: true, email: true, role: true },
        });
        return reply.send(usuario);
    }
}
