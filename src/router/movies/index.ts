import express, { Request, Response } from 'express';

const router = express.Router();
import { pool } from "../../connection/configMysql"
import { image_base_path } from "../../constants";
import { deleteImgFileFromImages, upload } from "../../services/multerImgPicker/imgPicker";
import dayjs from 'dayjs';

router.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const query = `
      SELECT 
        m.*, 
        CONCAT('${image_base_path}', m.poster) AS poster_url,
        TIMESTAMPADD(MINUTE, TIME_TO_SEC(m.duration) / 60, m.show_datetime) AS end_time,
        CASE
          WHEN TIMESTAMPADD(MINUTE, TIME_TO_SEC(m.duration) / 60, m.show_datetime) < NOW() THEN 0
          ELSE 1
        END AS Available
      FROM movies m
      JOIN rooms r ON m.room_id = r.id
      WHERE r.id = ?
    `;

    const [response] = await pool.query(query, [roomId]);
    res.send({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).send({ success: false, message: "Error fetching movies:" });
  }
});

router.delete("/:movieId", async (req: Request, res: Response) => {
  const { movieId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [queryImg]: any = await connection.query(`SELECT * FROM movies WHERE id = ?`, [movieId]);
    if (queryImg.length === 0) {
      return res.status(404).send({ success: false, message: "Movie not found" });
    }

    await connection.query(`UPDATE Bookings SET MovieID = NULL WHERE MovieID = ?`, [movieId]);
    await connection.query(`DELETE FROM movies WHERE id = ?`, [movieId]);

    await connection.commit();

    res.send({ success: true, message: "Movie and related references successfully deleted!" });
  } catch (error) {
    console.error("Error deleting movie:", error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    res.status(500).send({ success: false, message: "An error occurred while deleting the movie" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put("/", upload.array("photo"), async (req: Request, res: Response) => {
  const { id, title, show_datetime, duration } = req.body;
  const Files = req.files as Express.Multer.File[];

  try {
    if (!id || !title || !show_datetime || !duration) {
      return res.status(400).send({ success: false, message: "Empty room_id, title, show_datetime, or duration" });
    } else if (Files.length === 0) {
      return res.status(400).send({ success: false, message: 'No files uploaded' });
    } else {
      const poster = Files[0].filename; 
      const query = `
        INSERT INTO movies (room_id, title, poster, show_datetime, duration) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await pool.query(query, [id, title, poster, show_datetime, duration]);

      res.send({ success: true, message: "Movie successfully added!" });
    }
  } catch (error) {
    console.error("Error inserting movie:", error);
    res.status(500).send({ success: false, message: "Error inserting movie" });
  }
});

router.post("/", upload.array("photo"), async (req: Request, res: Response) => {
  const { id, title, show_datetime, duration } = req.body;
  const Files = req.files as Express.Multer.File[];

  try {
    if (!id || !title || !show_datetime || !duration) {
      return res.status(400).send({ success: false, message: "Empty id, title, show_datetime, or duration" });
    }
    const formattedShowDatetime = dayjs(show_datetime).format('YYYY-MM-DD HH:mm:ss');

    if (Files.length === 0) {
      const updateQuery = `
        UPDATE movies 
        SET title = ?, show_datetime = ?, duration = ?
        WHERE id = ?
      `;
      await pool.query(updateQuery, [title, formattedShowDatetime, duration, id]);

      res.send({ success: true, message: "Movie successfully updated!" });
    } else {
      const existingMovieQuery = `SELECT * FROM movies WHERE id = ?`;
      const [existingMovieRows]:any = await pool.query(existingMovieQuery, [id]);
      const poster = Files[0].filename;
      const formattedShowDatetime = dayjs(show_datetime).format('YYYY-MM-DD HH:mm:ss');
      deleteImgFileFromImages(existingMovieRows[0].poster);

      const updateQuery = `
        UPDATE movies 
        SET title = ?, poster = ?, show_datetime = ?, duration = ?
        WHERE id = ?
      `;
      
      await pool.query(updateQuery, [title, poster, formattedShowDatetime, duration, id]);

      res.send({ success: true, message: "Movie successfully updated!" });
    }
  } catch (error) {
    console.error("Error updating/inserting movie:", error);
    res.status(401).send({ success: false, message: "Error updating/inserting movie" });
  }
});


export default router;