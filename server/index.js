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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// UNA SOLA CATEGORÍA CON TODAS LAS PREGUNTAS DEL DÍA DE LA MADRE
const CATEGORIAS_PREDETERMINADAS = [
  {
    id: 1,
    nombre: "🎉 ESPECIAL DÍA DE LA MADRE",
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
      },
      {
        texto: "¿Qué frase típica dices como mamá?",
        respuestas: [
          { texto: "Porque lo digo yo y ya", puntos: 35 },
          { texto: "No tengo favoritos, los quiero igual", puntos: 25 },
          { texto: "Cuando tengas tus hijos vas a entender", puntos: 20 },
          { texto: "Le voy a decir a tu papá", puntos: 12 },
          { texto: "No te mandas solo", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué regalo le gusta más a una mamá?",
        respuestas: [
          { texto: "Ropa o zapatos", puntos: 30 },
          { texto: "Perfume o cremas", puntos: 25 },
          { texto: "Una comida hecha por sus hijos", puntos: 20 },
          { texto: "Flores", puntos: 15 },
          { texto: "Una tarjeta hecha a mano", puntos: 10 }
        ]
      },
      {
        texto: "¿Con qué le pegas a tus hijos?",
        respuestas: [
          { texto: "La chancla", puntos: 50 },
          { texto: "El cincho", puntos: 20 },
          { texto: "La mano", puntos: 15 },
          { texto: "Una rama", puntos: 10 },
          { texto: "Una escoba", puntos: 5 }
        ]
      },
      {
        texto: "¿Qué haces con tus hijos antes de llevarlos a la escuela?",
        respuestas: [
          { texto: "Despertarlos", puntos: 30 },
          { texto: "Darles de desayunar", puntos: 25 },
          { texto: "Buscar su uniforme", puntos: 20 },
          { texto: "Peinarlos aunque no quieran", puntos: 15 },
          { texto: "Revisar que lleven todo", puntos: 10 }
        ]
      },
      {
        texto: "¿Qué café prefieres?",
        respuestas: [
          { texto: "Café Quetzal", puntos: 40 },
          { texto: "Café Jarillita", puntos: 25 },
          { texto: "Nescafé", puntos: 20 },
          { texto: "Inscafé", puntos: 15 }
        ]
      },
      {
        texto: "¿Qué es lo que más te molesta que tus hijos NO hagan?",
        respuestas: [
          { texto: "Recoger su cuarto", puntos: 35 },
          { texto: "Lavar sus propios trastes", puntos: 25 },
          { texto: "Hacer la tarea", puntos: 20 },
          { texto: "Bañarse sin que se lo digas", puntos: 12 },
          { texto: "No dejar el teléfono", puntos: 8 }
        ]
      },
      {
        texto: "¿Cuál es la mentira más común que te dicen tus hijos?",
        respuestas: [
          { texto: "Ya hice la tarea", puntos: 40 },
          { texto: "No fui yo", puntos: 25 },
          { texto: "Ya me bañé", puntos: 15 },
          { texto: "Ya recogí mi cuarto", puntos: 12 },
          { texto: "Me duele la panza para no ir a la escuela", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué marca de chancla es la más efectiva?",
        respuestas: [
          { texto: "Las del mercado de hule grueso", puntos: 40 },
          { texto: "Las de marca Reebok/Nike", puntos: 25 },
          { texto: "Las de la tiendita de la esquina", puntos: 18 },
          { texto: "Las de cuero de la abuela", puntos: 10 },
          { texto: "Las de los chinos", puntos: 7 }
        ]
      },
      {
        texto: "¿Qué hace tu mamá cuando te portas mal?",
        respuestas: [
          { texto: "Te regaña fuerte", puntos: 35 },
          { texto: "Te quita el celular", puntos: 25 },
          { texto: "Te pone a hacer oficio", puntos: 20 },
          { texto: "Te deja sin salida", puntos: 12 },
          { texto: "Le dice a tu papá", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué comida te hace tu mamá cuando estás triste?",
        respuestas: [
          { texto: "Sopa de fideo", puntos: 30 },
          { texto: "Arroz con pollo", puntos: 25 },
          { texto: "Pozole", puntos: 20 },
          { texto: "Tamales", puntos: 15 },
          { texto: "Un pastel", puntos: 10 }
        ]
      },
      {
        texto: "¿Qué es lo que más extrañas de tu mamá cuando no está?",
        respuestas: [
          { texto: "Su comida", puntos: 35 },
          { texto: "Sus consejos", puntos: 25 },
          { texto: "Sus abrazos", puntos: 20 },
          { texto: "Que me consienta", puntos: 12 },
          { texto: "Que me pele con ella", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué hace tu mamá para consentirte?",
        respuestas: [
          { texto: "Te cocina lo que te gusta", puntos: 35 },
          { texto: "Te da dinero extra", puntos: 25 },
          { texto: "Te compra ropa", puntos: 20 },
          { texto: "Te deja dormir hasta tarde", puntos: 12 },
          { texto: "Te da un abrazo", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué odia hacer tu mamá?",
        respuestas: [
          { texto: "Planchar ropa", puntos: 35 },
          { texto: "Lavar los trastes", puntos: 25 },
          { texto: "Barrer y trapear", puntos: 20 },
          { texto: "Hacer el super", puntos: 12 },
          { texto: "Pagar cuentas", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué es lo que más le gusta ver a tu mamá en la tele?",
        respuestas: [
          { texto: "Telenovelas", puntos: 40 },
          { texto: "Noticias", puntos: 25 },
          { texto: "Programas de chisme", puntos: 15 },
          { texto: "Películas de comedia", puntos: 12 },
          { texto: "Concursos", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué hace tu mamá cuando está feliz?",
        respuestas: [
          { texto: "Canta", puntos: 35 },
          { texto: "Baila", puntos: 25 },
          { texto: "Cocina algo especial", puntos: 20 },
          { texto: "Nos abraza", puntos: 12 },
          { texto: "Nos da dinero", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué hace tu mamá cuando está enojada?",
        respuestas: [
          { texto: "No nos habla", puntos: 40 },
          { texto: "Nos regaña", puntos: 25 },
          { texto: "Tira la chancla", puntos: 15 },
          { texto: "Se encierra en su cuarto", puntos: 12 },
          { texto: "Nos quita el celular", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué es lo que más le gusta comprar a tu mamá?",
        respuestas: [
          { texto: "Zapatos", puntos: 35 },
          { texto: "Ropa", puntos: 25 },
          { texto: "Crema o maquillaje", puntos: 20 },
          { texto: "Comida", puntos: 12 },
          { texto: "Cosas para la casa", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué es lo que más le gusta presumir a tu mamá?",
        respuestas: [
          { texto: "Tus logros", puntos: 45 },
          { texto: "Su casa", puntos: 20 },
          { texto: "Su comida", puntos: 15 },
          { texto: "Sus hijos", puntos: 12 },
          { texto: "Su ropa nueva", puntos: 8 }
        ]
      },
      {
        texto: "¿Qué es lo que más le duele a una mamá?",
        respuestas: [
          { texto: "Que le falten el respeto", puntos: 40 },
          { texto: "Que se porten mal sus hijos", puntos: 25 },
          { texto: "Que no le hagan caso", puntos: 18 },
          { texto: "Que no le ayuden", puntos: 10 },
          { texto: "Que lleguen tarde", puntos: 7 }
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
      texto: "Selecciona la categoría y presiona INICIAR",
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
    
    console.log(`📺 ${tipo} conectado a sala ${salaId}`);
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
  console.log(`📋 Categorías predeterminadas: ${CATEGORIAS_PREDETERMINADAS.length} categoría con ${CATEGORIAS_PREDETERMINADAS[0].preguntas.length} preguntas`);
});