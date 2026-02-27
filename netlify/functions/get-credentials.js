/**
 * Netlify Function: Obter Credenciais de Conexão
 */
const { AccessToken } = require("livekit-server-sdk");

exports.handler = async (event, context) => {
  console.log("--- GET-CREDENTIALS REQUISIÇÃO ---");
  console.log("Método:", event.httpMethod);
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const { roomId, persona } = JSON.parse(event.body || "{}");
    console.log(`Solicitando credenciais para Sala: ${roomId}, Persona: ${persona}`);

    if (!roomId || !persona) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "roomId e persona são obrigatórios" })
      };
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error("Variáveis de ambiente do LiveKit não configuradas");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Credenciais do servidor não configuradas" })
      };
    }

    const at = new AccessToken(apiKey, apiSecret);
    at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canPublishData: true });
    const token = at.toJwt();

    const simliApiKey = process.env.SIMLI_API_KEY;
    const simliUserId = process.env.SIMLI_FACE_ID;

    if (!simliApiKey || !simliUserId) {
      console.error("Variáveis de ambiente do Simli não configuradas");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Credenciais do Simli não configuradas" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liveKitToken: token,
        liveKitUrl: wsUrl,
        simliApiKey: simliApiKey,
        simliUserId: simliUserId,
        persona: persona,
        roomId: roomId
      })
    };
  } catch (error) {
    console.error("Erro em get-credentials:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
