// // import express from "express";
// // import multer from "multer";
// // import cors from "cors";
// // import fs from "fs";
// // import { exec } from "child_process";
// // import path from "path";
// // import mongoose from "mongoose";
// // import { MONGOURL, PORT } from "./key.js";

// // // const express = require("express");
// // // const multer = require("multer");
// // // const cors = require("cors");
// // // const fs = require("fs");
// // // const { exec } = require("child_process");
// // // const path = require("path");
// // // const mongoose = require ("mongoose")

// // const app = express();
// // app.get("/api/health", (req, res) => {
// //   res.send("Hello World");
// // });

// // app.use(
// //   cors({
// //     origin: function (origin, callback) {
// //       const allowedOrigins = [
// //        "https://bg-remover-frontend-seven.vercel.app",
// //         "http://localhost:5173",
// //         "http://localhost:5174",
// //       ];
// //       if (!origin || allowedOrigins.includes(origin)) {
// //         callback(null, true);
// //       } else {
// //         callback(new Error("Not allowed by CORS"));
// //       }
// //     },
// //     credentials: true,
// //   })
// // );

// // const upload = multer({ dest: "uploads/" });

// // app.post("/remove-bg", upload.single("image"), (req, res) => {
// //   const inputPath = req.file.path;
// //   const outputPath = `outputs/${req.file.filename}.png`;

// //   // Make sure output dir exists
// //   if (!fs.existsSync("outputs")) {
// //     fs.mkdirSync("outputs");
// //   }

// //   const command = `python3 remove_bg.py ${inputPath} ${outputPath}`;

// //   exec(command, (err, stdout, stderr) => {
// //     if (err) {
// //       console.error(stderr);
// //       return res.status(500).send("Error processing image");
// //     }

// //     res.sendFile(path.resolve(outputPath), () => {
// //       // Clean up files after response
// //       fs.unlinkSync(inputPath);
// //       fs.unlinkSync(outputPath);
// //     });
// //   });
// // });

// // mongoose
// //   .connect(MONGOURL)
// //   .then(() => console.log("Database connected successfully"))
// //   .catch((err) => console.log("something wrong", err));

// // app.listen(PORT, () => {
// //   console.log(`Server started on http://localhost:${PORT}`);
// // });

// import express from "express";
// import multer from "multer";
// import cors from "cors";
// import fs from "fs";
// import { exec } from "child_process";
// import path from "path";
// import mongoose from "mongoose";
// import { MONGOURL, PORT } from "./key.js";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// // ✅ Fix CORS (removed slash)
// // const allowedOrigins = [
// //   "https://bg-remover-frontend-seven.vercel.app", // no trailing slash!
// //   "http://localhost:5173",
// //   "http://localhost:5174",
// // ];

// app.use(cors({
//   origin: ["https://bg-remover-frontend-seven.vercel.app"],
//   credentials: true,
// }));
// // app.options("*", cors());

// const upload = multer({ dest: "uploads/" });

// app.post("/remove-bg", upload.single("image"), (req, res) => {
//   const inputPath = req.file.path;
//   const outputPath = `outputs/${req.file.filename}.png`;

//   if (!fs.existsSync("outputs")) {
//     fs.mkdirSync("outputs");
//   }

//   const command = `python3 remove_bg.py ${inputPath} ${outputPath}`;

//   exec(command, (err, stdout, stderr) => {
//     if (err) {
//       console.error("Error running Python:", stderr);
//       return res.status(500).send("Error processing image");
//     }

//     res.sendFile(path.resolve(outputPath), () => {
//       fs.unlinkSync(inputPath);
//       fs.unlinkSync(outputPath);
//     });
//   });
// });

// // MongoDB (if used)
// mongoose
//   .connect(MONGOURL)
//   .then(() => console.log("Database connected successfully"))
//   .catch((err) => console.log("Mongo error:", err));

// app.listen(PORT || 5000, () => {
//   console.log(`Server running at http://localhost:${PORT || 5000}`);
// });

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CRITICAL: Enable CORS for ALL origins with file upload support
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}));

// Handle preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BG Remover API is running!");
});

app.get("/test", (req, res) => {
  res.json({ status: "API working", cors: "enabled" });
});

// Configure multer with error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create output directory
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

// Main endpoint with detailed error handling
app.post("/remove-bg", upload.single("image"), (req, res) => {
  // Set CORS headers explicitly for this route
  res.header('Access-Control-Allow-Origin', '*');

  console.log("POST /remove-bg - Request received");

  if (!req.file) {
    console.log("No file in request");
    return res.status(400).json({ error: "No image file uploaded" });
  }

  console.log("File received:", req.file.filename);

  const inputPath = req.file.path;
  const outputPath = path.join('outputs', `${path.parse(req.file.filename).name}.png`);
  const pythonScript = path.join(__dirname, 'remove_bg.py');

  // Check if Python script exists
  if (!fs.existsSync(pythonScript)) {
    console.error("Python script not found at:", pythonScript);
    fs.unlinkSync(inputPath);
    return res.status(500).json({ error: "Server configuration error" });
  }

  const command = `python3 "${pythonScript}" "${inputPath}" "${outputPath}"`;
  console.log("Executing:", command);

  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
      console.error("Python error:", stderr || err.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).json({
        error: "Failed to process image",
        details: stderr || err.message
      });
    }

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      console.error("Output file not created");
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).json({ error: "Processing failed - no output generated" });
    }

    console.log("Sending processed image");

    // Send the processed image
    res.sendFile(path.resolve(outputPath), (sendErr) => {
      // Clean up files
      setTimeout(() => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 1000);
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}`);
});
