// wrap each controller function with this,
// this returns a new anonymous function that will then
// be assigned to the controller
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); //catch is for promises that return an error
};
