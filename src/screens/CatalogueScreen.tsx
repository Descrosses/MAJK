/**
 * Le catalogue : les familles, et ce qui est réellement jouable.
 *
 * ── Deux écrans (option B de la DA MAJK, lot 5) ────────────────────────────
 *
 * `#/catalogue` montre les familles FERMÉES, une carte chacune, avec leur
 * compte (« 6 étapes · 1 disponible »). Toucher une carte ouvre l'écran de
 * la famille, `#/catalogue/<famille>` — la même ancre qu'utilisent les tuiles
 * de l'accueil. L'ancien accordéon dépliait la famille sous sa bannière : à
 * quatre familles, la liste du programme poussait les autres hors de l'écran.
 *
 * Sur l'écran de la famille, le programme à suivre (celui qu'on reprend, sinon
 * le premier qu'on peut commencer) est déplié d'office, en tête ; les autres
 * suivent en lignes repliables. Aucune règle ne change : disponible ou à
 * venir, déblocage, ordre conseillé, confirmation avant de recommencer.
 *
 * ── La règle d'affichage ───────────────────────────────────────────────────
 *
 * Un programme `a-venir` n'a pas de bouton. Pas un bouton grisé : pas de
 * bouton du tout. Un bouton désactivé invite quand même à appuyer, et laisse
 * croire qu'il suffirait d'attendre un instant. Une mention « à venir » dit la
 * vérité sans rien promettre.
 *
 * ── Ce que fait le bouton, selon ce qui existe déjà ────────────────────────
 *
 * - un cycle en cours sur ce programme → « Reprendre », qui ouvre la séance ;
 * - aucun cycle → « Commencer », qui en crée un ;
 * - uniquement des cycles terminés → « Recommencer », avec confirmation.
 *
 * Le troisième cas demande confirmation parce qu'il change ce que
 * l'application montre : on sort du cycle regardé pour en ouvrir un neuf, vide.
 * Rien n'est effacé — l'ancien garde tout — mais l'écran change du tout au
 * tout, et une surprise pareille doit être demandée.
 */

import { accesProgramme } from '../engine/acces';
import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { EnTetePlateforme } from '../components/EnTetePlateforme';
import { Visuel } from '../components/Visuel';
import { HABILLAGE } from '../data/famillesVisuel';
import {
  FAMILLES,
  programmesImportesProposes,
  type Famille,
  type FamilleId,
  type ProgrammeDefinition,
} from '../data/catalogue';
import type { CycleRow } from '../db/db';
import { hydraterProgrammesImportes } from '../db/programmesImportes';
import { activerCycle, demarrerCycle, tousLesCycles } from '../db/repo';
import { DetailsImporte } from '../components/perso/DetailsImporte';
import { ImportProgramme } from '../components/perso/ImportProgramme';
import persoStyles from '../components/perso/Perso.module.css';
import { useProgrammesImportes } from '../state/useProgrammesImportes';
import styles from './Screens.module.css';
import local from './Catalogue.module.css';

/** Ce que l'utilisateur peut faire d'un programme, ici et maintenant. */
type Action = 'reprendre' | 'commencer' | 'recommencer' | 'aucune';

function actionPour(programme: ProgrammeDefinition, cycles: CycleRow[]): Action {
  if (programme.statut !== 'disponible') return 'aucune';
  const siens = cycles.filter((c) => c.programmeId === programme.id);
  if (siens.some((c) => c.statut !== 'termine')) return 'reprendre';
  return siens.length === 0 ? 'commencer' : 'recommencer';
}

/**
 * Les programmes d'une famille. ME, MYSELF & I n'en a aucun d'écrit : elle
 * montre ceux que la personne a importés, archivés exceptés (lot 5).
 */
function programmesDe(famille: Famille): readonly ProgrammeDefinition[] {
  return famille.id === 'perso' ? programmesImportesProposes() : famille.programmes;
}

const LIBELLE: Record<Action, string> = {
  reprendre: 'Reprendre',
  commencer: 'Commencer le programme',
  recommencer: 'Recommencer ce programme',
  aucune: '',
};

/** Le thème de l'écran d'une famille : ses couleurs, sans rien d'autre. */
const THEME_FAMILLE: Record<FamilleId, string> = {
  power: 'power',
  mass: 'mass',
  femmes: 'femmes',
  perso: 'dcross',
};

/** Le compte affiché sur la carte d'une famille. */
export function compteFamille(
  famille: Famille,
  programmes: readonly ProgrammeDefinition[],
): string {
  if (famille.id === 'perso') {
    return programmes.length === 0
      ? 'Importe ton propre programme'
      : `${programmes.length} programme${programmes.length > 1 ? 's' : ''} importé${programmes.length > 1 ? 's' : ''}`;
  }
  const enParcours = programmes.some((p) => p.deblocage);
  const n = programmes.length;
  const dispo = programmes.filter((p) => p.statut === 'disponible').length;
  const unite = enParcours ? `étape${n > 1 ? 's' : ''}` : `programme${n > 1 ? 's' : ''}`;
  return `${n} ${unite} · ${dispo} disponible${dispo > 1 ? 's' : ''}`;
}

/**
 * Le programme mis en avant sur l'écran de la famille : celui qu'on reprend,
 * sinon le premier qu'on peut démarrer. `null` quand rien n'est jouable.
 */
export function programmeVedette(
  programmes: readonly ProgrammeDefinition[],
  cycles: CycleRow[],
): ProgrammeDefinition | null {
  return (
    programmes.find((p) => actionPour(p, cycles) === 'reprendre') ??
    programmes.find((p) => actionPour(p, cycles) !== 'aucune') ??
    null
  );
}

export function CatalogueScreen({
  familleOuverte,
  onOuvrirProgramme,
  onDataChanged,
}: {
  /** La famille dont on ouvre l'écran — celle de la carte ou de la tuile touchée. */
  familleOuverte?: FamilleId;
  onOuvrirProgramme: () => void;
  onDataChanged: () => void;
}) {
  const famille = FAMILLES.find((f) => f.id === familleOuverte);
  return famille === undefined ? (
    <ListeFamilles />
  ) : (
    <VueFamille
      famille={famille}
      onOuvrirProgramme={onOuvrirProgramme}
      onDataChanged={onDataChanged}
    />
  );
}

/* ------------------------------------------------- la liste des familles -- */

function ListeFamilles() {
  /* Se redessine quand un programme est importé : le compte de ME, MYSELF & I change. */
  useProgrammesImportes();
  return (
    <div className={styles.screen}>
      <EnTetePlateforme />

      <div className={local.titreEcran}>
        <h1 className={local.grandTitre}>Choisis ton programme</h1>
        <p className={local.sousTitreEcran}>
          <span className={local.trait} aria-hidden="true" />
          Un programme adapté à ton objectif
        </p>
      </div>

      {FAMILLES.map((famille) => {
        const programmes = programmesDe(famille);
        const perso = famille.id === 'perso';
        return (
          <section
            key={famille.id}
            id={`famille-${famille.id}`}
            className={local.famille}
            style={{ '--teinte': HABILLAGE[famille.id].teinte } as CSSProperties}
          >
            {/* La carte est un LIEN vers l'écran de la famille. */}
            <a className={local.banniere} href={`#/catalogue/${famille.id}`}>
              {HABILLAGE[famille.id].photo !== undefined && (
                <span className={local.bannierePhoto} aria-hidden="true">
                  <Visuel nom={HABILLAGE[famille.id].photo!} sizes="100vw" />
                </span>
              )}
              <span className={local.banniereVoile} aria-hidden="true" />
              {/* ME, MYSELF & I n'est jamais « à venir » : on y importe dès aujourd'hui. */}
              {!perso && programmes.every((p) => p.statut === 'a-venir') && (
                <span className={local.banniereBadge}>À venir</span>
              )}
              <span className={local.banniereTexte}>
                <span className={local.nomFamille}>{famille.nom}</span>
                {famille.sousTitre && <span className={local.sousTitre}>{famille.sousTitre}</span>}
                <span className={local.compte}>{compteFamille(famille, programmes)}</span>
              </span>
              <span className={local.banniereChevron} aria-hidden="true">
                <Icon name="arrow-right" size="18px" />
              </span>
            </a>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------- l'écran d'une famille -- */

function VueFamille({
  famille,
  onOuvrirProgramme,
  onDataChanged,
}: {
  famille: Famille;
  onOuvrirProgramme: () => void;
  onDataChanged: () => void;
}) {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  /* La mémoire des programmes importés : l'écran se redessine à chaque import,
     archivage ou suppression. */
  const memoire = useProgrammesImportes();
  const [deplie, setDeplie] = useState<string | null>(null);
  /*
   * Prérequis et matériel sont REPLIÉS par défaut : cinq objets détaillés
   * prenaient tout l'écran et repoussaient le bouton « Commencer » sous le
   * pli. Le titre dit combien il y en a ; un appui les déplie.
   */
  const [materielOuvert, setMaterielOuvert] = useState(false);
  const [aConfirmer, setAConfirmer] = useState<ProgrammeDefinition | null>(null);

  useEffect(() => {
    void tousLesCycles().then(setCycles);
  }, []);

  /* On arrive en haut de l'écran de la famille, pas au milieu. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function agir(programme: ProgrammeDefinition, action: Action) {
    if (action === 'aucune') return;

    if (action === 'reprendre') {
      const sien = cycles.find((c) => c.programmeId === programme.id && c.statut !== 'termine');
      if (sien?.id !== undefined) await activerCycle(sien.id);
      onDataChanged();
      onOuvrirProgramme();
      return;
    }

    if (action === 'recommencer' && aConfirmer?.id !== programme.id) {
      setAConfirmer(programme);
      return;
    }

    /*
     * Un cycle neuf part sans date : c'est l'écran Réglages qui la pose, comme
     * pour le tout premier. Inventer « aujourd'hui » poserait un calendrier
     * que personne n'a choisi.
     */
    await demarrerCycle({
      programmeId: programme.id,
      programmeVersion: programme.version,
      startDate: '',
    });
    setAConfirmer(null);
    onDataChanged();
    onOuvrirProgramme();
  }

  const ligneImportee = (cle: string) => memoire.programmes.find((r) => r.cle === cle) ?? null;
  const programmes = programmesDe(famille);
  const perso = famille.id === 'perso';
  /*
   * Une famille en PARCOURS (POWER, FEMMES) numérote ses étapes et montre, sur
   * chaque ligne, si elle est ouverte ou ce qui la débloque. Les autres
   * familles gardent leur liste simple (MASS numérote son ordre conseillé).
   */
  const enParcours = programmes.some((x) => x.deblocage);
  const vedette = programmeVedette(programmes, cycles);
  const autres = programmes.filter((p) => p !== vedette);

  const details = (p: ProgrammeDefinition, action: Action) => {
    const nbPrerequis = p.prerequis.length;
    const nbMateriel = p.materiel?.length ?? 0;
    return (
      <div className={local.details}>
        <p className={local.resume}>{p.resume}</p>

        {p.objectifs.length > 0 && (
          <>
            <h3 className={local.sousSection}>Objectifs</h3>
            <ul className={local.puces}>
              {p.objectifs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </>
        )}

        {nbPrerequis + nbMateriel > 0 && (
          /*
           * Prérequis et matériel à prévoir, AVANT de démarrer : de quoi
           * acheter une ceinture de lest à temps plutôt que de la découvrir en
           * semaine 1. Un seul repli pour les deux (maquette MAJK).
           */
          <div className={local.materielBloc}>
            <button
              type="button"
              className={local.materielTete}
              onClick={() => setMaterielOuvert((v) => !v)}
              aria-expanded={materielOuvert}
            >
              <span>
                {nbPrerequis > 0 && nbMateriel > 0
                  ? 'Prérequis et matériel'
                  : nbMateriel > 0
                    ? 'Matériel à prévoir'
                    : 'Prérequis'}
              </span>
              <span className={local.materielCompte}>
                {nbPrerequis > 0 && nbMateriel > 0
                  ? `${nbPrerequis} + ${nbMateriel}`
                  : `${nbPrerequis + nbMateriel}`}
              </span>
              <Icon name={materielOuvert ? 'chevron-up' : 'chevron-down'} size="16px" />
            </button>
            {materielOuvert && (
              <div className={local.materielCorps}>
                {nbPrerequis > 0 && (
                  <>
                    <h3 className={local.sousSection}>Prérequis</h3>
                    <ul className={local.puces}>
                      {p.prerequis.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </>
                )}
                {nbMateriel > 0 && (
                  <>
                    <h3 className={local.sousSection}>Matériel à prévoir</h3>
                    <ul className={local.materiel}>
                      {p.materiel!.map((m) => (
                        <li key={m.objet}>
                          <b>{m.objet}</b>
                          <span>{m.usage}</span>
                          {m.sinon && <span className={local.sinon}>Sinon : {m.sinon}</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {action !== 'aucune' && aConfirmer?.id !== p.id && (
          <button type="button" className={local.action} onClick={() => void agir(p, action)}>
            {action === 'reprendre' && <Icon name="play" size="18px" />}
            {LIBELLE[action]}
          </button>
        )}

        {aConfirmer?.id === p.id && (
          <div className={local.confirme}>
            <p>
              Un nouveau cycle s’ouvrira, vide. Ton cycle précédent garde toutes ses séances et
              toutes ses charges — il reste consultable.
            </p>
            <div className={local.boutons}>
              <button
                type="button"
                className={local.action}
                onClick={() => void agir(p, 'recommencer')}
              >
                Ouvrir un nouveau cycle
              </button>
              <button type="button" className={local.annuler} onClick={() => setAConfirmer(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {perso && ligneImportee(p.id) !== null && <DetailsImporte row={ligneImportee(p.id)!} />}

        {/* Le combiné d'évaluation : il se fait AVANT le programme, et reste
            accessible même quand le programme est encore à venir. */}
        {p.combineAvant && (
          <>
            <button
              type="button"
              className={`${local.action} ${local.actionSecondaire}`}
              onClick={() => {
                window.location.hash = '#/evaluation';
              }}
            >
              Combiné d’évaluation
            </button>
            <p className={local.resume}>
              {p.nom} démarre après ce combiné : développé couché, tirage vertical, squat, push
              press.
            </p>
          </>
        )}

        {action === 'aucune' && p.apercu !== undefined && (
          /* L'aperçu ouvre les écrans en lecture seule. Il ne crée aucun
             cycle : c'est pour regarder, pas pour démarrer, et la phrase le dit. */
          <>
            <button
              type="button"
              className={local.action}
              onClick={() => {
                window.location.hash = p.apercu!;
              }}
            >
              Voir l’aperçu
            </button>
            <p className={local.rien}>
              Aperçu : rien n’est encore enregistré. Ce programme n’est pas encore jouable dans
              l’application.
            </p>
          </>
        )}

        {action === 'aucune' && p.apercu === undefined && (
          <p className={local.rien}>Ce programme n’est pas encore jouable dans l’application.</p>
        )}
      </div>
    );
  };

  const ligne = (p: ProgrammeDefinition, enVedette: boolean) => {
    const rang = programmes.indexOf(p);
    const action = actionPour(p, cycles);
    const ouvert = enVedette || deplie === p.id;
    const acces = enParcours ? accesProgramme(p, cycles) : null;
    const entete = (
      <>
        {(enParcours || famille.ordreConseille) && (
          <span className={`${local.etape} ${enVedette ? local.etapeVedette : ''}`}>
            {rang + 1}
          </span>
        )}
        {/* Dans la famille, son nom est déjà dit : « CYCLE 1 » plutôt que
            « POWER CYCLE 1 ». Nom et durée ensemble : si la ligne manque de
            place, la durée passe dessous au lieu de couper le nom. */}
        <span className={local.nomDuree}>
          <span className={local.nom}>
            {p.nom.startsWith(`${famille.nom} `) ? p.nom.slice(famille.nom.length + 1) : p.nom}
          </span>
          <span className={local.duree}>{p.dureeSemaines} semaines</span>
        </span>
        <span className={`${local.etat} ${p.statut === 'disponible' ? local.dispo : ''}`}>
          {p.statut === 'disponible' ? 'Disponible' : 'À venir'}
        </span>
      </>
    );
    return (
      <li key={p.id} className={`${local.ligne} ${enVedette ? local.vedette : ''}`}>
        {enVedette ? (
          <div className={local.titreLigne}>{entete}</div>
        ) : (
          <button
            type="button"
            className={local.titreLigne}
            onClick={() => setDeplie(ouvert ? null : p.id)}
            aria-expanded={ouvert}
          >
            {entete}
            <Icon name={ouvert ? 'chevron-up' : 'chevron-down'} size="16px" />
          </button>
        )}
        {acces && (
          <p className={`${local.badge} ${acces.ouvert ? local.badgeOuvert : ''}`}>
            <span aria-hidden="true">{acces.ouvert ? '✓' : '🔒'}</span>
            {acces.badge}
          </p>
        )}
        {ouvert && details(p, action)}
      </li>
    );
  };

  return (
    /*
     * L'écran prend les couleurs de SA famille (cobalt, rouge, rose) : le
     * bouton « Reprendre » de POWER est cobalt, pas charbon. ME, MYSELF & I
     * n'a pas de thème propre : elle garde celui de la plateforme.
     */
    <div className={styles.screen} data-theme={THEME_FAMILLE[famille.id]}>
      <header
        className={local.heroFamille}
        style={{ '--teinte': HABILLAGE[famille.id].teinte } as CSSProperties}
      >
        {HABILLAGE[famille.id].photo !== undefined && (
          <span className={local.bannierePhoto} aria-hidden="true">
            <Visuel nom={HABILLAGE[famille.id].photo!} sizes="100vw" prioritaire />
          </span>
        )}
        <span className={local.heroVoile} aria-hidden="true" />
        <a className={local.retourFamilles} href="#/catalogue">
          <Icon name="arrow-left" size="18px" />
          Programmes
        </a>
        <div className={local.heroTexte}>
          {famille.sousTitre && <p className={local.heroSurTitre}>{famille.sousTitre}</p>}
          <h1 className={local.heroNom}>{famille.nom}</h1>
          <p className={local.heroCompte}>{compteFamille(famille, programmes)}</p>
        </div>
      </header>

      <section id={`famille-${famille.id}`} className={local.corpsFamille}>
        <p className={local.resumeFamille}>{famille.resume}</p>

        {perso && (
          <ImportProgramme
            onImporte={(cle) => {
              setDeplie(cle);
            }}
          />
        )}

        {perso && memoire.etat === 'erreur' && (
          <p className={persoStyles.erreurMemoire} role="alert">
            Tes programmes importés n’ont pas pu être lus.{' '}
            <button
              type="button"
              className={persoStyles.secondaire}
              onClick={() => void hydraterProgrammesImportes()}
            >
              Réessayer
            </button>
          </p>
        )}

        {programmes.length === 0 && (
          <p className={local.rien}>
            {perso ? 'Aucun programme importé pour l’instant.' : 'Aucun programme pour l’instant.'}
          </p>
        )}

        {/* L'ordre conseillé se DIT, pour qu'un numéro ne se lise pas comme un
            verrou : chacun se démarre librement. */}
        {famille.ordreConseille && (
          <p className={local.ordreConseille}>Ordre conseillé, pas obligatoire</p>
        )}

        {vedette !== null && <ul className={local.liste}>{ligne(vedette, true)}</ul>}

        {autres.length > 0 && (
          <>
            {vedette !== null && (
              <h2 className={local.titreAutres}>
                {enParcours ? 'Les autres étapes' : 'Les autres programmes'}
              </h2>
            )}
            <ul className={local.liste}>{autres.map((p) => ligne(p, false))}</ul>
          </>
        )}

        {/* Les versions archivées : hors de la liste, jamais perdues. */}
        {perso && memoire.programmes.some((r) => r.archive) && (
          <div className={persoStyles.archives}>
            <h3 className={local.sousSection}>Archivés</h3>
            <ul className={local.liste}>
              {memoire.programmes
                .filter((r) => r.archive)
                .map((r) => (
                  <li key={r.cle} className={local.ligne}>
                    <p className={local.nom}>{r.nom}</p>
                    <DetailsImporte row={r} />
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
