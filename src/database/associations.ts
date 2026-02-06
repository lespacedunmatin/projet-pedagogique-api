/**
 * Configuration des associations Sequelize
 * À appeler une seule fois au démarrage de l'application
 */

import Animateur from '../models/Animateur';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Objectif from '../models/Objectif';
import Activite from '../models/Activite';
import ActiviteObjectif from '../models/ActiviteObjectif';

export function setupAssociations() {
  // Animateur <-> Projet (many-to-many via AnimateurProjet)
  Animateur.belongsToMany(Projet, {
    through: AnimateurProjet,
    foreignKey: 'animateur_id',
    otherKey: 'projet_id',
    as: 'projets',
  });

  Projet.belongsToMany(Animateur, {
    through: AnimateurProjet,
    foreignKey: 'projet_id',
    otherKey: 'animateur_id',
    as: 'animateurs',
  });

  // AnimateurProjet associations
  AnimateurProjet.belongsTo(Animateur, {
    foreignKey: 'animateur_id',
    as: 'animateur',
  });

  AnimateurProjet.belongsTo(Projet, {
    foreignKey: 'projet_id',
    as: 'projet',
  });

  // Projet -> Objectif (one-to-many)
  Projet.hasMany(Objectif, {
    foreignKey: 'projet_id',
    as: 'objectifs',
  });

  Objectif.belongsTo(Projet, {
    foreignKey: 'projet_id',
    as: 'projet',
  });

  // Objectif -> Animateur (deleted_by)
  Objectif.belongsTo(Animateur, {
    foreignKey: 'deleted_by',
    as: 'deletedByAnimateur',
  });

  // Objectif -> Animateur (created_by)
  Objectif.belongsTo(Animateur, {
    foreignKey: 'created_by',
    as: 'createdByAnimateur',
  });

  // Objectif -> Animateur (updated_by)
  Objectif.belongsTo(Animateur, {
    foreignKey: 'updated_by',
    as: 'updatedByAnimateur',
  });

  // Projet -> Activite (one-to-many)
  Projet.hasMany(Activite, {
    foreignKey: 'projet_id',
    as: 'activites',
  });

  Activite.belongsTo(Projet, {
    foreignKey: 'projet_id',
    as: 'projet',
  });

  // Activite -> Animateur (created_by)
  Activite.belongsTo(Animateur, {
    foreignKey: 'created_by',
    as: 'createdByAnimateur',
  });

  // Activite -> Animateur (responsable_id)
  Activite.belongsTo(Animateur, {
    foreignKey: 'responsable_id',
    as: 'responsableAnimateur',
  });

  // Activite -> Animateur (updated_by)
  Activite.belongsTo(Animateur, {
    foreignKey: 'updated_by',
    as: 'updatedByAnimateur',
  });

  // Activite -> Animateur (deleted_by)
  Activite.belongsTo(Animateur, {
    foreignKey: 'deleted_by',
    as: 'deletedByAnimateur',
  });

  // Activite <-> Objectif (many-to-many via ActiviteObjectif)
  Activite.belongsToMany(Objectif, {
    through: ActiviteObjectif,
    foreignKey: 'activite_id',
    otherKey: 'objectif_id',
    as: 'objectifs',
  });

  Objectif.belongsToMany(Activite, {
    through: ActiviteObjectif,
    foreignKey: 'objectif_id',
    otherKey: 'activite_id',
    as: 'activites',
  });

  // ActiviteObjectif associations
  ActiviteObjectif.belongsTo(Activite, {
    foreignKey: 'activite_id',
    as: 'activite',
  });

  ActiviteObjectif.belongsTo(Objectif, {
    foreignKey: 'objectif_id',
    as: 'objectif',
  });

  console.log('✓ Associations Sequelize configurées');
}
