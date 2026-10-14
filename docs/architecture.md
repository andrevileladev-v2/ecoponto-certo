# Arquitetura proposta

## Backend

- domain: entidades, regras e contratos
- application: services e use-cases
- infrastructure: Prisma, auth, providers externos
- presentation: controllers e rotas

## Frontend

- features: módulos com UI, API, hooks, estado e tipos
- shared: componentes, utilitários e lib reutilizáveis
- app: integração com páginas e layouts

## Testes

- unit: services, validators e mapeamentos
- controller: status, payload e delegação
- integration: rotas completas

A ideia é manter o Fastify por enquanto e evoluir em módulos, sem trocar framework antes da arquitetura estar madura.
