import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, User, AlertCircle, Trash2, CreditCard, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useChantier } from '../../contexts/ChantierContext';
import {
  unifiedMessagesService,
  unifiedPaiementsService,
  unifiedEntreprisesService,
  type Message,
  type Paiement
} from '../../firebase/unified-services';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ConfirmModal } from '../ConfirmModal';

type PendingPaiement = Paiement & { entrepriseNom: string };

export function ChantierChat() {
  const { chantierActuel, budgetActuel } = useChantier();

  // Détecter le type d'utilisateur depuis l'URL ou le contexte
  const isClientInterface = window.location.pathname.includes('/client') ||
    document.querySelector('[data-client-interface]') !== null ||
    // Détecter si on est dans l'interface client par la structure DOM
    document.querySelector('.bg-gray-50') !== null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [pendingPaiements, setPendingPaiements] = useState<PendingPaiement[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [showDecisionHistory, setShowDecisionHistory] = useState(true);

  type LoadMessagesOptions = {
    markAsRead?: boolean;
  };

  // Charger les messages du chantier actuel
  useEffect(() => {
    if (chantierActuel) {
      loadMessagesForChantier(chantierActuel.id!, { markAsRead: false }); // Ne pas marquer comme lu au chargement
      setChatVisible(true); // Le chat est maintenant visible
    }
  }, [chantierActuel]);

  // Marquer comme lus après un court délai quand le chat devient visible
  useEffect(() => {
    if (chatVisible && chantierActuel) {
      const timer = setTimeout(() => {
        markMessagesAsRead(chantierActuel.id!);
      }, 1000); // Attendre 1 seconde avant de marquer comme lu

      return () => clearTimeout(timer);
    }
  }, [chatVisible, chantierActuel]);

  useEffect(() => {
    let isMounted = true;
    const fetchPendingPaiements = async () => {
      if (!chantierActuel?.id) {
        if (isMounted) setPendingPaiements([]);
        return;
      }

      try {
        setLoadingDecisions(true);
        const [paiementsData, entreprisesData] = await Promise.all([
          unifiedPaiementsService.getByChantier(chantierActuel.id),
          unifiedEntreprisesService.getByChantier(chantierActuel.id)
        ]);
        if (!isMounted) return;

        const entrepriseMap = new Map(entreprisesData.map(ent => [ent.id!, ent.nom]));
        const enAttente = paiementsData
          .filter(p => p.statut !== 'regle')
          .sort((a, b) => a.datePrevue.getTime() - b.datePrevue.getTime())
          .map(p => ({
            ...p,
            entrepriseNom: entrepriseMap.get(p.entrepriseId) ?? 'Entreprise inconnue'
          }));

        setPendingPaiements(enAttente);
      } catch (error) {
        console.error('Erreur chargement paiements en attente:', error);
        if (isMounted) setPendingPaiements([]);
      } finally {
        if (isMounted) setLoadingDecisions(false);
      }
    };

    fetchPendingPaiements();
    return () => {
      isMounted = false;
    };
  }, [chantierActuel?.id]);

  const loadMessagesForChantier = async (
    chantierId: string,
    options: LoadMessagesOptions = {}
  ) => {
    const { markAsRead = false } = options;
    try {
      console.log(`🔍 Chargement messages Firebase V2 pour ${chantierId}`);

      const messagesData = await unifiedMessagesService.getByChantier(chantierId);
      setMessages(messagesData);

      console.log(`✅ ${messagesData.length} messages chargés depuis Firebase V2`);

      if (markAsRead) {
        // Marquer comme lus seulement si demandé explicitement
        await markMessagesAsRead(chantierId);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    }
  };

  const markMessagesAsRead = async (chantierId: string) => {
    try {
      const messagesData = await unifiedMessagesService.getByChantier(chantierId);
      const currentUserType = isClientInterface ? 'client' : 'professional';
      const unreadMessages = messagesData.filter(msg =>
        !msg.isRead && msg.sender !== currentUserType
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id!).filter(id => id);
        await unifiedMessagesService.markAsRead(chantierId, messageIds);
        console.log(`✅ ${messageIds.length} messages marqués comme lus`);

        // Recharger pour mettre à jour l'affichage
        const updatedMessages = await unifiedMessagesService.getByChantier(chantierId);
        setMessages(updatedMessages);

        // Notifier pour mettre à jour le badge
        window.dispatchEvent(new Event('messages-updated'));
      }
    } catch (error) {
      console.error('Erreur marquage messages comme lus:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chantierActuel) return;

    try {
      const messageData = {
        sender: isClientInterface ? 'client' as const : 'professional' as const,
        senderName: isClientInterface ? (chantierActuel?.clientNom || 'Client') : 'Administrateur',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text' as const,
        isRead: false
      };

      await unifiedMessagesService.create(chantierActuel.id!, messageData);
      console.log('✅ Message envoyé en Firebase V2');

      setNewMessage('');

      // Recharger les messages (sans marquer comme lu, c'est notre propre message)
      await loadMessagesForChantier(chantierActuel.id!, { markAsRead: false });
      await loadMessagesForChantier(chantierActuel.id!, { markAsRead: false });

      // Notifier les autres composants pour mettre à jour le badge
      window.dispatchEvent(new Event('messages-updated'));
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getPaiementStatusBadge = (statut: Paiement['statut']) => {
    switch (statut) {
      case 'en-retard':
        return { label: 'En retard', className: 'bg-red-500/20 text-red-300 border border-red-500/30' };
      case 'prevu':
        return { label: 'En attente', className: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' };
      case 'regle':
      default:
        return { label: 'Réglé', className: 'bg-green-500/20 text-green-200 border border-green-500/30' };
    }
  };

  const getPaiementTypeLabel = (type: Paiement['type']) => {
    switch (type) {
      case 'acompte':
        return 'Acompte';
      case 'situation':
        return 'Situation';
      case 'solde':
      default:
        return 'Solde';
    }
  };

  const handlePurgeMessages = async () => {
    if (!chantierActuel) return;
    setShowPurgeConfirm(false);

    try {
      console.log(`🗑️ Purge de tous les messages du chantier ${chantierActuel.id}`);

      const messagesSnapshot = await getDocs(collection(db, `chantiers/${chantierActuel.id}/messages`));
      console.log(`📦 ${messagesSnapshot.size} messages à supprimer`);

      let count = 0;
      for (const messageDoc of messagesSnapshot.docs) {
        await deleteDoc(doc(db, `chantiers/${chantierActuel.id}/messages`, messageDoc.id));
        count++;
      }

      console.log(`✅ ${count} messages supprimés`);

      // Recharger les messages (vide)
      await loadMessagesForChantier(chantierActuel.id!, { markAsRead: false });

      // Notifier
      window.dispatchEvent(new Event('messages-updated'));

    } catch (error) {
      console.error('❌ Erreur purge messages:', error);
    }
  };

  if (!chantierActuel) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun chantier sélectionné</h3>
        <p className="text-gray-500">
          Sélectionnez un chantier pour communiquer avec le client
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Dialogue Client</span>
          </h3>
          <p className="text-sm text-gray-400">
            Communication avec {chantierActuel.clientNom} - {chantierActuel.nom}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center space-x-2 transition-colors"
              title="Purger tous les messages"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Purger</span>
            </button>
          )}
        </div>
      </div>

      {/* En-tête conversation */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-100">{chantierActuel.nom}</h4>
            <p className="text-sm text-gray-400">{chantierActuel.clientNom}</p>
            <p className="text-xs text-gray-500">{chantierActuel.adresse}</p>
          </div>
          <div className="text-right">
            <div className="px-2 py-1 rounded-full text-xs bg-green-600/20 text-green-400">
              {chantierActuel.statut === 'en-cours' ? 'En cours' :
                chantierActuel.statut === 'planifie' ? 'Planifié' :
                  chantierActuel.statut === 'termine' ? 'Terminé' : 'Suspendu'}
            </div>
            {budgetActuel !== null && (
              <p className="text-xs text-gray-400 mt-1">
                Budget: {budgetActuel.toLocaleString()} €
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historique des décisions / paiements en attente */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-gray-100 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-primary-300" />
              <span>Historique des décisions</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              {loadingDecisions
                ? 'Chargement des paiements en attente...'
                : pendingPaiements.length > 0
                  ? `${pendingPaiements.length} paiement(s) en attente côté client`
                  : 'Aucune demande de paiement en attente'}
            </p>
          </div>
          <button
            onClick={() => setShowDecisionHistory(prev => !prev)}
            className="text-xs text-primary-300 hover:text-primary-200 transition-colors flex items-center space-x-1"
          >
            <span>{showDecisionHistory ? 'Masquer' : 'Afficher'}</span>
            {showDecisionHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {showDecisionHistory && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {pendingPaiements.length === 0 && !loadingDecisions && (
              <div className="text-sm text-gray-400 bg-gray-800/50 border border-gray-600/50 rounded-lg p-3">
                Aucun paiement en attente pour ce chantier.
              </div>
            )}
            {pendingPaiements.map((paiement) => {
              const badge = getPaiementStatusBadge(paiement.statut);
              return (
                <div
                  key={paiement.id}
                  className="bg-gray-800/60 border border-gray-600/60 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{paiement.entrepriseNom}</p>
                      <p className="text-xs text-gray-400">
                        {getPaiementTypeLabel(paiement.type)} • Échéance {formatShortDate(paiement.datePrevue)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Prévu le {paiement.datePrevue.toLocaleDateString('fr-FR')}</span>
                    </div>
                    <span className="font-semibold">{paiement.montant.toLocaleString()} €</span>
                  </div>
                  {paiement.notes && (
                    <p className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                      {paiement.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone des messages */}
      <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Aucune conversation
            </h3>
            <p className="text-gray-500 mb-4">
              Commencez la conversation avec {chantierActuel.clientNom} sur ce chantier
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender === 'professional';

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-3 rounded-2xl ${isOwnMessage
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-600 text-gray-100'
                  }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-3 h-3" />
                    <span className="text-xs font-medium">{message.senderName}</span>
                    <span className="text-xs opacity-75">
                      {isToday(message.timestamp)
                        ? formatTime(message.timestamp)
                        : message.timestamp.toLocaleDateString('fr-FR')
                      }
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.type === 'decision' && (
                    <div className="mt-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Demande de validation
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Zone de saisie */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message pour ${chantierActuel.clientNom}...`}
              rows={1}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-gray-100 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Informations utiles */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-400 mb-2">💬 Types d'échanges :</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <p>• <strong>Avancement</strong> : Photos de progression, étapes terminées</p>
          <p>• <strong>Validations</strong> : Devis, matériaux, choix techniques</p>
          <p>• <strong>Planning</strong> : Dates d'intervention, modifications</p>
          <p>• <strong>Paiements</strong> : Échéances, factures, acomptes</p>
        </div>
      </div>

      {/* Modal de confirmation de purge */}
      <ConfirmModal
        isOpen={showPurgeConfirm}
        onConfirm={handlePurgeMessages}
        onCancel={() => setShowPurgeConfirm(false)}
        title="Purger tous les messages"
        message={`Voulez-vous vraiment supprimer TOUS les messages de cette conversation ?\n\nCette action est irréversible et supprimera ${messages.length} message(s).`}
        confirmText="Purger"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
