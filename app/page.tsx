"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, User, Bot, Settings, Heart } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Database, MessageSquare } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actions?: Array<{
    type: string
    data: any
  }>
}

interface ApiResponse {
  message: string
  session_id: string
  actions?: Array<{
    type: string
    data: any
  }>
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  email: string
  phone: string
  created_at: string
  allergies?: string[]
  medications?: string[]
}

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty: string
  email: string
  phone: string
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  date_time: string
  duration: number
  appointment_type: string
  notes?: string
  status: string
  created_at: string
}

interface MedicalRecord {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  diagnosis: string
  treatment: string
  notes?: string
  created_at: string
}

export default function MedicalAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userType, setUserType] = useState<"doctor" | "patient">("doctor")
  const [userId, setUserId] = useState("")
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false)
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    checkConnection()
  }, [apiUrl])

  const checkConnection = async () => {
    setConnectionStatus("checking")
    try {
      const response = await fetch(`${apiUrl}/health`, {
        headers: {
          "api-key": "1",
        },
      })
      if (response.ok) {
        setConnectionStatus("connected")
      } else {
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      setConnectionStatus("disconnected")
    }
  }

  const createSession = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/ai/sessions?test_user_id=${encodeURIComponent(userId)}&test_user_type=${userType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "1",
          },
          body: JSON.stringify({
            metadata: {
              name: userId,
              user_type: userType,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSessionId(data.session_id)

      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          userType === "doctor"
            ? "سلام دکتر! من دستیار هوشمند کلینیک پزشکی هستم. می‌توانم به شما در دسترسی به اطلاعات بیماران، برنامه ملاقات‌ها و نتایج آزمایش کمک کنم."
            : "سلام! من دستیار هوشمند کلینیک پزشکی هستم. می‌توانم به شما در مشاهده قرار ملاقات‌ها، داروها و نتایج آزمایش‌تان کمک کنم.",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    } catch (error) {
      console.error("Error creating session:", error)
      alert("خطا در ایجاد جلسه. لطفاً اتصال به سرور را بررسی کنید.")
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(
        `${apiUrl}/api/ai/chat?test_user_id=${encodeURIComponent(userId)}&test_user_type=${userType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "1",
          },
          body: JSON.stringify({
            message: input,
            session_id: sessionId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "متأسفم، خطایی رخ داده است. لطفاً دوباره تلاش کنید.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([])
    setSessionId(null)
    setInput("")
  }

  const renderActions = (actions?: Array<{ type: string; data: any }>) => {
    if (!actions || actions.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        {actions.map((action, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{action.type}</Badge>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {JSON.stringify(action.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    )
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/patients`, {
        headers: { "api-key": "1" },
      })
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/doctors`, {
        headers: { "api-key": "1" },
      })
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/appointments`, {
        headers: { "api-key": "1" },
      })
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/medical-records`, {
        headers: { "api-key": "1" },
      })
      if (response.ok) {
        const data = await response.json()
        setMedicalRecords(data)
      }
    } catch (error) {
      console.error("Error fetching medical records:", error)
    }
  }

  const addPatient = async (patientData: any) => {
    try {
      const response = await fetch(`${apiUrl}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "1",
        },
        body: JSON.stringify(patientData),
      })
      if (response.ok) {
        fetchPatients()
        setIsAddPatientOpen(false)
      }
    } catch (error) {
      console.error("Error adding patient:", error)
    }
  }

  const addAppointment = async (appointmentData: any) => {
    try {
      const response = await fetch(`${apiUrl}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "1",
        },
        body: JSON.stringify(appointmentData),
      })
      if (response.ok) {
        fetchAppointments()
        setIsAddAppointmentOpen(false)
      }
    } catch (error) {
      console.error("Error adding appointment:", error)
    }
  }

  const addMedicalRecord = async (recordData: any) => {
    try {
      const response = await fetch(`${apiUrl}/api/medical-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "1",
        },
        body: JSON.stringify(recordData),
      })
      if (response.ok) {
        fetchMedicalRecords()
        setIsAddRecordOpen(false)
      }
    } catch (error) {
      console.error("Error adding medical record:", error)
    }
  }

  useEffect(() => {
    if (connectionStatus === "connected" && activeTab === "data") {
      fetchPatients()
      fetchDoctors()
      fetchAppointments()
      fetchMedicalRecords()
    }
  }, [connectionStatus, activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-800">دستیار هوشمند کلینیک پزشکی</h1>
          </div>
          <p className="text-gray-600">سیستم هوشمند برای کمک به پزشکان و بیماران</p>
        </div>

        {/* Configuration Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              تنظیمات اتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">آدرس سرور</label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8001"
                  className="text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">نوع کاربر</label>
                <Select value={userType} onValueChange={(value: "doctor" | "patient") => setUserType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">پزشک</SelectItem>
                    <SelectItem value="patient">بیمار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">شناسه کاربر</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={userType === "doctor" ? "doctor@clinic.com" : "patient@example.com"}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "disconnected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm">
                  {connectionStatus === "connected"
                    ? "متصل"
                    : connectionStatus === "disconnected"
                      ? "قطع اتصال"
                      : "در حال بررسی..."}
                </span>
              </div>
              <Button onClick={checkConnection} variant="outline" size="sm">
                بررسی اتصال
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              چت با دستیار
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              مدیریت داده‌ها
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="flex gap-4 mb-4">
              <Button
                onClick={createSession}
                disabled={!userId || connectionStatus !== "connected"}
                className="bg-green-600 hover:bg-green-700"
              >
                شروع جلسه جدید
              </Button>
              {sessionId && (
                <Button onClick={resetChat} variant="outline" size="sm">
                  پاک کردن چت
                </Button>
              )}
            </div>

            {sessionId && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>جلسه فعال: {sessionId.substring(0, 8)}...</AlertDescription>
              </Alert>
            )}

            {/* Chat Interface */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  گفتگو با دستیار هوشمند
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>برای شروع گفتگو، ابتدا جلسه جدید ایجاد کنید</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user" ? "bg-blue-500" : "bg-gray-500"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {renderActions(message.actions)}
                        <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString("fa-IR")}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <Separator />

              <CardFooter className="p-4">
                <div className="flex gap-2 w-full">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={sessionId ? "پیام خود را بنویسید..." : "ابتدا جلسه جدید ایجاد کنید"}
                    disabled={!sessionId || isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || !sessionId || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ارسال
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Sample Queries */}
            <Card>
              <CardHeader>
                <CardTitle>نمونه سوالات برای تست</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">سوالات پزشک:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• اطلاعات بیمار Jane Doe را نشان بده</li>
                      <li>• برنامه ملاقات‌های امروز من چیست؟</li>
                      <li>• ملاقات‌های از دست رفته را نشان بده</li>
                      <li>• نتایج آزمایش Jane Doe را نشان بده</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">سوالات بیمار:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• قرار ملاقات‌های آینده من چیست؟</li>
                      <li>• داروهای من چه هستند؟</li>
                      <li>• نتایج آزمایش من را نشان بده</li>
                      <li>• می‌خواهم قرار ملاقات بگیرم</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            {connectionStatus !== "connected" ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>برای مدیریت داده‌ها، ابتدا به سرور متصل شوید.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Patients Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>بیماران</CardTitle>
                      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            افزودن بیمار
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>افزودن بیمار جدید</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              addPatient({
                                first_name: formData.get("first_name"),
                                last_name: formData.get("last_name"),
                                date_of_birth: formData.get("date_of_birth"),
                                gender: formData.get("gender"),
                                email: formData.get("email"),
                                phone: formData.get("phone"),
                              })
                            }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="first_name">نام</Label>
                                <Input name="first_name" required />
                              </div>
                              <div>
                                <Label htmlFor="last_name">نام خانوادگی</Label>
                                <Input name="last_name" required />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="date_of_birth">تاریخ تولد</Label>
                              <Input name="date_of_birth" type="date" required />
                            </div>
                            <div>
                              <Label htmlFor="gender">جنسیت</Label>
                              <Select name="gender" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">مرد</SelectItem>
                                  <SelectItem value="female">زن</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="email">ایمیل</Label>
                              <Input name="email" type="email" required />
                            </div>
                            <div>
                              <Label htmlFor="phone">تلفن</Label>
                              <Input name="phone" required />
                            </div>
                            <Button type="submit" className="w-full">
                              افزودن
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام</TableHead>
                          <TableHead>ایمیل</TableHead>
                          <TableHead>تلفن</TableHead>
                          <TableHead>جنسیت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients.map((patient) => (
                          <TableRow key={patient.id}>
                            <TableCell>
                              {patient.first_name} {patient.last_name}
                            </TableCell>
                            <TableCell>{patient.email}</TableCell>
                            <TableCell>{patient.phone}</TableCell>
                            <TableCell>{patient.gender === "male" ? "مرد" : "زن"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Doctors Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>پزشکان</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام</TableHead>
                          <TableHead>تخصص</TableHead>
                          <TableHead>ایمیل</TableHead>
                          <TableHead>تلفن</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctors.map((doctor) => (
                          <TableRow key={doctor.id}>
                            <TableCell>
                              {doctor.first_name} {doctor.last_name}
                            </TableCell>
                            <TableCell>{doctor.specialty}</TableCell>
                            <TableCell>{doctor.email}</TableCell>
                            <TableCell>{doctor.phone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Appointments Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>قرار ملاقات‌ها</CardTitle>
                      <Dialog open={isAddAppointmentOpen} onOpenChange={setIsAddAppointmentOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            افزودن قرار ملاقات
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>افزودن قرار ملاقات جدید</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              addAppointment({
                                patient_id: formData.get("patient_id"),
                                doctor_id: formData.get("doctor_id"),
                                date_time: new Date(formData.get("date_time") as string).toISOString(),
                                duration: Number.parseInt(formData.get("duration") as string),
                                appointment_type: formData.get("appointment_type"),
                                notes: formData.get("notes"),
                              })
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="patient_id">بیمار</Label>
                              <Select name="patient_id" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب بیمار" />
                                </SelectTrigger>
                                <SelectContent>
                                  {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                      {patient.first_name} {patient.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="doctor_id">پزشک</Label>
                              <Select name="doctor_id" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب پزشک" />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      {doctor.first_name} {doctor.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="date_time">تاریخ و زمان</Label>
                              <Input name="date_time" type="datetime-local" required />
                            </div>
                            <div>
                              <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
                              <Input name="duration" type="number" defaultValue="30" required />
                            </div>
                            <div>
                              <Label htmlFor="appointment_type">نوع ملاقات</Label>
                              <Input name="appointment_type" placeholder="مثال: ویزیت عمومی" required />
                            </div>
                            <div>
                              <Label htmlFor="notes">یادداشت</Label>
                              <Textarea name="notes" placeholder="یادداشت اختیاری" />
                            </div>
                            <Button type="submit" className="w-full">
                              افزودن
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>بیمار</TableHead>
                          <TableHead>پزشک</TableHead>
                          <TableHead>تاریخ</TableHead>
                          <TableHead>نوع</TableHead>
                          <TableHead>وضعیت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((appointment) => {
                          const patient = patients.find((p) => p.id === appointment.patient_id)
                          const doctor = doctors.find((d) => d.id === appointment.doctor_id)
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>{patient ? `${patient.first_name} ${patient.last_name}` : "نامشخص"}</TableCell>
                              <TableCell>{doctor ? `${doctor.first_name} ${doctor.last_name}` : "نامشخص"}</TableCell>
                              <TableCell>{new Date(appointment.date_time).toLocaleDateString("fa-IR")}</TableCell>
                              <TableCell>{appointment.appointment_type}</TableCell>
                              <TableCell>
                                <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                                  {appointment.status === "confirmed" ? "تایید شده" : appointment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Medical Records Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>سوابق پزشکی</CardTitle>
                      <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            افزودن سابقه پزشکی
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>افزودن سابقه پزشکی جدید</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              addMedicalRecord({
                                patient_id: formData.get("patient_id"),
                                doctor_id: formData.get("doctor_id"),
                                visit_date: new Date(formData.get("visit_date") as string).toISOString(),
                                diagnosis: formData.get("diagnosis"),
                                treatment: formData.get("treatment"),
                                notes: formData.get("notes"),
                              })
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="patient_id">بیمار</Label>
                              <Select name="patient_id" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب بیمار" />
                                </SelectTrigger>
                                <SelectContent>
                                  {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                      {patient.first_name} {patient.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="doctor_id">پزشک</Label>
                              <Select name="doctor_id" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب پزشک" />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      {doctor.first_name} {doctor.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="visit_date">تاریخ ویزیت</Label>
                              <Input name="visit_date" type="date" required />
                            </div>
                            <div>
                              <Label htmlFor="diagnosis">تشخیص</Label>
                              <Textarea name="diagnosis" required />
                            </div>
                            <div>
                              <Label htmlFor="treatment">درمان</Label>
                              <Textarea name="treatment" required />
                            </div>
                            <div>
                              <Label htmlFor="notes">یادداشت</Label>
                              <Textarea name="notes" placeholder="یادداشت اختیاری" />
                            </div>
                            <Button type="submit" className="w-full">
                              افزودن
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>بیمار</TableHead>
                          <TableHead>پزشک</TableHead>
                          <TableHead>تاریخ ویزیت</TableHead>
                          <TableHead>تشخیص</TableHead>
                          <TableHead>درمان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicalRecords.map((record) => {
                          const patient = patients.find((p) => p.id === record.patient_id)
                          const doctor = doctors.find((d) => d.id === record.doctor_id)
                          return (
                            <TableRow key={record.id}>
                              <TableCell>{patient ? `${patient.first_name} ${patient.last_name}` : "نامشخص"}</TableCell>
                              <TableCell>{doctor ? `${doctor.first_name} ${doctor.last_name}` : "نامشخص"}</TableCell>
                              <TableCell>{new Date(record.visit_date).toLocaleDateString("fa-IR")}</TableCell>
                              <TableCell className="max-w-xs truncate">{record.diagnosis}</TableCell>
                              <TableCell className="max-w-xs truncate">{record.treatment}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
