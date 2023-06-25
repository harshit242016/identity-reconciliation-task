import connectionPool from './db.js';

const checkExistingContact = async (phoneNumber, email) => {
    const client = await connectionPool();
    try {
        const query = `
      SELECT *
      FROM contact
      WHERE phone_number = $1 OR email = $2;
    `;

        const values = [phoneNumber, email];
        const result = await client.query(query, values);
        const existingContact = result.rows.find(contact => contact.phone_number === phoneNumber || contact.email === email);

        return { isExistingContact: !!existingContact, userData: result.rows };
    } finally {
        client.release();
    }
};

export default checkExistingContact;
