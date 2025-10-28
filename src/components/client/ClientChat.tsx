import React, { useState, useEffect } from 'react';
import { unifiedMessagesService, type Message } from '../../firebase/unified-services';

// Composant de chat adapté pour les clients
export function ClientChat({ chantierId, userProfile }: { chantierId: string; userProfile: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadMessagesForChantier(chantierId);
  }, [chantierId]);

  const loadMessagesForChantier = async (chantierId: string) => {
    try {
      console.log(`🔍 Client: Chargement messages Firebase V2 pour ${chantierId}`);

      const messagesData = await unifiedMessagesService.getByChantier(chantierId);
      setMessages(messagesData);

      console.log(`✅ Client: ${messagesData.length} messages chargés depuis Firebase V2`);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        sender: 'client' as const,
        senderName: userProfile.displayName || 'Client',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text' as const,
        isRead: false
      };

      await unifiedMessagesService.create(chantierId, messageData);
      console.log('✅ Client: Message envoyé en Firebase V2');

      setNewMessage('');

      // Recharger les messages
      await loadMessagesForChantier(chantierId);
    } catch (error) {
      console.error('Erreur envoi message client:', error);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 border-b border-blue-300">
        <h3 className="text-lg font-semibold text-white">Messages avec votre professionnel</h3>
        <p className="text-sm text-blue-100">Communication pour votre chantier</p>
      </div>

      {/* Zone de messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun message pour le moment</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender === 'client';

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-3 rounded-2xl ${isOwnMessage
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium">{message.senderName}</span>
                    <span className="text-xs opacity-75">
                      {isToday(message.timestamp)
                        ? formatTime(message.timestamp)
                        : message.timestamp.toLocaleDateString('fr-FR')
                      }
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Zone de saisie */}
      <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Votre message..."
            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
