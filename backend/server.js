import 'dotenv/config';
import connectDB from './src/config/db.js';
import app from './src/app.js';

connectDB();

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Stitched server running on port ${PORT}`));
