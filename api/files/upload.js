const { query } = require('../lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('../lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    try {
        // Authenticate user
        const authResult = await authenticateToken(req);
        if (!authResult.success) {
            return sendError(res, 401, authResult.message);
        }

        const { user } = authResult;

        // Check if request has file data
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return sendError(res, 400, 'Content-Type must be multipart/form-data');
        }

        // Parse multipart form data manually (simple implementation)
        const chunks = [];
        
        await new Promise((resolve, reject) => {
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', resolve);
            req.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        
        // Parse the multipart data
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
            return sendError(res, 400, 'Invalid multipart data');
        }

        const parts = buffer.toString('binary').split(`--${boundary}`);
        let fileData = null;
        let fileName = null;
        let fileType = null;

        for (const part of parts) {
            if (part.includes('Content-Disposition: form-data; name="file"')) {
                const lines = part.split('\r\n');
                const dispositionLine = lines.find(line => line.includes('Content-Disposition'));
                
                if (dispositionLine) {
                    const fileNameMatch = dispositionLine.match(/filename="([^"]+)"/);
                    if (fileNameMatch) {
                        fileName = fileNameMatch[1];
                    }
                }

                const contentTypeLine = lines.find(line => line.includes('Content-Type:'));
                if (contentTypeLine) {
                    fileType = contentTypeLine.split('Content-Type: ')[1].trim();
                }

                // Find the file data (after double CRLF)
                const dataStartIndex = part.indexOf('\r\n\r\n');
                if (dataStartIndex !== -1) {
                    const fileDataBinary = part.substring(dataStartIndex + 4);
                    // Remove trailing boundary
                    const endBoundary = fileDataBinary.lastIndexOf('\r\n--');
                    const cleanFileData = endBoundary !== -1 ? 
                        fileDataBinary.substring(0, endBoundary) : 
                        fileDataBinary;
                    
                    fileData = Buffer.from(cleanFileData, 'binary');
                }
                break;
            }
        }

        if (!fileData || !fileName) {
            return sendError(res, 400, 'No file uploaded');
        }

        // Validate file type and size
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];

        if (!allowedTypes.includes(fileType)) {
            return sendError(res, 400, 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG');
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileData.length > maxSize) {
            return sendError(res, 400, 'File too large. Maximum size: 5MB');
        }

        // Determine file category
        let category = 'document';
        if (fileType.startsWith('image/')) {
            category = 'profile_photo';
        } else if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
            category = 'resume';
        }

        // Store file in database
        const fileResult = await query(`
            INSERT INTO uploaded_files (
                user_id, filename, original_filename, file_type, file_size, 
                file_data, category, upload_ip
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, filename, original_filename, file_type, file_size, category, created_at
        `, [
            user.id,
            `${Date.now()}_${fileName}`, // Generate unique filename
            fileName,
            fileType,
            fileData.length,
            fileData,
            category,
            req.headers['x-forwarded-for'] || req.connection.remoteAddress
        ]);

        const uploadedFile = fileResult.rows[0];

        // If it's a profile photo, update user's profile
        if (category === 'profile_photo') {
            await query(`
                UPDATE student_profiles 
                SET profile_photo_id = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = $2
            `, [uploadedFile.id, user.id]);
        }

        // Log the upload activity
        await query(`
            INSERT INTO activity_logs (user_id, action, details)
            VALUES ($1, $2, $3)
        `, [
            user.id,
            'file_upload',
            {
                file_id: uploadedFile.id,
                filename: uploadedFile.original_filename,
                category: category,
                file_size: uploadedFile.file_size
            }
        ]);

        sendSuccess(res, {
            message: 'File uploaded successfully',
            file: {
                id: uploadedFile.id,
                filename: uploadedFile.original_filename,
                file_type: uploadedFile.file_type,
                file_size: uploadedFile.file_size,
                category: uploadedFile.category,
                created_at: uploadedFile.created_at,
                download_url: `/api/files/${uploadedFile.id}`
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        sendError(res, 500, 'File upload failed');
    }
}