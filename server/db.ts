export async function getDb() { return null; }
export async function upsertUser(user: any) { return; }
export async function getUserByOpenId(openId: string) { return undefined; }
export async function getCandidatoBySlug(slug: string) { return undefined; }
export async function getCandidatosByUserId(userId: number) { return []; }
export async function createCandidato(data: any) { return null; }
export async function updateCandidato(id: number, data: any) { return; }
export async function getInteracoesByCandidatoId(candidatoId: number, limit = 100) { return []; }
export async function getTodasInteracoes(limit = 200) { return []; }
export async function getEstatisticasInteracoes(candidatoId?: number) { return { total: 0, hoje: 0, mediaTempo: 0 }; }
export async function getSantinhoByToken(token: string) { return undefined; }
export async function usarSantinho(token: string, ipHash?: string) { return; }
export async function incrementarPerguntasSantinho(token: string) { return; }
export async function criarSantinhos(data: any[]) { return; }
export async function getSantinhosByCandidatoId(candidatoId: number) { return []; }
