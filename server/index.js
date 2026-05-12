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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Endpoint de salud para verificar servidor
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Categorías predeterminadas
const CATEGORIAS_PREDETERMINADAS = [
  {
    id: 1,
    nombre: "🎉 FIESTAS MEXICANAS",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Qué no puede faltar en una fiesta mexicana?",
        respuestas: [
          { texto: "Tequila", puntos: 45 },
          { texto: "Música", puntos: 25 },
          { texto: "Comida", puntos: 18 },
          { texto: "Familia", puntos: 7 },
          { texto: "Piñata", puntos: 5 }
        ]
      },
      {
        texto: "¿Qué comida es típica en una fiesta?",
        respuestas: [
          { texto: "Tacos", puntos: 50 },
          { texto: "Tamales", puntos: 20 },
          { texto: "Pozole", puntos: 15 },
          { texto: "Mole", puntos: 10 },
          { texto: "Chiles", puntos: 5 }
        ]
      }
    ]
  },
  {
    id: 2,
    nombre: "📺 PROGRAMAS DE TV",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Programa de TV más visto en México?",
        respuestas: [
          { texto: "La Rosa de Guadalupe", puntos: 50 },
          { texto: "El Chavo", puntos: 25 },
          { texto: "Hoy", puntos: 15 },
          { texto: "Noticieros", puntos: 7 },
          { texto: "Acapulco Shore", puntos: 3 }
        ]
      }
    ]
  },
  {
    id: 3,
    nombre: "🍽️ COMIDA LATINA",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Comida latina más popular?",
        respuestas: [
          { texto: "Tacos", puntos: 45 },
          { texto: "Arepas", puntos: 20 },
          { texto: "Empanadas", puntos: 15 },
          { texto: "Ceviche", puntos: 12 },
          { texto: "Pupusas", puntos: 8 }
        ]
      }
    ]
  },
  {
    id: 4,
    nombre: "🎵 MÚSICA LATINA",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Género musical más escuchado?",
        respuestas: [
          { texto: "Reggaetón", puntos: 45 },
          { texto: "Banda", puntos: 25 },
          { texto: "Salsa", puntos: 15 },
          { texto: "Cumbia", puntos: 10 },
          { texto: "Balada", puntos: 5 }
        ]
      }
    ]
  },
  {
    id: 5,
    nombre: "⚽ DEPORTES",
    tipo: "default",
    preguntas: [
      {
        texto: "¿Deporte más popular en México?",
        respuestas: [
          { texto: "Fútbol", puntos: 70 },
          { texto: "Boxeo", puntos: 15 },
          { texto: "Béisbol", puntos: 8 },
          { texto: "Lucha libre", puntos: 5 },
          { texto: "Baloncesto", puntos: 2 }
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
      texto: "Selecciona una categoría y presiona INICIAR",
      respuestas: []
    },
    strikes: 0,
    mensajeJuego: "Bienvenidos al programa",
    ronda: 1,
    categorias: JSON.parse(JSON.stringify(CATEGORIAS_PREDETERMINADAS))
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
    
    console.log(`📺 ${tipo} conectado a sala ${salaId} (${sala.clients.length} clientes)`);
    socket.emit('estado-inicial', sala.gameState);
  });
  
  socket.on('configurar-equipos', ({ salaId, data }) => {
    const sala = salas.get(salaId);
    if (sala) {
      if (data.equipo1) sala.gameState.equipo1Nombre = data.equipo1;
      if (data.equipo2) sala.gameState.equipo2Nombre = data.equipo2;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
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
      console.log(`📌 Sala ${salaId}: Categoría personalizada agregada - ${categoria.nombre}`);
    }
  });
  
  socket.on('cambiar-fase', ({ salaId, fase }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.faseJuego = fase;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
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
  
  socket.on('revelar-respuesta', ({ salaId, index }) => {
    const sala = salas.get(salaId);
    if (sala && sala.gameState.preguntaActual.respuestas[index]) {
      sala.gameState.preguntaActual.respuestas[index].revelada = true;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
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
  
  socket.on('sumar-puntos', ({ salaId, equipo, puntos }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.puntajes[equipo] += puntos;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
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
  
  // ROBO CON EQUIPO ESPECÍFICO
  socket.on('intentar-robo-con-equipo', ({ salaId, equipoOrigen }) => {
    const sala = salas.get(salaId);
    if (sala) {
      const equipoDestino = equipoOrigen === 'equipo1' ? 'equipo2' : 'equipo1';
      const puntosARobar = sala.gameState.puntajes[equipoOrigen];
      
      console.log(`💰 Robo en sala ${salaId}: de ${equipoOrigen} a ${equipoDestino} - ${puntosARobar} pts`);
      
      if (puntosARobar > 0) {
        sala.gameState.puntajes[equipoOrigen] = 0;
        sala.gameState.puntajes[equipoDestino] += puntosARobar;
        sala.gameState.mensajeJuego = `💰 ¡ROBO EXITOSO! ${puntosARobar} puntos transferidos de ${equipoOrigen === 'equipo1' ? sala.gameState.equipo1Nombre : sala.gameState.equipo2Nombre} a ${equipoDestino === 'equipo1' ? sala.gameState.equipo1Nombre : sala.gameState.equipo2Nombre}`;
      } else {
        sala.gameState.mensajeJuego = `❌ ROBO FALLIDO! ${equipoOrigen === 'equipo1' ? sala.gameState.equipo1Nombre : sala.gameState.equipo2Nombre} no tiene puntos`;
      }
      
      sala.gameState.faseJuego = 'esperando';
      sala.gameState.strikes = 0;
      sala.gameState.puntosEnJuego = 0;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  socket.on('siguiente-pregunta', ({ salaId, nuevaPregunta }) => {
    const sala = salas.get(salaId);
    if (sala && nuevaPregunta) {
      sala.gameState.preguntaActual = {
        texto: nuevaPregunta.texto,
        respuestas: nuevaPregunta.respuestas.map(r => ({
          texto: r.texto,
          puntos: r.puntos,
          revelada: false,
          acertada: false
        }))
      };
      sala.gameState.ronda++;
      sala.gameState.faseJuego = 'esperando';
      sala.gameState.equipoActivo = null;
      sala.gameState.strikes = 0;
      sala.gameState.puntosEnJuego = 0;
      sala.gameState.mensajeJuego = "Nueva pregunta. Selecciona quién empieza";
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  socket.on('enviar-mensaje', ({ salaId, mensaje }) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.mensajeJuego = mensaje;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  socket.on('reset-strikes', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState.strikes = 0;
      io.to(salaId).emit('estado-actualizado', sala.gameState);
    }
  });
  
  socket.on('reiniciar-juego', (salaId) => {
    const sala = salas.get(salaId);
    if (sala) {
      sala.gameState = crearEstadoInicial(salaId);
      io.to(salaId).emit('estado-actualizado', sala.gameState);
      console.log(`🔄 Sala ${salaId}: Juego reiniciado`);
    }
  });
  
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
        console.log(`👋 Cliente ${socket.id} salió de sala ${salaId} (${sala.clients.length} restantes)`);
      }
      if (sala.clients.length === 0) {
        salas.delete(salaId);
        console.log(`🗑️ Sala ${salaId} eliminada (sin clientes)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Categorías predeterminadas: ${CATEGORIAS_PREDETERMINADAS.length}`);
});