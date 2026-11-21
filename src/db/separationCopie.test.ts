/**
 * La copie de comparaison MAJK vit sur le même domaine que l'appli d'origine
 * (descrosses.github.io). IndexedDB et localStorage sont partagés par domaine :
 * si la copie reprenait le nom de base ou les clés de l'original, les deux
 * applis écriraient dans les mêmes données — et une montée de schéma de la
 * copie pourrait empêcher l'original de s'ouvrir.
 *
 * Ce test fige la séparation. S'il tombe, ne le « répare » pas en changeant
 * l'attendu : remets le nom `majk` et le préfixe `majk2:`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ProgrammeDB } from './db';

describe('copie MAJK : données séparées de programme-12-semaines', () => {
  it('la base par défaut s’appelle « majk », jamais le nom de l’original', () => {
    const base = new ProgrammeDB();
    expect(base.name).toBe('majk');
    expect(base.name).not.toBe('programme-12-semaines');
  });

  it('aucune clé localStorage de l’original ne subsiste', () => {
    const fichiers = ['src/state/lastWeek.ts', 'src/timer/restTimer.ts', 'src/timer/blocMinute.ts'];
    for (const f of fichiers) {
      const texte = readFileSync(f, 'utf8');
      expect(texte, f).not.toMatch(/'p12s:|'majk:/);
      expect(texte, f).toMatch(/'majk2:/);
    }
  });
});
