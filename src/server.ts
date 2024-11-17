import express from 'express';
import { Router } from 'express';

const app = express();
const router = Router();

router.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(router);

const port = process.env.INNER_PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
