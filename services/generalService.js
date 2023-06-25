import connectionPool from '../utils/db.js';
let client = await connectionPool();

const updateUserData = async (linkedId, linkedPrecedence,userData) => {
    const query = `Update contact 
    set linkedId = $1, linkprecedence = $2, updatedAt = NOW()
    where id = $3`;
    const values = [linkedId, linkedPrecedence, userData[1].id];
    await client.query(query, values);
    return {response};
}

const createUserData = async(phoneNumber, email, linkedId, linkedPrecedence) => {
    const query = `
    INSERT INTO contact (phone_number, email, linkedid, linkprecedence, createdAt, updatedAt)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id;
    `;
    const values = [phoneNumber, email, linkedId, linkedPrecedence];
    const result = await client.query(query, values);
    const createdContactId = result.rows[0].id;
    return { id: createdContactId, message: 'Contact record created successfully' };
}

export { 
    updateUserData,
    createUserData,
};
