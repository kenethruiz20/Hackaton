### Guía de Despliegue Completa - Proyecto Hackaton (Aplicación de Gestión de Contactos)

Esta guía proporciona instrucciones detalladas para desplegar la aplicación de gestión de contactos utilizando Docker, AWS (para la base de datos en RDS y alojamiento de frontend en S3) y Google Cloud Platform (GCP) para Kubernetes. 

---

### Índice
1. Preparación
2. Configuración del Backend
   - Configuración de la Base de Datos en AWS RDS
   - Creación y Publicación de la Imagen en Docker Hub
   - Configuración del Clúster de Kubernetes en GCP
   - Despliegue del Backend en Kubernetes
3. Configuración del Frontend
   - Configuración de Alojamiento Estático en AWS S3
   - Configuración de CORS
   - Acceso y Verificación del Sitio Web

---

### 1. Preparación

#### Clonar el Repositorio
Clona el repositorio de tu proyecto desde GitHub a tu máquina local. Esto descargará todos los archivos necesarios.

```bash
git clone https://github.com/kenethruiz20/hackaton.git
cd hackaton
```

---

### 2. Configuración del Backend

#### Configuración de la Base de Datos en AWS RDS

1. Inicia sesión en la consola de AWS y navega a RDS.
2. Crea una nueva instancia de MySQL con las siguientes configuraciones:
   - **Engine**: MySQL
   - **DB instance class**: `db.t3.micro` (free tier)
   - **Storage**: 20 GB (SSD)
   - **Public access**: Yes
   - **Security group**: Crea un nuevo grupo de seguridad llamado `hackaton-db-sg`
3. Establece las credenciales de la base de datos:
   - **Master username**: `admin`
   - **Master password**: `proyecto-cloud`

#### Configuración del Grupo de Seguridad
1. Ve a EC2 > Security Groups y selecciona `hackaton-db-sg`.
2. Añade una regla de entrada para permitir el tráfico desde cualquier lugar:
   - **Type**: MySQL/Aurora
   - **Port**: 3306
   - **Source**: `0.0.0.0/0`

#### Guardar la Información de Conexión
Toma nota de los siguientes datos, que necesitarás más adelante:
- Endpoint (URL del RDS)
- Puerto: `3306`
- Usuario: `admin`
- Contraseña: `proyecto-cloud`
- Base de datos: `contacts_db`

#### Crear la Base de Datos
Accede a MySQL usando un cliente como MySQL Workbench o mediante la CLI y crea la base de datos `contacts_db`.

---

### Creación y Publicación de la Imagen en Docker Hub

1. **Construir la Imagen Docker**: Desde la carpeta del proyecto, ejecuta el siguiente comando para crear una imagen Docker del backend Flask:
   ```bash
   docker build -t flask-app .
   ```

2. **Iniciar sesión en Docker Hub**:
   ```bash
   docker login
   ```

3. **Etiquetar la Imagen**: Cambia el nombre de la imagen para que incluya tu usuario de Docker Hub:
   ```bash
   docker tag flask-app:latest tu-usuario/flask-app:latest
   ```

4. **Subir la Imagen**:
   ```bash
   docker push tu-usuario/flask-app:latest
   ```

   > Nota: Sustituye `tu-usuario` por tu nombre de usuario de Docker Hub.

---

### Configuración del Clúster de Kubernetes en GCP

1. **Instalar Google Cloud SDK**: Asegúrate de tener instalado `gcloud` y `kubectl`.
   ```bash
   gcloud components install kubectl
   gcloud auth login
   ```

2. **Configurar el Proyecto en GCP**:
   ```bash
   gcloud config set project dota-440301
   ```

3. **Crear un Clúster de Kubernetes**:
   ```bash
   gcloud container clusters create hackaton-cluster \
       --zone us-central1-c \
       --num-nodes 3 \
       --machine-type n1-standard-1
   ```

4. **Obtener Credenciales del Clúster**:
   ```bash
   gcloud container clusters get-credentials hackaton-cluster --zone us-central1-c
   ```

#### Crear Secretos en Kubernetes para la Base de Datos
1. Crea un secreto en Kubernetes para almacenar la URL de conexión de la base de datos:
   ```bash
   kubectl create secret generic db-credentials \
       --from-literal=DATABASE_URL="mysql+pymysql://admin:proyecto-cloud@[RDS-endpoint]:3306/contacts_db"
   ```
   > Sustituye `[RDS-endpoint]` por el endpoint de tu base de datos en RDS.

#### Aplicar Configuraciones de Kubernetes
1. Asegúrate de que el archivo `deployment.yaml` esté configurado para usar la imagen de Docker publicada (`tu-usuario/flask-app:latest`).
2. Ejecuta los siguientes comandos para desplegar el backend en Kubernetes:
   ```bash
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

#### Verificación del Backend en Kubernetes
1. **Verificar el Estado de los Pods**:
   ```bash
   kubectl get pods
   ```

2. **Obtener la IP Externa del Servicio**:
   ```bash
   kubectl get services backend-service
   ```

3. **Revisar Logs para Solución de Problemas**:
   ```bash
   kubectl logs -l app=backend
   ```

---

### 3. Configuración del Frontend en AWS S3

#### Preparar los Archivos para Producción
1. Modifica `app.js` para que `API_URL` apunte a la dirección IP del backend desplegado en Kubernetes.
   ```javascript
   const API_URL = "http://[Kubernetes-External-IP]:8080"; // Reemplaza [Kubernetes-External-IP] con la IP del servicio backend en Kubernetes
   ```

2. **Construir el Frontend**: (si tienes un proceso de construcción, por ejemplo, con React o Vue)
   ```bash
   npm run build
   ```

#### Crear un Bucket en S3
1. Ve a AWS S3 en la consola de AWS.
2. Crea un bucket y configura lo siguiente:
   - **Bucket name**: `hackaton-frontend-bucket`
   - **Region**: Selecciona la región más cercana a tus usuarios.
   - **Block Public Access settings**: Desactiva la opción `Block all public access`.

#### Configurar el Alojamiento Estático
1. Selecciona el bucket en S3.
2. Ve a **Properties** > **Static website hosting** y habilita el alojamiento estático:
   - **Index document**: `index.html`
   - **Error document**: `index.html`

#### Configurar la Política de Permisos del Bucket
1. En la pestaña **Permissions**, ve a **Bucket policy** y pega la siguiente política:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::hackaton-frontend-bucket/*"
       }
     ]
   }
   ```

#### Configurar CORS (Cross-Origin Resource Sharing)
1. En la pestaña **Permissions**, configura CORS para permitir solicitudes desde el dominio del backend:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

#### Subir Archivos al Bucket S3
1. En la pestaña **Objects**, haz clic en **Upload** y selecciona todos los archivos del frontend (incluyendo `index.html` , `app.js`, `styles.css`).
2. Asegúrate de mantener la estructura de carpetas.

#### Acceder al Sitio Web
1. Después de configurar el alojamiento estático, en **Static website hosting** encontrarás la URL pública del sitio (por ejemplo, `http://hackaton-frontend-bucket.s3-website-region.amazonaws.com`).
2. Verifica que el frontend se muestra correctamente y que puede conectarse al backend.

---

### Verificación y Pruebas Finales

1. **Prueba de Conexión con el Backend**: Abre la aplicación en el navegador e intenta agregar, editar y eliminar contactos para asegurarte de que la conexión con el backend funciona.
2. **Prueba de CORS**: Asegúrate de que no haya errores relacionados con CORS en la consola del navegador.
3. **Revisión de Logs en Kubernetes**: Monitorea los logs en Kubernetes para solucionar posibles errores.

---

### Solución de Problemas Comunes

1. **Problemas de CORS**: Asegúrate de que la configuración de CORS en el bucket S3 y el backend permite el acceso entre dominios.
2. **Errores en la Conexión a la Base de Datos**: Revisa los secretos en Kubernetes y la URL de conexión en `DATABASE_URL`.
3. **Pods No Inician en Kubernetes**

: Usa `kubectl describe pod [nombre-del-pod]` para obtener más detalles.

---
