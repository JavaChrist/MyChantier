import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, Calendar, Edit2, Trash2, Check, X } from 'lucide-react';
import { useChantier } from '../../contexts/ChantierContext';
import { useChantierData } from '../../hooks/useChantierData';
import { unifiedEtapesService, type Etape } from '../../firebase/unified-services';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';


export function EtapesManager() {
  const { chantierId, chantierActuel } = useChantier();
  const { entreprises } = useChantierData(chantierId);

  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [showEtapeModal, setShowEtapeModal] = useState(false);
  const [selectedEtape, setSelectedEtape] = useState<Etape | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [etapeToDelete, setEtapeToDelete] = useState<Etape | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les étapes du chantier
  useEffect(() => {
    if (chantierId) {
      loadEtapes();
    }
  }, [chantierId]);

  const loadEtapes = async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      console.log(`🔍 Chargement étapes Firebase V2 pour ${chantierId}`);

      const etapesData = await unifiedEtapesService.getByChantier(chantierId);
      setEtapes(etapesData);

      console.log(`✅ ${etapesData.length} étapes chargées depuis Firebase V2`);

      // Ne plus créer d'étapes par défaut automatiquement
      // L'utilisateur créera ses propres étapes selon ses besoins
    } catch (error) {
      console.error('Erreur chargement étapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultEtapes = async () => {
    const etapesParDefaut = [
      {
        nom: 'Préparation du chantier',
        description: 'Préparation et protection des espaces',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        statut: 'planifiee' as const,
        ordre: 1
      },
      {
        nom: 'Gros œuvre',
        description: 'Travaux de structure et maçonnerie',
        dateDebut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        statut: 'planifiee' as const,
        ordre: 2
      },
      {
        nom: 'Second œuvre',
        description: 'Plomberie, électricité, cloisons',
        dateDebut: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        statut: 'planifiee' as const,
        ordre: 3
      },
      {
        nom: 'Finitions',
        description: 'Peinture, revêtements, finitions',
        dateDebut: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        statut: 'planifiee' as const,
        ordre: 4
      }
    ];

    for (const etape of etapesParDefaut) {
      await unifiedEtapesService.create(chantierId!, etape);
    }

    // Recharger après création
    await loadEtapes();
  };


  const handleCreateEtape = () => {
    setSelectedEtape(null);
    setShowEtapeModal(true);
  };

  const handleEditEtape = (etape: Etape) => {
    setSelectedEtape(etape);
    setShowEtapeModal(true);
  };

  const handleSaveEtape = async (etapeData: Omit<Etape, 'id'>) => {
    if (!chantierId) return;

    try {
      if (selectedEtape?.id) {
        // Modification
        await unifiedEtapesService.update(chantierId, selectedEtape.id, etapeData);
        console.log('✅ Étape modifiée en Firebase V2');
      } else {
        // Création
        const newEtapeData = {
          ...etapeData,
          ordre: etapes.length + 1
        };
        await unifiedEtapesService.create(chantierId, newEtapeData);
        console.log('✅ Étape créée en Firebase V2');
      }

      // Recharger les données
      await loadEtapes();
      setShowEtapeModal(false);
    } catch (error) {
      console.error('Erreur sauvegarde étape:', error);
    }
  };

  const handleDeleteEtape = (etape: Etape) => {
    setEtapeToDelete(etape);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEtape = async () => {
    if (!etapeToDelete?.id || !chantierId) return;

    try {
      await unifiedEtapesService.delete(chantierId, etapeToDelete.id);
      console.log('✅ Étape supprimée en Firebase V2');

      await loadEtapes();
      setShowDeleteConfirm(false);
      setEtapeToDelete(null);
    } catch (error) {
      console.error('Erreur suppression étape:', error);
    }
  };

  const toggleEtapeStatut = async (etape: Etape) => {
    if (!etape.id || !chantierId) return;

    try {
      const nouveauStatut = etape.statut === 'terminee' ? 'en-cours' : 'terminee';
      await unifiedEtapesService.update(chantierId, etape.id, { statut: nouveauStatut });
      console.log(`✅ Statut étape mis à jour: ${nouveauStatut}`);

      await loadEtapes();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'terminee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en-cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en-retard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'terminee':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'en-cours':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'en-retard':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">
          Chargement des étapes {chantierActuel ? `du chantier "${chantierActuel.nom}"` : ''}...
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Étapes du Chantier</h1>
          <p className="text-gray-400 mobile-text">
            {chantierActuel
              ? `Gestion des étapes du chantier "${chantierActuel.nom}"`
              : 'Définir et suivre les étapes de réalisation du chantier'
            }
          </p>
        </div>
        <button
          onClick={handleCreateEtape}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle étape</span>
          <span className="sm:hidden">Nouvelle</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-100">{etapes.length}</div>
          <div className="text-sm text-gray-400">Total étapes</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">{etapes.filter(e => e.statut === 'terminee').length}</div>
          <div className="text-sm text-gray-400">Terminées</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">{etapes.filter(e => e.statut === 'en-cours').length}</div>
          <div className="text-sm text-gray-400">En cours</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-400">{etapes.filter(e => e.statut === 'en-retard').length}</div>
          <div className="text-sm text-gray-400">En retard</div>
        </div>
      </div>

      {/* Timeline des étapes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-6">Timeline du chantier</h2>

        {etapes.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune étape définie</h3>
            <p className="text-gray-500 mb-6">
              Créez les étapes de réalisation de votre chantier pour suivre l'avancement
            </p>
            <button onClick={handleCreateEtape} className="btn-primary">
              Créer la première étape
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {etapes.map((etape, index) => (
              <div key={etape.id} className="flex items-start space-x-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => toggleEtapeStatut(etape)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${etape.statut === 'terminee'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-green-500'
                      }`}
                    title={etape.statut === 'terminee' ? 'Marquer comme en cours' : 'Marquer comme terminée'}
                  >
                    {getStatutIcon(etape.statut)}
                  </button>
                  {index < etapes.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-600 mt-2" />
                  )}
                </div>

                {/* Contenu de l'étape */}
                <div className="flex-1 bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">{etape.nom}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatutColor(etape.statut)}`}>
                          {etape.statut === 'terminee' ? 'Terminée' :
                            etape.statut === 'en-cours' ? 'En cours' :
                              etape.statut === 'en-retard' ? 'En retard' : 'Planifiée'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{etape.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Début: {etape.dateDebut.toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Fin: {etape.dateFin.toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {etape.entrepriseId && (
                        <div className="mt-2 text-sm text-gray-400">
                          Entreprise: {entreprises.find(e => e.id === etape.entrepriseId)?.nom || 'Non assignée'}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEtape(etape)}
                        className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEtape(etape)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {etape.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm text-gray-300">{etape.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création/modification étape */}
      <Modal
        isOpen={showEtapeModal}
        onClose={() => setShowEtapeModal(false)}
        title={selectedEtape ? 'Modifier l\'étape' : 'Nouvelle étape'}
        size="lg"
      >
        <EtapeForm
          etape={selectedEtape}
          entreprises={entreprises}
          onSave={handleSaveEtape}
          onCancel={() => setShowEtapeModal(false)}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDeleteEtape}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Supprimer l'étape"
        message={etapeToDelete ? `Supprimer l'étape "${etapeToDelete.nom}" ?\n\nCette action est irréversible.` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}

// Composant formulaire pour les étapes
function EtapeForm({
  etape,
  entreprises,
  onSave,
  onCancel
}: {
  etape: Etape | null;
  entreprises: any[];
  onSave: (etape: Omit<Etape, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    statut: 'planifiee' as const,
    entrepriseId: '',
    ordre: 1,
    notes: ''
  });

  useEffect(() => {
    if (etape) {
      setFormData({
        nom: etape.nom,
        description: etape.description,
        dateDebut: etape.dateDebut.toISOString().split('T')[0],
        dateFin: etape.dateFin.toISOString().split('T')[0],
        statut: etape.statut,
        entrepriseId: etape.entrepriseId || '',
        ordre: etape.ordre,
        notes: etape.notes || ''
      });
    }
  }, [etape]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      nom: formData.nom,
      description: formData.description,
      dateDebut: new Date(formData.dateDebut),
      dateFin: new Date(formData.dateFin),
      statut: formData.statut,
      entrepriseId: formData.entrepriseId || undefined,
      ordre: formData.ordre,
      notes: formData.notes || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom de l'étape *
          </label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Gros œuvre"
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
            <option value="planifiee">Planifiée</option>
            <option value="en-cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="en-retard">En retard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Description des travaux de cette étape..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de début *
          </label>
          <input
            type="date"
            required
            value={formData.dateDebut}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de fin *
          </label>
          <input
            type="date"
            required
            value={formData.dateFin}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ordre
          </label>
          <input
            type="number"
            min="1"
            value={formData.ordre}
            onChange={(e) => setFormData(prev => ({ ...prev, ordre: parseInt(e.target.value) }))}
            className="input-field w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Entreprise responsable
        </label>
        <select
          value={formData.entrepriseId}
          onChange={(e) => setFormData(prev => ({ ...prev, entrepriseId: e.target.value }))}
          className="input-field w-full"
        >
          <option value="">Aucune entreprise assignée</option>
          {entreprises.map(entreprise => (
            <option key={entreprise.id} value={entreprise.id}>
              {entreprise.nom} ({entreprise.secteurActivite})
            </option>
          ))}
        </select>
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
          placeholder="Notes sur cette étape..."
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
          {etape ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
