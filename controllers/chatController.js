import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Aula from '../models/Aula.js';
import dotenv from 'dotenv';

dotenv.config();

export const getAulas = async (req, res) => {
  try {
    const aulas = await Aula.find({}, 'nombre_salon imagenUrl');
    res.json(aulas);
  } catch (error) {
    console.error('Error al obtener las Aulas:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener las Aulas' });
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

 // Detectar qué tipo de información está buscando el usuario
 const fieldMapping = {
  "nombre": "nombre_salon",
  "edificio": "edificio",
  "tipo": "tipo_aula",
  "mesa": "tipo_mesa",
  "silla": "tipo_silla",
  "tablero": "tipo_tablero",
  "equipamiento": "equipamiento_tecnologico",
  "comentarios": "comentarios"
};

// Identificar campos relevantes según la pregunta
let searchFields = Object.entries(fieldMapping)
  .filter(([key]) => prompt.toLowerCase().includes(key))
  .map(([, field]) => field);

// Si no se detectaron términos específicos, buscar en todos los campos
if (searchFields.length === 0) {
  searchFields = Object.values(fieldMapping);
}

// Consulta optimizada en MongoDB
const aulas = await Aula.aggregate([
  {
    $search: {
      index: "default",
      text: {
        query: prompt,
        path: searchFields, // Filtrar dinámicamente según la consulta
        fuzzy: {
          maxEdits: 2,
          prefixLength: 2,
          maxExpansions: 50
        }
      }
    }
  },
  {
    $project: {
      nombre_salon: 1,
      edificio: 1,
      tipo_aula: 1,
      equipamiento_tecnologico: 1,
      puntuacion: { $meta: "searchScore" } // Prioriza resultados más relevantes
    }
  },
  { $sort: { puntuacion: -1 } }, // Ordena por relevancia
  { $limit: 5 } // Retorna los cinco resultados más relevantes
]);

let response;

if (aulas.length > 0) {
  response = `🔎 He encontrado las siguientes aulas que podrían interesarte:\n\n`;
  aulas.forEach((aula, index) => {
    response += `🟢 **Aula ${index + 1}:**\n`;
    if (searchFields.includes("nombre_salon")) response += `- **Nombre:** ${aula.nombre_salon}\n`;
    if (searchFields.includes("edificio")) response += `- **Ubicación:** ${aula.edificio}\n`;
    if (searchFields.includes("tipo_aula")) response += `- **Tipo:** ${aula.tipo_aula}\n`;
    if (searchFields.includes("equipamiento_tecnologico")) response += `- **Equipamiento:** ${aula.equipamiento_tecnologico || "No especificado"}\n`;
    response += `\n`;
  });

  response += "Espero que esta información te sea útil. ¿Necesitas algún otro detalle? 😊";
} else {
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Eres un asistente virtual especializado en aulas y su equipamiento, proporcionando respuestas claras y detalladas." },
      { role: "user", content: prompt }
    ],
  });

  response = aiResponse.choices[0]?.message?.content || "Lo siento, no encontré información relevante en la base de datos.";

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


export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('❌ Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};
