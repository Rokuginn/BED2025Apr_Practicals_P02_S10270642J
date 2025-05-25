// Get references to the form and message elements:
const createBookForm = document.getElementById("createBookForm");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

createBookForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the default browser form submission

  messageDiv.textContent = ""; // Clear previous messages

  // Collect data from the form inputs
  const titleInput = document.getElementById("title");
  const authorInput = document.getElementById("author");

  const newBookData = {
    title: titleInput.value,
    author: authorInput.value,
  };

  try {
    // Make a POST request to your API endpoint
    const response = await fetch(`${apiBaseUrl}/books`, {
      method: "POST", // Specify the HTTP method
      headers: {
        "Content-Type": "application/json", // Tell the API we are sending JSON
      },
      body: JSON.stringify(newBookData), // Send the data as a JSON string in the request body
    });

    // Check for API response status (e.g., 201 Created, 400 Bad Request, 500 Internal Server Error)
    const responseBody = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : { message: response.statusText };

    if (response.status === 201) {
      messageDiv.textContent = `Book created successfully! ID: ${responseBody.id}`;
      messageDiv.style.color = "green";
      createBookForm.reset(); // Clear the form after success
      console.log("Created Book:", responseBody);
    } else if (response.status === 400) {
      // Handle validation errors from the API (from Practical 04 validation middleware)
      messageDiv.textContent = `Validation Error: ${responseBody.message}`;
      messageDiv.style.color = "red";
      console.error("Validation Error:", responseBody);
    } else {
      // Handle other potential API errors (e.g., 500 from error handling middleware)
      throw new Error(
        `API error! status: ${response.status}, message: ${responseBody.message}`
      );
    }
  } catch (error) {
    console.error("Error creating book:", error);
    messageDiv.textContent = `Failed to create book: ${error.message}`;
    messageDiv.style.color = "red";
  }
});