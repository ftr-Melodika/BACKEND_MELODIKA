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
        avatarUrl: "https://ejemplo.com/avatar.jpg"
      },
      ActualizarPerfil: {
        nombre: "Facundo Editado",
        fecha_nacimiento: "2005-11-18",
        genero: "Masculino",
        pais: "Uruguay",
        avatarUrl: "https://ejemplo.com/avatar2.jpg"
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