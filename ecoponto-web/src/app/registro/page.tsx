'use client'
import Link from "next/link";
import { Recycle } from "lucide-react";
import { useState } from "react";

export default function RegistroPage() {
  const [tipo, setTipo] = useState<'fp' | 'emp'>('fp');

  return (
    <main className="min-h-screen bg-[#EFF2EF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-5">

        <div className="flex flex-col gap-1">
          <div className="text-sm text-[#7A9480]">
            ←{" "}
            <Link href="/login" className="text-[#0D9858]">Voltar</Link>
          </div>
          <h2 className="text-xl font-semibold text-[#0F1C12]">Criar conta</h2>
          <p className="text-sm text-[#7A9480]">Como você vai usar o Ecoponto Certo?</p>
        </div>

        {/* Seleção de tipo */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTipo('fp')}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              tipo === 'fp'
                ? 'border-[#0D9858] bg-[#E8F5ED]'
                : 'border-[#D4DAD4] bg-white hover:bg-[#F7F8F7]'
            }`}
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="text-sm font-semibold text-[#0F1C12]">Pessoa Física</div>
            <div className="text-xs text-[#7A9480] mt-1">Quero reciclar e encontrar pontos de coleta</div>
          </button>
          <button
            onClick={() => setTipo('emp')}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              tipo === 'emp'
                ? 'border-[#0D9858] bg-[#E8F5ED]'
                : 'border-[#D4DAD4] bg-white hover:bg-[#F7F8F7]'
            }`}
          >
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-sm font-semibold text-[#0F1C12]">Empresa / Org.</div>
            <div className="text-xs text-[#7A9480] mt-1">Sou ponto de coleta ou compro recicláveis</div>
          </button>
        </div>

        {/* Formulário Pessoa Física */}
        {tipo === 'fp' && (
          <div className="flex flex-col gap-4">
            {[
              { label: "Nome completo", type: "text", placeholder: "Maria Silva" },
              { label: "E-mail", type: "email", placeholder: "maria@email.com" },
              { label: "Senha", type: "password", placeholder: "Mínimo 8 caracteres" },
              { label: "Cidade", type: "text", placeholder: "Guarapari, ES" },
            ].map(({ label, type, placeholder }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#3D5444]">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  className="w-full bg-[#F7F8F7] border border-[#D4DAD4] rounded-lg px-3 py-2.5 text-sm text-[#0F1C12] placeholder:text-[#7A9480] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
                />
              </div>
            ))}
            <button className="w-full bg-[#0D9858] hover:bg-[#0b8048] text-white font-semibold py-2.5 rounded-lg transition-colors">
              Criar conta
            </button>
          </div>
        )}

        {/* Formulário Empresa */}
        {tipo === 'emp' && (
          <div className="flex flex-col gap-4">
            {[
              { label: "Razão social", type: "text", placeholder: "Cooperativa Verde Ltda" },
              { label: "CNPJ", type: "text", placeholder: "00.000.000/0001-00" },
              { label: "E-mail corporativo", type: "email", placeholder: "contato@empresa.com" },
              { label: "WhatsApp / Telefone", type: "tel", placeholder: "(27) 99999-9999" },
            ].map(({ label, type, placeholder }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#3D5444]">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  className="w-full bg-[#F7F8F7] border border-[#D4DAD4] rounded-lg px-3 py-2.5 text-sm text-[#0F1C12] placeholder:text-[#7A9480] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#3D5444]">Tipo de atuação</label>
              <select className="w-full bg-[#F7F8F7] border border-[#D4DAD4] rounded-lg px-3 py-2.5 text-sm text-[#0F1C12] focus:outline-none focus:ring-2 focus:ring-[#0D9858]">
                <option>Cooperativa de reciclagem</option>
                <option>Ecoponto / Ponto de coleta</option>
                <option>Empresa compradora de recicláveis</option>
                <option>Catador(a) independente</option>
                <option>Órgão público / Prefeitura</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#3D5444]">Cidade</label>
              <input
                type="text"
                placeholder="Guarapari, ES"
                className="w-full bg-[#F7F8F7] border border-[#D4DAD4] rounded-lg px-3 py-2.5 text-sm text-[#0F1C12] placeholder:text-[#7A9480] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
              />
            </div>
            <button className="w-full bg-[#0D9858] hover:bg-[#0b8048] text-white font-semibold py-2.5 rounded-lg transition-colors">
              Criar conta empresarial
            </button>
            <p className="text-xs text-center text-[#7A9480]">Conta empresarial passa por verificação em até 24h</p>
          </div>
        )}

        <p className="text-sm text-center text-[#7A9480]">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#0D9858] font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
