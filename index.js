// Import required modules
import express from 'express';
import connectionPool from './utils/db.js';
import generalService from './services/generalService.js';
import checkExistingContact from './utils/contactUtils.js';
// Create an Express application
const app = express();
app.use(express.json());

// Create a POST endpoint to create a contact record
app.post('/identity', async (req, res) => {
  const { phoneNumber, email } = req.body;
  const client = await connectionPool();
  try {
    // Insert the contact record into the "contact" table
    const { isExistingContact, userData } = await checkExistingContact(phoneNumber, email);
    if (isExistingContact) {
      const phoneNumberExist = userData.find(contact => contact.phone_number === phoneNumber);
      const emailExist = userData.find(contact => contact.email === email);
      if (phoneNumberExist && emailExist) {
        //The update query where the first record will be converted to primary and second will 
        // move to secondary linkedPreference.
        userData.sort((a, b) => { a.createdAt < b.createdAt });
        const linkedId = userData[0].id, linkedPrecedence = 'secondary';
        const query = `Update contact 
        set linkedId = $1, linkprecedence = $2, updatedAt = NOW()
        where id = $3`;
        const values = [linkedId, linkedPrecedence, userData[1].id];
        await client.query(query, values);
        res.status(201).json({ message: 'Contact record updated successfully' });
      } else {
        //Create one more record in DB, where the linkedId is previous record Id and linkedPreference is secondary.
        const existingContact = userData.find(contact => contact.phone_number === phoneNumber || contact.email === email);
        const linkedId = existingContact.id, linkedPrecedence = 'secondary';
        const query = `
        INSERT INTO contact (phone_number, email, linkedid, linkprecedence, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id;
        `;
        const values = [phoneNumber, email, linkedId, linkedPrecedence];
        const result = await client.query(query, values);
        const createdContactId = result.rows[0].id;
        res.status(201).json({ id: createdContactId, message: 'Contact record created successfully' });
      }
    } else {
      let linkedId = null, linkedPrecedence = 'primary';
      const query = `
        INSERT INTO contact (phone_number, email, linkedid, linkprecedence, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id;
      `;
      const values = [phoneNumber, email, linkedId, linkedPrecedence];
      const result = await client.query(query, values);
      const createdContactId = result.rows[0].id;
      res.status(201).json({ id: createdContactId, message: 'Contact record created successfully' });
    }
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
