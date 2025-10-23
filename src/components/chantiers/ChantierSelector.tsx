import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, ArrowRight, Edit2, LogOut, Trash2 } from 'lucide-react';
import { AppIcon, Icon } from '../Icon';
import { chantierService } from '../../firebase/chantiers';
import type { Chantier } from '../../firebase/chantiers';
import { useChantier } from '../../contexts/ChantierContext';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';

interface ChantierSelectorProps {
  professionalId: string;
  professionalName: string;
  onLogout?: () => void;
}

export function ChantierSelector({ professionalId, professionalName, onLogout }: ChantierSelectorProps) {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChantierModal, setShowNewChantierModal] = useState(false);
  const [showEditChantierModal, setShowEditChantierModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);
  const [chantierToDelete, setChantierToDelete] = useState<Chantier | null>(null);
  const { setChantierActuel, setChangtierId } = useChantier();

  // Fonction pour obtenir le chantier principal (avec infos sauvegardées)
  const getChantierPrincipal = (): Chantier => {
    const savedInfo = localStorage.getItem('chantier-principal-info');

    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      return {
        ...parsed,
        dateDebut: new Date(parsed.dateDebut),
        dateFinPrevue: new Date(parsed.dateFinPrevue),
        dateCreation: new Date(parsed.dateCreation),
        dateModification: new Date(parsed.dateModification)
      };
    }

    // Valeurs par défaut si pas de sauvegarde
    return {
      id: 'chantier-principal',
      nom: '🏠 Mes Données Existantes',
      description: 'Toutes vos données actuelles (entreprises, devis, etc.)',
      clientNom: 'Données existantes',
      clientEmail: 'vos-donnees@existantes.com',
      adresse: 'Toutes vos données actuelles',
      dateDebut: new Date('2024-01-01'),
      dateFinPrevue: new Date('2024-12-31'),
      budget: 0,
      statut: 'en-cours',
      professionalId: 'professional-1',
      dateCreation: new Date('2024-01-01'),
      dateModification: new Date()
    };
  };

  useEffect(() => {
    loadChantiers();
  }, [professionalId]);

  const loadChantiers = async () => {
    try {
      setLoading(true);

      // Obtenir le chantier principal (avec modifications sauvegardées)
      const chantierPrincipalActuel = getChantierPrincipal();

      // Charger les autres chantiers sauvegardés
      const savedChantiers = localStorage.getItem('chantiers');
      const chantiersFromStorage = savedChantiers ? JSON.parse(savedChantiers) : [];

      // Reconstituer les dates
      const chantiersWithDates = chantiersFromStorage.map((chantier: any) => ({
        ...chantier,
        dateDebut: new Date(chantier.dateDebut),
        dateFinPrevue: new Date(chantier.dateFinPrevue),
        dateFinReelle: chantier.dateFinReelle ? new Date(chantier.dateFinReelle) : undefined,
        dateCreation: new Date(chantier.dateCreation),
        dateModification: new Date(chantier.dateModification)
      }));

      // Chantier principal + autres chantiers
      setChantiers([chantierPrincipalActuel, ...chantiersWithDates]);
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
      setChantiers([getChantierPrincipal()]);
    } finally {
      setLoading(false);
    }
  };

  const saveChantiers = (newChantiers: Chantier[]) => {
    // Sauvegarder tous sauf le chantier principal
    const chantiersToSave = newChantiers.filter(c => c.id !== 'chantier-principal');
    localStorage.setItem('chantiers', JSON.stringify(chantiersToSave));
  };

  const handleSelectChantier = (chantier: Chantier) => {
    setChantierActuel(chantier);
    setChangtierId(chantier.id!);
  };

  const handleCreateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    try {
      // 1. Créer le chantier avec un ID unique
      const chantierId = `chantier-${Date.now()}`;
      const newChantier: Chantier = {
        ...chantierData,
        id: chantierId,
        professionalId,
        dateCreation: new Date(),
        dateModification: new Date()
      };

      // 2. Créer automatiquement le compte client
      if (chantierData.clientEmail && chantierData.clientEmail.trim()) {
        try {
          const { authService } = await import('../../firebase/auth');
          const { createUserWithEmailAndPassword, updateProfile, signOut } = await import('firebase/auth');
          const { auth } = await import('../../firebase/config');

          console.log('🔧 Création automatique du compte client pour:', chantierData.clientEmail);

          // Générer un mot de passe temporaire aléatoire
          const tempPassword = 'temp' + Math.random().toString(36).substring(2, 12) + '!';

          try {
            // Créer le compte client
            const clientCredential = await createUserWithEmailAndPassword(auth, chantierData.clientEmail, tempPassword);
            await updateProfile(clientCredential.user, { displayName: chantierData.clientNom });

            // Créer le profil client avec le bon rôle et chantier
            await authService.createUserProfile(clientCredential.user.uid, {
              email: chantierData.clientEmail,
              displayName: chantierData.clientNom,
              role: 'client',
              chantierId: chantierId
            });

            // Se déconnecter du compte client (pour revenir au professionnel)
            await signOut(auth);

            console.log('✅ Compte client créé automatiquement');

            // Message avec instructions pour le professionnel
            alert(
              `✅ Chantier "${chantierData.nom}" et compte client créés !\n\n` +
              `👤 Client: ${chantierData.clientNom} (${chantierData.clientEmail})\n\n` +
              `📧 Instructions à transmettre au client :\n\n` +
              `1. Aller sur votre application de suivi de chantier\n` +
              `2. Cliquer sur "Mot de passe oublié ?"\n` +
              `3. Saisir son email: ${chantierData.clientEmail}\n` +
              `4. Vérifier ses emails et définir un nouveau mot de passe\n` +
              `5. Se connecter avec son email et nouveau mot de passe\n\n` +
              `✅ Il aura automatiquement accès à son chantier !`
            );

          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              console.log('ℹ️ Compte client existe déjà');
              alert(
                `✅ Chantier "${chantierData.nom}" créé !\n\n` +
                `ℹ️ Un compte existe déjà pour ${chantierData.clientEmail}\n\n` +
                `📧 Instructions pour le client :\n\n` +
                `1. Utiliser "Mot de passe oublié ?" avec son email\n` +
                `2. Ou se connecter s'il connaît son mot de passe\n\n` +
                `Il aura accès à ce nouveau chantier.`
              );
            } else {
              throw createError;
            }
          }

        } catch (error: any) {
          console.error('Erreur création compte client:', error);
          alert(
            `✅ Chantier créé !\n\n⚠️ Erreur création compte client :\n${error.message}\n\nVous devrez créer le compte manuellement.`
          );
        }
      }

      // 3. Ajouter à la liste et sauvegarder
      const newChantiers = [getChantierPrincipal(), newChantier, ...chantiers.filter(c => c.id !== 'chantier-principal')];
      setChantiers(newChantiers);
      saveChantiers(newChantiers);
      setShowNewChantierModal(false);

    } catch (error) {
      console.error('Erreur création chantier:', error);
      alert('Erreur lors de la création du chantier');
    }
  };

  const handleEditChantier = (chantier: Chantier) => {
    setSelectedChantier(chantier);
    setShowEditChantierModal(true);
  };

  const handleDeleteChantier = (chantier: Chantier) => {
    setChantierToDelete(chantier);
    setShowDeleteConfirmModal(true);
  };

  const handleConfigureClientAccess = async (chantier: Chantier) => {
    const currentEmail = chantier.clientEmail;
    const hasValidEmail = currentEmail && currentEmail !== 'vos-donnees@existantes.com' && currentEmail.includes('@');

    const clientEmail = prompt(
      `Configurer l'accès client pour "${chantier.nom}"\n\n` +
      `Email actuel: ${currentEmail}\n\n` +
      `${hasValidEmail
        ? 'Voulez-vous créer le compte pour cet email ou en saisir un nouveau ?'
        : 'Saisissez le vrai email du client pour lui créer un accès :'
      }`
    ) || (hasValidEmail ? currentEmail : '');

    if (!clientEmail || clientEmail.trim() === '') return;

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      alert('⚠️ Adresse email invalide.');
      return;
    }

    try {
      const { authService } = await import('../../firebase/auth');
      const { createUserWithEmailAndPassword, updateProfile, signOut } = await import('firebase/auth');
      const { auth } = await import('../../firebase/config');

      console.log('🔧 Configuration accès client pour le chantier principal:', clientEmail);

      // Mettre à jour les informations du chantier principal
      const updatedChantier = { ...chantier, clientEmail };
      localStorage.setItem('chantier-principal-info', JSON.stringify(updatedChantier));

      // Mettre à jour dans la liste affichée
      const updatedChantiers = chantiers.map(c =>
        c.id === 'chantier-principal' ? updatedChantier : c
      );
      setChantiers(updatedChantiers);

      try {
        // Créer le compte client
        const tempPassword = 'temp' + Math.random().toString(36).substring(2, 12) + '!';
        const clientCredential = await createUserWithEmailAndPassword(auth, clientEmail, tempPassword);
        await updateProfile(clientCredential.user, { displayName: chantier.clientNom });

        // Créer le profil client
        await authService.createUserProfile(clientCredential.user.uid, {
          email: clientEmail,
          displayName: chantier.clientNom,
          role: 'client',
          chantierId: 'chantier-principal'
        });

        // Se déconnecter du compte client
        await signOut(auth);

        alert(
          `✅ Accès client configuré pour le chantier principal !\n\n` +
          `👤 Client: ${chantier.clientNom} (${clientEmail})\n\n` +
          `📧 Instructions à transmettre au client :\n\n` +
          `1. Aller sur votre application de suivi de chantier\n` +
          `2. Cliquer sur "Mot de passe oublié ?"\n` +
          `3. Saisir son email: ${clientEmail}\n` +
          `4. Vérifier ses emails et définir un mot de passe\n` +
          `5. Se connecter avec son email et nouveau mot de passe\n\n` +
          `✅ Il aura accès à toutes vos données existantes !`
        );

      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          alert(
            `✅ Email client mis à jour !\n\n` +
            `ℹ️ Un compte existe déjà pour ${clientEmail}\n\n` +
            `📧 Instructions pour le client :\n\n` +
            `1. Utiliser "Mot de passe oublié ?" avec son email\n` +
            `2. Ou se connecter s'il connaît son mot de passe\n\n` +
            `Il aura accès à vos données existantes.`
          );
        } else {
          throw createError;
        }
      }

    } catch (error: any) {
      console.error('Erreur configuration accès client:', error);
      alert(`❌ Erreur lors de la configuration : ${error.message}`);
    }
  };

  const confirmDeleteChantier = async () => {
    if (!chantierToDelete) return;

    try {
      // Protéger le chantier principal
      if (chantierToDelete.id === 'chantier-principal') {
        alert('⚠️ Le chantier principal ne peut pas être supprimé car il contient vos données existantes.');
        setShowDeleteConfirmModal(false);
        setChantierToDelete(null);
        return;
      }

      console.log('🗑️ Suppression du chantier:', chantierToDelete.nom);

      // Supprimer de la liste
      const updatedChantiers = chantiers.filter(c => c.id !== chantierToDelete.id);
      setChantiers(updatedChantiers);
      saveChantiers(updatedChantiers);

      // TODO: Supprimer aussi les données liées (entreprises, devis, etc.) si nécessaire
      console.log('✅ Chantier supprimé avec succès');

      setShowDeleteConfirmModal(false);
      setChantierToDelete(null);
    } catch (error) {
      console.error('Erreur suppression chantier:', error);
      alert('Erreur lors de la suppression du chantier');
    }
  };

  const handleUpdateChantier = async (chantierData: Omit<Chantier, 'id'>) => {
    if (!selectedChantier) return;

    try {
      const updatedChantier: Chantier = {
        ...chantierData,
        id: selectedChantier.id,
        professionalId,
        dateCreation: selectedChantier.dateCreation,
        dateModification: new Date()
      };

      // Mettre à jour dans la liste
      const updatedChantiers = chantiers.map(c =>
        c.id === selectedChantier.id ? updatedChantier : c
      );
      setChantiers(updatedChantiers);

      // Sauvegarder (même le chantier principal peut être modifié)
      if (selectedChantier.id === 'chantier-principal') {
        // Sauvegarder les infos du chantier principal séparément
        localStorage.setItem('chantier-principal-info', JSON.stringify(updatedChantier));
      } else {
        saveChantiers(updatedChantiers);
      }

      setShowEditChantierModal(false);
      setSelectedChantier(null);
    } catch (error) {
      console.error('Erreur modification chantier:', error);
      alert('Erreur lors de la modification du chantier');
    }
  };

  const handleFixUserName = async () => {
    const newName = prompt(
      'Corriger votre nom d\'affichage :\n\n' +
      'Saisissez votre vrai nom :'
    );

    if (!newName || newName.trim() === '') return;

    try {
      const { authService } = await import('../../firebase/auth');
      const { auth } = await import('../../firebase/config');

      if (auth.currentUser) {
        await authService.updateUserProfile(auth.currentUser.uid, {
          displayName: newName.trim()
        });

        alert(`✅ Nom mis à jour vers "${newName.trim()}" !\n\nReconnectez-vous pour voir le changement.`);
      }
    } catch (error) {
      console.error('Erreur mise à jour nom:', error);
      alert('❌ Erreur lors de la mise à jour du nom.');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'bg-blue-100 text-blue-800';
      case 'en-cours':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      case 'suspendu':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return 'Planifié';
      case 'en-cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement de vos chantiers</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8 relative">
          {/* Bouton de déconnexion */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="absolute top-0 right-0 flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          )}

          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AppIcon size={48} className="brightness-100" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bonjour {professionalName} !
            {professionalName === 'Utilisateur' && (
              <button
                onClick={handleFixUserName}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                title="Corriger le nom d'affichage"
              >
                (corriger le nom)
              </button>
            )}
          </h1>
          <p className="text-gray-600">
            Sélectionnez le chantier sur lequel vous souhaitez travailler
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowNewChantierModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau chantier</span>
          </button>
        </div>

        {/* Liste des chantiers */}
        {chantiers.length === 0 ? (
          <div className="text-center py-12">
            <AppIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun chantier</h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier chantier pour commencer à utiliser l'application
            </p>
            <button
              onClick={() => setShowNewChantierModal(true)}
              className="btn-primary"
            >
              Créer mon premier chantier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chantiers.map((chantier) => (
              <div
                key={chantier.id}
                onClick={() => handleSelectChantier(chantier)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                    <AppIcon size={32} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(chantier.statut)}`}>
                      {getStatutLabel(chantier.statut)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChantier(chantier);
                        }}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier le chantier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Bouton spécial pour le chantier principal */}
                      {chantier.id === 'chantier-principal' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfigureClientAccess(chantier);
                          }}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Configurer l'accès client"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      ) : (
                        /* Bouton de suppression pour les autres chantiers */
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChantier(chantier);
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le chantier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      {chantier.nom}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {chantier.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{chantier.clientNom}</span>
                      {/* Indicateur accès client pour le chantier principal */}
                      {chantier.id === 'chantier-principal' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${chantier.clientEmail &&
                          chantier.clientEmail !== 'vos-donnees@existantes.com' &&
                          chantier.clientEmail.includes('@')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {chantier.clientEmail &&
                            chantier.clientEmail !== 'vos-donnees@existantes.com' &&
                            chantier.clientEmail.includes('@')
                            ? '📧 ' + chantier.clientEmail
                            : '⚙️ Configurer email client'
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{chantier.adresse}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {chantier.dateDebut.toLocaleDateString('fr-FR')} → {chantier.dateFinPrevue.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {chantier.budget && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget :</span>
                        <span className="font-semibold text-gray-800">
                          {chantier.budget.toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flèche d'indication */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center text-primary-600 group-hover:text-primary-700 transition-colors">
                    <span className="text-sm font-medium mr-2">Ouvrir ce chantier</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nouveau chantier */}
        <Modal
          isOpen={showNewChantierModal}
          onClose={() => setShowNewChantierModal(false)}
          title="Nouveau chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            onSave={handleCreateChantier}
            onCancel={() => setShowNewChantierModal(false)}
          />
        </Modal>

        {/* Modal modification chantier */}
        <Modal
          isOpen={showEditChantierModal}
          onClose={() => setShowEditChantierModal(false)}
          title="Modifier le chantier"
          size="lg"
        >
          <NewChantierForm
            professionalId={professionalId}
            chantier={selectedChantier}
            onSave={handleUpdateChantier}
            onCancel={() => setShowEditChantierModal(false)}
          />
        </Modal>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteConfirmModal}
          onConfirm={confirmDeleteChantier}
          onCancel={() => {
            setShowDeleteConfirmModal(false);
            setChantierToDelete(null);
          }}
          title="Confirmer la suppression"
          message={
            chantierToDelete
              ? `Êtes-vous sûr de vouloir supprimer le chantier "${chantierToDelete.nom}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`
              : ''
          }
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
        />
      </div>
    </div>
  );
}

// Composant formulaire pour créer un nouveau chantier
function NewChantierForm({
  professionalId,
  chantier,
  onSave,
  onCancel
}: {
  professionalId: string;
  chantier?: Chantier | null;
  onSave: (chantier: Omit<Chantier, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    clientNom: '',
    clientEmail: '',
    clientTelephone: '',
    adresse: '',
    dateDebut: '',
    dateFinPrevue: '',
    budget: '',
    statut: 'planifie' as const,
    notes: ''
  });

  useEffect(() => {
    if (chantier) {
      setFormData({
        nom: chantier.nom,
        description: chantier.description,
        clientNom: chantier.clientNom,
        clientEmail: chantier.clientEmail,
        clientTelephone: chantier.clientTelephone || '',
        adresse: chantier.adresse,
        dateDebut: chantier.dateDebut.toISOString().split('T')[0],
        dateFinPrevue: chantier.dateFinPrevue.toISOString().split('T')[0],
        budget: chantier.budget?.toString() || '',
        statut: chantier.statut,
        notes: chantier.notes || ''
      });
    }
  }, [chantier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      nom: formData.nom,
      description: formData.description,
      clientNom: formData.clientNom,
      clientEmail: formData.clientEmail,
      clientTelephone: formData.clientTelephone,
      adresse: formData.adresse,
      dateDebut: new Date(formData.dateDebut),
      dateFinPrevue: new Date(formData.dateFinPrevue),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      statut: formData.statut,
      professionalId,
      notes: formData.notes,
      dateCreation: new Date(),
      dateModification: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du chantier
          </label>
          <input
            type="text"
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
          Description du projet
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="input-field w-full resize-none"
          placeholder="Description des travaux à réaliser..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du client
          </label>
          <input
            type="text"
            value={formData.clientNom}
            onChange={(e) => setFormData(prev => ({ ...prev, clientNom: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: M. et Mme Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email du client *
          </label>
          <input
            type="email"
            required
            value={formData.clientEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="input-field w-full"
            placeholder="client@exemple.com"
          />
          <p className="text-xs text-blue-400 mt-1">
            💡 Un compte client sera automatiquement créé avec cet email
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse du chantier
        </label>
        <input
          type="text"
          value={formData.adresse}
          onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
          className="input-field w-full"
          placeholder="123 rue de la Paix, 75001 Paris"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de début
          </label>
          <input
            type="date"
            value={formData.dateDebut}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de fin prévue
          </label>
          <input
            type="date"
            value={formData.dateFinPrevue}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFinPrevue: e.target.value }))}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            className="input-field w-full"
            placeholder="45000"
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
          placeholder="Notes sur le chantier..."
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
          {chantier ? 'Modifier le chantier' : 'Créer le chantier'}
        </button>
      </div>
    </form>
  );
}
