import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiUser, FiRefreshCw, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { voteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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

const Vote = () => {
  const navigate = useNavigate();
  const { electeur, isAuthenticated } = useAuth();
  const [candidats, setCandidats] = useState([]);
  const [selectedCandidat, setSelectedCandidat] = useState(null);
  const [step, setStep] = useState(1); // 1: Choix, 2: Succès
  const [loading, setLoading] = useState(false);
  const [voteResult, setVoteResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCandidats();
  }, [isAuthenticated]);

  const fetchCandidats = async () => {
    try {
      const res = await voteAPI.getCandidats();
      if (res.data.success) setCandidats(res.data.data);
    } catch (err) {
      if (err.response?.data?.code === 'VOTE_CLOSED') {
        toast.error(err.response?.data?.message || 'Vote indisponible pour le moment.');
      } else {
        toast.error('Erreur lors du chargement des candidats');
      }
    }
  };

  // Sélectionner un candidat et confirmer automatiquement le vote
  const handleSelectCandidat = async () => {
    if (!selectedCandidat) {
      toast.warning('Veuillez sélectionner un candidat ou le vote blanc');
      return;
    }
    setLoading(true);
    try {
      const candidatId = selectedCandidat.id === 'blanc' ? 'blanc' : selectedCandidat.id;
      const res = await voteAPI.selectionnerCandidat(candidatId);
      if (res.data.success) {
        setVoteResult(res.data.data);
        setStep(2);
        toast.success('Vote confirmé avec succès.');
      }
    } catch (err) {
      if (err.response?.data?.code === 'VOTE_CLOSED') {
        toast.error(err.response?.data?.message || 'La période de vote est fermée.');
      } else {
        toast.error(err.response?.data?.message || 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Bandeau supérieur */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-senegal rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🗳️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {step === 1 && 'Choisissez votre Candidat'}
                {step === 2 && 'Vote Enregistré !'}
              </h1>
              <p className="text-gray-400 text-sm">Élection Présidentielle 2026</p>
            </div>
          </div>
          {electeur && (
            <div className="flex items-center gap-3 bg-green-50 px-5 py-3 rounded-xl">
              <div className="w-10 h-10 bg-[#007B3A] rounded-full flex items-center justify-center text-white font-bold">
                {electeur.prenom?.[0]}{electeur.nom?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{electeur.prenom} {electeur.nom}</p>
                <p className="text-xs text-gray-500">Région: {electeur.region}</p>
              </div>
            </div>
          )}
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {['Choix', 'Succès'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step > i + 1 ? 'bg-[#007B3A] text-white' : step === i + 1 ? 'bg-[#007B3A] text-white pulse-green' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? <FiCheck /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-[#007B3A]' : 'text-gray-400'}`}>{label}</span>
              {i < 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-[#007B3A]' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ÉTAPE 1: Choix du candidat */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {candidats.map((candidat) => (
                  <motion.div
                    key={candidat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCandidat(candidat)}
                    className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 ${
                      selectedCandidat?.id === candidat.id
                        ? 'border-[#007B3A] shadow-xl ring-4 ring-green-50'
                        : 'border-gray-100 shadow-md hover:shadow-lg hover:border-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      {/* Badge de sélection */}
                      {selectedCandidat?.id === candidat.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <div className="w-8 h-8 bg-[#007B3A] rounded-full flex items-center justify-center">
                            <FiCheck size={16} className="text-white" />
                          </div>
                        </motion.div>
                      )}

                      {getPhoto(candidat) ? (
                        <img
                          src={getPhoto(candidat)}
                          alt={`${candidat.prenom} ${candidat.nom}`}
                          className="w-24 h-24 rounded-full mx-auto mb-5 object-cover shadow-lg border-4 border-[#007B3A]"
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-bold shadow-lg bg-[#007B3A]"
                        >
                          {candidat.prenom[0]}{candidat.nom[0]}
                        </div>
                      )}
                      
                      <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-green-50 text-[#007B3A]">
                        Candidat N° {candidat.numero_ordre}
                      </div>
                      
                      <h3 className="font-bold text-gray-800 text-xl">
                        {candidat.prenom} {candidat.nom}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 font-medium">{candidat.parti}</p>
                      {candidat.slogan && (
                        <p className="text-sm text-gray-400 italic mt-3 border-t border-gray-100 pt-3">"{candidat.slogan}"</p>
                      )}

                      {selectedCandidat?.id === candidat.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 bg-green-50 py-2 px-4 rounded-lg"
                        >
                          <span className="text-[#007B3A] text-sm font-semibold flex items-center justify-center gap-1">
                            <FiCheckCircle size={16} /> Sélectionné
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Option Vote Blanc */}
                <motion.div
                  key="blanc"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCandidat({ id: 'blanc', prenom: 'Vote', nom: 'Blanc', parti: 'Bulletin nul' })}
                  className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 border-dashed ${
                    selectedCandidat?.id === 'blanc'
                      ? 'border-gray-500 shadow-xl ring-4 ring-gray-100 bg-gray-50'
                      : 'border-gray-300 shadow-md hover:shadow-lg hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    {selectedCandidat?.id === 'blanc' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <FiCheck size={16} className="text-white" />
                        </div>
                      </motion.div>
                    )}

                    <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-gray-400 text-4xl bg-gray-100 shadow-lg border-4 border-gray-300">
                      ○
                    </div>

                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-gray-100 text-gray-500">
                      Bulletin nul
                    </div>

                    <h3 className="font-bold text-gray-600 text-xl">Vote Blanc</h3>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Ne choisir aucun candidat</p>

                    {selectedCandidat?.id === 'blanc' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-gray-100 py-2 px-4 rounded-lg"
                      >
                        <span className="text-gray-500 text-sm font-semibold flex items-center justify-center gap-1">
                          <FiCheckCircle size={16} /> Sélectionné
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>

              {selectedCandidat && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-md mb-6"
                >
                  <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg mb-4">
                    <FiAlertCircle size={20} />
                    <p className="text-sm">
                      {selectedCandidat.id === 'blanc' ? (
                        <>Vous êtes sur le point de soumettre un <strong>vote blanc (bulletin nul)</strong>. Votre vote sera confirmé immédiatement.</>
                      ) : (
                        <>Vous êtes sur le point de voter pour <strong>{selectedCandidat.prenom} {selectedCandidat.nom}</strong> ({selectedCandidat.parti}). Votre vote sera confirmé immédiatement.</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleSelectCandidat}
                    disabled={loading}
                    className="w-full btn-senegal justify-center py-3.5 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Envoi du code...</span>
                    ) : (
                      <span className="flex items-center gap-2">Confirmer mon vote <FiCheck /></span>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ÉTAPE 2: Succès */}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
                    <FiCheckCircle size={48} className="text-[#007B3A]" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci pour votre vote !</h2>
                <p className="text-gray-500 mb-6">
                  Votre vote a été enregistré avec succès et est sécurisé.
                </p>

                {voteResult && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(voteResult.date_vote).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Référence:</span>
                      <span className="font-mono text-xs">{voteResult.hash_vote?.substring(0, 16)}...</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 btn-senegal justify-center"
                  >
                    Retour accueil
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 btn-senegal-outline"
                  >
                    Accueil
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Vote;
