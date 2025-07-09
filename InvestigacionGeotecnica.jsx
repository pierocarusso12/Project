import { useState, useEffect, useRef, useCallback } from 'react';
import {useNavigate, useParams } from 'react-router-dom';
import './InvestigacionGeotecnica.css';
import Logo from '../../assets/images/logo.jpg';
import 'boxicons/css/boxicons.min.css';
import CrearCapaSimple from '../CapasModules/CrearCapaSimple';
import CrearTablaSimple from '../CapasModules/CrearTablaSimple';
import CrearLaboratorioKpSimple from '../CapasModules/CrearLaboratorioKpSimple';
import CrearLaboratorioExtranjeroSimple from '../CapasModules/LaboratorioExtranjero/CrearLaboratorioExtranjeroSimple';
import CrearRosterSimple from '../CapasModules/Roster/CrearRosterSimple';
import ModalEnsayoSpt from '../CapasModules/ModalEnsayoSpt';
import ModalLaboratorioKp from '../CapasModules/ModalLaboratorioKp';
import ModalLaboratorioExtranjero from '../CapasModules/LaboratorioExtranjero/ModalLaboratorioExtranjero';
import ModalRatePerforaciones from '../CapasModules/Roster/ModalRatePerforaciones';
import ModalRateOtrasCapas from '../CapasModules/Roster/ModalRateOtrasCapas';

import ModalHistorialConsolidados from '../CapasModules/ModalHistorialConsolidados';

import ModalMuestras from '../CapasModules/ModalMuestras';
import ModalMuestrasConsolidados from '../CapasModules/ModalMuestrasConsolidados';


import ModalLugeon from '../CapasModules/ModalLugeon';
import ModalLugeonConsolidados from '../CapasModules/ModalLugeonConsolidados';

import ModalLefranc from '../CapasModules/ModalLefranc';
import ModalLefrancConsolidados from '../CapasModules/ModalLefrancConsolidados'

import ModalCalculoPerforaciones from '../CapasModules/Roster/calculos/ModalCalculoPerforaciones';
import ModalCalculoCalicatas from '../CapasModules/Roster/calculos/ModalCalculoCalicatas';
import ModalCalculoDpl from '../CapasModules/Roster/calculos/ModalCalculoDpl';
import ModalCalculoCpt from '../CapasModules/Roster/calculos/ModalCalculoCpt';
import ModalCalculoPosteadoras from '../CapasModules/Roster/calculos/ModalCalculoPosteadoras';
import ModalCalculoTrincheras from '../CapasModules/Roster/calculos/ModalCalculoTrincheras';
import ModalAgruparSondajes from '../CapasModules/Roster/calculos/ModalAgruparSondajes';
import ModalCronograma from '../CapasModules/Roster/cronograma/ModalCronograma';


import VerCapas from '../CapasModules/VerCapas';
import VerTablas from '../CapasModules/VerTablas';
import VerLaboratorio from '../CapasModules/VerLaboratorioKp';
import VerLaboratorioExtranjero from '../CapasModules/LaboratorioExtranjero/VerLaboratorioExtranjero';
import VerRoster from '../CapasModules/Roster/VerRoster';

import TablaPerforaciones from '../CapasModules/TablaPerforaciones';
// Importaciones de OpenLayers para el mapa
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
/*import { set } from 'ol/transform';*/
/*import { use } from 'react';*/

const InvestigacionGeotecnica = () => {
  const navigate = useNavigate();
  const { proyectoId: urlProyectoId } = useParams();
  console.log("ID del proyecto desde URL:", urlProyectoId);
  const proyectoIdNumber = urlProyectoId ? parseInt(urlProyectoId, 10) : null;


  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modulosProyecto, setModulosProyecto] = useState([]);
  const [moduloActual] = useState('investigacion');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [isFavorite, setIsFavorite] = useState(false);
  const [unidadMineraCoords, setUnidadMineraCoords] = useState(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [isCapasSidebarOpen, setIsCapasSidebarOpen] = useState(false);
  const [isTablasSidebarOpen, setIsTablasSidebarOpen] = useState(false);
  const [isLaboratorioKpSidebarOpen, setIsLaboratorioKpSidebarOpen] = useState(false);
  const [isLaboratorioExtranjeroSidebarOpen, setIsLaboratorioExtranjeroSidebarOpen] = useState(false);
  const [isRosterSidebarOpen,setIsRosterSidebarOpen]=useState(false);

  
  const [isCrearCapaModalOpen, setIsCrearCapaModalOpen] = useState(false);
  const [isCrearTablaModalOpen, setIsCrearTablaModalOpen] = useState(false);
  const [isCrearLaboratorioKpModalOpen, setIsCrearLaboratorioKpModalOpen] = useState(false);
  const [isCrearLaboratorioExtranjeroModalOpen,setIsCrearLaboratorioExtranjeroModalOpen] = useState(false);
  const [isCrearRosterModalOpen,setIsCrearRosterModalOpen] = useState(false);
  const [mostrarPerforaciones, setMostrarPerforaciones] = useState(false);
  const [mostrarTablas, setMostrarTablas] = useState(false);
  const [mostrarLaboratorioKp, setMostrarLaboratorioKp] = useState(false);
  const [mostrarLaboratorioExtranjero, setMostrarLaboratorioExtranjero] = useState(false);
  const [mostrarRoster, setMostrarRoster] = useState(false);

  // Estados para modales SPT y Historial
  const [mostrarModalSpt, setMostrarModalSpt] = useState(false);

 
  const [mostrarModalHistorialConsolidados, setMostrarModalHistorialConsolidados] = useState(false);

const [mostrarModalLugeon, setMostrarModalLugeon] = useState(false);
const [mostrarModalLugeonConsolidados, setMostrarModalLugeonConsolidados] = useState(false);
const [datosModalLugeon, setDatosModalLugeon] = useState(null);
const [datosModalLugeonConsolidados, setDatosModalLugeonConsolidados] = useState(null);


const [mostrarModalLefranc, setMostrarModalLefranc] = useState(false);
const [mostrarModalLefrancConsolidados, setMostrarModalLefrancConsolidados] = useState(false);
const [datosModalLefranc, setDatosModalLefranc] = useState(null);
const [datosModalLaboratorioKp, setDatosModalLaboratorioKp] = useState(null);
const [datosModalLaboratorioExtranjero, setDatosModalLaboratorioExtranjero] = useState(null);
const [datosModalRatePerforaciones, setDatosModalRatePerforaciones]= useState(null);
const [datosModalRateOtrasCapas, setDatosModalRateOtrasCapas]= useState(null);
const [datosModalCalculoPerforaciones, setDatosModalCalculoPerforaciones] = useState(null);
const [datosModalCalculoCalicatas, setDatosModalCalculoCalicatas] = useState(null);
const [datosModalCalculoDpl, setDatosModalCalculoDpl] = useState(null);
const [datosModalCalculoCpt, setDatosModalCalculoCpt] = useState(null);
const [datosModalCalculoPosteadoras, setDatosModalCalculoPosteadoras] = useState(null);
const [datosModalCalculoTrincheras, setDatosModalCalculoTrincheras] = useState(null);
const [datosModalLefrancConsolidados, setDatosModalLefrancConsolidados] = useState(null);
const [datosModalAgruparSondajes, setDatosModalAgruparSondajes] = useState(null);
const [datosModalCronograma, setDatosModalCronograma] = useState(null);

 const [mostrarModalLaboratorioKp, setMostrarModalLaboratorioKp] = useState(false);
 const [mostrarModalLaboratorioExtranjero, setMostrarModalLaboratorioExtranjero] = useState(false);
 const [mostrarModalRatePerforaciones, setMostrarModalRatePerforaciones] = useState(false);
 const [mostrarModalRateOtrasCapas, setMostrarModalRateOtrasCapas]=useState(false);

 const [mostrarModalCalculoPerforaciones, setMostrarModalCalculoPerforaciones] = useState(false);
 const [mostrarModalCalculoCalicatas, setMostrarModalCalculoCalicatas] = useState(false);
 const [mostrarModalCalculoDpl, setMostrarModalCalculoDpl] = useState(false);
 const [mostrarModalCalculoCpt, setMostrarModalCalculoCpt] = useState(false);
 const [mostrarModalCalculoPosteadoras, setMostrarModalCalculoPosteadoras] = useState(false);
 const [mostrarModalCalculoTrincheras, setMostrarModalCalculoTrincheras] = useState(false);

const [mostrarModalAgruparSondajes, setMostrarModalAgruparSondajes] = useState(false);
const [mostrarModalCronograma, setMostrarModalCronograma] = useState(false);


  const [modalHistorialSptConfig, setModalHistorialSptConfig] = useState({
    proyectoId: null
  });

  const [modalSptConfig, setModalSptConfig] = useState({
    proyectoId: null,
    onEnsayoAgregado: null
  });




  const[mostrarModalMuestras, setMostrarModalMuestras] = useState(false);
  const[mostrarModalMuestrasConsolidados,setMostrarModalMuestrasConsolidados]= useState(false);

const [modalMuestrasConfig, setModalMuestrasConfig] = useState({
  proyectoId: null,
  onMuestraAgregado: null // Cambiar de onMuestraAgreado a onMuestraAgregado
});

  const [validarCapaDuplicadaFn, setValidarCapaDuplicadaFn] = useState(null);
  const [validarTablaDuplicadaFn, setValidarTablaDuplicadaFn] = useState(null);
  const [validarRosterDuplicadaFn, setValidarRosterDuplicadaFn]=useState(null);
  
  // Estado para información adicional
  const [ubicacion, setUbicacion] = useState('');
  const [gerenteNombre, setGerenteNombre] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  
  // Estado para el mapa
  const [activeLayerType, setActiveLayerType] = useState('satellite');
  
  // Referencias para el mapa
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const mapLayersRef = useRef({
    osm: null,
    satellite: null,
    relief: null
  });
  
  // Estado para proyectos favoritos agrupados
  const [proyectosPorOficina, setProyectosPorOficina] = useState({});
  const [proyectosPorUnidadMinera, setProyectosPorUnidadMinera] = useState({});
  
  // Estados para mostrar/ocultar las listas
  const [oficinaExpandida, setOficinaExpandida] = useState({});
  const [unidadMineraExpandida, setUnidadMineraExpandida] = useState({});

  

  // Funciones para manejar los modales SPT
  const abrirModalSpt = useCallback((config) => {
    console.log("Abriendo modal SPT con configuración:", config);
    setModalSptConfig({
      proyectoId: config.proyectoId || proyecto?.id,
      onEnsayoAgregado: config.onEnsayoAgregado
    });
    setMostrarModalSpt(true);
  }, [proyecto]);

  const cerrarModalSpt = useCallback(() => {
    console.log("Cerrando modal SPT");
    setMostrarModalSpt(false);
    setModalSptConfig({
      proyectoId: null,
      onEnsayoAgregado: null
    });
  }, []);


  // Funciones para manejar el modal de Historial
  const abrirModalHistorialSpt = useCallback((config) => {
    console.log("Abriendo modal Historial SPT con configuración:", config);
    setModalHistorialSptConfig({
      proyectoId: config.proyectoId || proyecto?.id
    });
    setMostrarModalHistorialConsolidados(true);
  }, [proyecto]);

  const cerrarModalHistorialSpt = useCallback(() => {
    console.log("Cerrando modal Historial SPT");
    setMostrarModalHistorialConsolidados(false);
    setModalHistorialSptConfig({ proyectoId: null });
  }, []);

  const abrirModalMuestras = useCallback((config) => {
  console.log("Abriendo modal Muestras con configuración:", config);
  setModalMuestrasConfig({
    proyectoId: config.proyectoId || proyecto?.id,
    onMuestraAgregado: config.onMuestraAgregado 
  });
  setMostrarModalMuestras(true);
}, [proyecto]);


const cerrarModalMuestras = useCallback(() => {
  console.log("Cerrando modal muestras");
  setMostrarModalMuestras(false);
  setModalMuestrasConfig({
    proyectoId: null,
    onMuestraAgregado: null 
  });
}, []);


const abrirModalMuestrasConsolidados = useCallback((config) => {
  console.log("Abriendo Consolidado de muestras con configuración:", config);
  setModalMuestrasConfig({
    proyectoId: config.proyectoId || proyecto?.id
  });
  setMostrarModalMuestrasConsolidados(true);
}, [proyecto]);

const cerrarModalMuestrasConsolidados = useCallback(() => {
    console.log("Cerrando modal Historial SPT");
    setMostrarModalMuestrasConsolidados(false);
    setModalHistorialSptConfig({ proyectoId: null });
  }, []);


// Función para abrir modal agregar Lugeon
const abrirModalLugeon = (datos) => {
  console.log("Abriendo modal Lugeon con datos:", datos);
  setDatosModalLugeon(datos);
  setMostrarModalLugeon(true);
};

// Función para cerrar modal agregar Lugeon
const cerrarModalLugeon = () => {
  setMostrarModalLugeon(false);
  setDatosModalLugeon(null);
};

// Función para abrir modal consolidados Lugeon
const abrirModalLugeonConsolidados = (datos) => {
  console.log("Abriendo modal consolidados Lugeon con datos:", datos);
  setDatosModalLugeonConsolidados(datos);
  setMostrarModalLugeonConsolidados(true);
};

// Función para cerrar modal consolidados Lugeon
const cerrarModalLugeonConsolidados = () => {
  setMostrarModalLugeonConsolidados(false);
  setDatosModalLugeonConsolidados(null);
};

const abrirModalLefranc = (datos) =>{
  console.log("Abriendo modal Lefranc con datos:", datos);
  setDatosModalLefranc(datos);
  setMostrarModalLefranc(true);
}

const cerrarModalLefranc=() =>{
  setMostrarModalLefranc(false);
  setDatosModalLefranc(null);
}


const abrirModalLaboratorioKp = (datos) => {
    console.log("Abriendo modal para laboratorio kp:", datos);
    if (!datos.tipoLaboratorioKpId) {
      console.error("tipoLaboratorioKpId es requerido pero no fue proporcionado");
    }
    setDatosModalLaboratorioKp(datos);
    setMostrarModalLaboratorioKp(true);
  }

 const cerrarModalLaboratorioKp = () => {
  setMostrarModalLaboratorioKp(false); 
  setDatosModalLaboratorioKp(null);
}


const abrirModalRatePerforaciones = (datos) => {
  console.log("Abriendo el modal de rate para perforaciones:", datos);
  setDatosModalRatePerforaciones(datos);
  setMostrarModalRatePerforaciones(true);
}

const cerrarModalRatePerforaciones = () => {
  setMostrarModalRatePerforaciones(false);
  setDatosModalRatePerforaciones(null);
}

const abrirModalRateOtrasCapas = (datos) => {
  console.log("Abriendo el modal de rate para otras capas:", datos);
  setDatosModalRateOtrasCapas(datos);
  setMostrarModalRateOtrasCapas(true);
}

const cerrarModalRateOtrasCapas = () => {
  setMostrarModalRateOtrasCapas(false);
  setDatosModalRateOtrasCapas(null);
}


const abrirModalLaboratorioExtranjero = (datos)=>{
  console.log("Abriendo el modal para laboratorio extranjero", datos);
  if(!datos.tipoLaboratorioExtranjeroId){
    console.error("tipoLaboratorioExtranjeroId es requerido pero no fue proporcionado");
  }
  setDatosModalLaboratorioExtranjero(datos);
  setMostrarModalLaboratorioExtranjero(true);
}




const cerrarModalLaboratorioExtranjero =()=>{
    setMostrarLaboratorioExtranjero(false);
    setDatosModalLaboratorioExtranjero(null);
  }


const abrirModalLefrancConsolidados = (datos) => {
  console.log("Abriendo modal consolidados Lefranc con datos", datos);
  setDatosModalLefrancConsolidados(datos);
  setMostrarModalLefrancConsolidados(true);
}

const cerrarModalLefrancConsolidados= () => {
  setMostrarModalLefrancConsolidados(false);
  setDatosModalLefrancConsolidados(null);
}

const abrirModalAgruparSondajes = (datos) => {
  console.log("Abriendo modal de agrupar sondajes con datos:", datos);
  setDatosModalAgruparSondajes(datos);
  setMostrarModalAgruparSondajes(true);
}

const cerrarModalAgruparSondajes = () => {
  setMostrarModalAgruparSondajes(false);
  setDatosModalAgruparSondajes(null);
}

const abrirModalCronograma = (datos) => {
  console.log("Abriendo modal de cronograma con datos:", datos);
  setDatosModalCronograma(datos);
  setMostrarModalCronograma(true);
}
const cerrarModalCronograma = () => {
  setMostrarModalCronograma(false);
  setDatosModalCronograma(null);
}

const abrirModalCalculoPerforaciones = (datos) => {
  console.log("Abriendo modal de cálculo de perforaciones con datos:", datos);
  setDatosModalCalculoPerforaciones(datos);
  setMostrarModalCalculoPerforaciones(true);
}

const cerrarModalCalculoPerforaciones = () => {
  setMostrarModalCalculoPerforaciones(false);
  setDatosModalCalculoPerforaciones(null);
}

const abrirModalCalculoCalicatas = (datos) => {
  console.log("Abriendo modal de cálculo de calicatas con datos:", datos);
  setDatosModalCalculoCalicatas(datos);
  setMostrarModalCalculoCalicatas(true);
}

const cerrarModalCalculoCalicatas = () => {
  setMostrarModalCalculoCalicatas(false);
  setDatosModalCalculoCalicatas(null);
}

const abrirModalCalculoDpl = (datos) => {
  console.log("Abriendo modal de cálculo de DPL con datos:", datos);
  setDatosModalCalculoDpl(datos);
  setMostrarModalCalculoDpl(true);
}

const cerrarModalCalculoDpl = () => {
  setMostrarModalCalculoDpl(false);
  setDatosModalCalculoDpl(null);
}

const abrirModalCalculoCpt = (datos) => {
  console.log("Abriendo modal de cálculo de CPT con datos:", datos);
  setDatosModalCalculoCpt(datos);
  setMostrarModalCalculoCpt(true);
}
const cerrarModalCalculoCpt = () => {
  setMostrarModalCalculoCpt(false);
  setDatosModalCalculoCpt(null);
}

const abrirModalCalculoPosteadoras = (datos) => {
  console.log("Abriendo modal de cálculo de posteadoras con datos:", datos);
  setDatosModalCalculoPosteadoras(datos);
  setMostrarModalCalculoPosteadoras(true);
}

const cerrarModalCalculoPosteadoras = () => {
  setMostrarModalCalculoPosteadoras(false);
  setDatosModalCalculoPosteadoras(null);
}

const abrirModalCalculoTrincheras = (datos) => {
  console.log("Abriendo modal de cálculo de trincheras con datos:", datos);
  setDatosModalCalculoTrincheras(datos);
  setMostrarModalCalculoTrincheras(true);
}

const cerrarModalCalculoTrincheras = () => {
  setMostrarModalCalculoTrincheras(false);
  setDatosModalCalculoTrincheras(null);
}



  // Función para añadir un marcador al mapa
  const addMarkerToMap = useCallback((coordinates) => {
    if (!vectorSourceRef.current) return;
    
    // Limpiar marcadores anteriores
    vectorSourceRef.current.clear();
    
    // Crear nuevo marcador
    const marker = new Feature({
      geometry: new Point(fromLonLat(coordinates))
    });
    
    // Estilo del marcador (un pin rojo)
    marker.setStyle(new Style({
      image: new Icon({
        src: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        scale: 0.07,
        anchor: [0.5, 1]
      })
    }));
    
  
    vectorSourceRef.current.addFeature(marker);
  }, []);

  const manejarCrearCapa = (proyectoId, validarDuplicada) => {
    console.log("Manejando creación de capa para proyecto:", proyectoId);
    // Guardar la función de validación
    setValidarCapaDuplicadaFn(() => validarDuplicada);
    // Abrir el modal
    setIsCrearCapaModalOpen(true);
  };

  const manejarCrearTabla = (proyectoId, validarDuplicada) => {
    console.log("Manejando creación de tabla para proyecto:", proyectoId);
    setValidarTablaDuplicadaFn(() => validarDuplicada);
    setIsCrearTablaModalOpen(true);
  };

  const manejarCrearLaboratorioKp = (proyectoId)=>{
    console.log("Manejando la creacion de laboratorio kp para proyecto:", proyectoId);
    setIsCrearLaboratorioKpModalOpen(true);
  }

  const manejarCrearLaboratorioExtranjero = (proyectoId)=>{
    console.log("Manejando la creacion del laboratorio extranjero para proyecto:",proyectoId);
    setIsCrearLaboratorioExtranjeroModalOpen(true);
  }

  const manejarCrearRoster=(proyectoId, validarDuplicada)=>{
    console.log("Manejando la creacion de roster para proyecto", proyectoId);
    setValidarRosterDuplicadaFn(()=> validarDuplicada);
    setIsCrearRosterModalOpen(true);
  }

  // Función para inicializar el mapa
  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    
    // Capa OSM (OpenStreetMap)
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: activeLayerType === 'map',
      title: 'OSM'
    });
    mapLayersRef.current.osm = osmLayer;

    // Capa de satélite (Google Satellite)
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        crossOrigin: 'anonymous'
      }),
      visible: activeLayerType === 'satellite',
      title: 'Satellite'
    });
    mapLayersRef.current.satellite = satelliteLayer;

    // Capa de relieve
    const reliefLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Esri, USGS, NOAA',
        crossOrigin: 'anonymous'
      }),
      visible: activeLayerType === 'relief',
      title: 'Relief'
    });
    mapLayersRef.current.relief = reliefLayer;

    // Capa que muestra las divisiones administrativas
    const boundariesLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Esri, DigitalGlobe, GeoEye',
        crossOrigin: 'anonymous'
      }),
      visible: true,
      title: 'Boundaries'
    });

    // Capa para marcadores
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      title: 'Markers'
    });

    // Centro del mapa - por defecto Perú
    let centerCoords = [-75.015152, -9.189967];
    let zoomLevel = 5;

    // Si tenemos coordenadas de la unidad minera, usarlas
    if (unidadMineraCoords) {
      centerCoords = unidadMineraCoords;
      zoomLevel = 13; 
    }

    // Crear la instancia del mapa
    mapInstanceRef.current = new Map({
      target: mapContainerRef.current,
      layers: [osmLayer, satelliteLayer, reliefLayer, boundariesLayer, vectorLayer],
      view: new View({
        center: fromLonLat(centerCoords),
        zoom: zoomLevel,
        minZoom: 4,
        maxZoom: 19
      }),
      controls: defaultControls({
        attributionOptions: {
          collapsible: true
        }
      })
    });

    // Si tenemos coordenadas de la unidad minera, agregar un marcador
    if (unidadMineraCoords) {
      addMarkerToMap(unidadMineraCoords);
    }

    // Evento de clic en el mapa
    mapInstanceRef.current.on('click', function(evt) {
      const coordinate = evt.coordinate;
      const lonLat = toLonLat(coordinate);
      console.log(`Coordenadas seleccionadas: ${lonLat[0]}, ${lonLat[1]}`);
      
      // Añadir marcador en el punto seleccionado
      addMarkerToMap(lonLat);
    });
    
    console.log("Mapa inicializado correctamente.");
  }, [activeLayerType, unidadMineraCoords, addMarkerToMap]);

  // Verificar si el proyecto es favorito
  const checkIsFavorite = async (proyectoId) => {
    try {
      console.log("Verificando si el proyecto es favorito, ID:", proyectoId);
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) {
        console.log("No hay usuario en localStorage");
        setIsFavorite(false);
        return false;
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData.id;
      
      if (!userId || !proyectoId) {
        console.log("Faltan datos de usuario o proyecto", {userId, proyectoId});
        setIsFavorite(false);
        return false;
      }

      console.log(`Consultando API: /api/usuarios/${userId}/favoritos?proyecto_id=${proyectoId}`);
      const response = await fetch(`http://10.161.1.76:8000/api/usuarios/${userId}/favoritos?proyecto_id=${proyectoId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta de favoritos:", data);
        const esFavorito = data.length > 0;
        console.log("Es favorito:", esFavorito);
        setIsFavorite(esFavorito);
        return esFavorito;
      } else {
        console.error("Error en la respuesta:", response.status);
        setIsFavorite(false);
        return false;
      }
    } catch (error) {
      console.error('Error al verificar favorito:', error);
      setIsFavorite(false);
      return false;
    }
  };

  // Funciones de navegación y utilidades
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const toggleOficina = (oficina) => {
    setOficinaExpandida(prev => ({
      ...prev,
      [oficina]: !prev[oficina]
    }));
  };
  
  const toggleUnidadMinera = (unidad) => {
    setUnidadMineraExpandida(prev => ({
      ...prev,
      [unidad]: !prev[unidad]
    }));
  };
  
  const navigateToProyecto = (id) => {
    localStorage.setItem('proyectoActualId', id);
    navigate(`/modulos/investigacion-geotecnica/${id}`);
  };
  
  const handleRegresar = () => {
    if (proyecto?.id) {
      navigate(`/dashboard?section=ver-proyecto&id=${proyecto.id}`);
    } else {
      navigate('/dashboard?section=proyectos');
    }
  };
  
  const getNavegacionModulos = () => {
    if (!modulosProyecto || modulosProyecto.length === 0) return { anterior: null, siguiente: null };
    
    const indiceActual = modulosProyecto.findIndex(m => m.codigo === moduloActual);
    if (indiceActual === -1) return { anterior: null, siguiente: null };
    
    const anterior = indiceActual > 0 ? modulosProyecto[indiceActual - 1] : null;
    const siguiente = indiceActual < modulosProyecto.length - 1 ? modulosProyecto[indiceActual + 1] : null;
    
    return { anterior, siguiente };
  };
  
  const { anterior, siguiente } = getNavegacionModulos();
  
  const navegarAlModulo = (ruta, id) => {
    if (!id && proyecto) {
      id = proyecto.id;
    }
    navigate(`/modulos/${ruta}/${id}`);
  };
  
  const handleMapTypeChange = (type) => {
    setActiveLayerType(type);
  };

 const handleCloseCapas = useCallback(() => {
  setIsCapasSidebarOpen(false);
  if (mostrarPerforaciones) {
    setMostrarPerforaciones(false);
  }
}, [mostrarPerforaciones]);

 const handleCloseTablas = useCallback(() => {
  setIsTablasSidebarOpen(false);
  setMostrarTablas(false);
}, []);

  
 const handleCloseLaboratorioKp = useCallback(() => {
  setIsLaboratorioKpSidebarOpen(false);
  setMostrarLaboratorioKp(false);
}, []);


const handleCloseLaboratorioExtranjero = useCallback(()=>{
  setIsLaboratorioExtranjeroSidebarOpen(false);
  setMostrarLaboratorioExtranjero(false);
}, []);


const handleCloseRoster = useCallback(()=>{
  setIsRosterSidebarOpen(false);
  setMostrarRoster(false);
}, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'planificacion') {
      if (mapInstanceRef.current) {
        console.log("Limpiando instancia de mapa anterior...");
        mapInstanceRef.current.setTarget(null);
        mapInstanceRef.current = null;
      }
    }
  };

  // Agregar o quitar de favoritos
  const toggleFavorite = async () => {
    if (!proyecto?.id) return;
    
    try {
      setSavingFavorite(true);
      setFavoriteError(null);
      
      const userDataStr = localStorage.getItem('user');
      
      if (!userDataStr) {
        setFavoriteError('Debe iniciar sesión para guardar favoritos');
        setSavingFavorite(false);
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      const userId = userData.id;
      
      if (!userId) {
        setFavoriteError('Usuario no válido');
        setSavingFavorite(false);
        return;
      }
      
      console.log("Estado actual de favorito:", isFavorite);
      
      if (isFavorite) {
        // Eliminar de favoritos
        console.log("Eliminando de favoritos...");
        const response = await fetch(`http://10.161.1.76:8000/api/usuarios/${userId}/favoritos`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proyecto_id: proyecto.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensaje || 'Error al eliminar de favoritos');
        }
        
        console.log("Eliminado de favoritos exitosamente");
        setIsFavorite(false);
        await loadFavorites(userId);
        
      } else {
        // Agregar a favoritos
        console.log("Agregando a favoritos...");
        const response = await fetch(`http://10.161.1.76:8000/api/usuarios/${userId}/favoritos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proyecto_id: proyecto.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensaje || 'Error al agregar a favoritos');
        }
        
        console.log("Agregado a favoritos exitosamente");
        setIsFavorite(true);
        await loadFavorites(userId);
      }
      
      await checkIsFavorite(proyecto.id);
      
    } catch (error) {
      console.error('Error al manejar favorito:', error);
      setFavoriteError(error.message || 'Error al procesar favorito');
    } finally {
      setSavingFavorite(false);
    }
  };

  // Función para cargar la lista de favoritos
  const loadFavorites = async (userId) => {
    try {
      const favoritosResponse = await fetch(`http://10.161.1.76:8000/api/usuarios/${userId}/favoritos`);
    
      if (favoritosResponse.ok) {
        const favoritosData = await favoritosResponse.json();
        
        const proyectosFavoritos = await Promise.all(
          favoritosData.map(async (fav) => {
            try {
              const proyResponse = await fetch(`http://10.161.1.76:8000/api/proyectos/${fav.proyecto_id}`);
              if (proyResponse.ok) {
                return await proyResponse.json();
              }
              return null;
            } catch (e) {
              console.error('Error al cargar proyecto favorito:', e);
              return null;
            }
          })
        );
        
        const proyectosValidos = proyectosFavoritos.filter(p => p !== null);
        
        // Agrupar por oficina
        const porOficina = {};
        proyectosValidos.forEach(proy => {
          const oficina = proy.oficina_nombre || 'Lima';
          if (!porOficina[oficina]) {
            porOficina[oficina] = [];
          }
          porOficina[oficina].push(proy);
        });
        
        // Agrupar por unidad minera
        const porUnidadMinera = {};
        proyectosValidos.forEach(proy => {
          const unidadMinera = proy.unidad_minera || 'Otra';
          if (!porUnidadMinera[unidadMinera]) {
            porUnidadMinera[unidadMinera] = [];
          }
          porUnidadMinera[unidadMinera].push(proy);
        });
        
        setProyectosPorOficina(porOficina);
        setProyectosPorUnidadMinera(porUnidadMinera);
        
        if (Object.keys(porOficina).length > 0) {
          setOficinaExpandida({ [Object.keys(porOficina)[0]]: true });
        }
        
        if (Object.keys(porUnidadMinera).length > 0) {
          setUnidadMineraExpandida({ [Object.keys(porUnidadMinera)[0]]: true });
        }
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      
      const proyectosFavoritosSimulados = [
        { 
          id: 1, 
          nombre_proyecto: 'Proyecto 1', 
          codigo_proyecto: '209/95',
          unidad_minera: 'MINA JUSTA'
        },
        { 
          id: 2, 
          nombre_proyecto: 'Proyecto 2', 
          codigo_proyecto: '210/96',
          unidad_minera: 'MINA JUSTA'
        }
      ];
      
      const porOficina = { 'Lima': proyectosFavoritosSimulados };
      const porUnidadMinera = { 'Mina Justa': proyectosFavoritosSimulados };
      
      setProyectosPorOficina(porOficina);
      setProyectosPorUnidadMinera(porUnidadMinera);
      setOficinaExpandida({ 'Lima': true });
      setUnidadMineraExpandida({ 'Mina Justa': true });
    }
  };

  // Funciones para manejar las acciones de los submenús
  const handleMenuAction = (category, action) => {
    console.log(`Acción seleccionada: ${category} - ${action}`);
    
    switch (category) {
      case 'importar':
        handleImportAction(action);
        break;
      case 'capas':
        handleLayerAction(action);
        break;
      case 'tablas':
        handleTableAction(action);
        break;
      case 'mapa':
        handleMapAction(action);
        break;
      case 'leyenda':
        handleLegendAction(action);
        break;
      case 'laboratorio-kp':
        handleLaboratorioKpAction(action);
        break;

       case 'roster':
        handleRosterAction(action);
        break;

      case 'exportar':
        handleExportAction(action);
        break;
      case 'revisar':
        handleReviewAction(action);
        break;
      default:
        break;
    }
  };

  const handleImportAction = (action) => {
    switch (action) {
      case 'proyectos':
        alert('Importar proyectos');
        break;
      case 'kmz':
        alert('Importar KMZ');
        break;
      case 'shp':
        alert('Importar SHP');
        break;
      case 'geojson':
        alert('Importar GeoJSON');
        break;
      default:
        break;
    }
  };

  const handleLayerAction = (action) => {
    switch (action) {
      case 'crear':
        setIsCrearCapaModalOpen(true);
        break;
      case 'visibilidad':
        if (isCapasSidebarOpen && mostrarPerforaciones) {
          setMostrarPerforaciones(false);
        }
        setIsCapasSidebarOpen(!isCapasSidebarOpen);
        break;
      case 'perforaciones':
        setMostrarPerforaciones(!mostrarPerforaciones);
        break;
      default:
        break;
    }
  };

  const handleTableAction = (action) => {
    switch (action) {
      case 'ver':
        alert('Ver tabla de atributos');
        break;
      case 'exportar':
        alert('Exportar datos');
        break;
      case 'filtrar':
        alert('Filtrar datos');
        break;
      default:
        break;
    }
  };

  const handleMapAction = (action) => {
    switch (action) {
      case 'base':
        handleMapTypeChange('map');
        break;
      case 'satelite':
        handleMapTypeChange('satellite');
        break;
      case 'relieve':
        handleMapTypeChange('relief');
        break;
      case 'hibrido':
        alert('Mapa híbrido no implementado aún');
        break;
      default:
        break;
    }
  };

  const handleLegendAction = (action) => {
    switch (action) {
      case 'mostrar':
        alert('Mostrar leyenda');
        break;
      case 'personalizar':
        alert('Personalizar estilos');
        break;
      default:
        break;
    }
  };


  const handleLaboratorioKpAction =(action) =>{
     switch (action) {
      case 'cosa1':
        alert('Ver tabla de atributos');
        break;
      case 'cosa2':
        alert('Exportar datos');
        break;
      case 'cosa3':
        alert('Filtrar datos');
        break;
      default:
        break;
    }
  };


  const handleRosterAction = (action) =>{
     switch (action) {
      case 'cosa4':
        alert('Ver tabla de atributos');
        break;
      case 'cosa5':
        alert('Exportar datos');
        break;
      case 'cosa6':
        alert('Filtrar datos');
        break;
      default:
        break;
    }
  }

  const handleExportAction = (action) => {
    switch (action) {
      case 'guardar':
        alert('Guardar proyecto');
        break;
      case 'pdf':
        alert('Exportar a PDF');
        break;
      case 'imagen':
        alert('Exportar a imagen');
        break;
      case 'geojson':
        alert('Exportar a GeoJSON');
        break;

        default:
        break;
    }
  };

  const handleReviewAction = (action) => {
    switch (action) {
      case 'validar':
        alert('Validar datos');
        break;
      case 'errores':
        alert('Informe de errores');
        break;
      case 'historial':
        alert('Historial de cambios');
        break;
      default:
        break;
    }
  };

  // UseEffect para manejar ESC
useEffect(() => {
  const handleEsc = (event) => {
    if (event.keyCode === 27) {
      // Cerrar modales en orden de prioridad (de más específico a más general)
      if (mostrarModalMuestrasConsolidados) {
        setMostrarModalMuestrasConsolidados(false);
      } else if (mostrarModalMuestras) {
        setMostrarModalMuestras(false);
      } else if (mostrarModalHistorialConsolidados) {
        setMostrarModalHistorialConsolidados(false);
      } else if (mostrarModalSpt) {
        setMostrarModalSpt(false);
      } else if(mostrarModalLugeon){
        setMostrarModalLugeon(false);
      } else if(mostrarModalLugeonConsolidados){
        setMostrarModalLugeonConsolidados(false);
      } else if(mostrarModalLefranc){
        setMostrarModalLefranc(false);
      } else if(mostrarModalLefrancConsolidados){
        setMostrarModalLefrancConsolidados(false);
      } else if(mostrarModalLaboratorioKp){
        setMostrarModalLaboratorioKp(false);
      } else if(isLaboratorioKpSidebarOpen){
        handleCloseLaboratorioKp(false);
      } else if(mostrarModalLaboratorioExtranjero){
        setMostrarModalLaboratorioExtranjero(false);
      } else if(isLaboratorioExtranjeroSidebarOpen){
        handleCloseLaboratorioExtranjero(false);
      } else if (isTablasSidebarOpen) {
        handleCloseTablas();
      } else if (isCapasSidebarOpen) {
        handleCloseCapas();
      } else if (isRosterSidebarOpen){
        handleCloseRoster();
      } else if (mostrarModalRatePerforaciones){
        setMostrarModalRatePerforaciones(false);
      } else if (mostrarModalRateOtrasCapas){
        setMostrarModalRateOtrasCapas(false);
      } else if (mostrarModalCalculoPerforaciones) {
        setMostrarModalCalculoPerforaciones(false);
      } else if (mostrarModalCalculoCalicatas) {
        setMostrarModalCalculoCalicatas(false);
      } else if (mostrarModalCalculoDpl) {
        setMostrarModalCalculoDpl(false);
      }
    }
  };
  
  window.addEventListener('keydown', handleEsc);
  return () => {
    window.removeEventListener('keydown', handleEsc);
  };
}, [mostrarModalLefranc, mostrarModalLefrancConsolidados, mostrarModalLugeon, mostrarModalLugeonConsolidados, mostrarModalMuestrasConsolidados, mostrarModalMuestras, mostrarModalHistorialConsolidados, mostrarModalSpt, mostrarModalLaboratorioKp, mostrarModalLaboratorioExtranjero, mostrarModalCalculoPerforaciones, mostrarModalCalculoCalicatas, mostrarModalCalculoDpl ,mostrarModalRatePerforaciones, mostrarModalRateOtrasCapas, isRosterSidebarOpen ,isLaboratorioKpSidebarOpen , isLaboratorioExtranjeroSidebarOpen, isTablasSidebarOpen, isCapasSidebarOpen, handleCloseRoster, handleCloseLaboratorioExtranjero, handleCloseLaboratorioKp, handleCloseTablas, handleCloseCapas]);

  // Cargar datos del proyecto y sus relaciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let proyectoIdToUse = urlProyectoId;
        if (!proyectoIdToUse) {
          proyectoIdToUse = localStorage.getItem('proyectoActualId');
          if (!proyectoIdToUse) {
            navigate('/dashboard');
            return;
          }
        }
        
        await checkIsFavorite(proyectoIdToUse);
        
        try {
          const proyectoResponse = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoIdToUse}`);
          if (!proyectoResponse.ok) {
            throw new Error('No se pudo cargar la información del proyecto');
          }
          
          const proyectoData = await proyectoResponse.json();
          setProyecto(proyectoData);
          
          // Obtener nombres de responsables
          if (proyectoData.gerente) {
            try {
              const gerenteResponse = await fetch(`http://10.161.1.76:8000/api/usuarios/${proyectoData.gerente}`);
              if (gerenteResponse.ok) {
                const gerenteData = await gerenteResponse.json();
                setGerenteNombre(`${gerenteData.nombres} ${gerenteData.apellidos}`);
              } else {
                setGerenteNombre('SOL PAIHUA');
              }
            } catch (error) {
              console.error('Error al cargar gerente:', error);
              setGerenteNombre('SOL PAIHUA');
            }
          } else {
            setGerenteNombre('SOL PAIHUA');
          }
          
          if (proyectoData.responsable) {
            try {
              const responsableResponse = await fetch(`http://10.161.1.76:8000/api/usuarios/${proyectoData.responsable}`);
              if (responsableResponse.ok) {
                const responsableData = await responsableResponse.json();
                setResponsableNombre(`${responsableData.nombres} ${responsableData.apellidos}`);
              } else {
                setResponsableNombre('MATHEWS INFANTES');
              }
            } catch (error) {
              console.error('Error al cargar responsable:', error);
              setResponsableNombre('MATHEWS INFANTES');
            }
          } else {
            setResponsableNombre('MATHEWS INFANTES');
          }
          
          // Obtener ubicación
          if (proyectoData.departamento_id) {
            try {
              const deptoResponse = await fetch(`http://10.161.1.76:8000/api/departamentos/${proyectoData.departamento_id}`);
              if (deptoResponse.ok) {
                const deptoData = await deptoResponse.json();
                setUbicacion(deptoData.nombre || 'ICA');
              } else {
                setUbicacion('ICA');
              }
            } catch (error) {
              console.error('Error al cargar ubicación:', error);
              setUbicacion('ICA');
            }
          } else {
            setUbicacion('ICA');
          }

          // Obtener coordenadas de la unidad minera si existe
          if (proyectoData.unidad_minera_id) {
            try {
              const umResponse = await fetch(`http://10.161.1.76:8000/api/unidades_mineras/${proyectoData.unidad_minera_id}`);
              if (umResponse.ok) {
                const umData = await umResponse.json();
                if (umData.latitud && umData.longitud) {
                  setUnidadMineraCoords([umData.longitud, umData.latitud]);
                  console.log(`Coordenadas de unidad minera: ${umData.longitud}, ${umData.latitud}`);
                }
              }
            } catch (error) {
              console.error('Error al cargar coordenadas de unidad minera:', error);
            }
          }
        } catch (error) {
          console.error('Error al cargar proyecto:', error);
          setError('Proyecto no encontrado');
          setLoading(false);
          return;
        }
        
        // Obtener módulos del proyecto
        try {
          const modulosResponse = await fetch(`http://10.161.1.76:8000/api/proyectos/${proyectoIdToUse}/modulos`);
          if (modulosResponse.ok) {
            const modulosData = await modulosResponse.json();
            setModulosProyecto(modulosData);
          }
        } catch (error) {
          console.error('Error al cargar módulos:', error);
        }
        
        // Cargar proyectos favoritos
        try {
          const userDataStr = localStorage.getItem('user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            const userId = userData.id;
            
            if (userId) {
              await loadFavorites(userId);
            }
          }
        } catch (error) {
          console.error('Error al cargar favoritos:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, urlProyectoId]);

  // UseEffect para limpiar referencia global al mapa
  useEffect(() => {
    return () => {
      if (window.map) {
        window.map = null;
      }
    };
  }, []);

  window.map = mapInstanceRef.current;
  
  // UseEffect para manejar el mapa
  useEffect(() => {
    if (activeTab !== 'planificacion' || !mapContainerRef.current) return;
  
    if (!mapInstanceRef.current) {
      console.log("Inicializando mapa...");
      setTimeout(initMap, 300);
    } else {
      // actualizar la visibilidad de las capas
      if (mapLayersRef.current.osm) {
        mapLayersRef.current.osm.setVisible(activeLayerType === 'map');
      }
      if (mapLayersRef.current.satellite) {
        mapLayersRef.current.satellite.setVisible(activeLayerType === 'satellite');
      }
      if (mapLayersRef.current.relief) {
        mapLayersRef.current.relief.setVisible(activeLayerType === 'relief');
      }
      
      // Actualizar tamaño y vista si se cambió el centro
      if (unidadMineraCoords && mapInstanceRef.current) {
        mapInstanceRef.current.getView().setCenter(fromLonLat(unidadMineraCoords));
        mapInstanceRef.current.getView().setZoom(13);
      }
      
      // Forzar actualización del tamaño
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize();
          console.log("Tamaño del mapa actualizado");
        }
      }, 300);
    }
  }, [activeTab, activeLayerType, unidadMineraCoords, initMap]);

  // UseEffect para verificar favorito cuando cambia el proyecto
  useEffect(() => {
    const verificarFavorito = async () => {
      if (proyecto?.id) {
        console.log("Verificando estado de favorito para proyecto:", proyecto.id);
        await checkIsFavorite(proyecto.id);
      }
    };
    
    verificarFavorito();
  }, [proyecto]);

  // Obtener nombre de usuario del localStorage
  const userDataStr = localStorage.getItem('user');
  let userName = 'Julio Benavides';
  let userRole = 'Geotécnico';
  
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      userName = `${userData.nombres || ''} ${userData.apellidos || ''}`.trim();
      userRole = userData.rol_nombre || 'Geotécnico';
    } catch (e) {
      console.error('Error al obtener datos de usuario:', e);
    }
  }
  
  // Determinar el período del día para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <div className="ig-loading">
        <div className="spinner"></div>
        <p>Cargando información del proyecto...</p>
      </div>
    );
  }
  
  if (error || !proyecto) {
    return (
      <div className="ig-error">
        <h2>Proyecto no encontrado</h2>
        <p>{error || "No se encuentra la información del proyecto solicitado."}</p>
        <button className="ig-volver-btn" onClick={() => navigate('/proyectos')}>
          Volver a Proyectos
        </button>
      </div>
    );
  }

  return (
    <div className="ig-container">
      {/* Sidebar */}
      <div className={`ig-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="ig-sidebar-header">
          {Logo ? (
            <img src={Logo} alt="Logo" className="ig-logo" />
          ) : (
            <div className="ig-logo-placeholder">KP</div>
          )}
          <h3 className="ig-company">Knight Piésold</h3>
        </div>

        <div className="title">
          <h4>Módulo de Investigación Geotécnica</h4>
        </div>
        
        <button className="ig-regresar-btn" onClick={handleRegresar}>
          <i className='bx bx-arrow-back'></i> Regresar
        </button>
        
        <div className="ig-favoritos">
          <h4>Proyectos Favoritos:</h4>
          
          {Object.keys(proyectosPorOficina).map(oficina => (
            <div key={oficina} className="ig-location-group">
              <h5 onClick={() => toggleOficina(oficina)}>
                {oficina} {oficinaExpandida[oficina] ? <i className='bx bx-chevron-down'></i> : <i className='bx bx-chevron-right'></i>}
              </h5>
              {oficinaExpandida[oficina] && (
                <ul className="ig-proyectos-lista">
                  {Object.keys(proyectosPorUnidadMinera).map(unidad => (
                    <li 
                      key={unidad}
                      className="ig-proyecto-item"
                      onClick={() => toggleUnidadMinera(unidad)}
                    >
                      {unidad} {unidadMineraExpandida[unidad] ? <i className='bx bx-chevron-down'></i> : <i className='bx bx-chevron-right'></i>}
                      
                      {unidadMineraExpandida[unidad] && (
                        <ul className="ig-proyecto-sublista">
                          {proyectosPorUnidadMinera[unidad].map((proy) => (
                            <li 
                              key={proy.id}
                              className={`ig-proyecto-subitem ${proy.id === proyecto.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToProyecto(proy.id);
                              }}
                            >
                              {proy.codigo_proyecto}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        
        <div className="ig-sidebar-footer">
          <button className="ig-collapse-btn" onClick={toggleSidebar}>
            Colapsar
            <i className='bx bx-chevron-right'></i>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="ig-content">
        <div className="ig-header">
          <div className="ig-user-info">
            <span>{getGreeting()}, {userName} - {userRole}</span>
          </div>
          
          <div className="ig-actions">
            <button className="ig-theme-toggle">
              <i className='bx bx-sun'></i>
            </button>
            <button className="ig-notifications">
              <i className='bx bx-bell'></i>
            </button>
            <div className="ig-user-avatar">
              <img src="/avatar.png" alt="Avatar" />
            </div>
          </div>
        </div>
        
        <div className="ig-main">
          {/* Pestañas de navegación */}
          <div className="ig-tabs">
            <button 
              className={`ig-tab ${activeTab === 'inicio' ? 'active' : ''}`}
              onClick={() => handleTabChange('inicio')}
            >
              Inicio
            </button>
            <button 
              className={`ig-tab ${activeTab === 'planificacion' ? 'active' : ''}`}
              onClick={() => handleTabChange('planificacion')}
            >
              Planificación
            </button>

            <button className={`ig-tab ${activeTab === 'ejecucion' ? 'active' : ''}`}
              onClick={() => handleTabChange('ejecucion')}
              >
              Ejecución
            </button>
            
            {/* Botón de agregar a favoritos */}
            <button 
              className={`ig-favorite-btn ${isFavorite ? 'is-favorite' : ''}`}
              onClick={toggleFavorite}
              disabled={savingFavorite}
            >
              {savingFavorite ? (
                <>
                  <span className="ig-spinner"></span>
                  Guardando...
                </>
              ) : (
                <>
                  {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} 
                  <i className={`bx ${isFavorite ? 'bxs-star' : 'bx-star'}`}></i>
                </>
              )}
            </button>
            {favoriteError && <div className="ig-error-message">{favoriteError}</div>}
          </div>
          
          {/* Contenido de la pestaña Inicio */}
          {activeTab === 'inicio' && (
            <div className="ig-tab-content">
              <div className="ig-project-info">
                <div className="ig-info-row">
                  <div className="ig-info-item nombre-proyecto">
                    <label>Nombre del proyecto:</label>
                    <div className="ig-info-valor">
                      {proyecto.nombre_proyecto || 'Caracterización geotécnica, geoquímica y reológica de los relaves depositados en el Depósito de Relaves Mina Justa'}
                    </div>
                  </div>
                </div>
                
                <div className="ig-info-row">
                  <div className="ig-info-item">
                    <label>Código del proyecto:</label>
                    <div className="ig-info-valor">{proyecto.codigo_proyecto || 'LI-201-00016/6'}</div>
                  </div>
                  
                  <div className="ig-info-item">
                    <label>Unidad Minera:</label>
                    <div className="ig-info-valor">{proyecto.unidad_minera || 'MINA JUSTA'}</div>
                  </div>
                  
                  <div className="ig-info-item">
                    <label>Ubicación:</label>
                    <div className="ig-info-valor">{ubicacion}</div>
                  </div>
                </div>
                
                <div className="ig-info-row">
                  <div className="ig-info-item">
                    <label>Gerente de Proyecto:</label>
                    <div className="ig-info-valor">{gerenteNombre}</div>
                  </div>
                  
                  <div className="ig-info-item">
                    <label>Responsable de proyecto:</label>
                    <div className="ig-info-valor">{responsableNombre}</div>
                  </div>
                </div>
              </div>
              
              <div className="ig-navigation">
                {anterior && (
                  <button 
                    className="ig-nav-btn anterior" 
                    onClick={() => navegarAlModulo(anterior.ruta, proyecto.id)}
                  >
                    ANTERIOR MÓDULO
                  </button>
                )}
                
                {siguiente && (
                  <button 
                    className="ig-nav-btn siguiente" 
                    onClick={() => navegarAlModulo(siguiente.ruta, proyecto.id)}
                  >
                    SIGUIENTE MÓDULO
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Contenido de la pestaña Planificación */}
          {activeTab === 'planificacion' && (
            <div className="ig-tab-content">
              <div className="ig-map-view">
                <div className="ig-tools-sidebar">
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Importar">
                      <i className='bx bx-import'></i>
                    </button>
                    <div className="ig-tool-submenu">
                      <ul>
                        <li onClick={() => handleMenuAction('importar', 'proyectos')}>Importar proyectos</li>
                        <li onClick={() => handleMenuAction('importar', 'kmz')}>Importar KMZ</li>
                        <li onClick={() => handleMenuAction('importar', 'shp')}>Importar SHP</li>
                        <li onClick={() => handleMenuAction('importar', 'geojson')}>Importar GeoJson</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Capas" onClick={() => {
                      if (isCapasSidebarOpen && mostrarPerforaciones) {
                        setMostrarPerforaciones(false);
                      }
                      setIsCapasSidebarOpen(!isCapasSidebarOpen);
                    }}>
                      <i className='bx bx-layer'></i>
                    </button>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Tablas" onClick={() => {
                      if (isTablasSidebarOpen && mostrarTablas) {
                        setMostrarTablas(false);
                      }
                      setIsTablasSidebarOpen(!isTablasSidebarOpen);
                    }}>
                      <i className='bx bx-table'></i>
                    </button>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Tipo de Mapa">
                      <i className='bx bx-map-alt'></i>
                    </button>
                    <div className="ig-tool-submenu">
                      <ul>
                        <li onClick={() => handleMenuAction('mapa', 'base')}>Mapa base</li>
                        <li onClick={() => handleMenuAction('mapa', 'satelite')}>Satélite</li>
                        <li onClick={() => handleMenuAction('mapa', 'relieve')}>Relieve</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Leyenda">
                      <i className='bx bx-list-ul'></i>
                    </button>
                    <div className="ig-tool-submenu">
                      <ul>
                        <li onClick={() => handleMenuAction('leyenda', 'mostrar')}>Mostrar leyenda</li>
                        <li onClick={() => handleMenuAction('leyenda', 'personalizar')}>Personalizar estilos</li>
                      </ul>
                    </div>
                  </div>

                   <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Laboratorio KP" onClick={() => {
                      if (isLaboratorioKpSidebarOpen && mostrarLaboratorioKp) {
                        setMostrarLaboratorioKp(false);
                      }
                      setIsLaboratorioKpSidebarOpen(!isLaboratorioKpSidebarOpen);
                    }}>
                      
                   
                      <i className='bx bx-test-tube'></i> 
                    </button>
                  </div>

                  <div className="ig-tool-item">
                   <button className="ig-tool-btn" title="Laboratorio Extranjero" onClick={()=>{
                    if (isLaboratorioExtranjeroSidebarOpen && mostrarLaboratorioExtranjero){
                      setMostrarLaboratorioExtranjero(false);
                    }
                    setIsLaboratorioExtranjeroSidebarOpen(!isLaboratorioExtranjeroSidebarOpen);
                   }}>
                   <i className='bx bx-test-tube'></i>
                   </button>
                  </div>


                  <div className="ig-tool-item">
                   <button className="ig-tool-btn" title='Roster' onClick={()=>{
                    if(isRosterSidebarOpen && mostrarRoster){
                      setMostrarRoster(false);
                    }
                    setIsRosterSidebarOpen(!isRosterSidebarOpen);
                   }}>
                    < i className='bx bx-calendar-week'></i> 
                   </button>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Guardar y Exportar"> 
                      <i className='bx bx-download'></i>
                    </button>
                    <div className="ig-tool-submenu">
                      <ul>
                        <li onClick={() => handleMenuAction('exportar', 'guardar')}>Guardar proyecto</li>
                        <li onClick={() => handleMenuAction('exportar', 'pdf')}>Exportar a PDF</li>
                        <li onClick={() => handleMenuAction('exportar', 'imagen')}>Exportar a imagen</li>
                        <li onClick={() => handleMenuAction('exportar', 'geojson')}>Exportar a GeoJSON</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="ig-tool-item">
                    <button className="ig-tool-btn" title="Revisar">
                      <i className='bx bx-check-square'></i>
                    </button>
                    <div className="ig-tool-submenu">
                      <ul>
                        <li onClick={() => handleMenuAction('revisar', 'validar')}>Validar datos</li>
                        <li onClick={() => handleMenuAction('revisar', 'errores')}>Informe de errores</li>
                        <li onClick={() => handleMenuAction('revisar', 'historial')}>Historial de cambios</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Contenedor del mapa */}
                <div className="ig-map-container">
                  {/* Panel de capas */}
                  {isCapasSidebarOpen && (
                    <VerCapas
                      proyectoId={Number(urlProyectoId) || (proyecto ? Number(proyecto.id) : null)}
                      isOpen={isCapasSidebarOpen}
                      onClose={handleCloseCapas} 
                      onCrearCapa={manejarCrearCapa}
                      onMostrarPerforaciones={() => {
                        console.log("Mostrando perforaciones desde InvestigacionGeotecnica");
                        console.log("ID del proyecto:", proyecto?.id);
                        console.log("Código del proyecto:", proyecto?.codigo_proyecto);
                        console.log("Mapa disponible:", !!mapInstanceRef.current);
                        setMostrarPerforaciones(true);
                      }}
                    />
                  )}

                  {isTablasSidebarOpen && (
                   <VerTablas
  proyectoId={Number(urlProyectoId) || (proyecto ? Number(proyecto.id): null)}
  isOpen={isTablasSidebarOpen}
  onClose={handleCloseTablas}
  onCrearTabla={manejarCrearTabla}
  onAbrirModalSpt={abrirModalSpt}
  onAbrirHistorialSpt={abrirModalHistorialSpt}
  onAbrirModalMuestras={abrirModalMuestras} 
  onAbrirMuestrasConsolidados={abrirModalMuestrasConsolidados}
  onAbrirModalLugeon={abrirModalLugeon}
  onAbrirModalLugeonConsolidados={abrirModalLugeonConsolidados}
  onAbrirModalLefranc={abrirModalLefranc}
  onAbrirModalLefrancConsolidados={abrirModalLefrancConsolidados}
/>
                  )}

                  {isLaboratorioKpSidebarOpen && (
                    <VerLaboratorio
                    proyectoId={Number(urlProyectoId) || (proyecto ? Number(proyecto.id):null)}
                    isOpen={isLaboratorioKpSidebarOpen}
                    onClose={handleCloseLaboratorioKp}
                    onCrearLaboratorioKp={manejarCrearLaboratorioKp}
                    onAbrirModalLaboratorioKp={abrirModalLaboratorioKp}
                    />
                  )}

                  {isLaboratorioExtranjeroSidebarOpen && (
                    <VerLaboratorioExtranjero
                    proyectoId={Number(urlProyectoId)|| (proyecto ? Number(proyecto.id): null)}
                    isOpen={isLaboratorioExtranjeroSidebarOpen}
                    onClose={handleCloseLaboratorioExtranjero}
                    onCrearLaboratorioExtranjero={manejarCrearLaboratorioExtranjero}
                    onAbrirModalLaboratorioExtranjero={abrirModalLaboratorioExtranjero}
                    />
                  )}

                   {isRosterSidebarOpen && (
                      <VerRoster
                      proyectoId={Number(urlProyectoId)|| (proyecto ? Number(proyecto.id):null)}
                      isOpen={isRosterSidebarOpen}
                      onClose={handleCloseRoster}
                      onCrearRoster={manejarCrearRoster}
                      onAbrirModalRatePerforaciones={abrirModalRatePerforaciones}  
                      onAbrirModalRateOtrasCapas={abrirModalRateOtrasCapas}
                      onAbrirModalCalculoPerforaciones={abrirModalCalculoPerforaciones}
                      onAbrirModalCalculoCalicatas={abrirModalCalculoCalicatas}
                      onAbrirModalCalculoDpl={abrirModalCalculoDpl}
                      onAbrirModalCalculoCpt={abrirModalCalculoCpt}
                      onAbrirModalCalculoPosteadoras={abrirModalCalculoPosteadoras}
                      onAbrirModalCalculoTrincheras={abrirModalCalculoTrincheras}
                      onAbrirModalAgruparSondajes={abrirModalAgruparSondajes}
                      onAbrirModalCronograma={abrirModalCronograma}
                      />
                   )}

                

                  {/* Modal SPT */}
                  {mostrarModalSpt && (
                    <ModalEnsayoSpt 
                      mostrar={mostrarModalSpt}
                      onCerrar={cerrarModalSpt}
                      proyectoId={modalSptConfig.proyectoId}
                      onEnsayoAgregado={modalSptConfig.onEnsayoAgregado}
                    />
                  )}

                  {/* Modal Historial Consolidados */}
                  {mostrarModalHistorialConsolidados && (
                    <ModalHistorialConsolidados
                      mostrar={mostrarModalHistorialConsolidados}
                      onCerrar={cerrarModalHistorialSpt}
                      proyectoId={modalHistorialSptConfig.proyectoId || proyecto?.id}
                    />
                  )}


                   {/*Modal Muestras*/}
                   {mostrarModalMuestras && (
                      <ModalMuestras
                       mostrar={mostrarModalMuestras}
                       onCerrar={cerrarModalMuestras}
                       proyectoId={modalMuestrasConfig.proyectoId}
                      onMuestraAgregado={modalMuestrasConfig.onMuestraAgregado} 
                     />
                     )}

                   {/*Modal Consolidado de Muestras*/}
                   {mostrarModalMuestrasConsolidados && (
                    <ModalMuestrasConsolidados
                     mostrar={mostrarModalMuestrasConsolidados}
                     onCerrar={cerrarModalMuestrasConsolidados}
                      proyectoId={modalMuestrasConfig.proyectoId || proyecto?.id}
                    />
                   )}

 {/* Modal Agregar Lugeon */}
 {mostrarModalLugeon && datosModalLugeon && (
  <ModalLugeon
    mostrar={mostrarModalLugeon}
    onCerrar={cerrarModalLugeon}
    proyectoId={datosModalLugeon.proyectoId}
    onLugeonAgregado={datosModalLugeon.onLugeonAgregado}
  />
)}

 
 {/* Modal Consolidados Lugeon */}
{mostrarModalLugeonConsolidados && datosModalLugeonConsolidados && (
  <ModalLugeonConsolidados
    mostrar={mostrarModalLugeonConsolidados}
    proyectoId={datosModalLugeonConsolidados.proyectoId}
    tipo={datosModalLugeonConsolidados.tipo}
    onCerrar={cerrarModalLugeonConsolidados}
  />
)}

 
  {/*Modal Agregar Lefranc*/}
  {mostrarModalLefranc && datosModalLefranc && (
    <ModalLefranc
     mostrar={mostrarModalLefranc}
     onCerrar={cerrarModalLefranc}
     proyectoId={datosModalLefranc.proyectoId}
     onLefrancAgregado={datosModalLefranc.onLefrancAgregado}
    />
  )}


  {/*Modal Consolidados Lefranc*/}
  {mostrarModalLefrancConsolidados && datosModalLefrancConsolidados && (
    <ModalLefrancConsolidados
     mostrar={mostrarModalLefrancConsolidados}
     proyectoId={datosModalLefrancConsolidados.proyectoId}
     tipo={datosModalLefrancConsolidados.tipo}
     onCerrar={cerrarModalLefrancConsolidados}
   />
  )}


 {/*Modal para crear Laboratorio Kp*/}
{mostrarModalLaboratorioKp && datosModalLaboratorioKp &&(
  <ModalLaboratorioKp
    mostrar={mostrarModalLaboratorioKp}
    onCerrar={cerrarModalLaboratorioKp}
    proyectoId={datosModalLaboratorioKp.proyectoId}
    tipoLaboratorioKpId={datosModalLaboratorioKp.tipoLaboratorioKpId}
    onLaboratorioAgregado={datosModalLaboratorioKp.onEnsayosAgregados}
  />
)}

        {/*Modal para crear Laboratorio Extranjero*/}
        {mostrarModalLaboratorioExtranjero && datosModalLaboratorioExtranjero &&(
          <ModalLaboratorioExtranjero
          mostrar={mostrarModalLaboratorioExtranjero}
          onCerrar={cerrarModalLaboratorioExtranjero}
          proyectoId={datosModalLaboratorioExtranjero.proyectoId}
          tiposLaboratorioExtranjeroId={datosModalLaboratorioExtranjero.tiposLaboratorioExtranjeroId}
          tipoLaboratorioExtranjeroId={datosModalLaboratorioExtranjero.tipoLaboratorioExtranjeroId}
          onLaboratorioExtranjeroAgregado={datosModalLaboratorioExtranjero.onLaboratorioExtranjeroAgregado}
        />
        )}

   

        {mostrarModalRatePerforaciones && datosModalRatePerforaciones && (
  <ModalRatePerforaciones
    isOpen={mostrarModalRatePerforaciones}
    onClose={cerrarModalRatePerforaciones}
    rosterPlanId={datosModalRatePerforaciones.rosterPlanId}
    tipoCapaNombre={datosModalRatePerforaciones.tipoCapaNombre}
    turnoNombre={datosModalRatePerforaciones.turnoNombre}
    rateActual={datosModalRatePerforaciones.rateActual}
    onRateActualizado={datosModalRatePerforaciones.onRateActualizado}
  />
)}

       {mostrarModalRateOtrasCapas && datosModalRateOtrasCapas && (
  <ModalRateOtrasCapas
    isOpen={mostrarModalRateOtrasCapas}
    onClose={cerrarModalRateOtrasCapas}
    rosterPlanId={datosModalRateOtrasCapas.rosterPlanId}
    tipoCapaNombre={datosModalRateOtrasCapas.tipoCapaNombre}
    turnoNombre={datosModalRateOtrasCapas.turnoNombre}
    rateActual={datosModalRateOtrasCapas.rateActual}
    onRateActualizado={datosModalRateOtrasCapas.onRateActualizado}
  />
)}

{mostrarModalCalculoPerforaciones && datosModalCalculoPerforaciones && (
  <ModalCalculoPerforaciones
    isOpen={mostrarModalCalculoPerforaciones}
    onClose={cerrarModalCalculoPerforaciones}
    rosterPlanId={datosModalCalculoPerforaciones.rosterPlanId}
    proyectoId={datosModalCalculoPerforaciones.proyectoId}
    tipoCapaNombre={datosModalCalculoPerforaciones.tipoCapaNombre}
    turnoNombre={datosModalCalculoPerforaciones.turnoNombre}
  />
)}

{mostrarModalCalculoCalicatas && datosModalCalculoCalicatas && (
  <ModalCalculoCalicatas
    isOpen={mostrarModalCalculoCalicatas}
    onClose={cerrarModalCalculoCalicatas}
    rosterPlanId={datosModalCalculoCalicatas.rosterPlanId}
    proyectoId={datosModalCalculoCalicatas.proyectoId}
    tipoCapaNombre={datosModalCalculoCalicatas.tipoCapaNombre}
    turnoNombre={datosModalCalculoCalicatas.turnoNombre}
    />
)}

{mostrarModalCalculoDpl && datosModalCalculoDpl && (
  <ModalCalculoDpl
    isOpen={mostrarModalCalculoDpl}
    onClose={cerrarModalCalculoDpl}
    rosterPlanId={datosModalCalculoDpl.rosterPlanId}
    proyectoId={datosModalCalculoDpl.proyectoId}
    tipoCapaNombre={datosModalCalculoDpl.tipoCapaNombre}
    turnoNombre={datosModalCalculoDpl.turnoNombre}
  />
)}

{mostrarModalCalculoCpt && datosModalCalculoCpt && (
  <ModalCalculoCpt
    isOpen={mostrarModalCalculoCpt}
    onClose={cerrarModalCalculoCpt}
    rosterPlanId={datosModalCalculoCpt.rosterPlanId}
    proyectoId={datosModalCalculoCpt.proyectoId}
    tipoCapaNombre={datosModalCalculoCpt.tipoCapaNombre}
    turnoNombre={datosModalCalculoCpt.turnoNombre}
  />
)}

{mostrarModalCalculoPosteadoras && datosModalCalculoPosteadoras && (
  <ModalCalculoPosteadoras
    isOpen={mostrarModalCalculoPosteadoras}
    onClose={cerrarModalCalculoPosteadoras}
    rosterPlanId={datosModalCalculoPosteadoras.rosterPlanId}
    proyectoId={datosModalCalculoPosteadoras.proyectoId}
    tipoCapaNombre={datosModalCalculoPosteadoras.tipoCapaNombre}
    turnoNombre={datosModalCalculoPosteadoras.turnoNombre}
  />
)}

{mostrarModalCalculoTrincheras && datosModalCalculoTrincheras && (
  <ModalCalculoTrincheras
    isOpen={mostrarModalCalculoTrincheras}
    onClose={cerrarModalCalculoTrincheras}
    rosterPlanId={datosModalCalculoTrincheras.rosterPlanId}
    proyectoId={datosModalCalculoTrincheras.proyectoId}
    tipoCapaNombre={datosModalCalculoTrincheras.tipoCapaNombre}
    turnoNombre={datosModalCalculoTrincheras.turnoNombre}
  />
)}
  
{mostrarModalAgruparSondajes && datosModalAgruparSondajes && (
   <ModalAgruparSondajes
        isOpen={mostrarModalAgruparSondajes}
        onClose={cerrarModalAgruparSondajes}
        rosterPlanData={datosModalAgruparSondajes}
      />
)}

{mostrarModalCronograma && datosModalCronograma && (
  <ModalCronograma
    isOpen={mostrarModalCronograma}
    onClose={cerrarModalCronograma}
    rosterPlanId={datosModalCronograma.rosterPlanId}  
    rosterId={datosModalCronograma.rosterId}          
    tipoCapaSeleccionada={datosModalCronograma.tipoCapa || 'Perforaciones'}
    selectedMonth={datosModalCronograma.mes || new Date().getMonth() + 1}
    selectedYear={datosModalCronograma.anio || new Date().getFullYear()}
  />
)}




                  <div ref={mapContainerRef} className="ig-map" id="ig-map"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear capas */}
      {isCrearCapaModalOpen && (
        <CrearCapaSimple 
          onClose={async (capaCreada) => {
            setIsCrearCapaModalOpen(false);
            setValidarCapaDuplicadaFn(null);
            if (capaCreada && isCapasSidebarOpen) {
              setIsCapasSidebarOpen(false);
              setTimeout(() => setIsCapasSidebarOpen(true), 100);
            }
          }}
          proyectoId={proyectoIdNumber || (proyecto ? proyecto.id : null)}
          validarCapaDuplicada={validarCapaDuplicadaFn}
        />
      )}

      {/* Modal para crear tablas */}
      {isCrearTablaModalOpen && (
        <CrearTablaSimple 
          onClose={async (tablaCreada) => {
            setIsCrearTablaModalOpen(false);
            setValidarTablaDuplicadaFn(null);
            if(tablaCreada && isTablasSidebarOpen){
              setIsTablasSidebarOpen(false);
              setTimeout(()=> setIsTablasSidebarOpen(true),100);
            }
          }}
          proyectoId={proyectoIdNumber || (proyecto ? proyecto.id : null)}
          validarTablaDuplicada={validarTablaDuplicadaFn}
        />
      )}

      {/*Modal para crear laboratorios kp*/}
      {isCrearLaboratorioKpModalOpen &&(
        <CrearLaboratorioKpSimple
        onClose={async (laboratoriokpCreado)=>{
          setIsCrearLaboratorioKpModalOpen(false);
          if(laboratoriokpCreado && isLaboratorioKpSidebarOpen){
            setIsLaboratorioKpSidebarOpen(false);
            setTimeout(()=> setIsLaboratorioKpSidebarOpen(true),100);
          }
        }}
         proyectoId={proyectoIdNumber || (proyecto ? proyecto.id : null)}
        />
      )}


      {/*Modal para crear laboratorios extranjeros*/}
      {isCrearLaboratorioExtranjeroModalOpen &&(
        <CrearLaboratorioExtranjeroSimple
        onClose={async(laboratorioextranjeroCreado)=>{
          setIsCrearLaboratorioExtranjeroModalOpen(false);
          if(laboratorioextranjeroCreado && isLaboratorioExtranjeroSidebarOpen){
            setIsLaboratorioExtranjeroSidebarOpen(false);
            setTimeout(()=> setIsLaboratorioExtranjeroSidebarOpen(true),100);
          }
        }}
        proyectoId={proyectoIdNumber || (proyecto ? proyecto.id : null)}
      />
      )}

       {/*Modal para crear roster*/}
       {isCrearRosterModalOpen &&(
        <CrearRosterSimple
        onClose={async(rosterCreado)=>{
          setIsCrearRosterModalOpen(false);
          if(rosterCreado && isRosterSidebarOpen){
            setIsRosterSidebarOpen(false);
            setTimeout(()=> setIsRosterSidebarOpen(true),100);
          }
        }}
        proyectoId={proyectoIdNumber || (proyecto ? proyecto.id : null)}
         validarTablaDuplicada={validarRosterDuplicadaFn}
        />
       )}

      
      
      {mostrarPerforaciones && (
        <div className={`tabla-perforaciones-overlay ${!isCapasSidebarOpen || sidebarCollapsed ? 'tabla-standalone' : ''}`}>
          <TablaPerforaciones 
            proyectoId={proyecto?.id} 
            codigoProyecto={proyecto?.codigo_proyecto} 
            map={mapInstanceRef.current}
            onClose={() => setMostrarPerforaciones(false)}
          />
        </div>
      )}
    </div>
  );
};

export default InvestigacionGeotecnica;