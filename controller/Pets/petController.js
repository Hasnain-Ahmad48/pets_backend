var petModel = require("../../models/Pets/petModel.js");
var fs = require("fs");
var path = require("path");

// Add pet with multiple images
exports.addPet = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware

    const {
      pet_name,
      category_id,
      breed_id,
      gender,
      country_id,
      address,
      latitude,
      longitude,
      date_of_birth,
      color,
      size_category,
      neutered,
      microchipped,
      microchip_id,
      temperament,
      activity_level,
      adopted,
      adoption_date,
      adoption_source,
      is_active,
      is_visible_nearby,
    } = req.body;

    // Validate required fields
    if (!pet_name || !category_id || !breed_id || !country_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: pet_name, category_id, breed_id, country_id",
      });
    }

    // Prepare pet data
    const petData = {
      user_id: userId,
      pet_name,
      category_id: parseInt(category_id),
      breed_id: parseInt(breed_id),
      gender: gender || null,
      country_id: parseInt(country_id),
      address: address || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      date_of_birth: date_of_birth || null,
      color: color || null,
      size_category: size_category || null,
      neutered: neutered === "true" || neutered === true,
      microchipped: microchipped === "true" || microchipped === true,
      microchip_id: microchip_id || null,
      temperament: temperament || null,
      activity_level: activity_level || null,
      adopted: adopted !== undefined ? (adopted === "true" || adopted === true) : true,
      adoption_date: adoption_date || null,
      adoption_source: adoption_source || null,
      is_active: is_active !== undefined ? (is_active === "true" || is_active === true) : true,
      is_visible_nearby: is_visible_nearby !== undefined ? (is_visible_nearby === "true" || is_visible_nearby === true) : true,
    };

    // Create pet
    const pet = await petModel.createPet(petData);
    const petId = pet.pet_id;

    // Handle images
    let images = [];
    if (req.files && req.files.length > 0) {
      const imageData = req.files.map((file, index) => ({
        image_url: "user_pets/" + file.filename,
        image_type: index === 0 ? "profile" : "gallery", // First image is profile
        sort_order: index,
      }));

      images = await petModel.createPetImages(petId, imageData);
    }

    // Fetch complete pet with images
    const completePet = await petModel.getPetById(petId, userId);

    res.status(201).json({
      success: true,
      message: "Pet added successfully",
      data: completePet,
    });
  } catch (error) {
    console.error("Add pet error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user pets
exports.getUserPets = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware

    const pets = await petModel.getUserPets(userId);

    res.status(200).json({
      success: true,
      message: "Pets fetched successfully",
      data: pets,
    });
  } catch (error) {
    console.error("Get user pets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update pet
exports.updatePet = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const petId = parseInt(req.params.petId);

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required",
      });
    }

    // Verify pet belongs to user
    const existingPet = await petModel.getPetById(petId, userId);
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found or access denied",
      });
    }

    // Prepare update data
    const updates = {};
    const allowedFields = [
      "pet_name",
      "category_id",
      "breed_id",
      "gender",
      "country_id",
      "address",
      "latitude",
      "longitude",
      "date_of_birth",
      "color",
      "size_category",
      "neutered",
      "microchipped",
      "microchip_id",
      "temperament",
      "activity_level",
      "adopted",
      "adoption_date",
      "adoption_source",
      "is_active",
      "is_visible_nearby",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "category_id" || field === "breed_id" || field === "country_id") {
          updates[field] = parseInt(req.body[field]);
        } else if (field === "latitude" || field === "longitude") {
          updates[field] = req.body[field] ? parseFloat(req.body[field]) : null;
        } else if (field === "neutered" || field === "microchipped" || field === "adopted" || field === "is_active" || field === "is_visible_nearby") {
          updates[field] = req.body[field] === "true" || req.body[field] === true;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const imageData = req.files.map((file, index) => ({
        image_url: "user_pets/" + file.filename,
        image_type: req.body.image_type || "gallery",
        sort_order: req.body.sort_order ? parseInt(req.body.sort_order) + index : existingPet.images ? existingPet.images.length + index : index,
      }));

      await petModel.createPetImages(petId, imageData);
    }

    // Handle image deletions
    if (req.body.delete_image_ids) {
      const imageIds = Array.isArray(req.body.delete_image_ids)
        ? req.body.delete_image_ids
        : [req.body.delete_image_ids];

      for (const imageId of imageIds) {
        try {
          const image = existingPet.images.find((img) => img.image_id === parseInt(imageId));
          if (image) {
            // Delete file from filesystem
            const imagePath = path.join(__dirname, "../../public/", image.image_url);
            fs.unlink(imagePath, (err) => {
              if (err && err.code !== "ENOENT") {
                console.error("Error deleting image file:", err);
              }
            });
          }
          await petModel.deletePetImage(parseInt(imageId), petId, userId);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    }

    // Update pet data
    let updatedPet;
    if (Object.keys(updates).length > 0) {
      updatedPet = await petModel.updatePet(petId, userId, updates);
    } else {
      updatedPet = await petModel.getPetById(petId, userId);
    }

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      data: updatedPet,
    });
  } catch (error) {
    console.error("Update pet error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add pet device
exports.addPetDevice = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const { pet_id, device_id } = req.body;

    if (!pet_id || !device_id) {
      return res.status(400).json({
        success: false,
        message: "pet_id and device_id are required",
      });
    }

    const petDevice = await petModel.addPetDevice(
      parseInt(pet_id),
      parseInt(device_id),
      userId
    );

    res.status(201).json({
      success: true,
      message: "Device assigned to pet successfully",
      data: petDevice,
    });
  } catch (error) {
    console.error("Add pet device error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get pet devices
exports.getPetDevices = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const petId = parseInt(req.params.petId);

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required",
      });
    }

    const devices = await petModel.getPetDevices(petId, userId);

    res.status(200).json({
      success: true,
      message: "Pet devices fetched successfully",
      data: devices,
    });
  } catch (error) {
    console.error("Get pet devices error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update pet device
exports.updatePetDevice = async function (req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const deviceId = parseInt(req.params.id);
    const { pet_id, unassigned_at, reassign } = req.body;

    if (!pet_id) {
      return res.status(400).json({
        success: false,
        message: "pet_id is required",
      });
    }

    let updatedDevice;
    if (reassign === true || reassign === "true") {
      // Reassign device
      updatedDevice = await petModel.reassignPetDevice(
        deviceId,
        parseInt(pet_id),
        userId
      );
    } else {
      // Unassign device
      const updates = {
        unassigned_at: unassigned_at || new Date(),
      };
      updatedDevice = await petModel.updatePetDevice(
        deviceId,
        parseInt(pet_id),
        userId,
        updates
      );
    }

    res.status(200).json({
      success: true,
      message: "Pet device updated successfully",
      data: updatedDevice,
    });
  } catch (error) {
    console.error("Update pet device error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};
 
// Get nearby pets with optional filters
exports.getNearbyPets = async function (req, res) {
  try {
    const {
      category_id,
      breed_id,
      country_id,
      gender,
      latitude,
      longitude,
      radius,
      page,
      limit
    } = req.query;

    const filters = {
      category_id: category_id ? parseInt(category_id) : null,
      breed_id: breed_id ? parseInt(breed_id) : null,
      country_id: country_id ? parseInt(country_id) : null,
      gender: gender || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radius: radius ? parseFloat(radius) : 10, 
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    };

    const result = await petModel.getNearbyPets(filters);

    res.status(200).json({
      success: true,
      message: "Nearby pets fetched successfully",
      page: filters.page,
      limit: filters.limit,
      totalPets: result.total,
      data: result.pets
    });

  } catch (error) {
    console.error("Get nearby pets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

