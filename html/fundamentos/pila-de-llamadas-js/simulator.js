document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scenarioSelect = document.getElementById('scenario-select');
    const prevStepButton = document.getElementById('prev-step-button');
    const nextStepButton = document.getElementById('next-step-button');
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
    let history = [];
    let historyIndex = -1;

    // --- Scenarios Data ---
    const scenarios = {
        sync: {
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
        timeout: {
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
             callbackCode: {
                 'tareaTimer': [
                     { line: 1, action: 'log', value: '¡Timer finalizado!' },
                     { line: 2, action: 'return', stackPop: true }
                 ]
             }
         },
        event: {
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
                { line: 1, action: 'assignment' },
                { line: 5, action: 'log', value: 'Añadiendo listener' },
                { line: 6, action: 'api', apiName: 'addEventListener', eventType: 'click', callbackName: 'manejadorClick' },
                { line: 7, action: 'log', value: 'Listener añadido y esperando...' },
                { line: 8, action: 'wait_api', apiName: 'addEventListener' },
                { line: -1, action: 'check_queue' },
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
        try {
             return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error("Error during deep copy:", e);
            return null;
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
            currentStepIndex: 0,
            callStack: [],
            webApis: [], // { id, name, type, callbackName, endTime?, triggered?, eventType?, processedToQueue? }
            callbackQueue: [],
            consoleOutput: [],
            currentJsLine: -1,
            waitingForApi: null,
            simulationTime: 0,
            nextApiId: 0,
            executingCallback: false,
            callbackStepIndex: 0,
            statusMessage: "Listo para iniciar.",
            isFinished: false
        };

        history = [initialState];
        historyIndex = 0;

        htmlCodeEl.textContent = initialState.html;
        jsCodeEl.innerHTML = initialState.jsLines.map((line, index) => `<span data-line="${index}">${line}</span>`).join('\n');
        interactionButton.style.display = scenarioName === 'event' ? 'inline-block' : 'none';

        render();
    }

    function render() {
        if (historyIndex < 0 || historyIndex >= history.length) {
            console.error("Índice de historial inválido:", historyIndex);
            return;
        }
        const state = history[historyIndex];

        document.querySelectorAll('#js-code span').forEach(span => {
            span.classList.remove('highlight');
            if (parseInt(span.dataset.line) === state.currentJsLine) {
                span.classList.add('highlight');
            }
        });

        callStackList.innerHTML = state.callStack.map(frame =>
             `<li class="${frame === '(global)' ? 'global' : ''}">${frame}</li>`
        ).join('');

        webApisList.innerHTML = state.webApis.map(api => {
            let text = '';
            if (api.type === 'timer') {
                const remaining = Math.max(0, api.endTime - state.simulationTime);
                let statusText = '';
                if (remaining > 0) {
                    statusText = `(${remaining}ms restantes)`;
                } else { // Tiempo cumplido
                    const isInCallStack = state.callStack.includes(api.callbackName) && state.executingCallback && state.callStack[state.callStack.length -1] === api.callbackName;
                    const isInQueue = state.callbackQueue.some(cb => cb.apiId === api.id);

                    if (isInCallStack) {
                        statusText = '(Callback Ejecutando)';
                    } else if (isInQueue) {
                        statusText = '(Callback en Cola)';
                    } else if (api.processedToQueue) { // Ya fue a la cola y salió (ejecutado/terminado)
                        statusText = '(Callback Procesado/Ejecutado)';
                    } else { // Tiempo cumplido, pero aún no movido a la cola
                        statusText = '(Completado, listo para mover a Cola)';
                    }
                }
                text = `Timer: ${api.callbackName}() - ${statusText}`;

            } else if (api.type === 'listener') {
                let statusText = '';
                 const isInCallStack = state.callStack.includes(api.callbackName) && state.executingCallback && state.callStack[state.callStack.length -1] === api.callbackName;
                 const isInQueue = state.callbackQueue.some(cb => cb.apiId === api.id);

                if (isInCallStack) {
                    statusText = '(Callback Ejecutando)';
                } else if (isInQueue) {
                    statusText = '(Callback en Cola)';
                } else if (api.triggered) { // Evento ocurrió y fue procesado (a la cola y quizás ya ejecutado)
                    statusText = '(Evento Ocurrido, Callback Procesado)';
                } else {
                    statusText = '(Esperando Evento...)';
                }
                text = `Listener: ${api.eventType} -> ${api.callbackName}() - ${statusText}`;
            }
            return `<div data-api-id="${api.id}">${text}</div>`;
        }).join('');

        callbackQueueList.innerHTML = state.callbackQueue.map(cb =>
            `<li>${cb.callbackName}</li>`
        ).join('');

        consoleOutputEl.textContent = state.consoleOutput.join('\n');
        consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;

        eventLoopArrow.classList.remove('active');
        if (state.eventLoopActive) {
             eventLoopArrow.classList.add('active');
        }

        prevStepButton.disabled = historyIndex <= 0;
        nextStepButton.disabled = state.isFinished;
    }

    function calculateNextState() {
        if (historyIndex < 0) return null;
        const currentState = history[historyIndex];

        if (currentState.isFinished) {
            console.log("La simulación ya ha terminado.");
            return null;
        }

        let nextState = deepCopy(currentState);
        nextState.statusMessage = "";
        nextState.eventLoopActive = false;
        nextState.currentJsLine = currentState.executingCallback ? currentState.currentJsLine : -1; // Mantener línea si es callback, sino limpiar

        // --- Fase 1: Mover Timers Completados a la Callback Queue (Acción del "Sistema") ---
        // Esto tiene prioridad si las condiciones se cumplen.
        if (!nextState.executingCallback) { // No interrumpir callbacks en ejecución con esta lógica
            for (const api of nextState.webApis) {
                if (api.type === 'timer' &&
                    api.endTime <= nextState.simulationTime &&
                    !api.processedToQueue && // Aún no ha sido movido a la cola
                    !nextState.callbackQueue.some(cb => cb.apiId === api.id) // Doble check por si acaso
                ) {
                    api.processedToQueue = true;
                    nextState.callbackQueue.push({ callbackName: api.callbackName, apiId: api.id });
                    nextState.statusMessage = `Sistema: Timer '${api.callbackName}' completado. Callback añadido a la Callback Queue.`;
                    nextState.currentJsLine = -1; // Acción del sistema, no de una línea JS
                    // Limpiar waitingForApi si este timer era el esperado
                     if (nextState.waitingForApi === 'setTimeout' && currentState.steps[currentState.currentStepIndex-1]?.action === 'wait_api') {
                         nextState.waitingForApi = null;
                     }
                    console.log(`Sistema: Timer ${api.callbackName} callback añadido a la cola.`);
                    return nextState; // Este es el único cambio para este paso.
                }
            }
        }

        // --- Fase 2: Lógica del Event Loop (Mover de Cola a Pila si Pila vacía) ---
        // Solo si no se movió nada a la cola en Fase 1 Y la pila está vacía Y no se está ejecutando un callback.
        if (nextState.callStack.length === 0 && !nextState.executingCallback) {
            if (nextState.callbackQueue.length > 0) {
                const callbackInfo = nextState.callbackQueue.shift();
                nextState.callStack.push(callbackInfo.callbackName);
                nextState.executingCallback = true;
                nextState.callbackStepIndex = 0;
                const firstCallbackStep = nextState.callbackCode[callbackInfo.callbackName]?.[0];
                nextState.currentJsLine = firstCallbackStep ? firstCallbackStep.line : -1;
                nextState.statusMessage = `Event Loop: Moviendo ${callbackInfo.callbackName} de Cola a Pila.`;
                nextState.eventLoopActive = true;
                console.log(`Event Loop: Moviendo ${callbackInfo.callbackName} de la Cola a la Pila.`);
                // Limpiar waitingForApi si el event loop actuó.
                nextState.waitingForApi = null;
                return nextState; // El Event Loop actuó, este es el paso.
            }
        }

        // --- Fase 3: Ejecución del Siguiente Paso del Script o Callback ---
        // Solo si Fase 1 (timer a cola) y Fase 2 (cola a pila) no hicieron nada.
        let currentStepConfig;
        let isCallbackStep = nextState.executingCallback;

        if (isCallbackStep) {
            const callbackName = nextState.callStack[nextState.callStack.length - 1];
            const callbackSteps = nextState.callbackCode[callbackName];
            if (!callbackSteps || nextState.callbackStepIndex >= callbackSteps.length) {
                if (nextState.callStack[nextState.callStack.length - 1] === callbackName) {
                   nextState.callStack.pop();
                }
                nextState.executingCallback = false;
                nextState.currentJsLine = -1;
                nextState.statusMessage += ` Callback ${callbackName} finalizado.`;
                console.log(`Callback ${callbackName} finalizado.`);
                // Verificamos si todo acabó después de finalizar un callback
                if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => api.processedToQueue || api.triggered || api.type === 'listener' && api.triggered )) { // Ajuste aquí para 'listener'
                    nextState.isFinished = true;
                    nextState.statusMessage += " Simulación completada.";
                }
                return nextState; // Acción de finalizar callback.
            } else {
                currentStepConfig = callbackSteps[nextState.callbackStepIndex];
                nextState.callbackStepIndex++;
            }
        } else { // Ejecutando el script principal
            if (nextState.currentStepIndex >= nextState.steps.length) {
                if (nextState.callStack.length > 0 && nextState.callStack[0] === '(global)') {
                     nextState.callStack.pop();
                     nextState.statusMessage += " Fin del script global.";
                     nextState.currentJsLine = -1;
                }
                // Si no hay más APIs esperando o callbacks, terminamos
                if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => (api.type === 'timer' && api.processedToQueue) || (api.type === 'listener' && api.triggered) )) {
                     nextState.isFinished = true;
                     nextState.statusMessage += " Simulación completada.";
                } else if (nextState.callStack.length === 0 && !nextState.isFinished){
                     // Script síncrono terminado, pero hay trabajo asíncrono.
                     nextState.statusMessage += " Script síncrono finalizado. Esperando tareas asíncronas...";
                     nextState.currentJsLine = -1;
                }
                return nextState; // Acción de finalizar script o esperar.
            } else {
                currentStepConfig = nextState.steps[nextState.currentStepIndex];
                nextState.currentStepIndex++;
            }
        }

        // --- Procesar la acción del paso actual (si se determinó uno en Fase 3) ---
        if (currentStepConfig) {
            nextState.currentJsLine = currentStepConfig.line;
            nextState.statusMessage += ` Ejecutando línea ${currentStepConfig.line}: ${currentStepConfig.action}.`;
            console.log(`Ejecutando paso: ${currentStepConfig.action}`, currentStepConfig);

            if (currentStepConfig.stackPush) {
                 if (nextState.callStack.length === 0 && currentStepConfig.stackPush !== '(global)' && !isCallbackStep) {
                      nextState.callStack.push('(global)');
                 }
                 if (nextState.callStack.length === 0 || nextState.callStack[nextState.callStack.length - 1] !== currentStepConfig.stackPush) {
                     nextState.callStack.push(currentStepConfig.stackPush);
                 }
            }

            switch (currentStepConfig.action) {
                case 'log':
                    nextState.consoleOutput.push(currentStepConfig.value);
                    break;
                case 'call':
                    nextState.statusMessage += ` Llamando a ${currentStepConfig.functionName}.`;
                    break;
                case 'return':
                    if (currentStepConfig.stackPop && nextState.callStack.length > 0) {
                        const popped = nextState.callStack.pop();
                        nextState.statusMessage += ` Retornando de ${popped}.`;
                        console.log(`Retornando de ${popped}`);
                        if (isCallbackStep) {
                            const callbackName = popped;
                            const callbackSteps = nextState.callbackCode[callbackName];
                            if (nextState.callbackStepIndex >= callbackSteps?.length) {
                                nextState.executingCallback = false;
                                nextState.currentJsLine = -1;
                                console.log(`Callback ${callbackName} finalizado.`);
                                // Re-check for finish condition after callback return
                                if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => (api.type === 'timer' && api.processedToQueue) || (api.type === 'listener' && api.triggered))) {
                                    nextState.isFinished = true;
                                    nextState.statusMessage += " Simulación completada.";
                                }
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
                        type: currentStepConfig.apiName === 'setTimeout' ? 'timer' : 'listener'
                    };
                    if (newApi.type === 'timer') {
                        newApi.endTime = nextState.simulationTime + currentStepConfig.duration;
                        newApi.processedToQueue = false; // Nueva propiedad
                        nextState.statusMessage += ` API: Iniciando ${currentStepConfig.apiName} (${currentStepConfig.duration}ms).`;
                    } else { // listener
                        newApi.eventType = currentStepConfig.eventType;
                        newApi.triggered = false; // Para listeners, triggered significa que el evento ocurrió
                        nextState.statusMessage += ` API: Registrando ${currentStepConfig.apiName} (${currentStepConfig.eventType}).`;
                    }
                    nextState.webApis.push(newApi);
                    break;
                case 'wait_api':
                    nextState.waitingForApi = currentStepConfig.apiName;
                    nextState.statusMessage += ` Script en pausa, esperando ${currentStepConfig.apiName}...`;
                     if (currentStepConfig.apiName === 'setTimeout') {
                         const timerApi = nextState.webApis.find(api => api.type === 'timer' && !api.processedToQueue);
                         if (timerApi) {
                             nextState.simulationTime = timerApi.endTime;
                             nextState.statusMessage += ` (Tiempo simulado avanzado a ${nextState.simulationTime}ms).`;
                         }
                     }
                    if (nextState.currentStepIndex >= nextState.steps.length && nextState.callStack.length === 1 && nextState.callStack[0] === '(global)') {
                        nextState.callStack.pop();
                    }
                    break;
                 case 'check_queue':
                     nextState.statusMessage += " Fin script síncrono. Revisando cola y APIs...";
                     if (nextState.callStack.length === 1 && nextState.callStack[0] === '(global)') {
                         nextState.callStack.pop();
                     }
                     nextState.currentJsLine = -1;
                     // La siguiente llamada a calculateNextState manejará colas/APIs.
                     break;
                case 'assignment':
                case 'comment':
                    break;
                case 'end':
                     if (currentStepConfig.stackPop && nextState.callStack.length > 0 && nextState.callStack[nextState.callStack.length - 1] === '(global)') {
                         nextState.callStack.pop();
                     }
                     nextState.statusMessage += " Fin de ejecución global.";
                     nextState.currentJsLine = -1;
                     if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => (api.type === 'timer' && api.processedToQueue) || (api.type === 'listener' && api.triggered))) {
                         nextState.isFinished = true;
                         nextState.statusMessage += " Simulación completada.";
                     }
                    break;
                default:
                    console.warn(`Acción desconocida: ${currentStepConfig.action}`);
                    nextState.statusMessage += ` Acción desconocida: ${currentStepConfig.action}.`;
            }
        } else if (!nextState.isFinished) {
            // Si no hubo currentStepConfig (porque script/callback terminó) y no se hizo nada en Fase 1 o 2.
            // Y la simulación no ha terminado.
            if(nextState.waitingForApi && nextState.webApis.some(api => (api.name === nextState.waitingForApi && ((api.type === 'timer' && !api.processedToQueue) || (api.type === 'listener' && !api.triggered))))){
                 nextState.statusMessage = `Esperando evento/API: ${nextState.waitingForApi}...`;
            } else if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && !nextState.webApis.every(api => (api.type === 'timer' && api.processedToQueue) || (api.type === 'listener' && api.triggered))) {
                 nextState.statusMessage = `Esperando tareas asíncronas pendientes...`;
                 nextState.currentJsLine = -1;
            } else if (nextState.callStack.length === 0 && nextState.callbackQueue.length === 0 && nextState.webApis.every(api => (api.type === 'timer' && api.processedToQueue) || (api.type === 'listener' && api.triggered))) {
                 // Esto es una doble comprobación para isFinished
                 nextState.isFinished = true;
                 nextState.statusMessage = "Simulación completada.";
                 nextState.currentJsLine = -1;
            }
        }
        return nextState;
    }

    function stepForward() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
        } else {
            const nextState = calculateNextState();
            if (nextState) {
                history.push(nextState);
                historyIndex++;
            }
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
            let nextState = deepCopy(currentState);
            const apiInNextState = nextState.webApis.find(api => api.id === listenerApi.id);

            if(apiInNextState){
                apiInNextState.triggered = true; // Marcar que el evento ocurrió
                if (!nextState.callbackQueue.some(cb => cb.apiId === listenerApi.id)) {
                     nextState.callbackQueue.push({ callbackName: listenerApi.callbackName, apiId: listenerApi.id });
                     nextState.statusMessage = `INTERACCIÓN: Evento '${listenerApi.eventType}' simulado! Callback ${listenerApi.callbackName} añadido a la cola.`;
                     console.log(`INTERACCIÓN: Callback ${listenerApi.callbackName} añadido a la Callback Queue.`);
                } else {
                     nextState.statusMessage = `INTERACCIÓN: Evento '${listenerApi.eventType}' simulado! (Callback ya estaba en cola).`;
                }
                nextState.waitingForApi = null; // Ya no estamos esperando este evento específico
                nextState.currentJsLine = -1; // Interacción es acción del sistema/usuario

                history = history.slice(0, historyIndex + 1);
                history.push(nextState);
                historyIndex++;
                render();
            } else {
                 console.error("No se encontró la API correspondiente en el estado copiado para la interacción.");
            }
        } else {
            console.log("INTERACCIÓN: No hay listener activo esperando este evento en el estado actual.");
        }
    }

    // --- Event Listeners ---
    scenarioSelect.addEventListener('change', (e) => setupScenario(e.target.value));
    nextStepButton.addEventListener('click', stepForward);
    prevStepButton.addEventListener('click', stepBackward);
    resetButton.addEventListener('click', () => setupScenario(scenarioSelect.value));
    interactionButton.addEventListener('click', handleInteraction);

    // --- Initial Load ---
    setupScenario(scenarioSelect.value);
});