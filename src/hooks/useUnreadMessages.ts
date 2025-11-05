import { useState, useEffect } from 'react';
import { unifiedMessagesService, type Message } from '../firebase/unified-services';

export function useUnreadMessages(chantierId: string | null, currentUserType: 'professional' | 'client') {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chantierId) {
      setUnreadCount(0);
      return;
    }

    // Charger les messages et compter les non lus
    const loadUnreadCount = async () => {
      try {
        const messages = await unifiedMessagesService.getByChantier(chantierId);
        
        // Compter les messages non lus envoyés par l'autre partie
        const unread = messages.filter(msg => 
          !msg.isRead && msg.sender !== currentUserType
        ).length;
        
        setUnreadCount(unread);
      } catch (error) {
        console.error('Erreur comptage messages non lus:', error);
        setUnreadCount(0);
      }
    };

    // Charger au démarrage
    loadUnreadCount();

    // Recharger toutes les 10 secondes pour une mise à jour rapide
    const interval = setInterval(loadUnreadCount, 10000);
    
    // Écouter l'événement personnalisé de rechargement
    const handleMessagesUpdate = () => {
      loadUnreadCount();
    };
    
    window.addEventListener('messages-updated', handleMessagesUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-updated', handleMessagesUpdate);
    };
  }, [chantierId, currentUserType]);

  return unreadCount;
}

