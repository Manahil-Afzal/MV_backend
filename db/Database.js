const mongoose = require ("mongoose");

const connectDatabase = () =>{
       console.log(" MONGO_URI:", process.env.MONGO_URI);  
         
       mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
         useUnifiedTopology: true,
    })
    .then((data) => {
    console.log(`✅ MongoDB connected with server: ${data.connection.host}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
};
module.exports = connectDatabase;