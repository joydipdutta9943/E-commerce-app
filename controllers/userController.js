const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const { createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils');

const getAllUsers = async (req, res) => {
    const user = await User.find({ role: 'user' }).select('-Password');
    res.status(StatusCodes.OK).json({ user });
};

const getSingleUser = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, role: 'user' }).select('-Password');
    if (!user) {
        throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
    } else {
        checkPermissions(req.user, user._id);
        res.status(StatusCodes.OK).json({ user });
    }
};

const showCurrentUser = async (req, res) => {
    res.status(StatusCodes.OK).json({ user: req.user });
};
// update user with user.save()
const updateUser = async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        throw new CustomError.BadRequestError('Please provide all values');
    }
    console.log(name, email)
    console.log(req.user)
    const user = await User.findOne({ _id: req.user.userId });
    console.log(user)
    user.name = name;
    user.email = email;
    await user.save();

    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new CustomError.BadRequestError('Please provide both values');
    }
    console.log(oldPassword, newPassword)
    const user = await User.findOne({ _id: req.user.userId });
    console.log(user)
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new CustomError.BadRequestError('Invalid Credentials');
    }

    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
};

module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
};