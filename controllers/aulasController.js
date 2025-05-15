import Aula from "../models/Aula.js";

// Obtener edificios únicos
export const getEdificios = async (req, res) => {
  try {
    const aulas = await Aula.find({}, "edificio");
    const edificiosUnicos = [...new Set(aulas.map((aula) => aula.edificio).filter(Boolean))];
    res.status(200).json(edificiosUnicos);
  } catch (error) {
    console.error("Error al obtener edificios:", error);
    res.status(500).json({ error: "Error en el servidor al obtener edificios" });
  }
};

// Obtener aulas por edificio
export const getAulasPorEdificio = async (req, res) => {
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
};


