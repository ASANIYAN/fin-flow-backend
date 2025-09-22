"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = void 0;
const userService_1 = require("../services/userService");
const message_1 = require("../utils/message");
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        const userProfile = yield (0, userService_1.getUserProfileService)(user.id);
        if (!userProfile) {
            return (0, message_1.errorResponse)(res, 404, "User not found.");
        }
        return (0, message_1.successResponse)(res, 200, "User profile fetched successfully.", userProfile);
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.getUserProfile = getUserProfile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const updateData = req.body;
    try {
        const updatedProfile = yield (0, userService_1.updateUserProfileService)(user.id, updateData);
        return (0, message_1.successResponse)(res, 200, "User profile updated successfully.", updatedProfile);
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.updateUserProfile = updateUserProfile;
