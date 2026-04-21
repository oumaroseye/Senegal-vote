import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiKey, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminAPI.login(formData);
      if (res.data.success) {
        loginAdmin(res.data.data.token, res.data.data.admin);
        toast.success('Bienvenue Administrateur !');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#007B3A] rounded-full mx-auto flex items-center justify-center mb-4">
            <FiLock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-gray-400 mt-2 text-sm">Sénégal Vote - Panneau d'administration</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <FiMail className="inline mr-2" />Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@senegalvote.sn"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#007B3A] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <FiKey className="inline mr-2" />Mot de passe
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-[#007B3A] focus:border-transparent outline-none"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-senegal justify-center py-3.5">
              {loading ? (
                <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Connexion...</span>
              ) : (
                <span className="flex items-center gap-2">Se connecter <FiArrowRight /></span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
