import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Melodika API',
    description: 'Documentación de los endpoints del backend de Melodika.',
    version: '1.0.0'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor Local' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresá el token que te devuelve el login (sin la palabra Bearer).'
      }
    },
    schemas: {
      LoginUsuario: {
        $email: "usuario@ejemplo.com",
        $password: "Password123!"
      },
      RegistroUsuario: {
        $email: "usuario@ejemplo.com",
        $password: "Password123!",
        $nombre: "Juan",
        $apellido: "Perez",
        $telefono: "1123456789"
      },
      CrearPerfil: {
        $nombre: "Facundo",
        $username: "facu_pro",
        fecha_nacimiento: "2005-11-18",
        genero: "Masculino",
        pais: "Argentina",
        avatarUrl: "https://ejemplo.com/avatar.jpg",
        esZurdo: false
      },
      ActualizarPerfil: {
        nombre: "Facundo Editado",
        fecha_nacimiento: "2005-11-18",
        genero: "Masculino",
        pais: "Uruguay",
        avatarUrl: "https://ejemplo.com/avatar2.jpg",
        esPublico: true,
        esZurdo: false
      },
      EnviarSolicitud: {
        destinoId: "uuid-del-perfil-destino",
        username: "facu_pro",
        token: "token-de-22-caracteres"
      },
      ResponderSolicitud: {
        $accion: "aceptar"
      },
      CrearGrupo: {
        $nombre: "Guitarristas Principiantes",
        descripcion: "Grupo para compartir avances",
        miembroIds: ["uuid-de-un-amigo"]
      },
      MensajeGrupo: {
        $contenido: "Hola a todos!"
      },
      MensajeContacto: {
        $tipo: "feedback",
        categoria: "general",
        $mensaje: "Me gusta la app, pero..."
      },
      RefreshToken: {
        $refreshToken: "refresh-token-del-login"
      },
      AccionCurso: {
        $perfilId: "uuid-del-perfil"
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const autogen = swaggerAutogen({ openapi: '3.0.0' });
autogen('./swagger-output.json', ['./src/index.js'], doc).then(() => {
    console.log("Documentación generada con éxito.");
});