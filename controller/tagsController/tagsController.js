const tagsModel = require("../../models/tagsModel/tagsModel.js");

const createTagController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {name} = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tag name is required",
      });
    }

    const result = await tagsModel.createtags(
      name.trim().toLowerCase(),
      userId,
    );

    if (result.alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists",
      });
    }

    res.status(201).json({
      success: true,
      message: "Tag created",
      // data: result,
    });
  } catch (error) {
    console.error("Create Tag Error:", error);
    res.status(500).json({success: false});
  }
};

const updateTagController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {id} = req.params;
    const {name} = req.body;

    const result = await tagsModel.updateTag(
      id,
      name.trim().toLowerCase(),
      userId,
    );

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    if (result.alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists",
      });
    }

    res.json({
      success: true,
      message: "Tag updated",
    });
  } catch (error) {
    console.error("Update Tag Error:", error);
    res.status(500).json({success: false});
  }
};

const getTagsController = async (req, res) => {
  try {
    const tags = await tagsModel.getTags();

    res.json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({success: false});
  }
};

const deleteTagController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {id} = req.params;

    const result = await tagsModel.deleteTag(id, userId);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    res.json({
      success: true,
      message: "Tag deleted",
    });
  } catch (error) {
    console.error("Delete Tag Error:", error);
    res.status(500).json({success: false});
  }
};

module.exports = {
  createTagController,
  getTagsController,
  updateTagController,
  deleteTagController,
};
