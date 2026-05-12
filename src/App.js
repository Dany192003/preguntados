import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';
import PanelControl from './components/PanelControl/PanelControl';

// Pantalla de inicio
function Inicio() {
  const [codigoSala, setCodigoSala] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const navigate = useNavigate();

  const crearSala = () => {
    setCreando(true);
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/control/${codigo}`);
  };

  const unirseSala = () => {
    if (codigoSala.length !== 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }
    setError('');
    navigate(`/publico/${codigoSala.toUpperCase()}`);
  };

  return (
    <div className="inicio-container">
      <div className="inicio-card">
        <div className="logo-principal">
          <span className="logo-icon">🎤</span>
          <h1>LOS LATINOS DIJERON</h1>
          <p>El juego de las respuestas más populares</p>
        </div>
        
        <div className="opciones">
          <button className="btn-crear" onClick={crearSala} disabled={creando}>
            🎮 CREAR NUEVA PARTIDA
          </button>
          <p className="opcion-descripcion">Como presentador, controlas el juego</p>
          
          <div className="separador">O</div>
          
          <div className="unirse-form">
            <input
              type="text"
              placeholder="Código de sala (6 letras)"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              maxLength={6}
              className="input-codigo"
            />
            <button className="btn-unirse" onClick={unirseSala}>
              👥 UNIRSE COMO PÚBLICO
            </button>
          </div>
          <p className="opcion-descripcion">Ingresa el código que te dio el presentador</p>
          {error && <div className="error">{error}</div>}
        </div>
        
        <div className="info-salas">
          <p>📺 El presentador crea la sala y comparte el código</p>
          <p>👥 El público solo necesita el código para ver</p>
        </div>
      </div>
    </div>
  );
}

// Pantalla Pública
function PantallaPublica() {
  const { salaId } = useParams();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [gameState, setGameState] = useState({
    equipo1Nombre: "EQUIPO 1",
    equipo2Nombre: "EQUIPO 2",
    faseJuego: "esperando",
    equipoActivo: null,
    puntajes: { equipo1: 0, equipo2: 0 },
    puntosEnJuego: 0,
    preguntaActual: { texto: "Esperando al presentador...", respuestas: [] },
    strikes: 0,
    mensajeJuego: "Bienvenidos al programa",
    ronda: 1
  });

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConnected(true);
      setError(false);
      newSocket.emit('identificar', { tipo: 'publico', salaId });
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
      setError(true);
    });

    newSocket.on('estado-inicial', (estado) => {
      setGameState(estado);
    });

    newSocket.on('estado-actualizado', (estado) => {
      setGameState(estado);
    });

    newSocket.on('sala-cerrada', () => {
      alert('La sala ha sido cerrada por el presentador');
      window.location.href = '/';
    });

    return () => {
      newSocket.disconnect();
    };
  }, [salaId]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <span className="error-icon">🔌</span>
          <h2>No se pudo conectar al servidor</h2>
          <p>Asegúrate que el servidor esté corriendo en http://localhost:3001</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="cargando-container">
        <div className="spinner"></div>
        <p>Conectando a la sala {salaId}...</p>
      </div>
    );
  }

  return (
    <div className="publico-container-completo">
      <div className="programa-header">
        <div className="logo-programa">
          <span>🎤</span>
          <h1>LOS LATINOS DIJERON</h1>
        </div>
        <div className="sala-id">
          <span className="sala-label">SALA:</span>
          <strong>{salaId}</strong>
        </div>
      </div>

      <div className="marcador-equipos">
        <div className={`equipo ${gameState.equipoActivo === 'equipo1' ? 'activo' : ''}`}>
          <div className="equipo-icono">🔥</div>
          <div className="equipo-nombre">{gameState.equipo1Nombre}</div>
          <div className="equipo-puntos">{gameState.puntajes.equipo1}</div>
        </div>
        
        <div className="vs-central">
          <div className="vs">VS</div>
          {gameState.faseJuego === 'manoAmazo' && <div className="fase-badge">🎯 RONDA INICIAL</div>}
          {gameState.faseJuego === 'controles' && <div className="strikes-badge">❌ STRIKES: {gameState.strikes}/3</div>}
          {gameState.faseJuego === 'robo' && <div className="robo-badge">💰 ROBO ACTIVO</div>}
        </div>
        
        <div className={`equipo ${gameState.equipoActivo === 'equipo2' ? 'activo' : ''}`}>
          <div className="equipo-icono">💪</div>
          <div className="equipo-nombre">{gameState.equipo2Nombre}</div>
          <div className="equipo-puntos">{gameState.puntajes.equipo2}</div>
        </div>
      </div>

      <div className="mensaje-juego">
        <p>{gameState.mensajeJuego}</p>
      </div>

      <div className="pregunta-area">
        <div className="pregunta-card">
          <span className="pregunta-tag">LA PREGUNTA ES...</span>
          <h2>{gameState.preguntaActual.texto}</h2>
        </div>
      </div>

      <div className="tablero">
        <div className="tablero-header">
          <span>#</span>
          <span>RESPUESTAS</span>
          <span>PTS</span>
        </div>
        {gameState.preguntaActual.respuestas && gameState.preguntaActual.respuestas.map((resp, idx) => (
          <div key={idx} className={`fila ${resp.revelada ? 'revelada' : 'oculta'} ${resp.acertada ? 'acertada' : ''}`}>
            <div className="numero">{idx + 1}</div>
            <div className="texto">{resp.revelada ? resp.texto : '?????'}</div>
            <div className="puntos">{resp.revelada && resp.puntos}</div>
          </div>
        ))}
      </div>

      <div className="footer-info">
        <div className="info-item">🎮 Turno: {gameState.equipoActivo ? (gameState.equipoActivo === 'equipo1' ? gameState.equipo1Nombre : gameState.equipo2Nombre) : 'Sin equipo'}</div>
        <div className="info-item">💰 Puntos en juego: {gameState.puntosEnJuego}</div>
        <div className="info-item">📋 Ronda: {gameState.ronda}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/publico/:salaId" element={<PantallaPublica />} />
        <Route path="/control/:salaId" element={<PanelControl />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;