Need to install the following packages:
prisma@5.22.0
Ok to proceed? (y) -- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('PF', 'EMPRESA');

-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusPonto" AS ENUM ('ATIVO', 'INATIVO', 'PENDENTE_VERIFICACAO');

-- CreateEnum
CREATE TYPE "StatusResiduo" AS ENUM ('APROVADO', 'PENDENTE', 'REJEITADO');

-- CreateEnum
CREATE TYPE "StatusItemPonto" AS ENUM ('CONFIRMADO', 'CONTESTADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "TipoDenuncia" AS ENUM ('INFORMACAO_INCORRETA', 'COMPORTAMENTO_INADEQUADO', 'SPAM', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDenuncia" AS ENUM ('PENDENTE', 'RESOLVIDO', 'IGNORADO');

-- CreateEnum
CREATE TYPE "StatusMelhoria" AS ENUM ('PENDENTE', 'PRIORIZADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('TEXTO', 'CONFIRMACAO', 'DUVIDA', 'AVISO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL DEFAULT 'PF',
    "role" "RoleUsuario" NOT NULL DEFAULT 'USER',
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "avatar_url" TEXT,
    "cidade" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT,
    "whatsapp" TEXT,
    "tipo_atuacao" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ES',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "telefone" TEXT,
    "site" TEXT,
    "horario" TEXT,
    "status" "StatusPonto" NOT NULL DEFAULT 'ATIVO',
    "confiabilidade" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residuos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "icone" TEXT,
    "status" "StatusResiduo" NOT NULL DEFAULT 'APROVADO',
    "solicitado_por_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ponto_residuos" (
    "id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "residuo_id" TEXT NOT NULL,
    "status" "StatusItemPonto" NOT NULL DEFAULT 'PENDENTE',
    "confirmacoes" INTEGER NOT NULL DEFAULT 0,
    "contestacoes" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ponto_residuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_residuo" (
    "id" TEXT NOT NULL,
    "ponto_residuo_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "aceita" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_residuo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmacoes_atividade" (
    "id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "funcionando" BOOLEAN NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmacoes_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "residuo_id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION,
    "unidade" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_salvos" (
    "usuario_id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pontos_salvos_pkey" PRIMARY KEY ("usuario_id","ponto_id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "ponto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoMensagem" NOT NULL DEFAULT 'TEXTO',
    "conteudo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDenuncia" NOT NULL,
    "status" "StatusDenuncia" NOT NULL DEFAULT 'PENDENTE',
    "descricao" TEXT,
    "denunciante_id" TEXT NOT NULL,
    "alvo_usuario_id" TEXT,
    "alvo_mensagem_id" TEXT,
    "alvo_ponto_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvido_em" TIMESTAMP(3),

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "melhorias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusMelhoria" NOT NULL DEFAULT 'PENDENTE',
    "autor_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "melhorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_melhoria" (
    "usuario_id" TEXT NOT NULL,
    "melhoria_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_melhoria_pkey" PRIMARY KEY ("usuario_id","melhoria_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_usuario_id_key" ON "empresas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE INDEX "pontos_lat_lng_idx" ON "pontos"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "residuos_nome_key" ON "residuos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "ponto_residuos_ponto_id_residuo_id_key" ON "ponto_residuos"("ponto_id", "residuo_id");

-- CreateIndex
CREATE UNIQUE INDEX "votos_residuo_ponto_residuo_id_usuario_id_key" ON "votos_residuo"("ponto_residuo_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos" ADD CONSTRAINT "pontos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residuos" ADD CONSTRAINT "residuos_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ponto_residuos" ADD CONSTRAINT "ponto_residuos_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ponto_residuos" ADD CONSTRAINT "ponto_residuos_residuo_id_fkey" FOREIGN KEY ("residuo_id") REFERENCES "residuos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_residuo" ADD CONSTRAINT "votos_residuo_ponto_residuo_id_fkey" FOREIGN KEY ("ponto_residuo_id") REFERENCES "ponto_residuos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_residuo" ADD CONSTRAINT "votos_residuo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacoes_atividade" ADD CONSTRAINT "confirmacoes_atividade_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacoes_atividade" ADD CONSTRAINT "confirmacoes_atividade_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_residuo_id_fkey" FOREIGN KEY ("residuo_id") REFERENCES "residuos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_salvos" ADD CONSTRAINT "pontos_salvos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_salvos" ADD CONSTRAINT "pontos_salvos_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_ponto_id_fkey" FOREIGN KEY ("ponto_id") REFERENCES "pontos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_denunciante_id_fkey" FOREIGN KEY ("denunciante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_alvo_usuario_id_fkey" FOREIGN KEY ("alvo_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_alvo_mensagem_id_fkey" FOREIGN KEY ("alvo_mensagem_id") REFERENCES "mensagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_alvo_ponto_id_fkey" FOREIGN KEY ("alvo_ponto_id") REFERENCES "pontos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melhorias" ADD CONSTRAINT "melhorias_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_melhoria" ADD CONSTRAINT "votos_melhoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_melhoria" ADD CONSTRAINT "votos_melhoria_melhoria_id_fkey" FOREIGN KEY ("melhoria_id") REFERENCES "melhorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

