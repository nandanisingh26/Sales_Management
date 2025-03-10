const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/upload'); // ✅ Handles both file upload & fetching data
require("dotenv").config(); // ✅ Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Default route to prevent "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("🚀 Sales Management API is running!");
});

// ✅ Register your API routes
app.use('/api', uploadRoutes); // Now handles both `/api/upload` & `/api/sales`

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env file!");
  process.exit(1); // Exit process if MongoDB URI is missing
}

// ✅ Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Successfully connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1); // Exit process if connection fails
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
