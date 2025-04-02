module.exports = function(eleventyConfig) {

  // Configuración de directorios
  return {
    dir: {
      input: ".",         // Lee desde aquí
      output: "/build_output/docs",       // Escribe aquí DENTRO de html/
      includes: "_includes",              // Dentro de 'input'
      layouts: "_includes",               // Layouts también en includes (o tu preferencia)  
      data: "_data"              // Datos globales (si los usas)
    },

  };

  // Si necesitas copiar la carpeta assets completa:
  // eleventyConfig.addPassthroughCopy("docs_src/assets");

  // Si necesitas copiar archivos individuales:
  // eleventyConfig.addPassthroughCopy("docs_src/robots.txt"); // Ejemplo
};
