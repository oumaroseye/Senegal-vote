import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiCheckCircle, FiMonitor, FiCpu, FiTrendingUp, FiBarChart2, FiPlus, FiLogOut, FiSearch, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PHOTO_MAP = {
  'Faye': '/candidats/diomaye-faye.png',
  'Ba': '/candidats/amadou-ba.png',
  'Seck': '/candidats/idrissa-seck.png',
  'Sall': '/candidats/khalifa-sall.png',
  'Ngom': '/candidats/anta-babacar-ngom.png',
};

const getPhoto = (c) => c.photo_url || PHOTO_MAP[c.nom] || null;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [electeurs, setElecteurs] = useState({ electeurs: [], pagination: {} });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddElecteur, setShowAddElecteur] = useState(false);
  const [showAddCandidat, setShowAddCandidat] = useState(false);
  const [showAddPresident, setShowAddPresident] = useState(false);
  const [voteLocations, setVoteLocations] = useState({ departements: [], centres_par_departement: {}, bureaux: [] });
  const [newElecteur, setNewElecteur] = useState({
    prenom: '', nom: '', date_naissance: '', adresse: '', region: '',
    numero_cni: '', departement: '', centre_vote: '', bureau_vote: ''
  });
  const [newCandidat, setNewCandidat] = useState({
    prenom: '', nom: '', parti: '', slogan: '', programme: '',
    couleur: '#007B3A', numero_ordre: '', election_id: 1
  });
  const [newPresident, setNewPresident] = useState({
    prenom: '', nom: '', email: '', password: '', departement: '', centre_vote: ''
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchDashboard();
    fetchElecteurs();
    fetchVoteLocations();
  }, [isAdmin]);

  // Rafraîchissement fréquent du tableau de bord pour le président
  // afin d'afficher les votants (centre + bureaux) en temps réel.
  useEffect(() => {
    if (!isAdmin || admin?.role !== 'president_centre') return;

    const id = setInterval(() => {
      adminAPI.getDashboard()
        .then((res) => {
          if (res.data?.success) setDashboard(res.data.data);
        })
        .catch(() => {
          // on ignore les erreurs transitoires pour éviter de casser l'UI
        });
    }, 5000);

    return () => clearInterval(id);
  }, [isAdmin, admin?.role]);

  const fetchDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      if (res.data.success) setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchElecteurs = async (page = 1) => {
    try {
      const res = await adminAPI.getElecteurs({ page, search });
      if (res.data.success) setElecteurs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVoteLocations = async () => {
    try {
      const res = await adminAPI.getVoteLocations();
      if (res.data.success) setVoteLocations(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddElecteur = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.ajouterElecteur(newElecteur);
      if (res.data.success) {
        toast.success(`Électeur ajouté ! Code: ${res.data.data.code_electoral}`);
        setShowAddElecteur(false);
        setNewElecteur({
          prenom: '', nom: '', date_naissance: '', adresse: '', region: '',
          numero_cni: '', departement: '', centre_vote: '', bureau_vote: ''
        });
        fetchElecteurs();
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAddCandidat = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.ajouterCandidat(newCandidat);
      if (res.data.success) {
        toast.success('Candidat ajouté avec succès !');
        setShowAddCandidat(false);
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAddPresident = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.creerPresidentCentre(newPresident);
      if (res.data.success) {
        toast.success('Président de centre créé avec succès !');
        setShowAddPresident(false);
        setNewPresident({ prenom: '', nom: '', email: '', password: '', departement: '', centre_vote: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteElecteur = async (electeur) => {
    const ok = window.confirm(`Supprimer (désactiver) l'électeur ${electeur.prenom} ${electeur.nom} ?`);
    if (!ok) return;
    try {
      const res = await adminAPI.supprimerElecteur(electeur.id);
      if (res.data.success) {
        toast.success('Électeur supprimé avec succès.');
        fetchElecteurs();
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de suppression');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#007B3A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = dashboard?.statistiques || {};
  const resultats = dashboard?.resultats || [];
  const votesParBureau = dashboard?.votes_par_bureau || [];
  const maxVotes = resultats.length > 0 ? Math.max(...resultats.map(r => r.nombre_votes), 1) : 1;
  const centresDisponibles = newElecteur.departement ? (voteLocations.centres_par_departement[newElecteur.departement] || []) : [];
  const centresPresident = newPresident.departement ? (voteLocations.centres_par_departement[newPresident.departement] || []) : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar Top */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo-senegal-vote.png" alt="Sénégal Vote" className="h-10 w-auto" />
            <span className="font-bold">Admin - Sénégal Vote</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{admin?.prenom} {admin?.nom}</span>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {admin?.role !== 'president_centre' && (
        <div className="bg-gray-800/50 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 flex gap-1">
            {[
              { id: 'dashboard', label: 'Tableau de Bord', icon: FiBarChart2 },
              { id: 'electeurs', label: 'Électeurs', icon: FiUsers },
              { id: 'resultats', label: 'Résultats', icon: FiTrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#007B3A] text-[#007B3A]'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* PRESIDENT CENTRE: Vue strictement limitée */}
        {admin?.role === 'president_centre' && (
          <div className="space-y-8">
            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-300">
                Zone du président: {dashboard?.zone_admin?.departement} / {dashboard?.zone_admin?.centre_vote}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Inscrits du centre', value: stats.total_electeurs, icon: FiUsers, color: '#007B3A' },
                { label: 'Votants du centre', value: stats.total_votants, icon: FiCheckCircle, color: '#00A651' },
                { label: 'Participation', value: `${stats.taux_participation}%`, icon: FiTrendingUp, color: '#E31B23' }
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-800 rounded-xl p-5 border border-gray-700"
                >
                  <s.icon size={20} style={{ color: s.color }} />
                  <div className="text-2xl font-bold mt-2">{s.value || 0}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </motion.div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Votes par bureau (centre uniquement)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {votesParBureau.map((b) => (
                  <div key={b.bureau_vote} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">{b.bureau_vote}</p>
                    <p className="text-2xl font-bold text-[#007B3A]">{b.total}</p>
                    <p className="text-xs text-gray-500">votes</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD ADMIN */}
        {admin?.role !== 'president_centre' && activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Inscrits', value: stats.total_electeurs, icon: FiUsers, color: '#007B3A' },
                { label: 'Votants', value: stats.total_votants, icon: FiCheckCircle, color: '#00A651' },
                { label: 'En ligne', value: stats.votes_en_ligne, icon: FiMonitor, color: '#1E90FF' },
                { label: 'Arduino', value: stats.votes_arduino, icon: FiCpu, color: '#FDEF42' },
                { label: 'Participation', value: `${stats.taux_participation}%`, icon: FiTrendingUp, color: '#E31B23' }
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-800 rounded-xl p-5 border border-gray-700"
                >
                  <s.icon size={20} style={{ color: s.color }} />
                  <div className="text-2xl font-bold mt-2">{s.value || 0}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </motion.div>
              ))}
            </div>
            {admin?.role === 'president_centre' && dashboard?.zone_admin && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-300">
                  Zone du président: {dashboard.zone_admin.departement} / {dashboard.zone_admin.centre_vote}
                </p>
              </div>
            )}

            {/* Résultats */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Résultats en Direct</h2>
                <button onClick={() => { fetchDashboard(); }} className="text-[#007B3A] text-sm flex items-center gap-1">
                  <FiRefreshCw size={14} /> Actualiser
                </button>
              </div>
              <div className="space-y-4">
                {resultats.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4">
                    {getPhoto(c) ? (
                      <img src={getPhoto(c)} alt={`${c.prenom} ${c.nom}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#007B3A]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-[#007B3A]">
                        {c.prenom?.[0]}{c.nom?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{c.prenom} {c.nom} <span className="text-gray-500">({c.parti})</span></span>
                        <span className="font-bold">{c.nombre_votes} votes</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${maxVotes > 0 ? (c.nombre_votes / maxVotes) * 100 : 0}%` }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: c.couleur }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {admin?.role === 'president_centre' && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold mb-4">Participation par bureau</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {votesParBureau.map((b) => (
                    <div key={b.bureau_vote} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">{b.bureau_vote}</p>
                      <p className="text-2xl font-bold text-[#007B3A]">{b.total}</p>
                      <p className="text-xs text-gray-500">votes</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowAddElecteur(true)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-[#007B3A] transition-colors text-left"
              >
                <FiPlus size={24} className="text-[#007B3A] mb-2" />
                <h3 className="font-bold">Ajouter un Électeur</h3>
                <p className="text-gray-400 text-sm">Enregistrer un nouvel électeur dans la liste électorale</p>
              </button>
              <button
                onClick={() => setShowAddCandidat(true)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-[#007B3A] transition-colors text-left"
              >
                <FiPlus size={24} className="text-amber-500 mb-2" />
                <h3 className="font-bold">Ajouter un Candidat</h3>
                <p className="text-gray-400 text-sm">Inscrire un nouveau candidat à l'élection</p>
              </button>
            </div>
            {admin?.role === 'super_admin' && (
              <button
                onClick={() => setShowAddPresident(true)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-[#8A2BE2] transition-colors text-left w-full"
              >
                <FiPlus size={24} className="text-[#8A2BE2] mb-2" />
                <h3 className="font-bold">Créer Président de centre</h3>
                <p className="text-gray-400 text-sm">Créer un compte centre pour le suivi des votes par bureau</p>
              </button>
            )}
          </div>
        )}

        {/* ELECTEURS */}
        {admin?.role !== 'president_centre' && activeTab === 'electeurs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Liste Électorale</h2>
              <button onClick={() => setShowAddElecteur(true)} className="btn-senegal text-sm">
                <FiPlus /> Ajouter
              </button>
            </div>
            
            {/* Recherche */}
            <div className="relative mb-6">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchElecteurs()}
                placeholder="Rechercher par nom, CNI, code électoral..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#007B3A] outline-none"
              />
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400">Nom Complet</th>
                      <th className="px-4 py-3 text-left text-gray-400">CNI</th>
                      <th className="px-4 py-3 text-left text-gray-400">Code Electoral</th>
                      <th className="px-4 py-3 text-left text-gray-400">Département</th>
                      <th className="px-4 py-3 text-left text-gray-400">Centre</th>
                      <th className="px-4 py-3 text-left text-gray-400">Bureau</th>
                      <th className="px-4 py-3 text-left text-gray-400">Statut Vote</th>
                      <th className="px-4 py-3 text-left text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {electeurs.electeurs?.map((el) => (
                      <tr key={el.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium">{el.prenom} {el.nom}</td>
                        <td className="px-4 py-3 text-gray-400">{el.numero_cni}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#007B3A]">{el.code_electoral}</td>
                        <td className="px-4 py-3 text-gray-400">{el.departement}</td>
                        <td className="px-4 py-3 text-gray-400">{el.centre_vote}</td>
                        <td className="px-4 py-3 text-gray-400">{el.bureau_vote}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            el.a_vote 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {el.a_vote ? `Voté (${el.methode_vote})` : 'Non voté'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteElecteur(el)}
                            disabled={el.a_vote}
                            title={el.a_vote ? 'Impossible: cet électeur a déjà voté' : 'Supprimer cet électeur'}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              el.a_vote
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                            }`}
                          >
                            <FiTrash2 size={12} />
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RESULTATS */}
        {admin?.role !== 'president_centre' && activeTab === 'resultats' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Résultats Détaillés</h2>
            <div className="space-y-4">
              {resultats.map((c, i) => {
                const total = stats.total_votants || 1;
                const pct = ((c.nombre_votes / total) * 100).toFixed(1);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {getPhoto(c) ? (
                        <img src={getPhoto(c)} alt={`${c.prenom} ${c.nom}`} className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-3 border-[#007B3A]" />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold bg-[#007B3A]">
                          {c.prenom?.[0]}{c.nom?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{c.prenom} {c.nom}</h3>
                        <p className="text-gray-400 text-sm">{c.parti}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-3xl font-bold" style={{ color: c.couleur }}>{pct}%</div>
                        <div className="text-gray-400 text-sm">{c.nombre_votes} votes</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.couleur }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Ajouter Électeur */}
      {showAddElecteur && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4">Ajouter un Électeur</h2>
            <form onSubmit={handleAddElecteur} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Prénom" value={newElecteur.prenom} onChange={e => setNewElecteur({...newElecteur, prenom: e.target.value})} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
                <input type="text" placeholder="Nom" value={newElecteur.nom} onChange={e => setNewElecteur({...newElecteur, nom: e.target.value})} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              </div>
              <input type="date" placeholder="Date de naissance" value={newElecteur.date_naissance} onChange={e => setNewElecteur({...newElecteur, date_naissance: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <input type="text" placeholder="Adresse" value={newElecteur.adresse} onChange={e => setNewElecteur({...newElecteur, adresse: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <input type="text" placeholder="Région" value={newElecteur.region} onChange={e => setNewElecteur({...newElecteur, region: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              <select value={newElecteur.departement} onChange={e => setNewElecteur({ ...newElecteur, departement: e.target.value, centre_vote: '' })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required>
                <option value="">Choisir un département</option>
                {voteLocations.departements.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={newElecteur.centre_vote} onChange={e => setNewElecteur({ ...newElecteur, centre_vote: e.target.value })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required>
                <option value="">Choisir un centre de vote</option>
                {centresDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newElecteur.bureau_vote} onChange={e => setNewElecteur({ ...newElecteur, bureau_vote: e.target.value })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required>
                <option value="">Choisir un bureau de vote</option>
                {voteLocations.bureaux.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="text" placeholder="Numéro CNI" value={newElecteur.numero_cni} onChange={e => setNewElecteur({...newElecteur, numero_cni: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-senegal justify-center">Enregistrer</button>
                <button type="button" onClick={() => setShowAddElecteur(false)} className="flex-1 bg-gray-700 py-2.5 rounded-lg hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Ajouter Candidat */}
      {showAddCandidat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4">Ajouter un Candidat</h2>
            <form onSubmit={handleAddCandidat} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Prénom" value={newCandidat.prenom} onChange={e => setNewCandidat({...newCandidat, prenom: e.target.value})} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
                <input type="text" placeholder="Nom" value={newCandidat.nom} onChange={e => setNewCandidat({...newCandidat, nom: e.target.value})} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              </div>
              <input type="text" placeholder="Parti politique" value={newCandidat.parti} onChange={e => setNewCandidat({...newCandidat, parti: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <input type="text" placeholder="Slogan" value={newCandidat.slogan} onChange={e => setNewCandidat({...newCandidat, slogan: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
              <textarea placeholder="Programme" value={newCandidat.programme} onChange={e => setNewCandidat({...newCandidat, programme: e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm h-24 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Couleur</label>
                  <input type="color" value={newCandidat.couleur} onChange={e => setNewCandidat({...newCandidat, couleur: e.target.value})} className="w-full h-10 bg-gray-700 rounded-lg cursor-pointer" />
                </div>
                <input type="number" placeholder="N° d'ordre" value={newCandidat.numero_ordre} onChange={e => setNewCandidat({...newCandidat, numero_ordre: e.target.value})} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-senegal justify-center">Enregistrer</button>
                <button type="button" onClick={() => setShowAddCandidat(false)} className="flex-1 bg-gray-700 py-2.5 rounded-lg hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Ajouter Président de centre */}
      {showAddPresident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4">Créer un Président de centre</h2>
            <form onSubmit={handleAddPresident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Prénom" value={newPresident.prenom} onChange={e => setNewPresident({ ...newPresident, prenom: e.target.value })} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
                <input type="text" placeholder="Nom" value={newPresident.nom} onChange={e => setNewPresident({ ...newPresident, nom: e.target.value })} className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              </div>
              <input type="email" placeholder="Email" value={newPresident.email} onChange={e => setNewPresident({ ...newPresident, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <input type="password" placeholder="Mot de passe" value={newPresident.password} onChange={e => setNewPresident({ ...newPresident, password: e.target.value })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required />
              <select value={newPresident.departement} onChange={e => setNewPresident({ ...newPresident, departement: e.target.value, centre_vote: '' })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required>
                <option value="">Choisir un département</option>
                {voteLocations.departements.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={newPresident.centre_vote} onChange={e => setNewPresident({ ...newPresident, centre_vote: e.target.value })} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" required>
                <option value="">Choisir un centre de vote</option>
                {centresPresident.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-senegal justify-center">Créer le compte</button>
                <button type="button" onClick={() => setShowAddPresident(false)} className="flex-1 bg-gray-700 py-2.5 rounded-lg hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
