import express from "express";
const router = express.Router();
import { pool } from "../../connection/configMysql"

router.get("/:roomId/:show_datetime", async (req, res) => {
  const { roomId, show_datetime } = req.params;
  
  try {
    const query = `
      SELECT 
        s.id, 
        s.RoomID, 
        s.SeatNumber, 
        IF(b.SeatID IS NULL, 1, 0) AS Available
      FROM Seats s
      LEFT JOIN Bookings b ON s.id = b.SeatID AND s.RoomID = b.RoomID AND b.DateAndTime = ?
      WHERE s.RoomID = ?
    `;

    const [response] = await pool.query(query, [show_datetime, roomId]);

    res.send({ success: true, data: response });
  } catch (error) {
    res.status(500).send({ success: false, message: (error as any)?.message });
  }
});

export default router;