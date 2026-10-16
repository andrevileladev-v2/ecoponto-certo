import {
  PrismaClient,
  RoleUsuario,
  StatusItemPonto,
  StatusPonto,
  StatusResiduo,
  TipoMensagem,
  TipoUsuario,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const
type DiaSemana = (typeof DIAS_SEMANA)[number]

/** Monta o Json `horarios` (HorarioSemana) a partir das faixas informadas. */
function horarioSemana(faixas: Partial<Record<DiaSemana, readonly [string, string]>>) {
  return DIAS_SEMANA.reduce((acc, dia) => {
    const faixa = faixas[dia]
    acc[dia] = faixa
      ? { ativo: true, abertura: faixa[0], fechamento: faixa[1] }
      : { ativo: false, abertura: '08:00', fechamento: '18:00' }
    return acc
  }, {} as Record<DiaSemana, { ativo: boolean; abertura: string; fechamento: string }>)
}

const COMERCIAL = {
  seg: ['08:00', '17:00'],
  ter: ['08:00', '17:00'],
  qua: ['08:00', '17:00'],
  qui: ['08:00', '17:00'],
  sex: ['08:00', '17:00'],
} as const

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── 1. Resíduos padrão ──────────────────────────────────────────────────
  console.log('♻️  Criando tipos de resíduos...')

  const residuos = await Promise.all([
    prisma.residuo.upsert({
      where: { nome: 'Vidro' },
      update: {},
      create: { nome: 'Vidro',             cor: '#2563EB', icone: 'Wine',      status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Papel / Papelão' },
      update: {},
      create: { nome: 'Papel / Papelão',   cor: '#0891B2', icone: 'Newspaper', status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Plástico' },
      update: {},
      create: { nome: 'Plástico',          cor: '#DC2626', icone: 'Package',   status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Metal / Alumínio' },
      update: {},
      create: { nome: 'Metal / Alumínio',  cor: '#D97706', icone: 'Layers',    status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Eletrônicos' },
      update: {},
      create: { nome: 'Eletrônicos',       cor: '#7C3AED', icone: 'Cpu',       status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Óleo de cozinha' },
      update: {},
      create: { nome: 'Óleo de cozinha',   cor: '#EA580C', icone: 'Droplets',  status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Pilhas e Baterias' },
      update: {},
      create: { nome: 'Pilhas e Baterias', cor: '#DB2777', icone: 'Battery',   status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Tetra Pak' },
      update: {},
      create: { nome: 'Tetra Pak',         cor: '#059669', icone: 'Milk',      status: StatusResiduo.APROVADO },
    }),
  ])

  const [vidro, papel, plastico, metal, eletronico, oleo, bateria, tetra] = residuos
  console.log(`   ✓ ${residuos.length} tipos de resíduos criados`)

  // ─── 2. Usuário admin ────────────────────────────────────────────────────
  console.log('👤 Criando usuário admin...')

  const senhaSeed = process.env.SEED_DEFAULT_PASSWORD ?? 'admin123'
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_DEFAULT_PASSWORD) {
    throw new Error('Defina SEED_DEFAULT_PASSWORD antes de executar o seed em produção.')
  }

  const senhaHash = await bcrypt.hash(senhaSeed, 10)

  // Garante a senha caso o upsert tenha caído no update de um registro sem senha.
  const garantirSenhaSeed = async (usuarioId: string) => {
    await prisma.usuario.updateMany({
      where: { id: usuarioId, senha_hash: null },
      data: { senha_hash: senhaHash },
    })
  }

  const admin = await prisma.usuario.upsert({
    where: { email: 'andrevileladev@gmail.com' },
    update: {},
    create: {
      email:      'andrevileladev@gmail.com',
      senha_hash: senhaHash,
      nome:       'André Vilela',
      tipo:       TipoUsuario.PF,
      role:       RoleUsuario.ADMIN,
      cidade:     'Guarapari',
      estado:     'ES',
    },
  })
  await garantirSenhaSeed(admin.id)
  console.log(`   ✓ Admin: ${admin.email}`)

  // ─── 3. Dados de exemplo ─────────────────────────────────────────────────
  // Rodam fora de produção; em produção defina SEED_DEMO=true para forçar.
  const seedDemo = process.env.SEED_DEMO
    ? process.env.SEED_DEMO === 'true'
    : process.env.NODE_ENV !== 'production'

  if (!seedDemo) {
    console.log('\n✅ Seed concluído (sem dados de exemplo).')
    console.log(`   Admin: ${admin.email}`)
    return
  }

  console.log('👥 Criando usuários de exemplo...')

  const maria = await prisma.usuario.upsert({
    where: { email: 'maria@email.com' },
    update: {},
    create: {
      email:      'maria@email.com',
      senha_hash: senhaHash,
      nome:       'Maria Souza',
      tipo:       TipoUsuario.PF,
      cidade:     'Guarapari',
      estado:     'ES',
    },
  })
  await garantirSenhaSeed(maria.id)

  const joao = await prisma.usuario.upsert({
    where: { email: 'joao@empresa.com' },
    update: {},
    create: {
      email:      'joao@empresa.com',
      senha_hash: senhaHash,
      nome:       'João Lima',
      tipo:       TipoUsuario.EMPRESA,
      cidade:     'Vitória',
      estado:     'ES',
      empresa: {
        create: {
          razao_social: 'Coop. Verde Vida Ltda.',
          cnpj:         '12.345.678/0001-90',
          whatsapp:     '(27) 99999-8888',
          tipo_atuacao: 'Cooperativa',
          verificado:   true,
        },
      },
    },
  })
  await garantirSenhaSeed(joao.id)
  console.log('   ✓ 2 usuários de exemplo criados')

  // ─── 4. Pontos de coleta (Guarapari e região) ────────────────────────────
  console.log('📍 Criando pontos de coleta...')

  const ponto1 = await prisma.ponto.upsert({
    where: { id: 'ponto-coop-verde-vida' },
    update: {},
    create: {
      id:             'ponto-coop-verde-vida',
      nome:           'Coop. Verde Vida',
      descricao:      'Cooperativa de reciclagem que atende toda a região de Guarapari. Aceita grande variedade de materiais.',
      endereco:       'R. das Palmeiras, 120 — Muquiçaba',
      cidade:         'Guarapari',
      estado:         'ES',
      lat:            -20.6626,
      lng:            -40.4976,
      telefone:       '(27) 3361-0000',
      horario:        'Seg–Sex 08:00–17:00, Sáb 08:00–12:00',
      horarios:       horarioSemana({ ...COMERCIAL, sab: ['08:00', '12:00'] }),
      status:         StatusPonto.ATIVO,
      confiabilidade: 0.92,
      criado_por_id:  joao.id,
    },
  })

  const ponto2 = await prisma.ponto.upsert({
    where: { id: 'ponto-ecoponto-iguatemi' },
    update: {},
    create: {
      id:             'ponto-ecoponto-iguatemi',
      nome:           'Ecoponto Iguatemi',
      descricao:      'Ponto de entrega voluntária da Prefeitura de Guarapari. Aceita resíduos eletrônicos e pilhas.',
      endereco:       'Av. Beira Mar, 500 — Iguatemi',
      cidade:         'Guarapari',
      estado:         'ES',
      lat:            -20.6712,
      lng:            -40.4989,
      horario:        'Seg–Sex 07:00–18:00',
      horarios:       horarioSemana({
        seg: ['07:00', '18:00'], ter: ['07:00', '18:00'], qua: ['07:00', '18:00'],
        qui: ['07:00', '18:00'], sex: ['07:00', '18:00'],
      }),
      status:         StatusPonto.ATIVO,
      confiabilidade: 0.78,
      criado_por_id:  admin.id,
    },
  })

  const ponto3 = await prisma.ponto.upsert({
    where: { id: 'ponto-recicla-vitoria' },
    update: {},
    create: {
      id:             'ponto-recicla-vitoria',
      nome:           'Recicla Vitória — Centro',
      descricao:      'Empresa privada de coleta seletiva. Especializada em óleo de cozinha e eletrônicos.',
      endereco:       'R. Sete de Setembro, 88 — Centro',
      cidade:         'Vitória',
      estado:         'ES',
      lat:            -20.3155,
      lng:            -40.3128,
      telefone:       '(27) 3222-5555',
      site:           'https://reciclavitoria.com.br',
      horario:        'Seg–Sex 08:00–18:00, Sáb 08:00–14:00',
      horarios:       horarioSemana({
        seg: ['08:00', '18:00'], ter: ['08:00', '18:00'], qua: ['08:00', '18:00'],
        qui: ['08:00', '18:00'], sex: ['08:00', '18:00'], sab: ['08:00', '14:00'],
      }),
      status:         StatusPonto.ATIVO,
      confiabilidade: 0.85,
      criado_por_id:  admin.id,
    },
  })
  console.log('   ✓ 3 pontos criados')

  // ─── 5. Resíduos aceitos por cada ponto ──────────────────────────────────
  console.log('🔗 Associando resíduos aos pontos...')

  const associarResiduos = async (
    pontoId: string,
    lista: (typeof residuos)[number][],
    confirmacoes: number,
    contestacoes: number,
  ) => {
    await Promise.all(
      lista.map((r) =>
        prisma.pontoResiduo.upsert({
          where: { ponto_id_residuo_id: { ponto_id: pontoId, residuo_id: r.id } },
          update: {},
          create: {
            ponto_id:   pontoId,
            residuo_id: r.id,
            confirmacoes,
            contestacoes,
            status:     StatusItemPonto.CONFIRMADO,
          },
        }),
      ),
    )
  }

  // Coop. Verde Vida — aceita quase tudo
  await associarResiduos(ponto1.id, [vidro, papel, plastico, metal, tetra, oleo], 18, 1)
  // Ecoponto Iguatemi — eletrônicos, pilhas, papel
  await associarResiduos(ponto2.id, [eletronico, bateria, papel], 9, 1)
  // Recicla Vitória — óleo, eletrônicos, metal, plástico
  await associarResiduos(ponto3.id, [oleo, eletronico, metal, plastico], 13, 0)
  console.log('   ✓ Resíduos associados')

  // ─── 6. Mensagens de exemplo no chat ─────────────────────────────────────
  console.log('💬 Criando mensagens de exemplo...')

  await prisma.mensagem.createMany({
    skipDuplicates: true,
    data: [
      { ponto_id: ponto1.id, usuario_id: maria.id, tipo: TipoMensagem.CONFIRMACAO, conteudo: 'Fui hoje de manhã, estava funcionando normalmente ✓' },
      { ponto_id: ponto1.id, usuario_id: admin.id, tipo: TipoMensagem.DUVIDA,      conteudo: 'Aceita tetra pak aqui?' },
      { ponto_id: ponto1.id, usuario_id: joao.id,  tipo: TipoMensagem.TEXTO,       conteudo: 'Sim, aceitamos tetra pak! Podem trazer à vontade.' },
      { ponto_id: ponto2.id, usuario_id: maria.id, tipo: TipoMensagem.AVISO,       conteudo: 'Fechado hoje por feriado municipal.' },
      { ponto_id: ponto2.id, usuario_id: admin.id, tipo: TipoMensagem.CONFIRMACAO, conteudo: 'Voltou a funcionar normalmente ✓' },
    ],
  })
  console.log('   ✓ Mensagens criadas')

  // ─── 7. Entregas de exemplo ──────────────────────────────────────────────
  console.log('📦 Criando entregas de exemplo...')

  await prisma.entrega.createMany({
    skipDuplicates: true,
    data: [
      { usuario_id: admin.id, ponto_id: ponto1.id, residuo_id: papel.id,    quantidade: 3.5, unidade: 'kg' },
      { usuario_id: admin.id, ponto_id: ponto1.id, residuo_id: plastico.id, quantidade: 1.2, unidade: 'kg' },
      { usuario_id: maria.id, ponto_id: ponto2.id, residuo_id: bateria.id,  quantidade: 5,   unidade: 'unidade' },
      { usuario_id: maria.id, ponto_id: ponto3.id, residuo_id: oleo.id,     quantidade: 2,   unidade: 'L' },
      { usuario_id: joao.id,  ponto_id: ponto1.id, residuo_id: vidro.id,    quantidade: 4.0, unidade: 'kg' },
    ],
  })
  console.log('   ✓ Entregas criadas')

  // ─── 8. Melhorias sugeridas ──────────────────────────────────────────────
  console.log('💡 Criando melhorias...')

  const m1 = await prisma.melhoria.upsert({
    where: { id: 'melhoria-filtro-horario' },
    update: {},
    create: {
      id:        'melhoria-filtro-horario',
      titulo:    'Filtro por horário de funcionamento',
      descricao: 'Poder filtrar no mapa pontos que estejam abertos agora ou em um horário específico.',
      autor_id:  maria.id,
    },
  })

  const m2 = await prisma.melhoria.upsert({
    where: { id: 'melhoria-modo-offline' },
    update: {},
    create: {
      id:        'melhoria-modo-offline',
      titulo:    'Modo offline para ver pontos sem internet',
      descricao: 'Salvar os pontos próximos no celular para consulta sem conexão.',
      autor_id:  joao.id,
    },
  })

  await prisma.votoMelhoria.createMany({
    skipDuplicates: true,
    data: [
      { usuario_id: admin.id, melhoria_id: m1.id },
      { usuario_id: joao.id,  melhoria_id: m1.id },
      { usuario_id: maria.id, melhoria_id: m1.id },
      { usuario_id: admin.id, melhoria_id: m2.id },
      { usuario_id: maria.id, melhoria_id: m2.id },
    ],
  })
  console.log('   ✓ Melhorias criadas')

  console.log('\n✅ Seed concluído com sucesso!')
  console.log(`   Admin: ${admin.email} / ${senhaSeed}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
