# My API Development Journey: Practicals 03-05

During these practicals, I learned how to structure an API using the MVC pattern. Here's what I discovered about each component:

In the Model layer, I saw firsthand how keeping database logic separate made the code cleaner. Working with `bookModel.js`, I learned to handle CRUD operations without mixing in HTTP or UI concerns. This made debugging database issues much simpler.

For the View layer, I got to build user interfaces with HTML/CSS/JavaScript. Through `students.html` and `student-script.js`, I learned how to create interactive pages that talk to my API. It was satisfying to see the frontend and backend working together while staying independent.

The Controller layer taught me about request handling. Building `studentController.js` showed me how to validate inputs and manage responses. I liked how controllers acted as traffic directors between the model and view.

Breaking out the frontend into its own layer had several benefits I hadn't expected:
- My API code became more focused on just handling data
- I could potentially build different frontends (like a mobile app) using the same API
- Testing became easier since I could check the API and UI separately
- When I needed to change how something looked, I didn't have to touch the backend code

The project really improved in Practical 04 when I added proper error handling. Learning about validation middleware and parameterized queries made me feel more confident about security. I especially appreciated how catching errors in specific layers made debugging much clearer.

My biggest challenge was managing database connections. Through trial and error, I learned to:
1. Use connection pools for better performance
2. Always close connections in finally blocks
3. Handle graceful shutdowns
4. Use try-catch consistently

Now when I need to add new features, the MVC structure gives me a clear path. Here's how I'd add a new genre field:

```javascript
// In my model:
const createBook = async (bookData) => {
    const { title, author, genre } = bookData;
    // Add genre to SQL query
};

// In my controller:
const validateBook = (req, res, next) => {
    if (!req.body.genre) {
        return res.status(400).json({ error: "Genre is required" });
    }
    next();
};

// In my view:
const bookElement = `
    <h3>${book.title}</h3>
    <p>Genre: ${book.genre}</p>
`;
```

The hands-on experience really helped concepts click. Reading about MVC is one thing, but actually building it made me understand why it's useful. I especially enjoyed seeing how proper validation caught errors before they hit the database, and how parameterized queries protected against SQL injection. These practicals turned theoretical concepts into practical skills I can use in real projects.