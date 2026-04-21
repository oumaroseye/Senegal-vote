import { FiSmartphone, FiDownload, FiCpu } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MobileApp = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 sm:px-10 lg:px-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-6">
            <FiSmartphone size={38} className="text-[#007B3A]" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">Vote electeur sur application mobile</h1>
          <p className="text-gray-600 mb-8">
            Le vote des electeurs se fait via l'application mobile Senegal Vote (Android/iOS).
            Le site web reste utilise pour le vote Arduino et l'administration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a
              href="#"
              className="bg-[#007B3A] text-white rounded-xl py-3 px-4 font-semibold inline-flex items-center justify-center gap-2"
            >
              <FiDownload /> Telecharger sur Play Store
            </a>
            <a
              href="#"
              className="bg-gray-800 text-white rounded-xl py-3 px-4 font-semibold inline-flex items-center justify-center gap-2"
            >
              <FiDownload /> Telecharger sur App Store
            </a>
          </div>

          <Link
            to="/vote-arduino"
            className="inline-flex items-center gap-2 text-[#007B3A] font-semibold hover:underline"
          >
            <FiCpu /> Acceder au vote Arduino
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
