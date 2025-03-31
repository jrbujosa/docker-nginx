<?php
// --- Cálculos de datos (mejor hacerlos antes de empezar el HTML) ---

// Contadores totales
$getCountTotal = count($_GET);
$postCountTotal = count($_POST);

// Contadores de variables con valor (no vacías '', null, false, 0)
// Usamos array_filter sin callback para eliminar valores "vacíos"
$getCountDefined = count(array_filter($_GET));
$postCountDefined = count(array_filter($_POST));

// Representación en string de los arrays (protegido contra XSS)
// Usamos var_export para una representación más formal y leíble que print_r
// El 'true' como segundo argumento hace que devuelva el string en lugar de imprimirlo
$getArrayString = htmlspecialchars(var_export($_GET, true), ENT_QUOTES, 'UTF-8');
$postArrayString = htmlspecialchars(var_export($_POST, true), ENT_QUOTES, 'UTF-8');

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Datos Recibidos del Formulario</title>
    <style>
        /* --- Estilos Generales --- */
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            background-color: #f4f7f9; /* Fondo gris muy claro */
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 30px;
            display: flex;
            justify-content: center;
            align-items: flex-start; /* Alinear arriba por si el contenido es corto */
            min-height: 100vh;
        }

        .container {
            background-color: #ffffff;
            padding: 30px 40px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            max-width: 800px; /* Ancho máximo */
            width: 100%;
            box-sizing: border-box;
        }

        h1 {
            text-align: center;
            color: #2c3e50; /* Azul oscuro */
            margin-bottom: 30px;
            font-weight: 600;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }

        /* --- Estilos de la Tabla --- */
        table {
            width: 100%;
            border-collapse: collapse; /* Bordes juntos */
            margin-top: 20px;
            table-layout: fixed; /* Ancho de columnas más uniforme */
        }

        th, td {
            padding: 12px 15px;
            text-align: left;
            border: 1px solid #e0e0e0; /* Bordes grises claros */
        }

        thead th {
            background-color: #34495e; /* Azul pizarra */
            color: white;
            font-weight: 600;
            font-size: 1.1em;
        }

        /* Cabecera de fila (Descripción) */
        tbody th {
             background-color: #f8f9fa; /* Fondo muy claro para cabecera de fila */
             font-weight: 600;
             color: #495057;
             width: 25%; /* Ancho fijo para la primera columna */
             vertical-align: top; /* Alinear arriba */
        }

        tbody tr:nth-child(even) {
             background-color: #fdfdfd; /* Alternar color de filas (muy sutil) */
        }

        tbody tr:hover {
             background-color: #f1f5f8; /* Resaltar fila al pasar el ratón */
        }

        td {
             vertical-align: top; /* Alinear contenido de celdas arriba */
             word-wrap: break-word; /* Romper palabras largas si es necesario */
        }

        /* Estilo para el array preformateado */
        td pre {
            background-color: #e9ecef; /* Fondo gris claro para el código */
            padding: 10px;
            border-radius: 4px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 0.9em;
            white-space: pre-wrap;       /* Respetar espacios y saltos, ajustar línea */
            word-wrap: break-word;       /* Romper palabras si exceden */
            max-height: 300px; /* Altura máxima con scroll si es muy largo */
            overflow-y: auto;  /* Añadir scroll vertical si se excede */
            margin: 0; /* Quitar margen por defecto de pre */
        }

    </style>
</head>
<body>

    <div class="container">
        <h1>Resumen de Datos Recibidos</h1>

        <table>
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Método GET</th>
                    <th>Método POST</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row">Total variables enviadas:</th>
                    <td><?= $getCountTotal ?></td>
                    <td><?= $postCountTotal ?></td>
                </tr>
                <tr>
                    <th scope="row">Variables con valor definido*:</th>
                    <td><?= $getCountDefined ?></td>
                    <td><?= $postCountDefined ?></td>
                </tr>
                <tr>
                    <th scope="row">Array Completo:</th>
                    <td><pre><code><?= $getArrayString ?></code></pre></td>
                    <td><pre><code><?= $postArrayString ?></code></pre></td>
                </tr>
            </tbody>
        </table>
        <p style="font-size: 0.8em; color: #666; margin-top: 15px;">
            * Se consideran "definidas" las variables cuyo valor no es una cadena vacía (''), null, false o 0.
        </p>
    </div>

</body>
</html>