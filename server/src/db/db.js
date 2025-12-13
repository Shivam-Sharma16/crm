const mongoose=require('mongoose')


async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('connected to db');
        
        // Drop old username index if it exists (migration fix)
        // This fixes the E11000 duplicate key error for username field
        try {
            const User = mongoose.connection.collection('users');
            const indexes = await User.indexes();
            const usernameIndex = indexes.find(idx => idx.name === 'username_1');
            
            if (usernameIndex) {
                await User.dropIndex('username_1');
                console.log('✓ Dropped old username_1 index (migration fix)');
            }
        } catch (indexError) {
            // Index might not exist, ignore error
            if (indexError.code !== 27 && indexError.codeName !== 'IndexNotFound') {
                console.log('Note: Could not check/drop username index:', indexError.message);
            }
        }
    } catch (err) {
        console.log('Database connection error:', err);
    }
}

module.exports=connectDB
