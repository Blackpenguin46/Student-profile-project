const { query } = require('../lib/db');
const { 
    sendError, 
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

    try {
        // Authenticate user
        const authResult = await authenticateToken(req);
        if (!authResult.success) {
            return sendError(res, 401, authResult.message);
        }

        const { user } = authResult;
        const { id } = req.query;

        // Validate file ID
        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 400, 'Invalid file ID');
        }

        const fileId = parseInt(id);

        if (req.method === 'GET') {
            // Download file
            const fileResult = await query(`
                SELECT id, user_id, filename, original_filename, file_type, 
                       file_size, file_data, category, created_at
                FROM uploaded_files 
                WHERE id = $1
            `, [fileId]);

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

            // Set appropriate headers for file download
            res.setHeader('Content-Type', file.file_type);
            res.setHeader('Content-Length', file.file_size);
            res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
            
            // For images, allow inline display
            if (file.file_type.startsWith('image/')) {
                res.setHeader('Content-Disposition', `inline; filename="${file.original_filename}"`);
            }

            // Log the download
            await query(`
                INSERT INTO activity_logs (user_id, action, details)
                VALUES ($1, $2, $3)
            `, [
                user.id,
                'file_download',
                {
                    file_id: fileId,
                    filename: file.original_filename,
                    downloaded_by: user.id
                }
            ]);

            // Send the file data
            res.status(200).end(file.file_data);

        } else if (req.method === 'DELETE') {
            // Delete file
            const fileResult = await query(`
                SELECT id, user_id, original_filename, category
                FROM uploaded_files 
                WHERE id = $1
            `, [fileId]);

            if (fileResult.rows.length === 0) {
                return sendError(res, 404, 'File not found');
            }

            const file = fileResult.rows[0];

            // Check permissions - only file owner or admins can delete
            const canDelete = user.role === 'admin' || user.id === file.user_id;

            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete this file');
            }

            // If it's a profile photo, remove reference from profile
            if (file.category === 'profile_photo') {
                await query(`
                    UPDATE student_profiles 
                    SET profile_photo_id = NULL, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = $1 AND profile_photo_id = $2
                `, [file.user_id, fileId]);
            }

            // Delete the file
            await query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);

            // Log the deletion
            await query(`
                INSERT INTO activity_logs (user_id, action, details)
                VALUES ($1, $2, $3)
            `, [
                user.id,
                'file_delete',
                {
                    file_id: fileId,
                    filename: file.original_filename,
                    deleted_by: user.id
                }
            ]);

            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('File API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}