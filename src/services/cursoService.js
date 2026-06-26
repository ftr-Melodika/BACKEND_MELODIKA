import CursoRepository from "../repositories/cursoRepository.js";

const cursoRepository = new CursoRepository();

// MOCK DE CURSOS (Con UUIDs válidos)
const CURSOS_MOCK = [
    { id: "a1b2c3d4-0000-4000-a000-000000000001", nombre: "Introducción a la Guitarra", descripcion: "Conoce tu instrumento, aprende a afinar y toca tus primeros ritmos.", nivel: "principiante", orden: 1 },
    { id: "a1b2c3d4-0000-4000-a000-000000000002", nombre: "Ritmos y Rasgueos Básicos", descripcion: "Domina la mano derecha y aprende los ritmos más populares del pop y rock.", nivel: "principiante", orden: 2 },
    { id: "a1b2c3d4-0000-4000-a000-000000000003", nombre: "Tus primeros Acordes Abiertos", descripcion: "Descubre los acordes mayores y menores sin cejilla.", nivel: "principiante", orden: 3 },
    { id: "a1b2c3d4-0000-4000-a000-000000000004", nombre: "Punteo y Melodías Simples", descripcion: "Mejora la destreza de tus dedos tocando nota por nota.", nivel: "intermedio", orden: 4 },
    { id: "a1b2c3d4-0000-4000-a000-000000000005", nombre: "El desafío de la Cejilla", descripcion: "Técnicas y ejercicios para dominar el acorde de Fa Mayor y similares.", nivel: "intermedio", orden: 5 }
];

// MOCK DE LECCIONES / EJERCICIOS

const LECCIONES_MOCK = {
    // Lecciones del Curso 1: Introducción a la Guitarra
    "a1b2c3d4-0000-4000-a000-000000000001": [
        { id: "e1e1e1e1-0000-4000-a000-000000000001", titulo: "Las partes de la guitarra", descripcion: "Aprende cómo se llama cada componente de tu instrumento.", tipo: "video", orden: 1, xp_recompensa: 50, youtube_id: "dQw4w9WgXcQ", duracion_segundos: 180 },
        { id: "e1e1e1e1-0000-4000-a000-000000000002", titulo: "Afinación Básica (Standard)", descripcion: "Usa el micrófono de tu celular para afinar las 6 cuerdas.", tipo: "practica", orden: 2, xp_recompensa: 100 },
        { id: "e1e1e1e1-0000-4000-a000-000000000003", titulo: "Postura correcta y mano izquierda", descripcion: "Evita dolores y lesiones adoptando la postura correcta desde el día uno.", tipo: "video", orden: 3, xp_recompensa: 50, youtube_id: "jNQXAC9IVRw", duracion_segundos: 240 },
        { id: "e1e1e1e1-0000-4000-a000-000000000004", titulo: "Tu primer rasgueo (4/4)", descripcion: "Practica el ritmo básico tocando hacia abajo 4 veces por compás.", tipo: "practica", orden: 4, xp_recompensa: 150 }
    ],

    // Lecciones del Curso 2: Ritmos y Rasgueos Básicos
    "a1b2c3d4-0000-4000-a000-000000000002": [
        { id: "e2e2e2e2-0000-4000-a000-000000000001", titulo: "Rasgueo Pop Universal", descripcion: "Abajo, Abajo, Arriba, Arriba, Abajo, Arriba. El ritmo que sirve para mil canciones.", tipo: "video", orden: 1, xp_recompensa: 75, youtube_id: "kJQP7kiw5Fk", duracion_segundos: 300 },
        { id: "e2e2e2e2-0000-4000-a000-000000000002", titulo: "Práctica de Rasgueo Pop", descripcion: "Mantén el ritmo constante durante 2 minutos seguidos.", tipo: "practica", orden: 2, xp_recompensa: 150 },
        { id: "e2e2e2e2-0000-4000-a000-000000000003", titulo: "Acentuación y dinámica", descripcion: "Cómo darle 'groove' a tu ritmo tocando algunas cuerdas más fuerte que otras.", tipo: "video", orden: 3, xp_recompensa: 75, youtube_id: "9bZkp7q19f0", duracion_segundos: 210 }
    ],

    // Lecciones del Curso 3: Tus primeros Acordes Abiertos
    "a1b2c3d4-0000-4000-a000-000000000003": [
        { id: "e3e3e3e3-0000-4000-a000-000000000001", titulo: "Acorde de Mi Menor (Em)", descripcion: "El acorde más fácil para empezar. Solo requiere dos dedos.", tipo: "video", orden: 1, xp_recompensa: 60, youtube_id: "V-_O7nl0Ii0", duracion_segundos: 150 },
        { id: "e3e3e3e3-0000-4000-a000-000000000002", titulo: "Acorde de La Suspendido (Asus2)", descripcion: "Bajando los dedos una cuerda desde el Mi menor.", tipo: "practica", orden: 2, xp_recompensa: 120 },
        { id: "e3e3e3e3-0000-4000-a000-000000000003", titulo: "Transición: Em a Asus2", descripcion: "Practica cambiar entre estos dos acordes sin perder el ritmo.", tipo: "practica", orden: 3, xp_recompensa: 200 }
    ]
};

class CursoService {
    // Devuelve la lista de cursos evaluando el progreso
    async listarCursos(perfilId) {
        const cursosCompletadosDB = await cursoRepository.obtenerProgresoCursos(perfilId);
        const idsCompletados = new Set(cursosCompletadosDB.map(progreso => progreso.curso_id));

        let maxOrdenCompletado = 0;
        
        CURSOS_MOCK.forEach(curso => {
            if (idsCompletados.has(curso.id) && curso.orden > maxOrdenCompletado) {
                maxOrdenCompletado = curso.orden;
            }
        });

        const cursosConEstado = CURSOS_MOCK.map(curso => {
            const completado = idsCompletados.has(curso.id);
            const desbloqueado = curso.orden === 1 || curso.orden <= (maxOrdenCompletado + 1);

            return {
                ...curso,
                completado,
                desbloqueado
            };
        });

        return {
            perfilId,
            totalCursos: CURSOS_MOCK.length,
            cursos: cursosConEstado
        };
    }

    // Devuelve la vista interna de un curso específico y sus lecciones
    async obtenerDetalleCurso(cursoId, perfilId) {
        const cursoInfo = CURSOS_MOCK.find(c => c.id === cursoId);
        if (!cursoInfo) return null;

        const lecciones = LECCIONES_MOCK[cursoId] || [];

        // ¡AQUÍ ESTÁ EL ARREGLO! Leemos de la Base de Datos real:
        const ejerciciosCompletadosDB = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        const idsCompletados = new Set(ejerciciosCompletadosDB.map(e => e.ejercicio_id));

        let maxOrdenCompletado = 0; 
        lecciones.forEach(leccion => {
            if (idsCompletados.has(leccion.id) && leccion.orden > maxOrdenCompletado) {
                maxOrdenCompletado = leccion.orden;
            }
        });

        const leccionesConEstado = lecciones.map(leccion => {
            const completado = idsCompletados.has(leccion.id);
            const desbloqueado = leccion.orden === 1 || leccion.orden <= (maxOrdenCompletado + 1);

            return { ...leccion, completado, desbloqueado };
        });

        return { ...cursoInfo, totalLecciones: lecciones.length, lecciones: leccionesConEstado };
    }

    async completarLeccion(perfilId, cursoId, leccionId) {
        // 1. Buscamos si el curso y la lección existen en nuestro Mock
        const leccionesDelCurso = LECCIONES_MOCK[cursoId];
        if (!leccionesDelCurso) return { exito: false, mensaje: "Curso no encontrado." };

        const leccion = leccionesDelCurso.find(l => l.id === leccionId);
        if (!leccion) return { exito: false, mensaje: "Ejercicio no encontrado." };

        // 2. Verificamos en la BD si el usuario ya lo había completado antes (para evitar trampas)
        const yaCompletada = await cursoRepository.verificarEjercicioCompletado(perfilId, leccionId);
        if (yaCompletada) return { exito: false, mensaje: "Ya habías reclamado el XP de este ejercicio." };

        // 3. ¡Llamamos a tu función de la transacción SQL!
        const xpGanada = leccion.xp_recompensa;
        const xpTotal = await cursoRepository.registrarProgresoYSumarXP(perfilId, leccionId, xpGanada);

        return { exito: true, xpGanada, xpTotal };
    }
}

export default CursoService;