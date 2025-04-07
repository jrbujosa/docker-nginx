document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const explanationText = document.getElementById('explanation-text');
    const sourceCodeEl = document.getElementById('source-code');
    const sourcePreEl = sourceCodeEl.parentElement; // Aún puede ser útil para otras cosas, lo dejamos
    // const sourceHighlightEl = document.getElementById('source-highlight'); // *** ELIMINADO ***
    const domTreeEl = document.getElementById('dom-tree');
    const cssomTreeEl = document.getElementById('cssom-tree');
    const renderOutputEl = document.getElementById('render-output');

    // --- Código HTML Ejemplo (para cálculo de líneas) ---
    // Sigue siendo útil si en el futuro quieres referenciar líneas específicas en la explicación
    const sourceCodeLines = sourceCodeEl.textContent.trim().split('\n');

    // --- Estilos CSS Simulados (Formato "Arbóreo" para CSSOM) ---
    const formattedSimulatedCssRules = `/* === CSSOM Construido === */
/* Reglas de sim-style.css analizadas y aplicadas */

Reglas coincidentes:
├── Selector: #main-heading
│   ├── color: navy
│   └── border-bottom: 2px solid lightblue
│
├── Selector: .intro
│   ├── font-style: italic
│   ├── background-color: #f0f0f0
│   └── padding: 10px
│
└── Selector: #action-button
    ├── background-color: lightgreen
    ├── color: black
    ├── padding: 8px 15px
    ├── border: 1px solid darkgreen
    └── cursor: pointer`;

    // --- Definición de los Pasos de la Simulación ---
    // Los pasos ya no necesitan 'sourceLineIndex' para el resaltado,
    // pero lo mantenemos por si quieres usarlo para referenciar líneas en la explicación.
    const simulationSteps = [
         // --- Paso 0: Estado Inicial ---
        {
            explanation: "Estado inicial. El navegador aún no ha procesado nada. Haz clic en 'Siguiente Paso' para comenzar el análisis del HTML.",
            sourceLineIndex: -1,
            dom: "<!-- DOM vacío -->",
            cssom: "<!-- CSSOM vacío -->",
            render: "<!-- Pantalla vacía -->",
        },
        // --- Paso 1: DOCTYPE y <html> ---
        {
            explanation: "1. **Inicio del Análisis (Parsing):** El navegador lee la línea &lt;!DOCTYPE html&gt; y encuentra &lt;html&gt;. Comienza a construir el **Árbol DOM**.", // Ejemplo de referencia a línea
            sourceLineIndex: 0, // Mantenido por si se usa en explicación
            dom: `document\n  └── html (Nodo Raíz)`,
            cssom: "<!-- CSSOM vacío -->",
            render: "",
        },
        // ... (resto de los pasos, 'sourceLineIndex' puede quedarse o quitarse si no se usa)
        // --- Paso 2: <head> ---
        {
            explanation: "2. **Procesando Metadatos:** Encuentra &lt;head&gt;. Se crea un nodo `head` en el DOM.",
            sourceLineIndex: 2,
            dom: `document\n  └── html\n      └── head`,
            cssom: "<!-- CSSOM vacío -->",
            render: "",
        },
        // --- Paso 3: <title> ---
        {
            explanation: "3. **Título de la Página:** Procesa &lt;title&gt; y su contenido.",
            sourceLineIndex: 3,
            dom: `document\n  └── html\n      └── head\n          └── title\n              └── #text: "Página Simulada"`,
            cssom: "<!-- CSSOM vacío -->",
            render: "",
        },
        // --- Paso 4: <link> CSS ---
        {
            explanation: "4. **Solicitud de CSS (Asíncrona):** Encuentra &lt;link rel=\"stylesheet\"&gt;. Inicia la descarga *asíncrona* de `sim-style.css`.",
            sourceLineIndex: 4,
            dom: `document\n  └── html\n      └── head\n          ├── title\n          │   └── #text: "Página Simulada"\n          └── link (rel="stylesheet", href="sim-style.css")`,
            cssom: "Solicitud iniciada para sim-style.css...\n(Descarga en segundo plano)",
            render: "",
        },
        // --- Paso 5: <body> ---
        {
            explanation: "5. **Inicio del Contenido Visible:** Procesa &lt;body&gt;.",
            sourceLineIndex: 6,
            dom: `document\n  └── html\n      ├── head\n      │   └── ... (metadatos)\n      └── body`,
            cssom: "Descargando sim-style.css...\n(Análisis HTML continúa)",
            render: "",
        },
        // --- Paso 6: <h1> ---
        {
            explanation: "6. **Primer Elemento Visible:** Procesa &lt;h1&gt;. Se añade al DOM y se renderiza (inicialmente con estilos por defecto).",
            sourceLineIndex: 7,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          └── h1#main-heading\n              └── #text: "Título Principal"`,
            cssom: "Descargando sim-style.css...",
            render: `<h1 id="main-heading">Título Principal</h1>\n<!-- Renderizado con estilos por defecto -->`,
        },
        // --- Paso 7: Simulación Descarga y Aplicación CSS ---
        {
            explanation: "7. **CSS Descargado y Procesado:** (Simulado) `sim-style.css` descargado. Se construye el **CSSOM**. Se crea el **Árbol de Renderizado** combinando DOM y CSSOM. Se aplican estilos al &lt;h1&gt;.",
            sourceLineIndex: 4,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          └── h1#main-heading (vinculado a reglas CSSOM)\n              └── #text: "Título Principal"`,
            cssom: formattedSimulatedCssRules,
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<!-- Renderizado actualizado -->`,
        },
         // --- Paso 8: <p> ---
        {
            explanation: "8. **Procesando Párrafo:** Procesa &lt;p&gt;. Se añade al DOM y se aplican estilos del CSSOM.",
            sourceLineIndex: 8,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          ├── h1#main-heading (styled)\n          │   └── ...\n          └── p.intro (styled)\n              └── #text: "Este es el primer..."`,
            cssom: formattedSimulatedCssRules,
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<p class="intro styled">Este es el primer párrafo.</p>`,
        },
        // --- Paso 9: <button> ---
        {
            explanation: "9. **Procesando Botón:** Procesa &lt;button&gt;. Se añade al DOM y se aplican estilos.",
            sourceLineIndex: 9,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          ├── h1#main-heading (styled)\n          │   └── ...\n          ├── p.intro (styled)\n          │   └── ...\n          └── button#action-button (styled)\n              └── #text: "Haz Clic"`,
            cssom: formattedSimulatedCssRules,
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<p class="intro styled">Este es el primer párrafo.</p>\n<button id="action-button" class="styled">Haz Clic</button>`,
        },
        // --- Paso 10: <script> ---
        {
            explanation: "10. **Solicitud de JS (Síncrona y Bloqueante):** Encuentra &lt;script src=\"...\"&gt;. El análisis HTML **SE DETIENE** hasta que el script se descargue y ejecute.",
            sourceLineIndex: 10,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          ├── h1 (styled)\n          ├── p (styled)\n          ├── button (styled)\n          └── script (src="sim-script.js")\n              // <-- ANÁLISIS HTML PAUSADO -->`,
            cssom: formattedSimulatedCssRules + "\n\n(Esperando script...)",
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<p class="intro styled">Este es el primer párrafo.</p>\n<button id="action-button" class="styled">Haz Clic</button>`,
        },
        // --- Paso 11: Simulación Ejecución JS ---
        {
            explanation: "11. **JS Descargado y Ejecutado:** (Simulado) `sim-script.js` se ejecuta. Puede interactuar con el DOM/CSSOM (ej: añadir listeners). El análisis HTML se reanuda.",
            sourceLineIndex: 10,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          ├── h1#main-heading (styled)\n          │   └── ...\n          ├── p.intro (styled)\n          │   └── ...\n          ├── button#action-button (styled, ahora con listener 'click')\n          └── script (src="sim-script.js")\n              // <-- Ejecución JS completada -->`,
            cssom: formattedSimulatedCssRules,
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<p class="intro styled">Este es el primer párrafo.</p>\n<button id="action-button" class="styled">Haz Clic</button>\n<!-- JS ejecutado -->`,
        },
         // --- Paso 12: Fin del procesamiento ---
        {
            explanation: "12. **Fin del Análisis y Página Lista:** Se procesan &lt;/body&gt; y &lt;/html&gt;. DOM completo. Página interactiva.",
            sourceLineIndex: 12,
            dom: `document\n  └── html\n      ├── head\n      │   └── ...\n      └── body\n          ├── h1 (styled)\n          ├── p (styled)\n          ├── button (styled, con listener)\n          └── script (...)\n      // <-- DOM Completo -->`,
            cssom: formattedSimulatedCssRules,
            render: `<h1 id="main-heading" class="styled">Título Principal</h1>\n<p class="intro styled">Este es el primer párrafo.</p>\n<button id="action-button" class="styled">Haz Clic</button>\n<!-- Fin Análisis -->`,
        }
    ];

    // --- Estado de la Simulación ---
    let currentStepIndex = 0;
    const totalSteps = simulationSteps.length;

    // --- Funciones Auxiliares ---
    // *** ELIMINADA: calculateHighlightTop() ***
    /*
    function calculateHighlightTop(lineIndex) { ... }
    */

    function updateUI() {
        const step = simulationSteps[currentStepIndex];

        // 1. Actualizar Explicación
        explanationText.innerHTML = step.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // *** SECCIÓN ELIMINADA: 2. Actualizar Resaltado Código Fuente ***
        /*
        if (step.sourceLineIndex >= 0 && step.sourceLineIndex < sourceCodeLines.length) {
             sourceHighlightEl.style.top = calculateHighlightTop(step.sourceLineIndex);
             sourceHighlightEl.style.display = 'block';
        } else {
             sourceHighlightEl.style.display = 'none';
        }
        */

        // 2. Actualizar Árbol DOM (Renumerado)
        domTreeEl.textContent = step.dom;

        // 3. Actualizar Árbol CSSOM (Renumerado)
        cssomTreeEl.textContent = step.cssom;

        // 4. Actualizar Renderizado Visual y Aplicar Estilos (Renumerado)
        renderOutputEl.innerHTML = step.render;
        const applyStylesNow = currentStepIndex >= 7;
        const renderedH1 = renderOutputEl.querySelector('#main-heading');
        const renderedP = renderOutputEl.querySelector('.intro');
        const renderedButton = renderOutputEl.querySelector('#action-button');

        if (renderedH1) renderedH1.classList.toggle('styled', applyStylesNow);
        if (renderedP) renderedP.classList.toggle('styled', applyStylesNow);
        if (renderedButton) renderedButton.classList.toggle('styled', applyStylesNow);

        // 5. Habilitar/Deshabilitar Botones (Renumerado)
        prevButton.disabled = currentStepIndex === 0;
        nextButton.disabled = currentStepIndex === totalSteps - 1;

        // *** SECCIÓN ELIMINADA: 7. Opcional: Scroll automático ***
        /*
         if (sourceHighlightEl.style.display === 'block') { ... }
        */
    }

    // --- Manejadores de Eventos ---
    nextButton.addEventListener('click', () => {
        if (currentStepIndex < totalSteps - 1) {
            currentStepIndex++;
            updateUI();
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateUI();
        }
    });

    // --- Inicialización ---
    setTimeout(() => {
      updateUI();
    }, 50);

}); // Fin de DOMContentLoaded