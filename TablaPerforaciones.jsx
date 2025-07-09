import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toLonLat, transform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import './TablaPerforaciones.css';
import Swal from 'sweetalert2';

import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Fill, Stroke, Text, Circle } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import Pointer from 'ol/interaction/Pointer';

const TablaPerforaciones = ({ proyectoId, codigoProyecto, map, onClose }) => {
  const [perforaciones, setPerforaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estructuras, setEstructuras] = useState([]);
  const [sistemaReferencia, setSistemaReferencia] = useState('GLOBAL (WGS84)');
  const [tipoSistemaReferencia, setTipoSistemaReferencia] = useState('geografico'); // Valor predeterminado



  const [nuevaPerforacion, setNuevaPerforacion] = useState(null);
  const [contadorPerforaciones, setContadorPerforaciones] = useState(1);
  const [unidadMinera, setUnidadMinera] = useState('SR'); // Por defecto San Rafael
  const [prefijoPerforacion, setPrefijoPerforacion] = useState(''); // Vacío por defecto
const [añoPerforacion, setAñoPerforacion] = useState(new Date().getFullYear().toString().substring(2));
  const [coordenadasConvertidas, setCoordenadasConvertidas] = useState({});
  const [perforacionEditando, setPerforacionEditando] = useState(null);
  
  


 // Verificar y cargar datos del sistema de referencia desde la API
  useEffect(() => {
    const obtenerSistemaReferencia = async () => {
      if (!proyectoId) return;
      
      try {
        // Obtener detalles del proyecto, incluyendo el sistema de referencia
        const response = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}`);
        
        if (response.ok) {
          const proyecto = await response.json();
          
          // Obtener el tipo de sistema directamente de los datos del proyecto
          const sistemaDB = proyecto.sistema_referencia_coordenadas;
          
          if (sistemaDB) {
            console.log(`Sistema de referencia en la base de datos: ${sistemaDB}`);
            
            const sistemaLower = sistemaDB.toLowerCase();
             console.log("Valor sistema lowercased:", sistemaLower);
            // Actualizar el tipo de sistema (geográfico o proyectado)
            if (sistemaLower === 'geografico' || sistemaLower === 'geográfico') {
              setTipoSistemaReferencia('geografico');
              setSistemaReferencia('GLOBAL (WGS84)');
            } 
            else if (sistemaLower === 'proyectado' || sistemaLower.includes('epsg:32')) {
               console.log("Configurando sistema PROYECTADO");
              setTipoSistemaReferencia('proyectado');
              
              // Determinar la zona UTM apropiada basada en el código EPSG si está disponible
              if (sistemaLower === 'epsg:32717') {
                setSistemaReferencia('UTM WGS84 Zona 17S');
              } else if (sistemaLower === 'epsg:32718') {
                setSistemaReferencia('UTM WGS84 Zona 18S');
              } else if (sistemaLower === 'epsg:32719') {
                setSistemaReferencia('UTM WGS84 Zona 19S');
              } else {
                // Por defecto usar zona 18S para Perú si no se especifica
                setSistemaReferencia('UTM WGS84 Zona 18S');
              }
            }
          } else {
            console.warn('No se encontró sistema de referencia en la base de datos, usando geográfico por defecto');
            setTipoSistemaReferencia('geografico');
            setSistemaReferencia('GLOBAL (WGS84)');
            
          }
        } else {
          console.error('Error al obtener sistema de referencia:', response.status);
        }
      } catch (error) {
        console.error('Error al cargar sistema de referencia:', error);
      }
    };
    
    obtenerSistemaReferencia();
  }, [proyectoId]);

  // Configuración de los sistemas de coordenadas
  useEffect(() => {
    // Definir proyecciones UTM para Perú (zonas 17, 18, 19)
    proj4.defs('EPSG:32717', '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs'); // Zona 17S
    proj4.defs('EPSG:32718', '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs'); // Zona 18S
    proj4.defs('EPSG:32719', '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs'); // Zona 19S
    
    // PSAD56 (sistemas antiguos usados en Perú)
    proj4.defs('EPSG:24877', '+proj=utm +zone=17 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs'); // PSAD56 17S
    proj4.defs('EPSG:24878', '+proj=utm +zone=18 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs'); // PSAD56 18S
    proj4.defs('EPSG:24879', '+proj=utm +zone=19 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs'); // PSAD56 19S
    
    // Registrar las proyecciones con OpenLayers
    register(proj4);
  }, []);

  // Función para convertir coordenadas entre diferentes sistemas
  // Wrap in useCallback to prevent re-creation on each render
const convertirCoordenadas = useCallback((longitud, latitud, deSistema, aSistema) => {
    // Si son el mismo sistema, no se necesita conversión
    if (deSistema === aSistema) return { longitud, latitud };
    
    try {
      let sourceEPSG = 'EPSG:4326'; // WGS84 (Global)
      let targetEPSG = 'EPSG:4326';
      
      // Determinar el EPSG basado en el nombre del sistema
      if (aSistema.includes('UTM')) {
        if (aSistema.includes('17S')) {
          targetEPSG = aSistema.includes('PSAD56') ? 'EPSG:24877' : 'EPSG:32717';
        } else if (aSistema.includes('18S')) {
          targetEPSG = aSistema.includes('PSAD56') ? 'EPSG:24878' : 'EPSG:32718';
        } else if (aSistema.includes('19S')) {
          targetEPSG = aSistema.includes('PSAD56') ? 'EPSG:24879' : 'EPSG:32719';
        }
      }
      
      if (deSistema.includes('UTM')) {
        if (deSistema.includes('17S')) {
          sourceEPSG = deSistema.includes('PSAD56') ? 'EPSG:24877' : 'EPSG:32717';
        } else if (deSistema.includes('18S')) {
          sourceEPSG = deSistema.includes('PSAD56') ? 'EPSG:24878' : 'EPSG:32718';
        } else if (deSistema.includes('19S')) {
          sourceEPSG = deSistema.includes('PSAD56') ? 'EPSG:24879' : 'EPSG:32719';
        }
      }
      
      // Convertir coordenadas
      const coords = transform([parseFloat(longitud), parseFloat(latitud)], sourceEPSG, targetEPSG);
      
      // Formateo especial para UTM (proyectado)
      if (targetEPSG.includes('327') || targetEPSG.includes('248')) {
        // Formato especial para coordenadas UTM: 
        // Este: 8 dígitos totales con 2 decimales (XXXXXX.XX)
        // Norte: 9 dígitos totales con 2 decimales (XXXXXXX.XX)
        return {
          longitud: coords[0].toFixed(2).padStart(9, '0'),  // Este: XXXXXX.XX
          latitud: coords[1].toFixed(2).padStart(10, '0')   // Norte: XXXXXXX.XX
        };
      }
      
      return {
        longitud: coords[0].toFixed(6),
        latitud: coords[1].toFixed(6)
      };
    } catch (error) {
      console.error('Error al convertir coordenadas:', error);
      return { longitud, latitud }; // En caso de error, devolver coordenadas originales
    }
  }, []);

  // Actualizar coordenadas cuando cambia el sistema de referencia
  useEffect(() => {
    // Convertir las coordenadas de todas las perforaciones al nuevo sistema
    const perforacionesConvertidas = {};
    
    perforaciones.forEach(perf => {
      if (perf.longitud && perf.latitud) {
        const convertidas = convertirCoordenadas(
          perf.longitud, 
          perf.latitud, 
          'GLOBAL (WGS84)', // Asumimos que las originales están en WGS84
          sistemaReferencia
        );
        
        perforacionesConvertidas[perf.id] = convertidas;
      }
    });
    
    // Si hay una nueva perforación, convertir sus coordenadas también
    if (nuevaPerforacion && nuevaPerforacion.longitud && nuevaPerforacion.latitud) {
      const convertidas = convertirCoordenadas(
        nuevaPerforacion.longitud,
        nuevaPerforacion.latitud,
        'GLOBAL (WGS84)',
        sistemaReferencia
      );
      
      perforacionesConvertidas['nueva'] = convertidas;
    }
    
    setCoordenadasConvertidas(perforacionesConvertidas);
  }, [sistemaReferencia, perforaciones, nuevaPerforacion, convertirCoordenadas]);

  // Cargar datos del proyecto
  useEffect(() => {
    const cargarProyecto = async () => {
      if (!proyectoId) return;
      
      try {
        const response = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Obtener el tipo de sistema de referencia
          if (data.sistema_referencia_coordenadas) {
            const tipoSRC = data.sistema_referencia_coordenadas.toLowerCase();
            setTipoSistemaReferencia(tipoSRC);
            
            // Establecer el sistema de referencia predeterminado según el tipo
            if (tipoSRC === 'geografico') {
              setSistemaReferencia('GLOBAL (WGS84)');
            } else if (tipoSRC === 'proyectado') {
              // Establecer al sistema UTM más común en Perú por defecto
              // Detectar cuál UTM es más adecuado según la ubicación del proyecto
              // Por ahora utilizamos Zona 18S por defecto (zona más común en Perú)
              setSistemaReferencia('UTM WGS84 Zona 18S');
            }
            
            console.log(`Sistema de coordenadas configurado: ${tipoSRC}`);
          } else {
            console.log('No se encontró sistema de coordenadas en el proyecto, usando Geográfico por defecto');
            setTipoSistemaReferencia('geografico');
            setSistemaReferencia('GLOBAL (WGS84)');
          }
          
          // Obtener abreviatura de la unidad minera
          if (data.unidad_minera) {
            let abrev = 'SR'; // Por defecto San Rafael
            if (data.unidad_minera.includes(' ')) {
              // Obtener primeras letras de cada palabra
              abrev = data.unidad_minera.split(' ')
                .map(palabra => palabra[0])
                .join('');
            } else if (data.unidad_minera.length >= 2) {
              // Primeras dos letras
              abrev = data.unidad_minera.substring(0, 2);
            }
            setUnidadMinera(abrev.toUpperCase());
          }

          
          // También cargar estructuras relacionadas con la unidad minera
          if (data.unidad_minera_id) {
            cargarEstructuras(data.unidad_minera_id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (proyectoId) {
      fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}`)
        .then(response => response.json())
        .then(proyecto => {
          if (proyecto.unidad_minera_id) {
            cargarEstructuras(proyecto.unidad_minera_id);
          }
        })
        .catch(error => console.error('Error al cargar proyecto:', error));
    }
    
    cargarProyecto();
  }, [proyectoId]);

  // Cargar estructuras relacionadas con la unidad minera
  const cargarEstructuras = async (unidadMineraId) => {
    try {
      // Usando la URL correcta según tu API 
      console.log(`Cargando estructuras para unidad minera ID: ${unidadMineraId}`);
      
      // Este formato parece ser el correcto basado en tus otros endpoints
      const response = await fetch(`http://10.161.1.76:8000/api/estructura/unidad_minera/${unidadMineraId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Estructuras cargadas:", data);
        setEstructuras(data);
      } else {
        console.error(`Error al cargar estructuras: ${response.status}`);
        // No usamos datos de ejemplo para cumplir con tu requisito
        setEstructuras([]);
      }
    } catch (error) {
      console.error('Error al cargar estructuras:', error);
      setEstructuras([]);
    }
  };


// Cargar perforaciones existentes
useEffect(() => {
  const cargarPerforaciones = async () => {
    if (!proyectoId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoId}/perforaciones`);
      
      if (response.ok) {
        const data = await response.json();
        setPerforaciones(data);
        
        // Extraer el prefijo y año del primer código si existe
       if (data.length > 0) {
  const primerCodigo = data[0].codigo_perforacion;
  
  // Buscar el patrón: todo antes del año (2 dígitos) y el guión final
  // Ejemplo: BH-MJ25-01 → BH-MJ es el prefijo, 25 es el año
  const match = primerCodigo.match(/^(.+?)(\d{2})-(\d+)$/);
  
  if (match) {
    const prefijo = match[1]; // Captura todo antes de los 2 dígitos del año
    const año = match[2];      // Captura los 2 dígitos del año
    const numero = match[3];   // Captura el número secuencial
    
    console.log("Prefijo detectado:", prefijo);
    console.log("Año detectado:", año);
    console.log("Número detectado:", numero);
    
    setPrefijoPerforacion(prefijo);
    setAñoPerforacion(año);
    
    // Determinar el último número
    const ultimoNumero = data.reduce((max, perf) => {
      const matchNum = perf.codigo_perforacion.match(/-(\d+)$/);
      if (matchNum) {
        const num = parseInt(matchNum[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    setContadorPerforaciones(ultimoNumero + 1);
  }
}
      } else {
        console.warn('No se pudieron cargar las perforaciones desde la API');
        setPerforaciones([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar perforaciones');
      setPerforaciones([]);
    } finally {
      setLoading(false);
    }
  };
  
  cargarPerforaciones();
}, [proyectoId, unidadMinera]);

  // Después de cargar las perforaciones, aplicar conversión automática si es sistema proyectado
   useEffect(() => {
    // Si el sistema es proyectado, convertir automáticamente de WGS84 a UTM
    if (tipoSistemaReferencia === 'proyectado' && perforaciones.length > 0 && !loading) {
      console.log('Aplicando conversión a sistema proyectado...');
      const perforacionesConvertidas = {};
      
      // Determinar el sistema UTM adecuado según la ubicación aproximada
      // Si no tenemos suficiente información, usar zona 18S por defecto para Perú
      let sistemaUTM = 'UTM WGS84 Zona 18S';
      
      // Si tenemos perforaciones con coordenadas, usar la primera para determinar zona
      if (perforaciones[0]?.longitud) {
        const lon = parseFloat(perforaciones[0].longitud);
        // Determinar la zona UTM basada en la longitud
        if (lon < -76.5) {
          sistemaUTM = 'UTM WGS84 Zona 17S';
        } else if (lon < -70.5) {
          sistemaUTM = 'UTM WGS84 Zona 18S';
        } else {
          sistemaUTM = 'UTM WGS84 Zona 19S';
        }
      }
      
      // Actualizar el sistema de referencia si es necesario
      if (sistemaReferencia !== sistemaUTM && tipoSistemaReferencia === 'proyectado') {
        console.log(`Actualizando sistema a ${sistemaUTM} basado en las coordenadas`);
        setSistemaReferencia(sistemaUTM);
      }
      
      perforaciones.forEach(perf => {
        if (perf.longitud && perf.latitud) {
          const convertidas = convertirCoordenadas(
            perf.longitud, 
            perf.latitud, 
            'GLOBAL (WGS84)', 
            sistemaUTM
          );
          
          perforacionesConvertidas[perf.id] = convertidas;
        }
      });
      
      setCoordenadasConvertidas(perforacionesConvertidas);
    }
  }, [tipoSistemaReferencia, perforaciones, sistemaReferencia, convertirCoordenadas, loading]);



  // Verificar acceso al mapa
  useEffect(() => {
    // Intentar obtener el mapa global si no se proporcionó como prop
    const mapInstance = map || window.map;
    
    if (!mapInstance) {
      console.warn("No se encuentra ninguna instancia del mapa disponible");
    } else {
      console.log("Mapa disponible:", mapInstance);
    }
  }, [map]);

  // Escuchar clics en el mapa para agregar perforaciones
  useEffect(() => {
    // Intentar obtener el mapa global si no se proporcionó como prop
    const mapInstance = map || window.map;
    
    if (!mapInstance || !nuevaPerforacion) return;
    
    console.log("Configurando listener de clic en el mapa para nuevas perforaciones");
    
    const handleMapClick = (evt) => {
      // Obtener coordenadas del clic
      const coords = evt.coordinate;
      const lonLatCoords = toLonLat(coords);
      
      console.log("Clic en el mapa detectado, coordenadas:", lonLatCoords);
      
      // Actualizar la nueva perforación con las coordenadas
      // Asegurarnos de convertir correctamente al sistema actual
      if (sistemaReferencia.includes('UTM')) {
        // Convertir de WGS84 a UTM para mostrar
        const convertidas = convertirCoordenadas(
          lonLatCoords[0], 
          lonLatCoords[1], 
          'GLOBAL (WGS84)', 
          sistemaReferencia
        );
        
        setNuevaPerforacion(prev => ({
          ...prev,
          // Guardar las coordenadas UTM para mostrar
          longitud: convertidas.longitud,
          latitud: convertidas.latitud,
          // Guardar las originales WGS84 para el guardado
          longitud_original: lonLatCoords[0].toFixed(6),
          latitud_original: lonLatCoords[1].toFixed(6),
          elevacion: prev.elevacion || 0
        }));
      } else {
        // Simplemente guardar las coordenadas WGS84
        setNuevaPerforacion(prev => ({
          ...prev,
          longitud: lonLatCoords[0].toFixed(6),
          latitud: lonLatCoords[1].toFixed(6),
          elevacion: prev.elevacion || 0
        }));
      }
    };
    
    // Agregar el listener de evento
    mapInstance.on('click', handleMapClick);
    
    // Limpiar el listener cuando el componente se desmonte o cambie el estado
    return () => {
      console.log("Eliminando listener de clic del mapa");
      if (mapInstance) {
        mapInstance.un('click', handleMapClick);
      }
    };
  }, [map, nuevaPerforacion, sistemaReferencia, convertirCoordenadas]);

  const layerName = 'perforacionesMarkers';
  // Agregar marcadores al mapa para las perforaciones existentes
useEffect(() => {
  const mapInstance = map || window.map;
  if (!mapInstance || perforaciones.length === 0) return;
  
  // Crear una capa vectorial para los marcadores si no existe
  let vectorLayer = mapInstance.getLayers().getArray()
 .find(layer => layer.get('name') === layerName);

if (!vectorLayer) {
  const vectorSource = new VectorSource();
  vectorLayer = new VectorLayer({
    source: vectorSource,
    name: layerName,  // ← ESTE NOMBRE
    zIndex: 10
  });
    mapInstance.addLayer(vectorLayer);
  }
  
  // Limpiar marcadores existentes
  vectorLayer.getSource().clear();

  
  // Crear marcadores para cada perforación
  perforaciones.forEach(perf => {
    if (perf.longitud && perf.latitud) {
      const coords = fromLonLat([parseFloat(perf.longitud), parseFloat(perf.latitud)]);
      
      // Crear elemento cuadrado para el marcador
    const feature = new Feature({
  geometry: new Point(coords),
  name: perf.codigo_perforacion,
  capaType: 'perforaciones',  
  proyectoId: proyectoId
});

feature.set('perforacion', perf);

      const getProjectColor = (projectId) => {
        // Lista de colores base para diferentes proyectos
        const colors = [
          'rgba(255, 0, 0, 0.7)',    // Rojo
          'rgba(0, 0, 255, 0.7)',    // Azul
          'rgba(0, 128, 0, 0.7)',    // Verde
          'rgba(255, 165, 0, 0.7)',  // Naranja
          'rgba(128, 0, 128, 0.7)',  // Púrpura
          'rgba(255, 192, 203, 0.7)', // Rosa
          'rgba(0, 128, 128, 0.7)',  // Verde azulado
          'rgba(128, 128, 0, 0.7)',  // Oliva
          'rgba(70, 130, 180, 0.7)'  // Azul acero
        ];
        
        // Usar el ID del proyecto para seleccionar un color
        const colorIndex = (projectId % colors.length);
        return colors[colorIndex];
      };
      
      
      // Estilo cuadrado para las perforaciones
      feature.setStyle(new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: getProjectColor(perf.proyecto_id || proyectoId)
          }),
          stroke: new Stroke({
            color: 'white',
            width: 2
          })
        }),
        text: new Text({
          text: perf.codigo_perforacion,
          offsetY: -15,
          fill: new Fill({
            color: '#333'
          }),
          stroke: new Stroke({
            color: 'white',
            width: 2
          })
        })
      }));
      
      vectorLayer.getSource().addFeature(feature);
    }
  });
  
  // Configurar tooltips para los marcadores
  // Elemento para el tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-perforacion';
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = 'white';
  tooltip.style.padding = '8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  tooltip.style.zIndex = '1000';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.fontSize = '12px';
  tooltip.style.maxWidth = '200px';
  tooltip.style.lineHeight = '1.4';
  tooltip.style.border = '1px solid #ccc';
  document.body.appendChild(tooltip);
  
  // Interacción para mostrar tooltip
  const pointerMoveInteraction = new Pointer({
    handleMoveEvent: function(evt) {
      const pixel = mapInstance.getEventPixel(evt.originalEvent);
      const hit = mapInstance.hasFeatureAtPixel(pixel, {
        layerFilter: layer => layer === vectorLayer
      });
      
      if (hit) {
        const feature = mapInstance.forEachFeatureAtPixel(
          pixel, 
          feature => feature, 
          { layerFilter: layer => layer === vectorLayer }
        );
        
        if (feature) {
          const perf = feature.get('perforacion');
          // Personalizar el tooltip según el tipo de coordenadas
          const coordLabels = tipoSistemaReferencia === 'geografico' ? 
            ['Longitud', 'Latitud'] : ['Este', 'Norte'];
          
          tooltip.innerHTML = `
            <strong>${perf.codigo_perforacion}</strong><br>
            ${coordLabels[0]}: ${perf.longitud}<br>
            ${coordLabels[1]}: ${perf.latitud}
          `;
          tooltip.style.display = 'block';
          
          // Posicionar tooltip cerca del cursor
          const map = evt.map;
          const coordinate = evt.coordinate;
          const pixelPosition = map.getPixelFromCoordinate(coordinate);
          
          // Obtener dimensiones de la ventana
          const windowWidth = window.innerWidth;
          const tooltipWidth = 200; // Ancho aproximado del tooltip
          
          // Determinar si colocar el tooltip a la derecha o izquierda del cursor
          if (pixelPosition[0] + tooltipWidth + 20 > windowWidth) {
            // Si no hay espacio a la derecha, colocar a la izquierda
            tooltip.style.left = (pixelPosition[0] - tooltipWidth - 10) + 'px';
          } else {
            // Si hay espacio, colocar a la derecha
            tooltip.style.left = (pixelPosition[0] + 160) + 'px';
          }
          
          // Colocar verticalmente alineado con el cursor
          tooltip.style.top = (pixelPosition[1] + 300) + 'px';
        }
      } else {
        tooltip.style.display = 'none';
      }
    }
  });
  
  mapInstance.addInteraction(pointerMoveInteraction);
  
  // Limpiar al desmontar
  return () => {
    mapInstance.removeInteraction(pointerMoveInteraction);
    document.body.removeChild(tooltip);
  };
}, [map, perforaciones, proyectoId, tipoSistemaReferencia]);



// REEMPLAZAR esta función completa:
const generarCodigoPerforacion = (numeroSecuencial = null) => {
  const numero = numeroSecuencial || contadorPerforaciones;
  const secuencial = numero.toString().padStart(2, '0');
  
  console.log("Generando código con:");
  console.log("- Prefijo:", prefijoPerforacion);
  console.log("- Año:", añoPerforacion);
  console.log("- Secuencial:", secuencial);
  
  const codigo = `${prefijoPerforacion}${añoPerforacion}-${secuencial}`;
  console.log("Código final:", codigo);
  
  return codigo;
};


// Actualizar todos los códigos de perforación cuando cambia el prefijo o año
const actualizarTodosLosCodigos = async (nuevoPrefijo, nuevoAño) => {
  try {
    const perforacionesActualizadas = perforaciones.map((perf, index) => {
      const secuencial = (index + 1).toString().padStart(2, '0');
      // NO agregar guiones automáticamente
      const nuevoCodigo = `${nuevoPrefijo}${nuevoAño}-${secuencial}`;
      
      return {
        ...perf,
        codigo_perforacion: nuevoCodigo
      };
    });
    // Actualizar el estado localmente
    setPerforaciones(perforacionesActualizadas);
    
    // Ahora actualizar cada perforación en la base de datos
    const promesasActualizacion = perforacionesActualizadas.map(async (perf) => {
      try {
        const response = await fetch(`http://10.161.1.76:8000/api/perforaciones/${perf.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(perf),
        });
        
        if (!response.ok) {
          console.error(`Error al actualizar perforación ${perf.id}`);
          return null;
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error al actualizar perforación ${perf.id}:`, error);
        return null;
      }
    });
    
    // Esperar a que todas las actualizaciones se completen
    const resultados = await Promise.all(promesasActualizacion);
    
    // Verificar si hubo errores
    const errores = resultados.filter(r => r === null).length;
    
    if (errores > 0) {
      Swal.fire({
        title: 'Actualización parcial',
        text: `Se actualizaron ${resultados.length - errores} de ${resultados.length} perforaciones`,
        icon: 'warning',
        confirmButtonColor: '#ff9800'
      });
    } else {
      Swal.fire({
        title: 'Códigos actualizados',
        text: 'Todos los códigos de perforación han sido actualizados en la base de datos',
        icon: 'success',
        confirmButtonColor: '#4CAF50',
        timer: 2000
      });
    }
    
  } catch (error) {
    console.error('Error al actualizar códigos:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudieron actualizar los códigos en la base de datos',
      icon: 'error',
      confirmButtonColor: '#f44336'
    });
  }
};

// Manejar agregar nueva perforación
const handleAgregarPerforacion = () => {
  // Verificar que tenemos acceso al mapa
  const mapInstance = map || window.map;
  console.log("Acceso al mapa:", !!mapInstance);

  console.log("Prefijo actual:", prefijoPerforacion);
  console.log("Año actual:", añoPerforacion);
  console.log("Contador actual:", contadorPerforaciones);

  
  const nuevaPerf = {
    id: null, // Será asignado por la base de datos
    codigo_perforacion: generarCodigoPerforacion(),
    longitud: '',
    latitud: '',
    elevacion: '',
    azimuth: '',
    inclinacion: '',
    profundidad_suelo_metros: '',
    profundidad_roca_metros: '',
    profundidad_relleno_metros: '',
    profundidad_relave_metros: '',
    fecha_inicio: '',
    fecha_fin: '',
    proyecto_id: proyectoId,
    estructura_id: ''
  };
   setNuevaPerforacion(nuevaPerf);
   console.log("Código generado:", nuevaPerf.codigo_perforacion);

  
  Swal.fire({
      title: 'Agregar Perforación',
      text: 'Haga clic en el mapa para establecer la perforación',
      icon: 'info',
      confirmButtonColor: '#4CAF50',
      timer: 5000,
      timerProgressBar: true
    });
  };

  // Manejar cambios en los campos de la nueva perforación
  const handleCampoChange = (campo, valor) => {
    if (!nuevaPerforacion) return;
    
    // Si estamos cambiando coordenadas manualmente y estamos en un sistema UTM
    if ((campo === 'longitud' || campo === 'latitud') && sistemaReferencia.includes('UTM')) {
      setNuevaPerforacion(prev => {
        const updatedPerf = { ...prev, [campo]: valor };
        
        // Si tenemos ambas coordenadas en UTM, convertir a WGS84 para guardar
        if (updatedPerf.longitud && updatedPerf.latitud) {
          const convertidas = convertirCoordenadas(
            updatedPerf.longitud,
            updatedPerf.latitud,
            sistemaReferencia,
            'GLOBAL (WGS84)'
          );
          
          // Guardar las coordenadas originales (WGS84) en campos separados
          updatedPerf.longitud_original = convertidas.longitud;
          updatedPerf.latitud_original = convertidas.latitud;
        }
        
        return updatedPerf;
      });
    } else {
      // Para cualquier otro campo, simplemente actualizar el valor
      setNuevaPerforacion(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  // Guardar nueva perforación
  const handleGuardar = async () => {
    if (!nuevaPerforacion) return;
    
    try {

      const camposRequeridos = [
        'longitud', 'latitud', 'elevacion', 'azimuth', 'inclinacion',
        'profundidad_suelo_metros', 'profundidad_roca_metros', 'estructura_id'
      ];

       
    const camposFaltantes = camposRequeridos.filter(campo => 
      !nuevaPerforacion[campo] || nuevaPerforacion[campo] === ''
    );

    if (camposFaltantes.length > 0) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

      // Validar campos requeridos
      if (!nuevaPerforacion.longitud || !nuevaPerforacion.latitud) {
        alert('Debe seleccionar un punto en el mapa para obtener coordenadas');
        return;
      }
      
      // Crear objeto con los datos a guardar
      // Si estamos en UTM, guardar las coordenadas originales (WGS84)
      const longitud = sistemaReferencia.includes('UTM') && nuevaPerforacion.longitud_original 
        ? nuevaPerforacion.longitud_original 
        : nuevaPerforacion.longitud;
        
      const latitud = sistemaReferencia.includes('UTM') && nuevaPerforacion.latitud_original 
        ? nuevaPerforacion.latitud_original 
        : nuevaPerforacion.latitud;
      
      const perforacionData = {
        ...nuevaPerforacion,
        // Convertir campos numéricos
        longitud: parseFloat(longitud),
        latitud: parseFloat(latitud),
        elevacion: parseFloat(nuevaPerforacion.elevacion || 0),
        azimuth: parseFloat(nuevaPerforacion.azimuth || 0),
        inclinacion: parseFloat(nuevaPerforacion.inclinacion || 0),
        profundidad_suelo_metros: parseFloat(nuevaPerforacion.profundidad_suelo_metros || 0),
        profundidad_roca_metros: parseFloat(nuevaPerforacion.profundidad_roca_metros || 0),
        profundidad_relleno_metros: parseFloat(nuevaPerforacion.profundidad_relleno_metros || 0),
        profundidad_relave_metros: parseFloat(nuevaPerforacion.profundidad_relave_metros ||0),
        estructura_id: parseInt(nuevaPerforacion.estructura_id || 0, 10)
      };
      
      // Eliminar campos adicionales que no deben ir a la DB
      delete perforacionData.longitud_original;
      delete perforacionData.latitud_original;
      
      console.log("Guardando perforación con datos:", perforacionData);
      
      // Intento de guardado en la API
      try {
        const response = await fetch(`http://10.161.1.76:8000/api/perforaciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(perforacionData),
        });
        
        if (response.ok) {
          const nuevaPerforacionGuardada = await response.json();
          console.log("Perforación guardada exitosamente:", nuevaPerforacionGuardada);
          
          // Actualizar lista de perforaciones
          setPerforaciones(prev => [...prev, nuevaPerforacionGuardada]);
          Swal.fire({
            title: '¡Éxito!',
            text: 'Perforación guardada exitosamente',
            icon: 'success',
            confirmButtonColor: '#4CAF50'
          });
        } else {
          console.warn('Error en la API, simulando guardado local');
          console.log("Respuesta de error:", await response.text());
          
          // Simulación de guardado local
          const perforacionLocal = {
            ...perforacionData,
            id: Math.floor(Math.random() * 1000) + 10, // ID aleatorio para demostración
          };
          setPerforaciones(prev => [...prev, perforacionLocal]);
          alert("No se pudo guardar en el servidor, pero se ha añadido localmente");
        }
      } catch (apiError) {
        console.warn('Error al comunicarse con la API, simulando guardado local', apiError);
        // Simulación de guardado local
        const perforacionLocal = {
          ...perforacionData,
          id: Math.floor(Math.random() * 1000) + 10, // ID aleatorio para demostración
        };
        setPerforaciones(prev => [...prev, perforacionLocal]);
        alert("Error de conexión, pero se ha añadido localmente");
      }
      
      // Incrementar contador para la siguiente perforación
      setContadorPerforaciones(prev => prev + 1);
      
      // Limpiar estado de nueva perforación
      setNuevaPerforacion(null);
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar la perforación');
      alert("Error al guardar: " + error.message);
    }
  };



// Iniciar edición de perforación
const iniciarEdicion = (perforacion) => {
  setPerforacionEditando({...perforacion});

  Swal.fire({
    title: 'Modo edición',
    text: 'Puedes hacer clic en el mapa para actualizar la ubicación de la perforación',
    icon: 'info',
    confirmButtonColor: '#4CAF50',
    timer: 3000,
    timerProgressBar: true
  });
};

// Cancelar edición
const cancelarEdicion = () => {
  setPerforacionEditando(null);
};

// Agregar este nuevo efecto para escuchar clics en el mapa cuando estamos editando
useEffect(() => {
  const mapInstance = map || window.map;
  if (!mapInstance || !perforacionEditando) return;
  
  console.log("Configurando listener para actualizar ubicación en edición");
  
  const handleMapClickForEdit = (evt) => {
    // Obtener coordenadas del clic
    const coords = evt.coordinate;
    const lonLatCoords = toLonLat(coords);
    
    console.log("Clic en el mapa para editar, coordenadas:", lonLatCoords);
    
    // Actualizar la perforación que se está editando
    if (sistemaReferencia.includes('UTM')) {
      // Convertir de WGS84 a UTM para mostrar
      const convertidas = convertirCoordenadas(
        lonLatCoords[0], 
        lonLatCoords[1], 
        'GLOBAL (WGS84)', 
        sistemaReferencia
      );
      
      setPerforacionEditando(prev => ({
        ...prev,
        // Guardar las coordenadas UTM para mostrar
        longitud: convertidas.longitud,
        latitud: convertidas.latitud,
        // Guardar las originales WGS84 para el guardado
        longitud_original: lonLatCoords[0].toFixed(6),
        latitud_original: lonLatCoords[1].toFixed(6)
      }));
    } else {
      // Simplemente guardar las coordenadas WGS84
      setPerforacionEditando(prev => ({
        ...prev,
        longitud: lonLatCoords[0].toFixed(6),
        latitud: lonLatCoords[1].toFixed(6)
      }));
    }
    
    // Mostrar confirmación
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    
    toast.fire({
      icon: 'success',
      title: 'Ubicación actualizada'
    });
  };
  
  // Agregar el listener
  mapInstance.on('click', handleMapClickForEdit);
  
  // Limpiar al desmontar
  return () => {
    mapInstance.un('click', handleMapClickForEdit);
  };
}, [map, perforacionEditando, sistemaReferencia, convertirCoordenadas]);

// 🔄 AÑADIR: useEffect para registrar marcadores globalmente
// Agregar este useEffect DESPUÉS de todos los demás useEffect en TablaGenerales.jsx
useEffect(() => {
  if (!window.marcadoresGlobales) {
    window.marcadoresGlobales = {};
  }
  
  // Registrar los marcadores de generales para control de visibilidad
  const key = `perforaciones_${proyectoId}`;
  const mapInstance = map || window.map;
  
  if (mapInstance && perforaciones.length > 0) {
  
   const vectorLayer = mapInstance.getLayers().getArray()
  .find(layer => layer.get('name') === layerName);
    
    if (vectorLayer) {
      const features = vectorLayer.getSource().getFeatures();
      window.marcadoresGlobales[key] = features;
      console.log(`📍 Registrados ${features.length} marcadores de generales para control de visibilidad`);
    }
  }
}, [map, perforaciones, proyectoId]);

// Manejar cambios en los campos de edición
const handleEdicionChange = (campo, valor) => {
  if (!perforacionEditando) return;
  
  // Actualizar el valor en el estado
  setPerforacionEditando(prev => {
    const updatedPerf = { ...prev, [campo]: valor };
    
    // Si estamos cambiando longitud o latitud
    if ((campo === 'longitud' || campo === 'latitud') && updatedPerf.longitud && updatedPerf.latitud) {
      // Si estamos en UTM, convertir a WGS84 para almacenar
      if (sistemaReferencia.includes('UTM')) {
        const convertidas = convertirCoordenadas(
          updatedPerf.longitud,
          updatedPerf.latitud,
          sistemaReferencia,
          'GLOBAL (WGS84)'
        );
        
        updatedPerf.longitud_original = convertidas.longitud;
        updatedPerf.latitud_original = convertidas.latitud;
        
        // Actualizar el marcador en el mapa si es posible
        updateMarkerPosition(convertidas.longitud, convertidas.latitud);
      } else {
        // Estamos en WGS84, actualizar directamente el marcador
        updateMarkerPosition(updatedPerf.longitud, updatedPerf.latitud);
      }
    }
    
    return updatedPerf;
  });
};

const updateMarkerPosition = (longitud, latitud) => {
  try {
    // Solo actualizar si tenemos el mapa y coordenadas válidas
    const mapInstance = map || window.map;
    if (!mapInstance) return;
    
    // Comprobar si los valores son números válidos
    const lon = parseFloat(longitud);
    const lat = parseFloat(latitud);
    if (isNaN(lon) || isNaN(lat)) return;
    
    // Buscar la capa de marcadores
    const vectorLayer = mapInstance.getLayers().getArray()
      .find(layer => layer.get('name') === 'perforationMarkers');
    
    if (!vectorLayer) return;
    
    // Buscar y actualizar el marcador de edición
    const features = vectorLayer.getSource().getFeatures();
    const editFeature = features.find(f => 
      f.get('perforacion') && f.get('perforacion').id === perforacionEditando.id
    );
    
    if (editFeature) {
      // Actualizar la geometría del marcador
      const newCoords = fromLonLat([lon, lat]);
      editFeature.getGeometry().setCoordinates(newCoords);
      
      // También actualizar el objeto perforación asociado
      const perfData = editFeature.get('perforacion');
      editFeature.set('perforacion', {
        ...perfData,
        longitud: lon,
        latitud: lat
      });
    }
  } catch (error) {
    console.error("Error al actualizar la posición del marcador:", error);
  }
};


// Guardar edición de perforación
const guardarEdicion = async () => {
  try {
    // Validar campos
    const camposRequeridos = [
      'longitud', 'latitud', 'elevacion', 'azimuth', 'inclinacion',
      'profundidad_suelo_metros', 'profundidad_roca_metros', 'estructura_id'
    ];
    
    const camposFaltantes = camposRequeridos.filter(campo => 
      !perforacionEditando[campo] && perforacionEditando[campo] !== 0
    );
    
    if (camposFaltantes.length > 0) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

    // Preparar datos para la API
    const longitud = sistemaReferencia.includes('UTM') && perforacionEditando.longitud_original 
      ? perforacionEditando.longitud_original 
      : perforacionEditando.longitud;
      
    const latitud = sistemaReferencia.includes('UTM') && perforacionEditando.latitud_original 
      ? perforacionEditando.latitud_original 
      : perforacionEditando.latitud;
    
    // Si se cambió el prefijo o año, actualizar el código de esta perforación
    let codigoActualizado = perforacionEditando.codigo_perforacion;
   if (perforacionEditando.prefijo || perforacionEditando.año) {
  const prefijo = perforacionEditando.prefijo || prefijoPerforacion;
  const año = perforacionEditando.año || añoPerforacion;
  const partes = perforacionEditando.codigo_perforacion.split('-');
  const secuencial = partes[partes.length - 1];
  // NO agregar guiones automáticos
  codigoActualizado = `${prefijo}${año}-${secuencial}`;
}
    
    // Preparar datos para la API
    const perforacionData = {
      ...perforacionEditando,
      codigo_perforacion: codigoActualizado, // Usar el código actualizado
      longitud: parseFloat(longitud),
      latitud: parseFloat(latitud),
      elevacion: parseFloat(perforacionEditando.elevacion),
      azimuth: parseFloat(perforacionEditando.azimuth),
      inclinacion: parseFloat(perforacionEditando.inclinacion),
      profundidad_suelo_metros: parseFloat(perforacionEditando.profundidad_suelo_metros),
      profundidad_roca_metros: parseFloat(perforacionEditando.profundidad_roca_metros),
      profundidad_relleno_metros: parseFloat(perforacionEditando.profundidad_relleno_metros || 0),
      profundidad_relave_metros: parseFloat(perforacionEditando.profundidad_relave_metros || 0),
      estructura_id: parseInt(perforacionEditando.estructura_id, 10)
    };

    // Eliminar campos adicionales
    delete perforacionData.longitud_original;
    delete perforacionData.latitud_original;
    delete perforacionData.prefijo;
    delete perforacionData.año;
    
    // Enviar a la API
    const response = await fetch(`http://10.161.1.76:8000/api/perforaciones/${perforacionEditando.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(perforacionData),
    });
    
    if (response.ok) {
      const perforacionActualizada = await response.json();
      
      // Actualizar lista de perforaciones
      setPerforaciones(prev => prev.map(p => 
        p.id === perforacionActualizada.id ? perforacionActualizada : p
      ));
      
      // Si se cambió el prefijo o año, actualizar TODOS los códigos
      if (perforacionEditando.prefijo && perforacionEditando.prefijo !== prefijoPerforacion) {
        setPrefijoPerforacion(perforacionEditando.prefijo);
        await actualizarTodosLosCodigos(perforacionEditando.prefijo, perforacionEditando.año || añoPerforacion);
      } else if (perforacionEditando.año && perforacionEditando.año !== añoPerforacion) {
        setAñoPerforacion(perforacionEditando.año);
        await actualizarTodosLosCodigos(prefijoPerforacion, perforacionEditando.año);
      }
      
      // Terminar edición
      setPerforacionEditando(null);
      
      // Notificar al usuario
      Swal.fire({
        title: '¡Actualizado!',
        text: 'Perforación actualizada exitosamente',
        icon: 'success',
        confirmButtonColor: '#4CAF50'
      });
    } else {
      throw new Error('Error al actualizar perforación');
    }
  } catch (error) {
    console.error('Error al guardar edición:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo actualizar la perforación',
      icon: 'error',
      confirmButtonColor: '#f44336'
    });
  }
};

// Eliminar perforación
const handleEliminar = async (perforacionId) => {
  try {
    // Confirmar eliminación
    const confirmResult = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede revertir",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmResult.isConfirmed) {
      // Enviar solicitud de eliminación
      const response = await fetch(`http://10.161.1.76:8000/api/perforaciones/${perforacionId}`, {
        method: 'DELETE',
      });
      
      
if (response.ok) {
  // Actualizar la lista de perforaciones
  setPerforaciones(prevPerforaciones => 
    prevPerforaciones.filter(p => p.id !== perforacionId)
  );
  
  // Recalcular el contador para las siguientes perforaciones
  const perforacionesRestantes = perforaciones.filter(p => p.id !== perforacionId);
  
  if (perforacionesRestantes.length === 0) {
    setContadorPerforaciones(1);
  } else {
    // Encontrar el último número en las perforaciones restantes
    const ultimoNumero = perforacionesRestantes.reduce((max, perf) => {
      const match = perf.codigo_perforacion.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    setContadorPerforaciones(ultimoNumero + 1);
  }
  
  Swal.fire({
    title: 'Eliminado',
    text: 'La perforación ha sido eliminada',
    icon: 'success',
    confirmButtonColor: '#4CAF50'
  });
}else {
        throw new Error('Error al eliminar perforación');
      }
    }
  } catch (error) {
    console.error('Error al eliminar perforación:', error);
    
    Swal.fire({
      title: '¡Error!',
      text: 'No se pudo eliminar la perforación: ' + error.message,
      icon: 'error',
      confirmButtonColor: '#d33'
    });
  }
};


  // Obtener el nombre de la estructura
  const getEstructuraNombre = (estructuraId) => {
    const estructura = estructuras.find(e => e.id === estructuraId);
    return estructura ? estructura.descripcion : '-';
  };
  
  // Obtener coordenadas a mostrar (originales o convertidas)
  const getCoordenadas = (perforacion, campo) => {
    if (sistemaReferencia === 'GLOBAL (WGS84)' || !coordenadasConvertidas[perforacion.id]) {
      return perforacion[campo];
    }
    
    return coordenadasConvertidas[perforacion.id][campo === 'longitud' ? 'longitud' : 'latitud'];
  };
  
  // Obtener coordenadas para la nueva perforación
  const getNuevaCoordenada = (campo) => {
    if (!nuevaPerforacion) return '';
    
    if (sistemaReferencia === 'GLOBAL (WGS84)' || !coordenadasConvertidas['nueva']) {
      return nuevaPerforacion[campo];
    }
    
    return coordenadasConvertidas['nueva'][campo === 'longitud' ? 'longitud' : 'latitud'];
  };

  console.log("Estado de nuevaPerforacion:", nuevaPerforacion);

  return (
    <div className="tabla-perforaciones-container">
      <div className="panel-perforaciones">
        <div className="panel-header">
          <div className="titulo-panel">
            Perforaciones: {codigoProyecto || `LI-201-00023/23`}
          </div>
          
          <div className="acciones-panel">
            <button 
              className="btn-agregar-perforacion" 
              onClick={handleAgregarPerforacion}
            >
              + Agregar Perforación
            </button>

            <button 
  className="btn-configurar-codigo"
 onClick={() => {
  Swal.fire({
    title: 'Configurar Código Base',
    width: '400px',
    html: `
      <style>
        .config-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .input-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        .input-group input {
          padding: 8px 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }
        .input-group input:focus {
          border-color: #4CAF50;
          outline: none;
        }
        .preview-box {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 8px;
          margin-top: 10px;
          text-align: center;
        }
        .preview-code {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          font-family: monospace;
        }
      </style>
      
      <div class="config-container">
        <div class="input-group">
          <label>Prefijo completo:</label>
          <input 
            id="swal-prefijo" 
            class="swal2-input" 
            value="${prefijoPerforacion}" 
            placeholder="Ej: BH-MJ, BHSR"
            style="margin: 0;"
          >
        </div>
        
        <div class="input-group">
          <label>Año (2 dígitos):</label>
          <input 
            id="swal-año" 
            class="swal2-input" 
            value="${añoPerforacion}" 
            maxlength="2" 
            placeholder="25"
            style="margin: 0;"
          >
        </div>
        
        <div class="preview-box">
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Vista previa:</div>
          <div class="preview-code" id="preview-code">
            ${prefijoPerforacion}${añoPerforacion}-01
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Actualizar todos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4CAF50',
    didOpen: () => {
      const prefijoInput = document.getElementById('swal-prefijo');
      const añoInput = document.getElementById('swal-año');
      const preview = document.getElementById('preview-code');
      
      const updatePreview = () => {
        const prefijo = prefijoInput.value || '[PREFIJO]';
        const año = añoInput.value || 'XX';
        preview.textContent = `${prefijo}${año}-01`;
      };
      
      prefijoInput.addEventListener('input', updatePreview);
      añoInput.addEventListener('input', updatePreview);
    },
    preConfirm: () => {
      const prefijo = document.getElementById('swal-prefijo').value.trim();
      const año = document.getElementById('swal-año').value.trim();
      
      if (!prefijo || !año || año.length !== 2) {
        Swal.showValidationMessage('Completa todos los campos');
        return false;
      }
      
      return { prefijo: prefijo, año: año };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      setPrefijoPerforacion(result.value.prefijo);
      setAñoPerforacion(result.value.año);
      actualizarTodosLosCodigos(result.value.prefijo, result.value.año);
    }
  });
}}
  title="Configurar código base para todas las perforaciones"
>
  <i className='bx bx-cog'></i> Código Base
</button>
            
          

         
            
           
            
            <button 
              className="btn-cerrar"
              onClick={onClose}
            >
              <i className='bx bx-x'></i>
            </button>
          </div>
        </div>
        
        <div className="tabla-contenedor">
          <table className="tabla-perforaciones">
            <thead>
              <tr>
                <th>id</th>
                <th>Código de Perforación</th>
                <th>Ubicación</th>
                <th>Profundidad - suelo</th>
                <th>Profundidad Roca</th>
                <th>Profundidad - relleno</th>
                <th>Profundidad - relave </th>
         
{(() => {
  console.log("Renderizando encabezados, tipo sistema:", tipoSistemaReferencia);
  return tipoSistemaReferencia === 'geografico' ? (
    <>
      <th>Longitud</th>
      <th>Latitud</th>
    </>
  ) : tipoSistemaReferencia === 'proyectado' ? (
    <>
      <th>Este</th>
      <th>Norte</th>
    </>
  ) : (
  
    <>
      <th>{sistemaReferencia.includes('GLOBAL') ? 'Longitud' : 'Este'}</th>
      <th>{sistemaReferencia.includes('GLOBAL') ? 'Latitud' : 'Norte'}</th>
    </>
  );
})()}
                <th>Elevación</th>
                <th>Azimuth</th>
                <th>Inclinación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="mensaje-cargando">Cargando perforaciones...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="11" className="mensaje-error">{error}</td>
                </tr>
              ) : perforaciones.length === 0 && !nuevaPerforacion ? (
                <tr>
                  <td colSpan="11" className="mensaje-vacio">No hay perforaciones registradas</td>
                </tr>
              ) : (
                <>
                  {perforaciones.map(perf => (
                    <tr key={perf.id} className={perforacionEditando?.id === perf.id ? 'fila-editando' : ''}>
                      <td>{perf.id}</td>
                     <td>
  {perforacionEditando?.id === perf.id ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
    <input 
      type="text" 
      value={perforacionEditando.prefijo || prefijoPerforacion}
      onChange={(e) => {
        const valor = e.target.value; 
        setPerforacionEditando(prev => ({...prev, prefijo: valor}));
      }}
      style={{ width: '120px' }}
      placeholder="Prefijo"
    />
    <span>-</span>
    <input 
      type="text" 
      value={perforacionEditando.año || añoPerforacion}
      onChange={(e) => {
        const valor = e.target.value.replace(/\D/g, '').slice(0, 2);
        setPerforacionEditando(prev => ({...prev, año: valor}));
      }}
      style={{ width: '40px' }}
      maxLength="2"
      placeholder="Año"
    />
    <span>-</span>
    <span>{perf.codigo_perforacion.split('-').pop()}</span>
  </div>
) : (
  perf.codigo_perforacion
)}
</td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <select 
                            value={perforacionEditando.estructura_id}
                            onChange={(e) => handleEdicionChange('estructura_id', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {estructuras.map(est => (
                              <option key={est.id} value={est.id}>{est.descripcion}</option>
                            ))}
                          </select>
                        ) : (
                          getEstructuraNombre(perf.estructura_id)
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.1"
                            value={perforacionEditando.profundidad_suelo_metros}
                            onChange={(e) => handleEdicionChange('profundidad_suelo_metros', e.target.value)}
                          />
                        ) : (
                          perf.profundidad_suelo_metros
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.1"
                            value={perforacionEditando.profundidad_roca_metros}
                            onChange={(e) => handleEdicionChange('profundidad_roca_metros', e.target.value)}
                          />
                        ) : (
                          perf.profundidad_roca_metros
                        )}
                      </td>


                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number"
                            step="0.1"
                            value={perforacionEditando.profundidad_relleno_metros}
                            onChange={(e)=> handleEdicionChange('profundidad_relleno_metros', e.target.value)}
                            />
                        ) : (
                          perf.profundidad_relleno_metros
                        )}
                         
                      </td>


                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input
                           type="number"
                           step="0.1"
                           value={perforacionEditando.profundidad_relave_metros}
                           onChange={(e)=> handleEdicionChange('profundidad_relave_metros', e.target.value)}
                           />
                        ) :(
                          perf.profundidad_relave_metros
                         )}
                      </td>





                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.000001"
                            value={perforacionEditando.longitud}
                            onChange={(e) => handleEdicionChange('longitud', e.target.value)}
                            
                          />
                        ) : (
                          getCoordenadas(perf, 'longitud')
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.000001"
                            value={perforacionEditando.latitud}
                            onChange={(e) => handleEdicionChange('latitud', e.target.value)}
                            
                          />
                        ) : (
                          getCoordenadas(perf, 'latitud')
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.01"
                            value={perforacionEditando.elevacion}
                            onChange={(e) => handleEdicionChange('elevacion', e.target.value)}
                          />
                        ) : (
                          perf.elevacion
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.1"
                            value={perforacionEditando.azimuth}
                            onChange={(e) => handleEdicionChange('azimuth', e.target.value)}
                          />
                        ) : (
                          perf.azimuth
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <input 
                            type="number" 
                            step="0.1"
                            value={perforacionEditando.inclinacion}
                            onChange={(e) => handleEdicionChange('inclinacion', e.target.value)}
                          />
                        ) : (
                          perf.inclinacion
                        )}
                      </td>
                      <td>
                        {perforacionEditando?.id === perf.id ? (
                          <div className="acciones-botones">
                            <button 
                              className="btn-guardar"
                              onClick={guardarEdicion}
                              title="Guardar"
                            >
                              <i className='bx bx-check'></i>
                            </button>
                            <button 
                              className="btn-cancelar"
                              onClick={cancelarEdicion}
                              title="Cancelar"
                            >
                              <i className='bx bx-x'></i>
                            </button>
                          </div>
                        ) : (
                          <div className="acciones-botones">
                            <button 
                              className="btn-editar" 
                              onClick={() => iniciarEdicion(perf)}
                              title="Editar"
                            >
                              <i className='bx bx-pencil'></i>
                            </button>
                            <button 
                              className="btn-eliminar" 
                              onClick={() => handleEliminar(perf.id)}
                              title="Eliminar"
                            >
                              <i className='bx bx-trash'></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {nuevaPerforacion && (
                    <tr className="fila-nueva">
                      <td>Nuevo</td>
                      <td>
                        <input 
                          type="text" 
                          value={nuevaPerforacion.codigo_perforacion}
                          readOnly
                        />
                      </td>
                      <td>
                        <select 
                          value={nuevaPerforacion.estructura_id}
                          onChange={(e) => handleCampoChange('estructura_id', e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {estructuras.map(est => (
                            <option key={est.id} value={est.id}>{est.descripcion}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.1"
                          value={nuevaPerforacion.profundidad_suelo_metros}
                          onChange={(e) => handleCampoChange('profundidad_suelo_metros', e.target.value)}
                        />
                      </td> 
                      <td>
                        <input 
                          type="number"
                          step="0.1" 
                          value={nuevaPerforacion.profundidad_roca_metros}
                          onChange={(e) => handleCampoChange('profundidad_roca_metros', e.target.value)}
                        />
                      </td>

                     <td>
                      <input type="number"
                      step="0.1"
                      value={nuevaPerforacion.profundidad_relleno_metros}
                      onChange={(e)=> handleCampoChange('profundidad_relleno_metros', e.target.value)} 
                      />
                     </td>

                     <td>
                      <input type="number"
                      step="0.1"
                      value={nuevaPerforacion.profundidad_relave_metros}
                      onChange={(e)=> handleCampoChange('profundidad_relave_metros', e.target.value)}
                       />
                     </td>
 

                      <td>
                        <input 
                          type="number"
                          step="0.000001" 
                          value={getNuevaCoordenada('longitud')}
                          onChange={(e) => handleCampoChange('longitud', e.target.value)}
                          readOnly={sistemaReferencia === 'GLOBAL (WGS84)'}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="0.000001" 
                          value={getNuevaCoordenada('latitud')}
                          onChange={(e) => handleCampoChange('latitud', e.target.value)}
                          readOnly={sistemaReferencia === 'GLOBAL (WGS84)'}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="0.01" 
                          value={nuevaPerforacion.elevacion}
                          onChange={(e) => handleCampoChange('elevacion', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="0.1" 
                          value={nuevaPerforacion.azimuth}
                          onChange={(e) => handleCampoChange('azimuth', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="0.1" 
                          value={nuevaPerforacion.inclinacion}
                          onChange={(e) => handleCampoChange('inclinacion', e.target.value)}
                        />
                      </td>
                      <td>
                        <button 
                          className="btn-guardar"
                          onClick={handleGuardar}
                        >
                          Guardar
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  };
  
  TablaPerforaciones.propTypes = {
    proyectoId: PropTypes.number,
    codigoProyecto: PropTypes.string,
    map: PropTypes.object,
    onClose: PropTypes.func
  };
  
  export default TablaPerforaciones;