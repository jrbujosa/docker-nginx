 document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes del DOM ---
    const mainContent = document.getElementById('main-content');
    const sidebarButtons = document.querySelectorAll('.sidebar-button[data-fragment]');
    const FRAGMENT_PATH = './fragments/'; // Asegúrate que esta ruta sea correcta desde index.html
    let currentFragment = ''; // Para saber a dónde volver desde el iframe o gestionar historial

    /**
     * Carga dinámicamente contenido HTML desde un archivo fragmento en mainContent.
     * (Función loadMainContent sin cambios...)
     */
    async function loadMainContent(fragmentFile) {
        if (!fragmentFile) {
            console.error("loadMainContent: No se especificó fragmentFile.");
            mainContent.innerHTML = '<p class="error-message">Error interno: No se especificó el contenido a cargar.</p>';
            currentFragment = '';
            return;
        }

        // Guarda el fragmento actual ANTES de cargar el nuevo
        // (Podrías usar esto para un historial simple si lo necesitas)
        currentFragment = fragmentFile;
        const filePath = FRAGMENT_PATH + fragmentFile;

        mainContent.innerHTML = '<p class="loading-message">Cargando...</p>';
        mainContent.scrollTop = 0;

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                const errorReason = response.status === 404 ? `El archivo '${fragmentFile}' no existe en ${filePath}` : `Error ${response.status}`;
                throw new Error(`${errorReason}`);
            }
            const htmlContent = await response.text();
            mainContent.innerHTML = htmlContent;
            console.log(`Fragmento "${fragmentFile}" cargado.`);

        } catch (error) {
            console.error('Error en loadMainContent:', error);
            mainContent.innerHTML = `<p class="error-message">Error al cargar contenido: ${error.message}.</p>`;
            // currentFragment = ''; // Quizás no quieras resetearlo aquí si falla la carga
        }
    }

    /**
     * Muestra un ejercicio (URL) en un iframe dentro de mainContent.
     * (Función showExerciseInIframe sin cambios...)
     */
    function showExerciseInIframe(url, title, returnFragment) {
       // ... (código existente)
        console.log(`Mostrando ejercicio desde ${url}. Volver a: ${returnFragment}`);

        mainContent.innerHTML = '';
        mainContent.scrollTop = 0;

        const iframeViewContainer = document.createElement('div');
        iframeViewContainer.id = 'iframe-view-container';
        iframeViewContainer.style.display = 'flex'; // Asegúrate que el CSS lo define bien

        const backButton = document.createElement('button');
        backButton.textContent = '← Volver a la lista';
        backButton.id = 'back-to-list-btn';
        backButton.addEventListener('click', () => {
            loadMainContent(returnFragment); // Carga el fragmento desde donde se abrió el iframe
            // Re-activar el botón del sidebar correspondiente
            updateActiveButton(document.querySelector(`.sidebar-button[data-fragment="${returnFragment}"]`));
        });

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = title || 'Contenido del Ejercicio';
        iframe.setAttribute('allowfullscreen', '');

        iframeViewContainer.appendChild(backButton);
        iframeViewContainer.appendChild(iframe);
        mainContent.appendChild(iframeViewContainer);
        backButton.focus();
    }

     /**
     * Actualiza el estado visual (clase 'active') de los botones del sidebar.
     * (Función updateActiveButton sin cambios...)
     */
    function updateActiveButton(activeButtonEl) {
        document.querySelectorAll('.sidebar-nav .sidebar-button').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeButtonEl) {
            activeButtonEl.classList.add('active');
        }
    }

    // --- Event Listeners ---

    // 1. Clic en botones del sidebar (sin cambios)
    sidebarButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const fragmentFile = button.getAttribute('data-fragment');
            if (fragmentFile) {
                loadMainContent(fragmentFile);
                updateActiveButton(button);
            } else {
                 const action = button.getAttribute('data-action');
                 if (action === 'logout') {
                     console.log('Acción de Salir (logout)');
                     alert('Funcionalidad de "Salir" no implementada.');
                 }
            }
        });
    });

    // 2. Clic DELEGADO en 'mainContent' *** ACTUALIZADO ***
    mainContent.addEventListener('click', (event) => {
        // *** NUEVO: Detectar clics en enlaces internos de fragmentos ***
        const fragmentLink = event.target.closest('a[data-fragment]');
        if (fragmentLink) {
            event.preventDefault(); // Evitar navegación del href="#"
            const fragmentFile = fragmentLink.getAttribute('data-fragment');
            if (fragmentFile) {
                loadMainContent(fragmentFile);
                // Opcional: Actualizar el botón activo del sidebar si existe uno para este fragmento
                const correspondingSidebarButton = document.querySelector(`.sidebar-button[data-fragment="${fragmentFile}"]`);
                updateActiveButton(correspondingSidebarButton); // Marcará como activo si lo encuentra, o quitará activo si no.
            } else {
                 console.error("Enlace de fragmento sin atributo 'data-fragment' válido:", fragmentLink);
            }
            return; // Importante: Salir para no procesar como link de iframe
        }

        // Detectar clics en enlaces de ejercicios para iframe (código existente)
        const exerciseLink = event.target.closest('a[data-url]');
        if (exerciseLink) {
            event.preventDefault();
            const url = exerciseLink.getAttribute('data-url');
            const title = exerciseLink.getAttribute('data-title') || 'Ejercicio';

            if (currentFragment && url) {
                 updateActiveButton(null); // Desactivar botones del sidebar al entrar al iframe
                 showExerciseInIframe(url, title, currentFragment); // Pasar el fragmento actual para poder volver
            } else {
                console.error("No se pudo mostrar el ejercicio: falta URL o fragmento de retorno.", { url, currentFragment });
                mainContent.innerHTML = `<p class="error-message">Error al intentar abrir el ejercicio.</p>`;
            }
            return; // Salir
        }

        // *** NUEVO (Opcional): Detectar clics en botones dentro del fragmento ***
        // Si usas <button data-fragment="..."> dentro de los fragmentos, como el "Inicio App" del ejemplo
        const fragmentButton = event.target.closest('button[data-fragment]');
        if (fragmentButton) {
            const fragmentFile = fragmentButton.getAttribute('data-fragment');
             if (fragmentFile) {
                loadMainContent(fragmentFile);
                const correspondingSidebarButton = document.querySelector(`.sidebar-button[data-fragment="${fragmentFile}"]`);
                updateActiveButton(correspondingSidebarButton);
            } else {
                 console.error("Botón de fragmento sin atributo 'data-fragment' válido:", fragmentButton);
            }
            // No necesita preventDefault para button type="button" (el default)
        }

    });

    // --- Inicialización --- (sin cambios)
    const initialActiveButton = document.querySelector('.sidebar-button.active');
    let initialFragment;

    if (initialActiveButton && initialActiveButton.dataset.fragment) {
        initialFragment = initialActiveButton.dataset.fragment;
    } else {
        // Intenta cargar 'dashboard.html' como fallback si no hay activo
        initialFragment = 'dashboard.html';
        const dashboardButton = document.querySelector('.sidebar-button[data-fragment="dashboard.html"]');
         // Si no había botón activo inicialmente Y existe el botón del dashboard, márcalo
        if (!initialActiveButton && dashboardButton) {
             updateActiveButton(dashboardButton);
        } else if (initialActiveButton && !initialActiveButton.dataset.fragment) {
             // Si el botón activo no tiene data-fragment (ej. el de Salir), quita el active
             updateActiveButton(null);
        }
        // Si no existe dashboard.html, fallará la carga inicial (lo cual es esperado)
    }

    // Carga el contenido inicial
    if (initialFragment) { // Solo carga si tenemos un fragmento inicial definido
      loadMainContent(initialFragment);
    } else {
      // Opcional: Mostrar un mensaje si no hay contenido inicial que cargar
      mainContent.innerHTML = '<p>Selecciona una opción del menú lateral.</p>';
      console.warn("No se definió un fragmento inicial activo.");
    }

});