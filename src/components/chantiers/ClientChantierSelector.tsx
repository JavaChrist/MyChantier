import { useEffect, useState } from 'react';
import { Calendar, MapPin, LogOut } from 'lucide-react';
import { AppIcon } from '../Icon';
import type { Chantier } from '../../firebase/chantiers';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ClientChantierSelectorProps {
  chantierIds: string[];
  clientName: string;
  onSelect: (chantier: Chantier) => void;
  onLogout?: () => void;
}

type FirestoreDate = { toDate?: () => Date } | Date | string | number | null | undefined;

const toDateSafe = (value: FirestoreDate, fallback: Date) => {
  if (!value) return fallback;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

const buildChantier = (chantierId: string, data: Record<string, any>): Chantier => {
  const now = new Date();
  return {
    id: chantierId,
    nom: data.nom || 'Chantier sans nom',
    description: data.description || '',
    clientNom: data.clientNom || '',
    clientEmail: data.clientEmail || '',
    clientEmail2: data.clientEmail2 || undefined,
    clientEmail3: data.clientEmail3 || undefined,
    clientTelephone: data.clientTelephone || '',
    adresse: data.adresse || '',
    dateDebut: toDateSafe(data.dateDebut, now),
    dateFinPrevue: toDateSafe(data.dateFinPrevue, now),
    dateFinReelle: data.dateFinReelle ? toDateSafe(data.dateFinReelle, now) : undefined,
    budget: data.budget || 0,
    statut: data.statut || 'planifie',
    professionalId: data.professionalId || '',
    notes: data.notes || '',
    dateCreation: toDateSafe(data.dateCreation, now),
    dateModification: toDateSafe(data.dateModification, now)
  };
};

export function ClientChantierSelector({
  chantierIds,
  clientName,
  onSelect,
  onLogout
}: ClientChantierSelectorProps) {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChantiers = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          chantierIds.map(async (chantierId) => {
            try {
              const parentSnap = await getDoc(doc(db, 'chantiers', chantierId));
              const parentData = parentSnap.exists() ? parentSnap.data() : null;

              let infoData: Record<string, any> | null = null;
              if (!parentData?.nom) {
                const infoSnapshot = await getDocs(collection(db, `chantiers/${chantierId}/info`));
                infoData = infoSnapshot.docs.length > 0 ? infoSnapshot.docs[0].data() : null;
              }

              const data = {
                ...(infoData ?? {}),
                ...(parentData ?? {}),
                clientEmail2: parentData?.clientEmail2 ?? infoData?.clientEmail2,
                clientEmail3: parentData?.clientEmail3 ?? infoData?.clientEmail3
              };

              if (!data.nom && !infoData && !parentData) {
                return null;
              }

              return buildChantier(chantierId, data);
            } catch (error) {
              console.warn(`Erreur chargement chantier ${chantierId}:`, error);
              return null;
            }
          })
        );

        const cleaned = results.filter((chantier): chantier is Chantier => !!chantier);
        cleaned.sort((a, b) => b.dateModification.getTime() - a.dateModification.getTime());
        setChantiers(cleaned);
      } catch (error) {
        console.error('Erreur chargement chantiers client:', error);
        setChantiers([]);
      } finally {
        setLoading(false);
      }
    };

    loadChantiers();
  }, [chantierIds]);

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
    <div className="min-h-screen bg-gray-50 px-4 pb-4 pt-16 md:pt-8" style={{ paddingTop: 'max(4rem, calc(env(safe-area-inset-top) + 2rem))' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 relative">
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
            Bonjour {clientName || 'Client'} !
          </h1>
          <p className="text-gray-600">
            Sélectionnez le chantier que vous souhaitez consulter
          </p>
        </div>

        {chantiers.length === 0 ? (
          <div className="text-center py-12">
            <AppIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun chantier</h3>
            <p className="text-gray-500">
              Contactez votre professionnel pour activer vos accès.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chantiers.map((chantier) => (
              <div
                key={chantier.id}
                onClick={() => onSelect(chantier)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                    <AppIcon size={32} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {chantier.statut === 'en-cours'
                      ? 'En cours'
                      : chantier.statut === 'termine'
                        ? 'Terminé'
                        : chantier.statut === 'suspendu'
                          ? 'Suspendu'
                          : 'Planifié'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                      {chantier.nom}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {chantier.description || 'Aucune description'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{chantier.adresse || 'Adresse non renseignée'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {chantier.dateDebut.toLocaleDateString('fr-FR')} → {chantier.dateFinPrevue.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {chantier.budget ? (
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Budget :</span>
                      <span className="font-semibold text-gray-800">
                        {chantier.budget.toLocaleString()} €
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
