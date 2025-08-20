import mongoose from "mongoose";

export async function connectDB(){
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/file_parser_demo';
    try {
        await mongoose.connect(uri);
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Database failed to connect', err);
        process.exit(1);
    }
}