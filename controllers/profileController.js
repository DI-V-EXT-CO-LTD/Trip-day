const bcrypt = require("bcrypt");
const User = require("../models/user");
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("profile", { user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, email });
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentInput, newInput } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, password: 1 }
    );

    const isMatch = bcrypt.compareSync(currentInput, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const hashedPassword = await bcrypt.hash(newInput, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error Change Password profile" });
  }
};

exports.changePhone = async (req, res) => {
  try {
    const { prefix, phoneNumber } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, contactNumber: 1 }
    );
    user.contactNumber = [prefix,phoneNumber];

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Error Change Phone" ,error)
    res.status(500).json({ message: "Error Change Phone" });
  }
};

exports.changeCompany = async (req, res) => {
  try {
    const { currentInput } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, companyName: 1 }
    );
    user.companyName = currentInput;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Error Change Phone" ,error)
    res.status(500).json({ message: "Error Change Phone" });
  }
};

exports.changeBusiness = async (req, res) => {
  try {
    const { currentInput } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, businessNumber: 1 }
    );
    user.businessNumber = currentInput;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Error Change Phone" ,error)
    res.status(500).json({ message: "Error Change Phone" });
  }
};
exports.changeBusiness = async (req, res) => {
  try {
    const { currentInput } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, businessNumber: 1 }
    );
    user.businessNumber = currentInput;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Error Change Phone" ,error)
    res.status(500).json({ message: "Error Change Phone" });
  }
};

exports.changePerson = async (req, res) => {
  try {
    const { currentInput } = req.body;

    const user = await User.findOne(
      { _id: req.user._id },
      { _id: 1, contactPerson: 1 }
    );
    user.contactPerson = currentInput;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Error Change Phone" ,error)
    res.status(500).json({ message: "Error Change Phone" });
  }
};
