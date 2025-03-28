// ./api/server.js
const express = require('express');
const cors = require('cors'); // Importa cors
const app = express();
const port = 3000; // Puerto interno en el que escucha el servidor Node.js

// --- Middleware ---
// Habilita CORS para permitir peticiones desde Nginx (u otros orígenes si fuera necesario)
app.use(cors());
// Permite parsear el body de las peticiones POST/PUT con formato JSON
app.use(express.json());

// --- Base de Datos en Memoria (Simple para el ejemplo) ---
let tasks = [
    { id: 1, text: "Configurar Docker Compose", completed: true },
    { id: 2, text: "Crear API Node.js", completed: true },
    { id: 3, text: "Desarrollar Frontend", completed: false },
    { id: 4, text: "Probar la aplicación", completed: false }
];
let nextId = 5; // Para generar IDs de nuevas tareas

// --- Rutas de la API ---

// GET /tasks: Devuelve todas las tareas
app.get('/tasks', (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /tasks`);
    res.status(200).json(tasks);
});

// POST /tasks: Añade una nueva tarea
app.post('/tasks', (req, res) => {
    console.log(`[${new Date().toISOString()}] POST /tasks - Body:`, req.body);
    const taskText = req.body.text;

    if (!taskText || typeof taskText !== 'string' || taskText.trim() === '') {
        // Validación básica
        return res.status(400).json({ error: "El campo 'text' es requerido y debe ser un string no vacío." });
    }

    const newTask = {
        id: nextId++,
        text: taskText.trim(),
        completed: false
    };
    tasks.push(newTask);

    // Devuelve la tarea creada con el status 201 (Created)
    res.status(201).json(newTask);
});

// --- Iniciar Servidor ---
app.listen(port, () => {
    console.log(`Servidor API escuchando en http://localhost:${port} (dentro del contenedor)`);
});