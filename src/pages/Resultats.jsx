import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCheckCircle, FiBarChart2, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
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

const Resultats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedInfo, setLockedInfo] = useState(null);

  useEffect(() => {
    fetchResultats();
  }, []);

  const fetchResultats = async () => {
    try {
      const res = await publicAPI.getResultats();
      if (res.data.success) {
        setData(res.data.data);
        setLockedInfo(null);
      }
    } catch (err) {
      if (err.response?.data?.code === 'RESULTS_HIDDEN') {
        setLockedInfo(err.response?.data?.data || {});
      } else {
        console.error('Erreur résultats:', err);
      }
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

  if (lockedInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-gray-100">
            <FiAlertCircle size={50} className="mx-auto mb-5 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Résultats non disponibles</h1>
            <p className="text-gray-600">
              Les résultats seront visibles uniquement après la fin officielle du vote.
            </p>
            {lockedInfo.endsAt && (
              <p className="mt-4 text-sm text-gray-500">
                Fin prévue: {new Date(lockedInfo.endsAt).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const maxVotes = data?.resultats?.length > 0 ? Math.max(...data.resultats.map(r => r.nombre_votes)) : 1;

  return (
    <div className="min-h-screen bg-gray-50 w-full py-16 px-6 sm:px-10 lg:px-16">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-[#007B3A] font-semibold text-sm uppercase tracking-widest">Élection Présidentielle 2026</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mt-4">Résultats en Direct</h1>
          <p className="text-gray-500 mt-4 text-lg">
            Les résultats sont mis à jour en temps réel
          </p>
        </motion.div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
          {[
            { label: 'Total Inscrits', value: data?.total_electeurs || 0, icon: FiUsers, color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Votes', value: data?.total_votes || 0, icon: FiCheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Votes Blancs', value: data?.votes_blancs || 0, icon: FiAlertCircle, color: 'bg-gray-50 text-gray-600' },
            { label: 'Participation', value: `${data?.taux_participation || 0}%`, icon: FiTrendingUp, color: 'bg-amber-50 text-amber-600' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${stat.color.split(' ')[0]} rounded-2xl p-8 text-center`}
            >
              <stat.icon size={30} className={`mx-auto mb-3 ${stat.color.split(' ')[1]}`} />
              <div className={`text-3xl md:text-4xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Résultats par candidat */}
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-10 flex items-center gap-3">
            <FiBarChart2 size={24} className="text-[#007B3A]" /> Résultats par Candidat
          </h2>

          <div className="space-y-8">
            {data?.resultats?.map((candidat, i) => (
              <motion.div
                key={candidat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5"
              >
                {/* Rang */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-[#FDEF42] text-gray-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </div>

                {/* Photo ou Avatar */}
                {getPhoto(candidat) ? (
                  <img
                    src={getPhoto(candidat)}
                    alt={`${candidat.prenom} ${candidat.nom}`}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-3 border-[#007B3A]"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 bg-[#007B3A]"
                  >
                    {candidat.prenom?.[0]}{candidat.nom?.[0]}
                  </div>
                )}

                {/* Info + Barre */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <span className="font-bold text-gray-800 text-lg">{candidat.prenom} {candidat.nom}</span>
                      <span className="text-base text-gray-400 ml-3">({candidat.parti})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-2xl" style={{ color: candidat.couleur }}>
                        {candidat.pourcentage || 0}%
                      </span>
                      <span className="text-sm text-gray-400 ml-3">
                        ({candidat.nombre_votes} votes)
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxVotes > 0 ? (candidat.nombre_votes / maxVotes) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: candidat.couleur || '#007B3A' }}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {(!data?.resultats || data.resultats.length === 0) && (
            <div className="text-center py-20 text-gray-400">
              <FiBarChart2 size={56} className="mx-auto mb-5" />
              <p className="text-lg">Aucun résultat disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resultats;
