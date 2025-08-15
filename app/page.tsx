"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { clientApi, reservationApi, settingsApi, type Client, type Reservation, type BusinessSettings, type Service } from "@/lib/api"
import { LoginForm } from "@/components/LoginForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  ChevronsUpDown,
  UserPlus,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  LogOut,
  Search,
  History,
  Eye,
  EyeOff,
} from "lucide-react"



export default function ReservationSystem() {
  const getDateString = (date: Date) => {
    // Format as local YYYY-MM-DD to avoid UTC shifting
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Parse a YYYY-MM-DD string as a local Date (midnight local time)
  const parseLocalDate = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map((v) => Number.parseInt(v, 10))
    return new Date(y, (m || 1) - 1, d || 1)
  }

  const { user, isAuthenticated, logout } = useAuth()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false)
  const [isClientHistoryOpen, setIsClientHistoryOpen] = useState(false)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Added client selection state
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isNewClient, setIsNewClient] = useState(false)

  // Added settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customServices, setCustomServices] = useState<Service[]>([
    { id: "1", name: "Haircut", duration: 30, price: 25 },
    { id: "2", name: "Beard Trim", duration: 15, price: 15 },
    { id: "3", name: "Haircut + Beard", duration: 45, price: 35 },
    { id: "4", name: "Shampoo & Style", duration: 20, price: 20 },
    { id: "5", name: "Hot Towel Shave", duration: 30, price: 30 },
  ])

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: "Elite Barber Shop",
    phone: "(555) 123-4567",
    email: "info@elitebarbershop.com",
    address: "123 Main Street, City, State 12345",
    startHour: 9,
    endHour: 18,
    appointmentDuration: 30,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    services: [
      { id: "1", name: "Haircut", duration: 30, price: 25 },
      { id: "2", name: "Beard Trim", duration: 15, price: 15 },
      { id: "3", name: "Haircut + Beard", duration: 45, price: 35 },
      { id: "4", name: "Shampoo & Style", duration: 20, price: 20 },
      { id: "5", name: "Hot Towel Shave", duration: 30, price: 30 },
    ]
  })

  const [newService, setNewService] = useState({ name: "", duration: 30, price: 0 })

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    service: "",
    notes: "",
    editDate: "",
    editTime: "",
  })



  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data from MongoDB on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const todayStr = getDateString(new Date())
        console.log('[loadData] fetching initial data')
        const [clientsData, reservationsData, settingsData] = await Promise.all([
          clientApi.getAll(),
          reservationApi.getAll(todayStr),
          settingsApi.get()
        ])
        console.log('[loadData] clients:', clientsData.length, 'reservations(today):', reservationsData.length)
        
        setClients(clientsData)
        setReservations(reservationsData)
        setBusinessSettings(settingsData)
        setCustomServices(settingsData.services)
      } catch (error) {
        console.error('Error loading data:', error)
        // If data loading fails, seed the database with initial data
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])



  const handleClientSearch = () => {
    setIsClientSearchOpen(true)
  }

  const handleClientHistoryView = (client: Client) => {
    setSelectedClientForHistory(client)
    setIsClientHistoryOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      try {
        // Only send the fields that should be updated, excluding _id and id
        const { _id, id, createdAt, updatedAt, ...updateData } = editingClient
        await clientApi.update(editingClient._id || editingClient.id || '', updateData)
        setClients((prev) => prev.map((c) => (c._id === editingClient._id || c.id === editingClient.id ? editingClient : c)))
      setEditingClient(null)
      } catch (error) {
        console.error('Error updating client:', error)
        alert(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const getClientReservations = (clientId: string) => {
    const today = new Date()
    // normalize to local midnight so comparisons are date-only
    today.setHours(0, 0, 0, 0)
    const clientReservations = reservations.filter((res) => res.clientId === clientId)

    const past = clientReservations
      .filter((res) => parseLocalDate(res.date) < today)
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())

    const future = clientReservations
      .filter((res) => parseLocalDate(res.date) >= today)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())

    return { past, future }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setFormData((prev) => ({
      ...prev,
      clientName: client.name,
      clientPhone: client.phone,
    }))
    setClientSearchOpen(false)
    setIsNewClient(false)

    const { future } = getClientReservations(client._id || client.id || '')
    if (future.length > 0) {
      handleClientHistoryView(client)
    }
  }

  // Generate time slots based on settings
  const timeSlots = []
  const duration = businessSettings.appointmentDuration
  const now = new Date()
  const currentDateString = getDateString(currentDate)
  const isToday = currentDateString === getDateString(now)

  for (let hour = businessSettings.startHour; hour < businessSettings.endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += duration) {
      const totalMinutes = hour * 60 + minutes
      const endTotalMinutes = totalMinutes + duration

      // Don't add slot if it goes beyond end hour
      if (endTotalMinutes > businessSettings.endHour * 60) break

      const displayHour = Math.floor(totalMinutes / 60)
      const displayMinutes = totalMinutes % 60
      const period = displayHour >= 12 ? "PM" : "AM"
      const hour12 = displayHour === 0 ? 12 : displayHour > 12 ? displayHour - 12 : displayHour

      const timeString = `${hour12}:${displayMinutes.toString().padStart(2, "0")} ${period}`

      let isPastSlot = false
      if (isToday) {
        const slotTime = new Date(currentDate)
        slotTime.setHours(displayHour, displayMinutes, 0, 0)
        isPastSlot = slotTime < now
      }

      timeSlots.push({ time: timeString, isPast: isPastSlot })
    }
  }

  const services = businessSettings.services.map((s) => s.name)

  // Added settings management functions
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Saving settings:', businessSettings)
      await settingsApi.update(businessSettings)
    setIsSettingsOpen(false)
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const addService = () => {
    if (newService.name && newService.price > 0) {
      const service: Service = {
        id: Date.now().toString(),
        ...newService,
      }
      const updatedServices = [...customServices, service]
      setCustomServices(updatedServices)
      setBusinessSettings(prev => ({ ...prev, services: updatedServices }))
      setNewService({ name: "", duration: 30, price: 0 })
    }
  }

  const removeService = (id: string) => {
    const updatedServices = customServices.filter((s) => s.id !== id)
    setCustomServices(updatedServices)
    setBusinessSettings(prev => ({ ...prev, services: updatedServices }))
  }

  const updateWorkingDay = (day: keyof BusinessSettings["workingDays"], enabled: boolean) => {
    const updatedSettings = {
      ...businessSettings,
      workingDays: {
        ...businessSettings.workingDays,
        [day]: enabled,
      },
    }
    setBusinessSettings(updatedSettings)
  }

  const createOrUpdateClient = async (clientData: Omit<Client, "id" | "totalAppointments" | "lastVisit">) => {
    const existingClient = clients.find((c) => c.name.toLowerCase() === clientData.name.toLowerCase())

    if (existingClient) {
      const updatedClient = {
        ...existingClient,
        phone: clientData.phone || existingClient.phone,
        notes: clientData.notes || existingClient.notes,
        totalAppointments: existingClient.totalAppointments + 1,
        lastVisit: getDateString(currentDate),
      }
      // Only send the fields that should be updated, excluding _id and id
      const { _id, id, createdAt, updatedAt, ...updateData } = updatedClient
      await clientApi.update(existingClient._id || existingClient.id || '', updateData)
      setClients((prev) => prev.map((c) => (c._id === existingClient._id || c.id === existingClient.id ? updatedClient : c)))
      return updatedClient
    } else {
      const newClientData = {
        name: clientData.name,
        phone: clientData.phone,
        notes: clientData.notes,
        totalAppointments: 1,
        lastVisit: getDateString(currentDate),
      }
      const newClient = await clientApi.create(newClientData)
      setClients((prev) => [...prev, newClient])
      return newClient
    }
  }

  const getClientHistory = (clientName: string) => {
    return reservations
      .filter((res) => res.clientName.toLowerCase() === clientName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const isWorkingDay = (date: Date) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[date.getDay()] as keyof BusinessSettings["workingDays"]
    return businessSettings.workingDays[dayName]
  }

  const getReservationsForDate = (date: Date) => {
    const dateString = getDateString(date)
    return reservations.filter((res) => res.date === dateString)
  }

  const isTimeSlotBooked = (time: string) => {
    const dateString = getDateString(currentDate)
    return reservations.some((res) => res.time === time && res.date === dateString)
  }

  const getReservationForTimeSlot = (time: string) => {
    const dateString = getDateString(currentDate)
    return reservations.find((res) => res.time === time && res.date === dateString)
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
    const ymd = getDateString(newDate)
    setIsLoadingReservations(true)
    reservationApi
      .getAll(ymd)
      .then((list) => setReservations(list))
      .catch((err) => console.error('Error fetching reservations for date', ymd, err))
      .finally(() => setIsLoadingReservations(false))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setEditingReservation(null)
    setSelectedClient(null)
    setIsDialogOpen(false)
  }

  const handleTimeSlotClick = (time: string) => {
    if (!isWorkingDay(currentDate)) {
      alert("Appointments cannot be booked on non-working days. Please select a working day.")
      return
    }

    const existingReservation = getReservationForTimeSlot(time)

    // Block creating new reservations in past time slots for today,
    // but allow editing an existing reservation regardless of time
    if (!existingReservation) {
    const now = new Date()
    const currentDateString = getDateString(currentDate)
    const isToday = currentDateString === getDateString(now)

    if (isToday) {
      // Parse the time slot to check if it's in the past
      const [timeStr, period] = time.split(" ")
      const [hourStr, minuteStr] = timeStr.split(":")
      let hour = Number.parseInt(hourStr)
      const minute = Number.parseInt(minuteStr)

      if (period === "PM" && hour !== 12) hour += 12
      if (period === "AM" && hour === 12) hour = 0

      const slotTime = new Date()
      slotTime.setHours(hour, minute, 0, 0)

      if (slotTime <= now) {
          alert("You cannot create a new reservation at this time because the time has passed.")
        return
        }
      }
    }

    if (existingReservation) {
      setEditingReservation(existingReservation)
      const client = clients.find((c) => c.id === existingReservation.clientId)
      setSelectedClient(client || null)
      setFormData({
        clientName: existingReservation.clientName,
        clientPhone: existingReservation.clientPhone,
        service: existingReservation.service,
        notes: existingReservation.notes || "",
        editDate: existingReservation.date,
        editTime: existingReservation.time,
      })
      setIsNewClient(false)
    } else {
      setEditingReservation(null)
      setSelectedClient(null)
      const defaultService =
        customServices.find((s) => s.duration === businessSettings.appointmentDuration) || customServices[0]
      setFormData({
        clientName: "",
        clientPhone: "",
        service: defaultService.name,
        notes: "",
        editDate: getDateString(currentDate),
        editTime: time,
      })
      setIsNewClient(false)
    }
    setSelectedTimeSlot(time)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientName || !formData.service) return

    // Added validation to prevent booking conflicts when moving appointments
    const newDate = formData.editDate || getDateString(currentDate)
    const newTime = formData.editTime || selectedTimeSlot

    const selectedDate = parseLocalDate(newDate)
    if (!isWorkingDay(selectedDate)) {
      alert("Appointments cannot be booked on non-working days. Please select a working day.")
      return
    }

    // Check if the new slot is already booked (but allow current appointment to stay in same slot)
    const conflictingReservation = reservations.find(
      (res) => res.date === newDate && res.time === newTime && res._id !== editingReservation?._id,
    )

    if (conflictingReservation) {
      alert(
        `Time slot ${newTime} on ${parseLocalDate(newDate).toLocaleDateString()} is already booked by ${conflictingReservation.clientName}`,
      )
      return
    }

    try {
      console.log('Saving reservation:', { editingReservation, formData })

    // Create or update client record
      const client = await createOrUpdateClient({
      name: formData.clientName,
      phone: formData.clientPhone,
      notes: formData.notes,
    })

    const reservationData = {
        clientId: client._id || client.id || '',
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      service: formData.service,
      time: newTime,
      date: newDate,
      notes: formData.notes,
    }

    if (editingReservation) {
        const reservationId = editingReservation._id || editingReservation.id || ''
        console.log('Updating reservation with ID:', reservationId)
        await reservationApi.update(reservationId, reservationData)
        setReservations((prev) => prev.map((res) => {
          const resId = res._id || res.id || ''
          const editingId = editingReservation._id || editingReservation.id || ''
          return resId === editingId ? { ...res, ...reservationData } : res
        }))
      // Update current date view if appointment was moved to a different date
      if (newDate !== getDateString(currentDate)) {
          setCurrentDate(parseLocalDate(newDate))
      }
    } else {
        console.log('Creating new reservation')
        const newReservation = await reservationApi.create(reservationData)
        console.log('New reservation created:', newReservation)
        setReservations((prev) => [...prev, newReservation])
    }

    setIsDialogOpen(false)
    setFormData({
      clientName: "",
      clientPhone: "",
      service: "",
      notes: "",
      editDate: "",
      editTime: "",
    })
    setEditingReservation(null)
    setSelectedClient(null)
    setIsNewClient(false)
    } catch (error) {
      console.error('Error saving reservation:', error)
      alert(`Failed to save reservation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async () => {
    if (editingReservation) {
      try {
        const reservationId = editingReservation._id || editingReservation.id || ''
        console.log('Deleting reservation with ID:', reservationId)
        console.log('Current reservations before delete:', reservations.length)
        
        await reservationApi.delete(reservationId)
        
        console.log('Reservation deleted successfully from API')
        
        setReservations((prev) => {
          console.log('All reservations before filter:', prev.map(r => ({ id: r._id || r.id, name: r.clientName })))
          const filtered = prev.filter((res) => {
            const resId = res._id || res.id || ''
            const shouldKeep = resId !== reservationId
            console.log(`Reservation ${resId} vs ${reservationId} - keeping: ${shouldKeep}`)
            return shouldKeep
          })
          console.log('Reservations after filter:', filtered.length)
          return filtered
        })
        
      setIsDialogOpen(false)
      setEditingReservation(null)
      } catch (error) {
        console.error('Error deleting reservation:', error)
        alert(`Failed to delete reservation: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const todaysReservations = getReservationsForDate(currentDate)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date)
      setIsDatePickerOpen(false)
      setEditingReservation(null)
      setSelectedClient(null)
      setIsDialogOpen(false)
      // fetch reservations for selected date from server
      const ymd = getDateString(date)
      setIsLoadingReservations(true)
      reservationApi
        .getAll(ymd)
        .then((list) => setReservations(list))
        .catch((err) => console.error('Error fetching reservations for date', ymd, err))
        .finally(() => setIsLoadingReservations(false))
    }
  }

  const [isAdminMode, setIsAdminMode] = useState(false)

  const handleNewClient = () => {
    setClientSearchOpen(false)
    setIsNewClient(true)
    setFormData((prev) => ({ ...prev, clientName: "", clientPhone: "" }))
    setSelectedClient(null)
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-slate-600">Please wait while we load your data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">{businessSettings.businessName}</h1>
              <p className="text-xs md:text-sm text-slate-600">Reservation System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User info */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{user?.name || 'Admin'}</span>
            </div>

            {/* Mobile: Show only admin toggle */}
            <div className="md:hidden">
              <Button
                variant={isAdminMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAdminMode(!isAdminMode)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Desktop: Show all buttons when admin mode or always */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClientSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search Client
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>

              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile: Show admin buttons when admin mode is enabled */}
            {isAdminMode && (
              <div className="md:hidden flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleClientSearch}>
                  <Search className="w-4 h-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="w-4 h-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {isAdminMode && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleClientSearch} className="flex-1 bg-transparent">
                <Search className="w-4 h-4 mr-2" />
                Kerko Klient
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="w-full bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between md:flex-row flex-col mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">{formatDate(currentDate)}</h2>
              <p className="text-sm text-slate-600">
                {currentDate.toDateString() === new Date().toDateString() ? "Today" : ""}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Select Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent mode="single" selected={currentDate} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>

            <Button onClick={goToToday} variant="outline">
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Orari Ditor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoadingReservations && (
                <div className="text-sm text-slate-500">Loading reservations...</div>
              )}
              {timeSlots.map((time, index) => {
                const reservation = getReservationForTimeSlot(time.time)
                const isBooked = !!reservation

                return (
                  <div
                    key={time.time}
                    className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-20 text-sm font-medium text-slate-700">{time.time}</div>

                    <div
                      className={`flex-1 min-h-[60px] rounded border-2 flex items-center justify-between p-3 transition-colors cursor-pointer ${
                        isBooked
                          ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                          : "bg-white border-dashed border-slate-200 hover:border-blue-300"
                      }`}
                      onClick={() => handleTimeSlotClick(time.time)}
                    >
                      {isBooked ? (
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium text-slate-900">{reservation.clientName}</p>
                            <p className="text-sm text-slate-600">{reservation.service}</p>
                            {reservation.clientPhone && (
                              <p className="text-xs text-slate-500">{reservation.clientPhone}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center w-full text-slate-400 hover:text-blue-600">
                          <Plus className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs">Add Appointment</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-slate-900">{todaysReservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Available Slots</p>
                  <p className="text-2xl font-bold text-slate-900">{timeSlots.length - todaysReservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Clients</p>
                  <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Appointment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReservation ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enhanced date/time editing with better UX and conflict detection */}
            {editingReservation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium">Moving Appointment</p>
                <p className="text-xs text-blue-600">
                  Original: {parseLocalDate(editingReservation.date).toLocaleDateString()} at {editingReservation.time}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Time</Label>
                {editingReservation ? (
                  <Select
                    value={formData.editTime}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, editTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => {
                        // Show which time slots are available vs booked for the selected date
                        const isBooked = reservations.some(
                          (res) =>
                            res.date === (formData.editDate || getDateString(currentDate)) &&
                            res.time === slot.time &&
                            res.id !== editingReservation?.id,
                        )
                        return (
                          <SelectItem key={slot.time} value={slot.time} disabled={isBooked}>
                            {slot.time} {isBooked ? "(Booked)" : ""}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="time" value={selectedTimeSlot} disabled />
                )}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                {editingReservation ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.editDate ? format(new Date(formData.editDate), "yyyy-MM-dd") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.editDate ? new Date(formData.editDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            const localDateString = `${year}-${month}-${day}`

                            setFormData((prev) => ({
                              ...prev,
                              editDate: localDateString,
                            }))
                            setIsDatePickerOpen(false)
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today || !isWorkingDay(date)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input id="date" value={formatDate(currentDate)} disabled />
                )}
              </div>
            </div>

            {/* Enhanced client selection with search and autocomplete */}
            <div>
              <Label>Client *</Label>
              <div className="space-y-2">
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className="w-full justify-between bg-transparent"
                    >
                      {selectedClient ? selectedClient.name : isNewClient ? "New Client" : "Select client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search clients..." />
                      <CommandList>
                        <CommandEmpty>No clients found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={handleNewClient}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Client
                          </CommandItem>
                          {clients.map((client) => (
                            <CommandItem key={client._id || client.id || client.name + client.phone} onSelect={() => handleClientSelect(client)}>
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedClient?._id === client._id || selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  className="text-left hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleClientHistoryView(client)
                                  }}
                                >
                                  {client.name}
                                </button>
                                <span className="text-xs text-slate-500">
                                  {client.phone} • {client.totalAppointments} visits
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {(isNewClient || !selectedClient) && (
                  <>
                    <Input
                      placeholder="Enter client name"
                      value={formData.clientName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Phone number"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </>
                )}

                {selectedClient && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p>
                      <strong>Phone:</strong> {selectedClient.phone}
                    </p>
                    <p>
                      <strong>Total Visits:</strong> {selectedClient.totalAppointments}
                    </p>
                    {selectedClient.lastVisit && (
                      <p>
                        <strong>Last Visit:</strong> {new Date(selectedClient.lastVisit).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="service">Service *</Label>
              <Select
                value={formData.service}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, service: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              {editingReservation && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingReservation ? "Update" : "Create"} Appointment</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isClientSearchOpen} onOpenChange={setIsClientSearchOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Clients
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Command>
              <CommandInput placeholder="Search clients by name or phone..." />
              <CommandList className="max-h-96">
                <CommandEmpty>No clients found.</CommandEmpty>
                <CommandGroup>
                  {clients.map((client) => (
                    <CommandItem key={client._id || client.id || client.name + client.phone} className="p-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <button
                            className="text-left hover:text-blue-600 font-medium"
                            onClick={() => handleClientHistoryView(client)}
                          >
                            {client.name}
                          </button>
                          <p className="text-sm text-slate-600">{client.phone}</p>
                          <p className="text-xs text-slate-500">
                            {client.totalAppointments} visits • Last:{" "}
                            {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleClientHistoryView(client)}>
                            <History className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClientHistoryOpen} onOpenChange={setIsClientHistoryOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Client History - {selectedClientForHistory?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedClientForHistory && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="font-medium">{selectedClientForHistory.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Visits</p>
                    <p className="font-medium">{selectedClientForHistory.totalAppointments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Last Visit</p>
                    <p className="font-medium">
                      {selectedClientForHistory.lastVisit
                        ? new Date(selectedClientForHistory.lastVisit).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClient(selectedClientForHistory)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client Info
                  </Button>
                </div>
              </div>

              {(() => {
                const { past, future } = getClientReservations(selectedClientForHistory._id || selectedClientForHistory.id || '')
                return (
                  <Tabs defaultValue="future" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="future">Future Appointments ({future.length})</TabsTrigger>
                      <TabsTrigger value="past">Past Appointments ({past.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="future" className="space-y-2">
                      {future.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No future appointments</p>
                      ) : (
                        future.map((reservation) => (
                          <div key={reservation._id || reservation.id || reservation.clientName + reservation.date + reservation.time} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{reservation.service}</p>
                                <p className="text-sm text-slate-600">
                                  {parseLocalDate(reservation.date).toLocaleDateString()} at {reservation.time}
                                </p>
                                {reservation.notes && (
                                  <p className="text-sm text-slate-500 mt-1">{reservation.notes}</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingReservation(reservation)
                                  setSelectedClient(selectedClientForHistory)
                                  setFormData({
                                    clientName: reservation.clientName,
                                    clientPhone: reservation.clientPhone,
                                    service: reservation.service,
                                    notes: reservation.notes || "",
                                    editDate: reservation.date,
                                    editTime: reservation.time,
                                  })
                                  setIsClientHistoryOpen(false)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="past" className="space-y-2">
                      {past.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No past appointments</p>
                      ) : (
                        past.map((reservation) => (
                          <div key={reservation._id || reservation.id || reservation.clientName + reservation.date + reservation.time} className="border rounded-lg p-3 bg-slate-50">
                            <div>
                              <p className="font-medium">{reservation.service}</p>
                              <p className="text-sm text-slate-600">
                               {parseLocalDate(reservation.date).toLocaleDateString()} at {reservation.time}
                              </p>
                              {reservation.notes && <p className="text-sm text-slate-500 mt-1">{reservation.notes}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client Information</DialogTitle>
          </DialogHeader>

          {editingClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <Label htmlFor="editClientName">Name</Label>
                <Input
                  id="editClientName"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editClientPhone">Phone</Label>
                <Input
                  id="editClientPhone"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editClientNotes">Notes</Label>
                <Textarea
                  id="editClientNotes"
                  value={editingClient.notes || ""}
                  onChange={(e) => setEditingClient((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingClient(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Update Client
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Added comprehensive settings dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Business Settings
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="business" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <Input
                      id="businessName"
                      value={businessSettings.businessName}
                      onChange={(e) => setBusinessSettings((prev) => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessPhone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <Input
                      id="businessPhone"
                      value={businessSettings.phone}
                      onChange={(e) => setBusinessSettings((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessEmail">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessAddress">Address</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <Textarea
                      id="businessAddress"
                      value={businessSettings.address}
                      onChange={(e) => setBusinessSettings((prev) => ({ ...prev, address: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startHour">Opening Hour</Label>
                    <Select
                      value={businessSettings.startHour.toString()}
                      onValueChange={(value) =>
                        setBusinessSettings((prev) => ({ ...prev, startHour: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 6).map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="endHour">Closing Hour</Label>
                    <Select
                      value={businessSettings.endHour.toString()}
                      onValueChange={(value) =>
                        setBusinessSettings((prev) => ({ ...prev, endHour: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour <= 12 ? `${hour}:00 PM` : `${hour - 12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="appointmentDuration">Default Appointment Duration (minutes)</Label>
                  <Select
                    value={businessSettings.appointmentDuration.toString()}
                    onValueChange={(value) =>
                      setBusinessSettings((prev) => ({ ...prev, appointmentDuration: Number.parseInt(value) || 30 }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Services</Label>
                  <div className="space-y-2">
                    {customServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-slate-600">
                            {service.duration} min • ${service.price}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeService(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Add New Service</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Service name"
                      value={newService.name}
                      onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      value={newService.duration}
                      onChange={(e) =>
                        setNewService((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 30 }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Price ($)"
                      value={newService.price}
                      onChange={(e) =>
                        setNewService((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <Button onClick={addService} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-4">
                <Label>Working Days</Label>
                <div className="space-y-3">
                  {Object.entries(businessSettings.workingDays).map(([day, enabled]) => (
                    <div key={day} className="flex items-center justify-between">
                      <Label htmlFor={day} className="capitalize">
                        {day}
                      </Label>
                      <Switch
                        id={day}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateWorkingDay(day as keyof BusinessSettings["workingDays"], checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettingsSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
