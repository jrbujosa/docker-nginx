document.addEventListener('DOMContentLoaded', () => {
    // --- Obtener Elementos del DOM ---
    const controls = {
        width: document.getElementById('width'),
        height: document.getElementById('height'),
        padding: document.getElementById('padding'),
        border: document.getElementById('border'),
        margin: document.getElementById('margin'),
        boxSizing: document.getElementById('box-sizing')
    };

    const values = {
        width: document.getElementById('width-value'),
        height: document.getElementById('height-value'),
        padding: document.getElementById('padding-value'),
        border: document.getElementById('border-value'),
        margin: document.getElementById('margin-value')
    };

    const targetBox = document.getElementById('target-box');
    const cssCodeElement = document.getElementById('css-code');

    // Elementos de Visualización Central
    const visContent = document.getElementById('vis-content');
    const visContentDims = document.getElementById('vis-content-dims');
    const visPaddingValue = document.getElementById('vis-padding-value');
    const visBorderValue = document.getElementById('vis-border-value');
    const visMarginValue = document.getElementById('vis-margin-value');
    const totalDimsElement = document.getElementById('total-dims');
    const outerDimsElement = document.getElementById('outer-dims');
    const calculationInfo = document.getElementById('calculation-info');

    // --- Función Principal de Actualización ---
    function updateBoxModel() {
        // 1. Leer valores de los controles
        const width = parseInt(controls.width.value);
        const height = parseInt(controls.height.value);
        const padding = parseInt(controls.padding.value);
        const border = parseInt(controls.border.value);
        const margin = parseInt(controls.margin.value);
        const boxSizing = controls.boxSizing.value;

        // 2. Actualizar los spans de valores junto a los sliders
        values.width.textContent = `${width}px`;
        values.height.textContent = `${height}px`;
        values.padding.textContent = `${padding}px`;
        values.border.textContent = `${border}px`;
        values.margin.textContent = `${margin}px`;

        // 3. Aplicar estilos al target-box (Panel Derecho)
        targetBox.style.width = `${width}px`;
        targetBox.style.height = `${height}px`;
        targetBox.style.padding = `${padding}px`;
        targetBox.style.borderWidth = `${border}px`;
        // Asegurarse que siempre haya un estilo de borde para que se vea el width
        targetBox.style.borderStyle = border > 0 ? 'solid' : 'none';
        targetBox.style.margin = `${margin}px`;
        targetBox.style.boxSizing = boxSizing;

        // 4. Generar y mostrar el código CSS (Panel Izquierdo)
        const cssString = `
.target-box {
  width: ${width}px;
  height: ${height}px;
  padding: ${padding}px;
  border: ${border}px solid #2980b9; ${/* Mantenemos color y estilo fijos */''}
  margin: ${margin}px;
  box-sizing: ${boxSizing};
  background-color: #3498db;
  color: white;
  /* ... otros estilos base ... */
}`;
        cssCodeElement.textContent = cssString.trim();


        // 5. Actualizar la Visualización Central (La parte más compleja)

        // Forzamos al navegador a recalcular estilos AHORA MISMO
        // Usar getComputedStyle DESPUÉS de aplicar los estilos
        const computedStyle = window.getComputedStyle(targetBox);

        // Extraer dimensiones computadas (incluyen 'px', los parseamos)
        const computedWidth = parseFloat(computedStyle.width);
        const computedHeight = parseFloat(computedStyle.height);
        const computedPaddingTop = parseFloat(computedStyle.paddingTop);
        const computedPaddingRight = parseFloat(computedStyle.paddingRight);
        const computedPaddingBottom = parseFloat(computedStyle.paddingBottom);
        const computedPaddingLeft = parseFloat(computedStyle.paddingLeft);
        const computedBorderTop = parseFloat(computedStyle.borderTopWidth);
        const computedBorderRight = parseFloat(computedStyle.borderRightWidth);
        const computedBorderBottom = parseFloat(computedStyle.borderBottomWidth);
        const computedBorderLeft = parseFloat(computedStyle.borderLeftWidth);
        const computedMarginTop = parseFloat(computedStyle.marginTop);
        const computedMarginRight = parseFloat(computedStyle.marginRight);
        const computedMarginBottom = parseFloat(computedStyle.marginBottom);
        const computedMarginLeft = parseFloat(computedStyle.marginLeft);


        // Calcular dimensiones de CADA PARTE para la visualización

        let contentWidth, contentHeight;

        if (boxSizing === 'content-box') {
            contentWidth = computedWidth; // En content-box, width/height es el del contenido
            contentHeight = computedHeight;
            calculationInfo.innerHTML = `<p><strong>Cálculo Ancho (content-box):</strong><br> Total = width + padding*2 + border*2<br> ${width}px + ${padding*2}px + ${border*2}px</p>`;
        } else { // border-box
            // En border-box, width/height incluye padding y border, debemos restarlos
            contentWidth = computedWidth - computedPaddingLeft - computedPaddingRight - computedBorderLeft - computedBorderRight;
            contentHeight = computedHeight - computedPaddingTop - computedPaddingBottom - computedBorderTop - computedBorderBottom;
            calculationInfo.innerHTML = `<p><strong>Cálculo Ancho (border-box):</strong><br> Total = width (incluye padding y border)<br> ${width}px</p>`;
        }

         // Asegurar que no sean negativos visualmente si los valores son extraños
        contentWidth = Math.max(0, contentWidth);
        contentHeight = Math.max(0, contentHeight);

        // Dimensiones Totales (ocupadas en el layout, sin margen)
        const totalWidth = contentWidth + computedPaddingLeft + computedPaddingRight + computedBorderLeft + computedBorderRight;
        const totalHeight = contentHeight + computedPaddingTop + computedPaddingBottom + computedBorderTop + computedBorderBottom;

        // Dimensiones Exteriores (incluyendo margen)
        // Nota: El navegador puede colapsar márgenes verticales, aquí sumamos simple para la visualización
        const outerWidth = totalWidth + computedMarginLeft + computedMarginRight;
        const outerHeight = totalHeight + computedMarginTop + computedMarginBottom;


        // Actualizar textos en la visualización central
        visContentDims.textContent = `${contentWidth.toFixed(1)}px x ${contentHeight.toFixed(1)}px`;
        visPaddingValue.textContent = `${padding}px`; // Usamos el valor del input para simplicidad visual
        visBorderValue.textContent = `${border}px`; // Usamos el valor del input
        visMarginValue.textContent = `${margin}px`; // Usamos el valor del input

        // Actualizar dimensiones calculadas mostradas
        totalDimsElement.textContent = `Total Width: ${totalWidth.toFixed(1)}px`;
        outerDimsElement.textContent = `Outer Width: ${outerWidth.toFixed(1)}px`;

        // Actualizar el tamaño VISUAL del content-layer (opcional, pero ayuda)
        // Usamos porcentajes o flexbox en CSS para que se ajuste, pero podemos darle un min-height/width
        // para que no desaparezca si el contenido calculado es 0.
        visContent.style.minWidth = `${Math.max(20, contentWidth / 2)}px`; // Escala visual simple
        visContent.style.minHeight = `${Math.max(20, contentHeight / 2)}px`; // Escala visual simple

    }

    // --- Añadir Event Listeners ---
    // Escuchar cambios en CUALQUIER control
    for (const key in controls) {
        controls[key].addEventListener('input', updateBoxModel);
    }

    // --- Llamada Inicial ---
    // Ejecutar la función una vez al cargar la página para inicializar todo
    updateBoxModel();
});