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
- El alumno puede practicar a **x0.5** todas las veces que quiera, pero la clase se aprueba solo a velocidad original.
- El recordatorio de toda clase a tiempo termina con: «¿Te cuesta? Probala a x0.5.»

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

- **Recordatorio:** Tocá cada nota justo cuando llega a la línea. Si te perdés una, seguí con la siguiente. ¿Te cuesta? Probala a x0.5.
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
2. **Consigna 2 · Subir de a poco:** 60, 70 y 80 BPM, 1 compás cada uno: 4 aplausos y sube, 4 y sube, 4 (12 aplausos).

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

**Una sola consigna, a 94 BPM** (75% del original de ~125). A 125 BPM es demasiado para un principiante, así que se sacó.

**Aprobación:** en cada consigna, el **75% de los acordes a tiempo** (6 de 8).

**Límite de la app:** evalúa el primer golpe de cada acorde; los otros tres se muestran como guía.

**Texto en pantalla:**

- **Recordatorio:** Cuatro golpes por acorde. En el cuarto, ya andá preparando el próximo. ¿Te cuesta? Probala a x0.5.
- **Instrucción:** Rasgueá con el pulgar un golpe por tiempo: cuatro por acorde.

### Fin del curso 5

El curso termina en la 5.5: el alumno toca *Horse With No Name* rasgueando un golpe por tiempo. Son 5 clases.

**Curso 5 cerrado** el 22 de noviembre de 2026.

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
- [ ] **x0.5 no aprueba la clase:** se puede practicar a x0.5, pero la clase se aprueba solo a velocidad original.
- [ ] **Las clases a tiempo arrancan directo a tiempo** (clases 1.4 y 2.4, y todo riff a tiempo): hoy un riff con tempo primero hace tocar las notas una por una y después a tempo. Hay que sacar ese primer paso (y el aviso «Primero las notas una por una…» y la instrucción «Primero nota por nota; después a tempo»). Las canciones (4.3 y 5.5) ya arrancan directo.
