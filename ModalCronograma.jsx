import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ModalCronograma.css';
import Swal from 'sweetalert2';
import ModalSeleccionSupervisores from './ModalSeleccionSupervisores';


const COLORES_SUPERVISORES = ['#FF5733', '#33A1FF', '#33FF57', '#FF33F1', '#33FFF1', '#FFD700', '#8A2BE2'];

const ModalCronograma = ({ 
  isOpen, 
  onClose, 
  rosterPlanId,
  rosterId,
  tipoCapaSeleccionada: tipoCapaInicial = 'Perforaciones',
  selectedMonth = new Date().getMonth() + 1, 
  selectedYear = new Date().getFullYear() 
}) => {
  const [cronograma, setCronograma] = useState({});
  const [selectedIcon, setSelectedIcon] = useState('perforaciones');
  const [loading, setLoading] = useState(true);
  const [showSupervisoresModal, setShowSupervisoresModal] = useState(false);
  
  // Estados nuevos para filtros
  const [tipoCapaSeleccionada, setTipoCapaSeleccionada] = useState(tipoCapaInicial);
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('todas');
  const [capasDisponibles, setCapasDisponibles] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  
  // Datos del roster
  const [rosterInfo, setRosterInfo] = useState({
    nombre: '',
    regimen: '',
    diasInduccion: 0,
    totalDiasPerforacion: 0
  });
  
  // Máquinas específicas asignadas a este roster_plan_id
  const [maquinas, setMaquinas] = useState([]);
  const [maquinasFiltradas, setMaquinasFiltradas] = useState([]);
  
  // Supervisores con sus asignaciones por máquina
  const [supervisoresPorMaquina, setSupervisoresPorMaquina] = useState({});


const [contabilizacionesCalculadas, setContabilizacionesCalculadas] = useState(null);
const [mostrarContabilizaciones, setMostrarContabilizaciones] = useState(false);
  
  // Iconos disponibles para el cronograma
  const iconos = {
    vacio: { symbol: '', color: '#FFFFFF', label: 'Vacío' },
    subida: { symbol: '⬆️', color: '#FFE4B5', label: 'Subida a Mina' },
    bajada: { symbol: '⬇️', color: '#D3D3D3', label: 'Bajada de Mina' },
    induccion: { symbol: '📋', color: '#90EE90', label: 'Inducción' },
    perforaciones: { symbol: '🔨', color: '#87CEEB', label: 'Perforaciones' },
    descanso: { symbol: '☕', color: '#FFA500', label: 'Descanso' },
  };

  // Cargar capas disponibles del proyecto
  const cargarCapasDisponibles = useCallback(async () => {
    try {
      const response = await fetch(`http://10.161.1.76:8000/api/capas-roster-plan/${rosterPlanId}`);
      if (response.ok) {
        const data = await response.json();
        setCapasDisponibles(data.capas || ['Perforaciones']);
      } else {
        setCapasDisponibles(['Perforaciones']);
      }
    } catch (error) {
      console.error('Error al cargar capas:', error);
      setCapasDisponibles(['Perforaciones']);
    }
  }, [rosterPlanId]);

  // Cargar supervisores asignados a las máquinas
  const cargarSupervisoresMaquinas = useCallback(async () => {
    try {
      console.log('🔍 Cargando supervisores para rosterPlanId:', rosterPlanId, 'tipoCapaSeleccionada:', tipoCapaSeleccionada);
      
      const url = `http://10.161.1.76:8000/api/supervisores-maquinas/${rosterPlanId}?tipo_capa=${encodeURIComponent(tipoCapaSeleccionada)}`;
      console.log('📍 URL de supervisores:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos de supervisores recibidos:', data);
        console.log('📊 Total de máquinas con supervisores:', data.maquinas?.length || 0);
        
        // Organizar supervisores por máquina usando maquina_id como clave
        const supervisoresPorMaq = {};
        
        if (data.maquinas && data.maquinas.length > 0) {
          data.maquinas.forEach(maquina => {
            console.log('🔧 Procesando máquina:', {
              maquina_id: maquina.maquina_id,
              numero_maquina: maquina.numero_maquina,
              supervisores_count: maquina.supervisores?.length || 0
            });
            
            // IMPORTANTE: Usar maquina_id del backend como clave
            supervisoresPorMaq[maquina.maquina_id] = maquina.supervisores.map((supervisor, index) => ({
              ...supervisor,
              color: COLORES_SUPERVISORES[index % COLORES_SUPERVISORES.length],
              nombre: supervisor.nombre_completo || 'Sin nombre'
            }));
          });
        }
        
        console.log('📦 Supervisores organizados por máquina:', supervisoresPorMaq);
        console.log('🔑 Claves en supervisoresPorMaq:', Object.keys(supervisoresPorMaq));
        setSupervisoresPorMaquina(supervisoresPorMaq);
      } else {
        console.error('❌ Error en respuesta:', response.status);
        const errorText = await response.text();
        console.error('❌ Error detalle:', errorText);
      }
    } catch (error) {
      console.error('❌ Error al cargar supervisores de máquinas:', error);
      setSupervisoresPorMaquina({});
    }
  }, [rosterPlanId, tipoCapaSeleccionada]);

  // Cargar datos del roster
  const cargarDatosRoster = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar información del roster
      const rosterResponse = await fetch(`http://10.161.1.76:8000/api/roster-nombre/${rosterId}`);
      if (!rosterResponse.ok) throw new Error(`Error HTTP! status: ${rosterResponse.status}`);
      const rosterData = await rosterResponse.json();
      
      // Cargar régimen
      let regimenNombre = '14x7';
      if (rosterData.regimen_id) {
        const regimenResponse = await fetch(`http://10.161.1.76:8000/api/regimen/${rosterData.regimen_id}`);
        if (regimenResponse.ok) {
          const regimenData = await regimenResponse.json();
          regimenNombre = regimenData.nombre || '14x7';
        }
      }
      
      // Cargar total de días de perforación
      let totalDias = 0;
      const totalResponse = await fetch(`http://10.161.1.76:8000/api/total-calculado-perforacion/${rosterId}`);
      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        totalDias = totalData.total_dias_calculados || 0;
      }
      
      setRosterInfo({
        nombre: rosterData.nombre || 'Sin nombre',
        regimen: regimenNombre,
        diasInduccion: rosterData.dias_induccion_campo || 5,
        totalDiasPerforacion: totalDias
      });
      
      // Cargar máquinas específicas del roster_plan_id
      console.log('🚀 Cargando máquinas para rosterPlanId:', rosterPlanId);
      const maquinasResponse = await fetch(`http://10.161.1.76:8000/api/maquinas-roster/${rosterPlanId}`);
      
      if (maquinasResponse.ok) {
        const maquinasData = await maquinasResponse.json();
        console.log('🚜 Datos de máquinas recibidos:', maquinasData);
        
        if (maquinasData.maquinas?.length > 0) {
          const maquinasFormateadas = maquinasData.maquinas.map(maq => {
            console.log('🔍 Máquina individual:', {
              id: maq.id,
              numero_maquina: maq.numero_maquina,
              tipo_capa: maq.tipo_capa
            });
            
            return {
              id: maq.id,
              numero_maquina: maq.numero_maquina,
              nombre: `Máquina ${maq.numero_maquina}`,
              tipo_capa: maq.tipo_capa,
              duracionTotal: maq.duracion_total_dias || 0,
              agrupacion_manual: maq.agrupacion_manual
            };
          });
          
          console.log('📐 Máquinas formateadas:', maquinasFormateadas);
          console.log('🔑 IDs de máquinas:', maquinasFormateadas.map(m => m.id));
          setMaquinas(maquinasFormateadas);
          
          // Seleccionar primera máquina por defecto si no hay selección
          if (maquinaSeleccionada === 'todas' && maquinasFormateadas.length > 0) {
            setMaquinaSeleccionada(maquinasFormateadas[0].numero_maquina.toString());
          }
        } else {
          console.log('⚠️ No hay máquinas en la respuesta');
          setMaquinas([]);
        }
      } else {
        console.log('❌ Error al cargar máquinas:', maquinasResponse.status);
        setMaquinas([]);
      }
      
      // Cargar capas y supervisores
      await cargarCapasDisponibles();
      await cargarSupervisoresMaquinas();
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos del roster', 'error');
    } finally {
      setLoading(false);
    }
  }, [rosterId, rosterPlanId, maquinaSeleccionada, cargarCapasDisponibles, cargarSupervisoresMaquinas]);


  // Filtrar máquinas según selección
  useEffect(() => {
    if (maquinas.length === 0) {
      setMaquinasFiltradas([]);
      return;
    }

    let filtradas = maquinas;

    // Filtrar por tipo de capa
    if (tipoCapaSeleccionada && tipoCapaSeleccionada !== 'todas') {
      filtradas = filtradas.filter(maq => maq.tipo_capa === tipoCapaSeleccionada);
    }

    // Filtrar por máquina específica
    if (maquinaSeleccionada && maquinaSeleccionada !== 'todas') {
      filtradas = filtradas.filter(maq => maq.numero_maquina.toString() === maquinaSeleccionada);
    }

    setMaquinasFiltradas(filtradas);
  }, [maquinas, tipoCapaSeleccionada, maquinaSeleccionada]);

  // Debug effect
  useEffect(() => {
    console.log('🔍 DEBUG - Estado actual:');
    console.log('- Máquinas:', maquinas);
    console.log('- Supervisores por máquina:', supervisoresPorMaquina);
    console.log('- Tipo capa seleccionada:', tipoCapaSeleccionada);
    console.log('- Máquinas filtradas:', maquinasFiltradas);
  }, [maquinas, supervisoresPorMaquina, tipoCapaSeleccionada, maquinasFiltradas]);





// Función para analizar cobertura
const analizarCobertura = useCallback((cronograma, maquina, supervisores, totalDias) => {
  const analisis = {
    diasConCobertura: 0,
    diasSinCobertura: 0,
    diasConUnSolo: 0,
    diasConDosOMas: 0,
    diasConTresOMas: 0,
    problemas: [],
    advertencias: []
  };

  for (let dia = 1; dia <= totalDias; dia++) {
    let activos = 0;
    let subiendo = 0;
    
    supervisores.forEach((_, idx) => {
      const actividad = cronograma[`${maquina.id}-${idx}`][dia];
      switch(actividad) {
        case 'perforaciones':
          activos++;
          break;
        case 'induccion':
          activos++;
          break;
        case 'subida':
          subiendo++;
          break;
      }
    });
    
    // Análisis detallado
    if (activos === 0) {
      analisis.diasSinCobertura++;
      if (dia > 3) { // Los primeros días es normal que no haya cobertura completa
        analisis.problemas.push(`Día ${dia}: Sin personal activo`);
      }
    } else if (activos === 1) {
      analisis.diasConUnSolo++;
      // Solo es problema si no hay nadie subiendo para reemplazar
      if (subiendo === 0 && dia > 10) {
        analisis.advertencias.push(`Día ${dia}: Solo 1 persona activa sin reemplazo subiendo`);
      }
    } else if (activos === 2) {
      analisis.diasConDosOMas++;
    } else {
      analisis.diasConTresOMas++;
    }
    
    if (activos > 0) analisis.diasConCobertura++;
  }
  
  // Validar regla de siempre 2 supervisores activos
  const porcentajeOptimo = (analisis.diasConDosOMas / totalDias) * 100;
  if (porcentajeOptimo < 80) {
    analisis.problemas.push(`Cobertura subóptima: Solo ${porcentajeOptimo.toFixed(1)}% de días con 2+ supervisores activos`);
  }
  
  return analisis;
}, []);
  // Función para calcular estadísticas
  const calcularEstadisticas = useCallback((cronogramaSupervisor, totalDias) => {
    const stats = {
      perforaciones: 0,
      induccion: 0,
      subidas: 0,
      bajadas: 0,
      descanso: 0,
      vacio: 0,
      total: 0,
      ciclos: [],
      diasTrabajadosPorCiclo: []
    };
    
    if (!cronogramaSupervisor) return stats;
    
    let cicloActual = null;
    let diasTrabajoActual = 0;
    
    for (let dia = 0; dia <= totalDias; dia++) {
      const actividad = cronogramaSupervisor[dia];
      
      switch (actividad) {
        case 'perforaciones':
          stats.perforaciones++;
          diasTrabajoActual++;
          break;
        case 'induccion':
          stats.induccion++;
          break;
        case 'subida':
          stats.subidas++;
          cicloActual = { inicio: dia, diasTrabajo: 0, diasInduccion: 0 };
          diasTrabajoActual = 0;
          break;
        case 'bajada':
          stats.bajadas++;
          if (cicloActual) {
            cicloActual.fin = dia;
            cicloActual.diasTrabajo = diasTrabajoActual;
            stats.ciclos.push(cicloActual);
            stats.diasTrabajadosPorCiclo.push(diasTrabajoActual);
            cicloActual = null;
          }
          break;
        case 'descanso':
          stats.descanso++;
          break;
        case 'vacio':
          stats.vacio++;
          break;
      }
      stats.total++;
    }
    
    // Calcular promedio de días trabajados por ciclo
    if (stats.diasTrabajadosPorCiclo.length > 0) {
      stats.promedioDiasTrabajo = (
        stats.diasTrabajadosPorCiclo.reduce((a, b) => a + b, 0) / 
        stats.diasTrabajadosPorCiclo.length
      ).toFixed(1);
    }
    
    return stats;
  }, []);

  // Función para generar resumen detallado
  const generarResumenDetallado = useCallback((cronograma, maquinas, supervisoresPorMaquina, diasInduccion) => {
    let resumen = `CRONOGRAMA GENERADO - ${diasInduccion} DÍAS DE INDUCCIÓN\n`;
    resumen += `Régimen: ${rosterInfo.regimen}\n`;
    resumen += '═'.repeat(70) + '\n\n';
    
    maquinas.forEach(maquina => {
      const supervisores = supervisoresPorMaquina[maquina.id] || [];
      
      resumen += `MÁQUINA ${maquina.numero_maquina}\n`;
      resumen += '─'.repeat(70) + '\n';
      resumen += `Total días requeridos: ${maquina.duracionTotal} | Supervisores asignados: ${supervisores.length}\n\n`;
      
      // Tabla de estadísticas por supervisor
      resumen += 'Supervisor | Trabajo | Inducción | Subidas | Bajadas | Descanso | Vacío | Ciclos\n';
      resumen += '-----------|---------|-----------|---------|---------|----------|-------|--------\n';
      
      let totalPerforacion = 0;
      let totalInduccion = 0;
      let totalCiclos = 0;
      
      supervisores.forEach((sup, idx) => {
        const key = `${maquina.id}-${idx}`;
        const stats = calcularEstadisticas(cronograma[key], maquina.duracionTotal);
        
        totalPerforacion += stats.perforaciones;
        totalInduccion += stats.induccion;
        totalCiclos += stats.ciclos.length;
        
        resumen += `     ${idx + 1}     |   ${String(stats.perforaciones).padStart(3)}   |     ${String(stats.induccion).padStart(3)}   |    ${String(stats.subidas).padStart(3)}  |    ${String(stats.bajadas).padStart(3)}  |    ${String(stats.descanso).padStart(3)}   |  ${String(stats.vacio).padStart(3)}  |   ${stats.ciclos.length}\n`;
      });
      
      resumen += '─'.repeat(70) + '\n';
      resumen += `TOTALES    |   ${totalPerforacion}   |     ${totalInduccion}   |         |         |          |       |   ${totalCiclos}\n\n`;
      
      // Análisis de cobertura
      const analisis = analizarCobertura(cronograma, maquina, supervisores, maquina.duracionTotal);
      
      resumen += 'ANÁLISIS DE COBERTURA:\n';
      resumen += `✓ Días con 2+ personas activas: ${analisis.diasConDosOMas} (${((analisis.diasConDosOMas/maquina.duracionTotal)*100).toFixed(1)}%)\n`;
      resumen += `✓ Días con 3+ personas activas: ${analisis.diasConTresOMas}\n`;
      resumen += `⚠ Días con 1 persona activa: ${analisis.diasConUnSolo}\n`;
      resumen += `✗ Días sin cobertura: ${analisis.diasSinCobertura}\n`;
      
      // Verificar cumplimiento de reglas
      resumen += '\nVERIFICACIÓN DE REGLAS:\n';
      
      // Regla 1: No más de 14 días de trabajo
      let cumpleRegla1 = true;
      supervisores.forEach((_, idx) => {
        const stats = calcularEstadisticas(cronograma[`${maquina.id}-${idx}`], maquina.duracionTotal);
        stats.diasTrabajadosPorCiclo.forEach((dias, ciclo) => {
          if (dias > 14) {
            cumpleRegla1 = false;
            resumen += `❌ Supervisor ${idx + 1}, ciclo ${ciclo + 1}: ${dias} días trabajados (máx 14)\n`;
          }
        });
      });
      if (cumpleRegla1) resumen += '✅ Todos los supervisores trabajan máximo 14 días por ciclo\n';
      
      // Regla 5: Siempre 2 supervisores activos
      const porcentajeCobertura = (analisis.diasConDosOMas / maquina.duracionTotal) * 100;
      if (porcentajeCobertura >= 85) {
        resumen += '✅ Se mantienen 2 supervisores activos la mayor parte del tiempo\n';
      } else {
        resumen += `⚠️ Solo ${porcentajeCobertura.toFixed(1)}% del tiempo con 2+ supervisores activos\n`;
      }
      
      // Mostrar advertencias si las hay
      if (analisis.advertencias.length > 0) {
        resumen += '\nADVERTENCIAS:\n';
        analisis.advertencias.slice(0, 5).forEach(adv => resumen += `  - ${adv}\n`);
        if (analisis.advertencias.length > 5) {
          resumen += `  ... y ${analisis.advertencias.length - 5} advertencias más\n`;
        }
      }
      
      resumen += '\n';
    });
    
    // Mostrar el resumen
    Swal.fire({
      title: 'Cronograma Generado',
      html: `<pre style="text-align: left; font-size: 11px; font-family: 'Courier New', monospace;">${resumen}</pre>`,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      width: '900px'
    });
  }, [analizarCobertura, calcularEstadisticas, rosterInfo]);


// Función para calcular contabilizaciones CAMBIAR AQUI
const calcularContabilizaciones = useCallback((cronograma, maquinas, supervisoresPorMaquina) => {
  const contabilizaciones = {};
  
  maquinas.forEach(maquina => {
    const supervisores = supervisoresPorMaquina[maquina.id] || [];
    contabilizaciones[maquina.id] = {
      staff: [],
      reembolsables: [],
      totalDiasMaquina: maquina.duracionTotal
    };
    
    supervisores.forEach((supervisor, idx) => {
      const key = `${maquina.id}-${idx}`;
      const stats = calcularEstadisticas(cronograma[key], maquina.duracionTotal);
      
      // CORRECCIÓN: Verificar si hay bajada implícita al final
      let bajadasReales = stats.bajadas;
      let subidasReales = stats.subidas;
      
      // Buscar el último día con actividad de perforación
      let ultimoDiaPerforacion = -1;
      let tieneBajadaDespues = false;
      
      for (let dia = 0; dia <= maquina.duracionTotal; dia++) {
        if (cronograma[key][dia] === 'perforaciones') {
          ultimoDiaPerforacion = dia;
        }
      }
      
      // Si encontró perforaciones, verificar si hay bajada después
      if (ultimoDiaPerforacion > -1) {
        for (let dia = ultimoDiaPerforacion + 1; dia <= maquina.duracionTotal; dia++) {
          if (cronograma[key][dia] === 'bajada') {
            tieneBajadaDespues = true;
            break;
          }
        }
        
        // Si no hay bajada después del último día de perforación, agregar una bajada implícita
        if (!tieneBajadaDespues && ultimoDiaPerforacion === maquina.duracionTotal) {
          bajadasReales += 1;
        }
      }
      
      // ASEGURAR que las movilizaciones sean pares: subidas = bajadas
      if (subidasReales > bajadasReales) {
        bajadasReales = subidasReales;
      }
      
      // Contabilización Staff
      const movilizaciones = subidasReales + bajadasReales; // Siempre será par
      const inducciones = stats.induccion;
      const diasTrabajo = stats.perforaciones;
      
      contabilizaciones[maquina.id].staff.push({
        supervisorId: supervisor.id,
        supervisorNombre: supervisor.nombre,
        cargo: idx === 0 ? 'ING STAFF III' : idx === 1 ? 'ING II' : 'ING I',
        movilizaciones,
        inducciones,
        diasTrabajo
      });
      
      // Contabilización Reembolsables
      const hospedaje = diasTrabajo + inducciones + Math.round(movilizaciones / 2);
      const alimentacion = hospedaje;
      
      contabilizaciones[maquina.id].reembolsables.push({
        supervisorId: supervisor.id,
        supervisorNombre: supervisor.nombre,
        cargo: idx === 0 ? 'ING STAFF III' : idx === 1 ? 'ING II' : 'ING I',
        hospedaje,
        alimentacion,
        camioneta: maquina.duracionTotal
      });
    });
  });
  
  return contabilizaciones;
}, [calcularEstadisticas]);

  // Algoritmo principal para 2 días de inducción CAMBIAR AQUI
const calcularCronogramaAutomatico = useCallback(() => {
  const supervisoresDisponibles = Object.values(supervisoresPorMaquina).flat();

  if (supervisoresDisponibles.length === 0 || maquinasFiltradas.length === 0) {
    Swal.fire('Advertencia', 'Primero debe agregar supervisores y asegurarse de que haya máquinas cargadas', 'warning');
    return;
  }

  const nuevoCronograma = {};
  const [diasTrabajo, diasDescanso] = rosterInfo.regimen.split('x').map(Number);
  const diasInduccion = rosterInfo.diasInduccion;
  
  console.log('Configuración:', { diasTrabajo, diasDescanso, diasInduccion });

  // Validar que sea para 2 días de inducción
  if (diasInduccion !== 2) {
    Swal.fire({
      title: 'Advertencia',
      text: `Este algoritmo está optimizado para 2 días de inducción. Usted tiene configurado ${diasInduccion} días.`,
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
    return;
  }



  // Procesar cada máquina
  maquinasFiltradas.forEach((maquina) => {
    const supervisoresMaquina = supervisoresPorMaquina[maquina.id] || [];
    const totalDias = maquina.duracionTotal;
    const numSupervisores = supervisoresMaquina.length;

    if (numSupervisores < 3) {
      Swal.fire('Advertencia', `La máquina ${maquina.numero_maquina} necesita al menos 3 supervisores para mantener continuidad con 2 días de inducción`, 'warning');
      return;
    }

    // Inicializar cronograma VACÍO
    supervisoresMaquina.forEach((supervisor, supIndex) => {
      const key = `${maquina.id}-${supIndex}`;
      nuevoCronograma[key] = {};
      for (let dia = 0; dia <= totalDias; dia++) {
        nuevoCronograma[key][dia] = 'vacio';
      }
    });

    // === PATRÓN INICIAL ESPECÍFICO ===
    
    // SUPERVISOR 1 (S1)
    // D0: Sube → D1-D2: Inducción → D3-D14: Trabajo (12 días) → D15: Baja
    nuevoCronograma[`${maquina.id}-0`][0] = 'subida';
    nuevoCronograma[`${maquina.id}-0`][1] = 'induccion';
    nuevoCronograma[`${maquina.id}-0`][2] = 'induccion';
    for (let dia = 3; dia <= 14 && dia <= totalDias; dia++) {
      nuevoCronograma[`${maquina.id}-0`][dia] = 'perforaciones';
    }
    if (15 <= totalDias) {
      nuevoCronograma[`${maquina.id}-0`][15] = 'bajada';
      // Descanso: 5 días (trabajó 12 días → 12/2 = 6, pero régimen es 14x7)
      for (let dia = 16; dia <= 20 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-0`][dia] = 'descanso';
      }
    }

    // SUPERVISOR 2 (S2)
    // D0: Sube → D1-D2: Inducción → D3-D9: Trabajo (7 días) → D10: Baja
    nuevoCronograma[`${maquina.id}-1`][0] = 'subida';
    nuevoCronograma[`${maquina.id}-1`][1] = 'induccion';
    nuevoCronograma[`${maquina.id}-1`][2] = 'induccion';
    for (let dia = 3; dia <= 9 && dia <= totalDias; dia++) {
      nuevoCronograma[`${maquina.id}-1`][dia] = 'perforaciones';
    }
    if (10 <= totalDias) {
      nuevoCronograma[`${maquina.id}-1`][10] = 'bajada';
      // Descanso: 3 días (trabajó 7 días → 7/2 = 3.5 → 4 días total con bajada y subida)
      for (let dia = 11; dia <= 13 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-1`][dia] = 'descanso';
      }
    }

    // SUPERVISOR 3 (S3)
    // Entra en D8 (2 días antes de que S2 baje) para hacer inducción
    // D8: Sube → D9-D10: Inducción → D11-D22: Trabajo (12 días) → D23: Baja
    if (8 <= totalDias) {
      nuevoCronograma[`${maquina.id}-2`][7] = 'subida';
    }
    if (9 <= totalDias) nuevoCronograma[`${maquina.id}-2`][8] = 'induccion';
    if (10 <= totalDias) nuevoCronograma[`${maquina.id}-2`][9] = 'induccion';
    for (let dia = 10; dia <= 21 && dia <= totalDias; dia++) {
      nuevoCronograma[`${maquina.id}-2`][dia] = 'perforaciones';
    }
    if (23 <= totalDias) {
      nuevoCronograma[`${maquina.id}-2`][22] = 'bajada';
      // Descanso: 5 días
      for (let dia = 23; dia <= 27 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-2`][dia] = 'descanso';
      }
    }

    // === CICLOS POSTERIORES ===
    
    // S2 segundo ciclo: sube en D14
    if (14 <= totalDias) {
      nuevoCronograma[`${maquina.id}-1`][14] = 'subida';
      // Trabajo desde D15 hasta D28 (14 días)
      for (let dia = 15; dia <= 28 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-1`][dia] = 'perforaciones';
      }
      if (29 <= totalDias) {
        nuevoCronograma[`${maquina.id}-1`][29] = 'bajada';
        // Descanso: 5 días (trabajó 14 días → 14/2 = 7 días total)
        for (let dia = 30; dia <= 34 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-1`][dia] = 'descanso';
        }
      }
    }

    // S1 segundo ciclo: sube en D21
    if (21 <= totalDias) {
      nuevoCronograma[`${maquina.id}-0`][21] = 'subida';
      // Trabajo desde D22 hasta D35 (14 días)
      for (let dia = 22; dia <= 35 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-0`][dia] = 'perforaciones';
      }
      if (36 <= totalDias) {
        nuevoCronograma[`${maquina.id}-0`][36] = 'bajada';
        // Descanso: 5 días
        for (let dia = 37; dia <= 41 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-0`][dia] = 'descanso';
        }
      }
    }


    // S3 segundo ciclo: sube en D28 (cuando S2 baja)
    if (28 <= totalDias) {
      nuevoCronograma[`${maquina.id}-2`][28] = 'subida';
      // Trabajo desde D29 hasta D42 (14 días)
      for (let dia = 29; dia <= 42 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-2`][dia] = 'perforaciones';
      }
      if (43 <= totalDias) {
        nuevoCronograma[`${maquina.id}-2`][43] = 'bajada';
        // Descanso: 5 días
        for (let dia = 44; dia <= 48 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-2`][dia] = 'descanso';
        }
      }
    }

    // S2 tercer ciclo: sube en D35 (anticipándose a la bajada de S1)
    if (35 <= totalDias) {
      nuevoCronograma[`${maquina.id}-1`][35] = 'subida';
      // Trabajo desde D36 hasta D49 (14 días)
      for (let dia = 36; dia <= 49 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-1`][dia] = 'perforaciones';
      }
      if (50 <= totalDias) {
        nuevoCronograma[`${maquina.id}-1`][50] = 'bajada';
        // Descanso: 5 días
        for (let dia = 51; dia <= 55 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-1`][dia] = 'descanso';
        }
      }
    }

    // S1 tercer ciclo: sube en D42 (anticipándose a la bajada de S3)
    if (42 <= totalDias) {
      nuevoCronograma[`${maquina.id}-0`][42] = 'subida';
      // Trabajo desde D43 hasta D56 (14 días)
      for (let dia = 43; dia <= 56 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-0`][dia] = 'perforaciones';
      }
      if (57 <= totalDias) {
        nuevoCronograma[`${maquina.id}-0`][57] = 'bajada';
        // Descanso: 5 días
        for (let dia = 58; dia <= 62 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-0`][dia] = 'descanso';
        }
      }
    }

    // S3 tercer ciclo: sube en D50 (anticipándose a la bajada de S2)
    if (49 <= totalDias) {
      nuevoCronograma[`${maquina.id}-2`][49] = 'subida';
      // Trabajo desde D51 hasta D64 (14 días)
      for (let dia = 50; dia <= 63 && dia <= totalDias; dia++) {
        nuevoCronograma[`${maquina.id}-2`][dia] = 'perforaciones';
      }
      if (64 <= totalDias) {
        nuevoCronograma[`${maquina.id}-2`][64] = 'bajada';
        // Descanso: 5 días
        for (let dia = 65; dia <= 69 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-2`][dia] = 'descanso';
        }
      }
    }

    // Continuar con más ciclos si es necesario
    if (totalDias > 70) {
      // S2 cuarto ciclo
      if (56 <= totalDias) {
        nuevoCronograma[`${maquina.id}-1`][56] = 'subida';
        for (let dia = 57; dia <= 70 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-1`][dia] = 'perforaciones';
        }
        if (71 <= totalDias) {
          nuevoCronograma[`${maquina.id}-1`][71] = 'bajada';
          for (let dia = 72; dia <= 76 && dia <= totalDias; dia++) {
            nuevoCronograma[`${maquina.id}-1`][dia] = 'descanso';
          }
        }
      }

      // S1 cuarto ciclo
      if (63 <= totalDias) {
        nuevoCronograma[`${maquina.id}-0`][63] = 'subida';
        for (let dia = 64; dia <= 77 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-0`][dia] = 'perforaciones';
        }
        if (78 <= totalDias) {
          nuevoCronograma[`${maquina.id}-0`][78] = 'bajada';
          for (let dia = 79; dia <= 83 && dia <= totalDias; dia++) {
            nuevoCronograma[`${maquina.id}-0`][dia] = 'descanso';
          }
        }
      }

      // S3 cuarto ciclo
      if (70 <= totalDias) {
        nuevoCronograma[`${maquina.id}-2`][70] = 'subida';
        for (let dia = 71; dia <= 84 && dia <= totalDias; dia++) {
          nuevoCronograma[`${maquina.id}-2`][dia] = 'perforaciones';
        }
        if (85 <= totalDias) {
          nuevoCronograma[`${maquina.id}-2`][85] = 'bajada';
          for (let dia = 86; dia <= 90 && dia <= totalDias; dia++) {
            nuevoCronograma[`${maquina.id}-2`][dia] = 'descanso';
          }
        }
      }

      // S2 quinto ciclo (si es necesario)
      if (77 <= totalDias) {
        nuevoCronograma[`${maquina.id}-1`][77] = 'subida';
        for (let dia = 78; dia <= totalDias && dia <= 91; dia++) {
          nuevoCronograma[`${maquina.id}-1`][dia] = 'perforaciones';
        }
      }

      // S1 quinto ciclo (si es necesario)
      if (84 <= totalDias) {
        nuevoCronograma[`${maquina.id}-0`][84] = 'subida';
        for (let dia = 85; dia <= totalDias && dia <= 98; dia++) {
          nuevoCronograma[`${maquina.id}-0`][dia] = 'perforaciones';
        }
      }
    }
  });

setCronograma(nuevoCronograma);

// Calcular contabilizaciones
const contabilizaciones = calcularContabilizaciones(nuevoCronograma, maquinasFiltradas, supervisoresPorMaquina);
setContabilizacionesCalculadas(contabilizaciones);
setMostrarContabilizaciones(true);

// Generar resumen detallado
generarResumenDetallado(nuevoCronograma, maquinasFiltradas, supervisoresPorMaquina, diasInduccion);
}, [
  supervisoresPorMaquina, 
  maquinasFiltradas, 
  rosterInfo,
  generarResumenDetallado,
  calcularContabilizaciones 
]);

  // Manejar click en celda
  const handleCellClick = (maquinaId, supervisorIndex, day) => {
    const key = `${maquinaId}-${supervisorIndex}`;
    setCronograma(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [day]: selectedIcon
      }
    }));
  };

  // Manejar guardado de supervisores
  const guardarSupervisores = async (data) => {
    console.log('Datos recibidos del modal:', data);
    
    // Recargar supervisores después de guardar
    await cargarSupervisoresMaquinas();
    
    Swal.fire('Éxito', 'Supervisores asignados correctamente', 'success');
  };

  // Exportar a Excel (placeholder)
  const exportarExcel = () => {
    Swal.fire('En desarrollo', 'La exportación a Excel estará disponible próximamente', 'info');
  };

  // Configuración general (placeholder)
  const abrirConfiguracion = () => {
    Swal.fire('En desarrollo', 'La configuración general estará disponible próximamente', 'info');
  };

  // Generar encabezados de días
  const generateDayHeaders = (duracionTotal) => {
    const headers = [];
    const startDate = new Date(fechaInicio);

    for (let i = 0; i <= duracionTotal; i++) { // <= para incluir D0
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayNum = currentDate.getDate();
      const monthNum = currentDate.getMonth() + 1;

      headers.push(
        <div key={i} className="day-header" title={`${dayNum}/${monthNum}`}>
          <div style={{ fontSize: '10px', lineHeight: '1' }}>D{i}</div>
          <div style={{ fontSize: '8px', opacity: 0.7 }}>{dayNum}</div>
        </div>
      );
    }
    return headers;
  };

  // Generar celdas de días
  const generateDayCells = (maquinaId, supervisorIndex, supervisorColor, duracionTotal) => {
    const cells = [];
    const key = `${maquinaId}-${supervisorIndex}`;

    for (let day = 0; day <= duracionTotal; day++) { // Cambiado para incluir todos los días
      const iconType = cronograma[key]?.[day] || 'vacio';
      const icono = iconos[iconType];

      cells.push(
        <div
          key={day}
          className="day-cell"
          onClick={() => handleCellClick(maquinaId, supervisorIndex, day)}
          style={{
            backgroundColor: icono.color,
            borderLeft: iconType !== 'vacio' ? `3px solid ${supervisorColor}` : undefined,
            borderBottom: iconType !== 'vacio' ? `2px solid ${supervisorColor}20` : undefined,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icono.symbol && (
            <span className="icon-symbol">{icono.symbol}</span>
          )}
        </div>
      );
    }
    return cells;
  };

  // Effect para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarDatosRoster();
    }
  }, [isOpen, cargarDatosRoster]);

  // Obtener nombre del mes
  const getNombreMes = (mes) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  };

  // Función para guardar cronograma
const guardarCronograma = async () => {
  try {
    if (!contabilizacionesCalculadas) {
      Swal.fire('Advertencia', 'Primero debe calcular el cronograma', 'warning');
      return;
    }

    // Preparar datos para enviar
    const cronogramaData = [];
    const contabilizacionStaff = [];
    const contabilizacionReembolsables = [];
    
    maquinasFiltradas.forEach(maquina => {
      const supervisores = supervisoresPorMaquina[maquina.id] || [];
      
      supervisores.forEach((supervisor, idx) => {
        const key = `${maquina.id}-${idx}`;
        
        // Recopilar datos del cronograma
        for (let dia = 0; dia <= maquina.duracionTotal; dia++) {
          const actividad = cronograma[key]?.[dia];
          if (actividad && actividad !== 'vacio') {
            cronogramaData.push({
              maquina_id: maquina.id,
              supervisor_maquina_id: supervisor.id,
              dia: dia,
              actividad: actividad
            });
          }
        }
      });
      
      // Preparar contabilizaciones
      const contabMaquina = contabilizacionesCalculadas[maquina.id];
      
      contabMaquina.staff.forEach(item => {
        contabilizacionStaff.push({
          supervisor_id: item.supervisorId,
          movilizaciones: item.movilizaciones,
          inducciones: item.inducciones,
          total_dias: item.diasTrabajo
        });
      });
      
      contabMaquina.reembolsables.forEach(item => {
        contabilizacionReembolsables.push({
          supervisor_id: item.supervisorId,
          hospedaje: item.hospedaje,
          alimentacion: item.alimentacion,
          camioneta: item.camioneta
        });
      });
    });
    
    // Enviar al backend
    const response = await fetch('http://10.161.1.76:8000/api/guardar-cronograma', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roster_plan_id: rosterPlanId,
        cronograma: cronogramaData,
        contabilizacion_staff: contabilizacionStaff,
        contabilizacion_reembolsables: contabilizacionReembolsables
      })
    });
    
    if (response.ok) {
      Swal.fire('Éxito', 'Cronograma guardado correctamente', 'success');
      onClose(); // Cerrar el modal
    } else {
      throw new Error('Error al guardar el cronograma');
    }
    
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'No se pudo guardar el cronograma', 'error');
  }
};

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <div className="header-title-section">
              <span className="cronograma-prefix">CRONOGRAMA DE:</span>
              <select 
                className="tipo-capa-selector"
                value={tipoCapaSeleccionada}
                onChange={(e) => setTipoCapaSeleccionada(e.target.value)}
              >
                {capasDisponibles.map(capa => (
                  <option key={capa} value={capa}>{capa.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="header-info">
              <span className="infor-item-cronograma">
                <i className='bx bx-calendar'></i>
                {getNombreMes(selectedMonth)} {selectedYear}
              </span>
              <span className="infor-item-cronograma">
                <i className='bx bx-calendar-plus'></i>
                Inicio:
                <input 
                  type="date" 
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={{ marginLeft: '5px', padding: '2px 5px', borderRadius: '3px', border: '1px solid #ddd' }}
                />
              </span>
              <span className="infor-item-cronograma">
                <i className='bx bx-time'></i>
                {rosterInfo.totalDiasPerforacion} días totales
              </span>
              <span className="infor-item-cronograma">
                <i className='bx bx-user-check'></i>
                Régimen: {rosterInfo.regimen}
              </span>
              <span className="infor-item-cronograma">
                <i className='bx bx-book'></i>
                Inducción: {rosterInfo.diasInduccion} días
              </span>
              <span className="infor-item-cronograma filtro-maquina">
                <i className='bx bx-cog'></i>
                Máquina:
                <select 
                  className="maquina-selector"
                  value={maquinaSeleccionada}
                  onChange={(e) => setMaquinaSeleccionada(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {maquinas
                    .filter(maq => maq.tipo_capa === tipoCapaSeleccionada)
                    .map(maquina => (
                      <option key={maquina.numero_maquina} value={maquina.numero_maquina}>
                        Máquina {maquina.numero_maquina}
                      </option>
                    ))}
                </select>
              </span>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="action-button" onClick={calcularCronogramaAutomatico} title="Calcular">
              <i className='bx bx-calculator'></i>
            </button>
            <button className="action-button" title="Editar">
              <i className='bx bx-edit'></i>
            </button>
            <button className="action-button" title="Historial">
              <i className='bx bx-history'></i>
            </button>
            <button className="action-button" onClick={exportarExcel} title="Exportar Excel">
              <i className='bx bx-spreadsheet'></i>
            </button>
            <button className="action-button" onClick={() => setShowSupervisoresModal(true)} title="Agregar Personal">
              <i className='bx bx-group'></i>
            </button>
            <button className="action-button" onClick={abrirConfiguracion} title="Configuración">
              <i className='bx bx-cog'></i>
            </button>
            <button className="close-button" onClick={onClose}>
              <i className='bx bx-x'></i>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-title">Herramientas de Asignación</div>
          <div className="toolbar-icons">
            {Object.entries(iconos).map(([key, icono]) => (
              <button
                key={key}
                onClick={() => setSelectedIcon(key)}
                className={`toolbar-button ${selectedIcon === key ? 'active' : ''}`}
                title={icono.label}
              >
                <div className="toolbar-icon" style={{ backgroundColor: icono.color }}>
                  {icono.symbol && <span className="icon-symbol">{icono.symbol}</span>}
                </div>
                <span className="toolbar-label">{icono.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="main-content">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>ASIGNACIONES</h3>
            </div>
            <div className="sidebar-content">
              {loading ? (
                <div className="loading">Cargando...</div>
              ) : (
                <>
                  {/* Máquinas - Mostrar TODAS las máquinas del tipo de capa */}
                  {maquinas.filter(maq => maq.tipo_capa === tipoCapaSeleccionada).length > 0 ? (
                    maquinas
                      .filter(maq => maq.tipo_capa === tipoCapaSeleccionada)
                      .map(maquina => {
                        const supervisoresMaquina = supervisoresPorMaquina[maquina.id] || [];
                        const esMaquinaFiltrada = maquinaSeleccionada === 'todas' || 
                                                 maquina.numero_maquina.toString() === maquinaSeleccionada;
                        
                        return (
                          <div 
                            key={maquina.id} 
                            className={`maquina-section ${esMaquinaFiltrada ? 'maquina-active' : 'maquina-inactive'}`}
                          >
                            <div className="maquina-header">
                              <div className="maquina-name">{maquina.nombre}</div>
                              <div className="maquina-info">
                                <span className="maquina-tipo">{maquina.tipo_capa}</span>
                                <span className="maquina-duracion">{maquina.duracionTotal} días</span>
                                {esMaquinaFiltrada && <span className="maquina-badge">ACTIVA</span>}
                              </div>
                            </div>
                            
                            {/* Supervisores de esta máquina */}
                            <div className="supervisores-lista">
                              {supervisoresMaquina.length > 0 ? (
                                supervisoresMaquina.map((supervisor, index) => (
                                  <div key={index} className="supervisor-row">
                                    <div className="supervisor-main">
                                      <div 
                                        className="supervisor-indicator" 
                                        style={{ backgroundColor: supervisor.color }}
                                      ></div>
                                      <div className="supervisor-name">
                                        {supervisor.nombre}
                                        {supervisor.supervisor_orden === 1 && ' (Líder)'}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                      {supervisor.tipo_seleccion}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="no-supervisores">
                                  Sin supervisores asignados
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="no-maquinas">
                      {maquinas.length === 0 ? 
                        "No hay máquinas en este roster plan" : 
                        `No hay máquinas de ${tipoCapaSeleccionada}`}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

{/* Área de cronograma */}
          <div className="cronograma-area">
            <div className="cronograma-scroll">
              {/* Header con días */}
              {maquinasFiltradas.length > 0 && (
                <div className="cronograma-header">
                  <div className="cronograma-label">CRONOGRAMA</div>
                  {generateDayHeaders(maquinasFiltradas[0].duracionTotal)}
                </div>
              )}

              {/* Filas de datos */}
              {maquinasFiltradas.length > 0 ? (
                maquinasFiltradas.map(maquina => {
                  const supervisoresMaquina = supervisoresPorMaquina[maquina.id] || [];
                  
                  return supervisoresMaquina.length > 0 ? (
                    <div key={maquina.id} className="maquina-rows">
                      {supervisoresMaquina.map((supervisor, supIndex) => (
                        <div key={supIndex} className="cronograma-row">
                          <div className="row-indicator">
                            <div className="row-color" style={{ backgroundColor: supervisor.color }}></div>
                            <span className="row-label">
                              M{maquina.numero_maquina}-S{supervisor.supervisor_orden}
                            </span>
                          </div>
                          {generateDayCells(maquina.id, supIndex, supervisor.color, maquina.duracionTotal)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div key={maquina.id} className="cronograma-empty">
                      Máquina {maquina.numero_maquina}: Sin supervisores
                    </div>
                  );
                })
              ) : (
                <div className="cronograma-empty">
                  {maquinas.length === 0 ? 
                    "📋 No hay máquinas disponibles" : 
                    "👥 Seleccione una máquina o agregue supervisores"}
                </div>
              )}
            </div>
          </div>



        </div>

        {/* Tablas de contabilización */}
{mostrarContabilizaciones && contabilizacionesCalculadas && (
  <div className="contabilizaciones-container" style={{ 
    marginTop: '20px', 
    padding: '20px', 
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    width: '100%'
  }}>
    {maquinasFiltradas.map(maquina => {
      const contab = contabilizacionesCalculadas[maquina.id];
      if (!contab) return null;
      
      return (
        <div key={maquina.id} style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            Máquina {maquina.numero_maquina} - Contabilizaciones
          </h3>
          
          {/* Tabla de días staff */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              Contabilización de días staff
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Supervisores</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Movilizaciones</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Inducciones</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Días de trabajo</th>
                </tr>
              </thead>
              <tbody>
                {contab.staff.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.cargo}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.movilizaciones}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.inducciones}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.diasTrabajo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Tabla de días reembolsables */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              Contabilización de días reembolsables
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Supervisores</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Hospedaje</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Alimentación</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Camioneta</th>
                </tr>
              </thead>
              <tbody>
                {contab.reembolsables.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.cargo}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.hospedaje}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.alimentacion}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx === 0 ? item.camioneta : ''}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>TOTAL</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {contab.reembolsables.reduce((sum, item) => sum + item.hospedaje, 0)}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {contab.reembolsables.reduce((sum, item) => sum + item.alimentacion, 0)}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {contab.totalDiasMaquina}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    })}
  </div>
)}

        {/* Footer */}
        <div className="modal-footer">
          <button className="footer-button secondary" onClick={onClose}>
            <i className='bx bx-x-circle'></i> Cerrar
          </button>
          <button className="footer-button primary" onClick={guardarCronograma}>
  <i className='bx bx-save'></i> Guardar Cronograma
</button>
        </div>

        {/* Modal de selección de supervisores */}
        <ModalSeleccionSupervisores
          isOpen={showSupervisoresModal}
          onClose={() => setShowSupervisoresModal(false)}
          onGuardar={guardarSupervisores}
          rosterPlanId={rosterPlanId}
          tipoCapaSeleccionada={tipoCapaSeleccionada}
        />
      </div>
    </div>
  );
};

ModalCronograma.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rosterPlanId: PropTypes.number.isRequired,
  rosterId: PropTypes.number.isRequired,
  tipoCapaSeleccionada: PropTypes.string,
  selectedMonth: PropTypes.number,
  selectedYear: PropTypes.number
};

export default ModalCronograma;
