import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { publicAPI } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, electeur, logout } = useAuth();
  const location = useLocation();
  const [electionStatus, setElectionStatus] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isVoteFinished = electionStatus?.phase === 'finished';

  const formatDuration = (ms) => {
    if (ms === null || ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await publicAPI.getElectionStatus();
        if (res.data.success) {
          const status = res.data.data;
          setElectionStatus(status);
          if (status.phase === 'in_progress' && status.endsAt) {
            setRemainingMs(new Date(status.endsAt).getTime() - Date.now());
          } else if (status.phase === 'before_start' && status.startsAt) {
            setRemainingMs(new Date(status.startsAt).getTime() - Date.now());
          } else {
            setRemainingMs(null);
          }
        }
      } catch (err) {
        // silencieux pour ne pas gêner la navigation
      }
    };

    fetchStatus();
    const refreshInterval = setInterval(fetchStatus, 30000);
    const countdownInterval = setInterval(() => {
      setRemainingMs((prev) => (prev === null ? null : Math.max(0, prev - 1000)));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/logo-senegal-vote.png" alt="Sénégal Vote" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-[#007B3A]' : 'text-gray-600 hover:text-[#007B3A]'}`}>
              Accueil
            </Link>
            <Link to="/guide" className={`text-sm font-medium transition-colors ${isActive('/guide') ? 'text-[#007B3A]' : 'text-gray-600 hover:text-[#007B3A]'}`}>
              Guide Électeur
            </Link>
            <Link to="/candidats" className={`text-sm font-medium transition-colors ${isActive('/candidats') ? 'text-[#007B3A]' : 'text-gray-600 hover:text-[#007B3A]'}`}>
              Candidats
            </Link>
            <Link to="/a-propos" className={`text-sm font-medium transition-colors ${isActive('/a-propos') ? 'text-[#007B3A]' : 'text-gray-600 hover:text-[#007B3A]'}`}>
              À Propos
            </Link>

            {!isAdminRoute && electionStatus?.phase === 'in_progress' && (
              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <span className="text-xs font-semibold text-amber-700">
                  Fin du vote: {formatDuration(remainingMs)}
                </span>
              </div>
            )}

            {!isAdminRoute && electionStatus?.phase === 'before_start' && (
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                <span className="text-xs font-semibold text-blue-700">
                  Début du vote: {formatDuration(remainingMs)}
                </span>
              </div>
            )}

            {isAuthenticated && electeur ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <FiUser className="text-[#007B3A]" />
                  <span className="text-sm font-medium text-[#007B3A]">{electeur.prenom}</span>
                </div>
                <button onClick={logout} className="text-red-500 hover:text-red-700 transition-colors">
                  <FiLogOut size={18} />
                </button>
              </div>
            ) : !isVoteFinished ? (
              <Link to="/login" className="btn-senegal text-sm !py-2 !px-5">
                Voter en ligne
              </Link>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg">Accueil</Link>
            <Link to="/guide" onClick={() => setIsOpen(false)} className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg">Guide Électeur</Link>
            <Link to="/candidats" onClick={() => setIsOpen(false)} className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg">Candidats</Link>
            <Link to="/a-propos" onClick={() => setIsOpen(false)} className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg">À Propos</Link>
            {!isAuthenticated && !isVoteFinished ? (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block py-2 px-3 btn-senegal text-center mt-2">Voter en ligne</Link>
            ) : isAuthenticated ? (
              <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full py-2 px-3 text-red-500 text-left">Déconnexion</button>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
