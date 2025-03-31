<?php

$log_file = '/var/log/myapp/api.log';

// Función para registrar mensajes en el archivo de registro
function logMessage(string $message): void
{
    global $log_file;
    $logEntry = date('Y-m-d H:i:s') . " - index.php ejecutándose. " . $message . "\n";
    file_put_contents($log_file, $logEntry, FILE_APPEND);
}

// Función para obtener datos desde un archivo JSON
function obtenerDatos(string $tipo): array|false
{
    $archivo = '/data/' . $tipo . '.json'; // Ruta completa al archivo JSON

    logMessage("Intentando leer el archivo: " . $archivo);

    if (!file_exists($archivo)) {
        logMessage("¡El archivo NO existe: " . $archivo . "!");
        return false;
    }

    $contenido = file_get_contents($archivo);

    if ($contenido === false) {
        logMessage("¡Error al leer el archivo: " . $archivo . "!");
        return false;
    }

    $datos = json_decode($contenido, true);

    if ($datos === null && json_last_error() !== JSON_ERROR_NONE) {
        logMessage("¡Error al decodificar el JSON! Error: " . json_last_error_msg());
        return false;
    }

    logMessage("Archivo leído y decodificado correctamente.");
    return $datos;
}

// Configuración CORS (Cross-Origin Resource Sharing)
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

logMessage("index.php ejecutándose. Método: " . $_SERVER['REQUEST_METHOD']);
logMessage("index.php ejecutándose. Ruta: " . $_SERVER['REQUEST_URI']);

// Obtener el tipo de datos a mostrar desde la URL (GET)
$tipo = $_GET['tipo'] ?? ''; // Usar operador null coalescing para valor predeterminado

logMessage("Tipo de datos solicitado: " . $tipo);

if (in_array($tipo, ['usuarios', 'clientes', 'productos'])) {

    $datos = obtenerDatos($tipo);

    if ($datos === false) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error al obtener los datos de ' . $tipo]);
        exit;
    }

    if (empty($datos)) {
        logMessage("El array de datos está vacío.");
    } else {
        logMessage("El array de datos tiene datos.");
    }

    $json_response = json_encode($datos);
    logMessage("JSON de respuesta: " . $json_response);

    echo $json_response;

} else {
    logMessage("Tipo de datos no válido o no especificado.");
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Tipo de datos no válido. Debe ser usuarios, clientes o productos.']);
}
?>