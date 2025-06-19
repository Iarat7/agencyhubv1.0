import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCalendarEventSchema, type CalendarEvent, type InsertCalendarEvent } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, Video, Phone, FileText } from "lucide-react";

const eventTypes = [
  { value: "meeting", label: "Reunião", icon: Users },
  { value: "recording", label: "Gravação", icon: Video },
  { value: "call", label: "Chamada", icon: Phone },
  { value: "other", label: "Outro", icon: FileText },
];

const eventTypeColors = {
  meeting: "bg-blue-100 text-blue-800 border-blue-200",
  recording: "bg-red-100 text-red-800 border-red-200",
  call: "bg-green-100 text-green-800 border-green-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function CalendarPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você não está autenticado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch calendar events
  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    enabled: isAuthenticated,
  });

  // Fetch clients for event creation
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: InsertCalendarEvent) => {
      return apiRequest("/api/calendar/events", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar evento",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertCalendarEvent>({
    resolver: zodResolver(insertCalendarEventSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "meeting",
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      organizer: "",
      attendees: [],
      location: "",
      reminderMinutes: 15,
      isRecurring: false,
      clientId: undefined,
    },
  });

  const onSubmit = (data: InsertCalendarEvent) => {
    // Ensure dates are properly formatted
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      clientId: data.clientId || null, // Convert undefined to null for "no client"
    };
    createEventMutation.mutate(formattedData);
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter events for current month
  const monthEvents = events.filter((event: CalendarEvent) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return monthEvents.filter((event: CalendarEvent) => 
      isSameDay(new Date(event.startDate), day)
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 calendar-container">
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Calendário da Equipe
            </h1>
            <p className="text-slate-600">
              Gerencie compromissos e reuniões da sua agência
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Título do Evento</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do compromisso" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente (Opcional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum cliente</SelectItem>
                              {clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora de Início</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  field.onChange(new Date(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora de Término</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  field.onChange(new Date(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local</FormLabel>
                          <FormControl>
                            <Input placeholder="Local da reunião ou link" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalhes do evento..." className="min-h-[100px]" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createEventMutation.isPending}>
                      {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>

          {/* Calendar Navigation */}
          <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {monthDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-1 border border-slate-200 cursor-pointer transition-colors
                      ${isSelected ? "bg-blue-100" : "hover:bg-slate-50"}
                      ${isTodayDate ? "bg-blue-50 border-blue-300" : ""}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${isTodayDate ? "text-blue-600" : "text-slate-900"}
                    `}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event: CalendarEvent) => {
                        const EventIcon = eventTypes.find(t => t.value === event.type)?.icon || FileText;
                        return (
                          <div
                            key={event.id}
                            className={`
                              text-xs p-1 rounded border truncate
                              ${eventTypeColors[event.type as keyof typeof eventTypeColors]}
                            `}
                            title={event.title}
                          >
                            <div className="flex items-center gap-1">
                              <EventIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{event.title}</span>
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 pl-1">
                          +{dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          </Card>

          {/* Event Details Sidebar */}
          {selectedDate && (
            <Card>
              <CardHeader>
              <CardTitle>
                Eventos - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getEventsForDay(selectedDate).length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum evento agendado para este dia
                </p>
              ) : (
                <div className="space-y-4">
                  {getEventsForDay(selectedDate).map((event: CalendarEvent) => {
                    const EventIcon = eventTypes.find(t => t.value === event.type)?.icon || FileText;
                    return (
                      <div key={event.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <EventIcon className="h-5 w-5 text-slate-600" />
                            <h3 className="font-medium">{event.title}</h3>
                          </div>
                          <Badge variant="outline" className={eventTypeColors[event.type as keyof typeof eventTypeColors]}>
                            {eventTypes.find(t => t.value === event.type)?.label}
                          </Badge>
                        </div>

                        {event.description && (
                          <p className="text-sm text-slate-600">{event.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(new Date(event.startDate), "HH:mm")} - {format(new Date(event.endDate), "HH:mm")}
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {event.organizer}
                          </div>

                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {event.attendees.length} participantes
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}