document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const simulateBtn = document.getElementById('simulate-btn');
    const resultDiv = document.getElementById('result-div');
    const consoleLogDiv = document.getElementById('console-log');
    const codeSnippetEl = document.getElementById('code-snippet');

    // Referencias para visualización (simplificada)
    const callStackDiv = document.getElementById('call-stack-content');
    const webApisDiv = document.getElementById('web-apis-content');
    const callbackQueueDiv = document.getElementById('callback-queue-content');
    const allDiagramBoxes = document.querySelectorAll('.diagram-box'); // Para quitar resaltado

    // --- Código de Ejemplo SIMPLIFICADO a Mostrar (Async/Await) ---
    // Este es el código que el estudiante verá y debe ser fácil de entender.
    const exampleCode = `
// --- Código de Ejemplo Simplificado (Async/Await) ---
async function obtenerDatos() {
  // 1. Informar al usuario que la operación ha comenzado
  logToConsole("Iniciando solicitud de datos...", "info");
  resultDiv.textContent = 'Cargando datos...'; // Muestra estado en la UI

  try {
    // 2. Definir la URL (simulada en este caso)
    const urlSimulada = '/api/datos-simulados';
    logToConsole(\`Intentando obtener datos de: \${urlSimulada}\`);

    // 3. Llamar a fetch y ESPERAR la respuesta inicial (asíncrono)
    //    'await' pausa ESTA FUNCIÓN (no el navegador) hasta que
    //    la promesa de simulatedFetch se resuelva o rechace.
    const respuesta = await simulatedFetch(urlSimulada);
    logToConsole("Respuesta inicial recibida del servidor (simulado).");

    // 4. Verificar si la respuesta fue exitosa (código 2xx)
    //    Es importante hacerlo SIEMPRE con fetch.
    if (!respuesta.ok) {
      // Si no fue ok, lanzar un error para que lo capture el 'catch'
      throw new Error(\`Error simulado del servidor: status \${respuesta.status}\`);
    }

    // 5. Leer el cuerpo de la respuesta como JSON y ESPERAR (también asíncrono)
    //    'await' pausa ESTA FUNCIÓN hasta que .json() termine.
    logToConsole("Procesando datos JSON de la respuesta...");
    const datos = await respuesta.json();

    // 6. ¡Éxito! Mostrar los datos obtenidos
    logToConsole("¡Datos obtenidos con éxito!", "success");
    resultDiv.textContent = \`Datos recibidos: \${JSON.stringify(datos)}\`;

  } catch (error) {
    // 7. Si ALGO falla en el bloque 'try' (la red, respuesta.ok=false,
    //    error al parsear json), la ejecución salta directamente aquí.
    logToConsole(\`Error durante la solicitud: \${error.message}\`, "error");
    resultDiv.textContent = \`Error al cargar: \${error.message}\`;
  }

  // 8. (Opcional: Bloque finally omitido para simplicidad)
  //    El código aquí se ejecutaría siempre, después del try o del catch.

  logToConsole("Proceso de obtención de datos finalizado.", "info");
  // La función termina aquí.
}
    `; // Fin del string exampleCode

    // --- Función de Simulación de fetch (INTERNA - con logs y visualización) ---
    // ESTA función SÍ interactúa con la visualización del Event Loop.
    function simulatedFetch(url) {
      const isError = Math.random() < 0.15; // 15% de probabilidad de error
      const delay = 1500 + Math.random() * 2000; // Retraso entre 1.5s y 3.5s

      // Log específico del simulador (no parte del código de ejemplo)
      logToConsole(`SIMULADOR: Iniciando tarea Web API (fetch a ${url}). Duración: ${(delay / 1000).toFixed(1)}s`);
      updateCallStack('fetch (interno)', 'add'); // Muestra brevemente en stack
      updateWebAPIs(`Network Request: ${url}`, 'add'); // Mueve a Web APIs
      updateCallStack('fetch (interno)', 'remove'); // Sale del stack

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          logToConsole(`SIMULADOR: Tarea Web API (${url}) completada.`);
          updateWebAPIs(`Network Request: ${url}`, 'remove'); // Sale de Web APIs
          updateQueue(`Callback de fetch (${url})`, 'add'); // Añadir a la cola

          // Simula el Event Loop moviendo la tarea (cuando sea posible)
          handleEventLoopTurn();

          // Resuelve o rechaza la Promesa (esto hará que 'await' continúe o salte al catch)
          if (isError) {
            logToConsole("SIMULADOR: Callback de fetch -> Rechazando Promesa (error)", "error");
            // Rechaza con un objeto que simule una respuesta NO ok
             reject(new Error('Fallo de red simulado')); // Error de red
             // O podrías resolver con una respuesta no-ok para probar el if(!respuesta.ok):
             // resolve({ ok: false, status: 500, statusText: 'Internal Server Error', json: () => Promise.reject(new Error("Server error")) });
          } else {
            logToConsole("SIMULADOR: Callback de fetch -> Resolviendo Promesa (éxito)");
            // Resuelve con un objeto Response simulado exitoso
            resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              json: () => simulatedJsonParse(url) // El método .json() también es asíncrono
            });
          }
        }, delay);
      });
    }

    // --- Función de Simulación de response.json() (INTERNA - con logs y visualización) ---
     function simulatedJsonParse(url) {
         const parseDelay = 300 + Math.random() * 400; // Retraso corto para parsear

         logToConsole(`SIMULADOR: Iniciando tarea Web API (parsing JSON). Duración: ${parseDelay.toFixed(0)}ms`);
         updateCallStack('.json() (interno)', 'add');
         updateWebAPIs('Parsing JSON', 'add');
         updateCallStack('.json() (interno)', 'remove');


         return new Promise((resolve) => {
             setTimeout(() => {
                logToConsole(`SIMULADOR: Tarea Web API (parsing) completada.`);
                updateWebAPIs('Parsing JSON', 'remove');
                updateQueue('Callback de .json()', 'add');

                handleEventLoopTurn(); // Simula el Event Loop

                // Resuelve la promesa de .json() con los datos simulados
                resolve({
                    message: `Datos procesados desde ${url}`,
                    timestamp: new Date().toLocaleTimeString()
                });
             }, parseDelay);
         });
     }


    // --- Funciones Auxiliares del Simulador (INTERNAS - para visualización) ---

    function logToConsole(message, type = 'log') {
      const logEntry = document.createElement('div');
      const timestamp = `[${new Date().toLocaleTimeString()}]`;
      logEntry.textContent = `${timestamp} ${message}`;
      logEntry.className = type; // Añade clase para color CSS

      consoleLogDiv.appendChild(logEntry);
      consoleLogDiv.scrollTop = consoleLogDiv.scrollHeight; // Auto-scroll

      // Log real en la consola del navegador para depuración
      if (type === 'error') console.error(`${timestamp} ${message}`);
      else if (type === 'info' || type === 'success') console.info(`${timestamp} ${message}`);
      else console.log(`${timestamp} ${message}`);
    }

    function updateVisualizer(div, content, action) {
        highlightBox(div.parentElement.id); // Resalta la caja padre
        const currentContent = div.innerHTML.replace('(Vacío)', '').replace('(Inactivo)', '').replace('(Vacía)', '');
        let items = currentContent.split('<br>').filter(Boolean); // Divide por saltos de línea

        if (action === 'add') {
            items.unshift(`<div>${content}</div>`); // Añade al principio (simula stack LIFO)
        } else if (action === 'remove') {
            // Intenta quitar el item específico (simplificado: quita el primero)
            items.shift();
        }

        if (items.length === 0) {
            const parentId = div.parentElement.id;
            if (parentId === 'call-stack') div.innerHTML = '(Vacío)';
            else if (parentId === 'web-apis') div.innerHTML = '(Inactivo)';
            else if (parentId === 'callback-queue') div.innerHTML = '(Vacía)';
        } else {
            div.innerHTML = items.join('<br>'); // Une con saltos de línea
        }
    }


    // Funciones específicas de actualización para claridad
     function updateCallStack(itemName, action) {
         const content = action === 'add' ? `▶️ ${itemName}` : itemName;
         updateVisualizer(callStackDiv, content, action);
     }
     function updateWebAPIs(taskName, action) {
          const content = action === 'add' ? `⏳ ${taskName}` : taskName;
         updateVisualizer(webApisDiv, content, action);
     }
     function updateQueue(callbackName, action) {
          const content = action === 'add' ? `📋 ${callbackName}` : callbackName;
         updateVisualizer(callbackQueueDiv, content, action);
     }


     // Simula un "turno" del Event Loop moviendo una tarea si es posible
     function handleEventLoopTurn() {
         // Esta es una simplificación extrema. El loop real es más complejo.
         // Solo verificamos si la cola tiene algo y el stack está vacío (conceptualmente)
         const firstCallbackHTML = callbackQueueDiv.innerHTML; // Lee el HTML
         // Verifica si NO está vacío Y el stack SÍ está vacío
         if (!firstCallbackHTML.includes('(Vacía)') && callStackDiv.innerHTML.includes('(Vacío)')) {
             const taskNameMatch = firstCallbackHTML.match(/📋 (.*?)(?=<br>|$)/); // Extrae el nombre de la tarea
             if (taskNameMatch && taskNameMatch[1]) {
                const taskName = taskNameMatch[1].trim();
                logToConsole(`~ EVENT LOOP: Call Stack vacío. Moviendo '${taskName}' de la Queue al Call Stack.`);
                updateQueue(taskName, 'remove'); // Quita de la cola visualmente
                // La ejecución real (y entrada al stack) la maneja el 'await' al continuar.
                // Aquí solo simulamos el log del Event Loop.
             }
         }
     }

    // Resalta una caja del diagrama brevemente
    function highlightBox(boxId) {
        allDiagramBoxes.forEach(box => box.classList.remove('active')); // Quitar resaltado previo
        const box = document.getElementById(boxId);
        if (box) {
            box.classList.add('active');
            setTimeout(() => box.classList.remove('active'), 700); // Quitar después de 700ms
        }
    }


    // --- Función Principal de Simulación (Handler del Botón) ---
    async function handleSimulationClick() {
      // 1. Limpiar estado previo de la UI
      resultDiv.textContent = 'Esperando acción...';
      consoleLogDiv.innerHTML = '';
      callStackDiv.innerHTML = '(Vacío)';
      webApisDiv.innerHTML = '(Inactivo)';
      callbackQueueDiv.innerHTML = '(Vacía)';
      allDiagramBoxes.forEach(box => box.classList.remove('active'));
      simulateBtn.disabled = true; // Deshabilitar botón durante la simulación
      simulateBtn.textContent = 'Simulación en Progreso...';

      logToConsole("--- Iniciando Simulación ---", "info");

      try {
        // 2. Ejecutar la función de ejemplo ASÍNCRONA
        //    Usamos `await` aquí para esperar a que toda la función
        //    `obtenerDatos` (incluyendo sus propios awaits internos) termine
        //    antes de habilitar el botón de nuevo.
        await window.obtenerDatos(); // Llama a la función definida globalmente

      } catch (outerError) {
         // Captura errores inesperados FUERA del try/catch de obtenerDatos (poco probable aquí)
         logToConsole(`ERROR INESPERADO EN EL SIMULADOR: ${outerError.message}`, "error");
      } finally {
        // 3. Tareas de limpieza final
        logToConsole("--- Simulación Finalizada ---", "info");
        simulateBtn.disabled = false; // Rehabilitar botón
        simulateBtn.textContent = 'Iniciar Simulación GET (Async/Await)';
      }
    }

    // --- Inicialización ---
    codeSnippetEl.textContent = exampleCode; // Muestra el código SIMPLIFICADO
    simulateBtn.addEventListener('click', handleSimulationClick);

     // --- Hacer Funciones Globales / Crear Función Ejecutable ---
     // Necesario para que el código dentro del string 'exampleCode' (cuando se ejecute)
     // pueda llamar a nuestras funciones auxiliares (logToConsole, simulatedFetch, etc.)

     // Exponer funciones auxiliares globales
     window.logToConsole = logToConsole;
     window.updateCallStack = updateCallStack; // Aunque no se usen en el ejemplo simplificado, las funciones internas sí
     window.updateWebAPIs = updateWebAPIs;
     window.updateQueue = updateQueue;
     window.simulatedFetch = simulatedFetch;
     window.resultDiv = resultDiv; // Para que la función pueda actualizarlo
     window.handleEventLoopTurn = handleEventLoopTurn;
     window.simulatedJsonParse = simulatedJsonParse;

     // Crear la función 'obtenerDatos' ejecutable a partir del string SIMPLIFICADO
     // Se usa `new Function` para crear la función desde el string.
     // ¡Precaución con `new Function` por seguridad en aplicaciones reales!
     try {
         window.obtenerDatos = new Function(`
             // Estas variables ahora acceden a las funciones globales que expusimos
             const logToConsole = window.logToConsole;
             const simulatedFetch = window.simulatedFetch;
             const resultDiv = window.resultDiv;
             const simulatedJsonParse = window.simulatedJsonParse; // Asegurarse de que esté disponible si se usa dentro

             // Pegar aquí el CUERPO EXACTO de la función 'obtenerDatos' SIMPLIFICADA
             // que definimos en la variable 'exampleCode'.
             // Es crucial que este código coincida con lo que ve el usuario.
             return (async function obtenerDatosInterno() {
                // 1. Informar al usuario que la operación ha comenzado
                logToConsole("Iniciando solicitud de datos...", "info");
                resultDiv.textContent = 'Cargando datos...'; // Muestra estado en la UI

                try {
                  // 2. Definir la URL (simulada en este caso)
                  const urlSimulada = '/api/datos-simulados';
                  logToConsole(\`Intentando obtener datos de: \${urlSimulada}\`);

                  // 3. Llamar a fetch y ESPERAR la respuesta inicial (asíncrono)
                  const respuesta = await simulatedFetch(urlSimulada);
                  logToConsole("Respuesta inicial recibida del servidor (simulado).");

                  // 4. Verificar si la respuesta fue exitosa (código 2xx)
                  if (!respuesta.ok) {
                    throw new Error(\`Error simulado del servidor: status \${respuesta.status || 'desconocido'}\`); // Añadir fallback por si status no existe
                  }

                  // 5. Leer el cuerpo de la respuesta como JSON y ESPERAR (también asíncrono)
                  logToConsole("Procesando datos JSON de la respuesta...");
                  const datos = await respuesta.json();

                  // 6. ¡Éxito! Mostrar los datos obtenidos
                  logToConsole("¡Datos obtenidos con éxito!", "success");
                  resultDiv.textContent = \`Datos recibidos: \${JSON.stringify(datos)}\`;

                } catch (error) {
                  // 7. Si ALGO falla en el bloque 'try'
                  logToConsole(\`Error durante la solicitud: \${error.message}\`, "error");
                  resultDiv.textContent = \`Error al cargar: \${error.message}\`;
                }

                logToConsole("Proceso de obtención de datos finalizado.", "info");
             })(); // IIFE para asegurar que se ejecuta como async al ser llamada
         `);
     } catch (e) {
         console.error("Error al crear la función dinámica:", e);
         logToConsole("Error crítico al inicializar el simulador. Revisa la consola del navegador.", "error");
         simulateBtn.disabled = true;
         simulateBtn.textContent = 'Error de Inicialización';
     }

}); // Fin del DOMContentLoaded