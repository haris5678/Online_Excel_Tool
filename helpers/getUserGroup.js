const User = require("../models/userModel");
const Role = require("../models/Role");
const getUserGroup = async userId => {
  try {
    // Implement your logic to fetch user details from the database or any other source
    const user = await User.findById(userId);
    const roleId = user.role;
    const roles = await Role.findOne(roleId);
    const roleName = roles.roleName;
    console.log(roleName);
    // Assume there is a 'group' field in the user document
    // This is just an example, adjust based on your actual user model
    console.log("before returning");
    return roleName;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

module.exports = getUserGroup;
