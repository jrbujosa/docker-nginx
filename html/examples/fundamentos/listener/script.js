document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    // Intentar obtener todos los elementos cruciales primero.
    const registerBtn = document.getElementById('registerBtn');
    const resetBtn = document.getElementById('resetBtn');
    const interactiveButton = document.getElementById('miBoton');
    const messageParagraph = document.getElementById('mensaje');
    const codeDisplay = document.getElementById('listener-code');
    const codeHighlight = document.getElementById('code-highlight');
    const logOutput = document.getElementById('event-log');
    const infoButton = document.getElementById('infoBtn'); // Nuevo
    const infoSection = document.getElementById('listenerInfoSection'); // Nuevo

    // *** Verificación Crítica ***
    // Si alguno de los elementos esenciales para la UI principal no existe, detenemos y avisamos.
    if (!registerBtn || !resetBtn || !interactiveButton || !messageParagraph || !codeDisplay || !codeHighlight || !logOutput) {
        console.error("Error Crítico: No se encontraron uno o más elementos esenciales del simulador en el DOM. Revisa el HTML.");
        // Podrías mostrar un mensaje al usuario aquí también.
        // Intentamos deshabilitar botones para indicar el problema
        if(registerBtn) registerBtn.disabled = true;
        if(resetBtn) resetBtn.disabled = true;
        if(infoButton) infoButton.disabled = true;
        return; // Detiene la ejecución del resto del script si falta algo esencial.
    }

    // Obtener codePanelPre de forma segura sólo si codeDisplay existe
    const codePanelPre = codeDisplay ? codeDisplay.parentElement : null;
    if (!codePanelPre) {
         console.error("Error Crítico: No se encontró el elemento <pre> contenedor del código (#listener-code).");
         // Deshabilitar botones relacionados con el código si es necesario
         if(registerBtn) registerBtn.disabled = true;
         if(resetBtn) resetBtn.disabled = true;
         return;
    }


    // --- Código JS de Ejemplo (para cálculo de líneas) ---
    // Asegurarse que codeDisplay.textContent no es null antes de split
    const codeLines = codeDisplay.textContent ? codeDisplay.textContent.split('\n') : [];
    const initialLogMessage = "[Sistema] Página cargada. Esperando acciones.";
    const initialParagraphText = "Esperando evento...";

    // --- Estado de la Simulación ---
    let currentStep = 0;
    let logMessages = [initialLogMessage];
    let isListenerActive = false;

    // --- Definición de Pasos de la Simulación ---
    // (Sin cambios aquí, se asume correcta)
    const simulationSteps = [
        { highlightLine: -1, log: [], updateDOM: false, register: false, reset: true, listener: false },
        { highlightLine: 1, log: ["span|[JS Engine]| Obteniendo referencia a 'Button#miBoton'..."], updateDOM: false, register: true, reset: true, listener: false },
        { highlightLine: 2, log: ["span|[JS Engine]| Obteniendo referencia a 'Paragraph#mensaje'..."], updateDOM: false, register: true, reset: true, listener: false },
        { highlightLine: 5, log: ["span|[JS Engine]| Definiendo la función 'miListener'..."], updateDOM: false, register: true, reset: true, listener: false },
        { highlightLine: 13, log: ["span|[JS Engine]| Solicitando al Navegador registrar 'miListener' para evento 'click'..."], updateDOM: false, register: true, reset: true, listener: false },
        { highlightLine: 15, log: ["span|[Navegador]| Registrando 'miListener' en la tabla interna de listeners para 'Button#miBoton[click]'.", "span|[Sistema]| ¡Listener registrado! El botón ahora escucha clics."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: [], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Usuario]| Ha hecho clic en 'Button#miBoton'."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Navegador]| Evento físico 'click' detectado."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Navegador]| Creando objeto 'Event' (type='click', target=Button#miBoton, ...)."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Navegador]| Buscando listeners registrados para 'click' en 'Button#miBoton'... ¡Encontrado ('miListener')!"], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Navegador]| Añadiendo ejecución de 'miListener' a la cola de tareas del Event Loop."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 5, log: ["span|[JS Engine]| Procesando cola de tareas: Ejecutando 'miListener'..."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 6, log: ["span|[JS Engine]| (Consola) Ejecutando miListener..."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 7, log: ["span|[JS Engine]| (Consola) Tipo de evento: click"], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 8, log: ["span|[JS Engine]| (Consola) Elemento objetivo: BUTTON"], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 9, log: ["span|[JS Engine]| Solicitando actualizar 'textContent' de 'Paragraph#mensaje'..."], updateDOM: true, register: true, reset: false, listener: true },
        { highlightLine: 9, log: ["span|[DOM]| Propiedad 'textContent' actualizada.", "span|[Navegador]| Cambio detectado. Repintando área del párrafo."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: 10, log: ["span|[JS Engine]| (Consola) Texto del párrafo actualizado."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[JS Engine]| Fin de la ejecución de 'miListener'."], updateDOM: false, register: true, reset: false, listener: true },
        { highlightLine: -1, log: ["span|[Sistema]| Reseteando ejemplo... (Listener simuladamente eliminado)"], updateDOM: 'reset', register: false, reset: true, listener: false },
    ];
    const START_REGISTRATION = 1;
    const END_REGISTRATION = 6;
    const START_EVENT_EXECUTION = 7;
    const END_EVENT_EXECUTION = 19;
    const RESET_STEP = 20;

    // --- Funciones Auxiliares ---
    function updateLog() {
        if (!logOutput) return; // Verificación extra
        logOutput.innerHTML = logMessages.map(msg => {
            if (msg.startsWith('span|')) {
                const parts = msg.split('|');
                // Asegurarse que hay 3 partes antes de accederlas
                 if (parts.length >= 3) {
                    return `<span>${parts[1]}</span> ${parts[2]}`;
                 }
                 return msg; // Devuelve el mensaje original si el formato es incorrecto
            }
            return msg;
        }).join('\n');
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    function calculateHighlightTop(lineIndex) {
        // *** Verificaciones dentro de la función ***
        if (lineIndex < 0 || !codePanelPre || !codeDisplay) return '0';

        try {
            const preStyles = window.getComputedStyle(codePanelPre);
            const codeStyles = window.getComputedStyle(codeDisplay);
            const fontSize = parseFloat(codeStyles.fontSize) || 16; // Default size
            const lineHeightStyle = preStyles.lineHeight;
            let lineHeight;

            if (lineHeightStyle && lineHeightStyle !== 'normal') {
                lineHeight = parseFloat(lineHeightStyle);
                // Check si parseFloat devuelve NaN
                if (isNaN(lineHeight)) {
                    console.warn("Couldn't parse pre line-height, using default.");
                    lineHeight = fontSize * 1.6;
                }
            } else {
                lineHeight = fontSize * 1.6; // Default basado en font size
            }

            const paddingTop = parseFloat(preStyles.paddingTop) || 0;
            const adjustment = 1;
            return `${paddingTop + (lineIndex * lineHeight) + adjustment}px`;

        } catch (e) {
             console.error("Error calculating highlight top:", e);
             return '0'; // Retornar un valor seguro en caso de error
        }
    }

    function updateUI(event = null) {
        if (currentStep >= simulationSteps.length) {
            console.warn("Intento de ir a un paso inválido:", currentStep);
            return;
        }
        // Asegurar que los elementos necesarios para UI existen
        if (!messageParagraph || !codeHighlight || !codePanelPre || !registerBtn || !resetBtn) {
             console.error("updateUI no puede continuar: faltan elementos esenciales.");
             return;
        }

        const step = simulationSteps[currentStep];

        // 1. Resaltado de Código (con verificación de codeHighlight)
        if (step.highlightLine >= 0 && step.highlightLine < codeLines.length) {
             codeHighlight.style.top = calculateHighlightTop(step.highlightLine);
             // Asegurar que el cálculo de altura también es seguro
             try {
                  const lh = parseFloat(window.getComputedStyle(codePanelPre).lineHeight);
                  codeHighlight.style.height = isNaN(lh) ? '1.6em' : `${lh}px`; // Fallback a 'em'
             } catch (e) {
                  console.error("Error getting line-height for highlight:", e);
                  codeHighlight.style.height = '1.6em'; // Fallback seguro
             }
             codeHighlight.style.display = 'block';
        } else {
             codeHighlight.style.display = 'none';
        }

        // 2. Añadir mensajes al Log
        if (step.log && step.log.length > 0) {
            logMessages = logMessages.concat(step.log);
            updateLog(); // updateLog ya tiene verificación interna
        }

        // 3. Actualizar DOM Interactivo
        if (step.updateDOM === true) {
            // Simplificado para evitar errores con match/replace complejos
            messageParagraph.textContent = '¡Evento "click" recibido!';
        } else if (step.updateDOM === 'reset') {
            messageParagraph.textContent = initialParagraphText;
        }

        // 4. Actualizar Estado de Botones de Control
        registerBtn.disabled = step.register;
        resetBtn.disabled = step.reset;
        if (infoButton) infoButton.disabled = false; // Info siempre activo si existe

        // 5. Actualizar Estado del Listener Real
        isListenerActive = step.listener;

        // 6. Scroll del código (con verificación de codePanelPre y codeHighlight)
         if (codeHighlight.style.display === 'block' && codePanelPre) {
            try {
                const preRect = codePanelPre.getBoundingClientRect();
                const highlightRect = codeHighlight.getBoundingClientRect();
                // Verificar si getBoundingClientRect devolvió dimensiones válidas
                if (preRect.height > 0 && highlightRect.height > 0) {
                    const scrollMargin = 30;
                    if (highlightRect.top < preRect.top + scrollMargin) {
                        codePanelPre.scrollTop -= (preRect.top - highlightRect.top) + scrollMargin * 2;
                    } else if (highlightRect.bottom > preRect.bottom - scrollMargin) {
                         codePanelPre.scrollTop += (highlightRect.bottom - preRect.bottom) + scrollMargin * 2;
                    }
                }
            } catch (e) {
                 console.error("Error during code panel scroll:", e);
            }
        }
    }

    // --- Manejadores de Eventos para Controles ---
    // Se añaden sólo si los botones existen (verificación al inicio)

    registerBtn.addEventListener('click', () => {
        console.log("Register button clicked, starting simulation steps..."); // Log para depurar
        // Deshabilitar botón inmediatamente para evitar doble clic mientras se procesa
        registerBtn.disabled = true;
        let delay = 0; // Iniciar delay en 0 para el primer paso
        for (let i = START_REGISTRATION; i <= END_REGISTRATION; i++) {
             setTimeout(() => {
                console.log("Executing step:", i); // Log para depurar
                currentStep = i;
                updateUI();
                 // Volver a habilitar/deshabilitar según el último paso del bucle
                 if (i === END_REGISTRATION) {
                    // La propia updateUI() establecerá el estado correcto del botón
                 }
            }, delay);
            delay += 500; // Incrementar delay para el siguiente paso
        }
    });

    resetBtn.addEventListener('click', () => {
        currentStep = RESET_STEP;
        logMessages = [initialLogMessage];
        if (simulationSteps[currentStep].log) {
             logMessages = logMessages.concat(simulationSteps[currentStep].log);
        }
        updateLog();
        updateUI();
        currentStep = 0;
    });

    // --- LISTENER REAL en el botón interactivo ---
    // Se añade sólo si interactiveButton existe
    interactiveButton.addEventListener('click', (event) => {
        if (!isListenerActive) {
            console.log("Clic detectado en #miBoton, pero listener simulado no activo.");
            // Opcional: añadir mensaje al log simulado
            // logMessages.push("span|[Sistema]| Clic ignorado (listener no activo en simulación).");
            // updateLog();
            return;
        }

        console.log("Interactive button clicked, starting event execution steps..."); // Log
        interactiveButton.disabled = true;

        let delay = 0;
        for (let i = START_EVENT_EXECUTION; i <= END_EVENT_EXECUTION; i++) {
            setTimeout(() => {
                console.log("Executing event step:", i); // Log
                currentStep = i;
                updateUI(event);
                if (i === END_EVENT_EXECUTION) {
                    interactiveButton.disabled = false;
                    currentStep = END_REGISTRATION; // Volver al estado "listo"
                    // Asegurarse que la UI refleja el estado "listo"
                    updateUI();
                }
            }, delay);
             delay += 400;
        }
    });

    // --- FUNCIONALIDAD PARA EL NUEVO BOTÓN DE INFORMACIÓN ---
    // Se añade sólo si ambos elementos existen
    if (infoButton && infoSection) {
        infoButton.addEventListener('click', () => {
            infoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } else {
        // Aviso si falta el botón de info o la sección, pero no es crítico para el simulador principal
        if (!infoButton) console.warn("Elemento #infoBtn no encontrado.");
        if (!infoSection) console.warn("Elemento #listenerInfoSection no encontrado.");
        // Deshabilitar el botón si existe pero la sección no, o viceversa (aunque es raro)
        if(infoButton && !infoSection) infoButton.disabled = true;
    }

    // --- Inicialización ---
    console.log("DOM cargado. Inicializando UI."); // Log
    currentStep = 0;
    updateUI(); // Mostrar estado inicial (esta llamada es crucial y debe ser segura)
    console.log("UI Inicializada."); // Log

});