import pkg from 'pg';

const {Pool} = pkg;

const connectionPool = async () => {
    const pool = new Pool({
      connectionString: 'postgresql://postgres:TFyTJPAjphZV3dz22aZJ@containers-us-west-178.railway.app:7562/railway' 
    });
    const client = await pool.connect();
    console.log(client);
    return client;
}

export default connectionPool;