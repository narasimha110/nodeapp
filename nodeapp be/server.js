const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

// Database connection pool configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || "127.0.0.1",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASS || "",
  database: process.env.DATABASE || "students",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const port = 5000;

// Add a new student
app.post("/add_user", async (req, res) => {
  try {
    const { name, email, age, gender } = req.body;

    // Basic input validation
    if (!name || !email || !age || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (isNaN(age) || age <= 0) {
      return res.status(400).json({ message: "Invalid age" });
    }

    const sql =
      "INSERT INTO student_details (`name`, `email`, `age`, `gender`) VALUES (?, ?, ?, ?)";
    const values = [name, email, parseInt(age), gender];
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 1) {
      console.log(`Student added: ${name}, ${email}`);
      return res.json({ success: "Student added successfully" });
    } else {
      throw new Error("Failed to insert student");
    }
  } catch (err) {
    console.error("Error in /add_user:", err);
    return res.status(500).json({ message: "Something unexpected has occurred: " + err.message });
  }
});

// Get all students
app.get("/students", async (req, res) => {
  try {
    const sql = "SELECT * FROM student_details";
    const [results] = await pool.execute(sql);
    return res.json(results);
  } catch (err) {
    console.error("Error in /students:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get a specific student by ID
app.get("/get_student/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sql = "SELECT * FROM student_details WHERE `id` = ?";
    const [results] = await pool.execute(sql, [id]);
    return res.json(results);
  } catch (err) {
    console.error("Error in /get_student:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update a student's details
app.post("/edit_user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, age, gender } = req.body;

    // Basic input validation
    if (!name || !email || !age || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (isNaN(age) || age <= 0) {
      return res.status(400).json({ message: "Invalid age" });
    }

    const sql =
      "UPDATE student_details SET `name` = ?, `email` = ?, `age` = ?, `gender` = ? WHERE id = ?";
    const values = [name, email, parseInt(age), gender, id];
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 1) {
      console.log(`Student updated: ID ${id}`);
      return res.json({ success: "Student updated successfully" });
    } else {
      throw new Error("Student not found or no changes made");
    }
  } catch (err) {
    console.error("Error in /edit_user:", err);
    return res.status(500).json({ message: "Something unexpected has occurred: " + err.message });
  }
});

// Delete a student
app.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sql = "DELETE FROM student_details WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 1) {
      console.log(`Student deleted: ID ${id}`);
      return res.json({ success: "Student deleted successfully" });
    } else {
      throw new Error("Student not found");
    }
  } catch (err) {
    console.error("Error in /delete:", err);
    return res.status(500).json({ message: "Something unexpected has occurred: " + err.message });
  }
});

// Start the server
app.listen(port, async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("Database connected successfully");
    console.log(`Listening on port ${port}`);
  } catch (err) {
    console.error("Failed to connect to database:", err);
  }
});