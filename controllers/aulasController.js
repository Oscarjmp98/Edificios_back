const Aula = require("../models/Aulas")

// Controlador para obtener todos los edificios únicos
exports.getEdificios = async (req, res) => {
  try {
    // Obtener todos los edificios únicos
    const aulas = await Aula.find({}, "edificio")
    const edificiosUnicos = [...new Set(aulas.map((aula) => aula.edificio).filter(Boolean))]

    res.status(200).json(edificiosUnicos)
  } catch (error) {
    console.error("Error al obtener edificios:", error)
    res.status(500).json({ error: "Error en el servidor al obtener edificios" })
  }
}

// Controlador para obtener aulas por edificio
exports.getAulasPorEdificio = async (req, res) => {
  const { edificio } = req.params

  if (!edificio) {
    return res.status(400).json({ error: "Se requiere el parámetro edificio" })
  }

  try {
    // Obtener todas las aulas del edificio especificado
    const aulas = await Aula.find({ edificio }, "nombre_salon imagenUrl")

    res.status(200).json(aulas)
  } catch (error) {
    console.error(`Error al obtener aulas para el edificio ${edificio}:`, error)
    res.status(500).json({ error: "Error en el servidor al obtener aulas" })
  }
}
