import express from 'express';
import http from 'http';
import cookieParser from "cookie-parser";
import cors from "cors";

import roomRouter from "./router/room";
import moviesRouter from "./router/movies";
import seatsRouter from "./router/seats";
import bookingRouter from "./router/booking";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/src/assets/images/movies",express.static("./src/assets/images/movies"));

app.use('/api/rooms',roomRouter);
app.use('/api/movies',moviesRouter);
app.use('/api/seats',seatsRouter);
app.use('/api/booking',bookingRouter);

app.get("/", (req, res) => {
    res.send('Hello, Cinema App!');
});

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});