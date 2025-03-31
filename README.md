# Instalación de los Ejercicios
## Prerequisitos

- Debe estar instalado Docker
- Debe estar instalado Docker Compose

## Instalación

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