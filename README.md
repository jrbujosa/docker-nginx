# Instalación de los Ejercicios
## Prerequisitos

- Debe estar instalado Docker
- Debe estar instalado Docker Compose

0.- Detener y borrar contenedores existentes (si aplica)
Si has ejecutado este proyecto antes, debes elimina los contenedores asociados:

- nginx_server
- php_server
- node_api_server

0.1 Pasos para detener y borrar contenedores:

Para ver los contenedores en ejecución:

docker ps

Detén los contenedores necesarios (reemplaza los nombres):

docker stop nginx_server php_server node_api_server

Elimina los contenedores necesarios (reemplaza los nombres):

docker rm nginx_server php_server node_api_server
0.2.- Comprobar disponibilidad del puerto 8080

Verifica qué contenedores están usando puertos con:

docker ps

Si algún otro contenedor (no relacionado con este proyecto) está usando el puerto 8080, necesitarás detener ese contenedor o cambiar el puerto en el archivo docker-compose.yml de este proyecto.

1.- Clonar este repositorio
```bash 
git clone https://github.com/jrbujosa/docker-nginx.git

2.- Abrir una terminal y navegar hasta la carpeta docker-nginx
```bash 

cd docker-nginx

3.- (Opcional) Editar la configuración del fichero compose.yml

4. Crear los contenedores ejecutando
```bash 
docker compose up -d

5. Después de ejecutar docker-compose up -d
```bash 

- Puedes verificar el estado de los contenedores utilizando el comando
docker ps

- Puedes ver los logs de un contenedor específico utilizando el comando
docker logs <nombre_del_servicio>.

- Para detener los contenedores, puedes usar el comando
docker-compose down

6.- Acceder al servidor web desde tu navegador

 http://localhost:8080

7.- Entrar en un contenedor en el contenedor nginx_server:

docker exec -it nginx_server sh
docker exec -it php_server sh

8.- Si surjen problemas:

- Detener todos los contenedores 

cd docker-nginx
docker down