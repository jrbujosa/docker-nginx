document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const sendButton = document.getElementById('send-button');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');

    const messageInput = document.getElementById('message-input');
    const clientStatusSpan = document.getElementById('client-status');
    const receivedMessagesDiv = document.getElementById('received-messages');
    const communicationLogDiv = document.getElementById('communication-log');
    const serverLogDiv = document.getElementById('server-log');

    // Estado de la Simulación
    let simulationSteps = [];
    let currentStepIndex = -1;
    let simInProgressType = null; // 'connect', 'send', 'disconnect', null

    // El mockWebSocket ahora es una variable global para persistir entre secuencias de 'send'
    let mockWebSocket = null;
    let clientIsConnected = false; // Estado real de la conexión del cliente

    // --- Funciones de Logging ---
    function clearLogs(clearReceived = true) {
        if (clearReceived) receivedMessagesDiv.innerHTML = '';
        communicationLogDiv.innerHTML = '';
        serverLogDiv.innerHTML = '';
    }

    function logTo(div, message, type = '') {
        const logEntry = document.createElement('div');
        const timestamp = `[${new Date().toLocaleTimeString()}]`;
        if (type) logEntry.classList.add('log-comm', type);

        if (div === communicationLogDiv && type) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            timeSpan.textContent = timestamp;
            logEntry.appendChild(timeSpan);
            logEntry.appendChild(document.createTextNode(` ${message}`));
        } else {
            logEntry.textContent = `${timestamp} ${message}`;
        }
        div.appendChild(logEntry);
        div.scrollTop = div.scrollHeight;
    }
    // --- Fin Funciones de Logging ---

    // --- Mock WebSocket Object ---
    // Este objeto es simplificado. Sus métodos onopen, onmessage, etc.,
    // serán llamados directamente por los pasos de la simulación.
    function createMockWebSocket() {
        return {
            readyState: 0, // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
            _internalSendBuffer: [], // Para simular el envío
            _internalReceiveBuffer: [], // Para simular la recepción

            // Callbacks que el código "cliente" asignaría
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,

            // Método para que la simulación dispare onopen
            _triggerOpen: function() {
                if (this.readyState === 0) {
                    this.readyState = 1;
                    if (typeof this.onopen === 'function') this.onopen({});
                }
            },
            // Método para que la simulación dispare onmessage
            _triggerMessage: function(data) {
                if (this.readyState === 1) {
                    if (typeof this.onmessage === 'function') this.onmessage({ data });
                }
            },
            // Método para que la simulación dispare onclose
            _triggerClose: function(code = 1000, reason = "Cierre normal", wasClean = true) {
                if (this.readyState === 1 || this.readyState === 2) { // Can close if OPEN or CLOSING
                    this.readyState = 3;
                    if (typeof this.onclose === 'function') this.onclose({ code, reason, wasClean });
                } else if (this.readyState === 0) { // If was connecting and fails
                    this.readyState = 3;
                     if (typeof this.onclose === 'function') this.onclose({ code: code || 1006, reason: reason || "Conexión fallida", wasClean: false });
                }
            },
             // Método para que la simulación dispare onerror (y luego onclose)
            _triggerError: function(errorMessage = "Error simulado") {
                if (typeof this.onerror === 'function') this.onerror(new Error(errorMessage));
                // Un error usualmente lleva a un cierre
                if (this.readyState !== 3) {
                    this._triggerClose(1006, errorMessage, false); // 1006: Abnormal Closure
                }
            }
        };
    }
    // --- Fin Mock WebSocket Object ---

    // --- UI State Management ---
    function updateUIState() {
        const isConnecting = mockWebSocket && mockWebSocket.readyState === 0;
        const isClosing = mockWebSocket && mockWebSocket.readyState === 2;

        if (clientIsConnected && mockWebSocket && mockWebSocket.readyState === 1) {
            clientStatusSpan.textContent = 'Conectado';
            clientStatusSpan.className = 'status connected';
        } else if (isConnecting) {
            clientStatusSpan.textContent = 'Conectando...';
            clientStatusSpan.className = 'status connecting';
        } else if (isClosing) {
            clientStatusSpan.textContent = 'Desconectando...';
            clientStatusSpan.className = 'status closing';
        } else {
            clientStatusSpan.textContent = 'Desconectado';
            clientStatusSpan.className = 'status disconnected';
        }

        connectButton.disabled = clientIsConnected || isConnecting || isClosing || simInProgressType === 'connect';
        disconnectButton.disabled = !clientIsConnected || isClosing || isConnecting || simInProgressType === 'disconnect';
        messageInput.disabled = !clientIsConnected || isConnecting || isClosing;
        sendButton.disabled = !clientIsConnected || isConnecting || isClosing || simInProgressType === 'send';

        prevStepBtn.disabled = !simInProgressType || currentStepIndex <= 0;
        nextStepBtn.disabled = !simInProgressType || currentStepIndex >= simulationSteps.length - 1;

        if (!clientIsConnected && !isConnecting && !isClosing) {
            messageInput.value = '';
        }
    }
    // --- Fin UI State Management ---


    // --- Definición y Ejecución de Pasos ---
    function defineAndStartSimulation(actionType, params = {}) {
        clearLogs(actionType === 'connect'); // No borrar mensajes recibidos si solo enviamos/desconectamos
        currentStepIndex = -1;
        simulationSteps = [];
        simInProgressType = actionType;

        // Crear mockWebSocket si estamos conectando o si no existe
        if (actionType === 'connect' || !mockWebSocket) {
            mockWebSocket = createMockWebSocket();
            clientIsConnected = false; // Asegurar que el estado del cliente se reinicie

            // Asignar callbacks básicos al mockWebSocket (simulando el código cliente)
            mockWebSocket.onopen = () => {
                clientIsConnected = true; // Actualizar estado real del cliente
                logTo(receivedMessagesDiv, "¡Conexión establecida!");
                updateUIState();
            };
            mockWebSocket.onmessage = (event) => {
                logTo(receivedMessagesDiv, `S: ${event.data}`);
                updateUIState();
            };
            mockWebSocket.onclose = (event) => {
                clientIsConnected = false; // Actualizar estado real del cliente
                logTo(receivedMessagesDiv, `Conexión cerrada. Código: ${event.code}, Razón: ${event.reason || 'N/A'}, Limpio: ${event.wasClean}`);
                // mockWebSocket = null; // Podríamos anularlo aquí, o reusarlo si se intenta conectar de nuevo
                updateUIState();
            };
            mockWebSocket.onerror = (error) => {
                logTo(receivedMessagesDiv, `ERROR: ${error.message}`);
                // onclose se llamará después por _triggerError
                updateUIState();
            };
        }


        // Definir pasos según la acción
        if (actionType === 'connect') {
            simulationSteps.push(
                () => { logTo(communicationLogDiv, "Cliente: Intentando conectar...", "client-init"); mockWebSocket.readyState = 0; updateUIState(); },
                () => { logTo(serverLogDiv, "Servidor: Petición de conexión recibida (Handshake HTTP Upgrade simulado)."); },
                () => { logTo(serverLogDiv, "Servidor: Handshake aceptado. Cambiando a protocolo WebSocket."); },
                () => { logTo(communicationLogDiv, "Red: Conexión establecida (onopen será disparado).", "event"); mockWebSocket._triggerOpen(); },
                () => { logTo(communicationLogDiv, "Simulación de conexión completada.", "event"); simInProgressType = null; updateUIState(); }
            );
        } else if (actionType === 'send' && clientIsConnected && mockWebSocket.readyState === 1) {
            const msgToSend = params.message || "Mensaje vacío";
            simulationSteps.push(
                () => { logTo(communicationLogDiv, `Cliente -> Servidor: ${msgToSend}`, "client-to-server"); },
                () => { logTo(serverLogDiv, `Servidor: Mensaje recibido: "${msgToSend}"`); },
                () => {
                    const serverResponse = `Eco: "${msgToSend}"`;
                    logTo(serverLogDiv, `Servidor: Enviando respuesta: "${serverResponse}"`);
                    logTo(communicationLogDiv, `Servidor -> Cliente: ${serverResponse}`, "server-to-client");
                    mockWebSocket._triggerMessage(serverResponse);
                },
                () => { logTo(communicationLogDiv, "Simulación de envío/recepción completada.", "event"); simInProgressType = null; updateUIState(); }
            );
        } else if (actionType === 'disconnect' && clientIsConnected && (mockWebSocket.readyState === 1 || mockWebSocket.readyState === 0 )) {
             // Permitir desconectar incluso si está en "connecting" (simula cancelar conexión)
            simulationSteps.push(
                () => { logTo(communicationLogDiv, "Cliente: Iniciando desconexión...", "client-init"); mockWebSocket.readyState = 2; updateUIState(); },
                () => { logTo(serverLogDiv, "Servidor: Solicitud de cierre recibida del cliente."); },
                () => { logTo(serverLogDiv, "Servidor: Confirmando cierre de conexión."); },
                () => { logTo(communicationLogDiv, "Red: Conexión cerrada (onclose será disparado).", "event"); mockWebSocket._triggerClose(1000, "Cierre iniciado por cliente");},
                () => { logTo(communicationLogDiv, "Simulación de desconexión completada.", "event"); simInProgressType = null; updateUIState(); }
            );
        } else {
            logTo(communicationLogDiv, `Acción '${actionType}' no válida o estado incorrecto.`, "error");
            simInProgressType = null;
            updateUIState();
            return;
        }

        nextStep(); // Ejecutar el primer paso
    }

    function executeStep(index) {
        if (index >= 0 && index < simulationSteps.length) {
            simulationSteps[index]();
        }
    }

    function nextStep() {
        if (currentStepIndex < simulationSteps.length - 1) {
            currentStepIndex++;
            executeStep(currentStepIndex);
        }
        updateUIState();
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            // Para retroceder, limpiamos logs y re-ejecutamos hasta el paso actual
            // El estado del mockWebSocket y clientIsConnected es manejado por los pasos
            // Por lo tanto, debemos "resetearlos" al estado inicial antes de la secuencia actual si es necesario.
            // Esta parte es compleja. Por simplicidad, vamos a reconstruir desde el inicio de la secuencia actual.

            // Si retrocedemos al inicio de una secuencia 'connect', reiniciamos el mockWebSocket y clientIsConnected
            if (simInProgressType === 'connect' && currentStepIndex < 1) { // Muy al inicio de la conexión
                 mockWebSocket = createMockWebSocket(); // Re-crear para asegurar estado inicial
                 clientIsConnected = false;
                 // Re-asignar callbacks
                 mockWebSocket.onopen = () => { clientIsConnected = true; logTo(receivedMessagesDiv, "¡Conexión establecida!"); updateUIState(); };
                 mockWebSocket.onmessage = (event) => { logTo(receivedMessagesDiv, `S: ${event.data}`); updateUIState(); };
                 mockWebSocket.onclose = (event) => { clientIsConnected = false; logTo(receivedMessagesDiv, `Conexión cerrada. Código: ${event.code}, Razón: ${event.reason || 'N/A'}, Limpio: ${event.wasClean}`); updateUIState(); };
                 mockWebSocket.onerror = (error) => { logTo(receivedMessagesDiv, `ERROR: ${error.message}`); updateUIState(); };
            }
            // Para 'send' o 'disconnect', el mockWebSocket y clientIsConnected deben mantener su estado previo a esta secuencia
            // La re-ejecución de los pasos debe ser suficiente si los pasos son idempotentes respecto al log y actualizan estado correctamente.

            clearLogs(simInProgressType === 'connect' && currentStepIndex < 1); // Solo borrar todo si se retrocede mucho en 'connect'

            // Re-ejecutar pasos hasta el actual
            for (let i = 0; i <= currentStepIndex; i++) {
                // Necesitamos evitar que los pasos que disparan callbacks (onopen, onmessage, onclose)
                // se ejecuten múltiples veces si el log de `receivedMessagesDiv` no se limpia.
                // Esto es un desafío con el `prevStep` si no se limpian todos los logs.
                // Para este simulador, aceptaremos que el log de `receivedMessagesDiv` pueda tener duplicados
                // al usar `prevStep` a menos que se limpie por completo.
                // Alternativamente, los pasos que disparan callbacks podrían verificar si ya lo hicieron para este índice.
                executeStep(i);
            }
        }
        updateUIState();
    }
    // --- Fin Definición y Ejecución de Pasos ---


    // --- Event Listeners ---
    connectButton.addEventListener('click', () => {
        if (!clientIsConnected && (!mockWebSocket || mockWebSocket.readyState === 3 || mockWebSocket.readyState === 0)) {
            defineAndStartSimulation('connect');
        }
    });

    disconnectButton.addEventListener('click', () => {
        if (clientIsConnected || (mockWebSocket && mockWebSocket.readyState === 0) ) { // Permitir desconectar si está conectando
            defineAndStartSimulation('disconnect');
        }
    });

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message && clientIsConnected && mockWebSocket && mockWebSocket.readyState === 1) {
            defineAndStartSimulation('send', { message });
            messageInput.value = '';
            messageInput.focus();
        } else if (!message) {
            // No hacer nada
        } else {
            logTo(receivedMessagesDiv, "No se puede enviar: no conectado o mensaje vacío.");
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click(); // Simular clic en el botón de enviar
        }
    });

    nextStepBtn.addEventListener('click', nextStep);
    prevStepBtn.addEventListener('click', prevStep);

    // --- Inicialización ---
    clearLogs();
    logTo(communicationLogDiv, "Simulador WebSocket Paso a Paso Listo.", "event");
    logTo(serverLogDiv, "Servidor Simulador esperando...");
    updateUIState();
});