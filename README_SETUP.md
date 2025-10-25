# Nutrition Tracker Setup Guide

## Firebase Configuration

The app is pre-configured with Firebase credentials. To set up your Firebase project:

### 1. Enable Authentication
1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Save changes

### 2. Create Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in production mode
4. Choose your region
5. Click "Enable"

### 3. Apply Security Rules
1. Go to Firestore Database → Rules tab
2. Copy the contents of `firestore.rules` file
3. Paste into the rules editor
4. Click "Publish"

### 4. Create Composite Index (Required)
For the query that orders by date and filters by uid, you need to create a composite index:

1. Go to Firestore Database → Indexes tab
2. Click "Create Index"
3. Collection ID: `dailyNutrients`
4. Add fields:
   - Field: `uid`, Order: Ascending
   - Field: `date`, Order: Descending
5. Query scope: Collection
6. Click "Create Index"

Alternatively, when you first run the app and add data, Firebase will provide a direct link to create the required index in the browser console error message.

## Running the App

```bash
npm install
npm run dev
```

## Features

- **Authentication**: Email/password login with Firebase Auth
- **Data Management**: CRUD operations for daily nutrition entries
- **Trends Analysis**: Linear regression slopes and split-half median comparisons
- **Visualizations**: Pie charts showing macro distributions
- **Range Filters**: View data for previous days, all time, or specific day ranges (3, 7, 30)
- **CSV Export**: Export all data with averages and medians
- **Theme Toggle**: Persistent dark/light mode
- **Sortable Table**: Click columns to sort (3-click cycle behavior)

## Data Structure

### Users Collection (`users/{uid}`)
```typescript
{
  theme: 'light' | 'dark',
  targets: {
    calories: number,
    carbs: number,
    sugar: number,
    protein: number,
    fiber: number,
    fat: number,
    sodium: number,
    deficit: number
  }
}
```

### Daily Nutrients Collection (`dailyNutrients`)
```typescript
{
  uid: string,
  date: string, // YYYY-MM-DD
  calories: number,
  caloriesBurned: number, // defaults to 2000
  carbs: number,
  sugar: number,
  protein: number,
  fiber: number,
  fat: number,
  sodium: number
}
```

## Key Features Implemented

✅ Email/password authentication with auto-redirect
✅ Per-user theme and targets persistence
✅ Sortable entries table with deficit calculation
✅ Add/Edit day modal with live calorie calculations
✅ Targets management modal
✅ Trends cards with avg/median and trend arrows
✅ Range filters (prev, all, 3, 7, 30 days)
✅ Average macro pie chart + daily pies
✅ CSV export with proper formatting
✅ Special deficit formatting (positive = deficit, negative = "+X" surplus)
✅ Linear regression and split-half median trends
✅ 3-click column sort behavior
✅ Firestore security rules
