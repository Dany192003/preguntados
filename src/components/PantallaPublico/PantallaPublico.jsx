import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './PantallaPublico.css';

const PantallaPublico = () => {
  const { salaId } = useParams();
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
    const newSocket = io('https://preguntados-backend-114y.onrender.com');
    newSocket.emit('identificar', { tipo: 'publico', salaId });

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

  return (
    <div className="publico-container">
      {/* Header */}
      <div className="tv-header">
        <div className="programa-logo">
          <span className="logo-icon">🎤</span>
          <span className="logo-title">LOS LATINOS</span>
          <span className="logo-subtitle">DIJERON</span>
        </div>
        <div className="ronda-info">
          <span className="ronda-number">RONDA {gameState.ronda}</span>
          <span className="sala-code">Sala: {salaId}</span>
        </div>
      </div>

      {/* Marcador de equipos */}
      <div className="equipos-marcador">
        <div className={`equipo-card ${gameState.equipoActivo === 'equipo1' ? 'activo' : ''}`}>
          <div className="equipo-avatar">🔥</div>
          <div className="equipo-nombre">{gameState.equipo1Nombre}</div>
          <div className="equipo-puntaje">{gameState.puntajes.equipo1}</div>
        </div>
        
        <div className="zona-central">
          <div className="vs-circle">VS</div>
          {gameState.faseJuego === 'manoAmazo' && <div className="indicador-manoamazo">🎯 RONDA INICIAL</div>}
          {gameState.faseJuego === 'controles' && (
            <div className="indicador-strikes">
              <span>❌ STRIKES</span>
              <strong>{gameState.strikes}/3</strong>
            </div>
          )}
          {gameState.faseJuego === 'robo' && <div className="indicador-robo">💰 ¡ROBO ACTIVO!</div>}
        </div>
        
        <div className={`equipo-card ${gameState.equipoActivo === 'equipo2' ? 'activo' : ''}`}>
          <div className="equipo-avatar">💪</div>
          <div className="equipo-nombre">{gameState.equipo2Nombre}</div>
          <div className="equipo-puntaje">{gameState.puntajes.equipo2}</div>
        </div>
      </div>

      {/* Mensaje del presentador */}
      <div className="mensaje-presentador">
        <div className="mensaje-texto">{gameState.mensajeJuego}</div>
      </div>

      {/* Pregunta */}
      <div className="pregunta-container">
        <div className="pregunta-card">
          <span className="pregunta-tag">LA PREGUNTA ES...</span>
          <h2>{gameState.preguntaActual.texto}</h2>
        </div>
      </div>

      {/* Puntos en juego */}
      {gameState.puntosEnJuego > 0 && (
        <div className="puntos-juego">
          <span>💰 PUNTOS EN JUEGO</span>
          <strong>{gameState.puntosEnJuego}</strong>
        </div>
      )}

      {/* Tablero de respuestas */}
      <div className="tablero-tv">
        <div className="tablero-header">
          <span>#</span>
          <span>RESPUESTAS</span>
          <span>PTS</span>
        </div>
        
        {gameState.preguntaActual.respuestas.map((resp, idx) => (
          <div 
            key={idx} 
            className={`tablero-fila ${resp.revelada ? 'revelada' : 'oculta'} ${resp.acertada ? 'acertada' : ''}`}
          >
            <div className="fila-numero">{idx + 1}</div>
            <div className="fila-respuesta">
              {resp.revelada ? resp.texto : '?????'}
            </div>
            <div className="fila-puntos">
              {resp.revelada && <span className="puntos-badge">{resp.puntos}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Info de juego */}
      <div className="info-juego">
        <div className="info-item">
          <span>🎮</span>
          <span>Turno: {gameState.equipoActivo ? (gameState.equipoActivo === 'equipo1' ? gameState.equipo1Nombre : gameState.equipo2Nombre) : 'Sin equipo'}</span>
        </div>
      </div>
    </div>
  );
};

export default PantallaPublico;