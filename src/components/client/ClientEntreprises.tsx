import { User, Clock, MessageCircle, ArrowLeft, CreditCard } from 'lucide-react';

interface ClientEntreprisesProps {
  entreprises: any[];
  onNavigate: (view: string) => void;
}

export function ClientEntreprises({ entreprises, onNavigate }: ClientEntreprisesProps) {
  const secteurColors: Record<string, { bg: string; text: string; icon: string }> = {
    sanitaire: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🚿' },
    electricite: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚡' },
    carrelage: { bg: 'bg-green-100', text: 'text-green-800', icon: '🔲' },
    menuiserie: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🪚' },
    peinture: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🎨' }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Entreprises de votre chantier</h2>
          <p className="text-gray-600">{entreprises.length} entreprise{entreprises.length > 1 ? 's' : ''} travaillent sur votre projet</p>
        </div>
        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
      </div>

      {/* Liste des entreprises */}
      {entreprises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune entreprise assignée</h3>
          <p className="text-gray-600">Les entreprises seront ajoutées par votre professionnel au fur et à mesure de l'avancement du projet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entreprises.map((entreprise) => {
            const couleurSecteur = secteurColors[entreprise.secteurActivite] || secteurColors.sanitaire;

            return (
              <div key={entreprise.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${couleurSecteur.bg}`}>
                      <span className="text-2xl">{couleurSecteur.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{entreprise.nom}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${couleurSecteur.bg} ${couleurSecteur.text}`}>
                        {entreprise.secteurActivite}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {entreprise.contact?.nom && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Contact: {entreprise.contact.nom}</span>
                    </div>
                  )}

                  {entreprise.contact?.telephone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Tél: {entreprise.contact.telephone}</span>
                    </div>
                  )}

                  {entreprise.contact?.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>Email: {entreprise.contact.email}</span>
                    </div>
                  )}

                  {entreprise.adresse && (
                    <div className="flex items-center space-x-2 text-gray-600 md:col-span-2">
                      <span>📍 {entreprise.adresse.rue}, {entreprise.adresse.ville} {entreprise.adresse.codePostal}</span>
                    </div>
                  )}
                </div>

                {/* Informations bancaires */}
                {entreprise.rib && (entreprise.rib.iban || entreprise.rib.bic) && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="flex items-center space-x-2 text-sm font-medium text-green-800 mb-3">
                      <CreditCard className="w-4 h-4" />
                      <span>Informations bancaires</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {entreprise.rib.iban && (
                        <div>
                          <p className="text-gray-600 font-medium">IBAN :</p>
                          <p className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded border">
                            {entreprise.rib.iban}
                          </p>
                        </div>
                      )}
                      {entreprise.rib.bic && (
                        <div>
                          <p className="text-gray-600 font-medium">BIC :</p>
                          <p className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded border">
                            {entreprise.rib.bic}
                          </p>
                        </div>
                      )}
                      {entreprise.rib.titulaire && (
                        <div>
                          <p className="text-gray-600 font-medium">Titulaire :</p>
                          <p className="text-gray-800">{entreprise.rib.titulaire}</p>
                        </div>
                      )}
                      {entreprise.rib.banque && (
                        <div>
                          <p className="text-gray-600 font-medium">Banque :</p>
                          <p className="text-gray-800">{entreprise.rib.banque}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {entreprise.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700"><strong>Notes :</strong> {entreprise.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Informations pratiques */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3">À propos des entreprises</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>Coordination :</strong> Votre professionnel coordonne tous les intervenants</p>
          <p>• <strong>Contact direct :</strong> Pour des urgences, contactez directement les entreprises</p>
          <p>• <strong>Questions :</strong> Pour le suivi général, utilisez la messagerie avec votre professionnel</p>
          <p>• <strong>Planning :</strong> Les interventions sont planifiées dans l'onglet Planning</p>
        </div>
      </div>
    </div>
  );
}
