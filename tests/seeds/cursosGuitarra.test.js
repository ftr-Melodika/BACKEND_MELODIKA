import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURSOS, VIDEOS_PENDIENTES } from '../../src/database/seeds/cursosGuitarra.js';
import { CANCIONES } from '../../src/database/seeds/canciones.js';

// Valores esperados escritos a mano desde docs/temario-definitivo.md (cursos 1 a 5)
const clase = (curso, n) => CURSOS[curso - 1].lecciones[n - 1];
const consignasDe = (curso, n) => clase(curso, n).practica.consignas;
const cancionDe = (id) => CANCIONES.find((c) => c.id === id);
const sumar = (lista) => lista.reduce((a, b) => a + b, 0);
const nombresAcordes = (consigna) => consigna.pasos.map((p) => p.nombre);
const cuerdasDe = (consigna) => consigna.pasos.map((p) => p.posiciones[0].cuerda);
const todasLasClases = () => CURSOS.flatMap((c) => c.lecciones);
const partesDe = (l) => (l.practica.tipo === 'consignas' ? l.practica.consignas : [l.practica]);
const X05 = '¿Te cuesta? Probala a x0.5.';

test('temario: 5 cursos con 4, 4, 6, 3 y 5 clases', () => {
    assert.equal(CURSOS.length, 5);
    assert.deepEqual(CURSOS.map((c) => c.lecciones.length), [4, 4, 6, 3, 5]);
});

test('temario: los nombres de clase son "<curso>.<n> · <título>" y no se repiten', () => {
    const nombres = todasLasClases().map((l) => l.nombre);
    assert.equal(new Set(nombres).size, 22);
    CURSOS.forEach((curso, i) => {
        curso.lecciones.forEach((l, j) => {
            assert.ok(l.nombre.startsWith(`${i + 1}.${j + 1} · `), l.nombre);
        });
    });
});

test('1.1: afinación con tolerancia de 10 cents y cuerdas de la 6 a la 1', () => {
    const pr = clase(1, 1).practica;
    assert.equal(pr.tipo, 'afinacion');
    assert.equal(pr.toleranciaCents, 10);
    assert.deepEqual(pr.cuerdas.map((c) => c.cuerda), [6, 5, 4, 3, 2, 1]);
});

test('1.2: 8 notas al azar, cuerdas 1 a 6, trastes 1 a 4, dedo 1, 2 veces por traste', () => {
    const pr = clase(1, 2).practica;
    assert.equal(pr.tipo, 'notasAlAzar');
    assert.equal(pr.cantidad, 8);
    assert.deepEqual(pr.cuerdas, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(pr.trastes, [1, 2, 3, 4]);
    assert.equal(pr.dedo, 1);
    assert.equal(pr.vecesPorTraste, 2);
});

test('2.1: 9 notas al azar, cuerdas 3, 4 y 5, trastes 1 a 3, un dedo por traste, 3 veces cada uno', () => {
    const pr = clase(2, 1).practica;
    assert.equal(pr.tipo, 'notasAlAzar');
    assert.equal(pr.cantidad, 9);
    assert.deepEqual(pr.cuerdas, [3, 4, 5]);
    assert.deepEqual(pr.trastes, [1, 2, 3]);
    assert.equal(pr.dedoPorTraste, true);
    assert.equal(pr.vecesPorTraste, 3);
});

test('1.3: tres consignas con 7, 5 y 12 notas', () => {
    assert.deepEqual(consignasDe(1, 3).map((c) => c.pasos.length), [7, 5, 12]);
});

test('1.4: consignas a 86 y 115 BPM, 12 notas, duraciones que suman 16 pulsos, aprobar 0.75 y escalón 0.5', () => {
    const cs = consignasDe(1, 4);
    assert.deepEqual(cs.map((c) => c.tempo.bpm), [86, 115]);
    for (const c of cs) {
        assert.equal(c.pasos.length, 12);
        assert.deepEqual(c.tempo.duraciones, [1, 1, 2, 1, 1, 0.5, 2.5, 1, 1, 2, 1, 2]);
        assert.equal(sumar(c.tempo.duraciones), 16);
        assert.equal(c.tempo.aprobar, 0.75);
        assert.equal(c.tempo.escalon, 0.5);
    }
});

test('2.2: 10 notas por consigna y la segunda a 60 BPM', () => {
    const cs = consignasDe(2, 2);
    assert.equal(cs.length, 2);
    assert.deepEqual(cs.map((c) => c.pasos.length), [10, 10]);
    assert.equal(cs[1].tempo.bpm, 60);
});

test('2.3: tres consignas con 4, 3 y 14 notas', () => {
    assert.deepEqual(consignasDe(2, 3).map((c) => c.pasos.length), [4, 3, 14]);
});

test('2.4: consignas de 14 notas a 93 y 124 BPM', () => {
    const cs = consignasDe(2, 4);
    assert.deepEqual(cs.map((c) => c.pasos.length), [14, 14]);
    assert.deepEqual(cs.map((c) => c.tempo.bpm), [93, 124]);
});

test('curso 3: Mim, Mi, Lam y La con consigna 1 de 6/6/5/5 notas y consigna 2 de 3 acordes', () => {
    [6, 6, 5, 5].forEach((notas, i) => {
        const cs = consignasDe(3, i + 1);
        assert.equal(cs.length, 2);
        assert.equal(cs[0].pasos.length, notas);
        assert.ok(cs[0].pasos.every((p) => p.tipo === 'nota'));
        assert.equal(cs[1].pasos.length, 3);
        assert.ok(cs[1].pasos.every((p) => p.tipo === 'acorde'));
    });
    assert.deepEqual([1, 2, 3, 4].map((n) => clase(3, n).nombre), ['3.1 · Mim', '3.2 · Mi', '3.3 · Lam', '3.4 · La']);
});

test('3.5: tres consignas de 5 acordes', () => {
    assert.deepEqual(consignasDe(3, 5).map((c) => c.pasos.length), [5, 5, 5]);
});

test('3.6: secuencia Mim, La, Mim, La, Mim', () => {
    assert.deepEqual(nombresAcordes(clase(3, 6).practica), ['Mim', 'La', 'Mim', 'La', 'Mim']);
});

test('4.1: ritmo a 60 BPM x4 compases y después 60, 70 y 80', () => {
    const cs = consignasDe(4, 1);
    assert.equal(cs[0].tipo, 'ritmo');
    assert.deepEqual(cs[0].etapas, [{ bpm: 60, compases: 4 }]);
    // 4 aplausos (1 compás) por velocidad: 4 y sube, 4 y sube, 4
    assert.deepEqual(cs[1].etapas, [{ bpm: 60, compases: 1 }, { bpm: 70, compases: 1 }, { bpm: 80, compases: 1 }]);
});

test('4.2: canción Será en modo aprender', () => {
    const pr = clase(4, 2).practica;
    assert.equal(pr.tipo, 'cancion');
    assert.equal(pr.cancionId, 'sera');
    assert.equal(pr.fase, 'aprender');
});

test('4.3: consignas de Será para tocar a 96 y 128 BPM', () => {
    const cs = consignasDe(4, 3);
    assert.ok(cs.every((c) => c.cancionId === 'sera' && c.fase === 'tocar'));
    assert.deepEqual(cs.map((c) => c.bpm), [96, 128]);
});

test('5.1: Re cuerda por cuerda de la 4 a la 1 y un rasgueo tres veces', () => {
    const cs = consignasDe(5, 1);
    assert.deepEqual(cuerdasDe(cs[0]), [4, 3, 2, 1]);
    assert.equal(cs[1].pasos.length, 3);
});

test('5.2: secuencia Mim, Re, Mim, Re, Mim', () => {
    assert.deepEqual(nombresAcordes(clase(5, 2).practica), ['Mim', 'Re', 'Mim', 'Re', 'Mim']);
});

test('5.3: ritmo a 100 BPM durante 4 compases', () => {
    const pr = clase(5, 3).practica;
    assert.equal(pr.tipo, 'ritmo');
    assert.deepEqual(pr.etapas, [{ bpm: 100, compases: 4 }]);
});

test('5.4 y 5.5: Horse With No Name; 5.5 solo a 94 BPM', () => {
    assert.equal(clase(5, 4).practica.cancionId, 'horse-with-no-name');
    assert.equal(clase(5, 4).practica.fase, 'aprender');
    const cs = consignasDe(5, 5);
    assert.ok(cs.every((c) => c.cancionId === 'horse-with-no-name' && c.fase === 'tocar'));
    assert.deepEqual(cs.map((c) => c.bpm), [94]);
});

test('toda canción usada en los cursos existe en el catálogo', () => {
    const usadas = todasLasClases().flatMap(partesDe).filter((pr) => pr.tipo === 'cancion').map((pr) => pr.cancionId);
    assert.ok(usadas.length > 0);
    for (const id of usadas) assert.ok(CANCIONES.some((c) => c.id === id), `falta la canción ${id}`);
});

test('Será: La y Mim, 8 compases, 128 BPM y un solo golpe por compás', () => {
    const sera = CANCIONES.find((c) => c.id === 'sera');
    assert.equal(sera.bpm, 128);
    assert.equal(sera.progresion.length, 8);
    assert.deepEqual(sera.progresion.map((c) => c.acordes), ['A', 'Em', 'A', 'Em', 'A', 'Em', 'A', 'Em']);
    assert.ok(sera.progresion.every((c) => c.rasgueo === 'D-------'));
});

test('ningún texto en pantalla dice "la app"', () => {
    for (const l of todasLasClases()) {
        const partes = partesDe(l);
        const textos = [l.texto_destacado, ...l.instrucciones, ...partes.map((c) => c.instruccion), ...partes.map((c) => c.nombre)].filter(Boolean);
        for (const t of textos) assert.ok(!/la app/i.test(t), `${l.nombre}: ${t}`);
    }
});

test('toda clase con escalón termina el recordatorio con "¿Te cuesta? Probala a x0.5."', () => {
    const conEscalon = todasLasClases().filter((l) => partesDe(l).some((pr) => pr.escalon || pr.tempo?.escalon));
    assert.deepEqual(conEscalon.map((l) => l.nombre.split(' · ')[0]), ['1.4', '2.4', '4.3', '5.5']);
    for (const l of conEscalon) assert.ok(l.texto_destacado?.endsWith(X05), l.nombre);
});

test('videos: 4 cursos con video pendiente y ninguna clase con video cargado', () => {
    assert.deepEqual(Object.keys(VIDEOS_PENDIENTES), ['Primeros pasos I', 'Seven Nation Army', 'Primeros acordes', 'Re y rasgueo de 4 golpes']);
    assert.ok(Object.values(VIDEOS_PENDIENTES).every((puntos) => puntos.length > 0));
    for (const l of todasLasClases()) assert.ok(!l.youtube_id && !l.video, `${l.nombre} no debería tener video cargado`);
});
