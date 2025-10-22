import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Clock, CheckCircle, User, Building2 } from 'lucide-react';
import { conversationService } from '../../firebase/chat';
import type { Conversation } from '../../firebase/chat';
import { Modal } from '../Modal';
import { ClientChat } from './ClientChat';

interface ConversationManagerProps {
  currentUserId: string;
  currentUserName: string;
  currentUserType: 'client' | 'professional';
}

export function ConversationManager({ currentUserId, currentUserName, currentUserType }: ConversationManagerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationService.getAll();
      setConversations(data);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (conversationData: Omit<Conversation, 'id'>) => {
    try {
      await conversationService.create({
        ...conversationData,
        dateCreation: new Date(),
        lastMessageTime: new Date()
      });
      await loadConversations();
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      case 'paused':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'paused':
        return 'En pause';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Chargement des conversations...</div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="h-96 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedConversation(null)}
            className="btn-secondary text-sm"
          >
            ← Retour aux conversations
          </button>
        </div>
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <ClientChat
            conversation={selectedConversation}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserType={currentUserType}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Dialogue Client</h3>
          <p className="text-sm text-gray-400">
            Échangez avec vos clients sur l'avancement des chantiers
          </p>
        </div>
        <button
          onClick={() => setShowNewConversationModal(true)}
          className="btn-primary flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">Aucune conversation</h4>
          <p className="text-gray-500 mb-4">
            Commencez une conversation avec un client pour suivre l'avancement de son chantier
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="btn-primary"
            >
              Démarrer une conversation
            </button>
            <button
              onClick={() => handleCreateConversation({
                clientId: 'client-demo',
                clientName: 'M. Dupont',
                professionalId: currentUserId,
                professionalName: currentUserName,
                chantierName: 'Rénovation Salle de Bain',
                chantierAddress: '123 rue de la Paix, Paris',
                lastMessage: '',
                lastMessageTime: new Date(),
                unreadCount: 0,
                status: 'active',
                dateCreation: new Date()
              })}
              className="btn-secondary"
            >
              Conversation de test
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-650 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-600 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">{conversation.chantierName}</h4>
                    <p className="text-sm text-gray-400">{conversation.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                    {getStatusLabel(conversation.status)}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="mt-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>

              {conversation.lastMessage && (
                <div className="text-sm text-gray-300 truncate mb-2">
                  {conversation.lastMessage}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{conversation.chantierAddress}</span>
                <span>
                  {conversation.lastMessageTime.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nouvelle conversation */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        title="Nouvelle conversation client"
        size="lg"
      >
        <NewConversationForm
          onSave={handleCreateConversation}
          onCancel={() => setShowNewConversationModal(false)}
          professionalId={currentUserId}
          professionalName={currentUserName}
        />
      </Modal>
    </div>
  );
}

// Composant pour créer une nouvelle conversation
function NewConversationForm({
  onSave,
  onCancel,
  professionalId,
  professionalName
}: {
  onSave: (conversation: Omit<Conversation, 'id'>) => void;
  onCancel: () => void;
  professionalId: string;
  professionalName: string;
}) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    chantierName: '',
    chantierAddress: '',
    status: 'active' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      clientId: crypto.randomUUID(), // Générer un ID temporaire pour le client
      clientName: formData.clientName,
      professionalId,
      professionalName,
      chantierName: formData.chantierName,
      chantierAddress: formData.chantierAddress,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      status: formData.status,
      dateCreation: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom du client
          </label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: M. Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email du client
          </label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="input-field w-full"
            placeholder="client@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nom du chantier
        </label>
        <input
          type="text"
          value={formData.chantierName}
          onChange={(e) => setFormData(prev => ({ ...prev, chantierName: e.target.value }))}
          className="input-field w-full"
          placeholder="Ex: Rénovation Maison Dupont"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse du chantier
        </label>
        <input
          type="text"
          value={formData.chantierAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, chantierAddress: e.target.value }))}
          className="input-field w-full"
          placeholder="Ex: 123 rue de la Paix, 75001 Paris"
        />
      </div>

      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-400 mb-2">💬 Types d'échanges possibles :</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <p>• <strong>Validations</strong> : Devis, commandes, choix matériaux</p>
          <p>• <strong>Partage</strong> : Photos, échantillons, documents</p>
          <p>• <strong>Planning</strong> : Dates d'intervention, rendez-vous</p>
          <p>• <strong>Paiements</strong> : Échéanciers, factures</p>
        </div>
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
          Créer la conversation
        </button>
      </div>
    </form>
  );
}
