const Election = require('../models/Election');
const { Op } = require('sequelize');

const getElectionWindowStatus = async () => {
  const election = await Election.findOne({
    where: { statut: { [Op.in]: ['a_venir', 'en_cours', 'terminee'] } },
    order: [['date_debut', 'DESC']]
  });

  if (!election) {
    return {
      hasElection: false,
      canVote: false,
      canShowResults: false,
      canModify: true,
      phase: 'no_election',
      message: 'Aucune élection planifiée.'
    };
  }

  const now = new Date();
  const debut = new Date(election.date_debut);
  const fin = new Date(election.date_fin);

  if (now < debut) {
    return {
      hasElection: true,
      canVote: false,
      canShowResults: false,
      canModify: true,
      phase: 'before_start',
      election,
      startsAt: debut.toISOString(),
      endsAt: fin.toISOString(),
      remainingMsToStart: Math.max(0, debut.getTime() - now.getTime()),
      message: 'Le vote n’a pas encore commencé.'
    };
  }

  if (now >= debut && now <= fin) {
    return {
      hasElection: true,
      canVote: true,
      canShowResults: false,
      canModify: false,
      phase: 'in_progress',
      election,
      startsAt: debut.toISOString(),
      endsAt: fin.toISOString(),
      remainingMsToEnd: Math.max(0, fin.getTime() - now.getTime()),
      message: 'Le vote est en cours.'
    };
  }

  return {
    hasElection: true,
    canVote: false,
    canShowResults: true,
    canModify: true,
    phase: 'finished',
    election,
    startsAt: debut.toISOString(),
    endsAt: fin.toISOString(),
    message: 'Le vote est terminé.'
  };
};

module.exports = { getElectionWindowStatus };
