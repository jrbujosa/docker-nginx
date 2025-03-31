// ./api/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000; // Puerto interno en el que escucha el servidor Node.js

// --- Middleware ---
// Habilita CORS para permitir peticiones desde el frontend (localhost:8080 vía Nginx)
app.use(cors());
// Permite parsear el body de las peticiones POST/PUT con formato JSON (Crucial para POST /tasks)
app.use(express.json());

// --- Base de Datos en Memoria (Simple para el ejemplo) ---

// Datos y lógica para TAREAS (del ejemplo "antiguo")
let tasks = [
    // Asegúrate de que la estructura coincida con lo que espera tu frontend y tu lógica POST
    // Usando 'text' como en tu ejemplo "antiguo"
    { id: 1, text: "Configurar Docker Compose", completed: true },
    { id: 2, text: "Crear API Node.js", completed: true },
    { id: 3, text: "Desarrollar Frontend", completed: false },
    { id: 4, text: "Probar la aplicación", completed: false }
];
let nextTaskId = 5; // Para generar IDs de nuevas tareas

// Datos para PRODUCTOS (añadidos)
const products = [
    { id: 101, name: 'Laptop Pro', price: 1200.50 },
    { id: 102, name: 'Teclado Mecánico RGB', price: 75.99 },
    { id: 103, name: 'Monitor UltraWide', price: 399.00 },
    { id: 104, name: 'Webcam HD', price: 45.00 }
];

// --- Rutas de la API ---

// Ruta Raíz de Bienvenida (Opcional pero útil)
app.get('/', (req, res) => {
    res.status(200).send('¡Bienvenido a la API combinada de Tareas y Productos!');
});

// --- Rutas de TAREAS ---

// GET /tasks: Devuelve todas las tareas
app.get('/tasks', (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /tasks solicitado`);
    // Devuelve el array actual de tareas
    res.status(200).json(tasks);
});

// POST /tasks: Añade una nueva tarea (Mantenido del ejemplo "antiguo")
app.post('/tasks', (req, res) => {
    // El middleware express.json() ya ha parseado el body si venía como JSON
    const taskText = req.body.text; // Accedemos al campo 'text' del body
    console.log(`[${new Date().toISOString()}] POST /tasks recibido - Body:`, req.body);

    // Validación básica del input
    if (!taskText || typeof taskText !== 'string' || taskText.trim() === '') {
        console.error('Error en POST /tasks: Falta el campo "text" o está vacío.');
        // Devuelve un error 400 (Bad Request) si la validación falla
        return res.status(400).json({ error: "El campo 'text' es requerido y debe ser un string no vacío." });
    }

    // Crea el objeto de la nueva tarea
    const newTask = {
        id: nextTaskId++,          // Asigna el siguiente ID y lo incrementa
        text: taskText.trim(),     // Usa el texto recibido (quitando espacios extra)
        completed: false           // Las nuevas tareas empiezan como no completadas
    };

    // Añade la nueva tarea al array en memoria
    tasks.push(newTask);
    console.log('Nueva tarea añadida:', newTask);

    // Devuelve la tarea recién creada con el status 201 (Created)
    // Es buena práctica devolver el recurso creado
    res.status(201).json(newTask);
});

// --- Rutas de PRODUCTOS (Añadida) ---

// GET /products: Devuelve todos los productos
app.get('/products', (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /products solicitado`);
    // Devuelve el array de productos
    res.status(200).json(products);
});


// --- Iniciar Servidor ---
app.listen(port, () => {
    // Este log se verá en la salida del contenedor 'api' (ej. usando 'docker compose logs api')
    console.log(`Servidor API Express escuchando en http://localhost:${port} (dentro del contenedor 'api')`);
    console.log('Rutas disponibles: GET /, GET /tasks, POST /tasks, GET /products');
});