import express, { Request, Response } from 'express';

const router = express.Router();
import { pool } from "../../connection/configMysql"
import { upload } from '../../services/multerImgPicker/imgPicker';

router.get("/",async (req, res) => {
  try {
    const query = `SELECT * FROM cinemaDB.rooms`;
    const [response] = await pool.query(query);
 
    res.send({ success: true, data: response });
  } catch (error) {
    res.status(500).send({ success: false, message: (error as any)?.message });
  }
});

router.delete("/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(`DELETE FROM Bookings WHERE RoomID = ?`, [roomId]);
    await connection.query(`DELETE FROM movies WHERE room_id = ?`, [roomId]);
    await connection.query(`DELETE FROM Seats WHERE RoomID = ?`, [roomId]);
    await connection.query(`DELETE FROM rooms WHERE id = ?`, [roomId]);

    await connection.commit();

    res.send({ success: true, message: "Room and associated seats successfully deleted!" });
  } catch (error) {
    console.error("Error deleting room:", error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
        res.status(500).send({ success: false, message: "Error during rollback:" });
      }
    }

    res.status(500).send({ success: false, message: "An error occurred while deleting the room" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put("/", upload.none(), async (req: Request, res: Response) => {
  const { title } = req.body;
  
  try {
    if (!title) {
      return res.status(400).send({ success: false, message: "Empty title" });
    } else {
      const roomQuery = `INSERT INTO rooms (name) VALUES (?)`;
      const [roomResult]:any = await pool.query(roomQuery, [title]);
      const roomId = roomResult.insertId;

      const seatPromises = [];
      for (let seatNumber = 1; seatNumber <= 80; seatNumber++) {
        const seatQuery = `INSERT INTO Seats (RoomID, SeatNumber) VALUES (?, ?)`;
        seatPromises.push(pool.query(seatQuery, [roomId, seatNumber]));
      }

      await Promise.all(seatPromises);
      res.send({ success: true, message: "Room and seats successfully added!" });
    }
  } catch (error) {
    console.error("Error inserting Room:", error);
    res.status(500).send({ success: false, message: "Error inserting Room" });
  }
});

router.post("/", upload.none(), async (req: Request, res: Response) => {
  const { id, title } = req.body;
  
  try {
    if (!id || !title) {
      return res.status(400).send({ success: false, message: "Empty title or id" });
    } else {
      const updateQuery = `UPDATE rooms SET name = ? WHERE id = ? `;
      await pool.query(updateQuery, [title,id]);

      res.send({ success: true, message: "Room successfully edited!" });
    }
  } catch (error) {
    console.error("Error editing Room:", error);
    res.status(500).send({ success: false, message: "Error editing Room" });
  }
});

export default router;