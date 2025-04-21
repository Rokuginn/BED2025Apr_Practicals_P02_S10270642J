const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Welcome to Homework API!");
});

app.get("/Intro", (req, res) => {
    res.send("My Name is Ahmad and Im kinda Tired");
  });
  
app.get("/name", (req, res) => {
    res.send("Ahmad Danial Bin Azman");
  });
app.get("/Hobbies", (req, res) => {
    res.json(["Gaming", "Watching Videos", "Reading"]);
  });
  
app.get("/food", (req, res) => {
    res.send("i like noodles");
  });

  app.get("/student", (req, res) => {
    res.json({
      name: "Ahmad Danial Bin Azman",
      hobbies: ["Gaming", "Watching Videos", "Reading"],
      intro: "My Name is Ahmad and Im kinda Tired",
    });
  });
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

