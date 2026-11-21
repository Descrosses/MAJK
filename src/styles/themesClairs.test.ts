/**
 * La DA claire MAJK (21 novembre) : un thème CLAIR pour toute l'appli, seul
 * l'accent change d'un programme à l'autre. Ce test relit `tokens.css` et
 * mesure les contrastes WCAG de chaque thème : un réglage de palette qui
 * passerait sous le seuil fait tomber le déploiement.
 *
 * Il remplace `themeMass.test.ts`, qui figeait le thème MASS SOMBRE du
 * 14 novembre, abandonné sur décision de Guillaume.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const blocDe = (entete: string) => {
  const debut = css.indexOf(entete);
  if (debut < 0) throw new Error(`bloc absent : ${entete}`);
  return css.slice(debut, css.indexOf('\n}\n', debut));
};
const BASE = blocDe(":root,\n[data-theme='power'] {");

/** Un thème qui ne redéfinit pas un jeton hérite de la base (`:root`). */
const jeton = (bloc: string, nom: string) => {
  const re = new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})`, 'i');
  const m = re.exec(bloc) ?? re.exec(BASE);
  if (!m) throw new Error(`--${nom} absent`);
  return m[1]!;
};
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

const THEMES: Record<string, string> = {
  POWER: ":root,\n[data-theme='power'] {",
  plateforme: "[data-theme='dcross'] {",
  MASS: "[data-theme='mass'] {",
  FEMMES: "[data-theme='femmes'] {",
};
const FONDS = ['bg', 'surface', 'surface-2', 'surface-3'];

for (const [nom, entete] of Object.entries(THEMES)) {
  describe(`thème ${nom} (DA claire)`, () => {
    const bloc = blocDe(entete);

    it('est clair : fond clair, texte foncé', () => {
      expect(lum(jeton(bloc, 'bg'))).toBeGreaterThan(0.8);
      expect(lum(jeton(bloc, 'ink'))).toBeLessThan(0.05);
    });

    for (const encre of ['ink', 'ink-2', 'ink-3', 'accent-ink', 'rouge', 'vert', 'orange']) {
      it(`--${encre} tient 4,5:1 sur tous les fonds`, () => {
        for (const f of FONDS) {
          const ok = contraste(jeton(bloc, encre), jeton(bloc, f)) >= 4.5;
          expect({ f, ok }).toEqual({ f, ok: true });
        }
      });
    }

    it('le contour des contrôles (--line-strong) tient 3:1 sur tous les fonds', () => {
      for (const f of FONDS) {
        const ok = contraste(jeton(bloc, 'line-strong'), jeton(bloc, f)) >= 3;
        expect({ f, ok }).toEqual({ f, ok: true });
      }
    });

    it('le texte des boutons tient 4,5:1 sur l’accent', () => {
      expect(contraste(jeton(bloc, 'ink-on-accent'), jeton(bloc, 'accent'))).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  });
}
