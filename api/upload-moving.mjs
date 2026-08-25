import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: 5 * 1024 * 1024,
    },
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed",
        });
    }

    upload.array("photos", 5)(req, res, async (error) => {
        if (error) {
            console.error("Upload error:", error);

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        try {
            const files = req.files || [];

            // No photos
            if (files.length === 0) {
                return res.status(200).json({
                    success: true,
                    folder: null,
                    urls: [],
                });
            }

            // Unique folder
            const now = new Date();

            const folderName =
                `moving-${now.getFullYear()}-` +
                `${String(now.getMonth() + 1).padStart(2, "0")}-` +
                `${String(now.getDate()).padStart(2, "0")}-` +
                `${String(now.getHours()).padStart(2, "0")}-` +
                `${String(now.getMinutes()).padStart(2, "0")}-` +
                `${String(now.getSeconds()).padStart(2, "0")}-` +
                `${String(now.getMilliseconds()).padStart(3, "0")}`;

            const uploadDir = path.join(
                process.cwd(),
                "public",
                "uploads",
                folderName
            );

            fs.mkdirSync(uploadDir, {
                recursive: true,
            });

            const urls = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                let extension = ".jpg";

                if (file.mimetype === "image/png") {
                    extension = ".png";
                } else if (file.mimetype === "image/webp") {
                    extension = ".webp";
                }

                const filename = `photo-${i + 1}${extension}`;

                const filePath = path.join(
                    uploadDir,
                    filename
                );

                fs.writeFileSync(
                    filePath,
                    file.buffer
                );

                urls.push(
                    `/uploads/${folderName}/${filename}`
                );
            }

            return res.status(200).json({
                success: true,
                folder: folderName,
                urls,
            });

        } catch (error) {
            console.error("Save photos error:", error);

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    });
}