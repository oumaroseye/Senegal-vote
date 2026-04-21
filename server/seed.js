/**
 * Script de peuplement de la base de données
 * Usage: node seed.js
 */
require('dotenv').config();
const { sequelize } = require('./config/database');
const Admin = require('./models/Admin');
const Electeur = require('./models/Electeur');
const Candidat = require('./models/Candidat');
const Election = require('./models/Election');

// Import des associations
require('./models/index');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie.');

    // Synchroniser les modèles (force: true pour recréer les tables)
    await sequelize.sync({ force: true });
    console.log('✅ Tables recréées.');

    // ==================== ADMIN ====================
    const admin = await Admin.create({
      prenom: 'Admin',
      nom: 'Principal',
      email: 'admin@senegalvote.sn',
      password: 'admin123',
      role: 'super_admin'
    });
    console.log('✅ Admin créé: admin@senegalvote.sn / admin123');

    // ==================== ELECTION ====================
    const election = await Election.create({
      titre: 'Élection Présidentielle du Sénégal 2025',
      description: 'Élection présidentielle pour le mandat 2025-2030',
      type: 'presidentielle',
      date_debut: new Date('2025-03-24T08:00:00'),
      date_fin: new Date('2025-03-24T18:00:00'),
      statut: 'en_cours'
    });
    console.log('✅ Élection créée.');

    // ==================== CANDIDATS ====================
    const candidats = await Candidat.bulkCreate([
      {
        prenom: 'Bassirou Diomaye',
        nom: 'Faye',
        parti: 'PASTEF',
        slogan: 'Le Sénégal Nouveau',
        programme: 'Réformes institutionnelles, souveraineté économique, lutte contre la corruption.',
        photo_url: '/candidats/diomaye-faye.png',
        couleur: '#007B3A',
        numero_ordre: 1,
        election_id: election.id
      },
      {
        prenom: 'Amadou',
        nom: 'Ba',
        parti: 'Coalition Benno Bokk Yakaar',
        slogan: 'L\'expérience au service du peuple',
        programme: 'Continuité des projets, développement économique, emploi des jeunes.',
        photo_url: '/candidats/amadou-ba.png',
        couleur: '#FFD700',
        numero_ordre: 2,
        election_id: election.id
      },
      {
        prenom: 'Idrissa',
        nom: 'Seck',
        parti: 'Rewmi',
        slogan: 'Un Sénégal uni et prospère',
        programme: 'Unité nationale, décentralisation, agriculture moderne.',
        photo_url: '/candidats/idrissa-seck.png',
        couleur: '#1E90FF',
        numero_ordre: 3,
        election_id: election.id
      },
      {
        prenom: 'Ousmane',
        nom: 'Sonko',
        parti: 'Coalition Diomaye Président',
        slogan: 'La rupture pour le progrès',
        programme: 'Souveraineté, emploi des jeunes, réforme de l\'éducation.',
        photo_url: '/candidats/ousmane-sonko.png',
        couleur: '#DC143C',
        numero_ordre: 4,
        election_id: election.id
      },
      {
        prenom: 'Anta Babacar',
        nom: 'Ngom',
        parti: 'Alternative Citoyenne',
        slogan: 'Le Sénégal de demain',
        programme: 'Numérique, innovation, égalité des chances.',
        photo_url: '/candidats/anta-babacar-ngom.png',
        couleur: '#8A2BE2',
        numero_ordre: 5,
        election_id: election.id
      }
    ]);
    console.log(`✅ ${candidats.length} candidats créés.`);

    // ==================== ELECTEURS (exemples) ====================
    const electeurs = await Electeur.bulkCreate([
      {
        prenom: 'Moussa',
        nom: 'Diallo',
        date_naissance: '1990-05-15',
        adresse: 'Médina, Dakar',
        region: 'Dakar',
        numero_cni: '1234567890123',
        telephone: '771234567',
        email: 'moussa.diallo@email.com',
        code_electoral: 'SN-ABD12-XY78',
        empreinte_id: 1
      },
      {
        prenom: 'Fatou',
        nom: 'Ndiaye',
        date_naissance: '1985-08-22',
        adresse: 'Plateau, Dakar',
        region: 'Dakar',
        numero_cni: '2345678901234',
        telephone: '782345678',
        email: 'fatou.ndiaye@email.com',
        code_electoral: 'SN-CDE34-ZW56',
        empreinte_id: 2
      },
      {
        prenom: 'Ibrahima',
        nom: 'Fall',
        date_naissance: '1995-01-10',
        adresse: 'Thiès Centre',
        region: 'Thiès',
        numero_cni: '3456789012345',
        telephone: '763456789',
        email: 'ibrahima.fall@email.com',
        code_electoral: 'SN-FGH56-UV34',
        empreinte_id: 3
      },
      {
        prenom: 'Aminata',
        nom: 'Sow',
        date_naissance: '1988-12-03',
        adresse: 'Saint-Louis Nord',
        region: 'Saint-Louis',
        numero_cni: '4567890123456',
        telephone: '774567890',
        email: 'aminata.sow@email.com',
        code_electoral: 'SN-IJK78-ST12',
        empreinte_id: 4
      },
      {
        prenom: 'Ousmane',
        nom: 'Mbaye',
        date_naissance: '1992-07-20',
        adresse: 'Parcelles Assainies, Dakar',
        region: 'Dakar',
        numero_cni: '5678901234567',
        telephone: '785678901',
        email: 'ousmane.mbaye@email.com',
        code_electoral: 'SN-LMN90-QR34',
        empreinte_id: 5
      }
    ]);
    console.log(`✅ ${electeurs.length} électeurs créés.`);

    console.log('\n========================================');
    console.log('🎉 Base de données peuplée avec succès !');
    console.log('========================================');
    console.log('\n📋 Comptes de test:');
    console.log('   Admin: admin@senegalvote.sn / admin123');
    console.log('\n📋 Électeurs de test:');
    console.log('   Moussa Diallo  - CNI: 1234567890123 - Tél: 771234567 - Code: SN-ABD12-XY78');
    console.log('   Fatou Ndiaye   - CNI: 2345678901234 - Tél: 782345678 - Code: SN-CDE34-ZW56');
    console.log('   Ibrahima Fall  - CNI: 3456789012345 - Tél: 763456789 - Code: SN-FGH56-UV34');
    console.log('   Aminata Sow    - CNI: 4567890123456 - Tél: 774567890 - Code: SN-IJK78-ST12');
    console.log('   Ousmane Mbaye  - CNI: 5678901234567 - Tél: 785678901 - Code: SN-LMN90-QR34');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
};

seed();
