export class AuthService {
    validateRegister(input) {
        if (!input.email || !input.nome || !input.senha) {
            return { ok: false, error: 'email, nome e senha são obrigatórios' };
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
