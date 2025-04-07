document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM (sin cambios)
    const keyInput = document.getElementById('key-input');
    const valueInput = document.getElementById('value-input');
    const saveCookieBtn = document.getElementById('save-cookie-btn');
    const saveLocalBtn = document.getElementById('save-local-btn');
    const saveSessionBtn = document.getElementById('save-session-btn');
    const readAllBtn = document.getElementById('read-all-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const simulateCloseBtn = document.getElementById('simulate-close-btn');
    const cookieContent = document.getElementById('cookie-content');
    const localstorageContent = document.getElementById('localstorage-content');
    const sessionstorageContent = document.getElementById('sessionstorage-content');
    const httpContent = document.getElementById('http-content');
    const statusMessage = document.getElementById('status-message');

    // --- Funciones de Utilidad para Cookies ---

    function setCookie(name, value, days = 1) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        const cookieString = encodeURIComponent(name) + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
        document.cookie = cookieString;
        // **DEBUGGING:** Loguear inmediatamente para ver si el navegador la aceptó
        console.log(`Attempted to set cookie: ${cookieString}`);
        console.log(`Current document.cookie: ${document.cookie}`);
    }

    function getCookies() {
        const cookies = {};
        // Leer directamente document.cookie CADA vez, ya que puede cambiar externamente
        const currentCookieString = document.cookie;
        if (!currentCookieString) {
            return cookies; // Devolver objeto vacío si no hay cookies
        }

        const ca = currentCookieString.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            // Eliminar espacios en blanco iniciales
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            const parts = c.split("=");
            // Asegurarse de que hay una clave y potencialmente un valor
            if (parts.length >= 1 && parts[0]) {
                 try {
                    const key = decodeURIComponent(parts[0]);
                    // Si hay un valor (parts.length >= 2), decodificarlo. Si no, valor vacío.
                    const value = parts.length >= 2 ? decodeURIComponent(parts.slice(1).join("=")) : "";
                    cookies[key] = value;
                 } catch (e) {
                     console.warn("Error decoding cookie part:", parts[0], e);
                     // Intentar guardar sin decodificar si falla
                     if (parts[0]) cookies[parts[0]] = parts.slice(1).join("=");
                 }
            }
        }
        console.log("Parsed cookies:", cookies); // DEBUG
        return cookies;
    }

    function deleteCookie(name) {
        // Para borrar, se necesita el mismo path y domain (implícito aquí path=/)
        document.cookie = encodeURIComponent(name) + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        console.log(`Attempted to delete cookie: ${name}`); // DEBUG
    }

    function clearAllCookies() {
        const cookies = getCookies(); // Obtiene las cookies actuales parseadas
        for (const name in cookies) {
            if (Object.prototype.hasOwnProperty.call(cookies, name)) {
                deleteCookie(name);
            }
        }
         // Es importante leer de nuevo *después* de intentar borrar
        console.log(`Cookies after clear attempt: ${document.cookie}`);
    }

    // --- Funciones de Local/Session Storage (sin cambios) ---
    function getLocalStorage() {
        const data = {};
        // ... (código igual que antes)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key !== null) {
                 try { data[key] = localStorage.getItem(key); } catch (e) { console.error("Error reading localStorage key:", key, e); }
            }
        }
        return data;
    }
    function getSessionStorage() {
        const data = {};
        // ... (código igual que antes)
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
             if (key !== null) {
                 try { data[key] = sessionStorage.getItem(key); } catch (e) { console.error("Error reading sessionStorage key:", key, e); }
            }
        }
        return data;
    }

    // --- Funciones de Actualización de la UI (sin cambios funcionales, solo logs añadidos) ---
    function displayData(element, dataObject) {
        // ... (código igual que antes)
        if (Object.keys(dataObject).length === 0) { element.textContent = '(vacío)'; }
        else { try { element.textContent = JSON.stringify(dataObject, null, 2); } catch (e) { console.error("Error stringifying data:", e); element.textContent = "Error"; } }
    }

    function updateHttpRequestDisplay() {
        const cookies = getCookies(); // Llama a la función revisada
        // ... (código igual que antes)
        if (Object.keys(cookies).length === 0) { httpContent.textContent = 'Cookie: (ninguna)'; }
        else { const cookieString = Object.entries(cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('; '); httpContent.textContent = `Cookie: ${cookieString}`; }
    }

    function updateAllDisplays() {
        console.log("--- Updating All Displays ---"); // DEBUG
        // Llamar a getCookies() *dentro* de displayData para asegurar la lectura más reciente
        displayData(cookieContent, getCookies());
        displayData(localstorageContent, getLocalStorage());
        displayData(sessionstorageContent, getSessionStorage());
        updateHttpRequestDisplay(); // Esta ya llama a getCookies() internamente
        console.log("--- Display Update Finished ---"); // DEBUG
    }

    function showStatus(message, type = 'info') {
        // ... (código igual que antes)
        statusMessage.textContent = message; statusMessage.className = `status-message ${type}`;
        setTimeout(() => { if (statusMessage.textContent === message) { statusMessage.textContent = ''; statusMessage.className = 'status-message'; } }, 4000);
    }

    // --- Event Listeners (sin cambios funcionales, excepto logs) ---
    saveCookieBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const value = valueInput.value;
        if (!key) { showStatus("La clave no puede estar vacía.", "error"); return; }
        setCookie(key, value); // Intenta guardar
        // **Importante:** La actualización de la UI depende de que getCookies() pueda leer el cambio.
        updateAllDisplays(); // Actualiza la UI
        showStatus(`Cookie "${key}" guardada (verificar en DevTools si no aparece).`, "success");
        keyInput.value = ''; valueInput.value = '';
    });

    saveLocalBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const value = valueInput.value;
        if (!key) { showStatus("La clave no puede estar vacía.", "error"); return; }
        try { localStorage.setItem(key, value); updateAllDisplays(); showStatus(`LocalStorage "${key}" guardado.`, "success"); keyInput.value = ''; valueInput.value = ''; }
        catch (e) { console.error("Error LS:", e); showStatus(`Error LocalStorage: ${e.name === 'QuotaExceededError' ? 'Espacio lleno' : e.message}`, "error"); }
    });

    saveSessionBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const value = valueInput.value;
        if (!key) { showStatus("La clave no puede estar vacía.", "error"); return; }
         try { sessionStorage.setItem(key, value); updateAllDisplays(); showStatus(`SessionStorage "${key}" guardado.`, "success"); keyInput.value = ''; valueInput.value = ''; }
         catch (e) { console.error("Error SS:", e); showStatus(`Error SessionStorage: ${e.name === 'QuotaExceededError' ? 'Espacio lleno' : e.message}`, "error"); }
    });

    readAllBtn.addEventListener('click', () => {
        updateAllDisplays();
        showStatus("Datos leídos y actualizados desde el navegador.", "info");
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm("¿Seguro que quieres borrar TODOS los datos (Cookies, LocalStorage, SessionStorage) accesibles desde esta página?")) {
            clearAllCookies(); // Intenta borrar cookies
            localStorage.clear();
            sessionStorage.clear();
            // Dar un respiro mínimo para que el navegador procese la eliminación de cookies antes de leer
            setTimeout(() => {
                updateAllDisplays();
                showStatus("Todos los almacenamientos accesibles han sido borrados.", "success");
            }, 100);
        }
    });

    simulateCloseBtn.addEventListener('click', () => {
        sessionStorage.clear();
        updateAllDisplays();
        showStatus("Simulación de cierre: SessionStorage borrado. Otros persisten.", "info");
    });

    // --- Inicialización ---
    console.log("Initializing simulator...");
    if (window.location.protocol === "file:") {
        console.warn("WARN: Running from file:// URL. Cookie behavior might be unreliable. Use a local web server.");
        showStatus("Advertencia: Ejecutando desde file://. Las cookies pueden no funcionar correctamente.", "error");
    }
    updateAllDisplays(); // Mostrar estado inicial

});