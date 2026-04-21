import { motion } from 'framer-motion';
import { FiTarget, FiShield } from 'react-icons/fi';

const APropos = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <section className="gradient-hero text-white py-20 w-full">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="bg-white/10 px-5 py-2 rounded-full text-sm">Qui sommes-nous ?</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-8">À Propos de Sénégal Vote</h1>
            <p className="text-gray-300 mt-6 max-w-3xl mx-auto text-lg text-center">
              Une plateforme de vote électronique pour moderniser le processus électoral sénégalais
            </p>
          </motion.div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-16 space-y-14">
        {/* Mission & Vision */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10"
        >
          <div className="bg-white rounded-2xl shadow-md p-10 min-h-[320px]">
            <FiTarget size={40} className="text-[#007B3A] mb-5" />
            <h2 className="text-3xl font-bold text-gray-800 mb-5">Notre Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Sénégal Vote a pour mission de faciliter la participation citoyenne aux élections 
              en offrant une solution de vote électronique sécurisée, accessible et transparente. 
              Notre plateforme permet à chaque citoyen sénégalais de voter depuis chez lui, 
              tout en garantissant l'intégrité du scrutin.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-10 min-h-[320px]">
            <FiShield size={40} className="text-[#007B3A] mb-5" />
            <h2 className="text-3xl font-bold text-gray-800 mb-5">Notre Vision</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Nous croyons en un Sénégal où chaque citoyen peut exercer son droit de vote 
              facilement et en toute sécurité. Notre vision est de contribuer à l'augmentation 
              du taux de participation et de renforcer la démocratie par la technologie.
            </p>
          </div>
        </motion.section>

        {/* Espacement supplémentaire */}
        <div className="py-8"></div>

        {/* Projet de Soutenance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-10 border border-green-100 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Projet de Soutenance</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Ce projet a été développé dans le cadre de notre soutenance de fin d'année. 
            Il combine les technologies web modernes avec l'Internet des Objets (IoT) pour 
            proposer une solution complète de vote électronique adaptée au contexte sénégalais.
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default APropos;
