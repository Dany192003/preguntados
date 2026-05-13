import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './PanelControl.css';

const PanelControl = () => {
  const { salaId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState({
    equipo1Nombre: "EQUIPO 1",
    equipo2Nombre: "EQUIPO 2",
    faseJuego: "esperando",
    equipoActivo: null,
    puntajes: { equipo1: 0, equipo2: 0 },
    puntosEnJuego: 0,
    preguntaActual: { texto: "Selecciona categoría y presiona INICIAR", respuestas: [] },
    strikes: 0,
    mensajeJuego: "Bienvenido",
    ronda: 1,
    categorias: []
  });
  
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [editandoEquipo, setEditandoEquipo] = useState(null);
  const [nombreTemp, setNombreTemp] = useState("");
  const [mostrarConfirmacionReinicio, setMostrarConfirmacionReinicio] = useState(false);
  const [mostrarModalRobo, setMostrarModalRobo] = useState(false);
  const [equipoSeleccionadoRobo, setEquipoSeleccionadoRobo] = useState(null);
  const [mostrarConfirmacionCerrarSala, setMostrarConfirmacionCerrarSala] = useState(false);
  
  const [nuevaCategoria, setNuevaCategoria] = useState({ 
    nombre: '', 
    preguntas: [] 
  });
  
  const [nuevaPregunta, setNuevaPregunta] = useState({
    texto: '',
    respuestas: [
      { texto: '', puntos: 0 },
      { texto: '', puntos: 0 },
      { texto: '', puntos: 0 },
      { texto: '', puntos: 0 },
      { texto: '', puntos: 0 }
    ]
  });

  useEffect(() => {
    const newSocket = io('https://preguntados-backend-114y.onrender.com');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('identificar', { tipo: 'control', salaId });
    });

    newSocket.on('estado-inicial', (estado) => {
      setGameState(estado);
    });

    newSocket.on('estado-actualizado', (estado) => {
      setGameState(estado);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [salaId]);

  const iniciarJuego = () => {
    if (!categoriaSeleccionada) {
      alert('Selecciona una categoría');
      return;
    }
    setJuegoActivo(true);
    setPreguntaIndex(0);
    cargarPregunta(0);
    if (socket) {
      socket.emit('enviar-mensaje', { salaId, mensaje: `🎮 Juego iniciado - ${categoriaSeleccionada.nombre}` });
    }
  };

  const cargarPregunta = (index) => {
    const pregunta = categoriaSeleccionada.preguntas[index];
    if (socket && pregunta) {
      socket.emit('siguiente-pregunta', {
        salaId,
        nuevaPregunta: {
          texto: pregunta.texto,
          respuestas: pregunta.respuestas.map(r => ({ 
            texto: r.texto, 
            puntos: r.puntos, 
            revelada: false, 
            acertada: false 
          }))
        }
      });
    }
  };

  const siguientePregunta = () => {
    if (preguntaIndex + 1 < categoriaSeleccionada.preguntas.length) {
      setPreguntaIndex(preguntaIndex + 1);
      cargarPregunta(preguntaIndex + 1);
      if (socket) {
        socket.emit('cambiar-fase', { salaId, fase: 'manoAmazo' });
        socket.emit('reset-strikes', salaId);
      }
    } else {
      alert('🎉 ¡Categoría completada!');
      setJuegoActivo(false);
      setCategoriaSeleccionada(null);
    }
  };

  const revelarRespuesta = (index) => {
    if (socket) socket.emit('revelar-respuesta', { salaId, index });
  };
  
  const acertarRespuesta = (index) => {
    const puntos = gameState.preguntaActual.respuestas[index]?.puntos;
    if (puntos && gameState.equipoActivo && socket) {
      socket.emit('sumar-puntos', { salaId, equipo: gameState.equipoActivo, puntos });
      socket.emit('acertar-respuesta', { salaId, index });
      socket.emit('enviar-mensaje', { 
        salaId, 
        mensaje: `✓ ${gameState.equipoActivo === 'equipo1' ? gameState.equipo1Nombre : gameState.equipo2Nombre} gana ${puntos} pts!` 
      });
    } else if (!gameState.equipoActivo) {
      alert('Primero selecciona qué equipo juega (Mano a mano)');
    }
  };
  
  const registrarFallo = () => {
    if (socket) socket.emit('registrar-fallo', salaId);
  };
  
  const abrirModalRobo = () => setMostrarModalRobo(true);
  
  const ejecutarRobo = () => {
    if (!equipoSeleccionadoRobo) {
      alert('Selecciona un equipo para robar');
      return;
    }
    
    const puntosARobar = gameState.puntajes[equipoSeleccionadoRobo];
    const nombreEquipo = equipoSeleccionadoRobo === 'equipo1' ? gameState.equipo1Nombre : gameState.equipo2Nombre;
    
    if (puntosARobar === 0) {
      alert(`⚠️ ${nombreEquipo} no tiene puntos para robar`);
      setMostrarModalRobo(false);
      setEquipoSeleccionadoRobo(null);
      return;
    }
    
    if (socket) {
      socket.emit('intentar-robo-con-equipo', { salaId, equipoOrigen: equipoSeleccionadoRobo });
    }
    
    setMostrarModalRobo(false);
    setEquipoSeleccionadoRobo(null);
  };
  
  const cerrarSala = () => {
    if (socket) socket.emit('cerrar-sala', salaId);
    setMostrarConfirmacionCerrarSala(false);
    navigate('/');
  };

  const sumarPuntosManual = (equipo, puntos) => {
    if (socket) socket.emit('sumar-puntos', { salaId, equipo, puntos });
  };

  const cambiarNombreEquipo = (equipo, nuevoNombre) => {
    if (nuevoNombre.trim() === '') return;
    const data = {};
    if (equipo === 'equipo1') data.equipo1 = nuevoNombre;
    if (equipo === 'equipo2') data.equipo2 = nuevoNombre;
    if (socket) socket.emit('configurar-equipos', { salaId, data });
    setEditandoEquipo(null);
  };

  const reiniciarPartida = () => {
    if (socket) socket.emit('reiniciar-juego', salaId);
    setJuegoActivo(false);
    setCategoriaSeleccionada(null);
    setPreguntaIndex(0);
    setMostrarConfirmacionReinicio(false);
  };

  // Validar si la pregunta está completa
  const isPreguntaCompleta = () => {
    const respuestasValidas = nuevaPregunta.respuestas.filter(r => r.texto.trim() !== '' && r.puntos > 0);
    return nuevaPregunta.texto.trim() !== '' && respuestasValidas.length >= 3;
  };

  const agregarPregunta = () => {
    const respuestasValidas = nuevaPregunta.respuestas.filter(r => r.texto.trim() !== '' && r.puntos > 0);
    if (nuevaPregunta.texto.trim() === '') {
      alert('Escribe la pregunta');
      return;
    }
    if (respuestasValidas.length < 3) {
      alert('Agrega al menos 3 respuestas con puntos');
      return;
    }
    
    setNuevaCategoria({
      ...nuevaCategoria,
      preguntas: [...nuevaCategoria.preguntas, {
        texto: nuevaPregunta.texto,
        respuestas: respuestasValidas
      }]
    });
    
    setNuevaPregunta({
      texto: '',
      respuestas: [
        { texto: '', puntos: 0 },
        { texto: '', puntos: 0 },
        { texto: '', puntos: 0 },
        { texto: '', puntos: 0 },
        { texto: '', puntos: 0 }
      ]
    });
  };

  const actualizarRespuesta = (index, campo, valor) => {
    const nuevasRespuestas = [...nuevaPregunta.respuestas];
    nuevasRespuestas[index][campo] = campo === 'puntos' ? parseInt(valor) || 0 : valor;
    setNuevaPregunta({ ...nuevaPregunta, respuestas: nuevasRespuestas });
  };

  const guardarCategoria = () => {
    if (nuevaCategoria.nombre.trim() === '') {
      alert('Escribe el nombre de la categoría');
      return;
    }
    if (nuevaCategoria.preguntas.length === 0) {
      alert('Agrega al menos una pregunta');
      return;
    }
    
    if (socket) {
      socket.emit('agregar-categoria', { 
        salaId, 
        categoria: {
          nombre: nuevaCategoria.nombre,
          preguntas: nuevaCategoria.preguntas
        }
      });
    }
    
    setNuevaCategoria({ nombre: '', preguntas: [] });
    setMostrarModalCategoria(false);
    alert('✅ Categoría agregada a esta sala');
  };

  if (!connected) {
    return (
      <div className="panel-controlador">
        <div className="conectando">
          <h2>🔌 Conectando al servidor...</h2>
          <p>Asegúrate que el servidor esté corriendo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-controlador">
      <div className="header-simple">
        <h1>🎬 CONTROL DEL PROGRAMA</h1>
        <div className="sala-info">
          <span className="sala-label">SALA:</span>
          <span className="sala-codigo">{salaId}</span>
          <button className="btn-cerrar-sala" onClick={() => setMostrarConfirmacionCerrarSala(true)} title="Cerrar sala y desconectar a todos">
            🚪 Cerrar Sala
          </button>
        </div>
        <button className="btn-reiniciar-header" onClick={() => setMostrarConfirmacionReinicio(true)}>
          🔄 REINICIAR PARTIDA
        </button>
      </div>

      <div className="info-sala-presentador">
        <p>📺 Comparte este código con el público: <strong>{salaId}</strong></p>
        <p>🌐 URL pública: <code>https://preguntados.vercel.app/publico/{salaId}</code></p>
      </div>

      <div className="editar-equipos">
        <div className="edit-equipo-card">
          <span className="equipo-icon">🔥</span>
          {editandoEquipo === 'equipo1' ? (
            <input 
              type="text" 
              value={nombreTemp} 
              onChange={(e) => setNombreTemp(e.target.value)}
              onBlur={() => cambiarNombreEquipo('equipo1', nombreTemp)}
              onKeyPress={(e) => e.key === 'Enter' && cambiarNombreEquipo('equipo1', nombreTemp)}
              autoFocus
            />
          ) : (
            <button onClick={() => {
              setNombreTemp(gameState.equipo1Nombre);
              setEditandoEquipo('equipo1');
            }}>
              {gameState.equipo1Nombre} ✏️
            </button>
          )}
        </div>
        <div className="edit-equipo-card">
          <span className="equipo-icon">💪</span>
          {editandoEquipo === 'equipo2' ? (
            <input 
              type="text" 
              value={nombreTemp} 
              onChange={(e) => setNombreTemp(e.target.value)}
              onBlur={() => cambiarNombreEquipo('equipo2', nombreTemp)}
              onKeyPress={(e) => e.key === 'Enter' && cambiarNombreEquipo('equipo2', nombreTemp)}
              autoFocus
            />
          ) : (
            <button onClick={() => {
              setNombreTemp(gameState.equipo2Nombre);
              setEditandoEquipo('equipo2');
            }}>
              {gameState.equipo2Nombre} ✏️
            </button>
          )}
        </div>
      </div>

      <div className="puntajes-rapidos">
        <div className="puntaje">
          <span>🔥 {gameState.equipo1Nombre}</span>
          <strong>{gameState.puntajes.equipo1}</strong>
          <div className="puntos-botones">
            <button onClick={() => sumarPuntosManual('equipo1', 100)}>+100</button>
            <button onClick={() => sumarPuntosManual('equipo1', 50)}>+50</button>
            <button onClick={() => sumarPuntosManual('equipo1', 10)}>+10</button>
          </div>
        </div>
        <div className="puntaje">
          <span>💪 {gameState.equipo2Nombre}</span>
          <strong>{gameState.puntajes.equipo2}</strong>
          <div className="puntos-botones">
            <button onClick={() => sumarPuntosManual('equipo2', 100)}>+100</button>
            <button onClick={() => sumarPuntosManual('equipo2', 50)}>+50</button>
            <button onClick={() => sumarPuntosManual('equipo2', 10)}>+10</button>
          </div>
        </div>
      </div>

      {gameState.equipoActivo && (
        <div className="equipo-activo">
          🎤 JUGANDO: {gameState.equipoActivo === 'equipo1' ? gameState.equipo1Nombre : gameState.equipo2Nombre}
        </div>
      )}

      {gameState.strikes > 0 && (
        <div className="strikes-indicador">
          ❌ STRIKES: {gameState.strikes}/3
        </div>
      )}

      <div className="seleccion-categoria">
        <h3>📂 SELECCIONAR CATEGORÍA</h3>
        <div className="categorias-simples">
          {gameState.categorias && gameState.categorias.length > 0 ? (
            gameState.categorias.map(cat => (
              <button
                key={cat.id}
                className={`cat-btn ${categoriaSeleccionada?.id === cat.id ? 'active' : ''}`}
                onClick={() => setCategoriaSeleccionada(cat)}
              >
                {cat.nombre}
                {cat.tipo === 'custom' && <span className="custom-badge"> 📌</span>}
              </button>
            ))
          ) : (
            <div className="no-categorias">Cargando categorías...</div>
          )}
          <button className="cat-btn agregar" onClick={() => setMostrarModalCategoria(true)}>
            ➕ AGREGAR
          </button>
        </div>
      </div>

      {!juegoActivo && categoriaSeleccionada && (
        <button className="btn-iniciar-grande" onClick={iniciarJuego}>
          🟢 INICIAR PARTIDA CON {categoriaSeleccionada.nombre}
        </button>
      )}

      {juegoActivo && (
        <>
          <div className="pregunta-simple">
            <h3>📢 PREGUNTA {preguntaIndex + 1}/{categoriaSeleccionada?.preguntas.length}</h3>
            <div className="texto-pregunta">{gameState.preguntaActual.texto}</div>
          </div>

          <div className="manoamazo-simple">
            <h3>🎯 MANO A MANO - ¿Quién empieza?</h3>
            <div className="manoamazo-botones">
              <button onClick={() => socket && socket.emit('gana-manoamano', { salaId, equipo: 'equipo1' })}>
                🔥 {gameState.equipo1Nombre}
              </button>
              <button onClick={() => socket && socket.emit('gana-manoamano', { salaId, equipo: 'equipo2' })}>
                💪 {gameState.equipo2Nombre}
              </button>
            </div>
          </div>

          <div className="respuestas-simples">
            <h3>📋 RESPUESTAS</h3>
            {gameState.preguntaActual.respuestas && gameState.preguntaActual.respuestas.map((resp, idx) => (
              <div key={idx} className="respuesta-simple">
                <span className="resp-texto-completo">{idx + 1}. {resp.texto || '???'}</span>
                <span className="puntos">{resp.puntos || 0} pts</span>
                <div className="acciones">
                  <button onClick={() => revelarRespuesta(idx)} disabled={resp.revelada}>
                    👁️ Revelar
                  </button>
                  <button onClick={() => acertarRespuesta(idx)} disabled={!resp.revelada || resp.acertada}>
                    ✓ Acertó
                  </button>
                </div>
                <span className="estado">
                  {resp.acertada ? '✅' : (resp.revelada ? '👁️' : '❓')}
                </span>
              </div>
            ))}
          </div>

          <div className="controles-rapidos">
            <button className="fallo-btn" onClick={registrarFallo}>
              ❌ FALLO
            </button>
            <button className="robo-btn" onClick={abrirModalRobo}>
              💰 ROBAR PUNTOS
            </button>
            <button className="siguiente-btn" onClick={siguientePregunta}>
              ⏩ SIGUIENTE
            </button>
          </div>
        </>
      )}

      {/* MODAL ROBO */}
      {mostrarModalRobo && (
        <div className="modal-confirmacion">
          <div className="modal-confirmacion-content">
            <h3>💰 ROBAR PUNTOS</h3>
            <p>¿A qué equipo quieres robar los puntos?</p>
            <div className="robo-equipos-botones">
              <button 
                className={`btn-robo-equipo ${equipoSeleccionadoRobo === 'equipo1' ? 'selected' : ''}`}
                onClick={() => setEquipoSeleccionadoRobo('equipo1')}
              >
                🔥 {gameState.equipo1Nombre} ({gameState.puntajes.equipo1} pts)
              </button>
              <button 
                className={`btn-robo-equipo ${equipoSeleccionadoRobo === 'equipo2' ? 'selected' : ''}`}
                onClick={() => setEquipoSeleccionadoRobo('equipo2')}
              >
                💪 {gameState.equipo2Nombre} ({gameState.puntajes.equipo2} pts)
              </button>
            </div>
            <div className="modal-botones">
              <button className="btn-confirmar" onClick={ejecutarRobo}>Robar Puntos</button>
              <button className="btn-cancelar" onClick={() => {
                setMostrarModalRobo(false);
                setEquipoSeleccionadoRobo(null);
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REINICIAR */}
      {mostrarConfirmacionReinicio && (
        <div className="modal-confirmacion">
          <div className="modal-confirmacion-content">
            <h3>⚠️ ¿REINICIAR PARTIDA?</h3>
            <p>Se perderán todos los puntajes y el progreso actual.</p>
            <div className="modal-botones">
              <button className="btn-confirmar" onClick={reiniciarPartida}>Sí, reiniciar</button>
              <button className="btn-cancelar" onClick={() => setMostrarConfirmacionReinicio(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR SALA */}
      {mostrarConfirmacionCerrarSala && (
        <div className="modal-confirmacion">
          <div className="modal-confirmacion-content">
            <h3>🚪 ¿CERRAR SALA?</h3>
            <p>La sala se eliminará y todos los participantes serán desconectados.</p>
            <div className="modal-botones">
              <button className="btn-confirmar" onClick={cerrarSala}>Sí, cerrar sala</button>
              <button className="btn-cancelar" onClick={() => setMostrarConfirmacionCerrarSala(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR CATEGORÍA - MEJORADO */}
{mostrarModalCategoria && (
  <div className="modal-simple">
    <div className="modal-content-simple">
      <h3>➕ NUEVA CATEGORÍA PERSONALIZADA</h3>
      
      <div className="modal-body">
        <div className="modal-section">
          <h4>📛 Nombre de la categoría</h4>
          <input 
            type="text" 
            placeholder="Ej: PELÍCULAS MEXICANAS"
            value={nuevaCategoria.nombre}
            onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
          />
        </div>
        
        <div className="modal-section">
          <h4>📋 Preguntas agregadas</h4>
          <div className="preguntas-list">
            {nuevaCategoria.preguntas.length === 0 ? (
              <div className="empty">No hay preguntas aún. Agrega tu primera pregunta 👇</div>
            ) : (
              nuevaCategoria.preguntas.map((p, i) => (
                <div key={i} className="pregunta-preview">
                  <div className="pregunta-info">
                    <strong>{i + 1}.</strong> {p.texto}
                  </div>
                  <span className="pregunta-badge">{p.respuestas.length} respuestas</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-section">
          <h4>➕ Agregar nueva pregunta</h4>
          <input 
            type="text" 
            placeholder="¿Cuál es la película mexicana más famosa?"
            value={nuevaPregunta.texto}
            onChange={(e) => setNuevaPregunta({...nuevaPregunta, texto: e.target.value})}
          />
          
          <h5>📝 Respuestas de la encuesta (5 opciones)</h5>
          <div className="respuestas-grupo">
            {nuevaPregunta.respuestas.map((resp, idx) => (
              <div key={idx} className="respuesta-input-group">
                <span className="resp-num">{idx + 1}</span>
                <input 
                  type="text" 
                  placeholder={`Respuesta ${idx + 1}`}
                  value={resp.texto}
                  onChange={(e) => actualizarRespuesta(idx, 'texto', e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="%"
                  value={resp.puntos || ''}
                  onChange={(e) => actualizarRespuesta(idx, 'puntos', e.target.value)}
                />
              </div>
            ))}
          </div>
          
          <button 
            className="btn-agregar-pregunta" 
            onClick={agregarPregunta}
            disabled={!isPreguntaCompleta()}
            style={{ opacity: !isPreguntaCompleta() ? 0.5 : 1 }}
          >
            ➕ Agregar esta pregunta
          </button>
        </div>
      </div>
      
      <div className="modal-botones">
        <button className="guardar" onClick={guardarCategoria}>
          💾 Guardar Categoría
        </button>
        <button className="cancelar" onClick={() => setMostrarModalCategoria(false)}>
          ❌ Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PanelControl;