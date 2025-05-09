import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Aula from '../models/Aula.js';
import dotenv from 'dotenv';

dotenv.config();
///////////////////////////////////////////// Obtener las Edificios /////////////////////////////////////////////////////////////////////

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { edificio } = req.query

  if (!edificio) {
    return res.status(400).json({ error: "Se requiere el parámetro edificio" })
  }

  try {
    await connectDB()

    // Obtener todas las aulas del edificio especificado
    const aulas = await Aula.find({ edificio }, "nombre_salon imagenUrl")

    res.status(200).json(aulas)
  } catch (error) {
    console.error(`Error al obtener aulas para el edificio ${edificio}:`, error)
    res.status(500).json({ error: "Error en el servidor al obtener aulas" })
  }
}


///////////////////////////////////////////// Obtener las Aulas /////////////////////////////////////////////////////////////////////

export const getAulas = async (req, res) => {
  try {
    const aulas = await Aula.find({}, 'nombre_salon imagenUrl');
    res.json(aulas);
  } catch (error) {
    console.error('Error al obtener las Aulas:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener las Aulas' });
  }
}

// Configurar OpenAI con manejo de errores mejorado
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno OPENAI_API_KEY no está definida');
  }

  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar OpenAI:', error);
}


export const generateChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    // Consultar en MongoDB en lugar de OpenAI
    const aulas = await Aula.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: prompt,
            path: ["nombre_salon", "edificio", "tipo_aula", "tipo_mesa", "tipo_silla", "tipo_tablero", "equipamiento_tecnologico", "comentarios"],
            fuzzy: {
              maxEdits: 2,
              prefixLength: 0,
              maxExpansions: 50
            }
          }
        }
      },
      { $limit: 1 }
    ]);
    

    let response;

    if (aulas.length > 0) {
      response = JSON.stringify(aulas[0]); // o formatea la info
    } else {
      // Si no se encuentra en la DB, solicitar respuesta de OpenAI
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      response = aiResponse.choices[0]?.message?.content || "No encontré una respuesta adecuada.";

      // Guardar la nueva conversación en MongoDB
      const newConversation = new Conversation({ prompt, response });
      await newConversation.save();
    }

    res.json({ response });
  } catch (error) {
    console.error('❌ Error al generar la respuesta:', error);
    res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message,
    });
  }
};

// Obtener historial de conversaciones
export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('❌ Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};
