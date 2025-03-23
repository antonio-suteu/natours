const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

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
const tours = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');
const toursObjectToImport = JSON.parse(tours);
const users = fs.readFileSync(`${__dirname}/users.json`, 'utf-8');
const usersObjectToImport = JSON.parse(users);
const reviews = fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8');
const reviewsObjectToImport = JSON.parse(reviews);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(toursObjectToImport);
    await User.create(usersObjectToImport, { validateBeforeSave: false });
    await Review.create(reviewsObjectToImport);

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
    await User.deleteMany();
    await Review.deleteMany();
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
