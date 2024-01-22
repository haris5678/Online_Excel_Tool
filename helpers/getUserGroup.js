const User = require("../models/userModel");
const Role = require("../models/Role");
const getUserGroup = async userId => {
  try {
    const user = await User.findById(userId);
    const roleId = user.role;
    const roles = await Role.findOne(roleId);
    const roleName = roles.roleName;
    // console.log(roleName);
    return roleName;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

const getUserGroupByRoleId = async roleId => {
  try {
    // const user = await User.findById(userId);
    // const roleId = user.role;
    const roles = await Role.findById(roleId);
    console.log("role in function is ", roles);
    const roleName = roles.roleName;
    // console.log(roleName);
    // console.log("before returning");
    return roleName;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

module.exports = { getUserGroup, getUserGroupByRoleId };
