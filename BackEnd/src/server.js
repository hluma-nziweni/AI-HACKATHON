const path = require('path');

// Load env variables from the project root so the shared backend/.env is used
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

const PORT = parseInt(process.env.PORT || 8080); 

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
