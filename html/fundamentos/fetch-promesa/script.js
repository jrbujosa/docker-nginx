document.addEventListener('DOMContentLoaded', () => {
  // --- Referencias a Elementos del DOM ---
  const resetBtn = document.getElementById('reset-btn');
  const prevStepBtn = document.getElementById('prev-step-btn');
  const nextStepBtn = document.getElementById('next-step-btn');
  const simulateErrorCheckbox = document.getElementById('simulate-error-checkbox');

  const resultDiv = document.getElementById('result-div');
  const consoleLogDiv = document.getElementById('console-log');
  const codeSnippetEl = document.getElementById('code-snippet');
  const currentStepTextEl = document.getElementById('current-step-text');

  const callStackDiv = document.getElementById('call-stack-content');
  const webApisDiv = document.getElementById('web-apis-content');
  const callbackQueueDiv = document.getElementById('callback-queue-content');

  // --- Estado de la Simulación ---
  let simulationSteps = [];
  let currentStepIndex = -1;
  let isErrorSimulation = false;

  // --- Código de Ejemplo Numerado ---
  const exampleCodeLines = [
      /* 00 */ "// --- Código de Ejemplo (Async/Await) ---",
      /* 01 */ "async function obtenerDatos() {",
      /* 02 */ "  logToConsole('1. Iniciando solicitud...', 'info');",
      /* 03 */ "  resultDiv.textContent = 'Cargando datos...';",
      /* 04 */ "",
      /* 05 */ "  try {",
      /* 06 */ "    const url = '/api/datos-simulados';",
      /* 07 */ "    logToConsole(\`2. Intentando fetch de: \${url}\`);",
      /* 08 */ "",
      /* 09 */ "    // 'await' pausa obtenerDatos() aquí",
      /* 10 */ "    const respuesta = await simulatedFetch(url);",
      /* 11 */ "    logToConsole('5. Promesa de fetch resuelta. Respuesta recibida.');",
      /* 12 */ "",
      /* 13 */ "    if (!respuesta.ok) {",
      /* 14 */ "      throw new Error(\`Error HTTP simulado: \${respuesta.status}\`);",
      /* 15 */ "    }",
      /* 16 */ "",
      /* 17 */ "    // 'await' pausa obtenerDatos() de nuevo",
      /* 18 */ "    const datos = await respuesta.json();",
      /* 19 */ "    logToConsole('8. Promesa de .json() resuelta. Datos parseados.');",
      /* 20 */ "",
      /* 21 */ "    logToConsole('9. ¡Datos obtenidos con éxito!', 'success');",
      /* 22 */ "    resultDiv.textContent = \`Éxito: \${JSON.stringify(datos)}\`;",
      /* 23 */ "",
      /* 24 */ "  } catch (error) {",
      /* 25 */ "    logToConsole(\`Error atrapado: \${error.message}\`, 'error');",
      /* 26 */ "    resultDiv.textContent = \`Fallo: \${error.message}\`;",
      /* 27 */ "  }",
      /* 28 */ "",
      /* 29 */ "  logToConsole('10. Fin de obtenerDatos().', 'info');",
      /* 30 */ "}",
      /* 31 */ "",
      /* 32 */ "// Llamada inicial para empezar la simulación",
      /* 33 */ "obtenerDatos();"
  ];

  function formatCodeSnippet() {
      codeSnippetEl.innerHTML = exampleCodeLines.map((line, index) => {
          return `<span id="code-line-${index}">${line.replace(/</g, "<").replace(/>/g, ">")}</span>`;
      }).join('');
  }

  // --- Funciones de Actualización de UI ---
  function highlightCodeLine(lineNumber) {
      document.querySelectorAll('#code-snippet span').forEach(span => span.classList.remove('highlight'));
      if (lineNumber >= 0 && lineNumber < exampleCodeLines.length) {
          const lineEl = document.getElementById(`code-line-${lineNumber}`);
          if (lineEl) {
              lineEl.classList.add('highlight');
          }
      }
  }

  function logToConsoleView(message, type = 'log') {
      const logEntry = document.createElement('div');
      const timestamp = `[${new Date().toLocaleTimeString()}]`;
      logEntry.textContent = `${timestamp} ${message}`;
      logEntry.className = type;
      consoleLogDiv.appendChild(logEntry);
      consoleLogDiv.scrollTop = consoleLogDiv.scrollHeight;

      if (type === 'error') console.error(`${timestamp} (SIM) ${message}`);
      else if (type === 'info' || type === 'success') console.info(`${timestamp} (SIM) ${message}`);
      else console.log(`${timestamp} (SIM) ${message}`);
  }

  function updateStackView(div, itemName, action, itemType = 'item', isPaused = false) {
      let currentContent = div.innerHTML.replace(/\(Vacío\)|\(Inactivo\)|\(Vacía\)/g, '').trim();
      let items = currentContent ? currentContent.split('</div>').filter(Boolean).map(item => item + '</div>') : [];
      const classPaused = isPaused ? ' paused' : '';

      if (action === 'add') {
          const newItemHTML = `<div class="${itemType}${classPaused}">${itemName}</div>`;
          if (div === callStackDiv || div === callbackQueueDiv) { // LIFO para Call Stack y Queue (visual)
              items.unshift(newItemHTML);
          } else {
              items.push(newItemHTML); // FIFO para Web APIs (visual)
          }
      } else if (action === 'remove') {
          // Intenta quitar por el nombre. Si hay duplicados, quita el primero que encuentre (LIFO).
          let found = false;
          items = items.filter(itemHTML => {
              const existingItemName = itemHTML.replace(/<div class=".*?">|<\/div>/g, '');
              if (!found && existingItemName === itemName) {
                  found = true;
                  return false; // Quitar este
              }
              return true; // Mantener este
          });
      } else if (action === 'clear') {
          items = [];
      } else if (action === 'updatePauseState') {
          items = items.map(itemHTML => {
              const existingItemName = itemHTML.replace(/<div class=".*?">|<\/div>/g, '');
              if (existingItemName === itemName) {
                  if (isPaused) {
                      return itemHTML.replace(`class="${itemType}"`, `class="${itemType} paused"`)
                                     .replace(`class="${itemType} "`, `class="${itemType} paused"`); // En caso de que ya tenga una clase
                  } else {
                      return itemHTML.replace(`class="${itemType} paused"`, `class="${itemType}"`);
                  }
              }
              return itemHTML;
          });
      }


      if (items.length === 0) {
          if (div === callStackDiv) div.innerHTML = '(Vacío)';
          else if (div === webApisDiv) div.innerHTML = '(Inactivo)';
          else if (div === callbackQueueDiv) div.innerHTML = '(Vacía)';
      } else {
          div.innerHTML = items.join('');
      }

      if(action !== 'clear' && div.parentElement && action !== 'updatePauseState') { // No resaltar en updatePauseState
          div.parentElement.classList.add('active');
          setTimeout(() => div.parentElement.classList.remove('active'), 700);
      }
  }


  function updateResultDiv(text) {
      resultDiv.textContent = text;
  }

  function updateStepExplanation(text) {
      currentStepTextEl.innerHTML = text;
  }

  // --- Definición de los Pasos de la Simulación ---
  function defineSimulation(isError) {
      simulationSteps = [
          // 0: Estado Inicial
          {
              line: -1,
              action: () => {
                  updateResultDiv('Esperando acción...');
                  logToConsoleView("Simulación iniciada/reiniciada. " + (isError ? "Modo ERROR activado." : "Modo ÉXITO activado."), "info");
              },
              desc: "<b>Estado Inicial:</b> Todo está listo. El código aún no se ha ejecutado."
          },
          // 1: Llamada a obtenerDatos()
          {
              line: 33, // obtenerDatos();
              action: () => {
                  updateStackView(callStackDiv, 'obtenerDatos()', 'add', 'item');
                  logToConsoleView("Se llama a obtenerDatos(). La función entra al Call Stack.", "code_execution");
              },
              desc: "<b>Paso 1:</b> Se invoca <code>obtenerDatos()</code>. Esta función <code>async</code> se añade a la cima del <b>Call Stack</b>."
          },
          // 2: logToConsole('1. Iniciando...')
          {
              line: 2,
              action: () => {
                  updateStackView(callStackDiv, 'logToConsole()', 'add', 'item');
                  logToConsoleView("Dentro de obtenerDatos(): Se llama a logToConsole(). Entra al Call Stack.", "code_execution");
              },
              desc: "<b>Paso 2:</b> Se ejecuta la primera línea dentro de <code>obtenerDatos()</code>, que es una llamada a <code>logToConsole()</code>. <code>logToConsole()</code> se añade al <b>Call Stack</b>."
          },
          {
              line: 2,
              action: () => {
                  logToConsoleView("1. Iniciando solicitud...", "info");
                  updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  logToConsoleView("logToConsole() termina y sale del Call Stack.", "code_execution");
              },
              desc: "<b>Paso 3:</b> <code>logToConsole()</code> muestra el mensaje y finaliza. Se quita del <b>Call Stack</b>."
          },
          // 3: resultDiv.textContent = ...
          {
              line: 3,
              action: () => {
                  updateResultDiv('Cargando datos...');
                  logToConsoleView("Actualizando UI: resultDiv.textContent = 'Cargando datos...'", "code_execution");
              },
              desc: "<b>Paso 4:</b> Se actualiza el contenido del <code>resultDiv</code> en la página."
          },
          // 4: try { const url = ...
          {
              line: 6,
              action: () => {
                  logToConsoleView("Entrando al bloque try. Definiendo 'url'.", "code_execution");
              },
              desc: "<b>Paso 5:</b> El código entra en el bloque <code>try</code>. Se define la variable <code>url</code>."
          },
          // 5: logToConsole(\`2. Intentando fetch...\`)
          {
              line: 7,
              action: () => {
                  updateStackView(callStackDiv, 'logToConsole()', 'add', 'item');
                  logToConsoleView("Se llama a logToConsole() de nuevo. Entra al Call Stack.", "code_execution");
              },
              desc: "<b>Paso 6:</b> Se llama a <code>logToConsole()</code> para indicar el intento de <code>fetch</code>."
          },
          {
              line: 7,
              action: () => {
                  logToConsoleView("2. Intentando fetch de: /api/datos-simulados", "log");
                  updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  logToConsoleView("logToConsole() termina y sale del Call Stack.", "code_execution");
              },
              desc: "<b>Paso 7:</b> <code>logToConsole()</code> muestra su mensaje y sale del <b>Call Stack</b>."
          },
          // 6: const respuesta = await simulatedFetch(url);
          {
              line: 10,
              action: () => {
                  updateStackView(callStackDiv, 'simulatedFetch()', 'add', 'item');
                  logToConsoleView("Llamando a simulatedFetch(). Entra al Call Stack.", "code_execution");
              },
              desc: "<b>Paso 8:</b> Se llama a <code>simulatedFetch()</code>. Esta función (simulada) es asíncrona. Entra al <b>Call Stack</b>."
          },
          {
              line: 10,
              action: () => {
                  updateStackView(webApisDiv, 'Tarea de Red (simulatedFetch)', 'add', 'item');
                  logToConsoleView("simulatedFetch() inicia una 'Tarea de Red'. La tarea se pasa a las Web APIs.", "sim_internal");
                  updateStackView(callStackDiv, 'simulatedFetch()', 'remove', 'item');
                  updateStackView(callStackDiv, 'obtenerDatos()', 'updatePauseState', 'item', true); // Marcar como pausada
                  logToConsoleView("simulatedFetch() devuelve Promesa y sale del Stack. `obtenerDatos()` se PAUSA aquí debido al `await`, esperando a `simulatedFetch`.", "sim_internal");
              },
              desc: `<b>Paso 9:</b> <code>simulatedFetch()</code> configura una tarea en las <b>Web APIs</b> (usando <code>setTimeout</code> internamente para simular el retraso de red).
                  <ul>
                      <li><code>simulatedFetch()</code> devuelve una Promesa y sale del <b>Call Stack</b>.</li>
                      <li>La función <code>obtenerDatos()</code> llega al <code>await</code>. Ahora se <strong>pausa</strong> esperando que la Promesa de <code>simulatedFetch()</code> se resuelva.</li>
                      <li><strong>Importante:</strong> Aunque nuestro simulador sigue mostrando <code>obtenerDatos()</code> en el 'Call Stack' (ahora en <i>cursiva/pausado</i> para indicar que está esperando), la función <code>obtenerDatos()</code> es <em>temporalmente eliminada</em> del Call Stack real del motor JavaScript. Esto libera al motor JavaScript.</li>
                  </ul>`
          },
          // 7: Web API procesando...
          {
              line: 10,
              action: () => {
                  logToConsoleView("Web APIs: 'Tarea de Red (simulatedFetch)' en progreso...", "event_loop");
              },
              desc: `<b>Paso 10:</b> La función <code>obtenerDatos()</code> está <b>pausada</b> en la línea del <code>await simulatedFetch(url)</code>.
                  <ul>
                      <li>Las <b>Web APIs</b> (el navegador) están manejando la 'Tarea de Red' en segundo plano (el <code>setTimeout</code> de nuestro <code>simulatedFetch</code> está contando).</li>
                      <li>El motor JavaScript está libre para hacer otras cosas si las hubiera (ejecutar otro código síncrono, manejar clics de usuario, etc.).</li>
                  </ul>`
          },
          // 8: Web API termina, callback a la Queue
          {
              line: 10,
              action: () => {
                  updateStackView(webApisDiv, 'Tarea de Red (simulatedFetch)', 'remove', 'item');
                  updateStackView(callbackQueueDiv, 'Callback de simulatedFetch', 'add', 'item');
                  logToConsoleView("Web APIs: 'Tarea de Red (simulatedFetch)' completada. Su callback se añade a la Callback Queue.", "sim_internal");
              },
              desc: "<b>Paso 11:</b> La 'Tarea de Red' (el <code>setTimeout</code> dentro de <code>simulatedFetch</code>) termina. El navegador prepara la función de 'respuesta' (el callback que resuelve/rechaza la Promesa de <code>simulatedFetch</code>) y la pone en la <b>Callback Queue</b>."
          },
          // 9: Event Loop mueve callback al Call Stack
          {
              line: 10,
              action: () => {
                  logToConsoleView("Event Loop: Call Stack (real) está vacío. Verificando Microtask Queue (vacía), luego Callback Queue...", "event_loop");
                  updateStackView(callbackQueueDiv, 'Callback de simulatedFetch', 'remove', 'item');
                  updateStackView(callStackDiv, 'Callback de simulatedFetch', 'add', 'item'); // Este callback se ejecuta
                  logToConsoleView("Event Loop: Moviendo 'Callback de simulatedFetch' de la Queue al Call Stack para ejecución.", "event_loop");
              },
              desc: "<b>Paso 12:</b> El <b>Event Loop</b> ve que el Call Stack (real) está vacío y que no hay Microtasks. Encuentra el 'Callback de simulatedFetch' en la <b>Callback Queue</b> y lo mueve al <b>Call Stack</b>. Este callback es el que resolverá (o rechazará) la Promesa que <code>obtenerDatos()</code> está esperando."
          },
          // 10: Código después del primer await (log, if !respuesta.ok)
          ...(isError ? [ // PASOS DE ERROR PARA FETCH
              {
                  line: 10, // Aún conceptualmente en la línea del await
                  action: () => {
                      updateStackView(callStackDiv, 'Callback de simulatedFetch', 'remove', 'item'); // El callback termina
                      updateStackView(callStackDiv, 'obtenerDatos()', 'updatePauseState', 'item', false); // Ya no está pausada, pero va al catch
                      logToConsoleView("SIMULADOR: La Promesa de fetch fue rechazada (error simulado). El 'await' convierte esto en un error lanzado.", "error");
                      // El error se propaga al catch de obtenerDatos()
                      // updateStackView(callStackDiv, 'obtenerDatos()', 'remove'); // Se saca para re-añadir como "en catch" pero es más confuso
                      // updateStackView(callStackDiv, 'obtenerDatos() [bloque catch]', 'add', 'item');
                      logToConsoleView("Salto al bloque 'catch' de obtenerDatos() debido al error en `await`.", "code_execution");
                  },
                  desc: `<b>Paso 13 (Error):</b> El 'Callback de simulatedFetch' se ejecuta y rechaza la Promesa.
                      <ul>
                          <li>Debido al <code>await</code>, este rechazo se convierte en un error que se lanza dentro de <code>obtenerDatos()</code>.</li>
                          <li>La ejecución de <code>obtenerDatos()</code> salta inmediatamente al bloque <code>catch</code>. La función <code>obtenerDatos()</code> sigue en el Call Stack.</li>
                      </ul>`
              },
              {
                  line: 25, // logToConsole(\`Error atrapado...\`)
                  action: () => {
                      updateStackView(callStackDiv, 'logToConsole()', 'add', 'item');
                  },
                  desc: "<b>Paso 14 (Error):</b> Dentro del bloque <code>catch</code>, se llama a <code>logToConsole()</code>."
              },
              {
                  line: 25,
                  action: () => {
                      logToConsoleView("Error atrapado: Fallo de red simulado", "error");
                      updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  },
                  desc: "<b>Paso 15 (Error):</b> <code>logToConsole()</code> muestra el mensaje de error y sale del <b>Call Stack</b>."
              },
              {
                  line: 26, // resultDiv.textContent = \`Fallo: \${error.message}\`;
                  action: () => {
                      updateResultDiv("Fallo: Fallo de red simulado");
                  },
                  desc: "<b>Paso 16 (Error):</b> Se actualiza <code>resultDiv</code> con el mensaje de error."
              },
          ] : [ // PASOS DE ÉXITO PARA FETCH
              {
                  line: 10, // Aún conceptualmente en la línea del await
                  action: () => {
                      updateStackView(callStackDiv, 'Callback de simulatedFetch', 'remove', 'item'); // El callback termina
                      updateStackView(callStackDiv, 'obtenerDatos()', 'updatePauseState', 'item', false); // Ya no está pausada
                      logToConsoleView("SIMULADOR: La Promesa de fetch fue resuelta. `obtenerDatos()` se reanuda.", "info");
                  },
                  desc: `<b>Paso 13 (Éxito):</b> El 'Callback de simulatedFetch' se ejecuta y resuelve la Promesa con un objeto 'respuesta' simulado.
                      <ul>
                          <li>El <code>await</code> recibe este valor, y la ejecución de <code>obtenerDatos()</code> se reanuda desde donde se pausó.</li>
                          <li><code>obtenerDatos()</code> (que estaba esperando) vuelve a estar activa en el Call Stack.</li>
                      </ul>`
              },
              {
                  line: 11, // logToConsole('5. Promesa de fetch resuelta...')
                  action: () => {
                      updateStackView(callStackDiv, 'logToConsole()', 'add', 'item');
                  },
                  desc: "<b>Paso 14 (Éxito):</b> El código de <code>obtenerDatos()</code> continúa. Se llama a <code>logToConsole()</code>."
              },
              {
                  line: 11,
                  action: () => {
                      logToConsoleView("5. Promesa de fetch resuelta. Respuesta recibida.", "log");
                      updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  },
                  desc: "<b>Paso 15 (Éxito):</b> <code>logToConsole()</code> termina y sale del <b>Call Stack</b>."
              },
              {
                  line: 13, // if (!respuesta.ok)
                  action: () => {
                      logToConsoleView("Verificando 'respuesta.ok'. Es 'true' (simulado).", "code_execution");
                  },
                  desc: "<b>Paso 16 (Éxito):</b> Se comprueba si la respuesta fue exitosa. En este caso, simulamos que <code>respuesta.ok</code> es <code>true</code>."
              },
              // 11: const datos = await respuesta.json();
              {
                  line: 18,
                  action: () => {
                      updateStackView(callStackDiv, 'respuesta.json()', 'add', 'item'); // Este es el método simulado .json()
                      logToConsoleView("Llamando a respuesta.json(). Entra al Call Stack.", "code_execution");
                  },
                  desc: "<b>Paso 17 (Éxito):</b> Se llama a <code>respuesta.json()</code> (nuestra versión simulada). Esta es otra operación asíncrona. Entra al <b>Call Stack</b>."
              },
              {
                  line: 18, // Aún en la línea del await
                  action: () => {
                      updateStackView(webApisDiv, 'Tarea de Parseo JSON', 'add', 'item');
                      logToConsoleView("respuesta.json() inicia 'Tarea de Parseo JSON'. Se pasa a Web APIs.", "sim_internal");
                      updateStackView(callStackDiv, 'respuesta.json()', 'remove', 'item');
                      updateStackView(callStackDiv, 'obtenerDatos()', 'updatePauseState', 'item', true); // Marcar como pausada de nuevo
                      logToConsoleView("respuesta.json() devuelve Promesa y sale del Stack. `obtenerDatos()` se PAUSA de nuevo.", "sim_internal");
                  },
                  desc: `<b>Paso 18 (Éxito):</b> <code>respuesta.json()</code> (simulado) configura otra tarea en las <b>Web APIs</b> (otro <code>setTimeout</code>).
                      <ul>
                          <li>Devuelve una Promesa y sale del <b>Call Stack</b>.</li>
                          <li><code>obtenerDatos()</code> se pausa otra vez esperando la Promesa de <code>.json()</code>. Vuelve a estar <i>cursiva/pausada</i> en el Call Stack visual.</li>
                      </ul>`
              },
              {
                  line: 18,
                  action: () => { logToConsoleView("Web APIs: 'Tarea de Parseo JSON' en progreso...", "event_loop"); },
                  desc: "<b>Paso 19 (Éxito):</b> Las <b>Web APIs</b> están 'parseando el JSON' (nuestro <code>setTimeout</code> está contando)."
              },
              {
                  line: 18,
                  action: () => {
                      updateStackView(webApisDiv, 'Tarea de Parseo JSON', 'remove', 'item');
                      updateStackView(callbackQueueDiv, 'Callback de .json()', 'add', 'item');
                      logToConsoleView("Web APIs: 'Tarea de Parseo JSON' completada. Su callback a la Callback Queue.", "sim_internal");
                  },
                  desc: "<b>Paso 20 (Éxito):</b> La 'Tarea de Parseo JSON' termina. Su callback se añade a la <b>Callback Queue</b>."
              },
              {
                  line: 18,
                  action: () => {
                      logToConsoleView("Event Loop: Call Stack (real) vacío. Verificando Queues...", "event_loop");
                      updateStackView(callbackQueueDiv, 'Callback de .json()', 'remove', 'item');
                      updateStackView(callStackDiv, 'Callback de .json()', 'add', 'item');
                      logToConsoleView("Event Loop: Moviendo 'Callback de .json()' de la Queue al Call Stack.", "event_loop");
                  },
                  desc: "<b>Paso 21 (Éxito):</b> El <b>Event Loop</b> mueve el 'Callback de .json()' al <b>Call Stack</b>."
              },
              {
                  line: 18, // Aún conceptualmente en la línea del await
                  action: () => {
                      updateStackView(callStackDiv, 'Callback de .json()', 'remove', 'item');
                      updateStackView(callStackDiv, 'obtenerDatos()', 'updatePauseState', 'item', false); // Ya no está pausada
                      logToConsoleView("SIMULADOR: La Promesa de .json() fue resuelta. `obtenerDatos()` se reanuda.", "info");
                  },
                  desc: `<b>Paso 22 (Éxito):</b> El 'Callback de .json()' resuelve la Promesa con los datos parseados.
                      <ul>
                          <li>El <code>await</code> recibe estos datos.</li>
                          <li><code>obtenerDatos()</code> se reanuda y vuelve a estar activa en el Call Stack.</li>
                      </ul>`
              },
              {
                  line: 19, // logToConsole('8. Promesa de .json() resuelta...')
                  action: () => { updateStackView(callStackDiv, 'logToConsole()', 'add', 'item'); },
                  desc: "<b>Paso 23 (Éxito):</b> <code>obtenerDatos()</code> continúa. Se llama a <code>logToConsole()</code>."
              },
              {
                  line: 19,
                  action: () => {
                      logToConsoleView("8. Promesa de .json() resuelta. Datos parseados.", "log");
                      updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  },
                  desc: "<b>Paso 24 (Éxito):</b> <code>logToConsole()</code> termina y sale del <b>Call Stack</b>."
              },
              {
                  line: 21, // logToConsole('9. ¡Datos obtenidos con éxito!')
                  action: () => { updateStackView(callStackDiv, 'logToConsole()', 'add', 'item'); },
                  desc: "<b>Paso 25 (Éxito):</b> Se llama a <code>logToConsole()</code> para el mensaje de éxito."
              },
              {
                  line: 21,
                  action: () => {
                      logToConsoleView("9. ¡Datos obtenidos con éxito!", "success");
                      updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
                  },
                  desc: "<b>Paso 26 (Éxito):</b> <code>logToConsole()</code> termina y sale del <b>Call Stack</b>."
              },
              {
                  line: 22, // resultDiv.textContent = \`Éxito: ...\`;
                  action: () => {
                      updateResultDiv("Éxito: {\"message\":\"Datos simulados procesados\",\"timestamp\":\"ahora\"}");
                  },
                  desc: "<b>Paso 27 (Éxito):</b> Se actualiza <code>resultDiv</code> con los datos exitosos."
              }
          ]),

          // 16: Fin del try/catch, logToConsole('10. Fin de obtenerDatos().')
          {
              line: 29,
              action: () => {
                  updateStackView(callStackDiv, 'logToConsole()', 'add', 'item');
              },
              desc: "<b>Paso final dentro de <code>obtenerDatos()</code>:</b> (Después del <code>try...catch</code>) Se llama a <code>logToConsole()</code> para el mensaje de finalización de la función."
          },
          {
              line: 29,
              action: () => {
                  logToConsoleView("10. Fin de obtenerDatos().", "info");
                  updateStackView(callStackDiv, 'logToConsole()', 'remove', 'item');
              },
              desc: "<b>Paso siguiente:</b> <code>logToConsole()</code> termina. El <b>Call Stack</b> se vacía de esta llamada."
          },
          // 17: obtenerDatos() termina
          {
              line: 30, // Fin de la función }
              action: () => {
                  updateStackView(callStackDiv, 'obtenerDatos()', 'remove', 'item');
                  logToConsoleView("obtenerDatos() ha terminado completamente y sale del Call Stack.", "code_execution");
              },
              desc: "<b>Simulación Completa:</b> La función <code>obtenerDatos()</code> ha terminado su ejecución y se quita del <b>Call Stack</b>. El Call Stack ahora está vacío. La simulación ha finalizado."
          },
          {
              line: -1,
              action: () => {
                  logToConsoleView("--- Simulación Finalizada ---", "info");
              },
              desc: "<b>Fin de la Simulación.</b> Puedes reiniciarla o explorar las explicaciones."
          }
      ];
  }

  // --- Lógica de Control de Pasos ---
  function executeStep(index) {
      if (index < 0 || index >= simulationSteps.length) return;

      const step = simulationSteps[index];
      highlightCodeLine(step.line);
      if (step.action) step.action();
      updateStepExplanation(step.desc || "Descripción no disponible.");

      prevStepBtn.disabled = index === 0;
      nextStepBtn.disabled = index === simulationSteps.length - 1;
      currentStepIndex = index;
  }

  function resetSimulation() {
      currentStepIndex = -1;
      isErrorSimulation = simulateErrorCheckbox.checked;
      defineSimulation(isErrorSimulation);

      consoleLogDiv.innerHTML = '';
      updateStackView(callStackDiv, null, 'clear');
      updateStackView(webApisDiv, null, 'clear');
      updateStackView(callbackQueueDiv, null, 'clear');
      highlightCodeLine(-1);

      executeStep(0);
      nextStepBtn.disabled = false;
      prevStepBtn.disabled = true;
  }

  function nextStep() {
      if (currentStepIndex < simulationSteps.length - 1) {
          executeStep(currentStepIndex + 1);
      }
  }

  function prevStep() {
      if (currentStepIndex > 0) {
          const targetStep = currentStepIndex - 1;
          const currentErrorState = isErrorSimulation;

          consoleLogDiv.innerHTML = '';
          updateStackView(callStackDiv, null, 'clear');
          updateStackView(webApisDiv, null, 'clear');
          updateStackView(callbackQueueDiv, null, 'clear');
          highlightCodeLine(-1);
          updateResultDiv('Esperando acción...');

          isErrorSimulation = currentErrorState;
          defineSimulation(isErrorSimulation);

          for (let i = 0; i <= targetStep; i++) {
              executeStep(i);
          }
      }
  }

  // --- Inicialización ---
  formatCodeSnippet();
  resetBtn.addEventListener('click', resetSimulation);
  nextStepBtn.addEventListener('click', nextStep);
  prevStepBtn.addEventListener('click', prevStep);
  simulateErrorCheckbox.addEventListener('change', () => {
      logToConsoleView("Modo de simulación de error cambiado. Se aplicará en el próximo 'Iniciar/Reiniciar'.", "info");
  });

  resetSimulation();
});