import express from 'express';
import cors from 'cors';

import config from './config.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    req.status(200).json({message:'Pravaha AI running'});
})

const server = app.listen(config.PORT, () => {
    console.log(`✅ Pravaha AI server is live on http://localhost:${config.PORT}`);
});

export default app;