<?php
$log_file = '/var/log/myapp/api.log'; // Usa la nueva ruta
$message = date('Y-m-d H:i:s') . " - index.php ejecutándose\n";
file_put_contents($log_file, $message, FILE_APPEND);

// Establecer el tipo de contenido como JSON
header('Content-Type: application/json');

// Permitir CORS (Cross-Origin Resource Sharing) para pruebas locales.  ¡No usar en producción sin restringir los orígenes!
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


// Función para leer los datos de usuarios desde el archivo JSON
function obtenerUsuarios() {
  $archivo = __DIR__ . '/../data/users.json';
  $contenido = file_get_contents($archivo);
  return json_decode($contenido, true); // Decodifica el JSON a un array asociativo
}

// Obtener el método HTTP de la solicitud
$metodo = $_SERVER['REQUEST_METHOD'];

// Enrutamiento básico basado en el método HTTP y la URL
if ($metodo === 'GET') {
  // Si la URL termina en /usuarios, devolver la lista de usuarios
  if (strpos($_SERVER['REQUEST_URI'], '/usuarios') !== false) {
    $usuarios = obtenerUsuarios();
    echo json_encode($usuarios);
  } else {
    // Si no coincide, devolver un error 404
    http_response_code(404);
    echo json_encode(['error' => 'Recurso no encontrado']);
  }
} else {
  // Si el método HTTP no es GET, devolver un error 405 (Método No Permitido)
  http_response_code(405);
  echo json_encode(['error' => 'Método no permitido']);
}

?>