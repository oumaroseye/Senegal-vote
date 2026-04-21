const DEPARTEMENT_CENTRES = {
  Yeumbeul: ['Yeumbeul Nord', 'Yeumbeul Sud'],
  'Keur Massar': ['Keur Massar Nord', 'Keur Massar Sud'],
  Pikine: ['Pikine Est', 'Pikine Ouest'],
  Guediawaye: ['Golf Sud', 'Sam Notaire']
};

const BUREAUX = ['Bureau n01', 'Bureau n02', 'Bureau n03', 'Bureau n04', 'Bureau n05'];

const isValidDepartement = (departement) => Object.keys(DEPARTEMENT_CENTRES).includes(departement);
const isValidCentre = (departement, centre) =>
  isValidDepartement(departement) && DEPARTEMENT_CENTRES[departement].includes(centre);
const isValidBureau = (bureau) => BUREAUX.includes(bureau);

module.exports = {
  DEPARTEMENT_CENTRES,
  BUREAUX,
  isValidDepartement,
  isValidCentre,
  isValidBureau
};
