/**
 * Le catalogue en deux écrans (option B de la DA MAJK, lot 5).
 *
 * Ce que ces tests figent :
 * - `#/catalogue` montre les familles FERMÉES : une carte-lien par famille,
 *   avec son compte, et aucun programme listé ;
 * - `#/catalogue/<famille>` ouvre l'écran de la famille, aux couleurs de son
 *   thème, avec un retour vers la liste ;
 * - le programme mis en avant est celui qu'on reprend, sinon le premier qu'on
 *   peut démarrer ; un programme « à venir » ne l'est jamais ;
 * - les règles du catalogue ne bougent pas (ordre conseillé de MASS, aucun
 *   bouton sur un programme à venir).
 */
import 'fake-indexeddb/auto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { FAMILLES, type FamilleId } from '../data/catalogue';
import type { CycleRow } from '../db/db';
import { viderMemoire } from '../programmes/perso/memoire';
import { CatalogueScreen, compteFamille, programmeVedette } from './CatalogueScreen';

const rien = () => {};
const rendu = (famille?: FamilleId) =>
  renderToStaticMarkup(
    <CatalogueScreen
      {...(famille !== undefined ? { familleOuverte: famille } : {})}
      onOuvrirProgramme={rien}
      onDataChanged={rien}
    />,
  );
const famille = (id: FamilleId) => FAMILLES.find((f) => f.id === id)!;
const cycle = (programmeId: string, statut: CycleRow['statut']): CycleRow =>
  ({ id: 1, programmeId, programmeVersion: '1', startDate: '', statut }) as CycleRow;

afterEach(() => viderMemoire());

describe('la liste des familles', () => {
  it('une carte-lien par famille, vers son écran', () => {
    const html = rendu();
    for (const f of FAMILLES) expect(html).toContain(`href="#/catalogue/${f.id}"`);
  });

  it('les familles sont FERMÉES : aucun programme n’y est listé', () => {
    const html = rendu();
    expect(html).not.toContain('CYCLE 1');
    expect(html).not.toContain('Commencer le programme');
    expect(html).not.toContain('Importer un programme');
  });

  it('chaque carte dit ce que la famille offre', () => {
    expect(compteFamille(famille('power'), famille('power').programmes)).toBe(
      '6 étapes · 1 disponible',
    );
    expect(compteFamille(famille('mass'), famille('mass').programmes)).toBe(
      '3 programmes · 2 disponibles',
    );
    expect(compteFamille(famille('femmes'), famille('femmes').programmes)).toBe(
      '8 étapes · 1 disponible',
    );
    expect(compteFamille(famille('perso'), [])).toBe('Importe ton propre programme');
    expect(rendu()).toContain('6 étapes · 1 disponible');
  });
});

describe('l’écran d’une famille', () => {
  it('aux couleurs de son thème, avec un retour vers la liste', () => {
    const html = rendu('power');
    expect(html).toMatch(/data-theme="power"/);
    expect(html).toContain('href="#/catalogue"');
    expect(html).toContain('CYCLE 1');
    expect(rendu('mass')).toMatch(/data-theme="mass"/);
    expect(rendu('femmes')).toMatch(/data-theme="femmes"/);
    // ME, MYSELF & I n'a pas de thème propre : celui de la plateforme.
    expect(rendu('perso')).toMatch(/data-theme="dcross"/);
  });

  it('le programme à suivre est déplié d’office, avec son bouton', () => {
    const html = rendu('power');
    expect(html).toContain('Commencer le programme');
    expect(html).toContain('Les autres étapes');
  });

  it('MASS dit toujours son ordre conseillé', () => {
    expect(rendu('mass')).toContain('Ordre conseillé, pas obligatoire');
  });

  it('une famille inconnue retombe sur la liste', () => {
    expect(rendu(undefined)).toContain('Choisis ton programme');
  });
});

describe('le programme mis en avant', () => {
  const power = famille('power').programmes;
  const mass = famille('mass').programmes;

  it('sans cycle : le premier qu’on peut démarrer, jamais un « à venir »', () => {
    expect(programmeVedette(power, [])?.id).toBe('power12');
    const v = programmeVedette(mass, []);
    expect(v?.statut).toBe('disponible');
    expect(v?.id).not.toBe('mass8');
  });

  it('un cycle en cours : c’est lui qu’on reprend', () => {
    expect(programmeVedette(mass, [cycle('mass4', 'en-cours')])?.id).toBe('mass4');
  });

  it('rien de jouable : aucun programme mis en avant', () => {
    const aVenir = power.filter((p) => p.statut === 'a-venir');
    expect(aVenir.length).toBeGreaterThan(0);
    expect(programmeVedette(aVenir, [])).toBeNull();
  });
});
