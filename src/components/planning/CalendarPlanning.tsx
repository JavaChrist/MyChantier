import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Building2, Eye, Play, CheckCircle, Check } from 'lucide-react';
import { entreprisesService, commandesService } from '../../firebase/entreprises';
import { rendezVousService } from '../../firebase/calendar';
import type { Entreprise, Commande } from '../../firebase/entreprises';
import type { RendezVous } from '../../firebase/calendar';
import { Modal } from '../Modal';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

// Couleurs par secteur d'entreprise
const COULEURS_SECTEURS = {
  sanitaire: { bg: 'bg-blue-500', text: 'text-blue-100', border: 'border-blue-400' },
  electricite: { bg: 'bg-yellow-500', text: 'text-yellow-100', border: 'border-yellow-400' },
  carrelage: { bg: 'bg-green-500', text: 'text-green-100', border: 'border-green-400' },
  menuiserie: { bg: 'bg-orange-500', text: 'text-orange-100', border: 'border-orange-400' },
  peinture: { bg: 'bg-purple-500', text: 'text-purple-100', border: 'border-purple-400' }
};

export function CalendarPlanning() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RendezVous | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger entreprises
      const entreprisesData = await entreprisesService.getAll();
      setEntreprises(entreprisesData);

      // Charger toutes les commandes
      const toutesCommandes: Commande[] = [];
      for (const entreprise of entreprisesData) {
        if (entreprise.id) {
          const commandesEntreprise = await commandesService.getByEntreprise(entreprise.id);
          toutesCommandes.push(...commandesEntreprise);
        }
      }
      setCommandes(toutesCommandes);

      // Charger les rendez-vous
      const rendezVousData = await rendezVousService.getAll();
      setRendezVous(rendezVousData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setEntreprises([]);
      setCommandes([]);
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  const getEntrepriseCouleur = (entrepriseId: string) => {
    const entreprise = entreprises.find(e => e.id === entrepriseId);
    if (!entreprise) return COULEURS_SECTEURS.sanitaire;
    return COULEURS_SECTEURS[entreprise.secteurActivite] || COULEURS_SECTEURS.sanitaire;
  };

  const getEventsForDate = (date: Date) => {
    const events: Array<{
      id: string;
      type: 'commande-debut' | 'commande-fin' | 'rendez-vous';
      title: string;
      time?: string;
      entrepriseId: string;
      data: Commande | RendezVous;
    }> = [];

    const dateStr = date.toDateString();

    // Ajouter les débuts de commandes
    commandes.forEach(commande => {
      if (commande.dateDebutPrevue.toDateString() === dateStr) {
        events.push({
          id: `debut-${commande.id}`,
          type: 'commande-debut',
          title: `🚀 Début: ${commande.prestationNom}`,
          entrepriseId: commande.entrepriseId,
          data: commande
        });
      }

      if (commande.dateFinPrevue.toDateString() === dateStr) {
        events.push({
          id: `fin-${commande.id}`,
          type: 'commande-fin',
          title: `🏁 Fin: ${commande.prestationNom}`,
          entrepriseId: commande.entrepriseId,
          data: commande
        });
      }
    });

    // Ajouter les rendez-vous
    rendezVous.forEach(rdv => {
      if (rdv.dateHeure.toDateString() === dateStr) {
        const confirmationIcon = rdv.confirme ? '✓ ' : '⏳ ';
        events.push({
          id: `rdv-${rdv.id}`,
          type: 'rendez-vous',
          title: `${confirmationIcon}${rdv.titre}`,
          time: rdv.dateHeure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          entrepriseId: rdv.entrepriseId,
          data: rdv
        });
      }
    });

    return events.sort((a, b) => {
      // Trier par heure si disponible
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      // Sinon par type : rendez-vous, début, fin
      const typeOrder = { 'rendez-vous': 1, 'commande-debut': 2, 'commande-fin': 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: any) => {
    if (event.type === 'rendez-vous') {
      setSelectedEvent(event.data);
      setSelectedDate(null);
      setShowEventModal(true);
    }
  };

  const handleSaveEvent = async (eventData: Omit<RendezVous, 'id'>) => {
    try {
      const finalEventData = {
        ...eventData,
        dateCreation: eventData.dateCreation || new Date(),
        confirme: eventData.confirme || false
      };

      if (selectedEvent?.id) {
        await rendezVousService.update(selectedEvent.id, finalEventData);
      } else {
        await rendezVousService.create(finalEventData);
      }
      await loadData();
      setShowEventModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur de connexion, on ferme quand même la modale
      // Les données seront synchronisées quand la connexion reviendra
      if (error.message && error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        console.log('Sauvegarde en attente de connexion...');
        setShowEventModal(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="mobile-padding flex items-center justify-center min-h-64">
        <div className="text-gray-400">Chargement du calendrier...</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding space-y-4 md:space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mobile-header font-bold text-gray-100">Planning Calendrier</h1>
          <p className="text-gray-400 mobile-text">Calendrier des commandes et rendez-vous</p>
        </div>
        <button
          onClick={() => handleDateClick(new Date())}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau RDV</span>
          <span className="sm:hidden">RDV</span>
        </button>
      </div>

      {/* Contrôles de navigation */}
      <div className="card">
        {/* Ligne 1: Navigation avec chevrons */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <h2 className="text-lg md:text-xl font-semibold text-gray-100 text-center">
            {viewType === 'month' && currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            {viewType === 'week' && `Semaine du ${currentDate.toLocaleDateString('fr-FR')}`}
            {viewType === 'day' && currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {viewType === 'agenda' && 'Agenda des rendez-vous'}
          </h2>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Ligne 2: Boutons de vue */}
        <div className="flex justify-center">
          <div className="flex bg-gray-700 rounded-lg p-1 w-full max-w-md">
            {(['month', 'week', 'day', 'agenda'] as ViewType[]).map(view => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${viewType === view
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:text-gray-100'
                  }`}
              >
                {view === 'month' ? 'Mois' : view === 'week' ? 'Semaine' : view === 'day' ? 'Jour' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Légende des couleurs */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-100 mb-3">Légende par secteur :</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(COULEURS_SECTEURS).map(([secteur, couleur]) => (
            <div key={secteur} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${couleur.bg}`}></div>
              <span className="text-sm text-gray-300 capitalize">{secteur}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vue calendrier */}
      <div className="card">
        {viewType === 'month' && <MonthView currentDate={currentDate} getEventsForDate={getEventsForDate} getEntrepriseCouleur={getEntrepriseCouleur} onDateClick={handleDateClick} onEventClick={handleEventClick} />}
        {viewType === 'week' && <WeekView currentDate={currentDate} getEventsForDate={getEventsForDate} getEntrepriseCouleur={getEntrepriseCouleur} onDateClick={handleDateClick} onEventClick={handleEventClick} />}
        {viewType === 'day' && <DayView currentDate={currentDate} getEventsForDate={getEventsForDate} getEntrepriseCouleur={getEntrepriseCouleur} onDateClick={handleDateClick} onEventClick={handleEventClick} entreprises={entreprises} />}
        {viewType === 'agenda' && <AgendaView rendezVous={rendezVous} commandes={commandes} entreprises={entreprises} getEntrepriseCouleur={getEntrepriseCouleur} onEventClick={handleEventClick} onDateClick={handleDateClick} />}
      </div>

      {/* Modal pour créer/modifier un rendez-vous */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={selectedEvent ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        size="lg"
      >
        <RendezVousForm
          rendezVous={selectedEvent}
          entreprises={entreprises}
          selectedDate={selectedDate}
          onSave={handleSaveEvent}
          onCancel={() => setShowEventModal(false)}
        />
      </Modal>
    </div>
  );
}

// Composant vue mois
function MonthView({
  currentDate,
  getEventsForDate,
  getEntrepriseCouleur,
  onDateClick,
  onEventClick
}: any) {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOfWeek = new Date(startOfMonth);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi

  const days = [];
  const current = new Date(startOfWeek);

  // Générer 6 semaines (42 jours)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  return (
    <div className="space-y-4">
      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-400">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-2">{day}</div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const events = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`min-h-24 p-1 border border-gray-700 rounded cursor-pointer hover:bg-gray-750 transition-colors ${isTodayDate ? 'bg-primary-600/20 border-primary-500' : 'bg-gray-800'
                } ${!isCurrentMonthDay ? 'opacity-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-primary-400' : isCurrentMonthDay ? 'text-gray-100' : 'text-gray-500'
                }`}>
                {date.getDate()}
              </div>

              <div className="space-y-1">
                {events.slice(0, 3).map(event => {
                  const couleur = getEntrepriseCouleur(event.entrepriseId);
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`text-xs p-1 rounded truncate ${couleur.bg} ${couleur.text} hover:opacity-80 transition-opacity`}
                      title={event.title}
                    >
                      {event.time && <span className="font-medium">{event.time}</span>}
                      <div className="truncate">{event.title}</div>
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{events.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant vue semaine
function WeekView({
  currentDate,
  getEventsForDate,
  getEntrepriseCouleur,
  onDateClick,
  onEventClick
}: any) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(date => {
          const events = getEventsForDate(date);
          const isTodayDate = isToday(date);

          return (
            <div key={date.toDateString()} className="space-y-2">
              <div
                onClick={() => onDateClick(date)}
                className={`text-center p-3 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors ${isTodayDate ? 'bg-primary-600/20 border border-primary-500' : 'bg-gray-800'
                  }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isTodayDate ? 'text-primary-400' : 'text-gray-100'
                  }`}>
                  {date.getDate()}
                </div>
              </div>

              <div className="space-y-1 min-h-32">
                {events.map(event => {
                  const couleur = getEntrepriseCouleur(event.entrepriseId);
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`text-xs p-2 rounded cursor-pointer ${couleur.bg} ${couleur.text} hover:opacity-80 transition-opacity`}
                    >
                      {event.time && <div className="font-medium">{event.time}</div>}
                      <div className="truncate">{event.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant vue jour
function DayView({
  currentDate,
  getEventsForDate,
  getEntrepriseCouleur,
  onDateClick,
  onEventClick,
  entreprises
}: any) {
  const events = getEventsForDate(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div
        onClick={() => onDateClick(currentDate)}
        className="text-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
      >
        <div className="text-2xl font-bold text-gray-100">
          {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Horaires */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Horaires</h3>
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {hours.map(hour => {
              const hourEvents = events.filter(e => e.time?.startsWith(`${hour.toString().padStart(2, '0')}:`));
              return (
                <div key={hour} className="flex items-start space-x-3 py-2 border-b border-gray-700 last:border-b-0">
                  <div className="text-sm text-gray-400 w-12">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 space-y-1">
                    {hourEvents.map(event => {
                      const couleur = getEntrepriseCouleur(event.entrepriseId);
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`p-2 rounded cursor-pointer ${couleur.bg} ${couleur.text}`}
                        >
                          <div className="font-medium">{event.time}</div>
                          <div className="text-sm">{event.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Événements de la journée */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Événements du jour</h3>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-center py-8 bg-gray-800 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Aucun événement</p>
              </div>
            ) : (
              events.map(event => {
                const couleur = getEntrepriseCouleur(event.entrepriseId);
                const entreprise = entreprises.find(e => e.id === event.entrepriseId);

                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`p-3 rounded-lg cursor-pointer ${couleur.bg} ${couleur.text} hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{event.time || 'Toute la journée'}</span>
                      <span className="text-xs opacity-75">{entreprise?.nom}</span>
                    </div>
                    <div className="text-sm">{event.title}</div>
                    {event.type === 'rendez-vous' && (
                      <div className="text-xs mt-1 opacity-75">
                        📍 {(event.data as RendezVous).lieu}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant formulaire pour rendez-vous
function RendezVousForm({
  rendezVous,
  entreprises,
  selectedDate,
  onSave,
  onCancel
}: {
  rendezVous: RendezVous | null;
  entreprises: Entreprise[];
  selectedDate: Date | null;
  onSave: (rdv: Omit<RendezVous, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    titre: '',
    entrepriseId: '',
    date: '',
    heure: '',
    lieu: '',
    type: 'visite-chantier' as const,
    notes: '',
    statut: 'planifie' as const,
    confirme: false
  });

  useEffect(() => {
    if (rendezVous) {
      setFormData({
        titre: rendezVous.titre,
        entrepriseId: rendezVous.entrepriseId,
        date: rendezVous.dateHeure.toISOString().split('T')[0],
        heure: rendezVous.dateHeure.toTimeString().slice(0, 5),
        lieu: rendezVous.lieu,
        type: rendezVous.type,
        notes: rendezVous.notes || '',
        statut: rendezVous.statut,
        confirme: rendezVous.confirme || false
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0],
        heure: '09:00'
      }));
    }
  }, [rendezVous, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dateHeure = new Date(`${formData.date}T${formData.heure}`);

    onSave({
      titre: formData.titre,
      entrepriseId: formData.entrepriseId,
      dateHeure,
      lieu: formData.lieu,
      type: formData.type,
      notes: formData.notes,
      statut: formData.statut,
      confirme: formData.confirme
    });
  };

  return (
    <div className="space-y-4">
      <form id="rendez-vous-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Titre du rendez-vous
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className="input-field w-full"
              placeholder="Ex: Visite de chantier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entreprise
            </label>
            <select
              value={formData.entrepriseId}
              onChange={(e) => setFormData(prev => ({ ...prev, entrepriseId: e.target.value }))}
              className="input-field w-full"
            >
              <option value="">Sélectionner une entreprise</option>
              {entreprises.map(entreprise => (
                <option key={entreprise.id} value={entreprise.id}>
                  {entreprise.nom} ({entreprise.secteurActivite})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="input-field w-full"
              style={{
                maxWidth: '100%',
                minWidth: '0',
                width: '100%',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Heure
            </label>
            <input
              type="time"
              value={formData.heure}
              onChange={(e) => setFormData(prev => ({ ...prev, heure: e.target.value }))}
              className="input-field w-full"
              style={{
                maxWidth: '100%',
                minWidth: '0',
                width: '100%',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lieu
          </label>
          <input
            type="text"
            value={formData.lieu}
            onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Adresse du chantier"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type de rendez-vous
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="input-field w-full"
            >
              <option value="visite-chantier">Visite de chantier</option>
              <option value="remise-devis">Remise de devis</option>
              <option value="reunion">Réunion</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
              className="input-field w-full"
            >
              <option value="planifie">Planifié</option>
              <option value="realise">Réalisé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>

        {/* Case à cocher confirmation */}
        <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="confirme"
              checked={formData.confirme}
              onChange={(e) => setFormData(prev => ({ ...prev, confirme: e.target.checked }))}
              className="mt-1 w-5 h-5 text-primary-600 bg-gray-800 border-gray-500 rounded focus:ring-primary-500 focus:ring-2"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex-1">
              <label htmlFor="confirme" className="text-sm font-medium text-blue-100 cursor-pointer block mb-1">
                ✓ Rendez-vous confirmé par l'entreprise
              </label>
              <p className="text-xs text-blue-200">
                Cochez cette case quand l'entreprise a confirmé sa présence au rendez-vous
              </p>
              {formData.confirme && (
                <div className="mt-2 text-xs text-green-400 flex items-center space-x-1 bg-green-600/20 rounded px-2 py-1">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Rendez-vous confirmé</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="input-field w-full resize-none"
            placeholder="Notes sur le rendez-vous..."
          />
        </div>

      </form>

      {/* Actions - En dehors du scroll pour rester visibles */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700 bg-gray-800 sticky bottom-0">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="rendez-vous-form"
          className="btn-primary"
        >
          {rendezVous ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </div>
  );
}

// Composant vue agenda (liste des rendez-vous)
function AgendaView({
  rendezVous,
  commandes,
  entreprises,
  getEntrepriseCouleur,
  onEventClick,
  onDateClick
}: any) {
  const [filterPeriod, setFilterPeriod] = useState('7'); // 7 jours par défaut
  const [filterEntreprise, setFilterEntreprise] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Créer une liste combinée de tous les événements
  const getAllEvents = () => {
    const events: Array<{
      id: string;
      type: 'commande-debut' | 'commande-fin' | 'rendez-vous';
      date: Date;
      title: string;
      description: string;
      entrepriseId: string;
      entrepriseNom: string;
      lieu?: string;
      statut?: string;
      data: any;
    }> = [];

    const now = new Date();
    const filterDays = parseInt(filterPeriod);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + filterDays);

    // Ajouter les rendez-vous
    rendezVous.forEach((rdv: any) => {
      if (rdv.dateHeure >= now && rdv.dateHeure <= endDate) {
        const entreprise = entreprises.find((e: any) => e.id === rdv.entrepriseId);
        if (filterEntreprise === 'all' || rdv.entrepriseId === filterEntreprise) {
          if (filterType === 'all' || filterType === 'rendez-vous') {
            events.push({
              id: `rdv-${rdv.id}`,
              type: 'rendez-vous',
              date: rdv.dateHeure,
              title: rdv.titre,
              description: `${rdv.type} - ${rdv.lieu}`,
              entrepriseId: rdv.entrepriseId,
              entrepriseNom: entreprise?.nom || 'Entreprise inconnue',
              lieu: rdv.lieu,
              statut: rdv.statut,
              data: rdv
            });
          }
        }
      }
    });

    // Ajouter les débuts de commandes
    commandes.forEach((commande: any) => {
      if (commande.dateDebutPrevue >= now && commande.dateDebutPrevue <= endDate) {
        const entreprise = entreprises.find((e: any) => e.id === commande.entrepriseId);
        if (filterEntreprise === 'all' || commande.entrepriseId === filterEntreprise) {
          if (filterType === 'all' || filterType === 'commande') {
            events.push({
              id: `debut-${commande.id}`,
              type: 'commande-debut',
              date: commande.dateDebutPrevue,
              title: `Début des travaux`,
              description: `${commande.prestationNom} - ${commande.numero}`,
              entrepriseId: commande.entrepriseId,
              entrepriseNom: entreprise?.nom || 'Entreprise inconnue',
              statut: commande.statut,
              data: commande
            });
          }
        }
      }

      if (commande.dateFinPrevue >= now && commande.dateFinPrevue <= endDate) {
        const entreprise = entreprises.find((e: any) => e.id === commande.entrepriseId);
        if (filterEntreprise === 'all' || commande.entrepriseId === filterEntreprise) {
          if (filterType === 'all' || filterType === 'commande') {
            events.push({
              id: `fin-${commande.id}`,
              type: 'commande-fin',
              date: commande.dateFinPrevue,
              title: `Fin des travaux`,
              description: `${commande.prestationNom} - ${commande.numero}`,
              entrepriseId: commande.entrepriseId,
              entrepriseNom: entreprise?.nom || 'Entreprise inconnue',
              statut: commande.statut,
              data: commande
            });
          }
        }
      }
    });

    // Trier par date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'rendez-vous':
        return <Clock className="w-4 h-4" />;
      case 'commande-debut':
        return <Play className="w-4 h-4" />;
      case 'commande-fin':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'rendez-vous':
        return 'Rendez-vous';
      case 'commande-debut':
        return 'Début travaux';
      case 'commande-fin':
        return 'Fin travaux';
      default:
        return 'Événement';
    }
  };

  const isEventToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isEventThisWeek = (date: Date) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return date >= startOfWeek && date <= endOfWeek;
  };

  const allEvents = getAllEvents();

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-field w-full"
          >
            <option value="7">7 prochains jours</option>
            <option value="14">2 prochaines semaines</option>
            <option value="30">30 prochains jours</option>
            <option value="90">3 prochains mois</option>
          </select>
        </div>
        <div className="flex-1">
          <select
            value={filterEntreprise}
            onChange={(e) => setFilterEntreprise(e.target.value)}
            className="input-field w-full"
          >
            <option value="all">Toutes les entreprises</option>
            {entreprises.map((entreprise: any) => (
              <option key={entreprise.id} value={entreprise.id}>
                {entreprise.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-full"
          >
            <option value="all">Tous les types</option>
            <option value="rendez-vous">Rendez-vous uniquement</option>
            <option value="commande">Commandes uniquement</option>
          </select>
        </div>
      </div>

      {/* Liste des événements */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun événement</h3>
            <p className="text-gray-500 mb-4">
              Aucun rendez-vous ou commande dans la période sélectionnée
            </p>
            <button
              onClick={() => onDateClick(new Date())}
              className="btn-primary"
            >
              Créer un rendez-vous
            </button>
          </div>
        ) : (
          allEvents.map((event) => {
            const couleur = getEntrepriseCouleur(event.entrepriseId);
            const isToday = isEventToday(event.date);
            const isThisWeek = isEventThisWeek(event.date);

            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-750 transition-colors ${couleur.border
                  } ${isToday ? 'bg-primary-600/10' : 'bg-gray-700'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${couleur.bg}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-100">{event.title}</h4>
                      <p className="text-sm text-gray-300">{event.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${couleur.bg} ${couleur.text}`}>
                      {getEventTypeLabel(event.type)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <p className={`font-medium ${isToday ? 'text-primary-400' : 'text-gray-100'}`}>
                      {event.date.toLocaleDateString('fr-FR')}
                      {isToday && <span className="ml-1 text-xs">(Aujourd'hui)</span>}
                      {!isToday && isThisWeek && <span className="ml-1 text-xs">(Cette semaine)</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Heure:</span>
                    <p className="text-gray-100">
                      {event.type === 'rendez-vous'
                        ? event.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : 'Toute la journée'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Entreprise:</span>
                    <p className="text-gray-100 font-medium">{event.entrepriseNom}</p>
                  </div>
                  {event.statut && (
                    <div>
                      <span className="text-gray-400">Statut:</span>
                      <p className="text-gray-100">{event.statut}</p>
                    </div>
                  )}
                </div>

                {event.lieu && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{event.lieu}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Statistiques rapides */}
      {allEvents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-mobile">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-100">{allEvents.length}</p>
              <p className="text-xs text-gray-400">Total événements</p>
            </div>
          </div>
          <div className="card-mobile">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {allEvents.filter(e => e.type === 'rendez-vous').length}
              </p>
              <p className="text-xs text-gray-400">Rendez-vous</p>
            </div>
          </div>
          <div className="card-mobile">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {allEvents.filter(e => e.type === 'commande-debut').length}
              </p>
              <p className="text-xs text-gray-400">Débuts travaux</p>
            </div>
          </div>
          <div className="card-mobile">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {allEvents.filter(e => isEventToday(e.date)).length}
              </p>
              <p className="text-xs text-gray-400">Aujourd'hui</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
