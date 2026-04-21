import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FinishedVoteResults from './components/FinishedVoteResults';
import { publicAPI } from './services/api';
import Home from './pages/Home';
import Login from './pages/Login';
import Vote from './pages/Vote';
import Resultats from './pages/Resultats';
import Guide from './pages/Guide';
import APropos from './pages/APropos';
import Candidats from './pages/Candidats';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VoteArduino from './pages/VoteArduino';
// EnregistrementEmpreinte fusionné dans VoteArduino

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
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
    const interval = setInterval(fetchElectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      {isVoteFinished && location.pathname !== '/' && <FinishedVoteResults />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/resultats" element={<Resultats />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/candidats" element={<Candidats />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/vote-arduino" element={<VoteArduino />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
