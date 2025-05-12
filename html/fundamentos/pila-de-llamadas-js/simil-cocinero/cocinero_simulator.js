// cocinero_simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const cocineroImgContainer = document.querySelector('.cocinero-estado');
    const accionCocineroEl = document.getElementById('accion-cocinero');
    const callStackListEl = document.getElementById('call-stack-list');
    const recetaActualNombreEl = document.getElementById('receta-actual-nombre');
    const pasosRecetaActualEl = document.getElementById('pasos-receta-actual');
    const iniciarMenuDiaBtn = document.getElementById('iniciar-menu-dia');
    const siguientePasoBtn = document.getElementById('siguiente-paso');
    const resetSimulacionBtn = document.getElementById('reset-simulacion');
    const logCocinaEl = document.getElementById('log-cocina');

    // --- Definición de Recetas y Pasos ---
    // Cada receta es como una función.
    // Cada paso dentro de una receta es como una línea de código.
    // 'subReceta' indica una llamada a otra función (otra receta).
    const recetas = {
        "MENU DEL DIA": {
            nombreDisplay: "Menú del Día Completo", // Nombre de la función
            pasos: [ // Líneas de código dentro de la función
                { id: "menu_sopa", texto: "Llamar a 'Preparar Sopa'", subReceta: "SOPA DE VERDURAS" },
                { id: "menu_fuerte", texto: "Llamar a 'Preparar Plato Fuerte'", subReceta: "POLLO AL HORNO" },
                { id: "menu_postre", texto: "Llamar a 'Preparar Postre'", subReceta: "FLAN DE VAINILLA" },
                { id: "menu_servir", texto: "Acción: Servir Menú Completo", accion: () => logMessage("¡Menú del Día servido y listo!") }
            ]
        },
        "SOPA DE VERDURAS": {
            nombreDisplay: "Preparar Sopa de Verduras",
            pasos: [
                { id: "sopa_picar", texto: "Acción: Picar verduras (cebolla, zanahoria, apio)", accion: () => logMessage("Verduras picadas para la sopa.") },
                { id: "sopa_sofreir", texto: "Acción: Sofreír verduras", accion: () => logMessage("Verduras sofriéndose aromáticamente.") },
                { id: "sopa_caldo", texto: "Acción: Añadir caldo y cocinar", accion: () => logMessage("Sopa hirviendo a fuego lento.") },
                { id: "sopa_sazonar", texto: "Acción: Sazonar al gusto", accion: () => logMessage("Sopa sazonada perfectamente.") }
            ]
        },
        "POLLO AL HORNO": {
            nombreDisplay: "Preparar Pollo al Horno",
            pasos: [
                { id: "pollo_marinar", texto: "Acción: Marinar el pollo", accion: () => logMessage("Pollo marinándose para extra sabor.") },
                { id: "pollo_precalentar", texto: "Acción: Precalentar horno", accion: () => logMessage("Horno precalentado a 180°C.") },
                { id: "pollo_hornear", texto: "Acción: Hornear el pollo", accion: () => logMessage("Pollo dorándose en el horno.") },
                { id: "pollo_reposar", texto: "Acción: Dejar reposar el pollo", accion: () => logMessage("Pollo reposando, jugos asentándose.") }
            ]
        },
        "FLAN DE VAINILLA": {
            nombreDisplay: "Preparar Flan de Vainilla",
            pasos: [
                { id: "flan_caramelo", texto: "Acción: Hacer caramelo", accion: () => logMessage("Caramelo dorado y listo para el molde.") },
                { id: "flan_mezcla", texto: "Acción: Preparar mezcla del flan", accion: () => logMessage("Mezcla de flan suave y homogénea.") },
                { id: "flan_banomaria", texto: "Acción: Cocinar a baño María", accion: () => logMessage("Flan cocinándose lentamente a baño María.") },
                { id: "flan_enfriar", texto: "Acción: Enfriar y desmoldar", accion: () => logMessage("Flan frío, ¡listo para disfrutar!") }
            ]
        }
    };

    // --- Estado de la Simulación ---
    // callStack simula el Call Stack de JavaScript.
    // Cada objeto en callStack es un "marco de ejecución" para una receta (función).
    let callStack = []; // Array de objetos: { recetaId, pasoActualIndex, nombreDisplay }
    let simulacionIniciada = false;
    let logCounter = 1;

    // --- Funciones de Ayuda ---
    function logMessage(mensaje) {
        logCocinaEl.textContent = `[${logCounter++}] ${mensaje}\n` + logCocinaEl.textContent; // Prepend
        accionCocineroEl.textContent = mensaje;
        cocineroImgContainer.classList.add('cocinero-trabajando');
        setTimeout(() => cocineroImgContainer.classList.remove('cocinero-trabajando'), 600);
    }

    // Actualiza la visualización del Call Stack.
    // Solo muestra los nombres de las recetas (funciones) que están en la pila.
    function actualizarCallStackVisual() {
        callStackListEl.innerHTML = '';
        if (callStack.length === 0) {
            callStackListEl.innerHTML = '<li class="placeholder">Pila Vacía</li>';
            return;
        }
        callStack.forEach((comandaMarco, index) => {
            const li = document.createElement('li');
            li.textContent = `${comandaMarco.nombreDisplay}`; // Solo el nombre de la receta/función

            if (comandaMarco.recetaId === "MENU DEL DIA") { // Marco global/inicial
                li.classList.add('comanda-global');
            }
            // Opcional: Si no es la de la cima, indicar que está en espera.
            if (index < callStack.length - 1) {
                li.style.opacity = "0.7"; // Ejemplo visual de "en espera"
                li.title = "En espera, ejecutando sub-receta";
            }
            callStackListEl.appendChild(li);
        });
    }

    // Actualiza la visualización de la receta actual (la que está en la cima del Call Stack)
    // y sus pasos.
    function actualizarRecetaActualVisual() {
        if (callStack.length === 0) {
            recetaActualNombreEl.textContent = "Ninguna";
            pasosRecetaActualEl.innerHTML = '<li class="placeholder">Pila Vacía.</li>';
            return;
        }

        const comandaActual = callStack[callStack.length - 1]; // Marco de la cima
        const recetaDef = recetas[comandaActual.recetaId];

        recetaActualNombreEl.textContent = comandaActual.nombreDisplay;
        pasosRecetaActualEl.innerHTML = '';

        recetaDef.pasos.forEach((paso, index) => {
            const li = document.createElement('li');
            li.textContent = paso.texto;
            if (index < comandaActual.pasoActualIndex) {
                li.classList.add('paso-completado');
            } else if (index === comandaActual.pasoActualIndex) {
                li.classList.add('paso-en-progreso');
            }
            pasosRecetaActualEl.appendChild(li);
        });
    }

    function resetearTodo() {
        callStack = [];
        simulacionIniciada = false;
        logCounter = 1;
        logCocinaEl.textContent = "";
        accionCocineroEl.textContent = "Esperando órdenes...";
        actualizarCallStackVisual();
        actualizarRecetaActualVisual();
        iniciarMenuDiaBtn.disabled = false;
        siguientePasoBtn.disabled = true;
        cocineroImgContainer.classList.remove('cocinero-trabajando');
    }

    // --- Lógica de Simulación ---
    function iniciarSimulacion(recetaIdInicial) {
        if (simulacionIniciada) return;
        resetearTodo();

        simulacionIniciada = true;
        iniciarMenuDiaBtn.disabled = true;
        siguientePasoBtn.disabled = false;

        const recetaDef = recetas[recetaIdInicial];
        // Crear el primer marco de ejecución y añadirlo al Call Stack
        callStack.push({
            recetaId: recetaIdInicial,
            pasoActualIndex: 0, // Empezar en el primer paso de esta receta
            nombreDisplay: recetaDef.nombreDisplay
        });
        logMessage(`Cocinero recibe orden: ¡${recetaDef.nombreDisplay}!`);
        actualizarCallStackVisual();
        actualizarRecetaActualVisual();
    }

    function ejecutarSiguientePaso() {
        if (callStack.length === 0) { // Call Stack vacío, no hay nada que hacer
            logMessage("¡Todo terminado! El cocinero descansa.");
            siguientePasoBtn.disabled = true;
            iniciarMenuDiaBtn.disabled = false;
            cocineroImgContainer.classList.remove('cocinero-trabajando');
            return;
        }

        // Obtener el marco de ejecución actual (cima del Call Stack)
        let marcoActual = callStack[callStack.length - 1];
        let recetaDefActual = recetas[marcoActual.recetaId];
        let pasoConfig = recetaDefActual.pasos[marcoActual.pasoActualIndex];

        if (!pasoConfig) { // Debería ocurrir si la receta terminó y se hizo pop antes.
            console.error("Error: No se encontró configuración de paso para", marcoActual);
            // Intentar finalizar el marco actual si no hay más pasos
             if (marcoActual.pasoActualIndex >= recetaDefActual.pasos.length) {
                 callStack.pop();
                 logMessage(`¡${marcoActual.nombreDisplay} completada (forzado)!`);
                 if (callStack.length > 0) {
                     callStack[callStack.length - 1].pasoActualIndex++;
                 }
                 actualizarCallStackVisual();
                 actualizarRecetaActualVisual();
                 // Re-llamar para procesar el siguiente estado o finalizar
                 if (callStack.length > 0 || simulacionIniciada) ejecutarSiguientePaso(); else resetearTodo();
             }
            return;
        }

        logMessage(`Trabajando en '${marcoActual.nombreDisplay}': ${pasoConfig.texto}`);

        // Procesar el paso actual
        if (pasoConfig.subReceta) {
            // Es una llamada a otra función (sub-receta)
            const subRecetaId = pasoConfig.subReceta;
            const subRecetaDef = recetas[subRecetaId];

            // Crear un nuevo marco de ejecución para la sub-receta y añadirlo al Call Stack
            callStack.push({
                recetaId: subRecetaId,
                pasoActualIndex: 0, // La nueva sub-receta empieza en su primer paso
                nombreDisplay: subRecetaDef.nombreDisplay
            });
            logMessage(`Nueva comanda en la pila: ¡${subRecetaDef.nombreDisplay}! (llamada desde ${marcoActual.nombreDisplay})`);
        } else if (pasoConfig.accion) {
            // Es una acción directa (como una línea de código que no llama a otra función)
            pasoConfig.accion(); // Ejecutar la acción
            marcoActual.pasoActualIndex++; // Avanzar al siguiente paso DENTRO del marco actual
        } else {
            // Si no es subReceta ni acción, es un paso simple, solo avanzar
            marcoActual.pasoActualIndex++;
        }

        // Verificar si el marco que ESTABA en la cima ha terminado
        // Es importante no usar `marcoActual` aquí directamente si se pusheó una subReceta,
        // porque `marcoActual` apuntaría a la nueva cima.
        // Necesitamos chequear el marco que *acaba* de ejecutar su paso.
        let marcoProcesado = (pasoConfig.subReceta) ? callStack[callStack.length - 2] : callStack[callStack.length - 1];

        if (marcoProcesado) { // Asegurarse que el marco existe (podría haberse popeado justo antes)
            let recetaDefProcesada = recetas[marcoProcesado.recetaId];
            if (marcoProcesado.pasoActualIndex >= recetaDefProcesada.pasos.length) {
                // El marco procesado ha completado todos sus pasos.
                // Si es el marco de la cima (no se llamó a subReceta), se popea.
                // Si no es el de la cima (se llamó a subReceta), NO se popea aquí,
                // se popeará cuando la subReceta (ahora en la cima) termine.
                if (marcoProcesado === callStack[callStack.length - 1]) {
                    callStack.pop();
                    logMessage(`¡${marcoProcesado.nombreDisplay} completada!`);

                    // Si había un marco "padre" esperando, este ahora es la cima y debe avanzar
                    // su propio índice de paso porque la sub-receta que llamó ha terminado.
                    if (callStack.length > 0) {
                        callStack[callStack.length - 1].pasoActualIndex++;
                    }
                }
            }
        }


        // Si después de todo, una sub-receta terminó y popeó, y el marco que la llamó
        // (que ahora es la cima) también terminó con ese avance.
        if (callStack.length > 0) {
            let nuevaCima = callStack[callStack.length - 1];
            let recetaNuevaCima = recetas[nuevaCima.recetaId];
            if (nuevaCima.pasoActualIndex >= recetaNuevaCima.pasos.length) {
                callStack.pop();
                logMessage(`¡${nuevaCima.nombreDisplay} completada (tras retorno de sub-receta)!`);
                 // Si había un marco "abuelo" esperando...
                if (callStack.length > 0) {
                    callStack[callStack.length - 1].pasoActualIndex++;
                     // Y si este abuelo también termina, repetir la lógica de pop.
                     // Esto se vuelve recursivo o necesita un bucle.
                     // Para este simulador simple, una verificación más es suficiente.
                     let abuelo = callStack[callStack.length - 1];
                     let recetaAbuelo = recetas[abuelo.recetaId];
                     if (abuelo.pasoActualIndex >= recetaAbuelo.pasos.length) {
                         callStack.pop();
                         logMessage(`¡${abuelo.nombreDisplay} completada (tras retorno de sub-sub-receta)!`);
                     }
                }
            }
        }


        actualizarCallStackVisual();
        actualizarRecetaActualVisual();

        // Si el stack se vació después de toda la lógica
        if (callStack.length === 0 && simulacionIniciada) {
            logMessage("¡Todas las órdenes completadas! El cocinero puede descansar.");
            siguientePasoBtn.disabled = true;
            iniciarMenuDiaBtn.disabled = false;
            cocineroImgContainer.classList.remove('cocinero-trabajando');
        }
    }

    // --- Event Listeners ---
    iniciarMenuDiaBtn.addEventListener('click', () => iniciarSimulacion("MENU DEL DIA"));
    siguientePasoBtn.addEventListener('click', ejecutarSiguientePaso);
    resetSimulacionBtn.addEventListener('click', resetearTodo);

    // --- Estado Inicial ---
    resetearTodo();
});