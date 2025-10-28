import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, User, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useChantier } from '../../contexts/ChantierContext';
import { unifiedMessagesService, type Message } from '../../firebase/unified-services';


export function ChantierChat() {
  const { chantierActuel } = useChantier();

  // Détecter le type d'utilisateur depuis l'URL ou le contexte
  const isClientInterface = window.location.pathname.includes('/client') ||
    document.querySelector('[data-client-interface]') !== null ||
    // Détecter si on est dans l'interface client par la structure DOM
    document.querySelector('.bg-gray-50') !== null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Charger les messages du chantier actuel
  useEffect(() => {
    if (chantierActuel) {
      loadMessagesForChantier(chantierActuel.id!);
    }
  }, [chantierActuel]);

  const loadMessagesForChantier = async (chantierId: string) => {
    try {
      console.log(`🔍 Chargement messages Firebase V2 pour ${chantierId}`);

      const messagesData = await unifiedMessagesService.getByChantier(chantierId);
      setMessages(messagesData);

      console.log(`✅ ${messagesData.length} messages chargés depuis Firebase V2`);

      // Si aucun message, créer les messages de bienvenue
      if (messagesData.length === 0) {
        console.log('🔄 Création des messages de bienvenue...');
        await createWelcomeMessages(chantierId);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    }
  };

  const createWelcomeMessages = async (chantierId: string) => {
    const welcomeMessages = [
      {
        sender: 'professional' as const,
        senderName: 'Administrateur',
        content: `Bonjour ! Bienvenue sur votre espace de suivi de chantier. Je serai votre interlocuteur pour ce projet.`,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'text' as const,
        isRead: true
      },
      {
        sender: 'professional' as const,
        senderName: 'Administrateur',
        content: `N'hésitez pas à me poser vos questions via cette messagerie. Je vous tiendrai informé de l'avancement des travaux.`,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'text' as const,
        isRead: true
      }
    ];

    for (const message of welcomeMessages) {
      await unifiedMessagesService.create(chantierId, message);
    }

    // Recharger après création
    await loadMessagesForChantier(chantierId);
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

      // Recharger les messages
      await loadMessagesForChantier(chantierActuel.id!);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };


  const handleDemanderValidation = async (type: string, description: string) => {
    if (!chantierActuel) return;

    try {
      const validationMessage = {
        sender: 'professional' as const,
        senderName: 'Administrateur',
        content: `Demande de validation: ${description}`,
        timestamp: new Date(),
        type: 'validation' as const,
        isRead: false
      };

      await unifiedMessagesService.create(chantierActuel.id!, validationMessage);
      console.log('✅ Demande de validation envoyée en Firebase V2');

      await loadMessagesForChantier(chantierActuel.id!);
      setShowValidationModal(false);
    } catch (error) {
      console.error('Erreur envoi validation:', error);
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
        <button
          onClick={() => setShowValidationModal(true)}
          className="btn-primary text-sm flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Demander validation</span>
        </button>
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
            {chantierActuel.budget && (
              <p className="text-xs text-gray-400 mt-1">
                Budget: {chantierActuel.budget.toLocaleString()} €
              </p>
            )}
          </div>
        </div>
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
    </div>
  );
}
