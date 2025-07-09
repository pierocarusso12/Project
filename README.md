# Proyecto React - Visualización de Perforaciones

Este proyecto es una prueba inicial para renderizar una vista en React que incluye tres componentes principales. El objetivo es montar una aplicación simple utilizando **Vite** para visualizar datos de perforaciones geotécnicas.

---

## Estructura de Componentes

1. **InvestigacionGeotecnica.jsx**  
   Componente padre principal de la vista.

2. **VerCapas.jsx**  
   Componente hijo dentro de `InvestigacionGeotecnica`.

3. **TablaPerforaciones.jsx**  
   Componente hijo dentro de `VerCapas`.  
   Este componente es el encargado de mostrar los datos extraídos de la tabla `perforacion_ejecucion`.

---

## Datos esperados en `TablaPerforaciones.jsx`

Este componente debe renderizar en una tabla los siguientes campos **de la tabla `perforacion_ejecucion`**:

- `id`
- `codigo_perforacion`
- `longitud`
- `latitud`
- `elevacion`
- `profundidad_suelo_metros`
- `profundidad_roca_metros`
- `profundidad_relleno_metros`
- `profundidad_relave_metros`
- `operador`
- `azimuth`
- `inclinacion`
- `nivel_freatico`
- `revestimiento`
- `estructura_id`
- `proyecto_id`
- `estados_perforaciones_id`
- `metodo_perforacion_id`

**Nota:** No mostrar campos de auditoría como `registrado por`.

---

## Archivos proporcionados

Se te han entregado los siguientes archivos:

- `InvestigacionGeotecnica.jsx`
- `VerCapas.jsx`
- `TablaPerforaciones.jsx`
- Archivos `.css` correspondientes

---

## Instrucciones para ejecutar el proyecto

### 1. Requisitos previos

- Tener instalado **Node.js** (versión recomendada LTS):  
  👉 Descargar desde [https://nodejs.org](https://nodejs.org)

- `npm` (se instala automáticamente con Node)

---

### 2. Crear un nuevo proyecto con Vite

Abre la terminal cmd presionando Windows + R y ejecuta lo siguiente:

npm create vite@latest nombre-del-proyecto

### 3. Reemplazar archivos
Copia los archivos .jsx y .css proporcionados en la carpeta src/ del proyecto recién creado.

Asegúrate de importar los componentes en main.jsx o en App.jsx así:

jsx
Copiar
Editar
// En App.jsx
import InvestigacionGeotecnica from './InvestigacionGeotecnica';

function App() {
  return <InvestigacionGeotecnica />;
}

export default App;

### 4. Ejecutar el proyecto
bash
Copiar
Editar
npm run dev
Esto abrirá la aplicación en tu navegador en http://localhost:5173.


### 5. Visualización de la vista
Una vez cargado, deberías ver los tres componentes anidados:

markdown
Copiar
Editar
InvestigacionGeotecnica
 └── VerCapasEjecucion
      └── TablaPerforacionesEjecucion.jsx (con datos renderizados)
