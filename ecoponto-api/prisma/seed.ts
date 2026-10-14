import { PrismaClient, StatusResiduo, TipoUsuario, RoleUsuario } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── 1. Resíduos padrão ──────────────────────────────────────────────────
  console.log('♻️  Criando tipos de resíduos...')

  const residuos = await Promise.all([
    prisma.residuo.upsert({
      where: { nome: 'Vidro' },
      update: {},
      create: { nome: 'Vidro',             cor: '#2563EB', icone: 'Wine',         status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Papel / Papelão' },
      update: {},
      create: { nome: 'Papel / Papelão',   cor: '#0891B2', icone: 'Newspaper',    status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Plástico' },
      update: {},
      create: { nome: 'Plástico',          cor: '#DC2626', icone: 'Package',      status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Metal / Alumínio' },
      update: {},
      create: { nome: 'Metal / Alumínio',  cor: '#D97706', icone: 'Layers',       status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Eletrônicos' },
      update: {},
      create: { nome: 'Eletrônicos',       cor: '#7C3AED', icone: 'Cpu',          status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Óleo de cozinha' },
      update: {},
      create: { nome: 'Óleo de cozinha',   cor: '#EA580C', icone: 'Droplets',     status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Pilhas e Baterias' },
      update: {},
      create: { nome: 'Pilhas e Baterias', cor: '#DB2777', icone: 'Battery',      status: StatusResiduo.APROVADO },
    }),
    prisma.residuo.upsert({
      where: { nome: 'Tetra Pak' },
      update: {},
      create: { nome: 'Tetra Pak',         cor: '#059669', icone: 'Milk',         status: StatusResiduo.APROVADO },
    }),
  ])

  console.log(`   ✓ ${residuos.length} tipos de resíduos criados`)

  // ─── 2. Usuário admin ────────────────────────────────────────────────────
  console.log('👤 Criando usuário admin...')

  const senhaSeed = process.env.SEED_DEFAULT_PASSWORD ?? 'admin123'
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_DEFAULT_PASSWORD) {
    throw new Error('Defina SEED_DEFAULT_PASSWORD antes de executar o seed em produção.')
  }

  const senhaHash = await bcrypt.hash(senhaSeed, 10)

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

  // Garante senha caso o upsert tenha caído no update (senha_hash null)
  await prisma.usuario.updateMany({
    where: { id: admin.id, senha_hash: null },
    data: { senha_hash: senhaHash },
  })

  console.log(`   ✓ Admin: ${admin.email}`)

  console.log('\n✅ Seed concluído com sucesso!')
  console.log(`   Admin: andrevileladev@gmail.com / ${senhaSeed}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
