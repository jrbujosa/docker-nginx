document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const errorDisplay = document.getElementById('error-display');

    // URL base de la API (relativa al dominio/puerto de Nginx)
    // El navegador enviará la petición a Nginx (ej: http://localhost:8080/api/tasks)
    // Nginx la reenviará internamente a http://api:3000/tasks
    const apiUrl = '/api/tasks';

    // --- Funciones Auxiliares ---

    /** Muestra un mensaje de error en el UI */
    function displayError(message) {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        // Limpia el error después de 5 segundos
        setTimeout(() => {
             errorDisplay.textContent = '';
             errorDisplay.style.display = 'none';
        }, 5000);
    }

    /** Limpia la lista de tareas y las vuelve a dibujar desde un array */
    function renderTasks(tasks) {
        // Limpiar lista actual
        taskList.innerHTML = '';
        errorDisplay.style.display = 'none'; // Oculta errores previos

        if (!tasks || tasks.length === 0) {
            taskList.innerHTML = '<li>No hay tareas pendientes. ¡Añade una!</li>';
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.text;
            li.dataset.id = task.id; // Guardar ID por si se implementa borrar/editar
            if (task.completed) {
                li.classList.add('completed');
            }
            // Podrías añadir botones de completar/borrar aquí
            taskList.appendChild(li);
        });
    }

    // --- Funciones API ---

    /** Obtiene las tareas de la API y las renderiza */
    async function fetchTasks() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                // Si la respuesta no es OK (ej: 404, 500), lanza un error
                throw new Error(`Error ${response.status}: ${response.statusText || 'No se pudo conectar a la API'}`);
            }
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error("Error al obtener tareas:", error);
            taskList.innerHTML = ''; // Limpia la lista en caso de error
            displayError(`Error al cargar tareas: ${error.message}. ¿Está la API funcionando?`);
        }
    }

    /** Envía una nueva tarea a la API y actualiza la lista */
    async function addTask() {
        const taskText = newTaskInput.value.trim();

        if (!taskText) {
            displayError("Por favor, introduce el texto de la tarea.");
            newTaskInput.focus();
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: taskText }), // Envía el texto en el body JSON
            });

            if (!response.ok) {
                 // Intenta leer el error del body si es JSON
                 let errorMsg = `Error ${response.status}: ${response.statusText || 'Fallo al añadir tarea'}`;
                 try {
                      const errorData = await response.json();
                      if (errorData.error) errorMsg += ` - ${errorData.error}`;
                 } catch (e) { /* Ignora si el body no es JSON */ }
                 throw new Error(errorMsg);
            }

            // Si la tarea se añadió correctamente:
            newTaskInput.value = ''; // Limpiar el campo de entrada
            await fetchTasks();     // Recargar la lista de tareas para mostrar la nueva
            newTaskInput.focus();   // Poner foco de nuevo en el input

        } catch (error) {
            console.error("Error al añadir tarea:", error);
            displayError(`Error al añadir tarea: ${error.message}`);
        }
    }

    // --- Event Listeners ---

    // Añadir tarea al hacer clic en el botón
    addTaskButton.addEventListener('click', addTask);

    // Añadir tarea al presionar Enter en el input
    newTaskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    // --- Carga Inicial ---
    // Obtener y mostrar las tareas cuando la página cargue
    fetchTasks();
});