import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, FileText, CheckCircle, X, Clock, AlertCircle } from 'lucide-react';
import { chatService, conversationService, uploadChatFile } from '../../firebase/chat';
import type { ChatMessage, Conversation, DecisionData } from '../../firebase/chat';
import { Modal } from '../Modal';
import { useAlertModal } from '../AlertModal';

interface ClientChatProps {
  conversation: Conversation;
  currentUserId: string;
  currentUserName: string;
  currentUserType: 'client' | 'professional';
}

export function ClientChat({ conversation, currentUserId, currentUserName, currentUserType }: ClientChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showAlert, AlertModalComponent } = useAlertModal();

  useEffect(() => {
    if (!conversation.id) return;

    // S'abonner aux messages en temps réel
    const unsubscribe = chatService.subscribeToMessages(conversation.id, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversation.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!conversation.id) return;

    try {
      setLoading(true);
      console.log('Envoi du message:', newMessage);

      let attachments = [];

      // Upload du fichier si présent
      if (selectedFile) {
        try {
          const messageId = crypto.randomUUID();
          const attachment = await uploadChatFile(conversation.id, messageId, selectedFile);
          attachments.push(attachment);
          console.log('Fichier uploadé:', attachment);
        } catch (uploadError) {
          console.error('Erreur upload fichier:', uploadError);
          // Continuer sans le fichier
        }
      }

      // Envoyer le message
      const messageData = {
        senderId: currentUserId,
        senderName: currentUserName,
        senderType: currentUserType,
        content: newMessage.trim() || `Fichier partagé: ${selectedFile?.name}`,
        type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
        isRead: false
      };

      console.log('Données du message:', messageData);
      await chatService.sendMessage(conversation.id, messageData);
      console.log('Message envoyé avec succès');

      // Reset du formulaire
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      showAlert('Erreur', `Erreur lors de l'envoi: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert('Fichier trop volumineux', 'Fichier trop volumineux (max 10MB).', 'warning');
        return;
      }
      setSelectedFile(file);
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

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'decision':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'validation':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-400" />;
      case 'file':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête de la conversation */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{conversation.chantierName}</h3>
            <p className="text-sm text-gray-400">{conversation.chantierAddress}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500">
                Client: {conversation.clientName}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${conversation.status === 'active' ? 'bg-green-600/20 text-green-400' :
                conversation.status === 'completed' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-yellow-600/20 text-yellow-400'
                }`}>
                {conversation.status === 'active' ? 'Actif' :
                  conversation.status === 'completed' ? 'Terminé' : 'En pause'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowDecisionModal(true)}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Demander validation</span>
          </button>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Commencez la conversation
            </h3>
            <p className="text-gray-500 mb-6">
              Échangez avec votre client sur l'avancement des travaux, les validations et les choix de matériaux
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            const messageIcon = getMessageIcon(message.type);

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isOwnMessage
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                  {/* En-tête du message */}
                  <div className="flex items-center space-x-2 mb-2">
                    {messageIcon}
                    <span className={`text-xs font-medium ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                      {message.senderName}
                    </span>
                    <span className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                      {isToday(message.timestamp)
                        ? formatTime(message.timestamp)
                        : message.timestamp.toLocaleDateString('fr-FR')
                      }
                    </span>
                  </div>

                  {/* Contenu du message */}
                  <div className="space-y-2">
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Pièces jointes */}
                    {message.attachments && message.attachments.map((attachment) => (
                      <div key={attachment.id} className={`p-2 rounded-lg border ${isOwnMessage ? 'border-blue-400 bg-blue-500/20' : 'border-gray-300 bg-gray-50'
                        }`}>
                        <div className="flex items-center space-x-2">
                          {attachment.type === 'image' ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm hover:underline ${isOwnMessage ? 'text-blue-100' : 'text-blue-600'
                              }`}
                          >
                            {attachment.name}
                          </a>
                          <span className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                            ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Données de décision */}
                    {message.decisionData && (
                      <div className={`p-3 rounded-lg border ${isOwnMessage ? 'border-yellow-400 bg-yellow-500/20' : 'border-yellow-300 bg-yellow-50'
                        }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className={`text-sm font-medium ${isOwnMessage ? 'text-yellow-100' : 'text-yellow-800'
                            }`}>
                            {message.decisionData.title}
                          </span>
                        </div>
                        <p className={`text-sm ${isOwnMessage ? 'text-yellow-100' : 'text-yellow-700'
                          }`}>
                          {message.decisionData.description}
                        </p>
                        {message.decisionData.options && (
                          <div className="mt-2 space-y-1">
                            {message.decisionData.options.map((option, index) => (
                              <div key={index} className={`text-sm ${isOwnMessage ? 'text-yellow-100' : 'text-yellow-700'
                                }`}>
                                • {option}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`mt-2 text-xs ${isOwnMessage ? 'text-yellow-200' : 'text-yellow-600'
                          }`}>
                          Statut: {message.decisionData.status === 'pending' ? 'En attente' :
                            message.decisionData.status === 'approved' ? 'Approuvé' : 'Refusé'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Indicateur de lecture */}
                  {isOwnMessage && (
                    <div className="flex justify-end mt-1">
                      <div className={`text-xs ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`}>
                        {message.isRead ? 'Lu' : 'Envoyé'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        {/* Fichier sélectionné */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                <span className="text-xs text-blue-600">
                  ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Barre de saisie */}
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex space-x-2">
            {/* Bouton pièce jointe */}
            <label className="p-3 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Paperclip className="w-5 h-5" />
            </label>

            {/* Bouton envoyer */}
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || loading}
              className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour demander une décision */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Demander une validation"
        size="lg"
      >
        <DecisionForm
          conversationId={conversation.id!}
          senderId={currentUserId}
          senderName={currentUserName}
          senderType={currentUserType}
          onSend={() => setShowDecisionModal(false)}
        />
      </Modal>
      <AlertModalComponent />
    </div>
  );
}

// Composant pour créer une demande de décision
function DecisionForm({
  conversationId,
  senderId,
  senderName,
  senderType,
  onSend
}: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'professional';
  onSend: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'devis-validation' as const,
    title: '',
    description: '',
    options: ['']
  });

  const decisionTypes = [
    { value: 'devis-validation', label: 'Validation de devis' },
    { value: 'choix-materiau', label: 'Choix de matériaux' },
    { value: 'validation-commande', label: 'Validation de commande' },
    { value: 'autre', label: 'Autre décision' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const decisionData: DecisionData = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      options: formData.options.filter(opt => opt.trim() !== ''),
      status: 'pending'
    };

    try {
      await chatService.sendMessage(conversationId, {
        senderId,
        senderName,
        senderType,
        content: `Demande de validation: ${formData.title}`,
        type: 'decision',
        timestamp: new Date(),
        decisionData,
        isRead: false
      });

      onSend();
    } catch (error) {
      console.error('Erreur envoi décision:', error);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Type de décision
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          className="input-field w-full"
        >
          {decisionTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Titre
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="input-field w-full"
          placeholder="Ex: Validation devis plomberie"
        />
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
          placeholder="Détails de la décision à prendre..."
        />
      </div>

      {/* Options de choix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Options de choix
          </label>
          <button
            type="button"
            onClick={addOption}
            className="btn-secondary text-sm"
          >
            Ajouter option
          </button>
        </div>
        <div className="space-y-2">
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="input-field flex-1"
                placeholder={`Option ${index + 1}`}
              />
              {formData.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onSend}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Envoyer la demande
        </button>
      </div>
    </form>
  );
}
