const videoModel = require("../../models/Videos/videoModel.js");
const fs = require("fs");
const path = require("path");

// ADD VIDEO
const addVideoController = async (req, res) => {
  try {
    const {
      title,
      description,
      duration_seconds,
      category_id,
      is_featured,
      is_active,
      tags
    } = req.body;

    // const tag_ids = tags ? tags.split(",").map(t => t.trim()) : [];

    const videoFile = req.files.video ? req.files.video[0] : null;

    if (!videoFile) {
      return res.status(400).json({ message: "Video file required" });
    }

    const video_url = "videos/" + videoFile.filename;

    const result = await videoModel.addVideo(
      title,
      description,
      video_url,
      null,
      duration_seconds,
      category_id,
      is_featured,
      is_active,
      tags
    );

    res.json({ message: "Video added", result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
};

// GET VIDEO
const getVideosController = async (req, res) => {
  try {
    const {id, title} = req.query;

    const data = await videoModel.getVideos(id, title);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Video Error:", error);
    res.status(500).json({message: "Internal server error"});
  }
};

// UPDATE VIDEO
const updateVideoController = async (req, res) => {
  try {
    const {id} = req.params;

    const {
      title,
      description,
      duration_seconds,
      category_id,
      is_featured,
      is_active,
    } = req.body;

    const videoFile = req.files.video ? req.files.video[0] : null;

    let video_url = null;

    if (videoFile) {
      video_url = "videos/" + videoFile.filename;
    }

    const result = await videoModel.updateVideo(
      id,
      title,
      description,
      video_url,
      null,
      duration_seconds,
      category_id,
      is_featured,
      is_active,
    );

    if (result.notFound) {
      return res.status(404).json({
        message: "Video not found",
      });
    }

    res.json({
      message: "Video updated successfully",
    });
  } catch (error) {
    console.error("Update Video Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// DELETE VIDEO
const deleteVideoController = async (req, res) => {
  try {
    const {id} = req.params;

    const video = await videoModel.getVideos(id);

    if (!video || video.length === 0) {
      return res.status(404).json({message: "Video not found"});
    }

    const videoPath = video[0].video_url;

    if (videoPath) {
      const fullPath = path.join(__dirname, "../../public/", videoPath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await videoModel.deleteVideo(id);

    res.json({message: "Video deleted successfully"});
  } catch (error) {
    console.error("Delete Video Error:", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  addVideoController,
  getVideosController,
  updateVideoController,
  deleteVideoController,
};
