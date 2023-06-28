// Import required modules
import express from 'express';
import connectionPool from './utils/db.js';
import { updateUserData, createUserData } from './services/generalService.js';
import checkExistingContact from './utils/contactUtils.js';
// Create an Express application
const app = express();
app.use(express.json());

// Create a POST endpoint to create a contact record
app.post('/identity', async (req, res) => {
  const { phoneNumber, email } = req.body;
  let client = await connectionPool();
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
        await updateUserData(linkedId, linkedPrecedence, userData);
        let secondaryContactIds = [];
        const primaryContactId = userData[0].id;
        userData.map((contact) => {
         if(contact.id != primaryContactId){
          secondaryContactIds.push(contact.id);
         }
        });
        const emailsAssociated = [...new Set(userData.map(contact => contact.email))];
        const phoneNumbers = [...new Set(userData.map(contact => contact.phone_number))];

        const payload = {
          contact: {
            primaryContactId,
            emailsAssociated,
            phoneNumbers,
            secondaryContactIds
          }
        };
        res.status(201).json({ payload });
      } else if (phoneNumberExist) {
        //Create one more record in DB, where the linkedId is previous record Id and linkedPreference is secondary.
        const existingContact = userData.find(contact => contact.phone_number === phoneNumber || contact.email === email);
        const linkedId = phoneNumberExist.id, linkedPrecedence = 'secondary';
        const response = await createUserData(phoneNumber, email, linkedId, linkedPrecedence);
        const primaryContactId = existingContact.linkedid == null ? phoneNumberExist.id : phoneNumberExist.linkedid;
        const secondaryContactIds = userData.reduce((accumulator, contact) => {
          if (contact.linkedid && contact.linkedid == existingContact.id) {
            accumulator.push(contact.id);
          }
          return accumulator;
        }, []);
        secondaryContactIds.push(response.id);
        const emailsAssociated = [...new Set(userData.map((contact) => contact.email))];
        emailsAssociated.push(email);
        const phoneNumbersAssociated = [...new Set(userData.map(contact => contact.phone_number))];
        const payload = {
          contact: {
            primaryContactId,
            emailsAssociated,
            phoneNumbersAssociated,
            secondaryContactIds
          }
        };

        res.status(201).json(payload);
      } else if (emailExist) {
        //Create one more record in DB, where the linkedId is previous record Id and linkedPreference is secondary.
        const existingContact = userData.find(contact => contact.phone_number === phoneNumber || contact.email === email);
        const linkedId = existingContact.id, linkedPrecedence = 'secondary';
        const response = await createUserData(phoneNumber, email, linkedId, linkedPrecedence);
        const primaryContactId = existingContact.linkedid == null ? existingContact.id : existingContact.linkedid;
        const secondaryContactIds = userData.reduce((accumulator, contact) => {
          if (contact.linkedid && contact.linkedid == existingContact.id) {
            accumulator.push(contact.id);
          }
          return accumulator;
        }, []);
        const emailsAssociated = [...new Set(userData.map(contact => contact.email))];
        const phoneNumbersAssociated = [...new Set(userData.map(contact => contact.phone_number))];
        phoneNumbersAssociated.push(phoneNumber);
        const payload = {
          contact: {
            primaryContactId,
            emailsAssociated,
            phoneNumbersAssociated,
            secondaryContactIds
          }
        };
        res.status(201).json(payload);
      }
    } else {
      let linkedId = null, linkedPrecedence = 'primary';
      const response = await createUserData(phoneNumber, email, linkedId, linkedPrecedence);
      const primaryContactId = response.id;
      const emails = [email];
      const phoneNumbers = [phoneNumber];
      const secondaryContactIds = [];
      const responseData = {
        contact: {
          primaryContactId,
          emails,
          phoneNumbers,
          secondaryContactIds
        }
      };

      res.status(201).json(responseData);
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
