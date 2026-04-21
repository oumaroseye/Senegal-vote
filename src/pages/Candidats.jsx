import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiAward, FiBookOpen } from 'react-icons/fi';
import { publicAPI } from '../services/api';

// Mapping des photos des candidats (fallback si photo_url absent)
const PHOTO_MAP = {
  'Faye': '/candidats/diomaye-faye.png',
  'Ba': '/candidats/amadou-ba.png',
  'Seck': '/candidats/idrissa-seck.png',
  'Sall': '/candidats/khalifa-sall.png',
  'Ngom': '/candidats/anta-babacar-ngom.png',
};

const getPhoto = (candidat) => {
  return candidat.photo_url || PHOTO_MAP[candidat.nom] || null;
};

const Candidats = () => {
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCandidats();
  }, []);

  const fetchCandidats = async () => {
    try {
      const res = await publicAPI.getCandidats();
      if (res.data.success && Array.isArray(res.data.data)) {
        setCandidats(res.data.data);
      }
    } catch (err) {
      console.error('Erreur candidats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#007B3A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <section className="gradient-hero text-white py-20 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="bg-white/10 px-5 py-2 rounded-full text-sm">Élection Présidentielle 2026</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-8">Candidats</h1>
            <p className="text-gray-300 mt-6 max-w-3xl mx-auto text-lg text-center">
              Découvrez les candidats en lice pour l'élection présidentielle et comparez leurs programmes
            </p>
          </motion.div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-16">
        {/* Grille des candidats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {candidats.map((candidat, i) => (
            <motion.div
              key={candidat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setSelected(selected?.id === candidat.id ? null : candidat)}
              className={`bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all card-hover border-2 ${
                selected?.id === candidat.id ? 'border-[#007B3A] shadow-xl' : 'border-transparent'
              }`}
            >
              {/* Bandeau vert */}
              <div className="h-2 bg-[#007B3A]"></div>

              <div className="p-8 text-center">
                {/* Photo ou Avatar */}
                {getPhoto(candidat) ? (
                  <img
                    src={getPhoto(candidat)}
                    alt={`${candidat.prenom} ${candidat.nom}`}
                    className="w-28 h-28 rounded-full mx-auto mb-5 object-cover shadow-lg border-4 border-[#007B3A]"
                  />
                ) : (
                  <div
                    className="w-28 h-28 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-bold shadow-lg bg-[#007B3A]"
                  >
                    {candidat.prenom?.[0]}{candidat.nom?.[0]}
                  </div>
                )}

                {/* Numéro d'ordre */}
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-green-50 text-[#007B3A]">
                  Candidat N° {candidat.numero_ordre || i + 1}
                </div>

                {/* Nom */}
                <h3 className="text-xl font-bold text-gray-800">
                  {candidat.prenom} {candidat.nom}
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{candidat.parti}</p>

                {/* Slogan */}
                {candidat.slogan && (
                  <p className="text-sm text-gray-400 italic mt-3 border-t border-gray-100 pt-3">
                    "{candidat.slogan}"
                  </p>
                )}

                {/* Programme (visible quand sélectionné) */}
                {selected?.id === candidat.id && candidat.programme && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-100 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FiBookOpen size={16} className="text-[#007B3A]" />
                      <span className="text-sm font-semibold text-gray-700">Programme</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{candidat.programme}</p>
                  </motion.div>
                )}

                {/* Indicateur cliquez pour voir */}
                <p className="text-xs text-gray-400 mt-4">
                  {selected?.id === candidat.id ? 'Cliquez pour réduire' : 'Cliquez pour voir le programme'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message si aucun candidat */}
        {candidats.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FiUsers size={56} className="mx-auto mb-5" />
            <p className="text-lg">Aucun candidat disponible pour le moment</p>
          </div>
        )}

        {/* Section Comparer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-10 border border-green-100 text-center"
        >
          <FiAward size={40} className="mx-auto text-[#007B3A] mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Comparez les programmes des candidats</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center">
            Cliquez sur chaque candidat pour découvrir son programme et faire un choix éclairé 
            lors de l'élection présidentielle. Votre vote est important !
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Candidats;
