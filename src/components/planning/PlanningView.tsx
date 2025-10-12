import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { db } from '../../database';
import { PlanningChantier, TacheChantier, Entreprise, Commande } from '../../types';
import { Modal } from '../Modal';
import { PlanningForm } from './PlanningForm';

export function PlanningView() {
  const [plannings, setPlannings] = useState<PlanningChantier[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [selectedPlanning, setSelectedPlanning] = useState<PlanningChantier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allPlannings, allEntreprises, allCommandes] = await Promise.all([
        db.plannings.toArray(),
        db.entreprises.toArray(),
        db.commandes.toArray()
      ]);
      setPlannings(allPlannings);
      setEntreprises(allEntreprises);
      setCommandes(allCommandes);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const handleAddPlanning = () => {
    setSelectedPlanning(null);
    setIsModalOpen(true);
  };

  const handleEditPlanning = (planning: PlanningChantier) => {
    setSelectedPlanning(planning);
    setIsModalOpen(true);
  };

  const handleSavePlanning = async (planningData: Partial<PlanningChantier>) => {
    try {
      if (selectedPlanning) {
        await db.plannings.update(selectedPlanning.id, planningData);
      } else {
        const newPlanning: PlanningChantier = {
          ...planningData as PlanningChantier,
          id: crypto.randomUUID(),
          taches: [],
          statut: 'planifie'
        };
        await db.plannings.add(newPlanning);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const getEntrepriseNom = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId);
    if (!commande) return 'Commande inconnue';

    const entreprise = entreprises.find(e => e.id === commande.entrepriseId);
    return entreprise?.nom || 'Entreprise inconnue';
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'text-blue-400 bg-blue-400/10';
      case 'en-cours':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'termine':
        return 'text-green-400 bg-green-400/10';
      case 'suspendu':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTacheStatutColor = (statut: string) => {
    switch (statut) {
      case 'non-commencee':
        return 'text-gray-400 bg-gray-400/10';
      case 'en-cours':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'terminee':
        return 'text-green-400 bg-green-400/10';
      case 'bloquee':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTacheStatutLabel = (statut: string) => {
    switch (statut) {
      case 'non-commencee':
        return 'Non commencée';
      case 'en-cours':
        return 'En cours';
      case 'terminee':
        return 'Terminée';
      case 'bloquee':
        return 'Bloquée';
      default:
        return statut;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Planning des Travaux</h1>
          <p className="text-gray-400 mt-1">Gérez les dépendances et la planification des interventions</p>
        </div>
        <button
          onClick={handleAddPlanning}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau planning</span>
        </button>
      </div>

      {plannings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun planning créé</h3>
          <p className="text-gray-500 mb-6">
            Créez votre premier planning pour organiser les interventions
          </p>
          <button onClick={handleAddPlanning} className="btn-primary">
            Créer un planning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plannings.map((planning) => (
            <div key={planning.id} className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">{planning.nom}</h2>
                  <p className="text-gray-400 text-sm mt-1">{planning.adresse}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        Du {planning.dateDebutPrevue.toLocaleDateString()} au {planning.dateFinPrevue.toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(planning.statut)}`}>
                      {planning.statut}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEditPlanning(planning)}
                  className="btn-secondary text-sm"
                >
                  Modifier
                </button>
              </div>

              {planning.taches.length === 0 ? (
                <div className="text-center py-8 bg-gray-700 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune tâche planifiée</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Modifiez ce planning pour ajouter des tâches
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-100">Tâches planifiées</h3>

                  {/* Timeline des tâches */}
                  <div className="space-y-3">
                    {planning.taches
                      .sort((a, b) => a.dateDebutPrevue.getTime() - b.dateDebutPrevue.getTime())
                      .map((tache, index) => (
                        <div key={tache.id} className="relative">
                          {/* Ligne de connexion */}
                          {index < planning.taches.length - 1 && (
                            <div className="absolute left-4 top-12 w-0.5 h-8 bg-gray-600" />
                          )}

                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTacheStatutColor(tache.statut)}`}>
                                {tache.statut === 'terminee' ? (
                                  <Clock className="w-4 h-4" />
                                ) : tache.statut === 'bloquee' ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Clock className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-100">{tache.nom}</h4>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTacheStatutColor(tache.statut)}`}>
                                  {getTacheStatutLabel(tache.statut)}
                                </div>
                              </div>

                              <p className="text-sm text-gray-300 mb-3">{tache.description}</p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Entreprise:</span>
                                  <p className="text-gray-100 font-medium">{getEntrepriseNom(tache.commandeId)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Début prévu:</span>
                                  <p className="text-gray-100">{tache.dateDebutPrevue.toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Fin prévue:</span>
                                  <p className="text-gray-100">{tache.dateFinPrevue.toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Durée:</span>
                                  <p className="text-gray-100">{tache.dureeEstimee} jour(s)</p>
                                </div>
                              </div>

                              {tache.dependances.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-400">
                                      Dépend de: {tache.dependances.length} tâche(s)
                                    </span>
                                  </div>
                                </div>
                              )}

                              {tache.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                  <p className="text-sm text-gray-300">{tache.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlanning ? 'Modifier le planning' : 'Nouveau planning'}
        size="xl"
      >
        <PlanningForm
          planning={selectedPlanning}
          commandes={commandes}
          entreprises={entreprises}
          onSave={handleSavePlanning}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
