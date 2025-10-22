import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, User, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useChantier } from '../../contexts/ChantierContext';

interface Message {
  id: string;
  sender: 'professional' | 'client';
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'decision' | 'validation';
  isRead: boolean;
}

export function ChantierChat() {
  const { chantierActuel } = useChantier();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Charger les messages du chantier actuel
  useEffect(() => {
    if (chantierActuel) {
      loadMessagesForChantier(chantierActuel.id!);
    }
  }, [chantierActuel]);

  const loadMessagesForChantier = (chantierId: string) => {
    try {
      // Charger les messages sauvegardés pour ce chantier
      const savedMessages = localStorage.getItem(`messages-${chantierId}`);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Reconstituer les dates
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } else if (chantierId === 'chantier-principal') {
        // Messages de démonstration pour le chantier principal seulement
        const demoMessages = [
          {
            id: '1',
            sender: 'client' as const,
            senderName: chantierActuel?.clientNom || 'Client',
            content: 'Bonjour, j\'aimerais avoir des nouvelles sur l\'avancement des travaux de rénovation.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            type: 'text' as const,
            isRead: true
          },
          {
            id: '2',
            sender: 'professional' as const,
            senderName: 'Christian',
            content: 'Bonjour ! Les travaux avancent très bien. Le plombier a terminé la pose des conduites hier, et l\'électricien commence demain.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            type: 'text' as const,
            isRead: true
          }
        ];
        setMessages(demoMessages);
        saveMessagesForChantier(chantierId, demoMessages);
      } else {
        // Nouveaux chantiers = pas de messages
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chantierActuel) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'professional',
      senderName: 'Christian',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text',
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Sauvegarder les messages du chantier dans localStorage
    saveMessagesForChantier(chantierActuel.id!, [...messages, message]);
  };

  const saveMessagesForChantier = (chantierId: string, messagesData: Message[]) => {
    localStorage.setItem(`messages-${chantierId}`, JSON.stringify(messagesData));
  };

  const handleDemanderValidation = (type: string, description: string) => {
    if (!chantierActuel) return;

    const validationMessage: Message = {
      id: Date.now().toString(),
      sender: 'professional',
      senderName: 'Christian',
      content: `Demande de validation: ${description}`,
      timestamp: new Date(),
      type: 'validation',
      isRead: false
    };

    const newMessages = [...messages, validationMessage];
    setMessages(newMessages);
    saveMessagesForChantier(chantierActuel.id!, newMessages);
    setShowValidationModal(false);
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
