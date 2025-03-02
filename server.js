const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.warn('Waiting for requests...');
});
