// ./html/node/script.js

// --- Selectores DOM ---
const fetchTasksBtn = document.getElementById('fetchTasksBtn');
const taskListUl = document.getElementById('taskList');
const fetchProductsBtn = document.getElementById('fetchProductsBtn');
const productListUl = document.getElementById('productList');
const addTaskForm = document.getElementById('addTaskForm');
const newTaskInput = document.getElementById('newTaskInput');
const errorMessageDiv = document.getElementById('error-message');

// --- Constantes ---
const API_BASE_URL = 'http://localhost:8080/api'; // URL base para Nginx

// --- Funciones Auxiliares ---

// Limpia el mensaje de error
function clearError() {
    errorMessageDiv.textContent = '';
}

// Muestra un mensaje de error
function displayError(message) {
    console.error('Error:', message); // También loguea en consola
    errorMessageDiv.textContent = `Error: ${message}`;
}

// Añade un elemento de tarea a la lista UL
function appendTaskToList(task) {
    const li = document.createElement('li');
    const span = document.createElement('span'); // Para aplicar estilo si está completada
    span.textContent = task.text; // Usa 'text' como en server.js
    if (task.completed) {
        li.classList.add('completed');
    }
    li.appendChild(span);
    // Podrías añadir botones de completar/eliminar aquí en el futuro
    taskListUl.appendChild(li);
}

// Añade un elemento de producto a la lista UL
function appendProductToList(product) {
    const li = document.createElement('li');
    li.textContent = `${product.name} - $${product.price.toFixed(2)}`;
    productListUl.appendChild(li);
}

// --- Lógica para TAREAS (GET) ---
async function fetchAndDisplayTasks() {
    clearError();
    taskListUl.innerHTML = '<li>Cargando tareas...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
            throw new Error(`Error HTTP al obtener tareas: ${response.status} ${response.statusText}`);
        }
        const tasks = await response.json();
        console.log('Tareas recibidas:', tasks);
        taskListUl.innerHTML = ''; // Limpia antes de añadir

        if (tasks.length === 0) {
            taskListUl.innerHTML = '<li>No hay tareas pendientes. ¡Añade una!</li>';
        } else {
            tasks.forEach(appendTaskToList); // Usa la función auxiliar
        }
    } catch (error) {
        displayError(error.message);
        taskListUl.innerHTML = '<li>Error al cargar tareas.</li>';
    }
}

// --- Lógica para TAREAS (POST) ---
async function addNewTask(event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    clearError();

    const taskText = newTaskInput.value.trim();

    if (!taskText) {
        displayError('La descripción de la tarea no puede estar vacía.');
        return; // No envíes nada si está vacío
    }

    console.log('Enviando nueva tarea:', taskText);

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Indica que enviamos JSON
            },
            // Convierte el objeto JS a una cadena JSON para el body
            body: JSON.stringify({ text: taskText }) // Asegúrate que la clave 'text' coincida con server.js
        });

        if (!response.ok) {
            // Intenta obtener un mensaje de error del cuerpo de la respuesta si es posible
            let errorMsg = `Error HTTP al añadir tarea: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMsg = errorData.error; // Usa el mensaje del servidor si existe
                }
            } catch (jsonError) {
                // No hacer nada si el cuerpo del error no es JSON válido
            }
            throw new Error(errorMsg);
        }

        const newTask = await response.json(); // El servidor devuelve la tarea creada
        console.log('Tarea añadida con éxito:', newTask);

        appendTaskToList(newTask); // Añade la nueva tarea directamente a la lista (más eficiente que recargar todo)
        newTaskInput.value = ''; // Limpia el input

    } catch (error) {
        displayError(error.message);
    }
}

// --- Lógica para PRODUCTOS (GET) ---
async function fetchAndDisplayProducts() {
    clearError();
    productListUl.innerHTML = '<li>Cargando productos...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`Error HTTP al obtener productos: ${response.status} ${response.statusText}`);
        }
        const products = await response.json();
        console.log('Productos recibidos:', products);
        productListUl.innerHTML = '';

        if (products.length === 0) {
            productListUl.innerHTML = '<li>No hay productos disponibles.</li>';
        } else {
            products.forEach(appendProductToList);
        }
    } catch (error) {
        displayError(error.message);
        productListUl.innerHTML = '<li>Error al cargar productos.</li>';
    }
}


// --- Event Listeners ---
fetchTasksBtn.addEventListener('click', fetchAndDisplayTasks);
addTaskForm.addEventListener('submit', addNewTask); // Escucha el 'submit' del formulario
fetchProductsBtn.addEventListener('click', fetchAndDisplayProducts);

// --- Carga Inicial (Opcional) ---
// Puedes descomentar la siguiente línea si quieres que las tareas se carguen al abrir la página:
// document.addEventListener('DOMContentLoaded', fetchAndDisplayTasks);