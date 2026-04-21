import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiMonitor, FiCpu } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Guide = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <section className="gradient-hero text-white py-20 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="bg-white/10 px-5 py-2 rounded-full text-sm">Guide Officiel</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-8">Guide de l'Électeur</h1>
            <p className="text-gray-300 mt-6 max-w-3xl mx-auto text-lg">
              Tout ce que vous devez savoir pour voter lors des élections présidentielles 
              via la plateforme Sénégal Vote
            </p>
          </motion.div>
        </div>
      </section>

      <div className="w-full max-w-[1100px] mx-auto px-6 sm:px-10 lg:px-16 py-16 space-y-14">
        {/* Pré-requis */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-md p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiInfo className="text-[#007B3A]" /> Conditions requises
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Être de nationalité sénégalaise',
              'Avoir au moins 18 ans révolus',
              'Disposer d\'une carte nationale d\'identité (CNI) valide',
              'Être inscrit sur la liste électorale',
              'Posséder un code électoral unique',
              'Avoir une adresse email valide'
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <FiCheckCircle className="text-[#007B3A] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Vote en ligne */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-md p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiMonitor className="text-[#007B3A]" /> Vote en Ligne - Étapes
          </h2>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Accéder à la plateforme',
                desc: 'Rendez-vous sur le site Sénégal Vote et cliquez sur "Voter en ligne". Vous serez dirigé vers la page d\'authentification.',
                color: '#007B3A'
              },
              {
                step: 2,
                title: 'S\'authentifier',
                desc: 'Saisissez votre numéro CNI et votre code électoral. Ces informations doivent correspondre à celles enregistrées dans la liste électorale.',
                color: '#00A651'
              },
              {
                step: 3,
                title: 'Vérification OTP',
                desc: 'Un code OTP (One-Time Password) à 6 chiffres vous sera envoyé par email. Saisissez ce code pour prouver votre identité. Le code expire après 5 minutes.',
                color: '#FDEF42'
              },
              {
                step: 4,
                title: 'Choisir un candidat',
                desc: 'La liste des candidats vous sera présentée. Sélectionnez le candidat de votre choix en cliquant sur sa carte.',
                color: '#FFA500'
              },
              {
                step: 5,
                title: 'Confirmer le vote',
                desc: 'Un second code OTP vous sera envoyé pour confirmer votre vote. Saisissez-le pour finaliser. Votre vote est alors enregistré de manière sécurisée et irréversible.',
                color: '#E31B23'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: item.color }}>
                    {item.step}
                  </div>
                  {i < 4 && <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>}
                </div>
                <div className="pb-6">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Vote Arduino */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-md p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiCpu className="text-amber-600" /> Vote par Empreinte Digitale (Arduino)
          </h2>
          <p className="text-gray-600 mb-6">
            Pour les électeurs qui ne disposent pas d'accès internet ou qui préfèrent voter 
            en personne, un système de vote par empreinte digitale est disponible dans les 
            bureaux de vote équipés d'un module Arduino/ESP32 avec capteur biométrique.
          </p>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Se rendre au bureau de vote',
                desc: 'Rendez-vous au bureau de vote le plus proche équipé du dispositif Arduino avec capteur d\'empreinte digitale. Munissez-vous de votre carte nationale d\'identité (CNI).',
                color: '#007B3A'
              },
              {
                step: 2,
                title: 'Présenter sa CNI',
                desc: 'L\'opérateur du bureau de vote saisit votre numéro de CNI sur l\'ordinateur. Le système vérifie votre identité dans la base électorale et confirme que vous n\'avez pas encore voté.',
                color: '#00A651'
              },
              {
                step: 3,
                title: 'Poser son doigt sur le capteur',
                desc: 'Placez votre doigt sur le capteur d\'empreinte digitale. Si c\'est votre première fois, votre empreinte sera automatiquement enregistrée et associée à votre profil. Sinon, elle sera simplement vérifiée.',
                color: '#FDEF42'
              },
              {
                step: 4,
                title: 'Choisir un candidat',
                desc: 'Une fois identifié, les candidats s\'affichent sur l\'écran de l\'ordinateur avec leurs photos et noms. Cliquez sur le candidat de votre choix. Vous pouvez également choisir le vote blanc.',
                color: '#FFA500'
              },
              {
                step: 5,
                title: 'Confirmer le vote',
                desc: 'Un écran de confirmation s\'affiche avec le récapitulatif de votre choix. Cliquez sur "Confirmer" pour valider définitivement votre vote. Cette action est irréversible.',
                color: '#E31B23'
              },
              {
                step: 6,
                title: 'Confirmation à l\'écran',
                desc: 'Un message "Merci pour votre vote" s\'affiche avec les détails de votre vote (candidat choisi, méthode, référence). L\'écran se réinitialise automatiquement après 15 secondes pour l\'électeur suivant.',
                color: '#007B3A'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: item.color }}>
                    {item.step}
                  </div>
                  {i < 5 && <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>}
                </div>
                <div className="pb-6">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Bon à savoir</h4>
                <ul className="text-blue-700 text-sm mt-1 space-y-1">
                  <li>• Aucun email ou code OTP n'est nécessaire pour le vote Arduino.</li>
                  <li>• L'empreinte digitale est enregistrée une seule fois, lors du premier vote.</li>
                  <li>• Un opérateur est présent pour vous assister pendant tout le processus.</li>
                  <li>• Un électeur ne peut voter qu'une seule fois, que ce soit en ligne ou par Arduino.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>


        {/* Avertissement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-red-50 border border-red-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-red-700">Important</h3>
              <p className="text-red-600 text-sm mt-1">
                Ne partagez jamais votre code électoral, code OTP ou informations personnelles 
                avec quiconque. Le vote est personnel et secret. Toute tentative de fraude est 
                passible de poursuites judiciaires.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/login" className="btn-senegal inline-flex text-lg py-3.5 px-10">
            Voter Maintenant
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guide;
