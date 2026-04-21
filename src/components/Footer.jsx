import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { publicAPI } from '../services/api';

const Footer = () => {
  const [isVoteFinished, setIsVoteFinished] = useState(false);

  useEffect(() => {
    const fetchElectionStatus = async () => {
      try {
        const res = await publicAPI.getElectionStatus();
        if (res.data.success) {
          setIsVoteFinished(res.data.data?.phase === 'finished');
        }
      } catch (err) {
        // silencieux
      }
    };

    fetchElectionStatus();
  }, []);

  return (
    <footer className="bg-gray-900 text-white w-full">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/logo-senegal-vote.png" alt="Sénégal Vote" className="h-16 w-auto" />
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Sénégal Vote est une plateforme de vote électronique sécurisée permettant aux citoyens 
              sénégalais de participer aux élections depuis chez eux. Notre mission est de faciliter 
              l'exercice du droit de vote tout en garantissant la transparence et la sécurité du scrutin.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#007B3A] transition-colors">
                <FiFacebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#007B3A] transition-colors">
                <FiTwitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#007B3A] transition-colors">
                <FiInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-semibold text-[#FDEF42] mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Accueil</Link></li>
              {!isVoteFinished && (
                <li><Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Voter en ligne</Link></li>
              )}
              <li><Link to="/guide" className="text-gray-400 hover:text-white text-sm transition-colors">Guide Électeur</Link></li>
              <li><Link to="/a-propos" className="text-gray-400 hover:text-white text-sm transition-colors">À Propos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#FDEF42] mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <FiMapPin size={14} className="text-[#007B3A]" />
                Dakar, Sénégal
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <FiPhone size={14} className="text-[#007B3A]" />
                +221 33 XXX XX XX
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <FiMail size={14} className="text-[#007B3A]" />
                contact@senegalvote.sn
              </li>
            </ul>
          </div>
        </div>

        {/* Barre Sénégal */}
        <div className="flex h-5 mt-8 mb-4 rounded overflow-hidden items-center">
          <div className="flex-1 h-full bg-[#007B3A]"></div>
          <div className="flex-1 h-full bg-[#FDEF42] flex items-center justify-center">
            <span className="text-[#007B3A] text-xs leading-none">★</span>
          </div>
          <div className="flex-1 h-full bg-[#E31B23]"></div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Sénégal Vote - Plateforme de Vote Électronique Sécurisée</p>
          <p className="mt-1">Projet de soutenance - Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
