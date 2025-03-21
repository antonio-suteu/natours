const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

// make it possible to access environment variables
dotenv.config({ path: './config.env' });

const connStringDB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(connStringDB).then(() => {
  console.log('DB connection successfully established');
});

// READ JSON FILE
const dataToImport = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');
const dataObjectToImport = JSON.parse(dataToImport);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(dataObjectToImport);
    console.log('Data imported successfully');
  } catch (error) {
    console.error('Error importing data:', error);
  }
  process.exit();
};

// DELETE All Documents from a Collection
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
  process.exit();
};

// in terminal: node dev-data/data/import-dev-data.js --import
// OR
// node dev-data/data/import-dev-data.js --delete
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAllData();
}

console.log(process.argv);
