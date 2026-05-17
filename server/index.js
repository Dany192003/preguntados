const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Categorías predeterminadas - Edición Día de la Madre
const CATEGORIAS_PREDETERMINADAS = [
  {
    id: 1,
    nombre: "🍼 PARA CALMAR A UN BEBÉ",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué haces para que un bebé deje de llorar?",
        respuestas: [
          { texto: "Darle leche", puntos: 45 },
          { texto: "Cargarlo y mecerlo", puntos: 25 },
          { texto: "Cantarle o ponerle música", puntos: 15 },
          { texto: "Cambiarle el pañal", puntos: 10 },
          { texto: "Salir a caminar con él", puntos: 5 }
        ]
      }
    ]
  },
  {
    id: 2,
    nombre: "🗣️ FRASES TÍPICAS DE MAMÁ",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué frase típica dices como mamá?",
        respuestas: [
          { texto: "Porque lo digo yo y ya", puntos: 35 },
          { texto: "No tengo favoritos, los quiero igual", puntos: 25 },
          { texto: "Cuando tengas tus hijos vas a entender", puntos: 20 },
          { texto: "Le voy a decir a tu papá", puntos: 12 },
          { texto: "No te mandas solo", puntos: 8 }
        ]
      }
    ]
  },
  {
    id: 3,
    nombre: "🎁 REGALOS POPULARES PARA MAMÁ",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué regalo le gusta más a una mamá?",
        respuestas: [
          { texto: "Ropa o zapatos", puntos: 30 },
          { texto: "Perfume o cremas", puntos: 25 },
          { texto: "Una comida hecha por sus hijos", puntos: 20 },
          { texto: "Flores", puntos: 15 },
          { texto: "Una tarjeta hecha a mano", puntos: 10 }
        ]
      }
    ]
  },
  {
    id: 4,
    nombre: "👋 CON QUÉ PEGAS A TUS HIJOS",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Con qué le pegas a tus hijos?",
        respuestas: [
          { texto: "La chancla", puntos: 50 },
          { texto: "El cincho", puntos: 20 },
          { texto: "La mano", puntos: 15 },
          { texto: "Una rama", puntos: 10 },
          { texto: "Una escoba", puntos: 5 }
        ]
      }
    ]
  },
  {
    id: 5,
    nombre: "🏫 RUTINA ANTES DE LA ESCUELA",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué haces con tus hijos antes de llevarlos a la escuela?",
        respuestas: [
          { texto: "Despertarlos", puntos: 30 },
          { texto: "Darles de desayunar", puntos: 25 },
          { texto: "Buscar su uniforme", puntos: 20 },
          { texto: "Peinarlos aunque no quieran", puntos: 15 },
          { texto: "Revisar que lleven todo", puntos: 10 }
        ]
      }
    ]
  },
  {
    id: 6,
    nombre: "☕ MARCAS DE CAFÉ",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué café prefieres?",
        respuestas: [
          { texto: "Café Quetzal", puntos: 40 },
          { texto: "Café Jarillita", puntos: 25 },
          { texto: "Nescafé", puntos: 20 },
          { texto: "Inscafé", puntos: 15 }
        ]
      }
    ]
  },
  {
    id: 7,
    nombre: "🧹 QUÉ TE MOLESTA QUE NO HAGAN",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué es lo que más te molesta que tus hijos NO hagan?",
        respuestas: [
          { texto: "Recoger su cuarto", puntos: 35 },
          { texto: "Lavar sus propios trastes", puntos: 25 },
          { texto: "Hacer la tarea", puntos: 20 },
          { texto: "Bañarse sin que se lo digas", puntos: 12 },
          { texto: "No dejar el teléfono", puntos: 8 }
        ]
      }
    ]
  },
  {
    id: 8,
    nombre: "😅 MENTIRAS TÍPICAS DE HIJOS",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Cuál es la mentira más común que te dicen tus hijos?",
        respuestas: [
          { texto: "Ya hice la tarea", puntos: 40 },
          { texto: "No fui yo", puntos: 25 },
          { texto: "Ya me bañé", puntos: 15 },
          { texto: "Ya recogí mi cuarto", puntos: 12 },
          { texto: "Me duele la panza para no ir a la escuela", puntos: 8 }
        ]
      }
    ]
  }
];

function crearEstadoInicial(salaId) {
  return {
    salaId: salaId,
    equipo1Nombre: "EQUIPO 1",
    equipo2Nombre: "EQUIPO 2",
    faseJuego: "esperando",
    equipoActivo: null,
    puntajes: { equipo1: 0, equipo2: 0 },
    puntosEnJuego: 0,
    preguntaActual: {
      texto: "Selecciona categorías y presiona INICIAR",
      respuestas: []
    },
    strikes: 0,
    mensajeJuego: "Bienvenidos al programa",
    ronda: 1,
    categorias: JSON.parse(JSON.stringify(CATEGORIAS_PREDETERMINADAS)),
    // Nuevas propiedades para rondas múltiples
    categoriasSeleccionadasRonda: [],
    rondaActualCategoria: 0,
    categoriaActual: null,
    juegoIniciado: false
  };
}

const salas = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('identificar', ({ tipo, salaId }) => {
    if (!salaId) return;
    
    let sala = salas.get(salaId);
    if (!sala) {
      sala = {
        id: salaId,
        gameState: crearEstadoInicial(salaId),
        clients: []
      };
      salas.set(salaId, sala);
      console.log(`📌 Sala ${salaId} creada`);
    }
    
    socket.join(salaId);
    if (!sala.clients.includes(socket.id)) {
      sala.clients.push(socket.id);
    }
    
    console.log(`📺 ${tipo} conectado a sala ${salaId}`);
    socket.emit('estado-inicial', sala.gameState);
  });
  
  // CONFIGURAR EQUIPOS
  socket.on('configurar-equipos', ({ salaId, data }) => {
    const sala = salas.get(salaId);
    if (sala) {
      if (data.equipo1) sala.gameState.equipo1Nombre = data.equipo1;
      if (data.equipo2) sala.gameState.equipo2Nombre = data.equipo2;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // SELECCIONAR CATEGORÍAS PARA LA RONDA
  socket.on('seleccionar-categorias-ronda', ({ salaId, categoriasIds }) => {
    const sala = salas.get(salaId);
    if (sala) {
      const categoriasSeleccionadas = sala.gameState.categorias.filter(c => 
        categoriasIds.includes(c.id)
      );
      sala.gameState.categoriasSeleccionadasRonda = categoriasSeleccionadas;
      sala.gameState.rondaActualCategoria = 0;
      console.log(`📢 Sala ${salaId}: Categorías seleccionadas: ${categoriasSeleccionadas.map(c => c.nombre).join(', ')}`);
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // INICIAR JUEGO CON CATEGORÍAS SELECCIONADAS
  socket.on('iniciar-juego-ronda', (salaId) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.categoriasSeleccionadasRonda.length > 0) {
      sala.gameState.juegoIniciado = true;
      sala.gameState.rondaActualCategoria = 0;
      sala.gameState.preguntaActualIndex = 0;
      cargarPrimeraPregunta(sala, salaId);
    }
  });
  
  function cargarPrimeraPregunta(sala, salaId) {
    if (sala.gameState.categoriasSeleccionadasRonda.length === 0) return;
    
    const primeraCategoria = sala.gameState.categoriasSeleccionadasRonda[0];
    sala.gameState.categoriaActual = primeraCategoria;
    
    if (primeraCategoria.preguntas && primeraCategoria.preguntas.length > 0) {
      const primeraPregunta = primeraCategoria.preguntas[0];
      sala.gameState.preguntaActual = {
        texto: primeraPregunta.texto,
        respuestas: primeraPregunta.respuestas.map(r => ({
          texto: r.texto,
          puntos: r.puntos,
          revelada: false,
          acertada: false
        }))
      };
      sala.gameState.mensajeJuego = `🎮 Ronda iniciada con ${sala.gameState.categoriasSeleccionadasRonda.length} categorías. Categoría 1: ${primeraCategoria.nombre}`;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  }
  
  // SIGUIENTE PREGUNTA DENTRO DE LA MISMA CATEGORÍA
  socket.on('siguiente-pregunta-categoria', ({ salaId }) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.categoriaActual) {
      const preguntas = sala.gameState.categoriaActual.preguntas;
      const indiceActual = sala.gameState.preguntaActualIndex || 0;
      
      if (indiceActual + 1 < preguntas.length) {
        // Siguiente pregunta de la misma categoría
        sala.gameState.preguntaActualIndex = indiceActual + 1;
        const siguientePregunta = preguntas[indiceActual + 1];
        sala.gameState.preguntaActual = {
          texto: siguientePregunta.texto,
          respuestas: siguientePregunta.respuestas.map(r => ({
            texto: r.texto,
            puntos: r.puntos,
            revelada: false,
            acertada: false
          }))
        };
        sala.gameState.faseJuego = 'esperando';
        sala.gameState.equipoActivo = null;
        sala.gameState.strikes = 0;
        sala.gameState.puntosEnJuego = 0;
        sala.gameState.mensajeJuego = `📢 Nueva pregunta de la categoría ${sala.gameState.categoriaActual.nombre}`;
        io.to(salaId).emit('estado-actualizado', sala.gameState);
      } else {
        // Cambiar a la siguiente categoría
        socket.emit('siguiente-categoria', salaId);
      }
    }
  });
  
  // SIGUIENTE CATEGORÍA
  socket.on('siguiente-categoria', (salaId) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.categoriasSeleccionadasRonda.length > 0) {
      const nuevoIndice = sala.gameState.rondaActualCategoria + 1;
      
      if (nuevoIndice < sala.gameState.categoriasSeleccionadasRonda.length) {
        sala.gameState.rondaActualCategoria = nuevoIndice;
        sala.gameState.categoriaActual = sala.gameState.categoriasSeleccionadasRonda[nuevoIndice];
        sala.gameState.preguntaActualIndex = 0;
        
        const primeraPregunta = sala.gameState.categoriaActual.preguntas[0];
        sala.gameState.preguntaActual = {
          texto: primeraPregunta.texto,
          respuestas: primeraPregunta.respuestas.map(r => ({
            texto: r.texto,
            puntos: r.puntos,
            revelada: false,
            acertada: false
          }))
        };
        sala.gameState.faseJuego = 'esperando';
        sala.gameState.equipoActivo = null;
        sala.gameState.strikes = 0;
        sala.gameState.puntosEnJuego = 0;
        sala.gameState.mensajeJuego = `🎯 Nueva categoría: ${sala.gameState.categoriaActual.nombre} (${nuevoIndice + 1}/${sala.gameState.categoriasSeleccionadasRonda.length})`;
        io.to(salaId).emit('estado-actualizado', sala.gameState);
      } else {
        // Terminar ronda
        sala.gameState.juegoIniciado = false;
        sala.gameState.mensajeJuego = `🏆 ¡Ronda completada! Puntaje final: ${sala.gameState.equipo1Nombre}: ${sala.gameState.puntajes.equipo1} - ${sala.gameState.equipo2Nombre}: ${sala.gameState.puntajes.equipo2}`;
        sala.gameState.categoriasSeleccionadasRonda = [];
        sala.gameState.categoriaActual = null;
        io.to(salaId).emit('estado-actualizado', sala.gameState);
      }
    }
  });
  
  // AGREGAR CATEGORÍA PERSONALIZADA
  socket.on('agregar-categoria', ({ salaId, categoria }) => {
    const sala = salas.get(salaId);
    if (sala) {
      const nuevaCategoria = {
        id: Date.now(),
        nombre: categoria.nombre,
        tipo: 'custom',
        preguntas: categoria.preguntas
      };
      sala.gameState.categorias.push(nuevaCategoria);
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // CAMBIAR FASE
  socket.on('cambiar-fase', ({ salaId, fase }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.faseJuego = fase;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // GANA MANO A MANO
  socket.on('gana-manoamano', ({ salaId, equipo }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.equipoActivo = equipo;
      sala.gameState.faseJuego = 'controles';
      sala.gameState.strikes = 0;
      sala.gameState.mensajeJuego = `${equipo === 'equipo1' ? sala.gameState.equipo1Nombre : sala.gameState.equipo2Nombre} tiene el control`;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // REVELAR RESPUESTA
  socket.on('revelar-respuesta', ({ salaId, index }) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.preguntaActual.respuestas[index]) {
      sala.gameState.preguntaActual.respuestas[index].revelada = true;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // ACERTAR RESPUESTA
  socket.on('acertar-respuesta', ({ salaId, index }) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.preguntaActual.respuestas[index] &&
        !sala.gameState.preguntaActual.respuestas[index].acertada &&
        sala.gameState.preguntaActual.respuestas[index].revelada) {
      
      const puntos = sala.gameState.preguntaActual.respuestas[index].puntos;
      sala.gameState.preguntaActual.respuestas[index].acertada = true;
      sala.gameState.puntosEnJuego += puntos;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // SUMAR PUNTOS
  socket.on('sumar-puntos', ({ salaId, equipo, puntos }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.puntajes[equipo] += puntos;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // REGISTRAR FALLO
  socket.on('registrar-fallo', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.strikes++;
      sala.gameState.mensajeJuego = `❌ FALLO! Strike ${sala.gameState.strikes}/3`;
      
      if (sala.gameState.strikes >= 3) {
        sala.gameState.faseJuego = 'robo';
        sala.gameState.mensajeJuego = `⚠️ 3 STRIKES! La otra equipo puede ROBAR ${sala.gameState.puntosEnJuego} puntos`;
      }
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // ROBAR PUNTOS
  socket.on('intentar-robo-con-equipo', ({ salaId, equipoOrigen }) => {
    const sala = salas.get(salaId);
    if (sala) {
      const equipoDestino = equipoOrigen === 'equipo1' ? 'equipo2' : 'equipo1';
      const puntosARobar = sala.gameState.puntajes[equipoOrigen];
      
      if (puntosARobar > 0) {
        sala.gameState.puntajes[equipoOrigen] = 0;
        sala.gameState.puntajes[equipoDestino] += puntosARobar;
        sala.gameState.mensajeJuego = `💰 ¡ROBO EXITOSO! ${puntosARobar} puntos transferidos`;
      } else {
        sala.gameState.mensajeJuego = `❌ ROBO FALLIDO! No hay puntos para robar`;
      }
      
      sala.gameState.faseJuego = 'esperando';
      sala.gameState.strikes = 0;
      sala.gameState.puntosEnJuego = 0;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // RESET STRIKES
  socket.on('reset-strikes', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.strikes = 0;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // ENVIAR MENSAJE
  socket.on('enviar-mensaje', ({ salaId, mensaje }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.mensajeJuego = mensaje;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // REINICIAR JUEGO
  socket.on('reiniciar-juego', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState = crearEstadoInicial(salaId);
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  // CERRAR SALA
  socket.on('cerrar-sala', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      io.to(salaId).emit('sala-cerrada');
      salas.delete(salaId);
      console.log(`🚪 Sala ${salaId} cerrada`);
    }
  });
  
  socket.on('disconnect', () => {
    for (const [salaId, sala] of salas) {
      const index = sala.clients.indexOf(socket.id);
      if (index !== -1) {
        sala.clients.splice(index, 1);
      }
      if (sala.clients.length === 0) {
        salas.delete(salaId);
        console.log(`🗑️ Sala ${salaId} eliminada`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📋 Categorías predeterminadas: ${CATEGORIAS_PREDETERMINADAS.length}`);
});