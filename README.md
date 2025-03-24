**Features:**
- Authorization & Authentication (JWT)
- Users can book tours & leave reviews
- Administrators can edit/delete reviews
-  Tour statistics
- - number of tours for each month in a given year,
- - average rating, duration & price (grouped by tour difficulty)
- - top 5 tours (based on average rating)

Stack:
- Express.js
- Mongoose

DataBase:
- MongoDB

Other Node packages used:
- dotenv (for storing configuration in the environment separate from code)
- morgan (an HTTP request logger middleware for Node.js)
- validator (a library of string validators and sanitizers)
- slugify (for string slugification)
-  **SECURITY RELATED**
- - jsonwebtoken (for JWT generation)
- - bcryptjs (for password encryption and decryption)
- - express-rate-limit (for IP rate-limiting)
- - helmet (for adding some security related HTTP headers)
- - hpp (for preventing parameter pollution)
- - express-mongo-sanitize (for data sanitization)
- - xss-clean (for protection againt Cross-Site scripting)

