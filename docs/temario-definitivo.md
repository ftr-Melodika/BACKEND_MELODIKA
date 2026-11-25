# Melodika — Temario definitivo

Nov 20, 2026 · @Juan Manuel

## Decisiones generales

Valen para todos los cursos. Se pueden cambiar, pero si cambia una, hay que revisar las clases ya cerradas.

| Tema | Decisión | Qué implica |
| --- | --- | --- |
| Teoría | Todavía no se sabe si va en video, en texto o en ambos | **Un video por curso**, y solo si hace falta explicar algo. Se ve al empezar la clase donde va. Lo demás se resuelve con el recordatorio de cada clase |
| Alumno | Cero absoluto: nunca tocó | No se pide nada que no se haya enseñado antes. Una prueba de nivel simple queda en Pendientes |
| Guitarra | Criolla (cuerdas de nailon) | Las clases se piensan para criolla: dedos y púa, tensión y afinación de nailon |
| Cómo trabajamos | Clase por clase, sin apuro | Cada clase se cierra en este doc. Se pasa al código cuando haya varios cursos cerrados (`cursosGuitarra.js`) |

**Qué se decide en cada clase:**

- **Objetivo:** qué sabe hacer el alumno al terminar.
- **Práctica:** qué toca y cómo lo mide la app.
- **Texto en pantalla:** título, recordatorio (`destacado`) e instrucción.
- **Video:** solo en la clase que lleva el video del curso, con lo que explica.
- **Aprobación:** qué cuenta como clase superada.

**Regla para los textos en pantalla:** nunca dicen "la app". Por ejemplo, "Pisá con el índice el traste marcado" y no "el traste que marca la app".

**Orden dentro de una clase:** si la clase tiene video, es lo primero que se muestra, porque explica lo que hace falta para completar la práctica. Después viene la práctica.

**Velocidad de canciones y riffs:** siempre la original de la grabación.

- Toda clase a tiempo tiene dos consignas: la 1 al **75%** (escalón) y la 2 a la **velocidad original**.
- El alumno puede practicar a **x0.5** todas las veces que quiera, pero la clase se aprueba solo a velocidad original (excepción: la 1.4 arranca en x0.5 y se aprueba a x0.5 o a x1).
- El recordatorio de toda clase a tiempo termina con: «¿Te cuesta? Probala a x0.5.» (en la 1.4: «Cuando te salga, probala a x1.»)

**Aprender y tocar, separados:** cuando un curso termina con una canción o un riff, una clase lo enseña (nota por nota, o acordes y cambios, sin tiempo) y otra lo toca a tiempo. **La clase a tiempo no repite el aprender:** arranca directo con el mástil en movimiento, sin un paso previo de notas una por una ni de acordes sueltos.

## Curso 1 · Primeros pasos I

**Objetivo del curso:** tener la guitarra afinada, conocer las 6 cuerdas y dar los primeros golpes parejos.

**Criterios del curso:** se diseña desde cero, sin partir de las clases que hay hoy en el código. Primero se afina, porque la app solo aprueba notas a menos de 30 cents. Después, el alumno tiene que tocar algo que suene a música lo antes posible: poca teoría al principio y nada de quizzes.

| # | Clase | Estado |
| --- | --- | --- |
| 1.1 | Afiná tu guitarra | Cerrada |
| 1.2 | Tu primer traste | Cerrada |
| 1.3 | Smoke on the Water, nota por nota | Cerrada |
| 1.4 | Smoke on the Water, a tiempo | Cerrada |

**Curso 1 cerrado** el 20 de noviembre de 2026.

**Meta del curso:** tocar una melodía o un riff famoso.

### 1.1 · Afiná tu guitarra

**Objetivo:** dejar las 6 cuerdas afinadas con la ayuda de la app.

**Práctica:** afinador guiado, cuerda por cuerda, de la 6 a la 1.

**Aprobación:** cada cuerda a menos de **10 cents** de su nota durante 1 segundo (antes eran 5).

**Texto en pantalla:**

- **Recordatorio:** Girá la clavija de a poco y mirá la aguja. Si se aleja del centro, girá para el otro lado.
- **Instrucción:** Tocá la cuerda pedida y girá su clavija despacio hasta que la aguja quede en el centro.

**Botón Saltear:** aparece a los **3 minutos** (antes, 45 segundos), o enseguida si no hay micrófono. Avisa que las próximas clases necesitan la guitarra afinada. No suma XP.

**Video del curso 1** (se ve al empezar esta clase, antes del afinador). Explica todo lo básico del curso:

1. **Cómo funciona una clase:** dar permiso al micrófono, buscar un lugar sin ruido, dejar el celular cerca de la guitarra, tocar y esperar el ✓.
2. **Partes de la criolla:** clavijero y clavijas, cejuela, mástil y trastes, caja y boca, puente.
3. **Postura:** sentado, la guitarra apoyada en la pierna, el mástil apenas hacia arriba, la espalda derecha. Una mano en el mástil y la otra sobre la boca (los zurdos, al revés).
4. **Las cuerdas:** la 6 es la más gruesa (queda arriba) y la 1 la más fina. Sus nombres: Mi, La, Re, Sol, Si, Mi.
5. **Cómo afinar:** cada cuerda termina en su clavija. Tensar sube la nota y aflojar la baja. Girar de a poco: si se gira de más, la cuerda se puede cortar.
6. **Afinar siempre:** el nailon se desafina entre una sesión y otra, y las cuerdas nuevas se estiran durante varios días.
7. **Qué es un traste** y cómo se cuentan: el 1 es el más cercano a las clavijas.
8. **Cómo pisar:** con la punta del dedo, justo detrás del metal, sin apretar de más. El pulgar de la mano que pisa va detrás del mástil.
9. **Los dedos:** 1 índice, 2 mayor, 3 anular, 4 meñique. En este curso se usa solo el índice.
10. **Cómo leer el mástil de la app:** qué cuerda se toca, el círculo con el número de dedo y el 0 para la cuerda al aire.

**Cambios en el código:**

- Backend (`cursosGuitarra.js`): la clase pasa al primer lugar, con `toleranciaCents: 10` y el nuevo recordatorio.
- Frontend (`AfinacionStep.js`): Saltear a los 3 minutos y con aviso. Afecta a todas las clases de afinar, también a la del examen final.

### 1.2 · Tu primer traste

**Objetivo:** pisar cualquier traste de la primera posición con el índice y que la nota suene limpia.

**Práctica:** la app pide **8 notas al azar**, una por vez: una cuerda (de la 1 a la 6) y un traste (del 1 al 4). El alumno la pisa y la toca con el pulgar.

**Reglas del azar:**

- Siempre se pisa con el índice (dedo 1).
- Cada traste aparece **2 veces** (8 notas), así practica los 4 trastes por igual.
- Nunca se repite la misma nota dos veces seguidas.
- Cada vez que entra a la clase, las notas son distintas.

**Aprobación:** las 8 notas correctas.

**Texto en pantalla:**

- **Recordatorio:** Punta del dedo, pegado al metal del traste.
- **Instrucción:** Pisá con el índice el traste marcado y tocá la cuerda con el pulgar. Esperá el ✓.

**Cambio en el código:** hace falta un tipo de práctica nuevo, "notas al azar". El curso indica la cantidad de notas, las cuerdas, los trastes y que siempre se pisa con el índice; la app arma las notas cada vez que se entra a la clase.

### 1.3 · Smoke on the Water, nota por nota

**Objetivo:** tocar su primera melodía famosa, sin apuro.

**Práctica:** notas una por una en la cuerda 6; la app espera cada nota antes de pasar a la siguiente. Tres consignas seguidas:

1. **Consigna 1 · Frases 1 y 2:** 0 · 3 · 5 · 0 · 3 · 6 · 5 (7 notas)
2. **Consigna 2 · Frases 3 y 4:** 0 · 3 · 5 · 3 · 0 (5 notas)
3. **Consigna 3 · El riff entero:** las 4 frases seguidas (12 notas)

| Frase | Trastes (cuerda 6) | Dedo |
| --- | --- | --- |
| 1 | 0 · 3 · 5 | Índice en los trastes pisados |
| 2 | 0 · 3 · 6 · 5 | Índice |
| 3 | 0 · 3 · 5 | Índice |
| 4 | 3 · 0 | Índice |

12 notas en total. El 0 es la cuerda al aire, sin pisar.

**Mano derecha:** pulgar, hacia abajo.

**Aprobación:** completar las 3 consignas, cada nota correcta y en orden.

**Texto en pantalla:**

- **Recordatorio:** Un solo dedo: el índice va de traste en traste, pegado al metal.
- **Instrucción:** Pisá con el índice el traste marcado y tocá la cuerda 6 con el pulgar. Esperá el ✓.

**Cambio en el código:** hoy cada clase tiene una sola práctica. Hace falta que una clase pueda tener **varias consignas seguidas**. También lo usa la 1.4.

### 1.4 · Smoke on the Water, a tiempo

**Objetivo:** tocar el riff a tiempo, primero más lento y después a la velocidad final.

**Práctica:** dos consignas seguidas, con el mástil en movimiento: cada nota se toca cuando llega a la línea. Arranca directo a tiempo: no repite el nota por nota de la 1.3.

1. **Consigna 1 · Más lento:** el riff entero a **86 BPM** (75%).
2. **Consigna 2 · Velocidad original:** el riff entero a **115 BPM**.

**Mano:** índice que se desliza y pulgar, igual que en la 1.3.

**Aprobación:** en cada consigna, el **75% de las notas a tiempo** (9 de 12).

**Texto en pantalla:**

- **Recordatorio:** Tocá cada nota justo cuando llega a la línea. Si te perdés una, seguí con la siguiente. Cuando te salga, probala a x1.
- **Instrucción:** Índice en el traste marcado y pulgar en la cuerda 6: tocá cada nota cuando llegue a la línea.

**Ritmo del riff** (pulsos que dura cada nota hasta la siguiente; a verificar escuchando el original al programarlo):

| Frase | Trastes | Duraciones |
| --- | --- | --- |
| 1 | 0 · 3 · 5 | 1 · 1 · 2 |
| 2 | 0 · 3 · 6 · 5 | 1 · 1 · ½ · 2½ |
| 3 | 0 · 3 · 5 | 1 · 1 · 2 |
| 4 | 3 · 0 | 1 · 2 |

**Cambio en el código:** varias consignas en una clase (lo mismo que la 1.3).

### Fin del curso 1

El curso termina en la 1.4: el alumno ya cumple la meta de tocar un riff famoso. Son 4 clases cortas, así el primer logro llega rápido.

**Código:** se pasa junto con los próximos cursos, no ahora. Los cambios que necesita la app quedaron en Pendientes.

## Curso 2 · Seven Nation Army

**Meta del curso:** tocar el riff de *Seven Nation Army* (The White Stripes) usando más dedos que el índice.

**Lo nuevo respecto del curso 1:** los dedos 2 y 3, y pasar de una cuerda a otra (cuerdas 5, 4 y 3).

| Nota | E | E | G | E | D | C | B |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cuerda | 4 | 4 | 3 | 4 | 4 | 5 | 5 |
| Traste | 2 | 2 | 0 | 2 | 0 | 3 | 2 |
| Dedo | 2 | 2 | — | 2 | — | 3 | 2 |

**Velocidad final:** la original, unos 124 BPM (a confirmar con la grabación).

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 2.1 | Dedos 2 y 3 | Pisar con el dedo que corresponde a cada traste | Cerrada |
| 2.2 | De cuerda en cuerda | Pasar de una cuerda a otra sin perder la nota | Cerrada |
| 2.3 | Seven Nation Army, nota por nota | El riff sin apuro | Cerrada |
| 2.4 | Seven Nation Army, a tiempo | El riff a la velocidad original | Cerrada |

### 2.1 · Dedos 2 y 3

**Objetivo:** pisar con el dedo que corresponde a cada traste (1, 2 y 3), sumando los dos dedos nuevos.

**Práctica:** 9 notas al azar, una por vez, con el mismo tipo de práctica que la 1.2.

**Reglas del azar:**

- Cuerdas 3, 4 y 5 (las que usa Seven Nation Army).
- Trastes 1, 2 y 3. El dedo es el número del traste: dedo 1 en el traste 1, dedo 2 en el 2 y dedo 3 en el 3.
- Cada traste aparece **3 veces**.
- Nunca se repite la misma nota dos veces seguidas.
- Cada vez que entra a la clase, las notas son distintas.

**Mano derecha:** pulgar.

**Aprobación:** las 9 notas correctas.

**Texto en pantalla:**

- **Recordatorio:** Un dedo por traste: el 1 en el traste 1, el 2 en el 2 y el 3 en el 3.
- **Instrucción:** Pisá el traste marcado con el dedo indicado y tocá la cuerda con el pulgar. Esperá el ✓.

**Video del curso 2** (se ve al empezar esta clase):

1. **Un dedo por traste:** cada dedo se ocupa de un traste, así la mano no se mueve.
2. **Dedos arqueados:** pisar con la punta y el dedo curvo, para no apagar la cuerda de al lado.
3. **Dedos cerca del mástil:** los que no pisan quedan cerca, listos para la próxima nota.

### 2.2 · De cuerda en cuerda

**Objetivo:** pasar de una cuerda a otra con el pulgar, tocando solo la cuerda pedida.

**Práctica:** una escalera por las cuerdas 5, 4 y 3. El traste y el dedo no cambian; solo cambia la cuerda.

| Tramo | Cuerdas | Traste | Dedo |
| --- | --- | --- | --- |
| 1 | 5 → 4 → 3 → 4 → 5 | 2 | 2 |
| 2 | 5 → 4 → 3 → 4 → 5 | 3 | 3 |

10 notas en total.

**Consignas:**

1. **Nota por nota:** las 10 notas, sin apuro. Cada nota espera el ✓.
2. **A tiempo:** las mismas 10 notas a **60 BPM**, una por pulso.

**Mano derecha:** pulgar.

**Aprobación:** consigna 1, las 10 notas correctas. Consigna 2, el 75% a tiempo (8 de 10).

**Texto en pantalla:**

- **Recordatorio:** El dedo se queda en su traste; solo cambia la cuerda.
- **Instrucción:** Pisá el traste marcado con el dedo indicado y tocá con el pulgar solo la cuerda marcada.

### 2.3 · Seven Nation Army, nota por nota

**Objetivo:** tocar el riff completo sin apuro.

**Práctica:** notas una por una; cada nota espera el ✓. Tres consignas seguidas:

1. **Primera parte (E E G E):** cuerda 4 traste 2 · cuerda 4 traste 2 · cuerda 3 al aire · cuerda 4 traste 2 (4 notas)
2. **Segunda parte (D C B):** cuerda 4 al aire · cuerda 5 traste 3 · cuerda 5 traste 2 (3 notas)
3. **El riff entero, dos veces seguidas**, como suena en la canción (14 notas)

**Dedos:** dedo 2 en el traste 2 y dedo 3 en el traste 3. **Mano derecha:** pulgar.

**Aprobación:** completar las 3 consignas, cada nota correcta y en orden.

**Texto en pantalla:**

- **Recordatorio:** Traste 2 con el dedo 2, traste 3 con el dedo 3.
- **Instrucción:** Pisá el traste marcado con el dedo indicado y tocá la cuerda marcada con el pulgar. Esperá el ✓.

### 2.4 · Seven Nation Army, a tiempo

**Objetivo:** tocar el riff a tiempo, primero más lento y después a la velocidad final.

**Práctica:** dos consignas seguidas, con el mástil en movimiento. En las dos, el riff dos veces seguidas (14 notas). Arranca directo a tiempo: no repite el nota por nota de la 2.3.

1. **Consigna 1 · Más lento:** a **93 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **124 BPM** (a confirmar con la grabación).

**Dedos:** dedo 2 en el traste 2 y dedo 3 en el traste 3. **Mano derecha:** pulgar.

**Aprobación:** en cada consigna, el **75% de las notas a tiempo** (11 de 14).

**Texto en pantalla:**

- **Recordatorio:** Tocá cada nota justo cuando llega a la línea. Si te perdés una, seguí con la siguiente. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Pisá el traste marcado con el dedo indicado y tocá cada nota cuando llegue a la línea.

**Ritmo del riff** (pulsos que dura cada nota hasta la siguiente; a verificar escuchando el original al programarlo):

| Nota | E | E | G | E | D | C | B |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Duración | 1½ | ½ | ¾ | ¾ | ½ | 2 | 2 |

### Fin del curso 2

El curso termina en la 2.4: el alumno toca Seven Nation Army a la velocidad original con los dedos 2 y 3, pasando de cuerda en cuerda. Son 4 clases.

**Curso 2 cerrado** el 21 de noviembre de 2026.

## Curso 3 · Primeros acordes

**Meta del curso:** armar Mim, Mi, Lam y La, y cambiar entre ellos.

**Acordes:**

| Acorde | Trastes (cuerdas 6 → 1) | Dedos | Relación con el anterior |
| --- | --- | --- | --- |
| Mim | 0 · 2 · 2 · 0 · 0 · 0 | 2 en la cuerda 5, 3 en la cuerda 4 | El primero |
| Mi | 0 · 2 · 2 · 1 · 0 · 0 | Igual que Mim + 1 en la cuerda 3 | Mim + el índice |
| Lam | x · 0 · 2 · 2 · 1 · 0 | 2 en la cuerda 4, 3 en la cuerda 3, 1 en la cuerda 2 | La forma de Mi, una cuerda más abajo |
| La | x · 0 · 2 · 2 · 2 · 0 | 1 en la cuerda 4, 2 en la cuerda 3, 3 en la cuerda 2 | Tres dedos en fila en el traste 2 |

El Mim va con los dedos 2 y 3 (y no 1 y 2), así los cambios a Mi y a Lam salen con dedos fijos.

**Video del curso** (al empezar la 3.1):

1. **Cómo leer un acorde en el mástil:** cada círculo es un dedo en su cuerda y traste; la X es una cuerda que no se toca y el 0 una cuerda al aire.
2. **Que suenen todas las cuerdas:** dedos arqueados, para no apagar las cuerdas al aire.
3. **Cómo hacer un rasgueo único:** el pulgar baja por todas las cuerdas de una pasada, sin tocar las que tienen X.

Los dedos fijos no van en el video: se explican en el recordatorio de las clases de cambios.

**Cómo suena cada acorde:** consigna 1, cuerda por cuerda; consigna 2, un único rasgueo con el pulgar.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 3.1 | Mim | Primer acorde, con el video de cómo se leen | Cerrada |
| 3.2 | Mi | Mim + el índice | Cerrada |
| 3.3 | Lam | La forma de Mi, una cuerda más abajo | Cerrada |
| 3.4 | La | Tres dedos en fila | Cerrada |
| 3.5 | Cambios fáciles | Mim ↔ Mi, Mi ↔ Lam y Mim ↔ Lam | Cerrada |
| 3.6 | Cambio Mim ↔ La | El cambio de *Será* | Cerrada |

### 3.1 · Mim

**Objetivo:** armar el primer acorde y que suenen limpias las 6 cuerdas.

**Acorde:** 0 · 2 · 2 · 0 · 0 · 0, con el dedo 2 en la cuerda 5 y el dedo 3 en la cuerda 4 (traste 2).

**Consignas:**

1. **Cuerda por cuerda:** con el Mim armado, tocar cada cuerda con el pulgar, de la 6 a la 1.
2. **Un rasgueo, tres veces:** armar el Mim, rasguearlo una vez con el pulgar y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 6 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** Dedos arqueados: que suenen las 6 cuerdas.
- **Instrucción (consigna 1):** Armá el Mim y tocá cada cuerda con el pulgar, de la 6 a la 1.
- **Instrucción (consigna 2):** Armá el Mim, rasgueá una vez y soltá la mano. Tres veces.

**Límite de la app:** no puede saber si el alumno soltó la mano entre un rasgueo y otro. Lo pide la instrucción, pero se aprueba con los 3 acordes.

### 3.2 · Mi, 3.3 · Lam y 3.4 · La

Las tres clases tienen la misma estructura que la 3.1; solo cambian el acorde, las cuerdas que suenan y el recordatorio.

**Consignas (en las tres):**

1. **Cuerda por cuerda:** con el acorde armado, tocar con el pulgar solo las cuerdas que suenan, de la más grave a la 1.
2. **Un rasgueo, tres veces:** armar el acorde, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, cada cuerda correcta. Consigna 2, el acorde completo las 3 veces.

| Clase | Acorde | Cuerdas que suenan | Recordatorio |
| --- | --- | --- | --- |
| 3.2 | Mi (0 · 2 · 2 · 1 · 0 · 0) | De la 6 a la 1 | El Mim + el índice en la cuerda 3, traste 1. |
| 3.3 | Lam (x · 0 · 2 · 2 · 1 · 0) | De la 5 a la 1 | La forma de Mi, una cuerda más abajo. La cuerda 6 no se toca. |
| 3.4 | La (x · 0 · 2 · 2 · 2 · 0) | De la 5 a la 1 | Tres dedos en fila en el traste 2: cuerdas 4, 3 y 2. La cuerda 6 no se toca. |

**Instrucciones** (cambia el nombre del acorde y la primera cuerda):

- **Consigna 1:** Armá el \[acorde\] y tocá cada cuerda con el pulgar, de la \[6 o 5\] a la 1.
- **Consigna 2:** Armá el \[acorde\], rasgueá una vez y soltá la mano. Tres veces.

### 3.5 · Cambios fáciles

**Objetivo:** cambiar entre Mim, Mi y Lam sin rearmar los acordes, dejando quietos los dedos que se repiten.

**Práctica:** una consigna por cambio, del más fácil al más difícil. En cada una: armar un acorde, rasguearlo una vez, pasar al otro y rasguearlo. **4 cambios** por consigna (A → B → A → B → A).

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Mim ↔ Mi | Los dedos 2 y 3 no se mueven: solo entra y sale el índice. |
| 2 | Mi ↔ Lam | La forma entera baja o sube una cuerda: los tres dedos se mueven juntos. |
| 3 | Mim ↔ Lam | Los dedos 2 y 3 bajan juntos una cuerda y, en Lam, se suma el índice. |

**Aprobación:** cada acorde completo, en orden, en las 3 consignas.

**Recordatorio:** Si un dedo está en el mismo lugar en los dos acordes, no lo levantes: se queda fijo.

### 3.6 · Cambio Mim ↔ La

**Objetivo:** cambiar entre Mim y La, el cambio que usa *Será* en el curso 4.

**Por qué es difícil:** no queda ningún dedo fijo. La cuerda 4, traste 2, la pisa el dedo 3 en Mim y el dedo 1 en La, así que se mueve toda la mano.

**Práctica:** una consigna de **4 cambios** (Mim → La → Mim → La → Mim), con un rasgueo por acorde.

**Aprobación:** cada acorde completo, en orden.

**Texto en pantalla:**

- **Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.
- **Instrucción:** Armá el Mim, rasgueá una vez y pasá al La con los tres dedos a la vez.

### Fin del curso 3

El curso termina en la 3.6: el alumno arma Mim, Mi, Lam y La y cambia entre ellos. Son 6 clases.

**Curso 3 cerrado** el 21 de noviembre de 2026.

## Curso 4 · Primer rasgueo

**Meta del curso:** tocar el estribillo de *Será* (Las Pelotas), rasgueando La y Mim a tiempo.

**Decidido hasta ahora:**

- **Versión:** La – Mim, medio tono más abajo que la grabación (el original está en Si♭). Dentro de la app no importa; junto al disco sonaría distinto.
- **Parte:** solo el estribillo («Será por ti, será por mí…»). Las estrofas llevan Sol y Sim, que todavía no se enseñan.
- **Mano derecha:** pulgar, un golpe hacia abajo.
- **Primera clase:** marcar el pulso con palmas, sin guitarra.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 4.1 | El pulso | Marcar el tiempo con palmas, sin guitarra | Cerrada |
| 4.2 | *Será*: acordes y cambio | La y Mim, y el cambio entre ellos, dentro de la canción | Cerrada |
| 4.3 | *Será*: el estribillo a tiempo | Un rasgueo por acorde, a 96 y a 128 BPM | Cerrada |

### 4.1 · El pulso

**Objetivo:** aplaudir justo con el clic del metrónomo y acompañarlo cuando acelera.

**Práctica:** con palmas, sin guitarra. La app escucha cada aplauso.

1. **Consigna 1 · Un aplauso por clic:** 60 BPM, 4 compases (16 aplausos).
2. **Consigna 2 · Subir de a poco:** 60, 70 y 80 BPM, 4 compases cada uno (48 aplausos).

**Aprobación:** en cada consigna, el **75% de los aplausos a tiempo**.

**Texto en pantalla:**

- **Recordatorio:** Aplaudí justo con el clic, ni antes ni después.
- **Instrucción (consigna 1):** Esperá la cuenta y aplaudí con cada clic.
- **Instrucción (consigna 2):** Aplaudí con el clic y acompañá cada subida de velocidad.

### 4.2 · *Será*: acordes y cambio

**Objetivo:** repasar La y Mim dentro de la canción y el cambio entre ellos, sin tiempo.

**Práctica:** la fase «aprender» que ya tiene la app para las canciones del catálogo: primero cada acorde de la canción y después el cambio entre ellos.

**El estribillo** (un compás de 4 tiempos por acorde; a confirmar con la grabación):

| Línea | Acordes | Compases |
| --- | --- | --- |
| Será por ti, será por mí | La · Mim | 2 |
| será por todo lo que fuimos | La · Mim | 2 |
| hasta el amanecer | La · Mim · La · Mim | 4 |

**Aprobación:** la que ya usa la fase «aprender»: cada acorde completo y cada cambio.

**Cambio en el código:** cargar *Será* (Las Pelotas) en el catálogo de canciones, con el estribillo en La – Mim. Sin letra, como el resto del catálogo.

### 4.3 · *Será*: el estribillo a tiempo

**Objetivo:** tocar el estribillo de *Será* a la velocidad original, con un rasgueo por acorde.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. El estribillo entero, 8 compases. Arranca directo a tiempo: no repite la fase «aprender» de la 4.2.

**Rasgueo:** **un golpe por acorde** con el pulgar, al empezar cada compás.

1. **Consigna 1 · Más lento:** a **96 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **128 BPM**.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (6 de 8).

**Texto en pantalla:**

- **Recordatorio:** Tenés 4 tiempos en cada acorde: usá los últimos para preparar el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.

**Cambio en el código:** en el catálogo, *Será* va a 128 BPM con un golpe por compás. La fase «tocar» tiene que aceptar dos consignas con velocidades distintas.

### Fin del curso 4

El curso termina en la 4.3: el alumno toca el estribillo de *Será* a la velocidad original. Son 3 clases.

**Curso 4 cerrado** el 22 de noviembre de 2026.

## Curso 5 · Re y rasgueo de 4 golpes

**Meta del curso:** tocar *Horse With No Name* (America) con Mim y Re, rasgueando un golpe por tiempo.

**Lo nuevo:** el acorde Re (x · x · 0 · 2 · 3 · 2, dedos 1, 3 y 2) y pasar de un golpe por acorde a 4 golpes por compás.

**Velocidad final:** la original, unos 125 BPM (a confirmar con la grabación).

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 5.1 | Re | El acorde nuevo | Cerrada |
| 5.2 | Cambio Mim ↔ Re | El cambio de la canción | Cerrada |
| 5.3 | Rasgueo de 4 golpes | Un golpe por tiempo, con las cuerdas apagadas | Cerrada |
| 5.4 | *Horse With No Name*: aprender | Los acordes y el cambio dentro de la canción | Cerrada |
| 5.5 | *Horse With No Name* a tiempo | La canción con 4 golpes por compás | Cerrada |

### 5.1 · Re

Misma estructura que las clases de acordes del curso 3.

- **Consigna 1 · Cuerda por cuerda:** con el Re armado, tocar con el pulgar de la cuerda 4 a la 1.
- **Consigna 2 · Un rasgueo, tres veces:** armar el Re, rasguearlo una vez y soltar la mano. Tres veces.
- **Aprobación:** consigna 1, cada cuerda correcta; consigna 2, el acorde completo las 3 veces.
- **Recordatorio:** Un triángulo en las cuerdas 3, 2 y 1. La 6 y la 5 no se tocan.
- **Instrucciones:** Armá el Re y tocá cada cuerda con el pulgar, de la 4 a la 1. / Armá el Re, rasgueá una vez y soltá la mano. Tres veces.

### 5.2 · Cambio Mim ↔ Re

Misma estructura que la 3.6. No queda ningún dedo fijo: Mim usa las cuerdas 5 y 4, y Re las cuerdas 3, 2 y 1.

- **Práctica:** una consigna de 4 cambios (Mim → Re → Mim → Re → Mim), con un rasgueo por acorde.
- **Aprobación:** cada acorde completo, en orden.
- **Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.
- **Instrucción:** Armá el Mim, rasgueá una vez y pasá al Re con los tres dedos a la vez.

### 5.3 · Rasgueo de 4 golpes

**Objetivo:** rasguear un golpe por tiempo, parejo y sin frenar la mano.

**Video del curso 5** (al empezar esta clase):

1. **Cómo apagar las cuerdas:** la mano que pisa apoyada sobre las cuerdas, sin apretar, para que suenen secas, como un tambor.
2. **Rasguear parejo con el pulgar:** la mano no se frena entre golpe y golpe.

**Práctica:** una consigna con las cuerdas apagadas: **100 BPM, 4 compases** (16 golpes). La app escucha cada golpe.

**Aprobación:** el **75% de los golpes a tiempo** (12 de 16).

**Texto en pantalla:**

- **Recordatorio:** Mano que pisa apoyada, sin apretar: que suene seco. Un golpe por clic.
- **Instrucción:** Esperá la cuenta y rasgueá con el pulgar un golpe por clic.

### 5.4 · *Horse With No Name*: aprender

Misma estructura que la 4.2: la fase «aprender» de la canción, que repasa Mim y Re y el cambio entre ellos, sin tiempo.

**La canción** (ya está en el catálogo): 8 compases, un acorde por compás: Mim · Re · Mim · Re · Mim · Re · Mim · Re.

**Aprobación:** la de la fase «aprender»: cada acorde completo y cada cambio.

### 5.5 · *Horse With No Name* a tiempo

Misma estructura que la 4.3, pero con **4 golpes por compás** (uno por tiempo, con el pulgar).

1. **Consigna 1 · Más lento:** a **94 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **125 BPM** (a confirmar con la grabación).

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (6 de 8).

**Límite de la app:** evalúa el primer golpe de cada acorde; los otros tres se muestran como guía.

**Texto en pantalla:**

- **Recordatorio:** Cuatro golpes por acorde. En el cuarto, ya andá preparando el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá con el pulgar un golpe por tiempo: cuatro por acorde.

### Fin del curso 5

El curso termina en la 5.5: el alumno toca *Horse With No Name* rasgueando un golpe por tiempo. Son 5 clases.

**Curso 5 cerrado** el 22 de noviembre de 2026.

## Curso 6 · Sol y Do

**Meta del curso:** tocar *El fantasma* (Árbol), en una versión simplificada con Sol, Re, Mim y Do, rasgueando **un golpe por compás**, como en el curso 4. Todo el esfuerzo va a los acordes nuevos y a sus cambios.

**Lo nuevo:** los acordes Sol (3 · 2 · 0 · 0 · 0 · 3, dedos 2, 1 y 3) y Do (x · 3 · 2 · 0 · 1 · 0, dedos 3, 2 y 1).

**La canción:** el ciclo principal, Sol · Re · Mim · Do. El original usa Re con Fa# en el bajo; acá va el Re común. Se deja afuera la parte que sube un tono y medio (Sib · Fa · Solm · Mib). Cuántos compases dura cada acorde, a confirmar con la grabación ([LaCuerda](https://acordes.lacuerda.net/arbol/el_fantasma.shtml)).

**Velocidad final:** la original. No está publicada: hay que medirla con la grabación.

**Video:** ninguno. Leer acordes, dedos arqueados y el rasgueo único ya están en el video del curso 3.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 6.1 | Sol | El primer acorde nuevo | Cerrada |
| 6.2 | Do | El segundo acorde nuevo | Cerrada |
| 6.3 | Cambio Sol ↔ Re | El primer cambio de la canción | Cerrada |
| 6.4 | Cambio Do ↔ Sol | El cambio que cierra el ciclo | Cerrada |
| 6.5 | *El fantasma*: aprender | Los cuatro acordes y todos los cambios dentro de la canción | Cerrada |
| 6.6 | *El fantasma* a tiempo | Un golpe por compás, al 75% y a la velocidad original | Cerrada |

### 6.1 · Sol

Misma estructura que las clases de acordes del curso 3.

**Objetivo:** armar el Sol y que suenen limpias las 6 cuerdas.

**Acorde:** 3 · 2 · 0 · 0 · 0 · 3. Dedo 2 en la cuerda 6 (traste 3), dedo 1 en la cuerda 5 (traste 2) y dedo 3 en la cuerda 1 (traste 3). Es la forma que ya dibuja la app.

**Consignas:**

1. **Cuerda por cuerda:** con el Sol armado, tocar cada cuerda con el pulgar, de la 6 a la 1.
2. **Un rasgueo, tres veces:** armar el Sol, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 6 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** Dedos 2 y 1 en las cuerdas 6 y 5, el 3 en la 1. Arqueados: que suenen las 3 del medio.
- **Instrucción (consigna 1):** Armá el Sol y tocá cada cuerda con el pulgar, de la 6 a la 1.
- **Instrucción (consigna 2):** Armá el Sol, rasgueá una vez y soltá la mano. Tres veces.

**Límite de la app:** igual que en la 3.1, no puede saber si el alumno soltó la mano entre un rasgueo y otro.

### 6.2 · Do

Misma estructura que la 6.1.

**Objetivo:** armar el Do y que suenen limpias las cuerdas 5 a 1.

**Acorde:** x · 3 · 2 · 0 · 1 · 0. Dedo 3 en la cuerda 5 (traste 3), dedo 2 en la cuerda 4 (traste 2) y dedo 1 en la cuerda 2 (traste 1). Los dedos 1 y 2 están igual que en el Lam: solo cambia el dedo 3.

**Consignas:**

1. **Cuerda por cuerda:** con el Do armado, tocar cada cuerda con el pulgar, de la 5 a la 1.
2. **Un rasgueo, tres veces:** armar el Do, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 5 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** Como el Lam, pero el dedo 3 va a la cuerda 5, traste 3. La cuerda 6 no se toca.
- **Instrucción (consigna 1):** Armá el Do y tocá cada cuerda con el pulgar, de la 5 a la 1.
- **Instrucción (consigna 2):** Armá el Do, rasgueá una vez y soltá la mano. Tres veces.

### 6.3 · Cambio Sol ↔ Re

Misma estructura que la 3.6 y la 5.2. No queda ningún dedo fijo: Sol usa las cuerdas 6, 5 y 1, y Re las cuerdas 3, 2 y 1.

**Objetivo:** pasar de Sol a Re y volver, sin frenar entre acorde y acorde.

**Práctica:** una consigna de 4 cambios (Sol → Re → Sol → Re → Sol), con un rasgueo por acorde.

**Aprobación:** cada acorde completo, en orden.

**Texto en pantalla:**

- **Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.
- **Instrucción:** Armá el Sol, rasgueá una vez y pasá al Re con los tres dedos a la vez.

### 6.4 · Cambio Do ↔ Sol

Misma estructura que la 6.3. No queda ningún dedo fijo. Arranca por el Do porque en la canción el cambio va de Do a Sol.

**Objetivo:** pasar de Do a Sol y volver, sin frenar entre acorde y acorde.

**Práctica:** una consigna de 4 cambios (Do → Sol → Do → Sol → Do), con un rasgueo por acorde.

**Aprobación:** cada acorde completo, en orden.

**Texto en pantalla:**

- **Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.
- **Instrucción:** Armá el Do, rasgueá una vez y pasá al Sol con los tres dedos a la vez.

### 6.5 · *El fantasma*: aprender

Misma estructura que la 4.2 y la 5.4: la fase «aprender» de la canción, sin tiempo.

**Objetivo:** repasar Sol, Re, Mim y Do dentro de la canción y todos sus cambios.

**Práctica:**

1. **Los acordes:** Sol, Re, Mim y Do, cada uno cuerda por cuerda y después rasgueado.
2. **Los cambios:** los 4 de la canción, cada uno ida y vuelta dos veces: Sol ↔ Re, Re ↔ Mim, Mim ↔ Do y Do ↔ Sol.

**Aprobación:** la de la fase «aprender»: cada acorde completo y cada cambio.

**Texto en pantalla:**

- **Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.
- **Instrucción:** Aprendé cada acorde de *El fantasma* y después los cambios entre acordes.

**Cambio en el código:** cargar *El fantasma* en el catálogo de canciones (ver «Cambios en la app»).

### 6.6 · *El fantasma* a tiempo

Misma estructura que la 4.3: un golpe por acorde. Arranca directo a tiempo: no repite el «aprender» de la 6.5.

**Objetivo:** tocar *El fantasma* a la velocidad original, con un rasgueo por acorde.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. El ciclo Sol · Re · Mim · Do cuatro veces: 16 compases.

**Rasgueo:** **un golpe por acorde** con el pulgar, al empezar cada compás.

1. **Consigna 1 · Más lento:** al **75%** de la velocidad original.
2. **Consigna 2 · Velocidad original:** a medir con la grabación.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (12 de 16).

**Texto en pantalla:**

- **Recordatorio:** Tenés 4 tiempos en cada acorde: usá los últimos para preparar el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.

### Fin del curso 6

El curso termina en la 6.6: el alumno toca *El fantasma* con Sol, Re, Mim y Do, un golpe por compás. Son 6 clases.

**Curso 6 cerrado** el 25 de noviembre de 2026.

## Curso 7 · Rem y Fa7M

**Meta del curso:** tocar la estrofa y el estribillo de *When I Was Your Man* (Bruno Mars), rasgueando **4 golpes por compás**, como en el curso 5. El Fa de la canción se toca como Fa7M.

**Lo nuevo:** los acordes Rem (x · x · 0 · 2 · 3 · 1, dedos 2, 3 y 1) y Fa7M (x · x · 3 · 2 · 1 · 0, dedos 3, 2 y 1), la forma fácil del Fa, sin cejilla. El rasgueo abajo-arriba queda para un curso más adelante.

**La canción:** en Do mayor, 4/4, **73 BPM**. Estrofa: Lam · Do · Rem · Sol · Do. Estribillo: Fa7M · Sol · Do. Se deja afuera el pre-estribillo (Lam · Mim · Sib · Do/Sol · Sol), porque lleva Sib. Cuántos compases dura cada acorde, a confirmar con la grabación ([Hooktheory](https://www.hooktheory.com/theorytab/view/bruno-mars/when-i-was-your-man), [SongBPM](https://songbpm.com/@bruno-mars/when-i-was-your-man)).

**Video:** ninguno. Leer acordes y el rasgueo de 4 golpes ya están en los cursos 3 y 5.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 7.1 | Rem | El primer acorde nuevo | Cerrada |
| 7.2 | Fa7M | El segundo acorde nuevo | Cerrada |
| 7.3 | Cambios con Rem | Do ↔ Rem y Rem ↔ Sol | Cerrada |
| 7.4 | Cambios con Fa7M | Do ↔ Fa7M y Fa7M ↔ Sol | Cerrada |
| 7.5 | *When I Was Your Man*: aprender | Los acordes y todos los cambios dentro de la canción | Cerrada |
| 7.6 | *When I Was Your Man* a tiempo | 4 golpes por compás, al 75% y a la velocidad original | Cerrada |

### 7.1 · Rem

Misma estructura que las clases de acordes del curso 3.

**Objetivo:** armar el Rem y que suenen limpias las cuerdas 4 a 1.

**Acorde:** x · x · 0 · 2 · 3 · 1. Dedo 2 en la cuerda 3 (traste 2), dedo 3 en la cuerda 2 (traste 3) y dedo 1 en la cuerda 1 (traste 1). Es la forma que ya dibuja la app. El dedo 3 está igual que en el Re.

**Consignas:**

1. **Cuerda por cuerda:** con el Rem armado, tocar cada cuerda con el pulgar, de la 4 a la 1.
2. **Un rasgueo, tres veces:** armar el Rem, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 4 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** El dedo 3 va como en el Re. Las cuerdas 6 y 5 no se tocan.
- **Instrucción (consigna 1):** Armá el Rem y tocá cada cuerda con el pulgar, de la 4 a la 1.
- **Instrucción (consigna 2):** Armá el Rem, rasgueá una vez y soltá la mano. Tres veces.

### 7.2 · Fa7M

Misma estructura que la 7.1. Es la forma fácil del Fa, sin cejilla, y la que se usa en la canción.

**Objetivo:** armar el Fa7M y que suenen limpias las cuerdas 4 a 1.

**Acorde:** x · x · 3 · 2 · 1 · 0. Dedo 3 en la cuerda 4 (traste 3), dedo 2 en la cuerda 3 (traste 2) y dedo 1 en la cuerda 2 (traste 1). La cuerda 1 suena al aire. El dedo 1 está igual que en el Do; los dedos 3 y 2 bajan una cuerda.

**Consignas:**

1. **Cuerda por cuerda:** con el Fa7M armado, tocar cada cuerda con el pulgar, de la 4 a la 1.
2. **Un rasgueo, tres veces:** armar el Fa7M, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 4 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** Como el Do, pero los dedos 3 y 2 bajan una cuerda. La cuerda 1 suena al aire.
- **Instrucción (consigna 1):** Armá el Fa7M y tocá cada cuerda con el pulgar, de la 4 a la 1.
- **Instrucción (consigna 2):** Armá el Fa7M, rasgueá una vez y soltá la mano. Tres veces.

**Cambio en el código:** la app todavía no tiene el Fa7M (ver «Cambios en la app»).

### 7.3 · Cambios con Rem

Misma estructura que la 3.5: una consigna por cambio, en el orden en que aparecen en la estrofa. En ninguno de los dos queda un dedo fijo.

**Objetivo:** pasar de Do a Rem y de Rem a Sol sin frenar entre acorde y acorde.

**Práctica:** en cada consigna, armar un acorde, rasguearlo una vez, pasar al otro y rasguearlo. **4 cambios** por consigna (A → B → A → B → A).

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Do ↔ Rem | Los dedos 1 y 2 bajan una cuerda en el mismo traste; el 3 salta a la cuerda 2. |
| 2 | Rem ↔ Sol | Se mueve toda la mano: los tres dedos juntos, como un bloque. |

**Aprobación:** cada acorde completo, en orden, en las 2 consignas.

**Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.

### 7.4 · Cambios con Fa7M

Misma estructura que la 7.3. Va primero el cambio más fácil, que tiene un dedo fijo.

**Objetivo:** pasar de Do a Fa7M y de Fa7M a Sol sin frenar entre acorde y acorde.

**Práctica:** en cada consigna, armar un acorde, rasguearlo una vez, pasar al otro y rasguearlo. **4 cambios** por consigna (A → B → A → B → A).

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Do ↔ Fa7M | El dedo 1 no se mueve: los dedos 3 y 2 bajan juntos una cuerda. |
| 2 | Fa7M ↔ Sol | Se mueve toda la mano: los tres dedos juntos, como un bloque. |

**Aprobación:** cada acorde completo, en orden, en las 2 consignas.

**Recordatorio:** Si un dedo está en el mismo lugar en los dos acordes, no lo levantes: se queda fijo.

### 7.5 · *When I Was Your Man*: aprender

Misma estructura que la 6.5: la fase «aprender» de la canción, sin tiempo.

**Objetivo:** repasar Lam, Do, Rem, Sol y Fa7M dentro de la canción y todos sus cambios.

**Práctica:**

1. **Los acordes:** Lam, Do, Rem, Sol y Fa7M, cada uno cuerda por cuerda y después rasgueado.
2. **Los cambios:** los 6 de la canción, cada uno ida y vuelta dos veces: Lam ↔ Do, Do ↔ Rem, Rem ↔ Sol, Sol ↔ Do, Do ↔ Fa7M y Fa7M ↔ Sol. Lam ↔ Do aparece acá por primera vez: es fácil, porque los dedos 1 y 2 quedan en el mismo lugar.

**Aprobación:** la de la fase «aprender»: cada acorde completo y cada cambio.

**Texto en pantalla:**

- **Recordatorio:** Si un dedo se repite, dejalo fijo. Si no, mové los dedos juntos, como un bloque.
- **Instrucción:** Aprendé cada acorde de *When I Was Your Man* y después los cambios entre acordes.

**Cambio en el código:** cargar *When I Was Your Man* en el catálogo de canciones, con el Fa como Fa7M (ver «Cambios en la app»).

### 7.6 · *When I Was Your Man* a tiempo

Misma estructura que la 5.5: **4 golpes por compás** (uno por tiempo, con el pulgar). Arranca directo a tiempo: no repite el «aprender» de la 7.5.

**Objetivo:** tocar la estrofa y el estribillo de *When I Was Your Man* a la velocidad original, rasgueando un golpe por tiempo.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. Una vuelta de estrofa (Lam · Do · Rem · Sol · Do) y estribillo (Fa7M · Sol · Do). Compases por acorde, a confirmar con la grabación.

1. **Consigna 1 · Más lento:** a **55 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **73 BPM**.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (6 de 8, si cada acorde dura un compás).

**Límite de la app:** evalúa el primer golpe de cada acorde; los otros tres se muestran como guía.

**Texto en pantalla:**

- **Recordatorio:** Cuatro golpes por acorde. En el cuarto, ya andá preparando el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá con el pulgar un golpe por tiempo: cuatro por acorde.

### Fin del curso 7

El curso termina en la 7.6: el alumno toca la estrofa y el estribillo de *When I Was Your Man* con Lam, Do, Rem, Sol y Fa7M, cuatro golpes por compás. Son 6 clases.

**Curso 7 cerrado** el 25 de noviembre de 2026.

## Curso 8 · Mi7 y Si7

**Meta del curso:** tocar *Flaca* (Andrés Calamaro) y *Cuando no estás* (Andrés Calamaro) rasgueando **un golpe por compás**, como en el curso 6. *Flaca* usa el Si7 y *Cuando no estás* el Mi7.

**Lo nuevo:** los acordes Mi7 (0 · 2 · 0 · 1 · 0 · 0, dedos 2 y 1: el Mi sin el dedo 3) y Si7 (x · 2 · 1 · 2 · 0 · 2, dedos 2, 1, 3 y 4). El Si7 es el primer acorde con el meñique.

**Las canciones:**

- ***Flaca*** (ya está en el catálogo, a 109 BPM): en Sol, sin capo. Toda la canción repite Sol · Si7 · Mim · Do · Sol · Re · Sol · Re, un acorde por compás. Las fuentes dan un tempo variable, de unos 110 BPM ([LaCuerda](https://acordes.lacuerda.net/andres_calamaro/flaca-2.shtml), [Karaoke Version](https://www.karaoke-version.com/karaoke/andres-calamaro/flaca.html)). El catálogo la tiene con rasgueo abajo-arriba (D-DU-UDU); en este curso va un golpe por compás.
- ***Cuando no estás***, estrofa y estribillo. Estrofa: Do · Lam / Do · Lam · Rem · Sol / Do · Mi7 · Lam · Fa7M. Estribillo: Do · Mi7 · Fa7M · Sol. El Fa se toca como Fa7M, como en el curso 7. El tempo no está publicado: a medir con la grabación, igual que los compases por acorde ([LaCuerda](https://chords.lacuerda.net/andres_calamaro/cuando_no_estas.shtml)).

**Video:** ninguno. El meñique ya se presentó en el curso 1 (los dedos 1 a 4).

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 8.1 | Mi7 | El acorde nuevo y el cambio Mi ↔ Mi7 | Cerrada |
| 8.2 | Si7 | El primer acorde con el meñique | Cerrada |
| 8.3 | Cambios con Mi7 | Mi7 ↔ Lam, Do ↔ Mi7 y Mi7 ↔ Fa7M | Cerrada |
| 8.4 | Cambios con Si7 | Mim ↔ Si7 y Sol ↔ Si7 | Cerrada |
| 8.5 | *Flaca*: aprender | Los acordes y todos los cambios dentro de la canción | Cerrada |
| 8.6 | *Flaca* a tiempo | Un golpe por compás, al 75% y a la velocidad original | Cerrada |
| 8.7 | *Cuando no estás*: aprender | Los acordes y todos los cambios dentro de la canción, con el Mi7 | Cerrada |
| 8.8 | *Cuando no estás* a tiempo | Un golpe por compás, al 75% y a la velocidad original | Cerrada |

### 8.1 · Mi7

Misma estructura que las clases de acordes del curso 3, más una consigna de cambio desde el Mi.

**Objetivo:** armar el Mi7 y que suenen limpias las 6 cuerdas, y pasar del Mi al Mi7 levantando un solo dedo.

**Acorde:** 0 · 2 · 0 · 1 · 0 · 0. Dedo 2 en la cuerda 5 (traste 2) y dedo 1 en la cuerda 3 (traste 1). Es el Mi sin el dedo 3: la cuerda 4 suena al aire. Es la forma que ya dibuja la app.

**Consignas:**

1. **Cuerda por cuerda:** con el Mi7 armado, tocar cada cuerda con el pulgar, de la 6 a la 1.
2. **Un rasgueo, tres veces:** armar el Mi7, rasguearlo una vez y soltar la mano. Tres veces.
3. **Cambio Mi ↔ Mi7:** 4 cambios (Mi → Mi7 → Mi → Mi7 → Mi), un rasgueo por acorde.

**Aprobación:** consigna 1, las 6 cuerdas correctas. Consigna 2, el acorde completo las 3 veces. Consigna 3, cada acorde completo, en orden.

**Texto en pantalla:**

- **Recordatorio:** Es el Mi sin el dedo 3. Los dedos 2 y 1 no se mueven.
- **Instrucción (consigna 1):** Armá el Mi7 y tocá cada cuerda con el pulgar, de la 6 a la 1.
- **Instrucción (consigna 2):** Armá el Mi7, rasgueá una vez y soltá la mano. Tres veces.
- **Instrucción (consigna 3):** Armá el Mi y rasgueá. Levantá el dedo 3 y rasgueá el Mi7. Volvé a apoyarlo.

**Cambio en el código:** usa «Varias consignas en una clase» (ver «Cambios en la app»), con una consigna de acorde y una de cambio en la misma clase.

### 8.2 · Si7

Misma estructura que las clases de acordes del curso 3. Es el primer acorde con cuatro dedos y con el meñique.

**Objetivo:** armar el Si7 y que suenen limpias las cuerdas 5 a 1.

**Acorde:** x · 2 · 1 · 2 · 0 · 2. Dedo 2 en la cuerda 5 (traste 2), dedo 1 en la cuerda 4 (traste 1), dedo 3 en la cuerda 3 (traste 2) y dedo 4 en la cuerda 1 (traste 2). La cuerda 2 suena al aire. Es la forma que ya dibuja la app.

**Consignas:**

1. **Cuerda por cuerda:** con el Si7 armado, tocar cada cuerda con el pulgar, de la 5 a la 1.
2. **Un rasgueo, tres veces:** armar el Si7, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 5 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** El meñique va en la cuerda 1, traste 2. Dedos arqueados: la cuerda 2 tiene que sonar al aire.
- **Instrucción (consigna 1):** Armá el Si7 y tocá cada cuerda con el pulgar, de la 5 a la 1.
- **Instrucción (consigna 2):** Armá el Si7, rasgueá una vez y soltá la mano. Tres veces.

### 8.3 · Cambios con Mi7

Misma estructura que la 3.5: una consigna por cambio, del más fácil al más difícil. Son los tres cambios con Mi7 de *Cuando no estás*.

**Objetivo:** pasar del Mi7 al Lam, del Do al Mi7 y del Mi7 al Fa7M sin frenar entre acorde y acorde.

**Práctica:** en cada consigna, armar un acorde, rasguearlo una vez, pasar al otro y rasguearlo. **4 cambios** por consigna (A → B → A → B → A).

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Mi7 ↔ Lam | Como Mi ↔ Lam: los dedos 2 y 1 bajan juntos una cuerda y en el Lam se suma el dedo 3. |
| 2 | Do ↔ Mi7 | Se mueve toda la mano: los dedos juntos, como un bloque. |
| 3 | Mi7 ↔ Fa7M | Se mueve toda la mano: los dedos juntos, como un bloque. |

**Aprobación:** cada acorde completo, en orden, en las 3 consignas.

**Recordatorio:** Mové los dedos juntos, como un bloque, no de a uno.

### 8.4 · Cambios con Si7

Misma estructura que la 7.4. Va primero el cambio más fácil, que tiene un dedo fijo, aunque en la canción primero viene Sol → Si7.

**Objetivo:** pasar de Mim a Si7 y de Sol a Si7 sin frenar entre acorde y acorde.

**Práctica:** en cada consigna, armar un acorde, rasguearlo una vez, pasar al otro y rasguearlo. **4 cambios** por consigna (A → B → A → B → A).

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Mim ↔ Si7 | El dedo 2 no se mueve de la cuerda 5: los otros entran y salen. |
| 2 | Sol ↔ Si7 | Se mueve toda la mano: los dedos juntos, como un bloque. |

**Aprobación:** cada acorde completo, en orden, en las 2 consignas.

**Recordatorio:** Si un dedo está en el mismo lugar en los dos acordes, no lo levantes: se queda fijo.

### 8.5 · *Flaca*: aprender

Misma estructura que la 6.5: la fase «aprender» de la canción, sin tiempo.

**Objetivo:** repasar Sol, Si7, Mim, Do y Re dentro de la canción y todos sus cambios.

**Práctica:**

1. **Los acordes:** Sol, Si7, Mim, Do y Re, cada uno cuerda por cuerda y después rasgueado.
2. **Los cambios:** los 5 de la canción, cada uno ida y vuelta dos veces: Sol ↔ Si7, Si7 ↔ Mim, Mim ↔ Do, Do ↔ Sol y Sol ↔ Re.

**Aprobación:** la de la fase «aprender»: cada acorde completo y cada cambio.

**Texto en pantalla:**

- **Recordatorio:** Si un dedo se repite, dejalo fijo. Si no, mové los dedos juntos, como un bloque.
- **Instrucción:** Aprendé cada acorde de *Flaca* y después los cambios entre acordes.

**Cambio en el código:** *Flaca* ya está en el catálogo, pero con rasgueo abajo-arriba (D-DU-UDU). Para la 8.6 hace falta tocarla con un golpe por compás (ver «Cambios en la app»).

### 8.6 · *Flaca* a tiempo

Misma estructura que la 6.6: un golpe por acorde. Arranca directo a tiempo: no repite el «aprender» de la 8.5.

**Objetivo:** tocar *Flaca* a la velocidad original, con un rasgueo por acorde.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. El ciclo Sol · Si7 · Mim · Do · Sol · Re · Sol · Re dos veces: 16 compases.

**Rasgueo:** **un golpe por acorde** con el pulgar, al empezar cada compás.

1. **Consigna 1 · Más lento:** a **82 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **109 BPM**, la del catálogo.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (12 de 16).

**Texto en pantalla:**

- **Recordatorio:** Tenés 4 tiempos en cada acorde: usá los últimos para preparar el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.

### 8.7 · *Cuando no estás*: aprender

Misma estructura que la 8.5: la fase «aprender» de la canción, sin tiempo.

**Objetivo:** repasar Do, Lam, Rem, Sol, Mi7 y Fa7M dentro de la canción y todos sus cambios.

**Práctica:**

1. **Los acordes:** Do, Lam, Rem, Sol, Mi7 y Fa7M, cada uno cuerda por cuerda y después rasgueado.
2. **Los cambios:** los 10 de la canción, cada uno ida y vuelta dos veces: Do ↔ Lam, Lam ↔ Rem, Rem ↔ Sol, Sol ↔ Do, Do ↔ Mi7, Mi7 ↔ Lam, Lam ↔ Fa7M, Fa7M ↔ Do, Mi7 ↔ Fa7M y Fa7M ↔ Sol. Dos aparecen acá por primera vez: Lam ↔ Fa7M (el dedo 1 queda fijo) y Lam ↔ Rem.

**Aprobación:** la de la fase «aprender»: cada acorde completo y cada cambio.

**Texto en pantalla:**

- **Recordatorio:** Si un dedo se repite, dejalo fijo. Si no, mové los dedos juntos, como un bloque.
- **Instrucción:** Aprendé cada acorde de *Cuando no estás* y después los cambios entre acordes.

**Cambio en el código:** cargar *Cuando no estás* en el catálogo de canciones, con el Fa como Fa7M (ver «Cambios en la app»).

### 8.8 · *Cuando no estás* a tiempo

Misma estructura que la 8.6: un golpe por acorde. Arranca directo a tiempo: no repite el «aprender» de la 8.7.

**Objetivo:** tocar la estrofa y el estribillo de *Cuando no estás* a la velocidad original, con un rasgueo por acorde.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. Una vuelta de estrofa (Do · Lam / Do · Lam · Rem · Sol / Do · Mi7 · Lam · Fa7M) y estribillo (Do · Mi7 · Fa7M · Sol): 14 acordes.

**Rasgueo:** **un golpe por acorde** con el pulgar, al empezar cada compás.

1. **Consigna 1 · Más lento:** al **75%** de la velocidad original.
2. **Consigna 2 · Velocidad original:** a medir con la grabación.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (11 de 14, si cada acorde dura un compás).

**Texto en pantalla:**

- **Recordatorio:** Tenés 4 tiempos en cada acorde: usá los últimos para preparar el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.

### Fin del curso 8

El curso termina en la 8.8: el alumno toca *Flaca* y *Cuando no estás* con Mi7 y Si7, un golpe por compás. Son 8 clases.

**Curso 8 cerrado** el 25 de noviembre de 2026.

## Curso 9 · Rasgueo abajo-arriba

**Meta del curso:** tocar *Flaca* con el fogonero, **D-DU-UD-** (abajo, -, abajo, arriba, -, arriba, abajo, -), a 109 BPM. Es el rasgueo del catálogo (D-DU-UDU) sin el último arriba: ese hueco deja tiempo para cambiar de acorde. Los acordes y los cambios ya se aprendieron en el curso 8: todo el foco va al rasgueo.

**Lo nuevo:** el rasgueo abajo-arriba. Sin acordes nuevos.

**Cómo se rasguea:** el alumno elige una de tres formas: índice abajo y pulgar arriba, pulgar abajo y pulgar arriba, o con púa.

**Límite de la app:** mide cada golpe a tiempo, pero no distingue si fue hacia abajo o hacia arriba, ni con qué dedo. Cuenta los golpes de más (tocar en un hueco), pero no restan para aprobar.

**Video:** en la 9.1.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 9.1 | Las formas de rasguear | Video: las tres formas de rasguear y cómo se agarra la púa | Cerrada |
| 9.2 | Abajo-arriba parejo | Bajar en cada tiempo y subir en cada «y», sin cortar | Cerrada |
| 9.3 | El fogonero | D-DU-UD- sobre un acorde | Cerrada |
| 9.4 | El patrón D-D-UUDD | ↓ · ↓ · ↑ ↑ ↓ ↓ sobre un acorde | Cerrada |
| 9.5 | *Flaca* con el fogonero | La canción con D-DU-UD-, al 75% y a la velocidad original | Cerrada |

### 9.1 · Las formas de rasguear

Clase de solo video, sin práctica.

**Objetivo:** conocer las tres formas de rasguear abajo-arriba y elegir una.

**Video:**

1. **Las tres formas:** índice abajo y pulgar arriba, pulgar abajo y arriba, o púa.
2. **Cómo agarrar la púa:** entre el pulgar y el costado del índice, con poca punta afuera.
3. **El movimiento:** la mano sube y baja todo el tiempo, como un péndulo. Hacia arriba alcanza con las cuerdas más finas.

**Aprobación:** ver el video.

**Cambio en el código:** una clase con video y sin práctica (ver «Cambios en la app»).

### 9.2 · Abajo-arriba parejo

**Objetivo:** rasguear abajo en cada tiempo y arriba en cada «y», con la mano en movimiento constante.

**Práctica:** el ejercicio de ritmo en corcheas (8 golpes por compás: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑), con el Mim armado. La app mide cada golpe.

1. **Consigna 1 · Despacio:** 4 compases a 60 BPM.
2. **Consigna 2 · Más rápido:** 4 compases a 80 BPM.

**Aprobación:** en cada consigna, el **75% de los golpes a tiempo**.

**Límite de la app:** no distingue si el golpe fue hacia abajo o hacia arriba.

**Texto en pantalla:**

- **Recordatorio:** La mano no para: baja en cada número y sube en cada «y».
- **Instrucción:** Armá el Mim y rasgueá abajo y arriba siguiendo las flechas.

### 9.3 · El fogonero

**Objetivo:** rasguear el fogonero, **D-DU-UD-** (↓ · ↓ ↑ · ↑ ↓ ·), con la mano en movimiento constante. Es el rasgueo de *Flaca* sin el último arriba: ese hueco deja tiempo para cambiar de acorde.

**Práctica:** el ejercicio de ritmo en corcheas, con el Mim armado. La pantalla muestra solo las flechas de los golpes que suenan.

1. **Consigna 1 · Despacio:** 4 compases a 60 BPM.
2. **Consigna 2 · Más rápido:** 4 compases a 80 BPM.

**Aprobación:** en cada consigna, el **75% de los golpes a tiempo**.

**Límite de la app:** no distingue si el golpe fue hacia abajo o hacia arriba. Cuenta los golpes de más (tocar en un hueco), pero no restan para aprobar.

**Texto en pantalla:**

- **Recordatorio:** En los huecos la mano se mueve igual, pero pasa sin tocar las cuerdas.
- **Instrucción:** Armá el Mim y rasgueá siguiendo las flechas.

### 9.4 · El patrón D-D-UUDD

Misma estructura que la 9.3.

**Objetivo:** rasguear **D-D-UUDD** con la mano firme.

**El patrón:**

| 1 | y | 2 | y | 3 | y | 4 | y |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ↓ | · | ↓ | · | ↑ | ↑ | ↓ | ↓ |

A diferencia del fogonero, no es un vaivén parejo: hay dos golpes hacia arriba seguidos (en el 3 y su «y») y dos hacia abajo seguidos (en el 4 y su «y»).

**Práctica:** el ejercicio de ritmo en corcheas, con el Mim armado.

1. **Consigna 1 · Despacio:** 4 compases a 60 BPM.
2. **Consigna 2 · Más rápido:** 4 compases a 80 BPM.

**Aprobación:** en cada consigna, el **75% de los golpes a tiempo**.

**Límite de la app:** no distingue si el golpe fue hacia abajo o hacia arriba. Cuenta los golpes de más, pero no restan para aprobar.

**Texto en pantalla:**

- **Recordatorio:** Dos arriba seguidos y dos abajo seguidos: la mano no va y viene pareja. Mirá las flechas.
- **Instrucción:** Armá el Mim y rasgueá siguiendo las flechas.

**Cambio en el código:** hoy la app pone ↓ en los números y ↑ en las «y». Este patrón necesita que el ejercicio de ritmo acepte la dirección de cada golpe (ver «Cambios en la app»).

### 9.5 · *Flaca* con el fogonero

Misma estructura que la 8.6, pero con el fogonero en vez de un golpe por compás. Arranca directo a tiempo: los acordes y los cambios ya se aprendieron en la 8.5.

**Objetivo:** tocar *Flaca* a la velocidad original con el fogonero.

**Práctica:** la fase «tocar» de la canción: los acordes avanzan por el mástil y se rasguean cuando llegan a la línea. El ciclo Sol · Si7 · Mim · Do · Sol · Re · Sol · Re dos veces: 16 compases.

**Rasgueo:** el fogonero, **D-DU-UD-** (↓ · ↓ ↑ · ↑ ↓ ·), en cada compás.

1. **Consigna 1 · Más lento:** a **82 BPM** (75%).
2. **Consigna 2 · Velocidad original:** a **109 BPM**.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (12 de 16).

**Límite de la app:** evalúa el primer golpe de cada acorde; los demás se muestran como guía.

**Texto en pantalla:**

- **Recordatorio:** Usá el hueco del final para cambiar de acorde. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá el fogonero en cada acorde, siguiendo las flechas.

**Cambio en el código:** *Flaca* con el fogonero (ver «Cambios en la app»).

### Fin del curso 9

El curso termina en la 9.5: el alumno toca *Flaca* con el fogonero. Aprendió el abajo-arriba, el fogonero (D-DU-UD-) y el D-D-UUDD. Son 5 clases.

**Curso 9 cerrado** el 25 de noviembre de 2026.

## Curso 10 · Cejilla

**Meta del curso:** sin canción. El curso enseña las versiones del Fa, una por clase, y el alumno llega hasta donde pueda.

**Lo nuevo:** la cejilla, de a pasos, hasta el Fa completo:

1. Fa7M (x · x · 3 · 2 · 1 · 0), de repaso.
2. Fa con el dedo 1 apretando las cuerdas 1 y 2 (x · x · 3 · 2 · 1 · 1). Es el Fa que ya dibuja la app.
3. Fa con bajo en la 5 (x · 3 · 3 · 2 · 1 · 1).
4. Fa completo, con cejilla en las 6 cuerdas (1 · 3 · 3 · 2 · 1 · 1).

**Siempre:** cada clase avisa que la cejilla es difícil y que, si no sale, se vuelve otro día.

**Botón «No me sale»:** cada clase del curso tiene un botón «No me sale». Abre un aviso que tranquiliza (no pasa nada, la cejilla lleva tiempo, volvé otro día) y lleva a la 10.6, que practica los cambios con el Fa más difícil que el alumno ya aprobó. Así nadie queda trabado: llega hasta donde pueda y sigue con lo que le sale.

| # | Clase | Qué se logra | Estado |
| --- | --- | --- | --- |
| 10.1 | Qué es la cejilla | Video: cómo se apoya y se aprieta una cejilla | Cerrada |
| 10.2 | Fa7M | Repaso: el punto de partida del Fa | Cerrada |
| 10.3 | Fa con cejilla en 1 y 2 | La primera cejilla, de dos cuerdas | Cerrada |
| 10.4 | Fa con bajo en la 5 | Cinco cuerdas, con el meñique | Cerrada |
| 10.5 | Fa completo | Cejilla en las 6 cuerdas | Cerrada |
| 10.6 | Cambios con Fa | Los cambios más comunes con el Fa más difícil que ya sale | Cerrada |

### 10.1 · Qué es la cejilla

Clase de solo video, sin práctica, igual que la 9.1.

**Objetivo:** entender qué es una cejilla y cómo se arma, antes de probarla.

**Video:**

1. **Qué es:** un solo dedo, el 1, aprieta varias cuerdas a la vez en el mismo traste.
2. **Cómo se apoya:** el dedo 1 bien derecho, pegado al traste y apenas de costado, del lado del pulgar.
3. **El pulgar:** detrás del mástil, a la altura del dedo 2, para hacer de pinza.
4. **La fuerza:** sale de la pinza y del peso del brazo, no de apretar con todo el dedo.
5. **Paciencia:** a todos les cuesta al principio. Lleva días o semanas, y está bien volver otro día.

**Aprobación:** ver el video.

**Cambio en el código:** usa la «Clase de solo video» (ver «Cambios en la app»).

### 10.2 · Fa7M

Misma estructura que la 7.2.

**Objetivo:** volver a armar el Fa7M, el punto de partida de todos los Fa del curso.

**Acorde:** x · x · 3 · 2 · 1 · 0. Dedo 3 en la cuerda 4 (traste 3), dedo 2 en la cuerda 3 (traste 2) y dedo 1 en la cuerda 2 (traste 1). La cuerda 1 suena al aire.

**Consignas:**

1. **Cuerda por cuerda:** con el Fa7M armado, tocar cada cuerda con el pulgar, de la 4 a la 1.
2. **Un rasgueo, tres veces:** armar el Fa7M, rasguearlo una vez y soltar la mano. Tres veces.

**Aprobación:** consigna 1, las 4 cuerdas correctas. Consigna 2, el acorde completo las 3 veces.

**Texto en pantalla:**

- **Recordatorio:** Desde acá sale cada Fa del curso: el dedo 2 se queda siempre en la cuerda 3, traste 2.
- **Instrucción (consigna 1):** Armá el Fa7M y tocá cada cuerda con el pulgar, de la 4 a la 1.
- **Instrucción (consigna 2):** Armá el Fa7M, rasgueá una vez y soltá la mano. Tres veces.

### 10.3 · Fa con cejilla en 1 y 2

Misma estructura que la 10.2. Es la primera cejilla: un solo dedo aprieta dos cuerdas.

**Objetivo:** apretar las cuerdas 1 y 2 con el dedo 1 y que suenen limpias las cuerdas 4 a 1.

**Acorde:** x · x · 3 · 2 · 1 · 1. Igual que el Fa7M, pero el dedo 1 se acuesta en el traste 1 y aprieta las cuerdas 2 y 1. Es el Fa que ya dibuja la app.

**Consignas:**

1. **Cuerda por cuerda:** con el Fa armado, tocar cada cuerda con el pulgar, de la 4 a la 1.
2. **Un rasgueo, tres veces:** armar el Fa, rasguearlo una vez y soltar la mano. Tres veces.
3. **Cambio Fa7M ↔ Fa:** 4 cambios (Fa7M → Fa → Fa7M → Fa → Fa7M), un rasgueo por acorde, acostando y levantando el dedo 1.

**Aprobación:** consigna 1, las 4 cuerdas correctas. Consigna 2, el acorde completo las 3 veces. Consigna 3, cada acorde completo, en orden.

**Botón «No me sale»:** lleva a la 10.6 con el Fa7M.

**Texto en pantalla:**

- **Recordatorio:** Armá el Fa7M y acostá el dedo 1 hasta la cuerda 1. Apretá cerca del traste. Es difícil: si no sale, volvé otro día.
- **Instrucción (consigna 1):** Armá el Fa y tocá cada cuerda con el pulgar, de la 4 a la 1.
- **Instrucción (consigna 2):** Armá el Fa, rasgueá una vez y soltá la mano. Tres veces.
- **Instrucción (consigna 3):** Armá el Fa7M y rasgueá. Acostá el dedo 1 hasta la cuerda 1 y rasgueá el Fa. Volvé a levantarlo.

### 10.4 · Fa con bajo en la 5

Misma estructura que la 10.3. Se suma el bajo en la cuerda 5 y, con eso, el meñique.

**Objetivo:** armar el Fa de 5 cuerdas y que suenen limpias las cuerdas 5 a 1.

**Acorde:** x · 3 · 3 · 2 · 1 · 1. Dedo 1 acostado en el traste 1 (cuerdas 2 y 1), dedo 2 en la cuerda 3 (traste 2), dedo 4 en la cuerda 4 (traste 3) y dedo 3 en la cuerda 5 (traste 3). Respecto de la 10.3, el dedo 3 baja a la cuerda 5 y el meñique ocupa su lugar en la 4.

**Consignas:**

1. **Cuerda por cuerda:** con el Fa armado, tocar cada cuerda con el pulgar, de la 5 a la 1.
2. **Un rasgueo, tres veces:** armar el Fa, rasguearlo una vez y soltar la mano. Tres veces.
3. **Cambio Fa (1 y 2) ↔ Fa con bajo en la 5:** 4 cambios, un rasgueo por acorde.

**Aprobación:** consigna 1, las 5 cuerdas correctas. Consigna 2, el acorde completo las 3 veces. Consigna 3, cada acorde completo, en orden.

**Botón «No me sale»:** lleva a la 10.6 con el Fa de la 10.3.

**Texto en pantalla:**

- **Recordatorio:** El dedo 3 baja a la cuerda 5 y el meñique toma su lugar en la 4. Es difícil: si no sale, volvé otro día.
- **Instrucción (consigna 1):** Armá el Fa y tocá cada cuerda con el pulgar, de la 5 a la 1.
- **Instrucción (consigna 2):** Armá el Fa, rasgueá una vez y soltá la mano. Tres veces.
- **Instrucción (consigna 3):** Pasá del Fa de la clase anterior al Fa con bajo y volvé, rasgueando cada uno.

**Cambio en el código:** esta forma del Fa va como forma propia de la clase (la app ya lo permite).

### 10.5 · Fa completo

Misma estructura que la 10.4. El último paso: la cejilla en las 6 cuerdas.

**Objetivo:** armar el Fa completo y que suenen limpias las 6 cuerdas.

**Acorde:** 1 · 3 · 3 · 2 · 1 · 1. Igual que el Fa de la 10.4, pero el dedo 1 se acuesta en todo el traste 1, de la cuerda 6 a la 1.

**Consignas:**

1. **Cuerda por cuerda:** con el Fa armado, tocar cada cuerda con el pulgar, de la 6 a la 1.
2. **Un rasgueo, tres veces:** armar el Fa, rasguearlo una vez y soltar la mano. Tres veces.
3. **Cambio Fa con bajo en la 5 ↔ Fa completo:** 4 cambios, un rasgueo por acorde.

**Aprobación:** consigna 1, las 6 cuerdas correctas. Consigna 2, el acorde completo las 3 veces. Consigna 3, cada acorde completo, en orden.

**Botón «No me sale»:** lleva a la 10.6 con el Fa de la 10.4.

**Texto en pantalla:**

- **Recordatorio:** El dedo 1 bien derecho sobre el traste 1, apenas de costado. Es la cejilla más difícil: si no sale, volvé otro día.
- **Instrucción (consigna 1):** Armá el Fa y tocá cada cuerda con el pulgar, de la 6 a la 1.
- **Instrucción (consigna 2):** Armá el Fa, rasgueá una vez y soltá la mano. Tres veces.
- **Instrucción (consigna 3):** Pasá del Fa de 5 cuerdas al Fa completo y volvé, rasgueando cada uno.

**Cambio en el código:** esta forma del Fa va como forma propia de la clase (la app ya lo permite).

### 10.6 · Cambios con Fa

Se llega desde la 10.5 aprobada o desde el botón «No me sale» de cualquier clase del curso. Usa el Fa más difícil que el alumno ya aprobó: Fa7M, Fa en 1 y 2, Fa con bajo en la 5 o Fa completo.

**Objetivo:** pasar del Fa a los acordes que más lo acompañan sin frenar entre acorde y acorde.

**Práctica:** misma estructura que la 3.5: una consigna por cambio, del más fácil al más difícil. **4 cambios** por consigna (A → B → A → B → A), un rasgueo por acorde.

| Consigna | Cambio | Instrucción |
| --- | --- | --- |
| 1 | Do ↔ Fa | El dedo 1 no se mueve de la cuerda 2, traste 1: los otros cambian de lugar. |
| 2 | Lam ↔ Fa | El dedo 1 tampoco se mueve: los otros cambian de lugar. |
| 3 | Fa ↔ Sol | Se mueve toda la mano: los dedos juntos, como un bloque. |

**Aprobación:** cada acorde completo, en orden, en las 3 consignas.

**Texto en pantalla:**

- **Recordatorio:** Si un dedo está en el mismo lugar en los dos acordes, no lo levantes: se queda fijo.
- **Aviso del botón «No me sale»** (en las clases 10.2 a 10.5): No pasa nada: la cejilla lleva tiempo y a todos les cuesta al principio. Seguí practicando los cambios con el Fa que ya te sale y volvé a esta clase otro día.

**Cambio en el código:** usa el Fa más difícil aprobado y el botón «No me sale» (ver «Cambios en la app»).

### Fin del curso 10

El curso termina en la 10.6: el alumno practica los cambios con el Fa más difícil que le salió. No tiene canción. Son 6 clases.

**Curso 10 cerrado** el 25 de noviembre de 2026.

## Canciones a agregar

Canciones elegidas para sumar al catálogo y a los cursos. Todavía no están asignadas a ningún curso. Los acordes vienen de cancioneros de la web; la tonalidad y el tempo, de sitios de análisis o de karaoke. Todo lo marcado «a confirmar» se verifica escuchando la grabación antes de cargarla.

### Canciones

| Canción | Artista | Acordes | Rasgueo | Tempo |
| --- | --- | --- | --- | --- |
| *Cuando no estás* | Andrés Calamaro | Intro: Do · Lam. Estrofa: Do Lam / Do Lam Rem Sol / Do Mi7 Lam Fa. Estribillo («Cuando no estás, conmigo»): Do · Mi7 · Fa · Sol. Usa Rem, Mi7 y Fa (tocado como Fa7M) | Un golpe por compás con el pulgar (curso 8) | No publicado: a medir con la grabación |
| *El fantasma* (simplificada) | Árbol | Ciclo principal: Sol · Re · Mim · Do (el original usa Re con Fa# en el bajo; acá va el Re común). Se deja afuera la parte que sube un tono y medio (Sib · Fa · Solm · Mib) | Sin dato en las fuentes: a definir escuchando | No publicado: a medir con la grabación |
| *When I Was Your Man* | Bruno Mars | En Do mayor. Estrofa: Lam · Do · Rem · Sol · Do. Estribillo: Fa · Sol · Do. El pre-estribillo lleva Mim, Sib y Do/Sol. Pide Rem, Fa y Sib | 4 golpes por compás con el pulgar (curso 7). El Fa se toca como Fa7M y se deja afuera el pre-estribillo | 73 BPM |
| *Chachachá* | Jósean Log | Original en Fa. Con capo en el traste 5: estrofa Do · Lam · Mim · Mi; estribillo Fa · Sol · Do · Mi. Sin capo: Fa · Rem · Lam · La7 y Sib · Do · Fa · La7. Pide capo (nuevo) y Fa | Las fuentes dan un ritmo con golpes abajo, arriba y cuerdas apagadas: a transcribir escuchando | ~112 BPM (a confirmar) |

Fuentes: *Cuando no estás* ([LaCuerda](https://chords.lacuerda.net/andres_calamaro/cuando_no_estas.shtml)); *El fantasma* ([LaCuerda](https://acordes.lacuerda.net/arbol/el_fantasma.shtml), [tab](https://acordes.lacuerda.net/arbol/el_fantasma-2.shtml)); *When I Was Your Man* ([Hooktheory](https://www.hooktheory.com/theorytab/view/bruno-mars/when-i-was-your-man), [SongBPM](https://songbpm.com/@bruno-mars/when-i-was-your-man)); *Chachachá* ([LaCuerda, capo 5](https://acordes.lacuerda.net/josean_log/chachacha.shtml), [LaCuerda, sin capo y ritmo](https://acordes.lacuerda.net/josean_log/chachacha-2.shtml), [Karaoke Version](https://www.karaoke-version.com/karaoke/josean-log/chachacha.html)).

### Riffs (agregar próximamente)

Las notas de cada riff se transcriben cuando se diseñe la clase que lo use.

| Riff | Artista | Tonalidad | Tempo |
| --- | --- | --- | --- |
| *Flaca* | Andrés Calamaro | Sol (la canción usa Sol · Si7 · Mim · Do · Re) | 109 BPM (el del catálogo de la app) |
| *El fantasma* | Árbol | El riff del «pianito» (min 1:29) y los punteos del final (min 3:05) | A medir con la grabación |
| *Tu cárcel* | Los Enanitos Verdes | Re | ~118 BPM (a confirmar) |
| *Love Yourself* | Justin Bieber | Mi | 100 BPM |
| *Say You Won't Let Go* | James Arthur | Sib (se suele tocar con capo) | 95 BPM |
| *Creo* (intro) | Callejeros | Re | 94 BPM (las fuentes dan 94 o 188: es la misma velocidad contada al doble) |
| *Rezo por vos* | Charly García | Re | ~119 BPM en la versión en vivo con Spinetta; falta la de estudio |

Fuentes: [El fantasma, tab](https://acordes.lacuerda.net/arbol/el_fantasma-2.shtml); [Tu cárcel](https://www.karaoke-version.com/custombackingtrack/los-enanitos-verdes/tu-carcel.html); [Love Yourself](https://songs.klang.io/en/s/Justin%20Bieber/Love%20Yourself/oyEuk8j8imI); [Say You Won't Let Go](https://www.karaoke-version.com/custombackingtrack/james-arthur/say-you-won-t-let-go.html); [Creo](https://songbpm.com/@callejeros/creo); [Rezo por vos](https://www.karaoke-version.com/mp3-backingtrack/luis-alberto-spinetta/rezo-por-vos-live-estadio-velez-sarsfield.html).

## Más adelante

- **Sol y Do:** junto con Mim, Lam y Re completan los acordes abiertos más usados.
- **Power chords:** por ejemplo, *Smoke on the Water* como en el disco.
- **Un riff con el meñique:** para sumar el dedo 4.
- **Canciones que no se usan:** *Oye cómo va*.

## Pendientes e ideas para más adelante

### Prueba de nivel (idea, sin decidir)

Una versión simple que usa prácticas que la app ya sabe medir:

1. Al crear el perfil, una pregunta: "¿Ya tocás la guitarra?". Si responde que no, arranca en el curso 1 sin más.
2. Si responde que sí, hace 3 pruebas cortas, de menor a mayor: afinar las 6 cuerdas, tocar Mim y Lam limpios, y un riff a tempo.
3. Cada prueba aprobada desbloquea un tramo: por ejemplo, la primera saltea Primeros pasos I, y las tres saltean todo Primeros pasos.
4. Siempre puede volver a las clases salteadas.

Se decide cuando cerremos Primeros pasos, porque depende de cómo queden esos cursos.

### Teoría

Elegir el formato (video propio, video de terceros, texto en la app o una mezcla). Las clases ya van a tener anotado qué explicar.

### Funciones a desarrollar

- [ ] **Afinar al empezar una clase:** si hace rato que el alumno no afina, la app le ofrece afinar antes de la clase. Se puede saltear.
- [ ] **Recordatorio al abrir la app:** cada vez que el usuario abre la app, le recuerda afinar, con la opción de saltear.
- [ ] **Saltear la afinación:** el botón aparece a los 3 minutos y avisa que las próximas clases necesitan la guitarra afinada (clase 1.1).
- [ ] **Extra · Medir todos los golpes del rasgueo** (clase 5.5 y las que vengan): hoy, en la fase «tocar», la app evalúa solo el primer golpe de cada acorde y los demás son guía. Habría que juntar la detección de acordes con la de ritmo para medir cada golpe.

### Cambios en la app que pide el temario

Se programan más adelante, antes de pasar los cursos al código.

- [ ] **Notas al azar** (clase 1.2): tipo de práctica nuevo. El curso indica cantidad de notas, cuerdas, trastes y dedo; la app arma notas distintas cada vez que se entra.
- [ ] **Varias consignas en una clase** (clases 1.3 y 1.4): hoy cada clase tiene una sola práctica.
- [ ] **Afinación con tolerancia de 10 cents** (clase 1.1): ya se puede configurar por clase; solo hay que cargarlo.
- [ ] **Cargar *Será* en el catálogo** (curso 4): estribillo en La – Mim, sin letra.
- [ ] **Selector x0.5 en los riffs a tiempo** (clases 1.4 y 2.4): hoy solo existe en las canciones.
- [ ] **Cargar *El fantasma* (Árbol) en el catálogo** (curso 6): versión simplificada, ciclo Sol · Re · Mim · Do, un golpe por compás, a la velocidad original (a medir con la grabación).
- [ ] **Sumar Fa7M a las formas de acordes de la app** (curso 7): hoy la app dibuja y detecta Rem, pero no Fa7M (x · x · 3 · 2 · 1 · 0, dedos 3, 2 y 1).
- [ ] **Cargar *When I Was Your Man* (Bruno Mars) en el catálogo** (curso 7): estrofa Lam · Do · Rem · Sol · Do y estribillo Fa7M · Sol · Do, sin el pre-estribillo. Do mayor, 4/4, 73 BPM. Compases por acorde, a medir con la grabación.
- [ ] ***Flaca* con un golpe por compás** (curso 8): el catálogo la tiene con rasgueo D-DU-UDU. La clase 8.6 la necesita con un golpe por compás, sin cambiar la versión del catálogo (por ejemplo, un rasgueo propio de la clase).
- [ ] **Cargar *Cuando no estás* (Calamaro) en el catálogo** (curso 8): estrofa Do · Lam / Do · Lam · Rem · Sol / Do · Mi7 · Lam · Fa7M y estribillo Do · Mi7 · Fa7M · Sol, un golpe por compás. Tempo y compases por acorde, a medir con la grabación.
- [ ] **Clase de solo video** (clases 9.1 y 10.1): una clase que es solo un video, sin práctica, y se aprueba al verlo. Hoy cada clase tiene una práctica que la app mide.
- [ ] **Dirección de cada golpe en el ejercicio de ritmo** (clase 9.4): hoy la flecha sale de la posición (↓ en los números, ↑ en las «y»). El patrón D-D-UUDD tiene ↑ en el 3 y ↓ en la «y» del 4, así que la práctica tiene que poder indicar la dirección de cada golpe.
- [ ] ***Flaca* con el fogonero** (clase 9.5): la clase la necesita con D-DU-UD- en vez del D-DU-UDU del catálogo, igual que la 8.6 la necesita con un golpe por compás. Un rasgueo propio de la clase, sin cambiar la versión del catálogo.
- [ ] **Botón «No me sale»** (curso 10): en cada clase, un botón que abre un aviso (no pasa nada, lleva tiempo, volvé otro día) y lleva a la 10.6 sin aprobar la clase actual.
- [ ] **Clase que usa el Fa más difícil aprobado** (clase 10.6): los cambios se practican con la forma del último Fa que el alumno aprobó (Fa7M, Fa en 1 y 2, Fa con bajo en la 5 o Fa completo). Hoy cada clase tiene una forma fija.
- [ ] **x0.5 no aprueba la clase:** se puede practicar a x0.5, pero la clase se aprueba solo a velocidad original.
- [ ] **Las clases a tiempo arrancan directo a tiempo** (clases 1.4 y 2.4, y todo riff a tiempo): hoy un riff con tempo primero hace tocar las notas una por una y después a tempo. Hay que sacar ese primer paso (y el aviso «Primero las notas una por una…» y la instrucción «Primero nota por nota; después a tempo»). Las canciones (4.3 y 5.5) ya arrancan directo.
