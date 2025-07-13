const { query } = require('./lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    try {
        // Authenticate user
        const authResult = await authenticateToken(req);
        if (!authResult.success) {
            return sendError(res, 401, authResult.message);
        }

        const { user } = authResult;
        const { id } = req.query;

        if (req.method === 'POST') {
            // File Upload
            const contentType = req.headers['content-type'] || '';
            if (!contentType.includes('multipart/form-data')) {
                return sendError(res, 400, 'Content-Type must be multipart/form-data');
            }

            // Parse multipart form data manually
            const chunks = [];
            
            await new Promise((resolve, reject) => {
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', resolve);
                req.on('error', reject);
            });

            const buffer = Buffer.concat(chunks);
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

                    const dataStartIndex = part.indexOf('\r\n\r\n');
                    if (dataStartIndex !== -1) {
                        const fileDataBinary = part.substring(dataStartIndex + 4);
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

            // Validate file
            const allowedTypes = [
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg', 'image/png', 'image/jpg'
            ];

            if (!allowedTypes.includes(fileType)) {
                return sendError(res, 400, 'File type not allowed');
            }

            if (fileData.length > 5 * 1024 * 1024) {
                return sendError(res, 400, 'File too large. Maximum size: 5MB');
            }

            let category = 'document';
            if (fileType.startsWith('image/')) {
                category = 'profile_photo';
            } else if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
                category = 'resume';
            }

            // Store file
            const fileResult = await query(`
                INSERT INTO uploaded_files (
                    user_id, filename, original_filename, file_type, file_size, 
                    file_data, category, upload_ip
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, filename, original_filename, file_type, file_size, category, created_at
            `, [
                user.id, `${Date.now()}_${fileName}`, fileName, fileType, fileData.length,
                fileData, category, req.headers['x-forwarded-for'] || req.connection.remoteAddress
            ]);

            const uploadedFile = fileResult.rows[0];

            sendSuccess(res, {
                message: 'File uploaded successfully',
                file: {
                    id: uploadedFile.id,
                    filename: uploadedFile.original_filename,
                    file_type: uploadedFile.file_type,
                    file_size: uploadedFile.file_size,
                    category: uploadedFile.category,
                    created_at: uploadedFile.created_at,
                    download_url: `/api/files?id=${uploadedFile.id}`
                }
            });

        } else if (req.method === 'GET' && id) {
            // File Download
            const fileResult = await query(`
                SELECT id, user_id, filename, original_filename, file_type, 
                       file_size, file_data, category, created_at
                FROM uploaded_files 
                WHERE id = $1
            `, [id]);

            if (fileResult.rows.length === 0) {
                return sendError(res, 404, 'File not found');
            }

            const file = fileResult.rows[0];

            // Check access permissions
            const canAccess = user.role === 'teacher' || 
                             user.role === 'admin' || 
                             user.id === file.user_id;

            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            // Set headers for download
            res.setHeader('Content-Type', file.file_type);
            res.setHeader('Content-Length', file.file_size);
            
            if (file.file_type.startsWith('image/')) {
                res.setHeader('Content-Disposition', `inline; filename="${file.original_filename}"`);
            } else {
                res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
            }

            res.status(200).end(file.file_data);

        } else if (req.method === 'DELETE' && id) {
            // File Delete
            const fileResult = await query(`
                SELECT id, user_id, original_filename, category
                FROM uploaded_files 
                WHERE id = $1
            `, [id]);

            if (fileResult.rows.length === 0) {
                return sendError(res, 404, 'File not found');
            }

            const file = fileResult.rows[0];
            const canDelete = user.role === 'admin' || user.id === file.user_id;

            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete this file');
            }

            await query('DELETE FROM uploaded_files WHERE id = $1', [id]);

            sendSuccess(res, { message: 'File deleted successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Files API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}