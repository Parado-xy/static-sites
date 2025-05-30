
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

/**
 * Upload image to S3
 */
router.post('/upload/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Generate unique filename
        const uniqueFilename = `${Date.now()}-${uuidv4()}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const key = process.env.AWS_S3_FOLDER ? 
            `${process.env.AWS_S3_FOLDER}/${uniqueFilename}` : 
            uniqueFilename;

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const uploadResult = await s3.upload(params).promise();

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: uploadResult.Location,
                key: uploadResult.Key,
                bucket: uploadResult.Bucket
            }
        });

    } catch (error) {
        console.error('S3 Upload Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
});

/**
 * Delete image from S3
 */
router.delete('/delete/:key', async (req, res) => {
    try {
        const key = req.params.key;
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        };

        await s3.deleteObject(params).promise();

        return res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('S3 Delete Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: error.message
        });
    }
});

module.exports = router;