import assert from 'node:assert/strict'
import test from 'node:test'

import { criarHorarioSemanaVazio, formatHorarioResumo, validarHorarios } from './horario'
import type { HorarioDia, HorarioSemana } from './types'

function diaFechado(): HorarioDia {
  return { ativo: false, abertura: '', fechamento: '' }
}

function diaAberto(abertura: string, fechamento: string): HorarioDia {
  return { ativo: true, abertura, fechamento }
}

function semana(overrides: Partial<HorarioSemana> = {}): HorarioSemana {
  return {
    seg: diaFechado(),
    ter: diaFechado(),
    qua: diaFechado(),
    qui: diaFechado(),
    sex: diaFechado(),
    sab: diaFechado(),
    dom: diaFechado(),
    ...overrides,
  }
}

test('criarHorarioSemanaVazio começa com todos os dias fechados', () => {
  const horarios = criarHorarioSemanaVazio()
  assert.equal(Object.values(horarios).every((dia) => !dia.ativo), true)
})

test('validarHorarios aceita quando não há conflitos', () => {
  const horarios = semana({ seg: diaAberto('08:00', '17:00') })
  assert.equal(validarHorarios(horarios), null)
})

test('validarHorarios rejeita abertura depois do fechamento', () => {
  const horarios = semana({ seg: diaAberto('18:00', '08:00') })
  assert.match(validarHorarios(horarios) ?? '', /abertura deve ser antes do fechamento/)
})

test('formatHorarioResumo agrupa dias consecutivos com o mesmo horário', () => {
  const horarios = semana({
    seg: diaAberto('08:00', '17:00'),
    ter: diaAberto('08:00', '17:00'),
    qua: diaAberto('08:00', '17:00'),
    qui: diaAberto('08:00', '17:00'),
    sex: diaAberto('08:00', '17:00'),
    sab: diaAberto('08:00', '12:00'),
  })
  assert.equal(formatHorarioResumo(horarios), 'Seg–Sex 08:00–17:00, Sáb 08:00–12:00')
})

test('formatHorarioResumo informa quando está fechado todos os dias', () => {
  assert.equal(formatHorarioResumo(semana()), 'Fechado todos os dias')
})

test('formatHorarioResumo retorna vazio sem horários', () => {
  assert.equal(formatHorarioResumo(null), '')
})
