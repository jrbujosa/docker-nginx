// --- Referencias a Elementos del DOM ---
const sendGetBtn = document.getElementById('send-get-btn');
const sendPostBtn = document.getElementById('send-post-btn');
const clientActionLog = document.getElementById('client-action-log');
const clientResponseLog = document.getElementById('client-response-log');
const networkLog = document.getElementById('network-log');
const serverLog = document.getElementById('server-log');

// --- Funciones Auxiliares ---

/** Limpia los paneles de log antes de cada simulación */
function clearLogs() {
    clientActionLog.textContent = 'Logs del cliente aparecerán aquí...\n';
    clientResponseLog.textContent = 'La respuesta del servidor aparecerá aquí...\n';
    networkLog.innerHTML = '<p>Esperando interacción...</p>'; // Usar innerHTML para borrar elementos <p>
    serverLog.textContent = 'Servidor esperando peticiones...\n';
}

/** Añade un mensaje a un panel específico */
function logToPanel(panelElement, message, type = '') {
    // Limpiar mensaje inicial si es la primera entrada real
    if (panelElement === networkLog && networkLog.querySelector('p')?.textContent === 'Esperando interacción...') {
         networkLog.innerHTML = '';
    } else if (panelElement === clientActionLog && clientActionLog.textContent.startsWith('Logs del cliente')) {
         clientActionLog.textContent = '';
    } else if (panelElement === clientResponseLog && clientResponseLog.textContent.startsWith('La respuesta del servidor')) {
        clientResponseLog.textContent = '';
    }


    if (panelElement === networkLog) {
        // Para el panel de red, creamos párrafos con clases para estilo
        const p = document.createElement('p');
        // Añadir hora para más claridad
        const time = new Date().toLocaleTimeString();
        p.textContent = `[${time}] ${message}`;
        if (type) {
            p.classList.add(type);
        }
        networkLog.appendChild(p);
    } else {
        // Para otros paneles, simplemente añadimos texto con salto de línea
        // Añadir hora para más claridad
        const time = new Date().toLocaleTimeString();
        panelElement.textContent += `[${time}] ${message}\n`;
    }
    // Auto-scroll hacia abajo
    panelElement.scrollTop = panelElement.scrollHeight;
}

/** Devuelve el texto descriptivo para un código de estado HTTP (simplificado) */
function getStatusText(code) {
    switch (code) {
        case 200: return 'OK';
        case 201: return 'Created';
        case 400: return 'Bad Request';
        case 404: return 'Not Found';
        case 500: return 'Internal Server Error';
        default: return 'Unknown Status';
    }
}

// --- Lógica de Simulación Principal ---

/**
 * Simula el ciclo completo de una petición HTTP usando setTimeout para visualizar las demoras.
 * @param {string} method - Método HTTP ('GET' o 'POST').
 * @param {string} url - La URL simulada a la que se hace la petición.
 * @param {object|null} body - El cuerpo de la petición (para POST).
 */
function simulateRequest(method, url, body = null) {
    clearLogs(); // Limpiar logs anteriores
    const startTime = Date.now();

    // --- PASO 1: Acción del Cliente ---
    logToPanel(clientActionLog, `Botón '${method}' presionado.`);
    logToPanel(clientActionLog, `Iniciando petición ${method} a ${url}...`);

    // Simula la creación de la petición por JS/Navegador (pequeña demora)
    setTimeout(() => {
        const requestHeaders = {
            'Accept': 'application/json',
            ...(method === 'POST' && { 'Content-Type': 'application/json' }), // Añadir Content-Type para POST
            'User-Agent': 'SimuladorBrowser/1.0'
        };
        let requestSummary = `${method} ${url}`;
        let requestDetails = `--> ${requestSummary}\n    Cabeceras: ${JSON.stringify(requestHeaders, null, 2)}`;
        if (method === 'POST' && body) {
            requestDetails += `\n    Cuerpo: ${JSON.stringify(body)}`;
        }

        logToPanel(clientActionLog, 'Petición HTTP creada por el navegador/JS.');
        // --- PASO 2: Petición viaja por la Red (Cliente -> Servidor) ---
        logToPanel(networkLog, `Enviando Petición:\n${requestDetails}`, 'network-request');

        setTimeout(() => { // Simula latencia de red (ida)
            logToPanel(networkLog, `   (...) Petición en tránsito por la red`);

            // --- PASO 3: Servidor Recibe la Petición ---
            setTimeout(() => {
                logToPanel(serverLog, `Petición ${method} ${url} recibida.`);
                logToPanel(serverLog, `   Desde: 192.168.1.100 (IP simulada)`);
                logToPanel(serverLog, `   Cabeceras: ${JSON.stringify(requestHeaders, null, 2)}`);
                if (method === 'POST' && body) {
                    logToPanel(serverLog, `   Cuerpo recibido: ${JSON.stringify(body)}`);
                }

                // --- PASO 4: Servidor Procesa la Petición ---
                logToPanel(serverLog, '   Procesando petición...');
                setTimeout(() => { // Simula tiempo de procesamiento del servidor
                    let responseStatus = 200;
                    let responseBody = {};
                    const responseHeaders = {
                        'Content-Type': 'application/json',
                        'X-Powered-By': 'SimuladorExpress',
                        'Date': new Date().toUTCString()
                    };

                    // Lógica simulada del backend
                    if (method === 'GET' && url === '/api/datos') {
                        responseBody = { message: 'Datos obtenidos correctamente!', data: ['manzana', 'banana', 'cereza'], timestamp: Date.now() };
                        responseStatus = 200;
                        logToPanel(serverLog, '   [Lógica GET /api/datos] Datos encontrados y preparados.');
                    } else if (method === 'POST' && url === '/api/enviar') {
                        if (body && body.nombre) {
                           responseBody = { status: 'ok', message: `Datos de '${body.nombre}' recibidos y procesados con éxito.` };
                           responseStatus = 201; // Created
                           logToPanel(serverLog, `   [Lógica POST /api/enviar] Datos válidos procesados para: ${body.nombre}.`);
                        } else {
                           responseBody = { status: 'error', message: 'Cuerpo de la petición POST inválido o falta el campo "nombre".' };
                           responseStatus = 400; // Bad Request
                           logToPanel(serverLog, `   [Lógica POST /api/enviar] Error: Cuerpo de petición inválido.`);
                        }
                    } else {
                        responseBody = { error: 'Ruta no encontrada en el servidor simulado.' };
                        responseStatus = 404; // Not Found
                         logToPanel(serverLog, `   [Lógica ${method} ${url}] Error: Ruta no implementada (404).`);
                    }

                    // --- PASO 5: Servidor Envía la Respuesta ---
                    // ¡¡IMPORTANTE!! Loggear *antes* de enviarla por la red simulada
                    logToPanel(serverLog, `   Preparando respuesta: ${responseStatus} ${getStatusText(responseStatus)}`);
                    logToPanel(serverLog, `   Cuerpo de respuesta: ${JSON.stringify(responseBody)}`);
                    logToPanel(serverLog, `   Enviando respuesta al cliente...`); // Log explícito del envío

                    let responseSummary = `${responseStatus} ${getStatusText(responseStatus)}`;
                    let responseDetails = `<-- ${responseSummary}\n    Cabeceras: ${JSON.stringify(responseHeaders, null, 2)}\n    Cuerpo: ${JSON.stringify(responseBody)}`;

                    setTimeout(() => { // Pequeño retardo antes de que aparezca en la red
                         // --- PASO 6: Respuesta viaja por la Red (Servidor -> Cliente) ---
                         logToPanel(networkLog, `Recibiendo Respuesta:\n${responseDetails}`, 'network-response');

                        setTimeout(() => { // Simula latencia de red (vuelta)
                             logToPanel(networkLog, `   (...) Respuesta en tránsito por la red`);

                            // --- PASO 7: Cliente Recibe la Respuesta ---
                            setTimeout(() => {
                                logToPanel(clientActionLog, 'Respuesta HTTP recibida del servidor.');

                                // **AQUÍ SE ACTUALIZA EL PANEL DE RESPUESTA RECIBIDA**
                                logToPanel(clientResponseLog, `Estado: ${responseStatus} ${getStatusText(responseStatus)}`);
                                logToPanel(clientResponseLog, `Cabeceras:\n${JSON.stringify(responseHeaders, null, 2)}`);
                                logToPanel(clientResponseLog, `Cuerpo:\n${JSON.stringify(responseBody, null, 2)}`);

                                // --- PASO 8: Cliente Procesa la Respuesta ---
                                logToPanel(clientActionLog, 'Procesando respuesta y actualizando UI (simulado).');
                                const endTime = Date.now();
                                const duration = endTime - startTime;
                                logToPanel(clientActionLog, `--- Simulación completada en ${duration}ms ---`);

                            }, 500); // Retraso simulado recepción/procesamiento cliente

                        }, 400); // Retraso simulado red (vuelta)

                    }, 150); // Pequeño retraso servidor antes de poner en la "red"

                }, 800); // Retraso simulado de procesamiento del servidor

            }, 500); // Retraso simulado llegada petición al servidor

        }, 400); // Retraso simulado red (ida)

    }, 200); // Retraso simulado creación petición cliente
}


// --- Event Listeners para los Botones ---
sendGetBtn.addEventListener('click', () => {
    simulateRequest('GET', '/api/datos');
});

sendPostBtn.addEventListener('click', () => {
    // Simulamos un cuerpo de datos para la petición POST
    const postData = { nombre: 'Ana García', id: Date.now() % 1000 }; // Datos de ejemplo
    simulateRequest('POST', '/api/enviar', postData);
});

// Inicializar logs al cargar la página
clearLogs();