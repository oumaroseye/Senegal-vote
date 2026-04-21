import { useEffect, useState } from 'react';
import { publicAPI } from '../services/api';

const FinishedVoteResults = () => {
  const [resultatsFinaux, setResultatsFinaux] = useState(null);

  useEffect(() => {
    const fetchResultats = async () => {
      try {
        const resResultats = await publicAPI.getResultats();
        if (resResultats.data.success) {
          setResultatsFinaux(resResultats.data.data);
        }
      } catch (err) {
        // silencieux
      }
    };

    fetchResultats();
  }, []);

  if (!resultatsFinaux) return null;

  return (
    <section className="w-full py-16 bg-[#0f172a]">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-10">
          <h2 className="text-5xl md:text-6xl font-extrabold text-[#E31B23] tracking-wide">
            VOTE TERMINE
          </h2>
          <p className="text-slate-300 mt-4 text-lg">
            Les resultats officiels sont maintenant disponibles.
          </p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-400">Total votes</p>
              <p className="text-2xl font-bold text-white">{resultatsFinaux.total_votes}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Votes blancs</p>
              <p className="text-2xl font-bold text-white">{resultatsFinaux.votes_blancs}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Participation</p>
              <p className="text-2xl font-bold text-white">{resultatsFinaux.taux_participation}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-center">
            <div>
              <p className="text-sm text-slate-400">Votants en ligne</p>
              <p className="text-2xl font-bold text-white">
                {resultatsFinaux.votes_en_ligne ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Votants Arduino</p>
              <p className="text-2xl font-bold text-white">
                {resultatsFinaux.votes_arduino ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {resultatsFinaux.resultats?.map((candidat, i) => (
            <div key={candidat.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">
                  {i + 1}. {candidat.prenom} {candidat.nom}
                </p>
                <p className="text-sm text-slate-400">{candidat.parti}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl" style={{ color: candidat.couleur || '#007B3A' }}>
                  {candidat.pourcentage || 0}%
                </p>
                <p className="text-sm text-slate-400">{candidat.nombre_votes} votes</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FinishedVoteResults;
