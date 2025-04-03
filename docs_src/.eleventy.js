// ./docs_src/.eleventy.js

module.exports = function(eleventyConfig) {

  // --- Configuraciones ANTES del return ---

  // Ejemplo: Copiar la carpeta 'assets' (si existe en ./docs_src/assets)
  // eleventyConfig.addPassthroughCopy("assets");

  // Ejemplo: Copiar un archivo específico (si existe en ./docs_src/robots.txt)
  // eleventyConfig.addPassthroughCopy("robots.txt");

  // --- Configuración de BrowserSync (para --serve en Docker) ---
  eleventyConfig.setBrowserSyncConfig({
    host: '0.0.0.0',  // Escucha en todas las interfaces dentro de Docker
    port: 8080,      // Puerto DENTRO del contenedor
    open: false,     // No intentes abrir el navegador automáticamente
    // Vigila cambios en la carpeta de salida correcta para recargar el navegador
    files: ['/build_output/docs/**/*'] // ¡IMPORTANTE: Debe coincidir con dir.output!
  });

  // --- Configuración de directorios (AL FINAL) ---
  return {
    dir: {
      input: ".",         // Lee desde /app (mapeado desde ./docs_src)
      output: "/build_output/docs", // Escribe en /build_output/docs DENTRO del contenedor
      includes: "_includes",
      layouts: "_includes", // O tu carpeta de layouts si es diferente
      data: "_data"
    },
    // Otras opciones que quieras añadir
    // markdownTemplateEngine: "njk",
  };
};