/**
 * Les photos d'en-tête MASS (fournies par Guillaume, 14 novembre).
 *
 * Depuis la DA claire (21 novembre), « la même DA pour chaque programme,
 * juste les couleurs changent » :
 * 1. Les photos restent — ce sont des images, pas une identité — et se
 *    posent dans les mêmes en-têtes que celles de POWER.
 * 2. La séance n'a pas de photo, pour MASS comme pour POWER ; le combiné non
 *    plus (il reprend l'en-tête de la séance).
 * 3. L'Accueil MASS n'a plus d'en-tête permanent ni de marque « MASS // ».
 */
import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScreenHeader } from '../components/ScreenHeader';
import { enteteDe, HABILLAGE } from './famillesVisuel';
import { VISUELS } from './visuels';

const fichier = (nom: string) => new URL(`../../public/visuels/${nom}`, import.meta.url);

describe('les photos d’en-tête MASS (six écrans, comme POWER)', () => {
  it('chaque écran a la sienne, la séance aucune, et les deux tailles existent', () => {
    expect(HABILLAGE.mass.entetes).toEqual({
      accueil: 'massAthlete',
      semaine: 'massDisque',
      nutrition: 'massNutrition',
      progres: 'massProgres',
      mesures: 'massMesures',
      reglages: 'massReglages',
    });
    for (const nom of Object.values(HABILLAGE.mass.entetes!).filter((n) => n !== undefined)) {
      for (const f of [VISUELS[nom].display, VISUELS[nom].mobile]) {
        expect(existsSync(fichier(f)), f).toBe(true);
      }
    }
  });

  it('FORCE et CONGESTION les reçoivent ; POWER et FEMMES, non', () => {
    expect(enteteDe('mass-force', 'semaine')).toBe('massDisque');
    expect(enteteDe('mass4', 'accueil')).toBe('massAthlete');
    for (const id of ['power12', 'femmes8']) {
      for (const ecran of [
        'accueil',
        'semaine',
        'nutrition',
        'progres',
        'mesures',
        'reglages',
      ] as const) {
        expect(enteteDe(id, ecran)).toBeUndefined();
      }
    }
  });
});

describe('l’Accueil MASS est celui de POWER (DA claire, 21 novembre)', () => {
  it('plus de marque géante ni d’en-tête permanent : le titre est celui du jour', () => {
    // Le module n'exporte plus rien qui fabrique une marque d'accueil.
    expect(Object.keys(HABILLAGE.mass)).not.toContain('marqueAccueil');
    const html = renderToStaticMarkup(<ScreenHeader title="Pecs, biceps" />);
    expect(html).not.toContain('marque');
  });
});
