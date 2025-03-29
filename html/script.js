// Espera a que el árbol DOM esté completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    // Selecciona los elementos principales con los que interactuaremos.
    // Guardarlos en constantes mejora el rendimiento al evitar búsquedas repetidas.
    const mainContent = document.getElementById('main-content');         // Área principal que contiene grid o iframe
    const mainTitle = document.getElementById('main-title');             // Título H2 ("Catálogo de Ejercicios")
    const gridContainer = document.getElementById('grid-container');     // Div que contiene las tarjetas de ejemplos
    const iframeContainer = document.getElementById('iframe-container'); // Div que contendrá el botón "Volver" y el iframe
    const sidebarLinks = document.querySelectorAll('.sidebar-nav nav ul li a'); // TODOS los enlaces del sidebar para estado 'active'
    const sidebarGridLinks = document.querySelectorAll('.nav-link-shows-grid'); // Solo enlaces del sidebar que muestran el grid


    // --- Funciones Principales ---

    /**
     * Muestra la vista de la cuadrícula de ejercicios.
     * Oculta el iframe y muestra el título y el grid.
     * Limpia el contenedor del iframe para eliminar instancias anteriores.
     */
    function showGridView() {
        // Muestra los elementos relevantes para la vista de grid
        mainTitle.style.display = 'block';
        gridContainer.style.display = 'grid'; // Asegurar que se muestre como grid

        // Oculta el contenedor del iframe
        iframeContainer.style.display = 'none';
        // Limpia cualquier contenido previo del iframe (botón volver, iframe mismo)
        iframeContainer.innerHTML = '';

        // Opcional: Podrías devolver el foco a un elemento predecible, como el primer enlace del sidebar.
        // if (sidebarGridLinks.length > 0) sidebarGridLinks[0].focus();

        console.log("Vista Grid Mostrada");
    }

    /**
     * Muestra la vista del iframe para cargar un ejercicio.
     * @param {string} url - La URL del ejercicio a cargar en el iframe.
     * @param {string} title - El título para el iframe (accesibilidad).
     */
    function showIframeView(url, title) {
        // Validación: No hacer nada si no se proporciona una URL.
        if (!url) {
            console.error('showIframeView: No se proporcionó URL.');
            // Podrías mostrar un mensaje de error al usuario aquí.
            return;
        }

        // Oculta los elementos de la vista de grid
        mainTitle.style.display = 'none';
        gridContainer.style.display = 'none';

        // Limpia el contenedor por si acaso (aunque showGridView ya lo hace al volver)
        iframeContainer.innerHTML = '';

        // --- Creación Dinámica de Elementos ---

        // 1. Botón "Volver"
        const backButton = document.createElement('button');
        backButton.textContent = '← Volver a Ejercicios'; // Texto claro de la acción
        backButton.id = 'back-to-grid-btn'; // Asigna ID para estilos CSS
        // Añade un event listener al botón para volver a la vista de grid al hacer clic
        backButton.addEventListener('click', showGridView);

        // 2. Iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;                           // Establece la fuente del iframe
        iframe.title = title || 'Contenido del Ejercicio'; // Título importante para accesibilidad
        // Los estilos como width, height, border:none son aplicados vía CSS

        // --- Añadir Elementos al DOM ---
        // Añade primero el botón y luego el iframe al contenedor.
        iframeContainer.appendChild(backButton);
        iframeContainer.appendChild(iframe);

        // Muestra el contenedor del iframe (usando flex para el layout interno de botón/iframe)
        iframeContainer.style.display = 'flex';

        // Opcional: Mover el foco al botón "Volver" para mejorar accesibilidad teclado.
        backButton.focus();

        console.log("Vista Iframe Mostrada para:", url);
    }

    /**
     * Actualiza la clase 'active' en los enlaces de la barra lateral.
     * Quita la clase de todos los enlaces y la añade solo al especificado.
     * @param {Element|null} activeLink - El elemento de enlace que debe marcarse como activo. Si es null, se quita de todos.
     */
    function updateActiveSidebarLink(activeLink) {
        // Itera sobre TODOS los enlaces del sidebar
        sidebarLinks.forEach(link => {
            link.classList.remove('active'); // Quita la clase 'active' de cada uno
        });

        // Si se proporcionó un enlace específico, añádele la clase 'active'
        if (activeLink) {
            activeLink.classList.add('active');
        }
        // Nota: Si activeLink es null (ej., al mostrar iframe desde grid), ningún enlace quedará activo.
        // Se podría decidir reactivar 'Dashboard' como default en showGridView si se prefiere.
    }


    // --- Event Listeners ---

    // 1. Escucha de clics en el CONTENEDOR del grid (Event Delegation)
    // Esto es más eficiente que añadir un listener a cada tarjeta.
    gridContainer.addEventListener('click', (event) => {
        // Encuentra el ancestro más cercano que sea un enlace <a> DENTRO de una tarjeta
        // y que tenga el atributo 'data-url'.
        const linkElement = event.target.closest('.ejemplo-card a[data-url]');

        // Si se hizo clic en un enlace válido dentro de una tarjeta...
        if (linkElement) {
            event.preventDefault(); // Previene la navegación por defecto (si tuviera href="#")

            // Obtiene la URL y el título desde los atributos data-* del enlace
            const url = linkElement.getAttribute('data-url');
            const title = linkElement.getAttribute('data-title');

            // Llama a la función para mostrar el iframe con esa URL y título
            showIframeView(url, title);

            // Actualiza la barra lateral para que ningún enlace quede activo
            // ya que la vista actual es un ejercicio específico, no una sección del sidebar.
            updateActiveSidebarLink(null);
        }
    });

    // 2. Escucha de clics en los enlaces del sidebar que deben mostrar el grid
    sidebarGridLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Previene cualquier navegación por defecto
            showGridView();         // Muestra la vista de la cuadrícula

            // Actualiza la barra lateral para marcar este enlace como activo
            updateActiveSidebarLink(link);
            console.log("Clic en Sidebar link para mostrar grid:", link.dataset.target || 'Link');
        });
    });


    // --- Inicialización ---
    // Al cargar la página, asegúrate de que la vista inicial sea la cuadrícula.
    showGridView();

    // Marca el enlace inicial ("Dashboard" o el primero con la clase) como activo.
    const initialActiveLink = document.querySelector('.sidebar-nav .nav-link-shows-grid.active') || sidebarGridLinks[0];
    if(initialActiveLink) {
        updateActiveSidebarLink(initialActiveLink);
    }

}); // Fin de document.addEventListener('DOMContentLoaded')