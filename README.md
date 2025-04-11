([Click here to read the API Documentation](https://documenter.getpostman.com/view/15318955/2sB2cYbfVb))


**Features:**
- Authorization & Authentication (JWT)
- Users can book tours & leave reviews
- Administrators can edit/delete reviews
- Discover tours that begin within a specified location and radius
-  Tour statistics
- - number of tours for each month in a given year,
- - average rating, duration & price (grouped by tour difficulty)
- - top 5 tours (based on average rating)

Architecture: MVC
CSS: https://cssguidelin.es/#bem-like-naming

Stack:
- Express.js
- Mongoose
- Pug

Database:
- MongoDB

Other Node packages used:
- dotenv (for storing configuration in the environment separate from code)
- morgan (an HTTP request logger middleware for Node.js)
- multer (for uploading files)
- sharp (for resizing uploaded images)
- validator (a library of string validators and sanitizers)
- slugify (for string slugification)
- esbuild (for front end script bundling)
-  **SECURITY RELATED**
- - jsonwebtoken (for JWT generation)
- - bcryptjs (for password encryption and decryption)
- - express-rate-limit (for IP rate-limiting)
- - helmet (for adding some security related HTTP headers)
- - hpp (for preventing parameter pollution)
- - express-mongo-sanitize (for data sanitization)
- - xss-clean (for protection againt Cross-Site scripting)

