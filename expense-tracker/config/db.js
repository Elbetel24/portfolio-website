const path = require('path');
const { Sequelize } = require('sequelize');

let sequelize;
// If SQLITE_FILE is set or no MSSQL_URI, use SQLite (zero-config)
if (process.env.SQLITE_FILE || !process.env.MSSQL_URI) {
  const storage = process.env.SQLITE_FILE || path.join(__dirname, '..', 'database.sqlite');
  sequelize = new Sequelize({ dialect: 'sqlite', storage, logging: false });
} else {
  const uri = process.env.MSSQL_URI;
  sequelize = new Sequelize(uri, {
    dialect: 'mssql',
    dialectOptions: { options: { encrypt: false } },
    logging: false
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (err) {
    console.error('DB connection error:', err.message || err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
