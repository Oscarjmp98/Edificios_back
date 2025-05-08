import mongoose from 'mongoose';

const aulasSchema = new mongoose.Schema({
    nombre_salon: {
      type: String,
      required: true,
      unique: true
    },
    edificio: {
      type: String
    },
    piso: {
      type: Number
    },
    capacidad_nominal: {
      type: Number
    },
    puestos_contados: {
      type: Number
    },
    tipo_aula: {
        type: String
    },
    tipo_mesa: {
        type: String
    },
    tipo_silla: {
        type: String
    },
    tipo_tablero: {
        type: String
    },
    equipamiento_tecnologico: {
        type: String
    },
    tomacorriente: {
        type: String
    },
    movilidad: {
        type: String
    },
    entorno: {
        type: String
    },
    comentarios: {
        type: [String], // array de equipos si aplica
        default: []
    },
    imagenUrl: {
        type: String
    },
  }, {
    timestamps: true
  });
  
  const Aula = mongoose.model('Aula', aulasSchema);
  
  export default Aula;
  