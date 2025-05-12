document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scenarioSelect = document.getElementById('scenario-select');
    const prevStepButton = document.getElementById('prev-step-button'); // Nuevo
    const nextStepButton = document.getElementById('next-step-button'); // Renombrado
    const resetButton = document.getElementById('reset-button');
    const interactionButton = document.getElementById('interaction-button');
    const htmlCodeEl = document.getElementById('html-code');
    const jsCodeEl = document.getElementById('js-code');
    const callStackList = document.getElementById('call-stack-list');
    const webApisList = document.getElementById('web-apis-list');
    const callbackQueueList = document.getElementById('callback-queue-list');
    const consoleOutputEl = document.getElementById('console-output');
    const eventLoopArrow = document.getElementById('event-loop-arrow');

    // --- Simulation State ---
    // state ahora se manejará como un historial
    let history = []; // Array de estados
    let historyIndex = -1; // Índice del estado actual en el historial

    // --- Scenarios Data (Sin cambios respecto a la versión anterior) ---
    const scenarios = {
        sync: { /*...*/
             html: `(No relevante)`,
            js: [
                `function funcionB() {`, // 0
                `  console.log('Dentro de B');`, // 1
                `}`, // 2
                `function funcionA() {`, // 3
                `  console.log('Llamando a B');`, // 4
                `  funcionB();`, // 5
                `  console.log('Regresando a A');`, // 6
                `}`, // 7
                `console.log('Inicio Script');`, // 8
                `funcionA();`, // 9
                `console.log('Fin Script');` // 10
            ],
            steps: [
                { line: 8, action: 'log', value: 'Inicio Script', stackPush: '(global)' },
                { line: 9, action: 'call', functionName: 'funcionA', targetLine: 3 },
                { line: 4, action: 'log', value: 'Llamando a B', stackPush: 'funcionA' },
                { line: 5, action: 'call', functionName: 'funcionB', targetLine: 0 },
                { line: 1, action: 'log', value: 'Dentro de B', stackPush: 'funcionB' },
                { line: 2, action: 'return', stackPop: true }, // Return from B
                { line: 6, action: 'log', value: 'Regresando a A'},
                { line: 7, action: 'return', stackPop: true }, // Return from A
                { line: 10, action: 'log', value: 'Fin Script'},
                { line: -1, action: 'end', stackPop: true } // End global
            ]
         },
        timeout: { /*...*/
            html: `(No relevante)`,
            js: [
                `function tareaTimer() {`, // 0
                `  console.log('¡Timer finalizado!');`, // 1
                `}`, // 2
                `console.log('Inicio Script');`, // 3
                `setTimeout(tareaTimer, 1000);`, // 4
                `console.log('Timer programado');`, // 5
                `// Esperando que pase el tiempo...` // 6 (Placeholder visual)
            ],
             steps: [
                { line: 3, action: 'log', value: 'Inicio Script', stackPush: '(global)' },
                { line: 4, action: 'api', apiName: 'setTimeout', duration: 1000, callbackName: 'tareaTimer'},
                { line: 5, action: 'log', value: 'Timer programado'},
                { line: 6, action: 'wait_api', apiName: 'setTimeout' }, // Pausa esperando API
                { line: -1, action: 'check_queue' }, // Fin script sync, global sale, verificar cola
             ],
             callbackCode: { // Código a ejecutar cuando el callback es llamado
                 'tareaTimer': [
                     { line: 1, action: 'log', value: '¡Timer finalizado!' },
                     { line: 2, action: 'return', stackPop: true }
                 ]
             }
         },
        event: { /*...*/
            html: `<button id="miBotonSimulado">Haz Click Aquí</button>`,
            js: [
                `// Simulación: Obteniendo el botón`, // 0
                `const boton = 'miBotonSimulado';`, // 1
                `function manejadorClick() {`, // 2
                `  console.log('¡Botón clickeado!');`, // 3
                `}`, // 4
                `console.log('Añadiendo listener');`, // 5
                `// Simulación: boton.addEventListener('click', manejadorClick);`, // 6
                `console.log('Listener añadido y esperando...');`, // 7
                 `// Esperando interacción del usuario...` // 8 (Placeholder visual)
            ],
            steps: [
                { line: 0, action: 'comment', stackPush: '(global)'},
                { line: 1, action: 'assignment' }, // Simula asignación
                { line: 5, action: 'log', value: 'Añadiendo listener' },
                { line: 6, action: 'api', apiName: 'addEventListener', eventType: 'click', callbackName: 'manejadorClick' },
                { line: 7, action: 'log', value: 'Listener añadido y esperando...' },
                { line: 8, action: 'wait_api', apiName: 'addEventListener' }, // Pausa esperando API (evento)
                { line: -1, action: 'check_queue' }, // Fin script sync, global sale, verificar cola
            ],
            callbackCode: {
                 'manejadorClick': [
                     { line: 3, action: 'log', value: '¡Botón clickeado!' },
                     { line: 4, action: 'return', stackPop: true }
                 ]
            }
         }
    };

    // --- Helper: Deep Copy State ---
    function deepCopy(obj) {
        // Simple deep copy for JSON-serializable data
        try {
             return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error("Error during deep copy:", e);
            return null; // O manejar el error de otra forma
        }
    }

    // --- Core Simulation Functions ---

    function setupScenario(scenarioName) {
        const scenario = scenarios[scenarioName];
        const initialState = {
            scenarioName: scenarioName,
            html: scenario.html,
            jsLines: scenario.js,
            steps: scenario.steps,
            callbackCode: scenario.callbackCode || {},
            currentStepIndex: 0, // Índice del *próximo* paso del script principal a ejecutar
            callStack: [],
            webApis: [], // { id, name, type, callbackName, endTime?, triggered?, eventType? }
            callbackQueue: [], // { callbackName, apiId }
            consoleOutput: [],
            currentJsLine: -1, // Línea resaltada en JS
            waitingForApi: null,
            simulationTime: 0,
            nextApiId: 0,
            executingCallback: false, // Estado actual: ¿está ejecutando un callback?
            callbackStepIndex: 0, // Índice del *próximo* paso del callback a ejecutar
            statusMessage: "Listo para iniciar.", // Mensaje sobre el estado actual
            isFinished: false // Indica si la simulación ha terminado
        };

        history = [initialState]; // Reiniciar historial con el estado inicial
        historyIndex = 0; // Apuntar al estado inicial

        // Mostrar código inicial (solo una vez)
        htmlCodeEl.textContent = initialState.html;
        jsCodeEl.innerHTML = initialState.jsLines.map((line, index) => `<span data-line="${index}">${line}</span>`).join('\n');
        interactionButton.style.display = scenarioName === 'event' ? 'inline-block' : 'none';

        render(); // Renderizar el estado inicial
    }

    function render() {
        if (historyIndex < 0 || historyIndex >= history.length) {
            console.error("Índice de historial inválido:", historyIndex);
            return;
        }
        const state = history[historyIndex]; // Obtener el estado actual del historial

        // 1. Highlight JS Line
        document.querySelectorAll('#js-code span').forEach(span => {
            span.classList.remove('highlight');
            if (parseInt(span.dataset.line) === state.currentJsLine) {
                span.classList.add('highlight');
            }
        });

        // 2. Update Call Stack
        callStackList.innerHTML = state.callStack.map(frame =>
             `<li class="${frame === '(global)' ? 'global' : ''}">${frame}</li>`
        ).join('');
        if (state.callStack.length === 0 && !state.isFinished) {
             // Opcional: Mostrar "(idle)" si está vacío pero no terminado
             // callStackList.innerHTML = `<li class="global">(idle)</li>`;
        }

        // 3. Update Web APIs
        webApisList.innerHTML = state.webApis.map(api => {
            let text = '';
            if (api.type === 'timer') {
                const remaining = Math.max(0, api.endTime - state.simulationTime);
                text = `Timer: ${api.callbackName}() - ${remaining > 0 ? `(${remaining}ms restantes)` : '(Completado)'}`;
                if (remaining <= 0 && !api.triggered && !state.callbackQueue.some(cb => cb.apiId === api.id) && !state.callStack.includes(api.callbackName)) {
                   text += ' -> Listo para cola';
                }
                 if(state.callbackQueue.some(cb => cb.apiId === api.id)){
                     text += ' (En cola)';
                 } else if (state.callStack.includes(api.callbackName)) {
                     text += ' (Ejecutando)';
                 }
            } else if (api.type === 'listener') {
                text = `Listener: ${api.eventType} -> ${api.callbackName}() - ${api.triggered ? '(Evento ocurrió!)' : '(Esperando...)'}`;
                 if(api.triggered && state.callbackQueue.some(cb => cb.apiId === api.id)){
                      text += ' (En cola)';
                 } else if (state.callStack.includes(api.callbackName)) {
                      text += ' (Ejecutando)';
                 }
            }
            return `<div data-api-id="${api.id}">${text}</div>`;
        }).join('');

        // 4. Update Callback Queue
        callbackQueueList.innerHTML = state.callbackQueue.map(cb =>
            `<li>${cb.callbackName}</li>`
        ).join('');

        // 5. Update Console
        consoleOutputEl.textContent = state.consoleOutput.join('\n');
        consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight; // Auto-scroll

        // 6. Event Loop Arrow (se activa momentáneamente al mover)
        // (La activación se manejará al *calcular* el siguiente estado)
        eventLoopArrow.classList.remove('active'); // Reset por defecto
        if (state.eventLoopActive) { // Si el estado indica que el loop estuvo activo
             eventLoopArrow.classList.add('active');
            // Nota: La animación CSS es corta, así que esto funciona visualmente
        }

        // 7. Update Button States
        prevStepButton.disabled = historyIndex <= 0;
        nextStepButton.disabled = state.isFinished; // Deshabilitar 'Siguiente' si terminó

        // 8. Opcional: Mostrar mensaje de estado
        // console.log("Estado actual:", state.statusMessage);
    }

    function calculateNextState() {
        if (historyIndex < 0) return null; // No hay estado base
        const currentState = history[historyIndex];

        if (currentState.isFinished) {
            console.log("La simulación ya ha terminado.");
            return null; // No hay más estados que calcular
        }

        // Crear una copia profunda del estado actual para modificarla
        let nextState = deepCopy(currentState);
        nextState.statusMessage = ""; // Resetear mensaje
        nextState.eventLoopActive = false; // Resetear activación del loop

        let actionTaken = false;

        // --- Parte 1: Lógica del Event Loop (si Call Stack está vacío) ---
        if (nextState.callStack.length === 0 && !nextState.executingCallback) {
            // 1a. Simular paso del tiempo para timers (simplificado)
            // En lugar de tiempo real, consideramos que un timer está listo si su 'wait_api' pasó
            nextState.webApis.forEach(api => {
                if (api.type === 'timer' && api.endTime <= nextState.simulationTime && !api.triggered && !nextState.callbackQueue.some(cb => cb.apiId === api.id)) {
                    api.triggered = true; // Marcar como listo
                    nextState.callbackQueue.push({ callbackName: api.callbackName, apiId: api.id });
                    nextState.statusMessage += ` Timer ${api.callbackName} completado. Añadido a Callback Queue.`;
                    console.log(`Timer ${api.callbackName} completado, callback añadido a la cola.`);
                }
            });

            // 1b. Revisar si hay callbacks en la cola
            if (nextState.callbackQueue.length > 0) {
                const callbackInfo = nextState.callbackQueue.shift(); // Tomar el primero
                nextState.callStack.push(callbackInfo.callbackName);
                nextState.executingCallback = true;
                nextState.callbackStepIndex = 0; // Iniciar ejecución del callback
                const firstCallbackStep = nextState.callbackCode[callbackInfo.callbackName]?.[0];
                nextState.currentJsLine = firstCallbackStep ? firstCallbackStep.line : -1; // Resaltar primera línea
                nextState.statusMessage += ` Event Loop: Moviendo ${callbackInfo.callbackName} de Cola a Pila.`;
                nextState.eventLoopActive = true; // Indicar que el loop actuó
                console.log(`Event Loop: Moviendo ${callbackInfo.callbackName} de la Cola a la Pila.`);
                actionTaken = true;
            }
        }

        // --- Parte 2: Ejecución del Siguiente Paso (Script principal o Callback) si no actuó el Event Loop ---
        if (!actionTaken) {
            let currentStepConfig; // La configuración del paso a ejecutar
            let isCallbackStep = nextState.executingCallback;

            if (isCallbackStep) {
                // Ejecutando un callback
                const callbackName = nextState.callStack[nextState.callStack.length - 1];
                const callbackSteps = nextState.callbackCode[callbackName];
                if (!callbackSteps || nextState.callbackStepIndex >= callbackSteps.length) {
                     // Callback terminó implícitamente o hubo un error
                    if (nextState.callStack[nextState.callStack.length - 1] === callbackName) {
                       nextState.callStack.pop(); // Asegurarse de quitarlo
                    }
                     nextState.executingCallback = false;
                     nextState.currentJsLine = -1;
                     nextState.statusMessage += ` Callback ${callbackName} finalizado.`;
                     console.log(`Callback ${callbackName} finalizado.`);
                    // Verificamos si aún queda script principal o si todo acabó
                     if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 0 && nextState.callbackQueue.length === 0){
                        nextState.isFinished = true;
                        nextState.statusMessage += " Simulación completada.";
                     }
                     actionTaken = true; // Se realizó una acción (finalizar callback)
                } else {
                    currentStepConfig = callbackSteps[nextState.callbackStepIndex];
                    nextState.callbackStepIndex++; // Apuntar al siguiente paso del callback para la próxima vez
                }
            } else {
                // Ejecutando el script principal
                if (nextState.currentStepIndex >= nextState.steps.length) {
                    // Fin del script principal
                    if (nextState.callStack.length > 0 && nextState.callStack[0] === '(global)') {
                         nextState.callStack.pop(); // Quitar global si queda
                         nextState.statusMessage += " Fin del script global.";
                         actionTaken = true;
                    }
                     nextState.currentJsLine = -1;
                     // Si no hay más APIs esperando o callbacks, terminamos
                     if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => api.triggered || api.type === 'listener')) {
                         nextState.isFinished = true;
                         nextState.statusMessage += " Simulación completada.";
                     } else if (!actionTaken) {
                         // Si aún hay trabajo asíncrono pendiente pero el script síncrono acabó
                         nextState.statusMessage += " Script síncrono finalizado. Esperando tareas asíncronas...";
                         actionTaken = true; // Indica que hicimos algo (transición a espera)
                     }

                } else {
                    currentStepConfig = nextState.steps[nextState.currentStepIndex];
                    nextState.currentStepIndex++; // Apuntar al siguiente paso del script para la próxima vez
                }
            }

            // --- Procesar la acción del paso actual (si se determinó uno) ---
            if (currentStepConfig && !actionTaken) {
                nextState.currentJsLine = currentStepConfig.line;
                nextState.statusMessage += ` Ejecutando línea ${currentStepConfig.line}: ${currentStepConfig.action}.`;
                console.log(`Ejecutando paso: ${currentStepConfig.action}`, currentStepConfig);

                // Aplicar stackPush ANTES de la acción si es el inicio de una función/global
                 if (currentStepConfig.stackPush) {
                     if (nextState.callStack.length === 0 && currentStepConfig.stackPush !== '(global)' && !isCallbackStep) {
                          nextState.callStack.push('(global)'); // Asegurar base global
                     }
                     // Solo añadir si no está ya en la cima (evita duplicados visuales si una acción no lo quita)
                     if (nextState.callStack.length === 0 || nextState.callStack[nextState.callStack.length - 1] !== currentStepConfig.stackPush) {
                         nextState.callStack.push(currentStepConfig.stackPush);
                     }
                 }


                switch (currentStepConfig.action) {
                    case 'log':
                        nextState.consoleOutput.push(currentStepConfig.value);
                        break;
                    case 'call':
                        // El stackPush ya se hizo arriba. La lógica de pasos secuenciales maneja la "llamada".
                        nextState.statusMessage += ` Llamando a ${currentStepConfig.functionName}.`;
                        break;
                    case 'return':
                        if (currentStepConfig.stackPop && nextState.callStack.length > 0) {
                            const popped = nextState.callStack.pop();
                            nextState.statusMessage += ` Retornando de ${popped}.`;
                            console.log(`Retornando de ${popped}`);
                            // Si era la última instrucción de un callback, marcamos para salir del modo callback
                            if (isCallbackStep) {
                                const callbackName = popped; // El que acabamos de sacar
                                const callbackSteps = nextState.callbackCode[callbackName];
                                if (nextState.callbackStepIndex >= callbackSteps?.length) {
                                    nextState.executingCallback = false; // Terminó el callback
                                     nextState.currentJsLine = -1; // Limpiar resaltado
                                    console.log(`Callback ${callbackName} finalizado.`);
                                    // Aquí NO marcamos isFinished, esperamos al próximo ciclo por si hay más callbacks
                                }
                            }
                        }
                        break;
                    case 'api':
                        const apiId = nextState.nextApiId++;
                        const newApi = {
                            id: apiId,
                            name: currentStepConfig.apiName,
                            callbackName: currentStepConfig.callbackName,
                            triggered: false,
                            type: currentStepConfig.apiName === 'setTimeout' ? 'timer' : 'listener'
                        };
                        if (newApi.type === 'timer') {
                            newApi.endTime = nextState.simulationTime + currentStepConfig.duration; // Guardar cuándo debe terminar
                             nextState.statusMessage += ` API: Iniciando ${currentStepConfig.apiName} (${currentStepConfig.duration}ms).`;
                        } else {
                            newApi.eventType = currentStepConfig.eventType;
                             nextState.statusMessage += ` API: Registrando ${currentStepConfig.apiName} (${currentStepConfig.eventType}).`;
                        }
                        nextState.webApis.push(newApi);
                        break;
                    case 'wait_api':
                        nextState.waitingForApi = currentStepConfig.apiName;
                        nextState.statusMessage += ` Script en pausa, esperando ${currentStepConfig.apiName}...`;
                        // Simular que el tiempo pasa hasta el final del timer si es setTimeout
                         if (currentStepConfig.apiName === 'setTimeout') {
                             const timerApi = nextState.webApis.find(api => api.type === 'timer' && !api.triggered);
                             if (timerApi) {
                                 nextState.simulationTime = timerApi.endTime; // Avanzar tiempo simulado
                                 nextState.statusMessage += ` (Tiempo simulado avanzado a ${nextState.simulationTime}ms).`;
                             }
                         }
                        // Quitar (global) si el script síncrono ha terminado
                        if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 1 && nextState.callStack[0] === '(global)') {
                            nextState.callStack.pop();
                        }
                        break;
                     case 'check_queue':
                         nextState.statusMessage += " Fin script síncrono. Revisando cola...";
                         if (nextState.callStack.length === 1 && nextState.callStack[0] === '(global)') {
                             nextState.callStack.pop(); // Quitar global
                         }
                         nextState.currentJsLine = -1;
                         // El siguiente ciclo de calculateNextState se encargará de la cola si aplica
                         break;
                    case 'assignment':
                    case 'comment':
                        // No hacer nada extra, solo avanzar
                        break;
                    case 'end':
                         if (currentStepConfig.stackPop && nextState.callStack.length > 0 && nextState.callStack[nextState.callStack.length - 1] === '(global)') {
                             nextState.callStack.pop();
                         }
                         nextState.statusMessage += " Fin de ejecución global.";
                         nextState.currentJsLine = -1;
                         // Comprobar si todo ha terminado
                         if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => api.triggered || api.type === 'listener')) {
                             nextState.isFinished = true;
                             nextState.statusMessage += " Simulación completada.";
                         }
                        break;
                    default:
                        console.warn(`Acción desconocida: ${currentStepConfig.action}`);
                        nextState.statusMessage += ` Acción desconocida: ${currentStepConfig.action}.`;
                }
                 actionTaken = true; // Se procesó un paso
            }
        } // Fin de la ejecución del paso

        // Si no se realizó ninguna acción significativa (ni event loop, ni paso de script/callback, ni fin)
        // y la simulación no ha terminado, probablemente estemos esperando.
         if (!actionTaken && !nextState.isFinished) {
            if(nextState.waitingForApi && nextState.webApis.some(api => api.name === nextState.waitingForApi && !api.triggered)){
                 nextState.statusMessage = `Esperando evento/API: ${nextState.waitingForApi}...`;
                 // Si el script principal terminó y solo esperamos
                 if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 0){
                     nextState.currentJsLine = -1; // Sin linea activa
                 }
            } else if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && !nextState.webApis.every(api => api.triggered || api.type === 'listener')) {
                 // Caso: Script terminó, no hay nada en cola, pero algún timer/evento aún no ocurrió
                 nextState.statusMessage = `Esperando tareas asíncronas pendientes...`;
                 nextState.currentJsLine = -1;
            } else {
                 // Podría ser un estado final si no detectamos isFinished correctamente antes
                 nextState.isFinished = true;
                 nextState.statusMessage = "Simulación completada.";
                 nextState.currentJsLine = -1;
            }
         }

        return nextState;
    }

    function stepForward() {
        if (historyIndex < history.length - 1) {
            // Simplemente avanzar en el historial existente
            historyIndex++;
        } else {
            // Calcular el siguiente estado si no estamos al final
            const nextState = calculateNextState();
            if (nextState) {
                history.push(nextState); // Añadir el nuevo estado al historial
                historyIndex++; // Mover el índice al nuevo estado
            }
            // Si calculateNextState devuelve null, es porque ya terminó o hubo error
        }
        render();
    }

    function stepBackward() {
        if (historyIndex > 0) {
            historyIndex--;
            render();
        }
    }

     function handleInteraction() {
        if (history[historyIndex].scenarioName !== 'event' || history[historyIndex].isFinished) return;

        const currentState = history[historyIndex];
        const listenerApi = currentState.webApis.find(api => api.type === 'listener' && !api.triggered);

        if (listenerApi) {
             // Crear un NUEVO estado basado en el actual, pero con el evento disparado
            let nextState = deepCopy(currentState);

            // Encontrar la misma API en el nuevo estado y modificarla
             const apiInNextState = nextState.webApis.find(api => api.id === listenerApi.id);
             if(apiInNextState){
                apiInNextState.triggered = true;
                 // Añadir a la cola SOLO si no estaba ya por alguna razón
                if (!nextState.callbackQueue.some(cb => cb.apiId === listenerApi.id)) {
                     nextState.callbackQueue.push({ callbackName: listenerApi.callbackName, apiId: listenerApi.id });
                     nextState.statusMessage = `INTERACCIÓN: Evento '${listenerApi.eventType}' simulado! Callback ${listenerApi.callbackName} añadido a la cola.`;
                     console.log(`INTERACCIÓN: Callback ${listenerApi.callbackName} añadido a la Callback Queue.`);
                 } else {
                     nextState.statusMessage = `INTERACCIÓN: Evento '${listenerApi.eventType}' simulado! (Callback ya estaba en cola).`;
                 }

                 // Reemplazar el resto del historial si habíamos retrocedido
                 history = history.slice(0, historyIndex + 1);
                 history.push(nextState);
                 historyIndex++;
                 render();
            } else {
                 console.error("No se encontró la API correspondiente en el estado copiado.");
            }

        } else {
            console.log("INTERACCIÓN: No hay listener activo esperando este evento en el estado actual.");
            // Opcional: Mostrar mensaje al usuario
        }
    }


    // --- Event Listeners ---
    scenarioSelect.addEventListener('change', (e) => setupScenario(e.target.value));
    nextStepButton.addEventListener('click', stepForward); // Usar stepForward
    prevStepButton.addEventListener('click', stepBackward); // Nuevo listener
    resetButton.addEventListener('click', () => setupScenario(scenarioSelect.value)); // Usar el valor actual del select
    interactionButton.addEventListener('click', handleInteraction);

    // --- Initial Load ---
    setupScenario(scenarioSelect.value);
});