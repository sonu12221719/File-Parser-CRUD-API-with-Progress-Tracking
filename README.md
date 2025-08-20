# File-Parser-CRUD-API-with-Progress-Tracking

## 1. Setup instructions

Step 1. ```npm init -y```

Step 2. ```npm install bcryptjs busboy csv-parse dotenv express jsonwebtoken mongodb mongoose morgan rimraf uuid```

Step 3. Create File Structure

        file-parser-api/
        │
        ├── config/
        │   └── db.js
        │
        ├── models/
        │   ├── File.js
        │   ├── RowChunk.js
        │   └── User.js
        │
        ├── routes/
        │   ├── authRoutes.js
        │   └── fileRoutes.js
        │
        ├── controllers/
        │   ├── authController.js
        │   └── fileController.js
        │
        ├── services/
        │   └── fileService.js
        │
        ├── utils/
        │   ├── parser.js
        │   ├── progress.js
        │   └── hash.js
        │
        ├── middlewares/
        │   ├── auth.js
        │   └── errorHandler.js
        │
        └── uploads/
        │
        │── .env
        │── package.json
        ├── server.js

Step 4. Make Changes in package.json

        - Change ```"main":"index.js" to "main": "server.js"```
        - Added ```"type": "module"```
        - Add npm scripts to package.json

                "scripts":
                {
                    "start": "node src/server.mjs",
                    "dev": "nodemon src/server.mjs"
                }

Step 5. Setup Environment Variables

        PORT=3000
        MONGO_URI=mongodb://127.0.0.1:27017/file_parser_demo
        JWT_SECRET=sonu_kr_19
        ENABLE_AUTH=true
        JWT_EXPIRES_IN=1d
        ALLOW_REGISTRATION=true
    
Step 6. Run Command ```npm run dev``` Or ```npm start```



## 2. API documentation

