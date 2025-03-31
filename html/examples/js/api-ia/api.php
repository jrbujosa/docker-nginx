<?php
// Habilitar CORS para permitir peticiones desde tu dominio (localhost en desarrollo)
header('Access-Control-Allow-Origin: *'); // ¡Precaución en producción! Limita el origen.
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
http_response_code(200);
exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
http_response_code(405); // Method Not Allowed
echo json_encode(['error' => 'Solo se aceptan peticiones POST']);
exit();
}

$apiKey = getenv('GEMMA_API_KEY'); // Usamos GEMINI_API_KEY por consistencia con el ejemplo curl
$gemmaApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

if (empty($apiKey)) {
http_response_code(500);
echo json_encode(['error' => 'Clave de API de Gemini no configurada en el servidor.']);
exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);
$prompt = $data['prompt'] ?? '';

if (empty($prompt)) {
http_response_code(400);
echo json_encode(['error' => 'El campo "prompt" es requerido.']);
exit();
}

$payload = json_encode([
'contents' => [
['parts' => [['text' => $prompt]]]
]
]);

$urlConClave = $gemmaApiUrl . '?key=' . $apiKey;

$ch = curl_init($urlConClave);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
http_response_code(500);
echo json_encode(['error' => 'Error al contactar la API de Gemini: ' . curl_error($ch)]);
} else {
http_response_code($httpCode);
echo $response; // Devuelve la respuesta de la API de Gemini
}

curl_close($ch);
?>