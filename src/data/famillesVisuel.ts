/**
 * L'habillage de chaque famille : sa photo et sa teinte.
 *
 * ── Pourquoi un fichier à part ────────────────────────────────────────────
 *
 * Trois écrans montrent les familles — l'accueil en vignettes, le catalogue
 * en grandes cartes, et demain d'autres. Si chacun déclare ses propres
 * couleurs, POWER finit bleu ici et gris là, et personne ne sait lequel fait
 * foi. Ce fichier est la réponse unique.
 *
 * ── Ce qu'il ne contient pas ──────────────────────────────────────────────
 *
 * Aucune logique, aucun programme, aucune donnée sportive. Uniquement de
 * l'habillage : le jour où les photos définitives arrivent, c'est la seule
 * ligne à changer par famille.
 *
 * ── Le rose de FEMMES ─────────────────────────────────────────────────────
 *
 * Il vient de la maquette de Guillaume, pas d'un réflexe. Le brief interdisait
 * explicitement de supposer que cette famille serait rose ; elle l'est parce
 * qu'il l'a dessinée ainsi, et c'est cette maquette qui fait foi.
 */

import { programmeParId, type FamilleId } from './catalogue';
import type { VisuelNom } from './visuels';

export interface HabillageFamille {
  /**
   * La photo de la famille, provisoire.
   *
   * `undefined` quand aucune photo du manifeste ne convient : la carte affiche
   * alors son dégradé seul, plutôt que d'emprunter l'image d'un autre univers.
   */
  readonly photo?: VisuelNom;
  /** La teinte posée sur la photo et portée par les trois barres obliques. */
  readonly teinte: string;
  /**
   * Les photos d'en-tête de la famille, écran par écran. Absent : les écrans
   * gardent leur comportement d'origine (POWER choisit les siennes lui-même).
   * Ce sont des IMAGES, pas une identité visuelle : depuis la DA claire MAJK,
   * tous les programmes partagent les mêmes écrans, seul l'accent change.
   */
  readonly entetes?: Readonly<Partial<Record<EcranEntete, VisuelNom>>>;
}

/**
 * Les écrans d'un cycle qui peuvent porter une photo d'en-tête. La séance n'en
 * a jamais (voir Session.module.css), quel que soit le programme.
 */
export type EcranEntete = 'accueil' | 'semaine' | 'nutrition' | 'progres' | 'mesures' | 'reglages';

export const HABILLAGE: Record<FamilleId, HabillageFamille> = {
  power: { photo: 'sprint', teinte: '#2f7fd0' },
  /*
   * Les photos d'en-tête viennent de Guillaume (14 novembre), pour toute la
   * famille MASS : FORCE comme CONGESTION. Depuis la DA claire (21 novembre),
   * elles se posent dans les mêmes en-têtes que celles de POWER.
   */
  mass: {
    photo: 'force',
    teinte: '#c8312f',
    entetes: {
      accueil: 'massAthlete',
      semaine: 'massDisque',
      // Bandeaux du 14 novembre, pour toute la famille (FORCE et CONGESTION).
      nutrition: 'massNutrition',
      progres: 'massProgres',
      mesures: 'massMesures',
      reglages: 'massReglages',
    },
  },
  /*
   * Sa propre photo, fournie par Guillaume — jamais celle d'un autre
   * programme, qui donnerait une image fausse de ce qu'elle sera. Même
   * traitement que POWER et MASS : photo brute, voile en dégradé par le code.
   */
  femmes: { photo: 'carteFemmes', teinte: '#d4578f' },
  /*
   * Une famille sans style d'entraînement à montrer : elle représente CELUI
   * DE LA PERSONNE. D'où une photo qui ne montre aucun exercice — une
   * silhouette face à ses reflets — fournie par Guillaume. L'ambre la
   * distingue du bleu, du rouge et du rose, et répond à la lumière dorée de
   * la photo.
   */
  perso: { photo: 'cartePerso', teinte: '#c08b2c' },
};

/** La photo d'en-tête d'un écran pour ce programme, si sa famille en a une. */
export function enteteDe(programmeId: string, ecran: EcranEntete): VisuelNom | undefined {
  const def = programmeParId(programmeId);
  return def === null ? undefined : HABILLAGE[def.familleId]?.entetes?.[ecran];
}

/*
 * Le fond du bloc « fiche technique » d'un exercice SANS fiche (lot F3, audit
 * des fiches MASS). Par défaut, la photo de la famille. MASS FORCE prend une
 * photo MASS déjà intégrée — la salle de son en-tête de séance — au lieu de
 * la photo de famille `force`, qui vient du pack de POWER (un joueur de
 * football américain au développé couché). Seul MASS FORCE change : POWER
 * et MASS CONGESTION gardent exactement leur fond.
 */
const AMBIANCE_FICHE: Readonly<Record<string, VisuelNom>> = {
  'mass-force': 'massSalle',
};

/** Le fond du bloc fiche technique pour ce programme, ou `null`. */
export function ambianceFicheDe(programmeId: string): VisuelNom | null {
  const propre = AMBIANCE_FICHE[programmeId];
  if (propre !== undefined) return propre;
  const def = programmeParId(programmeId);
  return def === null ? null : (HABILLAGE[def.familleId]?.photo ?? null);
}
