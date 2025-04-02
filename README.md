# Instalación de los Ejercicios
## Prerequisitos

- Debe estar instalado Docker
- Debe estar instalado Docker Compose

# Detener y borrar contenedores existentes con el mismo nombre(si aplica)

Si has ejecutado este clone antes, debes elimina los contenedores asociados:

* nginx_server
* php_server
* node_api_server

## Pasos para detener y borrar contenedores:

Para ver los contenedores en ejecución:
```bash 
docker ps
```

## Detén los contenedores necesarios (reemplaza los nombres):
```bash 
docker stop nginx_server php_server node_api_server
```

## Elimina los contenedores necesarios (reemplaza los nombres):
```bash 
docker rm nginx_server php_server node_api_server
```

# Comprobar disponibilidad del puerto 8080

Verifica qué contenedores están usando puertos con:

```bash 
docker ps
```

Si algún otro contenedor (no relacionado con este proyecto) está usando el puerto 8080, necesitarás detener ese contenedor o cambiar el puerto en el archivo docker-compose.yml de este proyecto.

# Borra el directorio docker-nginx.git de tu equipo

# Clonar este repositorio
```bash 
git clone https://github.com/jrbujosa/docker-nginx.git
```

# Abrir una terminal y navegar hasta la carpeta docker-nginx
```bash 
cd docker-nginx
```
# Obtener una clave para Google IA Studio


- Ir a [Google IA Studio](https://aistudio.google.com/prompts/new_chat)
- Pulsar Get API Key arriba a la derecha
- Obtener una clave
- Ir a la carpeta docker-nginx
- crear un fichero .env
- Incluir la clave en .env
- GEMMA_API_KEY=(Tu clave)
- Guardar el fichero

# (Opcional) Editar la configuración del fichero compose.yml

# Crear los contenedores ejecutando
```bash 
docker compose up -d

```

# Ejecutar npm (Node Package Manager), el gestor de paquetes por defecto para Node.js.
```bash 
cd docker-nginx\api
npm install
```


# Después de ejecutar docker-compose up -d, Puedes verificar el estado de los contenedores utilizando el comando
```bash 
docker ps
```

- Puedes ver los logs de un contenedor específico utilizando el comando
```bash 
docker logs <nombre_del_servicio>
```

- Para detener los contenedores, puedes usar el comando
```bash 
docker-compose down
```
# Acceder al servidor web desde tu navegador

[http://localhost:8080/index.html](http://localhost:8080/index.html)

# Entrar en un contenedor en el contenedor nginx_server:
```bash 
docker exec -it nginx_server sh
docker exec -it php_server sh
```

# Para recargar el repositorio nuevamente

* Debes de estar dentro del directorio del repositorio clonado en su máquina local
* Idealmente, debería estar en la rama que quiere actualizar (normalmente main). Si no está seguro, puede ejecutar git status para ver la rama actual o git checkout main para cambiarse a ella.
* Importante: No debe tener cambios locales sin confirmar (commit) que entren en conflicto con los cambios que vienen del remoto. Es buena práctica ejecutar git status antes de git pull para ver el estado local. Si hay cambios locales, debería hacer commit o stash antes de hacer pull.
* Ejecuta:  
```bash 
git pull
```