import connectDB from "./config/db.js";
import plan from "./models/plan.js";

await connectDB();
await plan.deleteMany();

await plan.insertMany([
    {
        name: "Basic",
        price: 10,
        features: ["Access to basic content", "Community support"],
        tokens: 100,
        bonustokens: 10
    },
    {
        name: "Pro Plan",
        price: 20,
        features: ["Access to all content", "Priority support", "Exclusive webinars"],
        tokens: 250,
        bonustokens: 25
    },
    {
        name: "Premium Plan",
        price: 30,
        features: ["All Pro features", "1-on-1 mentorship", "Early access to new content"],
        tokens: 500,
        bonustokens: 50
    }
]);

console.log("Plans seeded successfully");
process.exit();