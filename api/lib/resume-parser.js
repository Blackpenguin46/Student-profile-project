// Resume parsing utilities
// Note: This is a simplified parser for demonstration. In production, 
// you would use libraries like pdf-parse, mammoth, or external APIs

/**
 * Parse resume text to extract structured data
 * @param {string} text - Raw text from resume
 * @param {string} fileName - Original filename for context
 * @returns {Object} Parsed resume data
 */
function parseResumeText(text, fileName = '') {
    const result = {
        contact: {},
        skills: [],
        experience: [],
        education: [],
        confidence: {
            contact: 0,
            skills: 0,
            experience: 0,
            education: 0
        }
    };

    // Clean and normalize text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract contact information
    result.contact = extractContactInfo(cleanText);
    result.confidence.contact = calculateContactConfidence(result.contact);

    // Extract skills
    result.skills = extractSkills(cleanText);
    result.confidence.skills = result.skills.length > 0 ? 0.8 : 0.2;

    // Extract experience
    result.experience = extractExperience(cleanText, lines);
    result.confidence.experience = result.experience.length > 0 ? 0.7 : 0.3;

    // Extract education
    result.education = extractEducation(cleanText, lines);
    result.confidence.education = result.education.length > 0 ? 0.8 : 0.4;

    return result;
}

/**
 * Extract contact information from resume text
 */
function extractContactInfo(text) {
    const contact = {};

    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
        contact.email = emails[0];
    }

    // Phone extraction
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
        contact.phone = phones[0].replace(/\D/g, '').replace(/^1/, '');
    }

    // LinkedIn extraction
    const linkedinRegex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch) {
        contact.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    }

    // GitHub extraction
    const githubRegex = /github\.com\/([a-zA-Z0-9-]+)/i;
    const githubMatch = text.match(githubRegex);
    if (githubMatch) {
        contact.github = `https://github.com/${githubMatch[1]}`;
    }

    // Portfolio/website extraction
    const websiteRegex = /https?:\/\/(?!linkedin|github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
    const websites = text.match(websiteRegex);
    if (websites && websites.length > 0) {
        contact.portfolio = websites[0];
    }

    return contact;
}

/**
 * Extract skills from resume text
 */
function extractSkills(text) {
    const skills = [];
    
    // Common technical skills to look for
    const technicalSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
        'HTML', 'CSS', 'SASS', 'SCSS', 'Bootstrap', 'Tailwind',
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitLab', 'GitHub',
        'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
        'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'InDesign'
    ];

    // Common soft skills
    const softSkills = [
        'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
        'Project Management', 'Time Management', 'Creativity', 'Adaptability', 'Public Speaking',
        'Negotiation', 'Analytical', 'Detail-oriented', 'Multitasking', 'Collaboration'
    ];

    const allSkills = [...technicalSkills, ...softSkills];
    const textLower = text.toLowerCase();

    // Look for skills in the text
    allSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (textLower.includes(skillLower)) {
            // Determine category
            const category = technicalSkills.includes(skill) ? 'technical' : 'soft';
            
            // Estimate proficiency based on context
            let proficiency = 'intermediate';
            const skillContext = extractSkillContext(text, skill);
            
            if (skillContext.includes('expert') || skillContext.includes('advanced') || 
                skillContext.includes('senior') || skillContext.includes('lead')) {
                proficiency = 'expert';
            } else if (skillContext.includes('proficient') || skillContext.includes('experienced')) {
                proficiency = 'advanced';
            } else if (skillContext.includes('basic') || skillContext.includes('familiar') || 
                      skillContext.includes('beginner')) {
                proficiency = 'beginner';
            }

            skills.push({
                name: skill,
                category: category,
                proficiency: proficiency,
                context: skillContext.substring(0, 100)
            });
        }
    });

    return skills;
}

/**
 * Extract context around a skill mention
 */
function extractSkillContext(text, skill) {
    const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
    if (skillIndex === -1) return '';
    
    const start = Math.max(0, skillIndex - 50);
    const end = Math.min(text.length, skillIndex + skill.length + 50);
    
    return text.substring(start, end);
}

/**
 * Extract work experience from resume text
 */
function extractExperience(text, lines) {
    const experience = [];
    const experienceSection = findSection(lines, ['experience', 'work', 'employment', 'career']);
    
    if (experienceSection.length > 0) {
        let currentJob = null;
        
        for (let i = 0; i < experienceSection.length; i++) {
            const line = experienceSection[i];
            
            // Look for job titles and companies
            if (isJobTitle(line)) {
                if (currentJob) {
                    experience.push(currentJob);
                }
                
                currentJob = parseJobLine(line);
            } else if (currentJob && line.length > 20) {
                // Add description
                if (!currentJob.description) {
                    currentJob.description = line;
                } else {
                    currentJob.description += ' ' + line;
                }
            }
        }
        
        if (currentJob) {
            experience.push(currentJob);
        }
    }
    
    return experience;
}

/**
 * Extract education from resume text
 */
function extractEducation(text, lines) {
    const education = [];
    const educationSection = findSection(lines, ['education', 'academic', 'qualification']);
    
    if (educationSection.length > 0) {
        educationSection.forEach(line => {
            if (line.length > 10 && (
                line.toLowerCase().includes('university') ||
                line.toLowerCase().includes('college') ||
                line.toLowerCase().includes('bachelor') ||
                line.toLowerCase().includes('master') ||
                line.toLowerCase().includes('phd') ||
                line.toLowerCase().includes('degree')
            )) {
                const eduEntry = parseEducationLine(line);
                if (eduEntry) {
                    education.push(eduEntry);
                }
            }
        });
    }
    
    return education;
}

/**
 * Find a section in the resume by headers
 */
function findSection(lines, keywords) {
    const section = [];
    let inSection = false;
    let nextSectionStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // Check if this line is a section header
        const isHeader = keywords.some(keyword => 
            line.includes(keyword) && line.length < 50
        );
        
        if (isHeader) {
            inSection = true;
            continue;
        }
        
        // Check if we've hit another section
        if (inSection && isOtherSectionHeader(line)) {
            break;
        }
        
        if (inSection) {
            section.push(lines[i]);
        }
    }
    
    return section;
}

/**
 * Check if a line looks like a job title
 */
function isJobTitle(line) {
    const jobTitleIndicators = [
        'developer', 'engineer', 'manager', 'analyst', 'specialist', 'coordinator',
        'director', 'associate', 'intern', 'consultant', 'designer', 'architect'
    ];
    
    const lineLower = line.toLowerCase();
    return jobTitleIndicators.some(indicator => lineLower.includes(indicator)) &&
           line.length > 10 && line.length < 100;
}

/**
 * Check if a line is another section header
 */
function isOtherSectionHeader(line) {
    const sectionHeaders = [
        'skills', 'education', 'experience', 'projects', 'certifications',
        'awards', 'publications', 'references', 'interests', 'hobbies'
    ];
    
    return sectionHeaders.some(header => 
        line.includes(header) && line.length < 50
    );
}

/**
 * Parse a job line to extract position, company, and dates
 */
function parseJobLine(line) {
    const job = {
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
    };
    
    // Simple parsing - in production you'd want more sophisticated parsing
    const parts = line.split(/[,|@]|at\s+/i);
    
    if (parts.length >= 2) {
        job.position = parts[0].trim();
        job.company = parts[1].trim();
        
        // Look for dates
        const dateRegex = /\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi;
        const dates = line.match(dateRegex);
        
        if (dates && dates.length >= 1) {
            job.startDate = dates[0];
            if (dates.length >= 2) {
                job.endDate = dates[1];
            }
        }
    } else {
        job.position = line.trim();
    }
    
    return job;
}

/**
 * Parse an education line
 */
function parseEducationLine(line) {
    const education = {
        degree: '',
        field: '',
        institution: '',
        year: ''
    };
    
    // Extract year
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        education.year = yearMatch[0];
    }
    
    // Extract degree type
    const degreeTypes = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'diploma'];
    const degreeMatch = degreeTypes.find(type => 
        line.toLowerCase().includes(type)
    );
    if (degreeMatch) {
        education.degree = degreeMatch.charAt(0).toUpperCase() + degreeMatch.slice(1);
    }
    
    // Extract institution
    const institutionKeywords = ['university', 'college', 'institute', 'school'];
    const words = line.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        if (institutionKeywords.some(keyword => word.includes(keyword))) {
            // Take a few words around this as institution name
            const start = Math.max(0, i - 2);
            const end = Math.min(words.length, i + 3);
            education.institution = words.slice(start, end).join(' ');
            break;
        }
    }
    
    education.field = line.replace(education.degree, '').replace(education.institution, '').replace(education.year, '').trim();
    
    return education.degree || education.institution ? education : null;
}

/**
 * Calculate confidence score for contact information
 */
function calculateContactConfidence(contact) {
    let score = 0;
    if (contact.email) score += 0.4;
    if (contact.phone) score += 0.3;
    if (contact.linkedin) score += 0.2;
    if (contact.github || contact.portfolio) score += 0.1;
    
    return Math.min(score, 1.0);
}

/**
 * Extract text from PDF buffer (simplified - would use pdf-parse in production)
 */
function extractTextFromPDF(buffer) {
    // This is a placeholder - in production you would use pdf-parse or similar
    return Promise.resolve("This is sample extracted text from PDF. In production, use pdf-parse library.");
}

/**
 * Extract text from DOCX buffer (simplified - would use mammoth in production)
 */
function extractTextFromDOCX(buffer) {
    // This is a placeholder - in production you would use mammoth or similar
    return Promise.resolve("This is sample extracted text from DOCX. In production, use mammoth library.");
}

/**
 * Main function to parse resume file
 */
async function parseResumeFile(fileBuffer, fileName, fileType) {
    try {
        let extractedText = '';
        
        if (fileType === 'application/pdf') {
            extractedText = await extractTextFromPDF(fileBuffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await extractTextFromDOCX(fileBuffer);
        } else if (fileType === 'application/msword') {
            extractedText = await extractTextFromDOCX(fileBuffer); // Basic handling for .doc
        } else {
            throw new Error('Unsupported file type for parsing');
        }
        
        const parsedData = parseResumeText(extractedText, fileName);
        
        return {
            success: true,
            extractedText: extractedText,
            parsedData: parsedData,
            metadata: {
                fileName: fileName,
                fileType: fileType,
                textLength: extractedText.length,
                parsingDate: new Date().toISOString()
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            extractedText: '',
            parsedData: null
        };
    }
}

module.exports = {
    parseResumeFile,
    parseResumeText,
    extractContactInfo,
    extractSkills,
    extractExperience,
    extractEducation
};