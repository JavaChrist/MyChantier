import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, ArrowRight, AlertTriangle, CheckCircle, Play, Pause, Square } from 'lucide-react';
import { planningService, tachesService, DEPENDANCES_TEMPLATES } from '../../firebase/planning';
import { entreprisesService, commandesService } from '../../firebase/entreprises';
import type { PlanningChantier, TacheChantier } from '../../firebase/planning';
import type { Entreprise, Commande } from '../../firebase/entreprises';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';

export function PlanningManager() {
  const [plannings, setPlannings] = useState<PlanningChantier[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [selectedPlanning, setSelectedPlanning] = useState<PlanningChantier | null>(null);
  const [taches, setTaches] = useState<TacheChantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{ type: string; tache?: TacheChantier } | null>(null);

  useEffect(() => {
    loadPlannings();
    loadEntreprisesEtCommandes();
  }, []);

  const loadPlannings = async () => {
    try {
      const data = await planningService.getAll();
      setPlannings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des plannings:', error);
      setPlannings([]);
    }
  };

  const loadEntreprisesEtCommandes = async () => {
    try {
      const entreprisesData = await entreprisesService.getAll();
      setEntreprises(entreprisesData);

      // Charger toutes les commandes de toutes les entreprises
      const toutesCommandes: Commande[] = [];
      for (const entreprise of entreprisesData) {
        if (entreprise.id) {
          const commandesEntreprise = await commandesService.getByEntreprise(entreprise.id);
          toutesCommandes.push(...commandesEntreprise);
        }
      }
      setCommandes(toutesCommandes);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setEntreprises([]);
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTaches = async (planningId: string) => {
    try {
      const data = await tachesService.getByPlanning(planningId);
      setTaches(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      setTaches([]);
    }
  };

  const handleSelectPlanning = async (planning: PlanningChantier) => {
    setSelectedPlanning(planning);
    if (planning.id) {
      await loadTaches(planning.id);
    }
  };

  const handleCreatePlanning = () => {
    setSelectedPlanning(null);
    setTaches([]);
    setShowForm(true);
  };

  const handleSavePlanning = async (planningData: Omit<PlanningChantier, 'id'>) => {
    try {
      if (selectedPlanning?.id) {
        await planningService.update(selectedPlanning.id, planningData);
        await loadPlannings();
      } else {
        const newId = await planningService.create({
          ...planningData,
          dateCreation: new Date()
        });
        await loadPlannings();
        // Sélectionner le nouveau planning
        const newPlanning = (await planningService.getAll()).find(p => p.id === newId);
        if (newPlanning) {
          setSelectedPlanning(newPlanning);
          await loadTaches(newId);
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleGenererTachesAuto = async (template: string) => {
    if (!selectedPlanning?.id) return;

    try {
      const templateTaches = DEPENDANCES_TEMPLATES[template as keyof typeof DEPENDANCES_TEMPLATES];
      if (!templateTaches) return;

      let dateDebut = new Date(selectedPlanning.dateDebutPrevue);
      let ordre = 1;

      for (const templateTache of templateTaches) {
        // Trouver une entreprise du bon secteur avec une commande
        const entreprise = entreprises.find(e => e.secteurActivite === templateTache.secteur);
        const commande = commandes.find(c => c.entrepriseId === entreprise?.id && c.statut !== 'annulee');

        if (entreprise && commande) {
          const dateFin = new Date(dateDebut);
          dateFin.setDate(dateFin.getDate() + templateTache.duree);

          const tache: Omit<TacheChantier, 'id' | 'planningId'> = {
            commandeId: commande.id!,
            entrepriseId: entreprise.id!,
            entrepriseNom: entreprise.nom,
            secteur: templateTache.secteur,
            nom: templateTache.nom,
            description: `Tâche ${templateTache.nom} - ${entreprise.nom}`,
            dateDebutPrevue: new Date(dateDebut),
            dateFinPrevue: dateFin,
            dureeEstimee: templateTache.duree,
            statut: 'non-commencee',
            dependances: templateTache.dependances,
            ordre
          };

          await tachesService.create(selectedPlanning.id, tache);

          // Préparer la date de début pour la tâche suivante
          dateDebut = new Date(dateFin);
          dateDebut.setDate(dateDebut.getDate() + 1); // 1 jour de battement
          ordre++;
        }
      }

      await loadTaches(selectedPlanning.id);
    } catch (error) {
      console.error('Erreur lors de la génération automatique:', error);
    }
  };

  const handleUpdateTacheStatut = (tache: TacheChantier, nouveauStatut: TacheChantier['statut']) => {
    setActionToConfirm({ type: 'update-statut', tache: { ...tache, statut: nouveauStatut } });
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!actionToConfirm || !selectedPlanning?.id) return;

    try {
      if (actionToConfirm.type === 'update-statut' && actionToConfirm.tache) {
        const updateData: Partial<TacheChantier> = {
          statut: actionToConfirm.tache.statut
        };

        // Si on commence la tâche, ajouter la date de début réelle
        if (actionToConfirm.tache.statut === 'en-cours') {
          updateData.dateDebutReelle = new Date();
        }

        // Si on termine la tâche, ajouter la date de fin réelle
        if (actionToConfirm.tache.statut === 'terminee') {
          updateData.dateFinReelle = new Date();
        }

        await tachesService.update(selectedPlanning.id, actionToConfirm.tache.id!, updateData);
        await loadTaches(selectedPlanning.id);
      }

      setShowConfirmModal(false);
      setActionToConfirm(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
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

  const getTacheStatutIcon = (statut: string) => {
    switch (statut) {
      case 'non-commencee':
        return <Clock className="w-4 h-4" />;
      case 'en-cours':
        return <Play className="w-4 h-4" />;
      case 'terminee':
        return <CheckCircle className="w-4 h-4" />;
      case 'bloquee':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canStartTache = (tache: TacheChantier): boolean => {
    if (tache.statut !== 'non-commencee') return false;

    // Vérifier que toutes les dépendances sont terminées
    return tache.dependances.every(depNom => {
      return taches.some(t => t.nom === depNom && t.statut === 'terminee');
    });
  };

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">Chargement des plannings...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <PlanningForm
        planning={selectedPlanning}
        onSave={handleSavePlanning}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Planning des Travaux</h1>
          <p className="text-gray-400 mobile-text">Gérez les dépendances et la planification des interventions</p>
        </div>
        <button
          onClick={handleCreatePlanning}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau planning</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {plannings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun planning créé</h3>
          <p className="text-gray-500 mb-6">
            Créez votre premier planning pour organiser les interventions avec les dépendances entre corps de métier
          </p>
          <button onClick={handleCreatePlanning} className="btn-primary">
            Créer un planning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Liste des plannings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plannings.map((planning) => (
              <div
                key={planning.id}
                className={`card-mobile cursor-pointer transition-all ${selectedPlanning?.id === planning.id ? 'ring-2 ring-primary-500 bg-gray-750' : 'hover:bg-gray-750'
                  }`}
                onClick={() => handleSelectPlanning(planning)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">{planning.nom}</h2>
                    <p className="text-gray-400 text-sm">{planning.adresse}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(planning.statut)}`}>
                    {planning.statut}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Début prévu:</span>
                    <p className="text-gray-100">{planning.dateDebutPrevue.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Fin prévue:</span>
                    <p className="text-gray-100">{planning.dateFinPrevue.toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedPlanning?.id === planning.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-blue-400">Planning sélectionné - Voir les tâches ci-dessous</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Détail du planning sélectionné */}
          {selectedPlanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-100">
                  Tâches - {selectedPlanning.nom}
                </h2>
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => e.target.value && handleGenererTachesAuto(e.target.value)}
                    className="input-field text-sm"
                    defaultValue=""
                  >
                    <option value="">Modèles de tâches</option>
                    <option value="renovation-sdb">Rénovation SDB</option>
                    <option value="renovation-cuisine">Rénovation cuisine</option>
                  </select>
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-secondary text-sm"
                  >
                    Modifier
                  </button>
                </div>
              </div>

              {taches.length === 0 ? (
                <div className="text-center py-8 bg-gray-700 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune tâche planifiée</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Utilisez un modèle de tâches ou créez-les manuellement
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {taches.map((tache, index) => {
                    const peutCommencer = canStartTache(tache);
                    const dependancesTerminees = tache.dependances.filter(depNom =>
                      taches.some(t => t.nom === depNom && t.statut === 'terminee')
                    ).length;

                    return (
                      <div key={tache.id} className="relative">
                        {/* Ligne de connexion */}
                        {index < taches.length - 1 && (
                          <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-600" />
                        )}

                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTacheStatutColor(tache.statut)}`}>
                              {getTacheStatutIcon(tache.statut)}
                            </div>
                          </div>

                          <div className="flex-1 bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-100">{tache.nom}</h4>
                                <p className="text-sm text-gray-400">{tache.entrepriseNom}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTacheStatutColor(tache.statut)}`}>
                                  {tache.statut}
                                </div>
                                {tache.statut === 'non-commencee' && peutCommencer && (
                                  <button
                                    onClick={() => handleUpdateTacheStatut(tache, 'en-cours')}
                                    className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded"
                                    title="Commencer la tâche"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                {tache.statut === 'en-cours' && (
                                  <button
                                    onClick={() => handleUpdateTacheStatut(tache, 'terminee')}
                                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded"
                                    title="Terminer la tâche"
                                  >
                                    <Square className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-300 mb-3">{tache.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                              <div>
                                <span className="text-gray-400">Secteur:</span>
                                <p className="text-gray-100">{tache.secteur}</p>
                              </div>
                            </div>

                            {tache.dependances.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="flex items-start space-x-2 text-sm">
                                  <ArrowRight className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <span className="text-gray-400">
                                      Dépend de ({dependancesTerminees}/{tache.dependances.length}) :
                                    </span>
                                    <div className="mt-1 space-y-1">
                                      {tache.dependances.map((depNom, i) => {
                                        const depTerminee = taches.some(t => t.nom === depNom && t.statut === 'terminee');
                                        return (
                                          <div key={i} className={`text-xs px-2 py-1 rounded ${depTerminee ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                                            }`}>
                                            {depNom} {depTerminee ? '✓' : '⏳'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!peutCommencer && tache.statut === 'non-commencee' && tache.dependances.length > 0 && (
                              <div className="mt-3 p-2 bg-red-600/10 border border-red-600/20 rounded text-xs text-red-400">
                                ⚠️ Cette tâche est bloquée en attente des dépendances
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modale de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setActionToConfirm(null);
        }}
        title="Confirmer l'action"
        message={
          actionToConfirm?.type === 'update-statut'
            ? `Changer le statut de "${actionToConfirm.tache?.nom}" vers "${actionToConfirm.tache?.statut}" ?`
            : 'Confirmer cette action ?'
        }
        confirmText="Confirmer"
        cancelText="Annuler"
        type="info"
      />

      {/* Modal pour créer/modifier un planning */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selectedPlanning ? 'Modifier le planning' : 'Nouveau planning'}
        size="lg"
      >
        <PlanningForm
          planning={selectedPlanning}
          onSave={handleSavePlanning}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}

// Composant formulaire pour créer/modifier un planning
function PlanningForm({
  planning,
  onSave,
  onCancel
}: {
  planning: PlanningChantier | null;
  onSave: (planning: Omit<PlanningChantier, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    statut: 'planifie' as const,
    notes: ''
  });

  useEffect(() => {
    if (planning) {
      setFormData({
        nom: planning.nom,
        adresse: planning.adresse,
        dateDebutPrevue: planning.dateDebutPrevue.toISOString().split('T')[0],
        dateFinPrevue: planning.dateFinPrevue.toISOString().split('T')[0],
        statut: planning.statut,
        notes: planning.notes || ''
      });
    }
  }, [planning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nom: formData.nom,
      adresse: formData.adresse,
      dateDebutPrevue: new Date(formData.dateDebutPrevue),
      dateFinPrevue: new Date(formData.dateFinPrevue),
      statut: formData.statut,
      notes: formData.notes,
      dateCreation: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du planning *
          </label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Rénovation Maison Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
            className="input-field w-full"
          >
            <option value="planifie">Planifié</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse du chantier *
        </label>
        <input
          type="text"
          required
          value={formData.adresse}
          onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
          className="input-field w-full"
          placeholder="Ex: 123 rue de la Paix, 75001 Paris"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de début prévue *
          </label>
          <input
            type="date"
            required
            value={formData.dateDebutPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebutPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de fin prévue *
          </label>
          <input
            type="date"
            required
            value={formData.dateFinPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFinPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Notes sur le planning..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {planning ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
