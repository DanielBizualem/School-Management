import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., "studentIdSequence"
    seq: { type: Number, default: 0 }
});

export const Counter = mongoose.model("Counter", counterSchema);