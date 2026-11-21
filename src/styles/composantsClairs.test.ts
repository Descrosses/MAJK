/**
 * Lot 2 de la DA claire MAJK : les composants partagés.
 *
 * Trois décisions, chacune née d'une capture de Guillaume sur iPhone :
 * - une pastille d'information (date, durée, bloc) a un bord DÉCORATIF
 *   (--line) : avec le contour des contrôles, elle pesait plus lourd que le
 *   bouton « Démarrer » ;
 * - une consigne de séance est un aplat d'accent pâle, sans le liseré beige
 *   hérité du thème sombre ;
 * - le sélecteur numérique est un contrôle : contour --line-strong, et « + »
 *   à l'accent du programme.
 *
 * Le contour des CONTRÔLES, lui, ne doit jamais s'alléger : c'est lui qui
 * tient 3:1 (voir themesClairs.test.ts).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lire = (chemin: string) => readFileSync(new URL(chemin, import.meta.url), 'utf8');
/** Le corps de la PREMIÈRE règle dont le sélecteur est exactement `selecteur`. */
const regle = (css: string, selecteur: string) => {
  const debut = css.indexOf(`\n${selecteur} {`);
  if (debut < 0) throw new Error(`règle absente : ${selecteur}`);
  return css.slice(debut, css.indexOf('\n}', debut));
};

const SEANCE = lire('../screens/Session.module.css');
const AUJOURDHUI = lire('../screens/Today.module.css');
const STEPPER = lire('../components/Stepper.module.css');

describe('pastilles d’information : bord décoratif', () => {
  it.each([
    ['Séance', SEANCE],
    ['Aujourd’hui', AUJOURDHUI],
  ])('%s : .metaItem bordé de --line, fond blanc', (_nom, css) => {
    const r = regle(css, '.metaItem');
    expect(r).toMatch(/border:\s*1px solid var\(--line\);/);
    expect(r).not.toContain('--line-strong');
    expect(r).toContain('background: var(--surface)');
  });
});

describe('consigne de séance : aplat d’accent, sans liseré', () => {
  it('.note sur --accent-dim, encre pleine, aucun border-left', () => {
    const r = regle(SEANCE, '.note');
    expect(r).toContain('background: var(--accent-dim)');
    expect(r).toContain('color: var(--ink)');
    expect(r).not.toContain('border-left');
  });
});

describe('sélecteur numérique : un contrôle', () => {
  it('la boîte a le contour des contrôles', () => {
    expect(regle(STEPPER, '.controls')).toMatch(/border:\s*1px solid var\(--line-strong\);/);
  });

  it('« + » (dernier bouton) porte l’accent, texte blanc', () => {
    const r = regle(STEPPER, '.button:last-child');
    expect(r).toContain('background: var(--accent)');
    expect(r).toContain('color: var(--ink-on-accent)');
  });
});
