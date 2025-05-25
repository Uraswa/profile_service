import pg from 'pg'


const {Pool} = pg;

// Конфигурация соединений
const dbConfig = {
    master: {
        user: 'postgres',
        host: 'localhost', // или IP мастера
        database: 'postgres',
        password: 'nice',
        port: 6600,
    },
    slaves: [
        {
            user: 'postgres',
            host: 'localhost', // или IP первого slave
            database: 'postgres',
            password: 'nice',
            port: 6601,
        },
        {
            user: 'postgres',
            host: 'localhost', // или IP второго slave
            database: 'postgres',
            password: 'nice',
            port: 6602,
        }
    ]
};


const masterPool = new Pool(dbConfig.master);
const slavePools = dbConfig.slaves.map(config => new Pool(config));


let currentSlaveIndex = 0;

function getSlavePool() {
    const pool = slavePools[currentSlaveIndex];
    currentSlaveIndex = (currentSlaveIndex + 1) % slavePools.length;
    return pool;
}


async function db_query(sql, values = [], isWriteQuery = false) {
    const pool = isWriteQuery ? masterPool : getSlavePool();

    return await pool.query(sql, values);

}


class ProfilesModel {
    async getUserProfile(userId, company_id) {
        let query = `
        SELECT user_id,
               nickname,
               description,
               birth_date
        FROM user_profiles
        WHERE user_id = $1`;

        let vars = [userId]
        if (company_id) {
            query += ` and company_id = $2`
            vars.push(company_id)
        }
        const result = await db_query(query, vars);
        return result.rows[0];
    }

    async getUserProfilesByIds(userIds, len) {
        let ids = "";
        userIds.forEach((v, i) => {
            ids += Number.parseInt(v).toString() + (i !== len - 1 ? ", " : "");
        });

        const query = `SELECT user_id, nickname
                   FROM user_profiles
                   WHERE user_id IN (${ids})`;

        const result = await db_query(query);
        return result.rows;
    }

    async getUserProfiles(profileName, company_id) {
        const query = `SELECT user_id, nickname
                   FROM user_profiles
                   WHERE nickname ILIKE $1 and company_id = $2`;
        const result = await db_query(query, ['%' + profileName + '%', company_id]);
        return result.rows;
    }

    async updateOrCreateUserProfile(userId, company_id, {nickname, description, birthDate}) {
        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');

            const existsResult = await client.query(
                `SELECT company_id
             FROM user_profiles
             WHERE user_id = $1`,
                [userId]
            );

            let result;
            if (existsResult.rows.length > 0) {

                if (existsResult.rows[0].company_id != company_id) {
                    throw new Error("Company id mismatch");
                    return;
                }


                result = await client.query(
                    `UPDATE user_profiles
                 SET 
                     nickname = $4,
                     description = $1,
                     birth_date  = $2
                 WHERE user_id = $3 RETURNING *`,
                    [description, birthDate ? birthDate : null, userId, nickname]
                );
            } else {

                result = await client.query(
                    `INSERT INTO user_profiles (user_id, nickname, description, birth_date, company_id)
                 VALUES ($1, $4, $2, $3, $5) RETURNING *`,
                    [userId, description, birthDate ? birthDate : null, nickname, company_id]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

}

export default new ProfilesModel();