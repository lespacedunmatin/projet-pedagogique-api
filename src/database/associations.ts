/**
 * Configuration des associations Sequelize
 * À appeler une seule fois au démarrage de l'application
 */

import Animateur from '../models/Animateur';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Objectif from '../models/Objectif';

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

  // Objectif -> Animateur (modified_by)
  Objectif.belongsTo(Animateur, {
    foreignKey: 'modified_by',
    as: 'modifiedByAnimateur',
  });

  console.log('✓ Associations Sequelize configurées');
}
