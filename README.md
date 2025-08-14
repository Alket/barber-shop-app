# Barber Shop Reservation System

A modern reservation management system for barber shops built with Next.js, TypeScript, and MongoDB.

## Features

- **Secure Authentication**: Admin login with persistent session storage
- **Client Management**: Add, edit, and search clients
- **Reservation System**: Create, edit, and delete appointments
- **Business Settings**: Configure business hours, services, and working days
- **Real-time Calendar**: View and manage daily schedules
- **Client History**: Track client appointment history
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Automatic logout after 24 hours of inactivity

## Setup Instructions

### Prerequisites

1. **MongoDB**: Make sure you have MongoDB installed and running locally, or use MongoDB Atlas
2. **Node.js**: Version 18 or higher
3. **pnpm**: Package manager (or npm/yarn)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd barber-shop-app
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory with:

   ```
   MONGODB_URI=mongodb://localhost:27017/barbershop
   ```

   If using MongoDB Atlas, use your connection string:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/barbershop
   ```

4. **Run the development server**:

   ```bash
   pnpm dev
   ```

5. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

The application will automatically seed the database with sample data on first run. If you need to reset the data, you can:

1. **Manually seed the database**:

   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

2. **Or visit the seed endpoint** in your browser:
   ```
   http://localhost:3000/api/seed
   ```

### Authentication

The app uses secure authentication with browser local storage for session persistence.

**Default Admin Credentials:**

- **Email**: admin@admin.com
- **Password**: admin111

**Features:**

- Persistent login across browser sessions
- Automatic logout after 24 hours of inactivity
- Secure token-based authentication
- User session management

## API Endpoints

### Clients

- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `PUT /api/clients` - Update a client

### Reservations

- `GET /api/reservations` - Get all reservations (supports date and clientId filters)
- `POST /api/reservations` - Create a new reservation
- `PUT /api/reservations` - Update a reservation
- `DELETE /api/reservations?id=<id>` - Delete a reservation

### Settings

- `GET /api/settings` - Get business settings
- `PUT /api/settings` - Update business settings

### Database

- `POST /api/seed` - Seed the database with sample data

## Database Schema

### Clients Collection

```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  notes: String,
  totalAppointments: Number,
  lastVisit: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Reservations Collection

```javascript
{
  _id: ObjectId,
  clientId: String,
  clientName: String,
  clientPhone: String,
  service: String,
  time: String,
  date: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Settings Collection

```javascript
{
  businessName: String,
  phone: String,
  email: String,
  address: String,
  startHour: Number,
  endHour: Number,
  appointmentDuration: Number,
  workingDays: {
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean,
    sunday: Boolean
  },
  services: [{
    id: String,
    name: String,
    duration: Number,
    price: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Database**: MongoDB
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Forms**: React Hook Form

## Development

### Project Structure

```
barber-shop-app/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main application
├── components/
│   └── ui/            # Reusable UI components
├── lib/
│   ├── api.ts         # API utility functions
│   ├── mongodb.ts     # MongoDB connection
│   └── utils.ts       # Utility functions
└── public/            # Static assets
```

### Key Features

1. **Real-time Data**: All data is stored in MongoDB and loaded dynamically
2. **Responsive Design**: Works seamlessly on desktop and mobile
3. **Error Handling**: Comprehensive error handling with user feedback
4. **Type Safety**: Full TypeScript support for better development experience
5. **Modern UI**: Clean, modern interface using Tailwind CSS and Radix UI

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `MONGODB_URI` environment variable in Vercel settings
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js. Make sure to:

1. Set the `MONGODB_URI` environment variable
2. Build the application with `pnpm build`
3. Start the production server with `pnpm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
