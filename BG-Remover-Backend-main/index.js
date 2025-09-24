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
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// CRITICAL: CORS configuration BEFORE routes
const corsOptions = {
  origin: [
    'https://aish-bg-remover-gik8.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Test route
app.get("/", (req, res) => {
  res.send("BG Remover API is running!");
});

// Test route for debugging
app.get("/remove-bg", (req, res) => {
  res.json({ error: "Please use POST method to upload image" });
});

const upload = multer({ dest: "uploads/" });

// Ensure directories exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

// Main API route
app.post("/remove-bg", upload.single("image"), (req, res) => {
  console.log("POST request received");

  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const inputPath = req.file.path;
  const outputPath = `outputs/${req.file.filename}.png`;

  const pythonScript = path.join(__dirname, 'remove_bg.py');
  const command = `python3 ${pythonScript} ${inputPath} ${outputPath}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("Python error:", stderr);
      return res.status(500).json({ error: "Error processing image", details: stderr });
    }

    res.sendFile(path.resolve(outputPath), (err) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
