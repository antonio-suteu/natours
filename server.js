const mongoose = require('mongoose');
const dotenv = require('dotenv');

// synchrounous exceptions handler
// THIS HAS TO BE AT THE TOP
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION - Shutting down 💣...');
  console.error(err.name, err.message);
  process.exit(1); // exit the process with an error
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const connStringDB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(connStringDB).then(() => {
  console.log('DB connection successfully established');
});

const port = process.env.PORT || 8000;
const hostname = 'localhost';
const server = app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.warn('Waiting for requests...');
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED EXCEPTION - Shutting down 💣...');
  console.error(err.name, err.message);
  // closing the server gracefully
  server.close(() => {
    process.exit(1); // exit the process with an error
  });
});
