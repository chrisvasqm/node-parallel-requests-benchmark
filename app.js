import 'dotenv/config';
import express, { json } from 'express';

const app = express();

app.use(json());

app.get('/', (_, res) => {
  res.json({ message: 'Welcome to the Express server!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
