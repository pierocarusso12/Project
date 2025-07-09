import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './VerCapas.css';
import TablaPerforaciones from './TablaPerforaciones';
import TablaCalicatas from './TablaCalicatas';
import TablaCpt from './TablaCpt'
import TablaDpl from './TablaDpl'
import TablaPosteadora from './TablaPosteadora'
import TablaMasw from './TablaMasw'
import TablaMam from './TablaMam'
import TablaDownhole from './TablaDownhole'
import TablaCrosshole from './TablaCrosshole'
import TablaUphole from './TablaUphole'
import TablaGenerales from './TablaGenerales'
import TablaTrinchera from './Trinchera/TablaTrinchera';

const VerCapas = ({ 
  proyectoId = null, 
  isOpen = false, 
  onClose = () => {}, 
  onCrearCapa = () => {},
  onMostrarPerforaciones = null,
  onMostrarCalicatas = null,
  onMostrarCpt = null ,
  onMostrarDpl = null,
  onMostrarPosteadora = null,
  onMostrarMasw = null,
  onMostrarMam = null,
  onMostrarDownhole = null,
  onMostrarCrosshole = null,
  onMostrarUphole = null,
  onMostrarGenerales = null,
  onMostrarTrinchera = null,
}) => {
  const [capas, setCapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroProyecto, setFiltroProyecto] = useState('actual');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroVisibilidad, setFiltroVisibilidad] = useState('todos');
  const [showSidebar, setShowSidebar] = useState(true);
  const [tiposCapas, setTiposCapas] = useState([]);
  const [proyectoActual, setProyectoActual] = useState(null);
  const [mostrarTablaPerforaciones, setMostrarTablaPerforaciones] = useState(false);
  const [mostrarTablaCalicatas, setMostrarTablaCalicatas] = useState(false);
  const [mostrarTablaCpt, setMostrarTablaCpt] = useState(false);
  const [mostrarTablaDpl, setMostrarTablaDpl] = useState(false);
  const [mostrarTablaPosteadora, setMostrarTablaPosteadora] = useState(false);
  const [mostrarTablaMasw, setMostrarTablaMasw] = useState(false);
  const [mostrarTablaMam, setMostrarTablaMam] = useState(false);
  const [mostrarTablaDownhole, setMostrarTablaDownhole] = useState(false);
  const [mostrarTablaCrosshole, setMostrarTablaCrosshole] = useState(false);
  const [mostrarTablaUphole, setMostrarTablaUphole] = useState(false);
  const [mostrarTablaGenerales, setMostrarTablaGenerales] = useState(false);
  const [mostrarTablaTrinchera, setMostrarTablaTrinchera] = useState(false);
  const [capaSeleccionada, setCapaSeleccionada] = useState(null);

  // Función para validar capas duplicadas
  const validarCapaDuplicada = async (nombreCapa, proyectoId) => {
    try {
      const response = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}/capas`);
      if (!response.ok) {
        throw new Error('Error al verificar capas existentes');
      }
      
      const capasExistentes = await response.json();
      
      // Verificar si ya existe una capa con el mismo nombre en este proyecto
      const capaExistente = capasExistentes.find(capa => 
        capa.nombre.toLowerCase() === nombreCapa.toLowerCase()
      );
      
      return capaExistente ? true : false;
    } catch (error) {
      console.error('Error al validar capa duplicada:', error);
      return false; // En caso de error, permitir la creación
    }
  };

  // Función para determinar el tipo de capa
  const determinarTipoCapa = (capa) => {
    const nombre = capa.nombre.toLowerCase();
    if (nombre.includes('perforaciones')) return 'perforaciones';
    if (nombre.includes('calicata')) return 'calicata';
    if (nombre.includes('cpt')) return 'cpt';
    if (nombre.includes('dpl')) return 'dpl';
    if (nombre.includes('posteadora')) return 'posteadora';
    if (nombre.includes('masw')) return 'masw';
    if (nombre.includes('mam')) return 'mam';
    if (nombre.includes('downhole')) return 'downhole';
    if (nombre.includes('crosshole')) return 'crosshole';
    if (nombre.includes('uphole')) return 'uphole';
    if (nombre.includes('generales')) return 'generales';
    if (nombre.includes('trinchera')) return 'trinchera';
    return 'otros';
  };

  // Función para verificar visibilidad inicial (exportada para uso en componentes de tabla)
  const verificarVisibilidadCapa = useCallback((tipoCapa, proyectoIdParam) => {
    const capa = capas.find(c => 
      determinarTipoCapa(c) === tipoCapa && 
      (c.proyecto_id === proyectoIdParam || c.proyecto_id === null)
    );
    
    return capa ? capa.visible : true; 
  }, [capas]);

  // Hacer la función disponible globalmente para que las tablas puedan usarla
  useEffect(() => {
    if (window) {
      window.verificarVisibilidadCapa = verificarVisibilidadCapa;
    }
    
    return () => {
      if (window.verificarVisibilidadCapa === verificarVisibilidadCapa) {
        window.verificarVisibilidadCapa = null;
      }
    };
  }, [verificarVisibilidadCapa]);

  // Función para manejar marcadores por tipo (CORREGIDA para OpenLayers)
  const actualizarMarcadoresPorTipo = (tipoCapa, visible, proyectoIdParam) => {
    if (!window.map) return;
    
    const key = `${tipoCapa}_${proyectoIdParam}`;
    console.log(`🎯 Actualizando visibilidad para ${key}: ${visible}`);
    
    if (window.marcadoresGlobales && window.marcadoresGlobales[key]) {
      console.log(`📍 Encontrados ${window.marcadoresGlobales[key].length} marcadores para ${key}`);
      
      // Obtener el layer correspondiente
      const mapInstance = window.map;
      const layerName = `${tipoCapa}Markers`;
      
      let vectorLayer = null;
      if (mapInstance.getLayers) {
        // OpenLayers
        vectorLayer = mapInstance.getLayers().getArray()
          .find(layer => layer.get('name') === layerName);
      }
      
      if (vectorLayer && vectorLayer.getSource) {
        const vectorSource = vectorLayer.getSource();
        
        window.marcadoresGlobales[key].forEach(feature => {
          if (visible) {
            // Mostrar marcador
            if (!vectorSource.getFeatures().includes(feature)) {
              vectorSource.addFeature(feature);
              console.log(`👁️ Marcador mostrado: ${feature.get('codigo')}`);
            }
          } else {
            // Ocultar marcador
            vectorSource.removeFeature(feature);
            console.log(`🙈 Marcador ocultado: ${feature.get('codigo')}`);
          }
        });
      } else if (window.map.addLayer && window.map.removeLayer) {
        // Fallback para Leaflet
        window.marcadoresGlobales[key].forEach(marcador => {
          if (visible) {
            if (!window.map.hasLayer(marcador)) {
              window.map.addLayer(marcador);
            }
          } else {
            if (window.map.hasLayer(marcador)) {
              window.map.removeLayer(marcador);
            }
          }
        });
      }
    } else {
      console.log(`⚠️ No se encontraron marcadores para ${key}`);
    }
  };

  // Función para actualizar visibilidad en el mapa (CORREGIDA para OpenLayers)
  const actualizarVisibilidadEnMapa = useCallback((capa) => {
    if (!window.map) return;
    
    const tipoCapa = determinarTipoCapa(capa);
    console.log(`Cambiando visibilidad de capa ${tipoCapa} a ${capa.visible}`);
    
   
    if (window.map.getLayers) {
      const layers = window.map.getLayers().getArray();
      
      layers.forEach((layer) => {
        if (layer.get && layer.get('name') && layer.get('name').includes(tipoCapa)) {
          const vectorSource = layer.getSource();
          if (vectorSource && vectorSource.getFeatures) {
            const features = vectorSource.getFeatures();
            
            features.forEach((feature) => {
              const featureCapaType = feature.get('capaType');
              const featureProyectoId = feature.get('proyectoId');
              
              if (featureCapaType === tipoCapa && featureProyectoId === (capa.proyecto_id || proyectoId)) {
                if (capa.visible) {
                  // Mostrar feature (agregar si no está)
                  if (!vectorSource.getFeatures().includes(feature)) {
                    vectorSource.addFeature(feature);
                  }
                } else {
                  // Ocultar feature
                  vectorSource.removeFeature(feature);
                }
              }
            });
          }
        }
      });
    } else if (window.map.eachLayer) {
      // Para Leaflet (mantener compatibilidad)
      window.map.eachLayer((layer) => {
        if (layer.options && layer.options.capaType === tipoCapa && 
            layer.options.proyectoId === (capa.proyecto_id || proyectoId)) {
          
          if (capa.visible) {
            if (!window.map.hasLayer(layer)) {
              window.map.addLayer(layer);
            }
            layer.setStyle && layer.setStyle({ opacity: 1, fillOpacity: 0.7 });
          } else {
            if (window.map.hasLayer(layer)) {
              window.map.removeLayer(layer);
            }
          }
        }
      });
    }
    
    // También manejar marcadores individuales
    actualizarMarcadoresPorTipo(tipoCapa, capa.visible, capa.proyecto_id || proyectoId);
  }, [proyectoId]);


  const aplicarVisibilidadInicialPorTipo = useCallback((tipoCapa, proyectoIdParam) => {
  // Buscar si existe una capa para este tipo y proyecto
  const capaCorrespondiente = capas.find(c => 
    determinarTipoCapa(c) === tipoCapa && 
    (c.proyecto_id === proyectoIdParam || c.proyecto_id === null)
  );
  
  if (capaCorrespondiente && window.map && window.map.getLayers) {
    const layers = window.map.getLayers().getArray();
    const layerName = `${tipoCapa}Markers`;
    const vectorLayer = layers.find(layer => 
      layer.get && layer.get('name') === layerName
    );
    
    if (vectorLayer) {
      vectorLayer.setVisible(capaCorrespondiente.visible);
      console.log(`🔄 Visibilidad inicial aplicada para ${layerName}: ${capaCorrespondiente.visible}`);
    }
  }
}, [capas]);
    



useEffect(() => {
  if (window) {
    window.aplicarVisibilidadInicialPorTipo = aplicarVisibilidadInicialPorTipo;
  }
  
  return () => {
    if (window.aplicarVisibilidadInicialPorTipo === aplicarVisibilidadInicialPorTipo) {
      window.aplicarVisibilidadInicialPorTipo = null;
    }
  };
}, [aplicarVisibilidadInicialPorTipo]);
  
  // Función para manejar el clic en una capa
  const handleCapaClick = (capa) => {
    console.log("Capa clickeada:", capa);
    
    // Primero cerrar cualquier tabla que esté abierta
    setMostrarTablaPerforaciones(false);
    setMostrarTablaCalicatas(false);
    setMostrarTablaCpt(false);
    setMostrarTablaDpl(false);
    setMostrarTablaPosteadora(false);
    setMostrarTablaMasw(false);
    setMostrarTablaMam(false);
    setMostrarTablaDownhole(false);
    setMostrarTablaCrosshole(false);
    setMostrarTablaUphole(false);
    setMostrarTablaGenerales(false);
    setMostrarTablaTrinchera(false);
    setCapaSeleccionada(null);
  
    // Verificar tipos de capa
    const esPerforacion = 
      capa.nombre === "Perforaciones" || 
      capa.nombre === "perforaciones" ||
      (capa.nombre && capa.nombre.toLowerCase().includes("perforac")) ||
      (capa.tipo && capa.tipo.toLowerCase().includes("perforac"));
    
    const esCalicata = 
      capa.nombre === "Calicatas" || 
      capa.nombre === "calicatas" ||
      (capa.nombre && capa.nombre.toLowerCase().includes("calicata")) ||
      (capa.tipo && capa.tipo.toLowerCase().includes("calicata"));

    const esCpt = 
      capa.nombre === "Cpt" || 
      capa.nombre === "cpt" ||
      (capa.nombre && capa.nombre.toLowerCase().includes("cpt")) ||
      (capa.tipo && capa.tipo.toLowerCase().includes("cpt")); 

    const esDpl = 
      capa.nombre === "Dpl" ||
      capa.nombre === "dpl" || 
      (capa.nombre && capa.nombre.toLowerCase().includes("dpl")) || 
      (capa.tipo && capa.tipo.toLowerCase().includes("dpl"));

    const esPosteadora =
      capa.nombre === "Posteadora" ||
      capa.nombre === "posteadora" || 
      (capa.nombre && capa.nombre.toLowerCase().includes("posteadora")) || 
      (capa.tipo && capa.tipo.toLowerCase().includes("posteadora"));

    const esMasw = 
      capa.nombre === "Masw" || 
      capa.nombre === "masw" ||
      (capa.nombre && capa.nombre.toLowerCase().includes("masw")) || 
      (capa.tipo && capa.tipo.toLowerCase().includes("masw"));

    const esMam =
       capa.nombre === "Mam" || 
       capa.nombre === "mam" || 
       (capa.nombre && capa.nombre.toLowerCase().includes("mam")) ||
       (capa.tipo && capa.tipo.toLowerCase().includes("mam"));

    const esDownhole =
       capa.nombre === "Downhole" || 
       capa.nombre === "downhole" || 
        (capa.nombre && capa.nombre.toLowerCase().includes("downhole")) ||
        (capa.tipo && capa.tipo.toLowerCase().includes("downhole"));

    const esCrosshole =
       capa.nombre === "Crosshole" ||
       capa.nombre === "crosshole" || 
        (capa.nombre && capa.nombre.toLowerCase().includes("crosshole")) ||
        (capa.tipo && capa.tipo.toLowerCase().includes("crosshole"));

    const esUphole =
      capa.nombre === "Uphole"  ||
      capa.nombre === "uphole"  ||
       (capa.nombre && capa.nombre.toLowerCase().includes("uphole")) ||
       (capa.tipo && capa.tipo.toLowerCase().includes("uphole"));

    const esGenerales = 
       capa.nombre === "Generales" ||
       capa.nombre === "generales" ||
        (capa.nombre && capa.nombre.toLowerCase().includes("generales")) ||
        (capa.tipo && capa.tipo.toLowerCase().includes("generales"));

    const esTrinchera =
      capa.nombre === "Trinchera" ||
      capa.nombre === "trinchera" ||
      (capa.nombre && capa.nombre.toLowerCase().includes("trinchera")) ||
      (capa.tipo && capa.tipo.toLowerCase().includes("trinchera"));

    
    console.log("¿Es perforación?", esPerforacion);
    console.log("¿Es calicata?", esCalicata);
    console.log("¿Es Cpt?", esCpt);
    console.log("Es Dpl", esDpl);
    console.log("Es posteadora", esPosteadora);
    console.log("Es masw", esMasw);
    console.log("Es mam", esMam);
    console.log("Es downhole", esDownhole);
    console.log("Es crosshole", esCrosshole);
    console.log("Es uphole", esUphole);
    console.log("Es generales", esGenerales);
    console.log("Es trinchera", esTrinchera);

    // Manejar cada tipo de capa
    if (esPerforacion) {
      if (onMostrarPerforaciones) {
        console.log("Ejecutando función del padre onMostrarPerforaciones");
        onMostrarPerforaciones();
      } else {
        console.log("Mostrando tabla de perforaciones (lógica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaPerforaciones(true);
      }
    } else if (esCalicata) {
      if (onMostrarCalicatas) {
        console.log("Ejecutando función del padre onMostrarCalicatas");
        onMostrarCalicatas();
      } else {
        console.log("Mostrando tabla de calicatas (lógica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaCalicatas(true);
      }
    } else if (esCpt) {
      if (onMostrarCpt) {
        console.log("Ejecutando funcion del padre onMostrarCpt");
        onMostrarCpt();
      } else {
        console.log("Mostrando tabla de cpt (lógica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaCpt(true);
      }
    } else if (esDpl) {
      if (onMostrarDpl) {
        console.log("Ejecutando funcion del padre onMostrarDpl");
        onMostrarDpl();
      } else {
        console.log("Mostrando la tabla de dpl (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaDpl(true);
      }
    } else if (esPosteadora) {
      if (onMostrarPosteadora) {
        console.log("Ejecutando funcion del padre onMostrarPosteadora");
        onMostrarPosteadora();
      } else {
        console.log("Mostrando la tabla de posteadora (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaPosteadora(true);
      }
    } else if (esMasw) {
      if (onMostrarMasw) {
        console.log("Ejecutando funcion del padre onMostrarMasw");
        onMostrarMasw();
      } else {
        console.log("Mostrando la tabla de masw (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaMasw(true);
      }
    } else if (esMam) {
      if (onMostrarMam) {
        console.log("Ejecutando funcion del padre onMostrarMam");
        onMostrarMam();
      } else {
        console.log("Mostrando la tabla de mam (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaMam(true);
      }
    } else if (esDownhole) {
      if (onMostrarDownhole) {
        console.log("Ejecutando la funcion del padre onMostrarDownhole");
        onMostrarDownhole();
      } else {
        console.log("Mostrando la tabla de downhole (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaDownhole(true);
      }
    } else if (esCrosshole) {
      if (onMostrarCrosshole) {
        console.log("Ejecutando la funcion del padre onMostrarCrosshole");
        onMostrarCrosshole();
      } else {
        console.log("Mostrando la tabla de crosshole (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaCrosshole(true);
      }
    } else if (esUphole) {
      if (onMostrarUphole) {
        console.log("Ejecutando la funcion del padre onMostrarUphole");
        onMostrarUphole();
      } else {
        console.log("Mostrando la tabla de uphole (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaUphole(true);
      }
    } else if (esGenerales) {
      if (onMostrarGenerales) {
        console.log("Ejecutando la funcion del padre onMostrarGenerales");
        onMostrarGenerales();
      } else {
        console.log("Mostrando la tabla de generales (logica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaGenerales(true);
      }
    }  else if (esTrinchera) {
      if (onMostrarTrinchera) {
        console.log("Ejecutando la función del padre onMostrarTrinchera");
        onMostrarTrinchera();
      } else{
        console.log("Mostrando la tabla de trinchera (lógica interna)");
        setCapaSeleccionada(capa);
        setMostrarTablaTrinchera(true);
      } 
     } else {
      console.log("Esta capa no es de ningún tipo reconocido");
    }
  };

  // Función para cerrar las tablas
  const handleCerrarTabla = () => {
    console.log("Cerrando tablas...");
    setMostrarTablaPerforaciones(false);
    setMostrarTablaCalicatas(false);
    setMostrarTablaCpt(false);
    setMostrarTablaDpl(false);
    setMostrarTablaPosteadora(false);
    setMostrarTablaMasw(false);
    setMostrarTablaMam(false);
    setMostrarTablaDownhole(false);
    setMostrarTablaCrosshole(false);
    setMostrarTablaUphole(false);
    setMostrarTablaGenerales(false);
    setMostrarTablaTrinchera(false);
    setCapaSeleccionada(null);
  };

  // Cargar los tipos de capas disponibles
  useEffect(() => {
    if (!isOpen) return;
    
    const cargarTiposCapas = async () => {
      try {
        const response = await fetch('http://10.161.1.76:8000/api/capas');
        
        if (!response.ok) {
          throw new Error('Error al cargar tipos de capas');
        }
        
        const data = await response.json();
        
        // Extraer tipos únicos de capas
        const tiposUnicos = [...new Set(data.map(capa => capa.nombre))];
        setTiposCapas(tiposUnicos);
      } catch (error) {
        console.error('Error al cargar tipos de capas:', error);
      }
    };
    
    cargarTiposCapas();
  }, [isOpen]);

  // Cargar información del proyecto actual
  useEffect(() => {
    if (!isOpen || !proyectoId) return;
    
    const cargarProyecto = async () => {
      try {
        const response = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar información del proyecto');
        }
        
        const data = await response.json();
        console.log('Datos del proyecto actual:', data);
        setProyectoActual(data);
      } catch (error) {
        console.error('Error al cargar proyecto:', error);
      }
    };
    
    cargarProyecto();
  }, [isOpen, proyectoId]);

  // Cargar capas
  useEffect(() => {
    if (!isOpen) return;
    
    const cargarCapas = async () => {
      try {
        setLoading(true);
        
        console.log('VerCapas - proyectoId recibido:', proyectoId, typeof proyectoId);
        
        let url;
        if (filtroProyecto === 'actual' && proyectoId) {
          url = `http://10.161.1.76:8000/api/proyectos/${proyectoId}/capas`;
        } else {
          url = 'http://10.161.1.76:8000/api/capas-con-proyectos';
        }
        
        console.log('Intentando cargar capas desde:', url);
        
        const response = await fetch(url);
        const responseText = await response.text();
        console.log('Respuesta del servidor (texto):', responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error al parsear respuesta como JSON:', parseError);
          throw new Error('La respuesta del servidor no es JSON válido');
        }
        
        if (!response.ok) {
          const errorMsg = typeof responseData === 'object' && responseData.detail 
            ? JSON.stringify(responseData.detail) 
            : 'Error desconocido al cargar las capas';
          console.error('Error del servidor:', responseData);
          throw new Error(errorMsg);
        }
        
        console.log('Datos recibidos:', responseData);
        
        const capasFormateadas = Array.isArray(responseData) && responseData.length > 0 
          ? responseData.map(capa => {
              let codigoProyecto;
              
              if (filtroProyecto === 'actual' && proyectoActual) {
                codigoProyecto = proyectoActual.codigo_proyecto || '';
              } else {
                codigoProyecto = capa.codigo_proyecto || '';
              }
              
              return {
                ...capa,
                codigo_proyecto: codigoProyecto,
                visible: true
              };
            }) 
          : [];
        
        setCapas(capasFormateadas);
      } catch (error) {
        console.error('Error al cargar capas:', error);
        setError(error.message || 'Error al cargar las capas');
        setCapas([]);
      } finally {
        setLoading(false);
      }
    };
    
    cargarCapas();
  }, [isOpen, proyectoId, filtroProyecto, proyectoActual]);

  // Función para determinar el color de fondo de la capa (CORREGIDA)
  const getCapaBackgroundColor = (capa) => {
    // Para capas con tipo explícito
    if (capa.tipo) {
      if (capa.tipo.toLowerCase().includes('perforacion')) return '#FFD700';
      if (capa.tipo.toLowerCase().includes('calicata')) return '#FF6347';
      if (capa.tipo.toLowerCase().includes('cpt')) return '#ff7133';
      if (capa.tipo.toLowerCase().includes('dpl')) return '#00BFFF';
      if (capa.tipo.toLowerCase().includes('posteadora')) return '#00e0ff';
      if (capa.tipo.toLowerCase().includes('masw')) return '#8b00ff';
      if (capa.tipo.toLowerCase().includes('mam')) return '#0093ff';
      if (capa.tipo.toLowerCase().includes('downhole')) return '#0032ff';
      if (capa.tipo.toLowerCase().includes('crosshole')) return '#00ff36';
      if (capa.tipo.toLowerCase().includes('uphole')) return '#7eadca';
      if (capa.tipo.toLowerCase().includes('generales')) return '#2db851';
      if (capa.tipo.toLowerCase().includes('trinchera')) return '#ff8c00'; // Naranja para trinchera
    }
    
    // Para inferir tipo desde el nombre
    const nombre = capa.nombre.toLowerCase();
    if (nombre.includes('perforacion')) return '#FFD700';
    if (nombre.includes('calicata')) return '#FF6347';
    if (nombre.includes('cpt')) return '#ff7133';
    if (nombre.includes('dpl')) return '#00BFFF';
    if (nombre.includes('posteadora')) return '#00e0ff';
    if (nombre.includes('masw')) return '#8b00ff';
    if (nombre.includes('mam')) return '#0093ff';
    if (nombre.includes('downhole')) return '#0032ff';
    if (nombre.includes('crosshole')) return '#00ff36';
    if (nombre.includes('uphole')) return '#7eadca';
    if (nombre.includes('generales')) return '#2db851';
    if (nombre.includes('trinchera')) return '#ff8c00'; // Naranja para trinchera
  };

  // Función para cambiar visibilidad (MEJORADA con integración de mapa)
  const toggleVisibilidad = (capaId, esVisible) => {
    try {
      setCapas(prevCapas => 
        prevCapas.map(capa => {
          if (capa.id === capaId) {
            const capaActualizada = { ...capa, visible: !esVisible };
            
            // Comunicar el cambio de visibilidad al mapa
            actualizarVisibilidadEnMapa(capaActualizada);
            
            return capaActualizada;
          }
          return capa;
        })
      );
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
    }
  };

  // Aplicar visibilidad inicial a todos los puntos (memoizada con useCallback)
  const aplicarVisibilidadInicial = useCallback(() => {
    capas.forEach(capa => {
      actualizarVisibilidadEnMapa(capa);
    });
  }, [capas, actualizarVisibilidadEnMapa]);

  // Inicializar marcadores globales y aplicar visibilidad
  useEffect(() => {
    if (!window.marcadoresGlobales) {
      window.marcadoresGlobales = {};
    }
  }, [proyectoId]);

  // Aplicar visibilidad después de cargar capas
  useEffect(() => {
    if (capas.length > 0 && window.map) {
      setTimeout(aplicarVisibilidadInicial, 500);
    }
  }, [capas, aplicarVisibilidadInicial]);

  // Actualizar todas las capas según el filtro de visibilidad global
  useEffect(() => {
    if (filtroVisibilidad === 'visibles' || filtroVisibilidad === 'ocultos') {
      const nuevaVisibilidad = filtroVisibilidad === 'visibles';
      setCapas(prevCapas => 
        prevCapas.map(capa => {
          const capaActualizada = { ...capa, visible: nuevaVisibilidad };
          actualizarVisibilidadEnMapa(capaActualizada);
          return capaActualizada;
        })
      );
    }
  }, [filtroVisibilidad, actualizarVisibilidadEnMapa]);

  // Filtrar capas según los criterios seleccionados
  const capasFiltradas = capas.filter(capa => {
    if (filtroTipo !== 'todos' && capa.nombre !== filtroTipo) {
      return false;
    }
    return true;
  });

  // Cerrar completamente (notificar al componente padre)
  const handleClose = () => {
    setShowSidebar(false);
    if (onClose) onClose();
  };

  // Crear nueva capa (CORREGIDA)
  const handleCrearCapa = () => {
    if (onCrearCapa) {
      // Pasar la función de validación al componente padre
      onCrearCapa(proyectoId, validarCapaDuplicada);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="capas-container">
      <div className={`capas-sidebar ${showSidebar ? 'expanded' : 'collapsed'}`}>
        <div className="capas-header">
          <h2>CAPAS</h2>
          <div className="header-buttons">
            <button 
              className="toggle-sidebar-btn" 
              onClick={() => setShowSidebar(!showSidebar)}
              title={showSidebar ? "Colapsar panel" : "Expandir panel"}
            >
              <i className={`bx ${showSidebar ? 'bx-chevron-left' : 'bx-chevron-right'}`}></i>
            </button>
            <button 
              className="close-sidebar-btn" 
              onClick={handleClose}
              title="Cerrar panel"
            >
              <i className='bx bx-x'></i>
            </button>
          </div>
        </div>
        
        {showSidebar && (
          <div className="capas-content">
            <div className="capas-actions">
              <button className="crear-capa-btn" onClick={handleCrearCapa}>
                <i className='bx bx-plus'></i> Crear capa
              </button>
              
              <div className="ver-label">Ver</div>
              
              <div className="capas-filter-group">
                <select 
                  value={filtroProyecto} 
                  onChange={(e) => setFiltroProyecto(e.target.value)}
                  className="filter-select proyecto"
                >
                  <option value="actual">Proyecto actual</option>
                  <option value="todos">Todos los proyectos</option>
                </select>
              </div>
              
              <div className="capas-filter-group">
                <select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="filter-select tipo"
                >
                  <option value="todos">Tipo de Capa</option>
                  {tiposCapas.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              
              <div className="capas-filter-group">
                <select 
                  value={filtroVisibilidad} 
                  onChange={(e) => setFiltroVisibilidad(e.target.value)}
                  className="filter-select visibilidad"
                >
                  <option value="todos">No cambiar visibilidad</option>
                  <option value="visibles">Todo Visible</option>
                  <option value="ocultos">Todo Oculto</option>
                </select>
              </div>
            </div>
            
            <div className="capas-list">
              {loading ? (
                <div className="loading-indicator">Cargando capas...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : capasFiltradas.length === 0 ? (
                <div className="no-results">
                  {filtroProyecto === 'actual' ? 
                    "No existen capas asociadas para este proyecto." : 
                    "No se encontraron capas con los filtros aplicados."}
                </div>
              ) : (
                capasFiltradas.map((capa) => {
                  const tipoCapa = capa.nombre || '';
                  const codigoProyecto = capa.codigo_proyecto || '';
                  
                  // Nombre a mostrar, formato: "Tipo - Código"
                  const nombreMostrar = `${tipoCapa} ${codigoProyecto ? '- ' + codigoProyecto : ''}`;
                  
                  // Crear una key única combinando el ID de la capa y el ID del proyecto (si existe)
                  const uniqueKey = capa.proyecto_id ? `${capa.id}-${capa.proyecto_id}` : capa.id;
                  
                  return (
                    <div 
                      key={uniqueKey} 
                      className="capa-item"
                      style={{ backgroundColor: getCapaBackgroundColor(capa) }}
                      onClick={() => handleCapaClick(capa)}
                    >
                      <div className="capa-info">
                        <div className="capa-nombre">{nombreMostrar}</div>
                      </div>
                      <button 
                        className="visibility-toggle"
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar que el clic se propague al div padre
                          toggleVisibilidad(capa.id, capa.visible);
                        }}
                      >
                        <i className={`bx ${capa.visible ? 'bx-show' : 'bx-hide'}`}></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Tabla de perforaciones */}
      {mostrarTablaPerforaciones && capaSeleccionada && (
        <div className={`perforaciones-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaPerforaciones 
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto}
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de calicatas */}
      {mostrarTablaCalicatas && capaSeleccionada && (
        <div className={`calicatas-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaCalicatas 
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto}
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de cpt */}
      {mostrarTablaCpt && capaSeleccionada && (
        <div className={`cpt-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaCpt
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de dpl */}
      {mostrarTablaDpl && capaSeleccionada && (
        <div className={`dpl-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaDpl
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de posteadora */}
      {mostrarTablaPosteadora && capaSeleccionada && (
        <div className={`posteadora-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaPosteadora 
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de masw */}
      {mostrarTablaMasw && capaSeleccionada && (
        <div className={`masw-panel ${!showSidebar ? 'tabla-standalone': ''}`}>
          <TablaMasw
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de mam */}
      {mostrarTablaMam && capaSeleccionada && (
        <div className={`mam-panel ${!showSidebar ? 'tabla-standalone': ''}`}>
          <TablaMam
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de downhole */}
      {mostrarTablaDownhole && capaSeleccionada && (
        <div className={`downhole-panel ${!showSidebar ? 'tabla-standalone': ''}`}>
          <TablaDownhole
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de crosshole */}
      {mostrarTablaCrosshole && capaSeleccionada && (
        <div className={`crosshole-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaCrosshole
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de uphole */}
      {mostrarTablaUphole && capaSeleccionada && (
        <div className={`uphole-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaUphole 
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de generales */}
      {mostrarTablaGenerales && capaSeleccionada && (
        <div className={`generales-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaGenerales
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}

      {/* Tabla de trinchera */}
      {mostrarTablaTrinchera && capaSeleccionada && (
        <div className={`trincheras-panel ${!showSidebar ? 'tabla-standalone' : ''}`}>
          <TablaTrinchera
            proyectoId={capaSeleccionada.proyecto_id || proyectoId}
            codigoProyecto={proyectoActual?.codigo_proyecto} 
            onClose={handleCerrarTabla}
            map={window.map}
          />
        </div>
      )}
      

    </div>
  );
};

VerCapas.propTypes = {
  proyectoId: PropTypes.number,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onCrearCapa: PropTypes.func,
  onMostrarPerforaciones: PropTypes.func,
  onMostrarCalicatas: PropTypes.func,
  onMostrarCpt: PropTypes.func,
  onMostrarDpl: PropTypes.func,
  onMostrarPosteadora: PropTypes.func,
  onMostrarMasw: PropTypes.func,
  onMostrarMam: PropTypes.func,
  onMostrarDownhole: PropTypes.func,
  onMostrarCrosshole: PropTypes.func,
  onMostrarUphole: PropTypes.func,
  onMostrarGenerales: PropTypes.func,
  onMostrarTrinchera: PropTypes.func
};

export default VerCapas;