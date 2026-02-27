/**
 * Netlify Function: Processar Mensagem com OpenAI
 */
const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
  console.log("--- PROCESS-MESSAGE REQUISIÇÃO ---");
  console.log("Método:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const { message, persona, roomId } = JSON.parse(event.body || "{}");
    console.log(`Processando mensagem para Sala: ${roomId}, Persona: ${persona}`);

    if (!message || !persona) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "message e persona são obrigatórios" })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY não configurada");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI API key não configurada" })
      };
    }

    const client = new OpenAI({ apiKey });

    const systemPrompts = {
      "Professor João": "Você é um professor educador experiente, paciente e dedicado. Responda com clareza e didática.",
      "Dra. Maria": "Você é uma terapeuta profissional, empática e atenciosa. Ouça com compreensão.",
      "Amigo Alex": "Você é um amigo companheiro, descontraído e apoiador. Seja amigável e acessível."
    };

    const systemPrompt = systemPrompts[persona] || systemPrompts["Professor João"];

    const response = await client.chat.completions.create({
      model: "gpt-4-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: reply,
        persona: persona,
        roomId: roomId
      })
    };
  } catch (error) {
    console.error("Erro em process-message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
