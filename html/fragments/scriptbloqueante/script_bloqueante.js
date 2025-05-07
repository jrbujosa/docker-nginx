
// Simulamos una tarea síncrona y larga que bloquea el hilo principal.
const tiempoDeBloqueo = 5000; // 5 segundos
const inicio = Date.now();

while (Date.now() - inicio < tiempoDeBloqueo) {
    // Este bucle mantiene ocupado el procesador, simulando un script pesado.
}
