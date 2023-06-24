// Import required modules
import express from 'express';
import connectionPool from './utils/db.js';

// Create an Express application
const app = express();
app.use(express.json());

// Create a POST endpoint to create a contact record
app.post('/identity', async (req, res) => {
  console.log(req.body);
  const { phoneNumber, email } = req.body;
  const client = await connectionPool();

  try {
    // Insert the contact record into the "contact" table
    const query = `
      INSERT INTO contact (phone_number, email, createdAt, updatedAt)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id;
    `;

    const values = [phoneNumber, email];
    const result = await client.query(query, values);
    const createdContactId = result.rows[0].id;

    res.status(201).json({ id: createdContactId, message: 'Contact record created successfully' });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
