export class PontosService {
    buildWhereClause(input) {
        const { lat, lng, raio, residuos, cidade, status, q } = input;
        const where = {};
        if (cidade) {
            where.cidade = { contains: cidade, mode: 'insensitive' };
        }
        if (status) {
            where.status = status;
        }
        else {
            where.status = 'ATIVO';
        }
        if (q) {
            where.nome = { contains: q, mode: 'insensitive' };
        }
        if (residuos) {
            const ids = String(residuos).split(',').map((id) => id.trim()).filter(Boolean);
            if (ids.length) {
                where.residuos = {
                    some: {
                        residuo_id: { in: ids },
                        status: 'CONFIRMADO',
                    },
                };
            }
        }
        if (lat && lng && raio) {
            const latitude = Number(lat);
            const longitude = Number(lng);
            const radiusInDegrees = Number(raio) / 111;
            where.lat = { gte: latitude - radiusInDegrees, lte: latitude + radiusInDegrees };
            where.lng = { gte: longitude - radiusInDegrees, lte: longitude + radiusInDegrees };
        }
        return where;
    }
    validateCreate(input) {
        if (!input.nome || !input.endereco || !input.cidade || input.lat == null || input.lng == null) {
            return { ok: false, error: 'nome, endereco, cidade, lat e lng são obrigatórios' };
        }
        return { ok: true };
    }
    haversine(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    applyDistanceFilter(pontos, lat, lng, raio) {
        if (lat == null || lng == null || raio == null)
            return pontos;
        const latitude = Number(lat);
        const longitude = Number(lng);
        const radiusKm = Number(raio);
        return pontos
            .map((ponto) => ({
            ...ponto,
            distancia: this.haversine(latitude, longitude, ponto.lat, ponto.lng),
        }))
            .filter((ponto) => ponto.distancia <= radiusKm)
            .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
    }
}
