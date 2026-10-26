import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// .env.local file se MONGODB_URI load karein agar direct node se run karein
try {
  process.loadEnvFile?.(".env.local");
} catch {
  // agar file na mile ya already set ho to ignore karein
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI nahi mila. .env.local check karein.");
  process.exit(1);
}

// 👇 Ye aap ke login credentials hain — jo chahein likh sakti hain
const email = "admin@storelo.com";
const password = "Admin123";
const name = "Storelo Admin";

await mongoose.connect(uri);

const passwordHash = await bcrypt.hash(password, 12);

await mongoose.connection.collection("admins").updateOne(
  { email },
  {
    $set: {
      name,
      email,
      passwordHash,
      role: "admin",
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  { upsert: true }
);

console.log("✅ Admin ready!");
console.log("   Email:    ", email);
console.log("   Password: ", password);

await mongoose.disconnect();
