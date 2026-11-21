/**
 * L'en-tête du combiné MASS.
 *
 * Ce que ces tests figent :
 * - Dans le cycle, « MASS FORCE » est une ÉTIQUETTE au-dessus du titre, sans
 *   bouton : la navigation s'y fait par les onglets.
 * - Hors cycle (depuis le catalogue), le retour reste un bouton, libellé MASS.
 * - Les trois encadrés gardent leur texte et prennent chacun leur icône.
 * - DA claire (21 novembre) : l'en-tête est celui de la séance POWER, sans
 *   photo. La variante « argent » de l'écran Semaine a disparu.
 */
import 'fake-indexeddb/auto';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EvaluationScreen } from './EvaluationScreen';

const entete = (html: string) => html.slice(html.indexOf('<header'), html.indexOf('</header>'));

describe('l’en-tête du combiné MASS', () => {
  it('dans le cycle : « MASS FORCE » est une étiquette, pas un bouton', () => {
    const h = entete(renderToStaticMarkup(<EvaluationScreen />));
    expect(h).toMatch(/<p class="[^"]*surtitre[^"]*">MASS FORCE<\/p>/);
    expect(h).not.toContain('<button');
  });

  it('depuis le catalogue : le retour reste un bouton, sans étiquette', () => {
    const h = entete(renderToStaticMarkup(<EvaluationScreen onRetour={() => {}} />));
    expect(h).toMatch(/<button[^>]*>.*MASS<\/button>/);
    expect(h).not.toContain('surtitre');
  });

  it('les trois encadrés gardent leur texte et ont chacun une icône', () => {
    const h = entete(renderToStaticMarkup(<EvaluationScreen />));
    const encadres = h.split('encadre').slice(1);
    expect(encadres).toHaveLength(3);
    for (const e of encadres) expect(e).toContain('<svg');
    expect(h).toContain('Quatre tests avant MASS FORCE.');
    expect(h).toContain('Les séances s’ouvrent quand chaque mouvement évalué');
    expect(h).toContain('Seules la charge et les répétitions sont gardées.');
  });

  it('aucune photo : l’en-tête est celui de la séance POWER', () => {
    const h = entete(renderToStaticMarkup(<EvaluationScreen />));
    expect(h).not.toContain('<img');
    expect(h).not.toContain('<picture');
  });
});
