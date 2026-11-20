# Temario de guitarra — Melodika

Documento de diseño del temario. El contenido real (textos, ejercicios) vive en
[`src/database/seeds/cursosGuitarra.js`](../src/database/seeds/cursosGuitarra.js) y se carga con
`npm run seed:cursos`. Este archivo explica **por qué** el temario está armado así y fija las reglas
para escribir lecciones nuevas.

## 1. Mapa del tramo inicial (18 cursos, 98 lecciones)

Todas las lecciones son prácticas. Los conceptos de la columna «Qué se lleva el alumno» (partes de
la guitarra, postura, cifrado, pulso, dinámica, semitonos, capo…) se explican con videos, no con
texto dentro de la app.

| # | Curso | Qué se lleva el alumno | Meta medible |
|---|-------|------------------------|--------------|
| 1 | Primeros pasos I | Partes, postura, púa, cuerdas, afinar | Afinar las 6 cuerdas |
| 2 | Primeros pasos II | Trastes, dedos, leer el mástil, presión justa | Oda a la alegría a 80 BPM |
| 3 | Primeros pasos III | Pulso, metrónomo, independencia de dedos | Seven Nation Army a 85 BPM |
| 4 | Acordes I | Em, Am, cifrado americano, primer cambio, negras | Em ↔ Am sin frenar |
| 5 | Acordes II | D, reglas para cambiar, 2 canciones | Em ↔ D |
| 6 | Acordes III | A, E, dedo guía | Three Little Birds |
| 7 | Acordes IV | C, G (3 y 4 dedos), dedos fijos | Knockin’ on Heaven’s Door, Stand By Me |
| 8 | Acordes V | B7 y sus tres cambios por dedo fijo | Zamba de mi esperanza |
| 9 | Cambios de acordes | Cambio anticipado, no frenar nunca | Pruebas: 8 acordes + cadena de cambios |
| 10 | Ritmo y rasgueo I | Corcheas, péndulo, patrón universal | Patrón universal a 75 sin clic |
| 11 | Ritmo y rasgueo II | 4 patrones (incluido contratiempo) | Three Little Birds en reggae |
| 12 | Ritmo y rasgueo III | Golpe percusivo, dinámica | Bum-chas a 80 BPM |
| 13 | Ritmo y rasgueo IV | 3/4, 6/8, entrar en el 1, resistencia | Prueba: patrón universal a 90 |
| 14 | Punteo y riffs I | Púa alternada, pentatónica, riffs | Smoke on the Water, Come As You Are |
| 15 | Punteo y riffs II | Semitonos, notas del mástil, escala de Do | Prueba: Smoke on the Water a 105 |
| 16 | Musicalidad I | Cromática, afinar por el traste 5, cómo se forma un acorde | Bajo y rasgueo |
| 17 | Musicalidad II | Capo, Bm7, canción jefe | Lamento boliviano |
| 18 | Tu primer concierto | Repertorio y examen final en 5 partes | Examen final aprobado |

## 2. Decisiones pedagógicas (y qué problema resuelve cada una)

1. **Nada se pide antes de enseñarse.** Antes, la primera lección pedía "tocá la cuerda 3" y la 1.3
   "dedo 4" sin haber explicado la numeración. Ahora el orden es: número de cuerdas → afinar → púa
   a tempo → leer el mástil → tocar (lo conceptual de cada paso lo cubren los videos).
2. **La teoría va en videos; la app es para tocar.** No hay lecciones de teoría ni texto de teoría
   antes de las prácticas (`texto_teoria` queda en `null`). Cada lección arranca directo en la
   práctica, con un `destacado` corto como recordatorio.
3. **Los cambios de acorde se enseñan con cada acorde nuevo**, no en un curso aparte. Cada atajo
   llega cuando hace falta: forma que se traslada (Em ↔ Am) → mano en bloque (Em ↔ D) → dedo guía
   (A ↔ D) → dedos fijos (C ↔ Am, G ↔ D, E/Em/Am ↔ B7) → cambio anticipado.
   Antes, "dedos fijos" (el atajo más fácil) llegaba después de los cambios más difíciles.
4. **Se rasguea desde el segundo acorde.** Antes se tocaban 7 canciones sin haber aprendido a
   rasguear (el ritmo llegaba en el curso 9). Ahora las negras aparecen en Acordes I y todas las
   canciones de acordes dicen qué rasgueo usar.
5. **Dificultad física graduada.** El cromático y la araña empiezan en el traste 5 (trastes más
   angostos); el cromático en la primera posición llega recién en Punteo, con la mano ya entrenada.
6. **Todo se mide.** Se eliminaron las 38 lecciones "Próximamente". Lo que la app no puede escuchar
   (dinámica, capo, oído) se explica en video y se practica dentro de una lección que sí se mide.
   Las pruebas de salida y el examen final son prácticas reales.
7. **Repertorio cercano.** Rock y pop internacional + rock y folklore argentino (De música ligera,
   Zamba de mi esperanza, Lamento boliviano, Oye cómo va).

## 3. Reglas para escribir una lección

Toda lección es una práctica (`practicar(...)` o `prueba(...)`). No se escribe teoría en la app:
la explicación (qué es, cómo se hace y el error común) va en el video de la lección.

- Se habla de vos, frases cortas, sin jerga sin explicar.
- **Nada de ASCII ni tablaturas dentro de la app**: el texto se muestra centrado y con letra
  proporcional, así que se desarma. El diagrama es el mástil que dibuja la app. Patrones de rasgueo
  en una sola línea: `↓ · ↓↑ · ↑↓↑  —  1 y 2 y 3 y 4 y`.
- `destacado`: la idea que hay que recordar mientras se toca, en una línea.
- `instrucciones`: un solo elemento, la indicación del paso de práctica.
- `meta`: objetivo extra que la app todavía no mide (por ejemplo, cambios en 30 segundos).
- **El nombre es la identidad en la base.** Si cambiás un título, agregá el nombre viejo completo
  (con el número) a `antes`, o se pierde el progreso de los alumnos.

**Qué tipo de práctica usar**

| Quiero que el alumno… | Usar | Notas |
|---|---|---|
| Toque notas o acordes sin apuro | `secuencia(...)` / `acordes(...)` | Mínimo 3 pasos |
| Toque una melodía o riff a tiempo | `aTempo(nombre, notas, bpm, duraciones)` | Solo notas sueltas; una duración por nota |
| Arme un acorde cuerda por cuerda | `acordePerfecto('Do')` | |
| Alterne dos acordes | `cambio('Do', 'Lam')` | |
| Lleve el tempo (palmas o rasgueo apagado) | `ritmo(...)` con `modo` | La app escucha golpes, no notas |
| Entienda un concepto | Un video | No se arman lecciones de teoría ni quizzes |

## 4. Referencia visual (para videos y material extra)

### Acordes abiertos del tramo (cuerdas 6 → 1; `x` = no se toca, número = traste)

| Acorde | Trastes | Dedos | Tip clave |
|---|---|---|---|
| Em | `0 2 2 0 0 0` | `- 2 3 - - -` | El primero: dos dedos, 6 cuerdas |
| Am | `x 0 2 2 1 0` | `x - 2 3 1 -` | La forma de Em, una cuerda abajo, + dedo 1 |
| D | `x x 0 2 3 2` | `x x - 1 3 2` | Triángulo, solo 4 cuerdas |
| A | `x 0 2 2 2 0` | `x - 1 2 3 -` | Tres en fila, en diagonal |
| E | `0 2 2 1 0 0` | `- 2 3 1 - -` | Em + dedo 1 |
| C | `x 3 2 0 1 0` | `x 3 2 - 1 -` | Escalera; la cuerda 3 libre |
| G (3 dedos) | `3 2 0 0 0 3` | `2 1 - - - 3` | |
| G (4 dedos) | `3 2 0 0 3 3` | `2 1 - - 3 4` | Dedo 3 fijo con D |
| B7 | `x 2 1 2 0 2` | `x 2 1 3 - 4` | 4 dedos; la cuerda 2 al aire |
| Bm7 | `x 2 0 2 0 2` | `x 1 - 2 - 3` | Bm sin cejilla |

```
     Em               Am               D
  E A D G B e      E A D G B e      E A D G B e
  ○     ○ ○ ○      ✕ ○       ○      ✕ ✕ ○
  ╒═╤═╤═╤═╤═╕      ╒═╤═╤═╤═╤═╕      ╒═╤═╤═╤═╤═╕
  │ │ │ │ │ │ 1    │ │ │ │ ① │ 1    │ │ │ │ │ │ 1
  │ ② ③ │ │ │ 2    │ │ ② ③ │ │ 2    │ │ │ ① │ ② 2
  │ │ │ │ │ │ 3    │ │ │ │ │ │ 3    │ │ │ │ ③ │ 3
```

### Atajos de cambio

| Par | Atajo | Qué queda quieto |
|---|---|---|
| Em ↔ Am | Forma que se traslada | La figura de los dedos 2 y 3 |
| A ↔ D | Dedo guía | El dedo 3 se desliza por la cuerda 2 |
| C ↔ Am | Dedos fijos | Dedos 1 y 2 |
| G (4) ↔ D | Dedo fijo | Dedo 3 (cuerda 2, traste 3) |
| E ↔ B7, Em ↔ B7 | Dedo fijo | Dedo 2 (cuerda 5, traste 2) |
| Am ↔ B7 | Dedo fijo | Dedo 3 (cuerda 3, traste 2) |

### Patrones de rasgueo

```
             1   y   2   y   3   y   4   y
Negras       ↓       ↓       ↓       ↓
Corcheas     ↓   ↑   ↓   ↑   ↓   ↑   ↓   ↑
Universal    ↓       ↓   ↑       ↑   ↓   ↑
Patrón 1     ↓       ↓   ↑   ↓       ↓   ↑
Rock         ↓       ↓       ↓   ↑   ↓   ↑
Pop          ↓       ↓   ↑       ↑   ↓
Contratiempo     ↑       ↑       ↑       ↑
Bum-chas     ↓      chas     ↓      chas
```

### Riffs (tablatura)

```
Seven Nation Army          Smoke on the Water
e|---------------|         e|-------------------------|
B|---------------|         B|-------------------------|
G|-----0---------|         G|-------------------------|
D|-2-2---2-0-----|         D|-------------------------|
A|-----------3-2-|         A|---1-3---1-4-3---1-3-1---|
E|---------------|         E|-3-----3-------3-------3-|

Come As You Are
e|---------------------------|
B|---------------------------|
G|---------------------------|
D|---------------------------|
A|---------0---0---------2---|
E|-0-0-1-2---2---2-2-1-0---0-|
```

## 5. Pendiente

**Lo que la app todavía no mide** (se trabaja con `meta` o con retos fuera de la app):
- Contador de cambios en 30 segundos.
- Rasgueo con acordes que suenan (hoy se mide el ritmo con cuerdas apagadas o palmas, y los acordes
  por separado).
- Dinámica (volumen), capo (la detección espera acordes sin transportar) y entrenamiento de oído.
- Videos: toda la teoría depende de ellos y el campo `youtube_id` todavía está vacío en todas las
  lecciones.

**Próximo tramo sugerido:** cejilla (F y Bm), power chords y palm mute, ritmos de rock, rasguido
de zamba y chacarera completos, y hammer-on / pull-off.
