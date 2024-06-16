import express from "express";
import { Request, Response } from 'express';
import  { body, validationResult } from "express-validator";
const router = express.Router();
import { pool } from "../../connection/configMysql"

const validateBody = [
  body('RoomID').notEmpty().isNumeric().withMessage('RoomID is required').toInt(),
  body('MovieID').notEmpty().isNumeric().withMessage('MovieID is required').toInt(),
  body('selectedSeats').isArray({ min: 1 }).withMessage('At least one selected seat is required'),
  body('show_datetime').notEmpty().isISO8601().withMessage('show_datetime must be a valid ISO8601 date').toDate(),
  body('SeatNumber').notEmpty().isNumeric().withMessage('SeatNumber is required and must be a number').toInt(),
];

router.post('/',validateBody, async (req:Request, res:Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { RoomID, MovieID, selectedSeats, show_datetime, SeatNumber } = req.body;

  try {
    const insertQuery = `INSERT INTO cinemaDB.Bookings (RoomID, MovieID, SeatID, DateAndTime, SeatNumber) VALUES (?, ?, ?, ?, ?)`;
    for (const SeatID of selectedSeats) {
      await pool.query(insertQuery, [RoomID, MovieID, SeatID, show_datetime, SeatNumber]);
    }

    return res.send({ success: true });
  } catch (error) {
    console.error('Error inserting booking:', error);
    return res.status(500).send({ success: false, error: 'An error occurred when booking movie.' });
  }
});

export default router;