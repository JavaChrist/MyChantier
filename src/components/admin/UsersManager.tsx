import { useState, useEffect } from 'react';
import { Users, Edit2, Save, X, AlertCircle, Trash2 } from 'lucide-react';
import { authService, type UserProfile } from '../../firebase/auth';
import { chantierService } from '../../firebase/chantiers';

export function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ chantierId?: string; role: 'client' | 'professional' }>({ role: 'client' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, chantiersData] = await Promise.all([
        authService.getAllUsers(),
        chantierService.getAllChantiers()
      ]);
      
      // NE PAS ajouter de "chantier-principal" fictif
      // Seuls les vrais chantiers de Firebase sont utilisables
      
      setUsers(usersData);
      setChantiers(chantiersData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user.uid);
    setEditForm({
      chantierId: user.chantierId,
      role: user.role || 'client'
    });
  };

  const handleSaveUser = async (uid: string) => {
    try {
      await authService.updateUserProfile(uid, editForm);
      setEditingUser(null);
      await loadData(); // Recharger les données
      alert('Utilisateur mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ role: 'client' });
  };

  const handleDeleteUser = async (user: UserProfile) => {
    // Permettre la suppression de tous les utilisateurs clients
    if (user.role === 'client') {
      const confirmMessage = user.email 
        ? `Supprimer l'utilisateur "${user.displayName}" (${user.email}) ?\n\n⚠️ ATTENTION : Cette action est irréversible !\n\nCela supprimera le compte de Firestore mais PAS de Firebase Authentication.\nLe client pourra potentiellement se reconnecter.`
        : `Supprimer l'utilisateur corrompu "${user.displayName}" (UID: ${user.uid}) ?\n\nCette action est irréversible.`;
      
      if (confirm(confirmMessage)) {
        try {
          const { deleteDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../../firebase/config');
          await deleteDoc(doc(db, 'users', user.uid));
          console.log('✅ Utilisateur supprimé de Firestore:', user.uid);
          await loadData();
          alert('✅ Utilisateur supprimé avec succès de Firestore !');
        } catch (error) {
          console.error('Erreur suppression utilisateur:', error);
          alert('❌ Erreur lors de la suppression');
        }
      }
    } else {
      alert('❌ Impossible de supprimer un professionnel depuis cette interface.\n\nUtilisez la console Firebase si nécessaire.');
    }
  };

  const handleCleanupEverything = async () => {
    const confirmMsg = `⚠️ NETTOYAGE COMPLET ⚠️

Cela va SUPPRIMER :
- ❌ Tous les chantiers SAUF "Rénovation ancien chemin du halage" (Grohens Pitet)
- ❌ Tous les utilisateurs clients SAUF "Grohens Pitet"

Cela va GARDER :
- ✅ Le chantier "Rénovation ancien chemin du halage" et toutes ses données
- ✅ Le client Grohens Pitet (coralie.grohens@gmail.com)
- ✅ Votre compte professionnel

Voulez-vous continuer ?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    if (!confirm('ÊTES-VOUS VRAIMENT SÛR ?\n\nCette action est IRRÉVERSIBLE !')) {
      return;
    }

    try {
      console.log('🗑️🗑️🗑️ DÉBUT DU NETTOYAGE COMPLET');
      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      let deletedChantiers = 0;
      let deletedUsers = 0;

      // 1. Supprimer tous les chantiers sauf Grohens-Pitet
      console.log('\n📋 Suppression des chantiers de test...');
      for (const chantier of chantiers) {
        if (chantier.id !== 'chantier-grohens-pitet') {
          console.log(`🗑️ Suppression chantier: ${chantier.nom} (${chantier.id})`);
          
          // Supprimer les sous-collections
          const subCollections = ['info', 'entreprises', 'devis', 'commandes', 'paiements', 'documents', 'planning', 'etapes', 'messages'];
          for (const subCol of subCollections) {
            const snapshot = await getDocs(collection(db, `chantiers/${chantier.id}/${subCol}`));
            for (const docSnapshot of snapshot.docs) {
              await deleteDoc(doc(db, `chantiers/${chantier.id}/${subCol}`, docSnapshot.id));
            }
          }
          
          // Supprimer le document parent
          await deleteDoc(doc(db, 'chantiers', chantier.id));
          deletedChantiers++;
          console.log(`✅ Chantier ${chantier.nom} supprimé`);
        } else {
          console.log(`✅ Chantier ${chantier.nom} CONSERVÉ (données réelles)`);
        }
      }

      // 2. Supprimer tous les clients sauf Grohens Pitet
      console.log('\n📋 Suppression des utilisateurs de test...');
      for (const user of users) {
        if (user.role === 'client' && user.email !== 'coralie.grohens@gmail.com') {
          console.log(`🗑️ Suppression utilisateur: ${user.displayName} (${user.email})`);
          await deleteDoc(doc(db, 'users', user.uid));
          deletedUsers++;
          console.log(`✅ Utilisateur ${user.displayName} supprimé`);
        } else if (user.role === 'client') {
          console.log(`✅ Utilisateur ${user.displayName} (${user.email}) CONSERVÉ (client réel)`);
        }
      }

      // 3. Nettoyer localStorage
      console.log('\n📋 Nettoyage localStorage...');
      localStorage.removeItem('chantiers');
      localStorage.removeItem('clients-en-attente');
      console.log('✅ localStorage nettoyé');

      console.log('\n✅✅✅ NETTOYAGE TERMINÉ !');
      console.log(`📊 Résumé :`);
      console.log(`   - ${deletedChantiers} chantier(s) supprimé(s)`);
      console.log(`   - ${deletedUsers} utilisateur(s) supprimé(s)`);

      await loadData();
      
      alert(`✅ Nettoyage terminé avec succès !

${deletedChantiers} chantier(s) supprimé(s)
${deletedUsers} utilisateur(s) supprimé(s)

Données conservées :
- ✅ Chantier Grohens-Pitet
- ✅ Client Grohens Pitet (coralie.grohens@gmail.com)

Vous pouvez maintenant créer de nouveaux chantiers de test.`);

    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      alert('❌ Erreur lors du nettoyage');
    }
  };

  const handleFixAllCorruptedUsers = async () => {
    console.log('🔍 DIAGNOSTIC DES UTILISATEURS');
    console.log('='.repeat(50));
    
    const problematicUsers = users.filter(u => 
      !u.email || u.email === '' || (u.role === 'client' && (!u.chantierId || u.chantierId === 'chantier-principal'))
    );
    
    console.log(`📋 ${problematicUsers.length} utilisateur(s) avec des problèmes détectés :`);
    
    problematicUsers.forEach(user => {
      console.log(`\n👤 ${user.displayName}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email: ${user.email || '❌ MANQUANT'}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Chantier: ${user.chantierId || '❌ MANQUANT'}`);
      
      if (!user.email) console.log('   ⚠️ Email manquant');
      if (user.role === 'client' && !user.chantierId) console.log('   ⚠️ Aucun chantier assigné');
      if (user.chantierId === 'chantier-principal') console.log('   ⚠️ Assigné à "chantier-principal" qui n\'existe pas');
    });
    
    console.log('='.repeat(50));
    
    if (problematicUsers.length === 0) {
      alert('✅ Aucun problème détecté ! Tous les utilisateurs sont correctement configurés.');
      return;
    }
    
    const message = `${problematicUsers.length} utilisateur(s) avec des problèmes détectés.\n\nVoir la console pour les détails.\n\nVoulez-vous les corriger ?`;
    
    if (!confirm(message)) {
      return;
    }

    try {
      let fixed = 0;
      
      for (const user of problematicUsers) {
        console.log(`\n🔧 Correction de ${user.displayName} (${user.uid})...`);
        
        const updates: any = {};
        
        // Corriger l'email si vide - demander à l'utilisateur
        if (!user.email || user.email === '') {
          const email = prompt(`Email pour "${user.displayName}" (UID: ${user.uid.substring(0, 12)}...) :\n\nLaissez vide pour supprimer cet utilisateur.`);
          
          if (!email || email.trim() === '') {
            // Supprimer l'utilisateur corrompu
            console.log('🗑️ Suppression de l\'utilisateur sans email...');
            const { deleteDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../../firebase/config');
            await deleteDoc(doc(db, 'users', user.uid));
            console.log('✅ Utilisateur supprimé');
            fixed++;
            continue;
          }
          
          updates.email = email.trim();
        }
        
        // Corriger le chantierId pour les clients
        if (user.role === 'client' && (!user.chantierId || user.chantierId === 'chantier-principal')) {
          // Proposer les chantiers disponibles
          const chantiersList = chantiers.map((c, i) => `${i + 1}. ${c.nom} (${c.id})`).join('\n');
          const choice = prompt(`Quel chantier assigner à "${user.email || updates.email || user.displayName}" ?\n\n${chantiersList}\n\nEntrez le numéro du chantier :`);
          
          if (choice && parseInt(choice) > 0 && parseInt(choice) <= chantiers.length) {
            updates.chantierId = chantiers[parseInt(choice) - 1].id;
            console.log(`✅ Chantier assigné: ${updates.chantierId}`);
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await authService.updateUserProfile(user.uid, updates);
          fixed++;
          console.log('✅ Utilisateur corrigé:', updates);
        }
      }
      
      await loadData();
      alert(`✅ ${fixed} utilisateur(s) corrigé(s) avec succès !\n\nLe client doit se déconnecter et se reconnecter pour voir les changements.`);
    } catch (error) {
      console.error('Erreur correction utilisateurs:', error);
      alert('Erreur lors de la correction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  const clientUsers = users.filter(u => u.role === 'client');
  const professionalUsers = users.filter(u => u.role === 'professional');
  
  // Détecter les utilisateurs mal configurés (professionnels qui devraient être clients)
  const misconfiguredUsers = professionalUsers.filter(u => 
    u.email !== 'contact@javachrist.fr' && 
    !u.email?.includes('admin') && 
    !u.email?.includes('pro')
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Gestion des utilisateurs</h1>
            <p className="text-gray-400">Gérez les accès clients aux chantiers</p>
          </div>
        </div>
      </div>

      {/* Message d'information */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Assignation des clients aux chantiers</p>
              <p className="text-blue-400">
                Pour qu'un client puisse voir les données d'un chantier, vous devez lui assigner un chantier spécifique.
                Les clients ne peuvent voir que les données du chantier qui leur est assigné.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outil de correction rapide */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-300">
              <p className="font-medium mb-1">🔧 Outil de correction rapide</p>
              <p className="text-orange-400">
                Problème : Le client ne voit pas les données ? Utilisez cet outil pour vérifier et corriger l'assignation du chantier.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleFixAllCorruptedUsers}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              Diagnostiquer
            </button>
            <button
              onClick={handleCleanupEverything}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              🗑️ Nettoyage complet
            </button>
          </div>
        </div>
      </div>

      {/* Alerte utilisateurs mal configurés */}
      {misconfiguredUsers.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-300 mb-2">⚠️ {misconfiguredUsers.length} utilisateur(s) mal configuré(s) détecté(s) !</p>
              <p className="text-sm text-red-400 mb-3">
                Ces utilisateurs ont le rôle "Professionnel" mais ne devraient probablement pas l'avoir.
                Utilisez le bouton "Modifier" ci-dessous pour changer leur rôle en "Client" et leur assigner un chantier.
              </p>
              <div className="space-y-2">
                {misconfiguredUsers.map(user => (
                  <div key={user.uid} className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                    {editingUser === user.uid ? (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-gray-100 mb-2">{user.displayName}</p>
                          <p className="text-sm text-gray-400 mb-3">{user.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Nouveau rôle</label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'client' | 'professional' })}
                              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="client">Client</option>
                              <option value="professional">Professionnel</option>
                            </select>
                          </div>
                          {editForm.role === 'client' && (
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Chantier assigné</label>
                              <select
                                value={editForm.chantierId || ''}
                                onChange={(e) => setEditForm({ ...editForm, chantierId: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="">-- Sélectionner un chantier --</option>
                                {chantiers.map(chantier => (
                                  <option key={chantier.id} value={chantier.id}>
                                    {chantier.nom}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => handleSaveUser(user.uid)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Sauvegarder</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Annuler</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-100">{user.displayName}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <p className="text-xs text-red-400 mt-1">Rôle actuel : Professionnel ❌ → Devrait être Client</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingUser(user.uid);
                            setEditForm({ role: 'client', chantierId: undefined });
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Corriger
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professionnels */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-750 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            Professionnels valides ({professionalUsers.filter(u => u.email === 'contact@javachrist.fr' || u.email?.includes('admin') || u.email?.includes('pro')).length})
          </h2>
        </div>
        <div className="p-6">
          {professionalUsers.filter(u => u.email === 'contact@javachrist.fr' || u.email?.includes('admin') || u.email?.includes('pro')).length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aucun professionnel</p>
          ) : (
            <div className="space-y-2">
              {professionalUsers.filter(u => u.email === 'contact@javachrist.fr' || u.email?.includes('admin') || u.email?.includes('pro')).map(user => (
                <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-100">{user.displayName}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                    Professionnel
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clients */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-750 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            Clients ({clientUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Chantier assigné
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {clientUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aucun client enregistré
                  </td>
                </tr>
              ) : (
                clientUsers.map(user => {
                  const isCorrupted = !user.email || user.email === '';
                  return (
                    <tr key={user.uid} className={`hover:bg-gray-750/50 ${isCorrupted ? 'bg-red-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-100">{user.displayName}</p>
                        {isCorrupted && (
                          <p className="text-xs text-red-400 mt-1">⚠️ Données corrompues</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.email ? (
                          <p className="text-sm text-gray-400">{user.email}</p>
                        ) : (
                          <div>
                            <p className="text-sm text-red-400">Aucun email</p>
                            <p className="text-xs text-gray-500 mt-1">UID: {user.uid.substring(0, 12)}...</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'client' | 'professional' })}
                            className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="client">Client</option>
                            <option value="professional">Professionnel</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 ${user.role === 'client' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'} text-sm rounded-full`}>
                            {user.role === 'client' ? 'Client' : 'Professionnel'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <select
                            value={editForm.chantierId || ''}
                            onChange={(e) => setEditForm({ ...editForm, chantierId: e.target.value })}
                            className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">-- Aucun chantier --</option>
                            {chantiers.map(chantier => (
                              <option key={chantier.id} value={chantier.id}>
                                {chantier.nom} ({chantier.id})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            {user.chantierId ? (
                              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">
                                {chantiers.find(c => c.id === user.chantierId)?.nom || user.chantierId}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">
                                Aucun chantier
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.uid ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSaveUser(user.uid)}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className={`p-2 ${isCorrupted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-lg transition-colors`}
                              title={isCorrupted ? "Supprimer cet utilisateur corrompu" : "Supprimer cet utilisateur"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

