# Gear Zone Backend

> Backend API for the Gear Zone platform, built with Node.js, Express, and MongoDB.

## 📝 Description

Gear Zone Backend is a robust RESTful API designed to power the Gear Zone application. It handles user authentication, product management, and administrative functions. The system includes secure features such as JWT-based authentication, role-based access control (RBAC), and email-based password recovery. Real-time capabilities are supported via Socket.io.

## ✨ Features

### User Management

- **Authentication**: Secure Registration and Login with JWT.
- **Password Recovery**: Secure Forgot Password and Reset flows via Email (OTP).
- **Profile Management**: Update user details and passwords.
- **Account Control**: Deactivate and Reactivate accounts.
- **Role-Based Access**: Distinguish between `buyer` and `admin` roles.

### Product Management

- **CRUD Operations**: Create, Read, Update, and Delete products.
- **Search & Filtering**: Filter products by category, price, etc.
- **Pagination**: Efficient data loading with pagination support.

### Real-Time Features

- **Socket.io**: Real-time communication support (configured and ready).

### Security

- **Bcrypt**: Password hashing.
- **JWT**: Stateless authentication tokens.
- **Middleware**: Custom `verifyToken` and `allowedTo` middlewares for route protection.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [bcrypt](https://www.npmjs.com/package/bcrypt)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Real-Time**: [Socket.io](https://socket.io/)

## 🚀 Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB installed locally or a MongoDB Atlas connection string.

### Steps

1.  **Clone the repository**

    ```bash
    git clone https://github.com/MustafaGaberr/gear-zone-backend.git
    cd gear-zone-backend
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You can use `.env.example` as a reference.

    ```bash
    cp .env.example .env
    ```

    Populate the variables in `.env`:

    ```env
    PORT=3000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_email@gmail.com
    SMTP_PASSWORD=your_email_app_password
    ```

4.  **Run the application**

    ```bash
    # Development mode (with nodemon)
    npm run dev

    # Production mode
    npm start
    ```

## 📂 Project Structure

```
gear-zone-backend/
├── controllers/      # Logic for handling API requests
├── middleware/       # Custom middleware (Auth, Roles)
├── models/           # Mongoose schemas and models
├── routes/           # API route definitions
├── Utilities/        # Helper functions (Email, HttpError, Socket)
├── index.js          # App entry point
└── package.json      # Dependencies and scripts
```

## 🔌 API Reference

### Auth & Users

| Method   | Endpoint                    | Description            | Access |
| :------- | :-------------------------- | :--------------------- | :----- |
| `POST`   | `/api/users/register`       | Register a new user    | Public |
| `POST`   | `/api/users/login`          | Login user             | Public |
| `POST`   | `/api/users/forgotpassword` | Request password reset | Public |
| `PUT`    | `/api/users/resetpassword`  | Reset password         | Public |
| `GET`    | `/api/users`                | Get all users          | Admin  |
| `DELETE` | `/api/users/:id`            | Delete a user          | Admin  |

### Products

| Method   | Endpoint            | Description        | Access         |
| :------- | :------------------ | :----------------- | :------------- |
| `GET`    | `/api/products`     | Get all products   | Public         |
| `GET`    | `/api/products/:id` | Get single product | Public         |
| `POST`   | `/api/products`     | Create product     | Admin (Likely) |
| `PUT`    | `/api/products/:id` | Update product     | Admin (Likely) |
| `DELETE` | `/api/products/:id` | Delete product     | Admin (Likely) |

---

<p align="center">Made with ❤️ for Gear Zone</p>
