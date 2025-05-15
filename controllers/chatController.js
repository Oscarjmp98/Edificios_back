import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Aula from '../models/Aula.js';
import dotenv from 'dotenv';

dotenv.config();

//////////////////// Obtener Edificios ////////////////////

export async function getEdificios(req, res) {
  try {
    const aulas = await Aula.find({}, "edificio");
    const edificiosUnicos = [...new Set(aulas.map((aula) => aula.edificio).filter(Boolean))];
    res.status(200).json(edificiosUnicos);
  } catch (error) {
    console.error("Error al obtener edificios:", error);
    res.status(500).json({ error: "Error en el servidor al obtener edificios" });
  }
}

export async function getAulasPorEdificio(req, res) {
  const { edificio } = req.params;

  if (!edificio) {
    return res.status(400).json({ error: "Se requiere el parámetro edificio" });
  }

  try {
    // Modificado para incluir todos los campos necesarios
    const aulas = await Aula.find({ edificio });
    res.status(200).json(aulas);
  } catch (error) {
    console.error(`Error al obtener aulas para el edificio ${edificio}:`, error);
    res.status(500).json({ error: "Error en el servidor al obtener aulas" });
  }
}

//////////////////// Obtener Aulas ////////////////////

export const getAulas = async (req, res) => {
  try {
    const aulas = await Aula.find({}, 'nombre_salon imagenUrl');
    res.json(aulas);
  } catch (error) {
    console.error('Error al obtener las Aulas:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener las Aulas' });
  }
};

//////////////////// Configurar OpenAI ////////////////////

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

//////////////////// Generar Respuesta ////////////////////

export const generateChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    const aulas = await Aula.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: prompt,
            path: [
              "nombre_salon", "edificio", "tipo_aula", "tipo_mesa", "tipo_silla",
              "tipo_tablero", "equipamiento_tecnologico", "comentarios"
            ],
            fuzzy: { maxEdits: 2, prefixLength: 0, maxExpansions: 50 }
          }
        }
      },
      { $limit: 3 } // puedes ajustar el límite según tus necesidades
    ]);

    let response;

    if (aulas.length > 0) {
  const aula = aulas[0];

  const contextText = `Salón: ${aula.nombre_salon}, Edificio: ${aula.edificio}, Piso: ${aula.piso}, Capacidad: ${aula.capacidad_nominal}, Equipamiento: ${aula.equipamiento_tecnologico}, Comentarios: ${aula.comentarios || "Ninguno"}`;

  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Responde de forma clara y amigable al usuario usando la siguiente información del salón disponible."
      },
      {
        role: "user",
        content: `Con base en esta información: ${contextText}, responde a la siguiente pregunta: ${prompt}`
      }
    ]
  });

  response = aiResponse.choices[0]?.message?.content || "No encontré una respuesta adecuada.";
} else {
      // Si no se encuentran aulas relevantes, usa solo el prompt original
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      response = aiResponse.choices[0]?.message?.content || "No encontré una respuesta adecuada.";
    }

    const newConversation = new Conversation({ prompt, response });
    await newConversation.save();

    res.json({ response });
  } catch (error) {
    console.error('❌ Error al generar la respuesta:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
  }
};


//////////////////// Historial ////////////////////

export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('❌ Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};
