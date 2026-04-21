import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShield, FiUsers, FiMonitor, FiSmartphone, FiCpu, FiArrowRight, FiStar } from 'react-icons/fi';
import { publicAPI } from '../services/api';
import FinishedVoteResults from '../components/FinishedVoteResults';

const carrouselImages = [
  { src: '/republique-senegal.png', alt: 'République du Sénégal' },
  { src: '/palais-presidentiel.png', alt: 'Palais Présidentiel du Sénégal' },
  { src: '/carte-senegal.png', alt: 'Carte du Sénégal' },
  { src: '/monument-renaissance.png', alt: 'Monument de la Renaissance Africaine' },
  { src: '/statue-goree.png', alt: 'Statue de la Libération de l\'Esclavage - Gorée' },
  { src: '/ile-goree.png', alt: 'Île de Gorée' },
];

const CarrouselSenegal = () => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % carrouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goNext = () => setCurrent(prev => (prev + 1) % carrouselImages.length);
  const goPrev = () => setCurrent(prev => (prev - 1 + carrouselImages.length) % carrouselImages.length);

  // Swipe tactile
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
  };

  return (
    <section className="bg-white w-full overflow-hidden">
      <div
        className="relative w-full h-[500px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Flèche gauche */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {carrouselImages.map((img, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: i === current ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{ pointerEvents: i === current ? 'auto' : 'none' }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
            {/* Dégradé bas pour fondre vers la section suivante */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
            {/* Dégradé haut pour fondre depuis la section précédente */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent"></div>
          </motion.div>
        ))}

        {/* Flèche droite */}
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* Indicateurs */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
          {carrouselImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 border border-white/50 ${
                i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [stats, setStats] = useState({ total_electeurs: 0, total_votants: 0, total_candidats: 0, taux_participation: 0 });
  const [electionStatus, setElectionStatus] = useState(null);
  const [resultatsFinaux, setResultatsFinaux] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicAPI.getStats();
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.log('Stats non disponibles');
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchElectionState = async () => {
      try {
        const res = await publicAPI.getElectionStatus();
        if (res.data.success) {
          setElectionStatus(res.data.data);
          if (res.data.data.phase === 'finished') {
            const resResultats = await publicAPI.getResultats();
            if (resResultats.data.success) {
              setResultatsFinaux(resResultats.data.data);
            }
          } else {
            setResultatsFinaux(null);
          }
        }
      } catch (err) {
        // silencieux
      }
    };

    fetchElectionState();
    const interval = setInterval(fetchElectionState, 10000);
    return () => clearInterval(interval);
  }, []);

  if (electionStatus?.phase === 'finished' && resultatsFinaux) {
    return (
      <div className="min-h-screen w-full bg-[#0f172a]">
        <FinishedVoteResults />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full space-y-16">
      {/* ==================== HERO SECTION ==================== */}
      <section className="gradient-hero text-white relative overflow-hidden w-full">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FDEF42] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#007B3A] rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-24 md:py-36 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8">
              <div className="flex h-5 w-16 rounded overflow-hidden items-center">
                <div className="flex-1 h-full bg-[#007B3A]"></div>
                <div className="flex-1 h-full bg-[#FDEF42] flex items-center justify-center">
                  <span className="text-[#007B3A] text-[8px] leading-none">★</span>
                </div>
                <div className="flex-1 h-full bg-[#E31B23]"></div>
              </div>
              <span className="text-sm font-medium">Élection Présidentielle 2026</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              Votez en toute
              <span className="text-[#FDEF42]"> sécurité</span>
              <br />depuis chez vous
            </h1>
            
          </motion.div>
        </div>
      </section>

      {electionStatus?.phase === 'finished' && resultatsFinaux && (
        <section className="w-full py-16 bg-white">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="text-center mb-10">
              <h2 className="text-5xl md:text-6xl font-extrabold text-[#E31B23] tracking-wide">
                VOTE TERMINE
              </h2>
              <p className="text-gray-600 mt-4 text-lg">
                Les resultats officiels sont maintenant disponibles.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Total votes</p>
                  <p className="text-2xl font-bold text-gray-800">{resultatsFinaux.total_votes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Votes blancs</p>
                  <p className="text-2xl font-bold text-gray-800">{resultatsFinaux.votes_blancs}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participation</p>
                  <p className="text-2xl font-bold text-gray-800">{resultatsFinaux.taux_participation}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {resultatsFinaux.resultats?.map((candidat, i) => (
                <div key={candidat.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">
                      {i + 1}. {candidat.prenom} {candidat.nom}
                    </p>
                    <p className="text-sm text-gray-500">{candidat.parti}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl" style={{ color: candidat.couleur || '#007B3A' }}>
                      {candidat.pourcentage || 0}%
                    </p>
                    <p className="text-sm text-gray-500">{candidat.nombre_votes} votes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ==================== CARROUSEL IMAGES SENEGAL ==================== */}
      <CarrouselSenegal />

      {/* ==================== PROCESSUS ELECTORAL ==================== */}
      <section className="py-32 bg-gray-50 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-20">
            <span className="text-[#007B3A] font-semibold text-sm uppercase tracking-widest">Le Processus</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-4">Comment voter en ligne ?</h2>
            <p className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg">
              Un processus simple et sécurisé en 4 étapes pour exercer votre droit de vote
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-center">
            {[
              {
                title: 'Identification',
                desc: 'Entrez votre numéro CNI et code électoral pour vous identifier.',
                icon: '🪪'
              },
              {
                title: 'Vérification OTP',
                desc: 'Un code de vérification est envoyé par email. Saisissez-le pour confirmer votre identité.',
                icon: '📱'
              },
              {
                title: 'Choix du Candidat',
                desc: 'Parcourez la liste des candidats et sélectionnez celui de votre choix.',
                icon: '✅'
              },
              {
                title: 'Confirmation',
                desc: 'Un second code OTP vous est envoyé pour confirmer définitivement votre vote.',
                icon: '🗳️'
              }
            ].map((item, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 shadow-md card-hover text-center lg:col-span-1 sm:col-span-1"
                >
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-base leading-relaxed">{item.desc}</p>
                </motion.div>
                {i < 3 && (
                  <div className="hidden lg:flex items-center justify-center lg:col-span-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15 + 0.1 }}
                      viewport={{ once: true }}
                      className="w-10 h-10 rounded-full bg-[#007B3A]/10 flex items-center justify-center"
                    >
                      <FiArrowRight size={22} className="text-[#007B3A]" />
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DOUBLE METHODE DE VOTE ==================== */}
      <section className="py-32 bg-white w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-20">
            <span className="text-[#007B3A] font-semibold text-sm uppercase tracking-widest">Innovation</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-4">Deux méthodes de vote</h2>
            <p className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg">
              Que vous soyez connecté ou non, vous pouvez exercer votre droit de vote
            </p>
          </div>

          <div className={`grid gap-10 ${electionStatus?.phase === 'finished' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Vote en ligne */}
            {electionStatus?.phase !== 'finished' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-10 border border-green-100"
              >
                <div className="w-16 h-16 bg-[#007B3A] rounded-2xl flex items-center justify-center mb-8">
                  <FiMonitor size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Vote en Ligne</h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Votez depuis chez vous via notre plateforme web sécurisée.
                  Authentification par CNI + Code Electoral + OTP double vérification.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Accessible 24h/24 le jour du scrutin', 'Double vérification OTP', 'Confirmation par Email', 'Hash de vote unique'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-gray-600">
                      <FiCheckCircle size={18} className="text-[#007B3A] flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="btn-senegal inline-flex text-base py-3.5 px-8">
                  Voter en ligne <FiArrowRight />
                </Link>
              </motion.div>
            )}

            {/* Vote Arduino */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-10 border border-amber-100"
            >
              <div className="w-16 h-16 bg-[#FDEF42] rounded-2xl flex items-center justify-center mb-8">
                <FiCpu size={32} className="text-gray-800" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Vote par Empreinte Digitale</h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Rendez-vous au bureau de vote avec votre CNI. L'opérateur saisit votre numéro, 
                vous posez votre doigt sur le capteur, puis choisissez votre candidat directement sur l'écran.
              </p>
              <ul className="space-y-4 mb-8">
                {['Identification par CNI + empreinte digitale', 'Enregistrement automatique de l\'empreinte', 'Choix du candidat sur écran avec photos', 'Confirmation visuelle à l\'écran', 'Accessible aux personnes analphabètes', 'Opérateur présent pour assister'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-base text-gray-600">
                    <FiCheckCircle size={18} className="text-amber-600 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/guide" className="btn-senegal-outline inline-flex items-center gap-2 text-base py-3.5 px-8">
                En savoir plus <FiArrowRight />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
