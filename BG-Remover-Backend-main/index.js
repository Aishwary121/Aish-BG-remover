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

// IMPORTANT: CORS first, before any routes!
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://aish-bg-remover-gik8.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Preflight handling
app.options('*', cors());

app.get("/", (req, res) => {
  res.send("BG Remover API is running!");
});

app.get("/test", (req, res) => {
  res.json({ status: "API working", cors: "enabled" });
});

const upload = multer({ dest: "uploads/" });

// Create directories
['uploads', 'outputs'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    console.log("Request received from:", req.headers.origin);

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const inputPath = req.file.path;
    const outputPath = path.join('outputs', `${req.file.filename}.png`);
    const pythonScript = path.join(__dirname, 'remove_bg.py');

    const command = `python3 ${pythonScript} ${inputPath} ${outputPath}`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Python error:", stderr);
        // Clean up on error
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        return res.status(500).json({
          error: "Error processing image",
          details: stderr
        });
      }

      // Send file
      res.sendFile(path.resolve(outputPath), (sendErr) => {
        // Always clean up
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for all origins');
});
