/**
 * « La même DA pour chaque programme, juste les couleurs changent. »
 * Décision de Guillaume, 21 novembre — elle renverse les identités MASS du
 * 14 et du 15 novembre (cartes, boutons, champs, dégradés et lueurs rouges).
 * UNE exception, voulue par Guillaume le même soir : les BANDEAUX MASS
 * (en-têtes à photo, titre argent, « // », marque de l'Accueil, photo de la
 * Séance et du Combiné) restent « tout comme avant ».
 *
 * Ce que ce test fige :
 * - une règle `[data-theme='mass']` ne vit que dans un EN-TÊTE :
 *   `ScreenHeader.module.css`, l'en-tête de séance (`.enteteSeance`, la date
 *   `.metaDate`, le « // » du titre) et le blocage du rebond (`global.css`) ;
 * - dans `tokens.css`, le bloc MASS ne déclare que des COULEURS et des ombres
 *   (les jetons que chaque thème redéfinit), jamais une taille, une police ou
 *   un rayon ;
 * - seuls les quatre jetons des bandeaux existent : `--mass-argent`,
 *   `--mass-ombre-titre`, `--mass-halo-trait`, `--mass-rouge` ;
 * - le rouge MASS est #c8312f (choisi par Guillaume entre le vif #d71f26,
 *   « clinquant », et #b94a48, « terne »).
 *
 * FEMMES suit la même règle (lot 4) : ses écrans gardent leur feuille
 * (`screens/femmes/Femmes.module.css`) et leur bandeau « tout comme avant »,
 * mais sous le bandeau ses pièces prennent les valeurs de POWER.
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
const blocTheme = (theme: string) => {
  const debut = TOKENS.indexOf(`[data-theme='${theme}'] {`);
  return TOKENS.slice(debut, TOKENS.indexOf('\n}\n', debut));
};
const BLOC_MASS = blocTheme('mass');
const BLOC_FEMMES = blocTheme('femmes');
const FEMMES = readFileSync(
  new URL('../screens/femmes/Femmes.module.css', import.meta.url),
  'utf8',
);
/** Le corps de la règle dont le sélecteur est exactement `selecteur`. */
const regle = (css: string, selecteur: string) => {
  const debut = css.indexOf(`\n${selecteur} {`);
  if (debut < 0) throw new Error(`règle absente : ${selecteur}`);
  return css.slice(debut, css.indexOf('\n}', debut));
};
const COULEURS =
  /^--(bg|bg-2|surface(-\d)?|line(-strong)?|ink(-\d|-on-accent|-fort)?|accent(-[a-z-]+)?|vert|orange|rouge|bleu(-ink)?|macro-[a-z]+|bloc-test|voile|ombre-titre|shadow-[a-z]+)$/;
const nomsDe = (bloc: string) => [...bloc.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]!);

describe('MASS = POWER, seul l’accent change', () => {
  it('une règle MASS ne vit que dans un bandeau (en-tête)', () => {
    const ENTETES = [
      'components/ScreenHeader.module.css',
      'styles/global.css',
      'styles/tokens.css',
    ];
    const fautifs: string[] = [];
    for (const f of CSS) {
      const nom = f.slice(SRC.length);
      if (ENTETES.includes(nom)) continue;
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/([^{}]*data-theme=['"]?mass[^{}]*)\{/g)) {
        const selecteur = m[1]!.trim();
        const bandeau =
          nom === 'screens/Session.module.css' &&
          /\.enteteSeance|\.metaDate|^:global\(\[data-theme='mass'\]\) \.title::after$/.test(
            selecteur,
          );
        if (!bandeau) fautifs.push(`${nom} : ${selecteur}`);
      }
    }
    expect(fautifs).toEqual([]);
  });

  it('seuls les quatre jetons des bandeaux MASS existent', () => {
    const PERMIS = new Set([
      '--mass-argent',
      '--mass-ombre-titre',
      '--mass-halo-trait',
      '--mass-rouge',
    ]);
    const trouves = new Set(
      SOURCES.flatMap((f) =>
        [...readFileSync(f, 'utf8').matchAll(/--mass-[a-z-]+/g)].map((m) => m[0]),
      ),
    );
    expect([...trouves].filter((t) => !PERMIS.has(t))).toEqual([]);
  });

  it('le bloc MASS des jetons ne déclare que des couleurs et des ombres', () => {
    const noms = nomsDe(BLOC_MASS);
    expect(noms.length).toBeGreaterThan(10);
    expect(noms.filter((n) => !COULEURS.test(n))).toEqual([]);
  });

  it('le rouge MASS est #c8312f', () => {
    expect(BLOC_MASS).toMatch(/--accent:\s*#c8312f;/);
  });
});

describe('FEMMES = POWER sous le bandeau, seul l’accent change', () => {
  it('le bloc FEMMES des jetons ne déclare que des couleurs et des ombres', () => {
    const noms = nomsDe(BLOC_FEMMES);
    expect(noms.length).toBeGreaterThan(10);
    expect(noms.filter((n) => !COULEURS.test(n))).toEqual([]);
    // Plus de dégradé propre ni de bleu-vert pour les commandes secondaires.
    expect(BLOC_FEMMES).not.toMatch(/--grad-|--cyan-femmes/);
  });

  it('le bouton d’action est celui de POWER : droit, en capitales, ombre du thème', () => {
    const r = regle(FEMMES, '.cta');
    expect(r).not.toContain('italic');
    expect(r).toContain('box-shadow: var(--shadow-action)');
    expect(r).toContain('text-transform: uppercase');
  });

  it('pastilles à bord décoratif, secondaire et champs au contour des contrôles', () => {
    expect(regle(FEMMES, '.chip')).toMatch(/border: 1px solid var\(--line\);/);
    expect(regle(FEMMES, '.secondaire')).toMatch(/border: 1px solid var\(--line-strong\);/);
    expect(regle(FEMMES, '.compteur')).toMatch(/border: 1px solid var\(--line-strong\);/);
    expect(regle(FEMMES, '.remarque')).toMatch(/border: 1px solid var\(--line-strong\);/);
  });

  it('aucune lueur rose ni ancien jeton sous le bandeau', () => {
    expect(FEMMES).not.toMatch(/rgb\(176 74 114|--grad-accent|--cyan-femmes/);
  });

  it('le bandeau reste comme avant : logo et titre penchés', () => {
    expect(regle(FEMMES, '.logo')).toContain('font-style: italic');
    expect(regle(FEMMES, '.titre')).toContain('font-style: italic');
  });
});
