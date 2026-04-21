import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiArrowRight, FiRefreshCw, FiAlertCircle, FiCheck, FiWifi, FiCpu, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE = '/api/arduino';

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

const VoteArduino = () => {
  // ═══ États ═══
  const [step, setStep] = useState(1);
  // 1: Saisie CNI
  // 2: Attente scan empreinte Arduino
  // 3: Choix du candidat
  // 4: Confirmation
  // 5: Vote enregistré

  const [numeroCni, setNumeroCni] = useState('');
  const [electeur, setElecteur] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [selectedCandidat, setSelectedCandidat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voteResult, setVoteResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);
  /** Évite deux POST /register-and-prepare en parallèle (double tick du polling) */
  const registerPrepareLockRef = useRef(false);
  const [dots, setDots] = useState('');
  const [compteur, setCompteur] = useState(0);

  // Animation points d'attente
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Polling pour détecter le scan d'empreinte (étape 2)
  useEffect(() => {
    if (!polling || !electeur) return;

    const checkScan = async () => {
      try {
        const res = await axios.get(`${API_BASE}/scan-status`);
        if (res.data.success && res.data.hasScan) {
          if (registerPrepareLockRef.current) return;
          registerPrepareLockRef.current = true;
          const scanData = res.data.data;

          // Enregistrer l'empreinte + préparer le vote
          try {
            const prepRes = await axios.post(`${API_BASE}/register-and-prepare`, {
              numero_cni: electeur.numero_cni,
              empreinte_id: scanData.electeur.empreinte_id
            });

            if (prepRes.data.success) {
              setElecteur(prepRes.data.data.electeur);
              setCandidats(prepRes.data.data.candidats);
              setPolling(false);
              setStep(3);
              toast.success(`${prepRes.data.data.electeur.prenom} ${prepRes.data.data.electeur.nom} identifié !`);
            }
          } catch (err) {
            const code = err.response?.data?.code;
            if (code === 'EMPREINTE_CNI_MISMATCH' || code === 'WRONG_FINGER_FOR_CNI') {
              toast.error('Cette empreinte ne correspond pas au CNI saisi. Vérifiez le doigt ou recommencez.');
            } else if (code === 'DEJA_VOTE') {
              toast.error(err.response?.data?.message || 'Cet électeur a déjà voté.');
            } else {
              toast.error(err.response?.data?.message || 'Erreur lors de la préparation.');
            }
            setPolling(false);
            setStep(1);
          } finally {
            registerPrepareLockRef.current = false;
          }
        }
      } catch (err) {
        // Silencieux - on continue le polling
      }
    };

    checkScan();
    pollingRef.current = setInterval(checkScan, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [polling, electeur]);

  // ═══ Étape 1 : Rechercher l'électeur par CNI ═══
  const handleRechercheCni = async (e) => {
    e.preventDefault();
    if (!numeroCni.trim()) {
      toast.warning('Veuillez saisir le numéro de CNI.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/find-by-cni`, { numero_cni: numeroCni.trim() });
      if (res.data.success) {
        setElecteur(res.data.data);
        setStep(2);
        setPolling(true);
        toast.info(`${res.data.data.prenom} ${res.data.data.nom} trouvé. Posez le doigt sur le capteur.`);
      }
    } catch (err) {
      if (err.response?.data?.code === 'VOTE_CLOSED') {
        toast.error(err.response?.data?.message || 'La période de vote est fermée.');
      } else {
        toast.error(err.response?.data?.message || 'Électeur non trouvé.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══ Étape 4 : Envoyer le vote ═══
  const handleVote = async () => {
    if (!selectedCandidat) {
      toast.warning('Veuillez sélectionner un candidat.');
      return;
    }

    setLoading(true);
    try {
      const candidatId = selectedCandidat.id === 'blanc' ? 'blanc' : selectedCandidat.id;
      const res = await axios.post(`${API_BASE}/web-vote`, {
        electeur_id: electeur.electeur_id,
        candidat_id: candidatId,
        device_id: 'WEB_ARDUINO'
      });

      if (res.data.success) {
        setVoteResult(res.data.data);
        setStep(5);
        setCompteur(prev => prev + 1);
        toast.success('Vote enregistré avec succès !');
      }
    } catch (err) {
      if (err.response?.data?.code === 'VOTE_CLOSED') {
        toast.error(err.response?.data?.message || 'La période de vote est fermée.');
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors du vote.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══ Réinitialiser pour le prochain électeur ═══
  const handleReset = async () => {
    try { await axios.post(`${API_BASE}/clear-scan`); } catch (err) { /* pas critique */ }
    registerPrepareLockRef.current = false;
    setStep(1);
    setElecteur(null);
    setCandidats([]);
    setSelectedCandidat(null);
    setVoteResult(null);
    setNumeroCni('');
    setPolling(false);
  };

  // Annuler l'attente
  const handleCancelWait = () => {
    registerPrepareLockRef.current = false;
    setPolling(false);
    setStep(1);
    setElecteur(null);
    setNumeroCni('');
  };

  // Labels des étapes
  const stepLabels = ['CNI', 'Empreinte', 'Choix', 'Confirmation', 'Terminé'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ═══ En-tête ═══ */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#007B3A] to-[#00A04E] rounded-xl flex items-center justify-center shadow-lg">
                <FiCpu className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Vote par Empreinte Digitale</h1>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <FiWifi className="text-green-500" />
                  Module Arduino — Élection Présidentielle 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {compteur > 0 && (
                <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                  <span className="text-green-700 font-semibold text-sm">{compteur} vote{compteur > 1 ? 's' : ''}</span>
                </div>
              )}
              {electeur && step >= 2 && step <= 4 && (
                <div className="flex items-center gap-3 bg-green-50 px-5 py-3 rounded-xl border border-green-200">
                  <div className="w-10 h-10 bg-[#007B3A] rounded-full flex items-center justify-center text-white font-bold">
                    {electeur.prenom?.[0]}{electeur.nom?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{electeur.prenom} {electeur.nom}</p>
                    <p className="text-xs text-green-600">{step === 2 ? 'En attente empreinte' : 'Identifié'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Indicateur d'étapes ═══ */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${step > i + 1 ? 'bg-[#007B3A] text-white' : step === i + 1 ? 'bg-[#007B3A] text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? <FiCheck /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-[#007B3A]' : 'text-gray-400'}`}>{label}</span>
              {i < 4 && <div className={`w-6 h-0.5 ${step > i + 1 ? 'bg-[#007B3A]' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════
               ÉTAPE 1 : Saisie du numéro CNI
             ═══════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-4">
                    <FiSearch size={36} className="text-[#007B3A]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Identification de l'électeur</h2>
                  <p className="text-gray-500 text-sm">
                    Saisissez le numéro de carte nationale d'identité (CNI) de l'électeur.
                  </p>
                </div>

                <form onSubmit={handleRechercheCni} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de CNI</label>
                    <input
                      type="text"
                      value={numeroCni}
                      onChange={(e) => setNumeroCni(e.target.value)}
                      placeholder="Ex: 1234567890123"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#007B3A] focus:ring-2 focus:ring-green-100 outline-none text-lg tracking-wide"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#007B3A] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#006630] transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><FiRefreshCw className="animate-spin" /> Recherche...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><FiSearch size={18} /> Rechercher</span>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
               ÉTAPE 2 : Attente scan empreinte Arduino
             ═══════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">

                {/* Info électeur trouvé */}
                <div className="bg-green-50 rounded-xl p-4 mb-8 border border-green-200">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-[#007B3A] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {electeur?.prenom?.[0]}{electeur?.nom?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{electeur?.prenom} {electeur?.nom}</p>
                      <p className="text-gray-500 text-sm">CNI : {electeur?.numero_cni}</p>
                      <p className="text-gray-500 text-xs">Département : {electeur?.departement}</p>
                      <p className="text-gray-500 text-xs">Centre : {electeur?.centre_vote}</p>
                      <p className="text-gray-500 text-xs">Bureau : {electeur?.bureau_vote}</p>
                    </div>
                  </div>
                </div>

                {/* Animation empreinte */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="mb-8"
                >
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center shadow-inner">
                    <svg className="w-16 h-16 text-[#007B3A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-4.91-1.31-7.78-6.04-7.78-9.64 0-2.42 2.02-4.39 4.5-4.39 2.48 0 4.5 1.97 4.5 4.39 0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-1.87-1.57-3.39-3.5-3.39s-3.5 1.52-3.5 3.39c0 3.12 2.56 7.32 6.78 8.44.27.07.43.35.36.62-.06.22-.26.37-.47.37zm3.14-2.23c-.06 0-.11-.01-.16-.03-.22-.08-1.09-.36-1.61-.57-.23-.09-.34-.35-.25-.57.09-.23.35-.34.57-.25.46.18 1.28.45 1.5.52.27.09.42.36.33.62-.07.21-.25.28-.38.28zM12 9c0 0 0 0 0 0-2.42.01-4.39 1.99-4.39 4.42 0 .28.22.5.5.5s.5-.22.5-.5C8.62 11.45 10.11 10 12 10c.28 0 .5-.22.5-.5S12.28 9 12 9z"/>
                    </svg>
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Posez votre doigt sur le capteur{dots}
                </h2>
                <p className="text-gray-500 mb-6">
                  L'empreinte sera enregistrée et associée à votre profil automatiquement.
                </p>

                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 px-6 rounded-xl mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <FiRefreshCw size={16} />
                  </motion.div>
                  <span className="text-sm font-medium">En attente du capteur Arduino...</span>
                </div>

                <button
                  onClick={handleCancelWait}
                  className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Annuler et revenir
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
               ÉTAPE 3 : Choix du candidat
             ═══════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div
              key="step3"
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
                    className={`relative bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 ${
                      selectedCandidat?.id === candidat.id
                        ? 'border-[#007B3A] shadow-xl ring-4 ring-green-50'
                        : 'border-gray-100 shadow-md hover:shadow-lg hover:border-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      {selectedCandidat?.id === candidat.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                          <div className="w-8 h-8 bg-[#007B3A] rounded-full flex items-center justify-center">
                            <FiCheck size={16} className="text-white" />
                          </div>
                        </motion.div>
                      )}

                      {getPhoto(candidat) ? (
                        <img src={getPhoto(candidat)} alt={`${candidat.prenom} ${candidat.nom}`}
                          className="w-24 h-24 rounded-full mx-auto mb-5 object-cover shadow-lg border-4 border-[#007B3A]" />
                      ) : (
                        <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-bold shadow-lg bg-[#007B3A]">
                          {candidat.prenom[0]}{candidat.nom[0]}
                        </div>
                      )}

                      <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-green-50 text-[#007B3A]">
                        Candidat N° {candidat.numero_ordre}
                      </div>
                      <h3 className="font-bold text-gray-800 text-xl">{candidat.prenom} {candidat.nom}</h3>
                      <p className="text-sm text-gray-500 mt-1 font-medium">{candidat.parti}</p>

                      {selectedCandidat?.id === candidat.id && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-green-50 py-2 px-4 rounded-lg">
                          <span className="text-[#007B3A] text-sm font-semibold flex items-center justify-center gap-1">
                            <FiCheckCircle size={16} /> Sélectionné
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Vote Blanc */}
                <motion.div
                  key="blanc"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCandidat({ id: 'blanc', prenom: 'Vote', nom: 'Blanc', parti: 'Bulletin nul' })}
                  className={`relative bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 border-dashed ${
                    selectedCandidat?.id === 'blanc'
                      ? 'border-gray-500 shadow-xl ring-4 ring-gray-100 bg-gray-50'
                      : 'border-gray-300 shadow-md hover:shadow-lg hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    {selectedCandidat?.id === 'blanc' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <FiCheck size={16} className="text-white" />
                        </div>
                      </motion.div>
                    )}
                    <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-gray-400 text-4xl bg-gray-100 shadow-lg border-4 border-gray-300">○</div>
                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-gray-100 text-gray-500">Bulletin nul</div>
                    <h3 className="font-bold text-gray-600 text-xl">Vote Blanc</h3>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Ne choisir aucun candidat</p>
                    {selectedCandidat?.id === 'blanc' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-gray-100 py-2 px-4 rounded-lg">
                        <span className="text-gray-500 text-sm font-semibold flex items-center justify-center gap-1">
                          <FiCheckCircle size={16} /> Sélectionné
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>

              {selectedCandidat && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    onClick={() => setStep(4)}
                    className="w-full max-w-md mx-auto block bg-[#007B3A] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#006630] transition-colors shadow-lg hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center gap-2">Valider mon choix <FiArrowRight /></span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
               ÉTAPE 4 : Confirmation finale
             ═══════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
                <div className="text-center mb-8">
                  {selectedCandidat?.id === 'blanc' ? (
                    <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-gray-400 text-4xl bg-gray-100 shadow-lg border-4 border-gray-300">○</div>
                  ) : getPhoto(selectedCandidat) ? (
                    <img src={getPhoto(selectedCandidat)} alt={`${selectedCandidat.prenom} ${selectedCandidat.nom}`}
                      className="w-24 h-24 rounded-full mx-auto mb-5 object-cover shadow-lg border-4 border-[#007B3A]" />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-bold shadow-lg bg-[#007B3A]">
                      {selectedCandidat.prenom[0]}{selectedCandidat.nom[0]}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-800 text-xl">
                    {selectedCandidat?.id === 'blanc' ? 'Vote Blanc' : `${selectedCandidat.prenom} ${selectedCandidat.nom}`}
                  </h3>
                  <p className="text-gray-500">
                    {selectedCandidat?.id === 'blanc' ? 'Bulletin nul' : selectedCandidat.parti}
                  </p>
                </div>

                <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl mb-6 border border-amber-200">
                  <FiAlertCircle size={22} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Confirmation requise</p>
                    {selectedCandidat?.id === 'blanc' ? (
                      <p>Vous êtes sur le point de soumettre un <strong>vote blanc</strong>. Cette action est irréversible.</p>
                    ) : (
                      <p>Vous êtes sur le point de voter pour <strong>{selectedCandidat.prenom} {selectedCandidat.nom}</strong>. Cette action est irréversible.</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#007B3A] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {electeur?.prenom?.[0]}{electeur?.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{electeur?.prenom} {electeur?.nom}</p>
                      <p className="text-xs text-gray-500">Authentifié par CNI + empreinte digitale</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleVote}
                    disabled={loading}
                    className="flex-1 bg-[#007B3A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#006630] transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><FiRefreshCw className="animate-spin" /> Enregistrement...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><FiCheck /> Confirmer mon vote</span>
                    )}
                  </button>
                  <button
                    onClick={() => { setStep(3); setSelectedCandidat(null); }}
                    disabled={loading}
                    className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
               ÉTAPE 5 : Vote enregistré
             ═══════════════════════════════════════════ */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
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
                <p className="text-gray-500 mb-6">Votre vote a été enregistré avec succès.</p>

                {voteResult && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Électeur :</span>
                      <span className="font-medium">{voteResult.electeur}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Candidat :</span>
                      <span className="font-medium">{voteResult.candidat}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Méthode :</span>
                      <span className="font-medium text-green-600">CNI + Empreinte digitale</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Référence :</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{voteResult.hash_vote?.substring(0, 16)}...</span>
                    </div>
                  </div>
                )}

                <CountdownReset onReset={handleReset} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Composant compte à rebours
const CountdownReset = ({ onReset }) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onReset]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Électeur suivant dans <span className="font-bold text-[#007B3A]">{countdown}s</span>
      </p>
      <button onClick={onReset} className="w-full bg-[#007B3A] text-white py-3 rounded-xl font-semibold hover:bg-[#006630] transition-colors">
        <span className="flex items-center justify-center gap-2"><FiRefreshCw /> Électeur suivant</span>
      </button>
    </div>
  );
};

export default VoteArduino;
