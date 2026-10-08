import { PrismaClient, StatusResiduo, StatusPonto, TipoUsuario, RoleUsuario } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── 1. Resíduos padrão ──────────────────────────────────────────────────
  console.log('♻️  Criando tipos de resíduos...')

  const residuos = await Promise.all([
    prisma.residuo.upsert({
      where: { nome: 'Vidro' },
      update: {},
      create: { nome: 'Vidro',            cor: '#2563EB', icone: 'Wine',         status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Papel / Papelão' },
      update: {},
      create: { nome: 'Papel / Papelão',  cor: '#0891B2', icone: 'Newspaper',    status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Plástico' },
      update: {},
      create: { nome: 'Plástico',         cor: '#DC2626', icone: 'Package',       status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Metal / Alumínio' },
      update: {},
      create: { nome: 'Metal / Alumínio', cor: '#D97706', icone: 'Layers',        status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Eletrônicos' },
      update: {},
      create: { nome: 'Eletrônicos',      cor: '#7C3AED', icone: 'Cpu',           status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Óleo de cozinha' },
      update: {},
      create: { nome: 'Óleo de cozinha',  cor: '#EA580C', icone: 'Droplets',      status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Pilhas e Baterias' },
      update: {},
      create: { nome: 'Pilhas e Baterias',cor: '#DB2777', icone: 'Battery',       status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Tetra Pak' },
      update: {},
      create: { nome: 'Tetra Pak',        cor: '#059669', icone: 'Milk',          status: StatusResiduo.APROVADO },
    }),
  ])

  const [vidro, papel, plastico, metal, eletronico, oleo, bateria, tetra] = residuos
  console.log(`   ✓ ${residuos.length} tipos criados`)

  // ─── 2. Usuário admin (André) ────────────────────────────────────────────
  console.log('👤 Criando usuário admin...')

  const senhaHash = await hash('admin123', 10)

  const admin = await prisma.usuario.upsert({
    where: { email: 'andrevileladev@gmail.com' },
    update: {},
    create: {
      email: 'andrevileladev@gmail.com',
      nome:  'André Vilela',
      tipo:  TipoUsuario.PF,
      role:  RoleUsuario.ADMIN,
      cidade: 'Guarapari',
    },
  })
  console.log(`   ✓ Admin: ${admin.email}`)

  // ─── 3. Usuários de exemplo ──────────────────────────────────────────────
  console.log('👥 Criando usuários de exemplo...')

  const maria = await prisma.usuario.upsert({
    where: { email: 'maria@email.com' },
    update: {},
    create: {
      email:  'maria@email.com',
      nome:   'Maria Souza',
      tipo:   TipoUsuario.PF,
      cidade: 'Guarapari',
    },
  })

  const joao = await prisma.usuario.upsert({
    where: { email: 'joao@empresa.com' },
    update: {},
    create: {
      email:  'joao@empresa.com',
      nome:   'João Lima',
      tipo:   TipoUsuario.EMPRESA,
      cidade: 'Vitória',
      empresa: {
        create: {
          razao_social:  'Coop. Verde Vida Ltda.',
          cnpj:          '12.345.678/0001-90',
          whatsapp:      '(27) 99999-8888',
          tipo_atuacao:  'Cooperativa',
          verificado:    true,
        },
      },
    },
  })
  console.log(`   ✓ 2 usuários de exemplo criados`)

  // ─── 4. Pontos de coleta (Guarapari e região) ────────────────────────────
  console.log('📍 Criando pontos de coleta...')

  const ponto1 = await prisma.ponto.upsert({
    where: { id: 'ponto-coop-verde-vida' },
    update: {},
    create: {
      id:           'ponto-coop-verde-vida',
      nome:         'Coop. Verde Vida',
      descricao:    'Cooperativa de reciclagem que atende toda a região de Guarapari. Aceita grande variedade de materiais.',
      endereco:     'R. das Palmeiras, 120 — Muquiçaba',
      cidade:       'Guarapari',
      estado:       'ES',
      lat:          -20.6626,
      lng:          -40.4976,
      telefone:     '(27) 3361-0000',
      horario:      'Seg–Sex 8h–17h · Sáb 8h–12h',
      status:       StatusPonto.ATIVO,
      confiabilidade: 0.92,
      criado_por_id: joao.id,
    },
  })

  const ponto2 = await prisma.ponto.upsert({
    where: { id: 'ponto-ecoponto-iguatemi' },
    update: {},
    create: {
      id:           'ponto-ecoponto-iguatemi',
      nome:         'Ecoponto Iguatemi',
      descricao:    'Ponto de entrega voluntária da Prefeitura de Guarapari. Aceita resíduos eletrônicos e pilhas.',
      endereco:     'Av. Beira Mar, 500 — Iguatemi',
      cidade:       'Guarapari',
      estado:       'ES',
      lat:          -20.6712,
      lng:          -40.4989,
      horario:      'Seg–Sex 7h–18h',
      status:       StatusPonto.ATIVO,
      confiabilidade: 0.78,
      criado_por_id: admin.id,
    },
  })

  const ponto3 = await prisma.ponto.upsert({
    where: { id: 'ponto-recicla-vitoria' },
    update: {},
    create: {
      id:           'ponto-recicla-vitoria',
      nome:         'Recicla Vitória — Centro',
      descricao:    'Empresa privada de coleta seletiva. Especializada em óleo de cozinha e eletrônicos.',
      endereco:     'R. Sete de Setembro, 88 — Centro',
      cidade:       'Vitória',
      estado:       'ES',
      lat:          -20.3155,
      lng:          -40.3128,
      telefone:     '(27) 3222-5555',
      site:         'https://reciclavitoria.com.br',
      horario:      'Seg–Sex 8h–18h · Sáb 8h–14h',
      status:       StatusPonto.ATIVO,
      confiabilidade: 0.85,
      criado_por_id: admin.id,
    },
  })
  console.log(`   ✓ 3 pontos criados`)

  // ─── 5. Resíduos aceitos por cada ponto ──────────────────────────────────
  console.log('🔗 Associando resíduos aos pontos...')

  // Coop. Verde Vida — aceita quase tudo
  await Promise.all([
    vidro, papel, plastico, metal, tetra, oleo
  ].map(r =>
    prisma.pontoResiduo.upsert({
      where: { ponto_id_residuo_id: { ponto_id: ponto1.id, residuo_id: r.id } },
      update: {},
      create: {
        ponto_id:     ponto1.id,
        residuo_id:   r.id,
        confirmacoes: Math.floor(Math.random() * 20) + 5,
        contestacoes: Math.floor(Math.random() * 3),
        status:       'CONFIRMADO',
      },
    })
  ))

  // Ecoponto Iguatemi — eletrônicos, pilhas, papel
  await Promise.all([
    eletronico, bateria, papel
  ].map(r =>
    prisma.pontoResiduo.upsert({
      where: { ponto_id_residuo_id: { ponto_id: ponto2.id, residuo_id: r.id } },
      update: {},
      create: {
        ponto_id:     ponto2.id,
        residuo_id:   r.id,
        confirmacoes: Math.floor(Math.random() * 10) + 2,
        contestacoes: Math.floor(Math.random() * 2),
        status:       'CONFIRMADO',
      },
    })
  ))

  // Recicla Vitória — óleo, eletrônicos, metal, plástico
  await Promise.all([
    oleo, eletronico, metal, plastico
  ].map(r =>
    prisma.pontoResiduo.upsert({
      where: { ponto_id_residuo_id: { ponto_id: ponto3.id, residuo_id: r.id } },
      update: {},
      create: {
        ponto_id:     ponto3.id,
        residuo_id:   r.id,
        confirmacoes: Math.floor(Math.random() * 15) + 4,
        contestacoes: 0,
        status:       'CONFIRMADO',
      },
    })
  ))
  console.log(`   ✓ Resíduos associados`)

  // ─── 6. Mensagens de exemplo no chat ─────────────────────────────────────
  console.log('💬 Criando mensagens de exemplo...')

  await prisma.mensagem.createMany({
    skipDuplicates: true,
    data: [
      { ponto_id: ponto1.id, usuario_id: maria.id, tipo: 'CONFIRMACAO', conteudo: 'Fui hoje de manhã, estava funcionando normalmente ✓' },
      { ponto_id: ponto1.id, usuario_id: admin.id, tipo: 'DUVIDA',      conteudo: 'Aceita tetra pak aqui?' },
      { ponto_id: ponto1.id, usuario_id: joao.id,  tipo: 'TEXTO',       conteudo: 'Sim, aceitamos tetra pak! Podem trazer à vontade.' },
      { ponto_id: ponto2.id, usuario_id: maria.id, tipo: 'AVISO',       conteudo: 'Fechado hoje por feriado municipal.' },
      { ponto_id: ponto2.id, usuario_id: admin.id, tipo: 'CONFIRMACAO',  conteudo: 'Voltou a funcionar normalmente ✓' },
    ],
  })
  console.log(`   ✓ Mensagens criadas`)

  // ─── 7. Entregas de exemplo ───────────────────────────────────────────────
  console.log('📦 Criando entregas de exemplo...')

  await prisma.entrega.createMany({
    skipDuplicates: true,
    data: [
      { usuario_id: admin.id, ponto_id: ponto1.id, residuo_id: papel.id,   quantidade: 3.5,  unidade: 'kg' },
      { usuario_id: admin.id, ponto_id: ponto1.id, residuo_id: plastico.id, quantidade: 1.2,  unidade: 'kg' },
      { usuario_id: maria.id, ponto_id: ponto2.id, residuo_id: bateria.id,  quantidade: 5,    unidade: 'unidade' },
      { usuario_id: maria.id, ponto_id: ponto3.id, residuo_id: oleo.id,     quantidade: 2,    unidade: 'L' },
      { usuario_id: joao.id,  ponto_id: ponto1.id, residuo_id: vidro.id,    quantidade: 4.0,  unidade: 'kg' },
    ],
  })
  console.log(`   ✓ Entregas criadas`)

  // ─── 8. Melhorias sugeridas ───────────────────────────────────────────────
  console.log('💡 Criando melhorias...')

  const m1 = await prisma.melhoria.upsert({
    where: { id: 'melhoria-filtro-horario' },
    update: {},
    create: {
      id:       'melhoria-filtro-horario',
      titulo:   'Filtro por horário de funcionamento',
      descricao:'Poder filtrar no mapa pontos que estejam abertos agora ou em um horário específico.',
      autor_id: maria.id,
    },
  })

  const m2 = await prisma.melhoria.upsert({
    where: { id: 'melhoria-modo-offline' },
    update: {},
    create: {
      id:       'melhoria-modo-offline',
      titulo:   'Modo offline para ver pontos sem internet',
      descricao:'Salvar os pontos próximos no celular para consulta sem conexão.',
      autor_id: joao.id,
    },
  })

  // Votos nas melhorias
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
  console.log(`   ✓ Melhorias criadas`)

  console.log('\n✅ Seed concluído com sucesso!')
  console.log('   Admin: andrevileladev@gmail.com / admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
