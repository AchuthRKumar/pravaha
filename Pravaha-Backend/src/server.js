import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import announcementRoutes from './routes/announcementRoutes.js';
import companySearchRoutes from './routes/companySearchRoutes.js';

import config from './config.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({message:'Pravaha AI running'});
})
app.use('/api', announcementRoutes);
app.use('/api',companySearchRoutes);

server.listen(config.PORT, () => {
    console.log(`✅ Pravaha AI server is live on http://localhost:${config.PORT}`);
    console.log(`✅ Socket.IO is listening for connections.`);
});

export { io };
export default app;