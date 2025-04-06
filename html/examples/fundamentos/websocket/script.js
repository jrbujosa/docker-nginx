document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const connectButton = document.getElementById('connect-button');
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    const clientStatus = document.getElementById('client-status');
    const receivedMessagesDiv = document.getElementById('received-messages');
    const communicationLogDiv = document.getElementById('communication-log');
    const serverLogDiv = document.getElementById('server-log');

    // Estado de la simulación
    let isConnected = false;
    let mockWebSocket = null; // Objeto para simular el WebSocket

    // --- Funciones de Logging ---
    /**
     * Añade una entrada de log a un div específico.
     * @param {HTMLElement} div El elemento div donde añadir el log.
     * @param {string} message El mensaje a mostrar.
     * @param {string} [type=''] Tipo de log (para comunicación: 'client-to-server', 'server-to-client', 'event', 'error').
     */
    function logTo(div, message, type = '') {
        const logEntry = document.createElement('div');
        const timestamp = `[${new Date().toLocaleTimeString()}]`;

        // Añadir clase de tipo si existe
        if (type) {
            logEntry.classList.add('log-comm', type);
        }

        // Para los logs de comunicación, añadir timestamp visualmente separado
        if (div === communicationLogDiv && type) {
             const timeSpan = document.createElement('span');
             timeSpan.className = 'timestamp';
             timeSpan.textContent = timestamp;
             logEntry.appendChild(timeSpan);
             // Usar createTextNode para añadir el mensaje después del span
             logEntry.appendChild(document.createTextNode(` ${message}`));
        } else {
            // Para otros logs (cliente, servidor), mantener formato simple timestamp + mensaje
            logEntry.textContent = `${timestamp} ${message}`;
        }

        div.appendChild(logEntry);
        // Auto-scroll hacia abajo para mostrar siempre el último log
        div.scrollTop = div.scrollHeight;
    }

    // Funciones de conveniencia para logs específicos
    function logClientMessage(message) {
        logTo(receivedMessagesDiv, message);
    }

    function logCommunication(message, type) {
        logTo(communicationLogDiv, message, type);
    }

    function logServer(message) {
        logTo(serverLogDiv, message);
    }

    // --- Simulación del Ciclo de Vida WebSocket ---

    function simulateWebSocket() {
        // Este objeto imita la interfaz de un WebSocket real
        // Ver: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
        const simulatedSocket = {
            // Estados posibles: 0 (CONNECTING), 1 (OPEN), 2 (CLOSING), 3 (CLOSED)
            readyState: 0, // Empieza en CONNECTING

            // --- Métodos Simulados (imitando la API real) ---
            send: function(message) {
                if (this.readyState !== 1) { // Solo enviar si está OPEN
                    const errorMsg = "ERROR: Intento de enviar mensaje con WebSocket no abierto (readyState=" + this.readyState + ")";
                    console.error("Simulación:", errorMsg);
                    logCommunication(errorMsg, "error");
                    // En una app real, esto lanzaría una excepción "InvalidStateError"
                    return;
                }
                logCommunication(`Cliente -> Servidor: ${message}`, 'client-to-server');
                // Simular latencia de red variable hacia el servidor
                const delay = 400 + Math.random() * 600; // entre 0.4s y 1.0s
                setTimeout(() => {
                    // Solo procesar en el servidor si la conexión sigue activa
                    if (isConnected && mockWebSocket === this) {
                        simulateServerReceive(message);
                    } else {
                         console.warn("Simulación: Mensaje llegó al servidor simulado, pero el cliente ya se desconectó.");
                    }
                }, delay);
            },

            close: function(code = 1000, reason = "Cierre normal") {
                if (this.readyState === 0 || this.readyState === 1) {
                    this.readyState = 2; // Pasa a CLOSING
                    logCommunication(`Cliente inicia cierre (code: ${code}, reason: "${reason}")`, "event");
                    logServer("Cliente solicitó cerrar la conexión.");
                    // Simular proceso de cierre
                    const delay = 200 + Math.random() * 300;
                    setTimeout(() => {
                        this.readyState = 3; // Pasa a CLOSED
                        logCommunication(`Conexión cerrada (onclose simulado)`, "event");
                        logServer("Conexión con el cliente cerrada.");
                        if (typeof this.onclose === 'function') {
                            // Simular el objeto CloseEvent
                            this.onclose({ code: code, reason: reason, wasClean: true });
                        }
                    }, delay);
                }
            },

            // --- Manejadores de Eventos (propiedades que el código cliente asignará) ---
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,

            // --- Métodos internos para que la simulación dispare eventos ---
            _simulateOpen: function() {
                if (this.readyState === 0) { // Solo abrir si estaba conectando
                    this.readyState = 1; // Pasa a OPEN
                    logCommunication("Conexión establecida (onopen simulado)", "event");
                    if (typeof this.onopen === 'function') {
                        this.onopen({}); // Simular el evento 'open' (no tiene datos específicos)
                    }
                }
            },

            _simulateMessageFromServer: function(message) {
                 if (this.readyState !== 1) return; // No procesar si no está OPEN
                 logCommunication(`Servidor -> Cliente: ${message}`, 'server-to-client');
                 if (typeof this.onmessage === 'function') {
                    // Simular el objeto MessageEvent
                    this.onmessage({ data: message });
                 }
            },

             _simulateError: function(errorMessage = "Error de conexión simulado") {
                logCommunication(`ERROR en WebSocket: ${errorMessage}`, "error");
                if (typeof this.onerror === 'function') {
                    this.onerror(new Error(errorMessage)); // Simular un objeto Error
                }
                 // Un error a menudo causa el cierre inmediato en la implementación real
                 if(this.readyState !== 3) { // Si no está ya cerrado
                    this.readyState = 3; // Forzar CLOSED
                    logCommunication(`Conexión cerrada debido a error (onclose simulado)`, "event");
                    logServer("Conexión con el cliente cerrada debido a error.");
                     if (typeof this.onclose === 'function') {
                         // Simular CloseEvent con código de error (e.g., 1006 Abnormal Closure)
                        this.onclose({ code: 1006, reason: errorMessage, wasClean: false });
                    }
                 }
            }
        };
        return simulatedSocket;
    }

    // --- Simulación del Comportamiento del Servidor ---

    function simulateServerReceive(message) {
        logServer(`Mensaje recibido: "${message}"`);

        // Lógica del servidor simulado:
        // 1. Podría validar el mensaje, procesarlo, interactuar con una DB (simulada)...
        // 2. En este caso, simplemente hace un eco y añade algo.
        const responseMessage = `Servidor recibió: "${message}" y responde ¡Hola!`;
        logServer(`Procesando y enviando respuesta: "${responseMessage}"`);

        // Simular latencia de red variable de vuelta al cliente
        const delay = 400 + Math.random() * 600;
        setTimeout(() => {
            // Solo enviar si la conexión mock todavía existe y está abierta
            if (mockWebSocket && mockWebSocket.readyState === 1) {
                mockWebSocket._simulateMessageFromServer(responseMessage);
            } else {
                console.warn("Simulación: Respuesta del servidor lista, pero el cliente ya no está conectado/abierto.");
            }
        }, delay);

        // Opcional: Simular un mensaje push del servidor después de un tiempo
        // setTimeout(() => {
        //     if (mockWebSocket && mockWebSocket.readyState === 1) {
        //         const pushMessage = `Mensaje push asíncrono del servidor @ ${new Date().toLocaleTimeString()}`;
        //         logServer(`Enviando mensaje push: "${pushMessage}"`);
        //         mockWebSocket._simulateMessageFromServer(pushMessage);
        //     }
        // }, 5000 + Math.random() * 5000); // Entre 5 y 10 segundos después
    }

    // --- Lógica de la Interfaz de Usuario (UI) ---

    function updateUIState() {
        if (isConnected) {
            clientStatus.textContent = 'Conectado';
            clientStatus.className = 'status connected';
            connectButton.textContent = 'Desconectar';
            connectButton.classList.add('connected');
            messageInput.disabled = false;
            sendButton.disabled = false;
            connectButton.disabled = false; // Asegurarse que esté habilitado para desconectar
        } else {
            const isConnecting = mockWebSocket && mockWebSocket.readyState === 0;
            const isClosing = mockWebSocket && mockWebSocket.readyState === 2;

            if (isConnecting) {
                clientStatus.textContent = 'Conectando...';
                clientStatus.className = 'status connecting';
                connectButton.disabled = true; // Deshabilitado mientras conecta
                messageInput.disabled = true;
                sendButton.disabled = true;
            } else if (isClosing) {
                 clientStatus.textContent = 'Desconectando...';
                 clientStatus.className = 'status connecting'; // Podríamos usar otro estilo si quisiéramos
                 connectButton.disabled = true; // Deshabilitado mientras cierra
                 messageInput.disabled = true;
                 sendButton.disabled = true;
            } else { // Desconectado (readyState 3 o null)
                clientStatus.textContent = 'Desconectado';
                clientStatus.className = 'status disconnected';
                connectButton.textContent = 'Conectar';
                connectButton.classList.remove('connected');
                messageInput.disabled = true;
                messageInput.value = ''; // Limpiar input al desconectar
                sendButton.disabled = true;
                connectButton.disabled = false; // Habilitado para conectar
            }
        }
    }

    // Manejador del Botón Conectar/Desconectar
    connectButton.addEventListener('click', () => {
        if (!isConnected && !mockWebSocket) { // Solo conectar si no está conectado Y no hay un socket simulado activo
            // --- Iniciar Conexión ---
            logCommunication("Cliente inicia conexión...", "event");
            logServer("Intentando aceptar conexión de cliente...");

            // Crear la instancia simulada del WebSocket
            mockWebSocket = simulateWebSocket();
            updateUIState(); // Poner estado visual en "Conectando..."

            // Asignar los manejadores de eventos (simulando el código del cliente real)
            mockWebSocket.onopen = () => {
                isConnected = true;
                logClientMessage("¡Conexión establecida con el servidor simulado!");
                updateUIState(); // Actualizar UI a estado "Conectado"
            };

            mockWebSocket.onmessage = (event) => {
                // event.data contiene el mensaje recibido
                logClientMessage(`Recibido: ${event.data}`);
            };

            mockWebSocket.onclose = (event) => {
                 // event contiene { code, reason, wasClean }
                 isConnected = false;
                 const cleanMsg = event.wasClean ? "limpiamente" : "abruptamente";
                 const reasonMsg = event.reason ? ` (Razón: ${event.reason})` : '';
                 logClientMessage(`Conexión cerrada ${cleanMsg}. Código: ${event.code}${reasonMsg}`);
                 mockWebSocket = null; // Limpiar la referencia al socket simulado
                 updateUIState(); // Actualizar UI a estado "Desconectado"
            };

             mockWebSocket.onerror = (error) => {
                 // error es un objeto Error simulado
                 console.error("Simulación Error WebSocket:", error);
                 logClientMessage(`Error en WebSocket: ${error.message || 'Error desconocido'}`);
                 // El error ya forza el cierre en _simulateError, aquí solo logueamos en el cliente.
                 // El onclose se llamará después de esto.
             };

            // Simular la latencia de red para el handshake/apertura
            const handshakeDelay = 800 + Math.random() * 1200; // entre 0.8s y 2.0s
            setTimeout(() => {
                 // Comprobar si el mockWebSocket todavía existe (el usuario podría haber cancelado?)
                 // y si todavía está en estado CONNECTING (0)
                 if (mockWebSocket && mockWebSocket.readyState === 0) {
                     // Simular éxito del handshake
                     logCommunication("Handshake simulado completado.", "event");
                     logServer("Cliente conectado exitosamente.");
                     mockWebSocket._simulateOpen(); // Disparar el evento onopen simulado
                 } else if (mockWebSocket && mockWebSocket.readyState !== 0) {
                    console.warn("Simulación: Handshake completado, pero el estado ya no es CONNECTING.");
                 } else {
                    console.warn("Simulación: Handshake completado, pero el socket ya no existe.");
                 }
            }, handshakeDelay);

             // Opcional: Simular un fallo de conexión aleatorio
             /*
             if (Math.random() < 0.1) { // 10% de probabilidad de fallo
                 setTimeout(() => {
                     if (mockWebSocket && mockWebSocket.readyState === 0) {
                        logServer("Fallo al aceptar conexión del cliente.");
                        mockWebSocket._simulateError("No se pudo establecer la conexión (simulado)");
                     }
                 }, 500 + Math.random() * 500); // Fallo rápido
             }
             */

        } else if (isConnected && mockWebSocket) {
            // --- Iniciar Desconexión ---
            if (mockWebSocket.readyState === 1) { // Solo cerrar si está OPEN
                 mockWebSocket.close(1000, "Usuario solicitó desconexión");
                 updateUIState(); // Poner estado visual en "Desconectando..."
            } else {
                console.warn("Simulación: Se intentó desconectar, pero el estado no era OPEN.");
            }
        } else {
            console.warn("Simulación: Click en botón Conectar/Desconectar en estado inesperado:", {isConnected, mockWebSocket});
        }
    });

    // Manejador para el botón Enviar y la tecla Enter
    function handleSend() {
        const message = messageInput.value.trim();
        if (message && isConnected && mockWebSocket) {
            mockWebSocket.send(message);
            messageInput.value = ''; // Limpiar input después de enviar
            messageInput.focus(); // Devolver foco al input para escribir rápido otro mensaje
        } else if (!message) {
            // No hacer nada si el mensaje está vacío
        } else if (!isConnected) {
             logCommunication("ERROR: Intento de enviar mensaje sin conexión activa", "error");
             logClientMessage("No se puede enviar: No estás conectado.");
        }
    }

    // Event listener para el botón "Enviar"
    sendButton.addEventListener('click', handleSend);

    // Event listener para la tecla Enter en el área de texto
    messageInput.addEventListener('keypress', (e) => {
        // Enviar si se presiona Enter pero NO si se presiona Shift+Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevenir el salto de línea por defecto de Enter
            handleSend();
        }
    });

    // --- Inicialización al cargar la página ---
    updateUIState(); // Establecer el estado inicial de la UI
    logCommunication("Simulador listo. Presiona 'Conectar' para iniciar.", "event");
    logServer("Servidor simulado iniciado y esperando conexiones...");

}); // Fin del DOMContentLoaded listener