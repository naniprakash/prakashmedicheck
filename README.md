# 🏥 Medicine Tracker - AI-Powered Medication Management

A comprehensive web application that helps users track their medications with intelligent features powered by machine learning.

## ✨ Features

### 🤖 Machine Learning Capabilities
- **Pill Recognition**: Upload photos to identify medications using CNN (MobileNetV2)
- **Adherence Prediction**: ML models predict likelihood of missing doses
- **Drug Interaction Warnings**: Intelligent checking for dangerous medication combinations
- **Smart Insights**: AI-powered recommendations to improve medication compliance

### 💊 Medication Management
- Add, edit, and delete medications
- Flexible scheduling with multiple daily doses
- Track medication history and logs
- Set start and end dates for treatments

### 📊 Analytics & Insights
- Visual adherence statistics (7/30/90 day views)
- Activity timeline and history
- Personalized recommendations
- Progress tracking with beautiful charts

### 🎨 Modern UI/UX
- Glassmorphism design with dark theme
- Smooth animations and transitions
- Fully responsive layout
- Intuitive navigation

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd medicine-tracker
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   python app.py
   ```
   Backend will run on `http://localhost:5000`

2. **Start the Frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## 📁 Project Structure

```
medicine-tracker/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── database.py            # SQLite database operations
│   ├── models/
│   │   ├── pill_recognition.py      # CNN pill recognition model
│   │   ├── adherence_predictor.py   # Adherence prediction ML
│   │   └── interaction_checker.py   # Drug interaction system
│   └── requirements.txt       # Python dependencies
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── MedicationList.jsx # Medication management
│   │   ├── PillScanner.jsx    # Camera/upload interface
│   │   └── Analytics.jsx      # Statistics and insights
│   ├── utils/
│   │   └── api.js            # API client
│   ├── App.jsx               # Main app component
│   └── index.css             # Design system
└── package.json              # Frontend dependencies
```

## 🧠 ML Models

### Pill Recognition
- **Architecture**: MobileNetV2 transfer learning
- **Input**: 224x224 RGB images
- **Output**: Medication name, confidence score, visual features
- **Classes**: 20+ common medications

### Adherence Predictor
- **Algorithm**: Random Forest Classifier
- **Features**: Time patterns, recent adherence, streaks, delays
- **Output**: Probability of adherence, risk level, recommendations

### Interaction Checker
- **Type**: Rule-based + knowledge graph
- **Database**: Common drug-drug interactions
- **Output**: Severity levels, descriptions, recommendations

## 🎯 Usage

### Adding a Medication
1. Click "Add Medication" button
2. Fill in medication details (name, dosage, frequency)
3. Set schedule times
4. Add optional notes
5. System automatically checks for interactions

### Scanning a Pill
1. Navigate to "Pill Scanner" tab
2. Upload or drag-and-drop pill image
3. AI identifies the medication
4. Review results and add to your list

### Tracking Adherence
1. View today's schedule on Dashboard
2. Mark doses as taken with one click
3. Check Analytics for insights
4. Review AI recommendations

## 🔒 Privacy & Security

- All data stored locally in SQLite database
- No external data transmission (except ML inference)
- HIPAA considerations for production deployment
- User data encryption recommended for production

## ⚠️ Disclaimer

This application is for tracking purposes only and should not replace professional medical advice. Always consult your healthcare provider for medical decisions.

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Vanilla CSS (Glassmorphism design)

**Backend:**
- Flask
- TensorFlow 2.15
- scikit-learn
- SQLite

**ML Libraries:**
- TensorFlow/Keras (Deep Learning)
- scikit-learn (Classical ML)
- Pillow (Image Processing)
- NumPy/Pandas (Data Processing)

## 📝 API Endpoints

### Medications
- `GET /api/medications` - Get all medications
- `POST /api/medications` - Add medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### ML Features
- `POST /api/ml/recognize-pill` - Identify pill from image
- `POST /api/ml/predict-adherence` - Predict adherence
- `POST /api/ml/check-interactions` - Check drug interactions

### Analytics
- `GET /api/analytics/adherence` - Get adherence stats
- `GET /api/analytics/dashboard` - Get dashboard data

## 🚧 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Cloud deployment
- [ ] User authentication
- [ ] Push notifications
- [ ] Integration with pharmacy APIs
- [ ] Voice reminders
- [ ] Family/caregiver sharing
- [ ] Export reports (PDF)

## 📄 License

This project is for educational and personal use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ using AI and Machine Learning
