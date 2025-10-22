import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'professional';
  content: string;
  type: 'text' | 'image' | 'file' | 'decision' | 'validation';
  timestamp: Date;
  attachments?: ChatAttachment[];
  decisionData?: DecisionData;
  isRead: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document';
  size: number;
}

export interface DecisionData {
  type: 'devis-validation' | 'choix-materiau' | 'validation-commande' | 'autre';
  title: string;
  description: string;
  options?: string[];
  relatedId?: string; // ID du devis/commande concerné
  status: 'pending' | 'approved' | 'rejected';
}

export interface Conversation {
  id?: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  chantierName: string;
  chantierAddress: string;
  lastMessage?: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'completed' | 'paused';
  dateCreation: Date;
}

// Upload d'un fichier de chat
export const uploadChatFile = async (
  conversationId: string,
  messageId: string,
  file: File
): Promise<ChatAttachment> => {
  try {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux (max 10MB)');
    }

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;

    const filePath = `chat/${conversationId}/${messageId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      url: downloadURL,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      size: file.size
    };
  } catch (error) {
    console.error('Erreur upload fichier chat:', error);
    throw error;
  }
};

// Service pour les conversations
export const conversationService = {
  // Récupérer toutes les conversations
  async getAll(): Promise<Conversation[]> {
    const q = query(collection(db, 'conversations'), orderBy('lastMessageTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessageTime: doc.data().lastMessageTime.toDate(),
      dateCreation: doc.data().dateCreation.toDate()
    } as Conversation));
  },

  // Créer une nouvelle conversation
  async create(conversation: Omit<Conversation, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'conversations'), {
      ...conversation,
      lastMessageTime: Timestamp.fromDate(conversation.lastMessageTime),
      dateCreation: Timestamp.fromDate(conversation.dateCreation)
    });
    return docRef.id;
  },

  // Mettre à jour une conversation
  async update(id: string, conversation: Partial<Conversation>): Promise<void> {
    const docRef = doc(db, 'conversations', id);
    const updateData: any = { ...conversation };
    if (updateData.lastMessageTime) {
      updateData.lastMessageTime = Timestamp.fromDate(updateData.lastMessageTime);
    }
    if (updateData.dateCreation) {
      updateData.dateCreation = Timestamp.fromDate(updateData.dateCreation);
    }
    await updateDoc(docRef, updateData);
  }
};

// Service pour les messages
export const chatService = {
  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    } as ChatMessage));
  },

  // Écouter les nouveaux messages en temps réel
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      } as ChatMessage));

      callback(messages);
    });
  },

  // Envoyer un message
  async sendMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'conversationId'>): Promise<string> {
    const docRef = await addDoc(collection(db, `conversations/${conversationId}/messages`), {
      ...message,
      conversationId,
      timestamp: serverTimestamp()
    });

    // Mettre à jour la conversation avec le dernier message
    await conversationService.update(conversationId, {
      lastMessage: message.content,
      lastMessageTime: new Date()
    });

    return docRef.id;
  },

  // Marquer les messages comme lus
  async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    const batch = messageIds.map(messageId =>
      updateDoc(doc(db, `conversations/${conversationId}/messages`, messageId), {
        isRead: true
      })
    );

    await Promise.all(batch);
  }
};
