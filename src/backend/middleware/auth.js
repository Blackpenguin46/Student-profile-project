const logger = require('../config/logger');
const db = require('../config/database');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }

    // Add user info to request object for easy access
    req.user = {
        id: req.session.userId,
        role: req.session.userRole,
        email: req.session.userEmail
    };

    next();
};

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Convert single role to array for consistency
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.role)) {
            logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to access this resource'
            });
        }

        next();
    };
};

// Teacher authorization - shorthand for requireRole('teacher')
const requireTeacher = requireRole('teacher');

// Student authorization - shorthand for requireRole('student')
const requireStudent = requireRole('student');

// Admin authorization - shorthand for requireRole('admin')
const requireAdmin = requireRole('admin');

// Teacher or Admin authorization
const requireTeacherOrAdmin = requireRole(['teacher', 'admin']);

// Student ownership verification - ensures student can only access their own data
const requireStudentOwnership = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Admin and teachers can access any student data
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
        return next();
    }

    // For students, verify they can only access their own profile
    if (req.user.role === 'student') {
        try {
            // Get student profile ID from user ID
            const [profiles] = await db.query(
                'SELECT id FROM student_profiles WHERE user_id = ?',
                [req.user.id]
            );

            if (profiles.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student profile not found'
                });
            }

            const studentProfileId = profiles[0].id;
            
            // Check if the requested resource belongs to this student
            const resourceId = req.params.studentId || req.params.profileId || req.params.id;
            
            if (resourceId && parseInt(resourceId) !== studentProfileId) {
                logger.warn(`Student ${req.user.id} attempted to access resource ${resourceId} not belonging to them`);
                return res.status(403).json({
                    success: false,
                    message: 'You can only access your own data'
                });
            }

            // Add student profile ID to request for convenience
            req.studentProfileId = studentProfileId;
            next();
        } catch (error) {
            logger.error('Error verifying student ownership:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    } else {
        return res.status(403).json({
            success: false,
            message: 'Invalid user role'
        });
    }
};

// Teacher class access verification - ensures teacher can only access their own classes
const requireClassAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Admin can access all classes
    if (req.user.role === 'admin') {
        return next();
    }

    // Teachers can only access their own classes
    if (req.user.role === 'teacher') {
        try {
            const classId = req.params.classId;
            if (!classId) {
                return next(); // No specific class being accessed
            }

            const [classes] = await db.query(
                'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
                [classId, req.user.id]
            );

            if (classes.length === 0) {
                logger.warn(`Teacher ${req.user.id} attempted to access class ${classId} not belonging to them`);
                return res.status(403).json({
                    success: false,
                    message: 'You can only access your own classes'
                });
            }

            next();
        } catch (error) {
            logger.error('Error verifying class access:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    } else {
        return res.status(403).json({
            success: false,
            message: 'Only teachers can access class data'
        });
    }
};

// Optional authentication - doesn't require authentication but populates user if available
const optionalAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        req.user = {
            id: req.session.userId,
            role: req.session.userRole,
            email: req.session.userEmail
        };
    }
    next();
};

module.exports = {
    requireAuth,
    requireRole,
    requireTeacher,
    requireStudent,
    requireAdmin,
    requireTeacherOrAdmin,
    requireStudentOwnership,
    requireClassAccess,
    optionalAuth
};