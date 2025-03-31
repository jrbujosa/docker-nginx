    document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes del DOM ---
    const mainContent = document.getElementById('main-content');
    const sidebarButtons = document.querySelectorAll('.sidebar-button[data-fragment]');
    const FRAGMENT_PATH = './fragments/';
    let currentFragment = ''; // Para saber a dónde volver desde el iframe

    /**
     * Carga dinámicamente contenido HTML desde un archivo fragmento en mainContent.
     * Flexible para manejar cualquier estructura HTML en el fragmento.
     * @param {string} fragmentFile Nombre del archivo (e.g., 'dashboard.html').
     */
    async function loadMainContent(fragmentFile) {
        if (!fragmentFile) {
            console.error("loadMainContent: No se especificó fragmentFile.");
            mainContent.innerHTML = '<p class="error-message">Error interno: No se especificó el contenido a cargar.</p>';
            currentFragment = '';
            return;
        }

        // Guarda el fragmento actual para poder volver desde un iframe
        currentFragment = fragmentFile;
        const filePath = FRAGMENT_PATH + fragmentFile;

        // 1. Mostrar estado de carga directamente en mainContent
        mainContent.innerHTML = '<p class="loading-message">Cargando...</p>';
        mainContent.scrollTop = 0; // Reset scroll al cargar nuevo contenido

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                // Intenta dar un mensaje de error más específico si es 404
                const errorReason = response.status === 404 ? `El archivo no existe en ${filePath}` : `Error ${response.status}`;
                throw new Error(`${errorReason}`);
            }
            const htmlContent = await response.text();

            // 2. Limpiar mainContent y Añadir el nuevo contenido DIRECTAMENTE
            mainContent.innerHTML = htmlContent;

            // 3. Post-procesamiento (Opcional pero útil):
            //    Asegura la visibilidad de elementos comunes si existen en el fragmento.
            //    Esto permite que el CSS los oculte por defecto si se desea.

            const mainTitle = mainContent.querySelector('#main-title');
            if (mainTitle) {
                mainTitle.style.display = 'block'; // Muestra el título si existe
            }

            const gridContainer = mainContent.querySelector('#grid-container');
            if (gridContainer) {
                gridContainer.style.display = 'grid'; // Muestra la rejilla si existe
            }

            // El resto del contenido del fragmento se mostrará según las reglas
            // normales del navegador y el CSS aplicado a sus elementos.

            console.log(`Fragmento "${fragmentFile}" cargado.`);

        } catch (error) {
            console.error('Error en loadMainContent:', error);
            // Mostrar estado de error directamente en mainContent
            mainContent.innerHTML = `<p class="error-message">Error al cargar contenido: ${error.message}.</p>`;
            currentFragment = ''; // Resetea el fragmento actual en caso de error
        }
    }

    /**
     * Muestra un ejercicio (URL) en un iframe dentro de mainContent.
     * @param {string} url La URL del ejercicio a mostrar.
     * @param {string} title El título para el iframe.
     * @param {string} returnFragment El nombre del fragmento al que volver (e.g., 'ejemplos-html.html').
     */
    function showExerciseInIframe(url, title, returnFragment) {
        if (!url || !returnFragment) {
            console.error("showExerciseInIframe: Faltan url o returnFragment.");
            mainContent.innerHTML = '<p class="error-message">Error al intentar mostrar el ejercicio.</p>';
            return;
        }
        console.log(`Mostrando ejercicio desde ${url}. Volver a: ${returnFragment}`);

        // 1. Limpiar mainContent completamente
        mainContent.innerHTML = '';
        mainContent.scrollTop = 0;

        // 2. Crear los elementos para la vista del iframe
        const iframeViewContainer = document.createElement('div');
        iframeViewContainer.id = 'iframe-view-container'; // ID para estilos CSS
        iframeViewContainer.style.display = 'flex'; // Mostrar este contenedor (CSS también define estilo)

        const backButton = document.createElement('button');
        backButton.textContent = '← Volver a la lista';
        backButton.id = 'back-to-list-btn'; // ID para estilos
        backButton.addEventListener('click', () => {
            loadMainContent(returnFragment);
            // Re-activar el botón del sidebar correspondiente al fragmento al que volvemos
            updateActiveButton(document.querySelector(`.sidebar-button[data-fragment="${returnFragment}"]`));
        });

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = title || 'Contenido del Ejercicio';
        iframe.setAttribute('allowfullscreen', ''); // Opcional: permitir pantalla completa si el contenido lo soporta

        // 3. Ensamblar la vista del iframe
        iframeViewContainer.appendChild(backButton);
        iframeViewContainer.appendChild(iframe);

        // 4. Añadir la vista del iframe al mainContent (que ya estaba limpio)
        mainContent.appendChild(iframeViewContainer);

        // Opcional: Poner el foco en el botón de volver para mejorar accesibilidad
        backButton.focus();
    }

     /**
     * Actualiza el estado visual (clase 'active') de los botones del sidebar.
     * @param {Element | null} activeButtonEl El elemento botón a marcar como activo. Si es null, desactiva todos.
     */
    function updateActiveButton(activeButtonEl) {
        // Quita 'active' de todos los botones del sidebar
        document.querySelectorAll('.sidebar-nav .sidebar-button').forEach(btn => {
            btn.classList.remove('active');
        });
        // Añade 'active' solo al botón especificado, si existe
        if (activeButtonEl) {
            activeButtonEl.classList.add('active');
        }
    }

    // --- Event Listeners ---

    // 1. Clic en botones del sidebar que cargan fragmentos
    sidebarButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const fragmentFile = button.getAttribute('data-fragment');
            // Asegurarse de que el botón tenga 'data-fragment' antes de actuar
            if (fragmentFile) {
                loadMainContent(fragmentFile);
                updateActiveButton(button); // Marca este botón como activo
            } else {
                 // Aquí podrías manejar otros botones que usen 'data-action' como el de 'Salir'
                 const action = button.getAttribute('data-action');
                 if (action === 'logout') {
                     console.log('Acción de Salir (logout) - Implementar lógica aquí');
                     // Por ejemplo: limpiar sesión, redirigir a login, etc.
                     alert('Funcionalidad de "Salir" no implementada.');
                 }
            }
        });
    });

    // 2. Clic DELEGADO en 'mainContent' para enlaces de ejercicios [data-url]
    //    Esto funciona sin importar cuándo se añadan las tarjetas a mainContent.
    mainContent.addEventListener('click', (event) => {
        // Buscar si el clic ocurrió dentro de un enlace con 'data-url'
        const linkElement = event.target.closest('a[data-url]');

        if (linkElement) {
            event.preventDefault(); // Evitar la navegación normal del enlace
            const url = linkElement.getAttribute('data-url');
            const title = linkElement.getAttribute('data-title') || 'Ejercicio'; // Usar título o un default

            // Asegurarse de que tenemos un fragmento de retorno válido
            if (currentFragment && url) {
                 // Desactivar visualmente cualquier botón del sidebar al entrar al iframe
                 updateActiveButton(null);
                 // Mostrar el iframe
                 showExerciseInIframe(url, title, currentFragment);
            } else {
                console.error("No se pudo mostrar el ejercicio: falta URL o fragmento de retorno.", { url, currentFragment });
                mainContent.innerHTML = `<p class="error-message">Error al intentar abrir el ejercicio. No se encontró la URL o la página de origen.</p>`;
            }
        }
    });

    // --- Inicialización ---
    // Busca el botón activo inicial o usa 'dashboard.html' como default.
    const initialActiveButton = document.querySelector('.sidebar-button.active');
    let initialFragment;

    if (initialActiveButton && initialActiveButton.dataset.fragment) {
        initialFragment = initialActiveButton.dataset.fragment;
    } else {
        // Si no hay botón activo en el HTML o no tiene data-fragment, ir al dashboard
        initialFragment = 'dashboard.html';
        // Busca el botón del dashboard para marcarlo como activo
        const dashboardButton = document.querySelector('.sidebar-button[data-fragment="dashboard.html"]');
        updateActiveButton(dashboardButton); // Marca el de dashboard como activo si no había otro
    }

    // Carga el contenido inicial
    loadMainContent(initialFragment);

});