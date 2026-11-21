import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CacheTemporal } from '../src/helpers/cacheTemporal.js';

test('guarda y devuelve un valor mientras no venza', () => {
    const cache = new CacheTemporal({ duracionMs: 1000 });
    cache.guardar('a', 1);
    assert.equal(cache.obtener('a'), 1);
    assert.equal(cache.obtener('b'), undefined);
});

test('un valor vencido ya no se devuelve', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 0 });
    const cache = new CacheTemporal({ duracionMs: 1000 });
    cache.guardar('a', 1);
    t.mock.timers.setTime(999);
    assert.equal(cache.obtener('a'), 1);
    t.mock.timers.setTime(1000);
    assert.equal(cache.obtener('a'), undefined);
});

test('con el tope lleno saca primero las vencidas y, si no hay, la más vieja', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 0 });
    const cache = new CacheTemporal({ duracionMs: 1000, maximo: 2 });
    cache.guardar('vieja', 1);
    cache.guardar('nueva', 2);
    cache.guardar('tercera', 3); // sin vencidas: se va la más vieja
    assert.equal(cache.obtener('vieja'), undefined);
    assert.equal(cache.obtener('nueva'), 2);
    assert.equal(cache.obtener('tercera'), 3);
    t.mock.timers.setTime(5000); // todas vencidas
    cache.guardar('cuarta', 4);
    assert.equal(cache.entradas.size, 1);
});
