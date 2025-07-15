# 🏠 HostelFlow - Smart Hostel Service Booking System

**HostelFlow** is a smart AI-powered hostel service management system. It streamlines hostel facility bookings like laundry, room cleaning, maintenance, and study spaces through an intuitive web interface, including voice assistant support.

---

## 📸 Demo Preview

![Dashboard Preview](/mnt/data/88a4545c-3546-49b1-ab21-6bc3c159d68f.jpg)

---

## ✨ Features

✅ **Smart Laundry Booking**
✅ **Room Cleaning Services**
✅ **Study Spaces Reservation**
✅ **Room Maintenance Requests**
✅ **Tech Support Helpdesk**
✅ **AI Voice Booking Assistant**
✅ **Reschedule & Cancel Bookings Easily**
✅ **Recent Booking History View**

---

## 🖥️ Tech Stack

| Stack        | Technology                               |
| ------------ | ---------------------------------------- |
| **Frontend** | React.js, TypeScript, Tailwind CSS, Vite |
| **Backend**  | Django Rest Framework (DRF)              |
| **Database** | MongoDB                                  |
| **AI Layer** | AI Voice Assistant using LLM APIs        |
| **State**    | React Hooks, Context API                 |
| **Auth**     | JWT Authentication                       |

---

## 📁 Project Structure

### Backend

```
backend/
│
├── AI/                  # AI Voice Assistant (views, models, urls)
│   ├── views.py
│   ├── models.py
│   └── ...
│
├── api/                 # Main Hostel Service API (Laundry, Room, Repairs)
│   ├── views.py
│   ├── serializers.py
│   ├── models.py
│   └── urls.py
│
├── backend/             # Django Project Settings
│   └── settings.py
│
├── manage.py
└── requirements.txt
```

---

### Frontend

```
hostel-flow-clean/
│
├── public/
│
└── src/
    ├── components/      # Reusable UI components (cards, buttons)
    ├── contexts/        # Global State Management
    ├── hooks/           # Custom React Hooks
    ├── lib/             # API Services
    ├── pages/           # Dashboard, Services, Bookings pages
    ├── services/        # API Communication Functions
    ├── App.tsx          # Main App Component
    └── main.tsx         # App Entry Point
│
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## ⚙️ Setup Instructions

### Backend (Django API)

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend (React Vite)

```bash
cd hostel-flow-clean
npm install
npm run dev
```

---

## 🧀 AI Voice Assistant Feature

* Book services using voice commands.
* AI recommends time slots based on availability.
* Dynamic AI-powered rescheduling.
* Chatbox with text and speech support.

---

## 🏆 Core Highlights

* ✅ AI-powered smart scheduling
* ✅ Clean UI with React + Tailwind
* ✅ Django Rest API with modular services
* ✅ End-to-End Service Booking System
* ✅ Reschedule, Cancel, and Manage Bookings





