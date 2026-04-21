import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiCreditCard, FiKey, FiArrowRight, FiRefreshCw, FiCheckCircle, FiMail } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { loginElecteur } = useAuth();
  const [step, setStep] = useState(1); // 1: Identifiants + Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [electeurInfo, setElecteurInfo] = useState(null);
  const [emailMasque, setEmailMasque] = useState('');
  
  const [formData, setFormData] = useState({
    numero_cni: '',
    code_electoral: '',
    email: ''
  });
  
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ne pas trim l'email en cours de saisie (l'espace empêche de taper)
    setFormData({ ...formData, [name]: name === 'email' ? value : value.trim() });
  };

  // Étape 1 : Vérifier identité puis envoyer OTP à l'email saisi
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
    
    setLoading(true);
    try {
      // D'abord vérifier CNI + Code Électoral
      const cleanData = {
        numero_cni: formData.numero_cni.trim(),
        code_electoral: formData.code_electoral.trim().toUpperCase()
      };
      const verifyRes = await authAPI.verifierIdentite(cleanData);
      
      if (verifyRes.data.success) {
        // Stocker le token temporaire
        localStorage.setItem('tempToken', verifyRes.data.data.tempToken);
        setElecteurInfo(verifyRes.data.data);

        // Ensuite envoyer l'OTP à l'email saisi
        const otpRes = await authAPI.envoyerOTP(formData.email.trim().toLowerCase());
        
        if (otpRes.data.success) {
          localStorage.setItem('tempToken', otpRes.data.data.tempToken);
          setEmailMasque(otpRes.data.data.email_masque);
          setStep(2);
          toast.success('Code OTP envoyé ! Vérifiez votre boîte email.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Étape 2 : Vérifier l'OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6) {
      toast.error('Veuillez saisir les 6 chiffres du code OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifierOTP(code);
      if (res.data.success) {
        localStorage.removeItem('tempToken');
        loginElecteur(res.data.data.token, res.data.data.electeur);
        toast.success(`Bienvenue ${res.data.data.electeur.prenom} ! Vous pouvez maintenant voter.`);
        navigate('/vote');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.renvoyerOTP();
      setOtpCode(['', '', '', '', '', '']);
      toast.info('Nouveau code OTP envoyé !');
    } catch (err) {
      toast.error('Erreur lors du renvoi du code');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl px-8 py-12">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo-senegal-vote.png" alt="Sénégal Vote" className="h-16 w-auto" />
          </div>
        </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 gradient-senegal rounded-xl flex items-center justify-center">
                <FiLock size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {step === 1 ? 'Authentification' : 'Vérification OTP'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {step === 1 
                    ? 'Identifiez-vous avec vos informations électorales'
                    : `Code envoyé à ${emailMasque}`
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Indicateur d'étapes */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= 1 ? 'bg-[#007B3A] text-white shadow-md' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <FiCheckCircle size={18} /> : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-[#007B3A]' : 'text-gray-400'}`}>
                Identifiants
              </span>
            </div>
            <div className={`flex-1 h-0.5 rounded ${step >= 2 ? 'bg-[#007B3A]' : 'bg-gray-200'}`}></div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= 2 ? 'bg-[#007B3A] text-white shadow-md' : 'bg-gray-200 text-gray-500'
              }`}>2</div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-[#007B3A]' : 'text-gray-400'}`}>
                Code OTP
              </span>
            </div>
          </div>

          {/* Formulaire */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10"
          >
            {step === 1 ? (
              <form onSubmit={handleSubmitForm} className="space-y-10">
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <FiCreditCard size={18} className="text-[#007B3A]" />
                    Numéro de Carte Nationale d'Identité
                  </label>
                  <input
                    type="text"
                    name="numero_cni"
                    value={formData.numero_cni}
                    onChange={handleChange}
                    placeholder="Ex: 1234567890123"
                    className="w-full px-7 py-5 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007B3A]/20 focus:border-[#007B3A] outline-none transition-all bg-gray-50 hover:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <FiKey size={18} className="text-[#007B3A]" />
                    Code Électoral
                  </label>
                  <input
                    type="text"
                    name="code_electoral"
                    value={formData.code_electoral}
                    onChange={handleChange}
                    placeholder="Ex: SN-ABD12-XY78"
                    className="w-full px-7 py-5 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007B3A]/20 focus:border-[#007B3A] outline-none transition-all bg-gray-50 hover:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">
                    <FiMail size={18} className="text-[#007B3A]" />
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ex: exemple@gmail.com"
                    className="w-full px-7 py-5 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007B3A]/20 focus:border-[#007B3A] outline-none transition-all bg-gray-50 hover:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-senegal justify-center py-4.5 text-lg rounded-xl mt-4 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Vérification en cours...</span>
                  ) : (
                    <span className="flex items-center gap-2">Vérifier et recevoir le code OTP <FiArrowRight /></span>
                  )}
                </button>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
                  <div className="flex items-start gap-3">
                    <FiMail className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                    <p className="text-base text-blue-700">
                      Un code OTP sera envoyé à votre adresse email pour vérifier votre identité.
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <FiMail size={28} className="text-[#007B3A]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Bonjour {electeurInfo?.prenom} !
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Saisissez le code à 6 chiffres envoyé à <strong>{emailMasque}</strong>
                  </p>
                </div>
                
                {/* OTP Input */}
                <div className="flex justify-center gap-3 py-4">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#007B3A] focus:ring-2 focus:ring-[#007B3A]/20 outline-none transition-all bg-gray-50 hover:bg-white"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-700 text-center">
                    Le code expire dans <strong>5 minutes</strong>. Vérifiez votre boîte email (et les spams).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-senegal justify-center py-4 text-base rounded-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Vérification...</span>
                  ) : (
                    <span className="flex items-center gap-2">Valider le code <FiArrowRight /></span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-[#007B3A] text-sm font-medium hover:underline"
                  >
                    Renvoyer le code OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtpCode(['', '', '', '', '', '']); }}
                    className="text-gray-400 text-sm hover:text-gray-600"
                  >
                    Retour
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between text-xs text-gray-400 px-2">
            <span className="flex items-center gap-1">
              <FiLock size={11} /> Connexion sécurisée SSL
            </span>
            <Link to="/" className="hover:text-[#007B3A] transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
  );
};

export default Login;
