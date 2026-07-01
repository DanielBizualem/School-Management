import bcrypt from "bcrypt";

const password = "admin123"; // The password you want to use
const saltRounds = 12; // Must match the value in your createAdmin controller

const hash = await bcrypt.hash(password, saltRounds);
console.log("HASHED PASSWORD:", hash);