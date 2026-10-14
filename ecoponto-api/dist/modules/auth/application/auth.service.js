export class AuthService {
    validateRegister(input) {
        if (!input.email || !input.nome || !input.senha) {
            return { ok: false, error: 'email, nome e senha são obrigatórios' };
        }
        if (input.senha.length < 8) {
            return { ok: false, error: 'a senha deve ter pelo menos 8 caracteres' };
        }
        if (!input.cidade?.trim() || !input.estado?.trim()) {
            return { ok: false, error: 'cidade e estado são obrigatórios' };
        }
        if (input.tipo === 'EMPRESA' && (!input.razaoSocial?.trim() || !input.cnpj?.trim() || !input.tipoAtuacao?.trim())) {
            return { ok: false, error: 'razão social, CNPJ e tipo de atuação são obrigatórios para conta empresarial' };
        }
        return { ok: true };
    }
    validateLogin(input) {
        if (!input.email || !input.senha) {
            return { ok: false, error: 'email e senha são obrigatórios' };
        }
        return { ok: true };
    }
    createToken(jwt, user) {
        return jwt.sign({ sub: user.id, role: user.role, tipo: user.tipo });
    }
}
