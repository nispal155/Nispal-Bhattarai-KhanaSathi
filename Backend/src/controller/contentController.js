const Content = require('../models/Content');

/**
 * @desc    Get content by slug
 * @route   GET /api/content/:slug
 * @access  Public
 */
exports.getContent = async (req, res) => {
    try {
        const content = await Content.findOne({ slug: req.params.slug });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content',
            error: error.message
        });
    }
};

/**
 * @desc    Update or create content
 * @route   POST /api/content/:slug
 * @access  Private/Admin
 */
exports.updateContent = async (req, res) => {
    try {
        const { title, content } = req.body;
        const slug = req.params.slug;

        let existingContent = await Content.findOne({ slug });

        if (existingContent) {
            existingContent.title = title || existingContent.title;
            existingContent.content = content || existingContent.content;
            existingContent.lastUpdatedBy = req.user._id;
            await existingContent.save();
        } else {
            existingContent = await Content.create({
                slug,
                title,
                content,
                lastUpdatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Content updated successfully',
            data: existingContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update content',
            error: error.message
        });
    }
};
