import multer, { StorageEngine } from 'multer';
import path from "path";
import fs from "fs"
const currentDir = path.resolve("src/assets/images/movies")
const ddd = path.resolve()
console.log(ddd,"ddd");


/* local file delete logic image*/
export async function deleteImgFileFromImages(currentFilePath: string): Promise<void> {
  const deleteFilePath = path.join(currentDir, currentFilePath);

  if (fs.existsSync(deleteFilePath)) {
    try {
      await fs.promises.unlink(deleteFilePath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  } else {
    console.log("File does not exist");
  }
}
// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./src/assets/images/movies");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${file.originalname}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const fileTypes = /jpg|jpeg|png|gif|svg|SVG|JPG|JPEG|PNG|GIF/;
  const mimetype = fileTypes.test(file.mimetype);
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Invalid file format. Only jpg, jpeg, png, gif, svg files are allowed.'));
};

export const upload = multer({
  storage: storage,
  limits: { fieldSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});


