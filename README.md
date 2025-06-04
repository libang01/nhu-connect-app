# NHU Connect - Namibia Hockey Union Mobile App

A comprehensive mobile application for the Namibia Hockey Union built with React Native and Expo, featuring team management, player registration, event coordination, and real-time communication.

## Features

### Core Functionality
- **User Authentication**: Role-based access (Admin, Team Manager, Player)
- **Team Registration**: Digital team registration and approval system
- **Player Management**: Player profiles and team affiliations
- **Event Management**: Event creation, browsing, and team entries
- **News Feed**: Real-time announcements and push notifications
- **Admin Dashboard**: Comprehensive management tools for NHU administrators

### User Roles
- **Players**: Register profile, join teams, view events and news
- **Team Managers**: Register teams, manage rosters, enter events
- **NHU Admins**: Full system management, approvals, content creation

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Navigation**: React Navigation 6
- **UI Components**: React Native Paper
- **Push Notifications**: Expo Notifications

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Functions (optional)

3. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Add app" and select Web
   - Copy the configuration object

4. Update `firebase.config.js` with your Firebase configuration:
   \`\`\`javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   \`\`\`

### Firestore Database Setup

Create the following collections in Firestore:

1. **users** - User profiles and roles
2. **teams** - Team registrations and information
3. **events** - Hockey events and tournaments
4. **news** - News articles and announcements
5. **eventEntries** - Team entries for events

### Security Rules

Add these Firestore security rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // Teams - managers can create, admins can approve
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.managerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Events - admins can create/update, all can read
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // News - admins can create/update, all can read
    match /news/{newsId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
\`\`\`

### Project Installation

1. Clone or download the project files

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Update the Firebase configuration in `firebase.config.js`

4. Start the development server:
   \`\`\`bash
   npx expo start
   \`\`\`

5. Scan the QR code with Expo Go app on your mobile device

## Running the App

### Development Mode
\`\`\`bash
# Start the Expo development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
\`\`\`

### Testing on Device
1. Install Expo Go from App Store (iOS) or Google Play Store (Android)
2. Scan the QR code displayed in terminal/browser
3. The app will load on your device

### Creating Admin User
1. Register a new account through the app
2. In Firebase Console, go to Firestore Database
3. Find the user document in the `users` collection
4. Update the `role` field to `"admin"`

## App Structure

\`\`\`
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── navigation/         # Navigation configuration
├── screens/           # App screens
│   ├── auth/          # Authentication screens
│   ├── admin/         # Admin dashboard
│   ├── teams/         # Team management
│   ├── events/        # Event management
│   ├── news/          # News and announcements
│   └── players/       # Player management
├── styles/            # Theme and styling
└── utils/             # Utility functions
\`\`\`

## Key Features Walkthrough

### User Registration & Authentication
- Email/password registration with role selection
- Automatic role assignment (Player/Manager)
- Secure authentication with Firebase Auth

### Team Management
- Team registration with approval workflow
- Team manager assignment
- Player roster management
- Status tracking (pending/approved/rejected)

### Event System
- Event creation by admins
- Event browsing and filtering
- Team entry submissions
- Registration deadline management

### News & Communication
- Real-time news feed
- Push notification support
- Admin content management
- Chronological news display

### Admin Dashboard
- System statistics overview
- Team approval management
- User and content management
- Quick action buttons

## Customization

### Theme Colors
Update colors in `src/styles/theme.js`:
\`\`\`javascript
export const colors = {
  primary: '#1E88E5',    // Cool blue
  secondary: '#D32F2F',  // Vibrant red
  background: '#FFFFFF', // White
  // ... other colors
};
\`\`\`

### Adding New Features
1. Create new screens in appropriate folders
2. Add navigation routes
3. Update Firebase security rules if needed
4. Add new Firestore collections as required

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Ensure all Firebase config values are correct
   - Check that Firebase services are enabled

2. **Push Notifications Not Working**
   - Test on physical device (not simulator)
   - Check notification permissions

3. **App Won't Load**
   - Clear Expo cache: `npx expo start -c`
   - Restart Metro bundler

4. **Authentication Issues**
   - Verify Firebase Auth is enabled
   - Check Firestore security rules

### Getting Help
- Check Expo documentation: https://docs.expo.dev/
- Firebase documentation: https://firebase.google.com/docs
- React Native Paper: https://reactnativepaper.com/

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Test on both iOS and Android
5. Update documentation for new features

## License

This project is developed for the Namibia Hockey Union. All rights reserved.
