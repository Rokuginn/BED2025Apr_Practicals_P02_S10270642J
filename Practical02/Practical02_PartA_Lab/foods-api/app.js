const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/hello", (req, res) => {
  res.send("Hello, world!");
});

let foods = [];

app.post("/foods", (req, res) => {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing." });
    }
    const { name, calories } = req.body;
    if (!name || calories == null) {
      return res
        .status(400)
        .json({ message: "Cannot create food: name and calories are required." });
    }
    const newFood = { id: Date.now(), name, calories };
    foods.push(newFood);
    res
      .status(201)
      .json({ message: "Food created successfully.", food: newFood });
  });

app.get("/foods", (req, res) => {
  const { name } = req.query;
  let results = foods;

  
  if (name) {
    results = foods.filter((f) => f.name.toLowerCase().includes(name.toLowerCase()));
    return res.json({
      message: `Found ${results.length} food(s) matching name filter.`,
      foods: results,
    });
  }

  // Return all foods if no query parameter is provided
  res.json({
    message: `Retrieved all foods (${results.length}).`,
    foods: results,
  });
});

app.put("/foods/:id", (req, res) => {
    const foodId = Number(req.params.id);
    const { name, calories } = req.body;
    if (!name || calories == null) {
      return res
        .status(400)
        .json({ message: "Cannot update: name and calories are required." });
    }
    const idx = foods.findIndex((f) => f.id === foodId);
    if (idx === -1) {
      return res
        .status(404)
        .json({ message: `No food found with id ${foodId}.` });
    }
    foods[idx] = { id: foodId, name, calories };
    res.json({
      message: `Food with id ${foodId} updated successfully.`,
      food: foods[idx],
    });
  });

  app.delete("/foods/:id", (req, res) => {
    const foodId = Number(req.params.id);
    const exists = foods.some((f) => f.id === foodId);
    if (!exists) {
      return res
        .status(404)
        .json({ message: `No food found with id ${foodId}.` });
    }
    foods = foods.filter((f) => f.id !== foodId);
    res.json({ message: `Food with id ${foodId} deleted successfully.` });
  });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});