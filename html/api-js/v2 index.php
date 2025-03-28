<?php
$log_file = '/var/log/myapp/api.log';

// 1. Verificar el método HTTP
$message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Método: " . $_SERVER['REQUEST_METHOD'] . "\n";
file_put_contents($log_file, $message, FILE_APPEND);

// 2. Verificar la ruta de la solicitud
$message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Ruta: " . $_SERVER['REQUEST_URI'] . "\n";
file_put_contents($log_file, $message, FILE_APPEND);

// Establecer el tipo de contenido como JSON
header('Content-Type: application/json');

// Permitir CORS (Cross-Origin Resource Sharing) para pruebas locales
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


// Función para leer los datos de usuarios desde el archivo JSON
function obtenerUsuarios() {
    global $log_file; // Necesario para acceder a $log_file dentro de la función
    $archivo = '/data/users.json';  //  ¡Ruta absoluta al punto de montaje!

    // 4. Verificar la ruta al archivo y si existe
    $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Ruta al archivo: " . $archivo . "\n";
    file_put_contents($log_file, $message, FILE_APPEND);

    if (file_exists($archivo)) {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. El archivo existe.\n";
        file_put_contents($log_file, $message, FILE_APPEND);
    } else {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. ¡El archivo NO existe!\n";
        file_put_contents($log_file, $message, FILE_APPEND);
        return false; // Importante: retornar false si el archivo no existe
    }

    // 5. Verificar si el archivo se lee correctamente
    $contenido = file_get_contents($archivo);

    if ($contenido === false) {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. ¡Error al leer el archivo!\n";
        file_put_contents($log_file, $message, FILE_APPEND);
        return false; // Importante: retornar false si no se puede leer el archivo
    } else {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Archivo leído correctamente.\n";
        file_put_contents($log_file, $message, FILE_APPEND);
    }
    return $contenido;
}

// Obtener el método HTTP de la solicitud
$metodo = $_SERVER['REQUEST_METHOD'];

// Enrutamiento básico basado en el método HTTP y la URL
// 3. Verificar si entra en la condición
$message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Antes de la condición.\n";
file_put_contents($log_file, $message, FILE_APPEND);

if (strpos($_SERVER['REQUEST_URI'], '/usuarios') !== false) {
    $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Dentro de la condición.\n";
    file_put_contents($log_file, $message, FILE_APPEND);

    $contenido = obtenerUsuarios(); // Obtener el contenido del archivo o false si hay error
    if ($contenido === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al leer el archivo de usuarios']);
        exit; // Importante: terminar la ejecución del script
    }

    // 6. Verificar si el JSON se decodifica correctamente
    $usuarios = json_decode($contenido, true);

    if ($usuarios === null && json_last_error() !== JSON_ERROR_NONE) {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. ¡Error al decodificar el JSON! Error: " . json_last_error_msg() . "\n";
        file_put_contents($log_file, $message, FILE_APPEND);
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error al decodificar el JSON: ' . json_last_error_msg()]);
        exit; // Importante: terminar la ejecución del script
    } else {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. JSON decodificado correctamente.\n";
        file_put_contents($log_file, $message, FILE_APPEND);
    }

    // 7. Verificar si el array $usuarios tiene datos
    if (empty($usuarios)) {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. El array \$usuarios está vacío.\n";
        file_put_contents($log_file, $message, FILE_APPEND);
    } else {
        $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. El array \$usuarios tiene datos.\n";
        file_put_contents($log_file, $message, FILE_APPEND);
    }

    // 8. Verificar el JSON que se está enviando como respuesta
    $json_response = json_encode($usuarios);
    $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. JSON de respuesta: " . $json_response . "\n";
    file_put_contents($log_file, $message, FILE_APPEND);

    echo $json_response;

} else {
    $message = date('Y-m-d H:i:s') . " - index.php ejecutándose. Fuera de la condición.\n";
    file_put_contents($log_file, $message, FILE_APPEND);
    http_response_code(404);
    echo json_encode(['error' => 'Recurso no encontrado']);
}
?>