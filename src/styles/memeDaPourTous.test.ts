/**
 * « La même DA pour chaque programme, juste les couleurs changent. »
 * Décision de Guillaume, 21 novembre — elle renverse les identités MASS du
 * 14 et du 15 novembre (en-têtes argent, « // », dégradés et lueurs rouges).
 *
 * Ce que ce test fige :
 * - aucune feuille de style ne vise `[data-theme='mass']`, hors `tokens.css` ;
 * - dans `tokens.css`, le bloc MASS ne déclare que des COULEURS et des ombres
 *   (les jetons que chaque thème redéfinit), jamais une taille, une police ou
 *   un rayon ;
 * - plus aucun jeton `--mass-*` n'existe, nulle part ;
 * - le rouge MASS est #c8312f (choisi par Guillaume entre le vif #d71f26,
 *   « clinquant », et #b94a48, « terne »).
 *
 * FEMMES suit la même règle dans un lot à part : ses écrans ont leur propre
 * feuille (`screens/femmes/Femmes.module.css`), non couverte ici.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const fichiers = (dossier: string): string[] =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
const SOURCES = fichiers(SRC).filter((f) => /\.(css|tsx?)$/.test(f) && !/\.test\.tsx?$/.test(f));
const CSS = SOURCES.filter((f) => f.endsWith('.css'));
const TOKENS = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const BLOC_MASS = (() => {
  const debut = TOKENS.indexOf("[data-theme='mass'] {");
  return TOKENS.slice(debut, TOKENS.indexOf('\n}\n', debut));
})();

describe('MASS = POWER, seul l’accent change', () => {
  it('aucune feuille de style ne vise le thème MASS, hors jetons', () => {
    const fautifs = CSS.filter((f) => !f.endsWith('tokens.css')).filter((f) =>
      /data-theme=['"]?mass/.test(readFileSync(f, 'utf8')),
    );
    expect(fautifs.map((f) => f.slice(SRC.length))).toEqual([]);
  });

  it('plus aucun jeton --mass-*', () => {
    const fautifs = SOURCES.filter((f) => /--mass-[a-z]/.test(readFileSync(f, 'utf8')));
    expect(fautifs.map((f) => f.slice(SRC.length))).toEqual([]);
  });

  it('le bloc MASS des jetons ne déclare que des couleurs et des ombres', () => {
    const noms = [...BLOC_MASS.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]!);
    expect(noms.length).toBeGreaterThan(10);
    const COULEURS =
      /^--(bg|bg-2|surface(-\d)?|line(-strong)?|ink(-\d|-on-accent|-fort)?|accent(-[a-z-]+)?|vert|orange|rouge|bleu(-ink)?|macro-[a-z]+|bloc-test|voile|ombre-titre|shadow-[a-z]+)$/;
    expect(noms.filter((n) => !COULEURS.test(n))).toEqual([]);
  });

  it('le rouge MASS est #c8312f', () => {
    expect(BLOC_MASS).toMatch(/--accent:\s*#c8312f;/);
  });
});
