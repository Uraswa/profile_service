﻿import ProfilesModel from "./profilesModel.js";

class ProfilesController {
    async getUserProfilesByIds(req, res) {
        let ids = req.query.ids;
        if (!ids) {
            res.status(500).json({
                success: false,
                error: "Ids empty"
            });
            return;
        }

        ids = JSON.parse(ids);
        let profiles = await ProfilesModel.getUserProfilesByIds(ids, ids.length);
        res.status(200).json({
            success: true,
            data: {profiles}
        });
    }

    async getProfiles(req, res) {

        try {

            let profileName = req.query.profileName;

            if (!profileName || profileName.length > 40) {
                return res.status(200).json({
                    success: false,
                    error: "Неправильный идентефикатор"
                });
            }

            let profiles = await ProfilesModel.getUserProfiles(profileName);
            return res.status(200).json({
                success: true,
                data: profiles
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Unknown error"
            });
        }
    }

    async getProfile(req, res) {

        try {
            const {user_id} = req.query;
            if (!user_id) {
                return res.status(200).json({
                    success: false,
                    error: 'Id пользователя обязателен'
                });
            }

            const profile = await ProfilesModel.getUserProfile(user_id);

            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Unknown error"
            });
        }
    }

    async createProfile(req, res) {

        try {
            const {user_id, nickname} = req.body;

            if (!nickname || nickname.length > 40) {
                return res.status(400).json({
                    success: false,
                    error: 'Название профиля должно быть не пустым и не длиннее 25 символов!',
                    error_field: "nickname"
                });
            }

            let profile = await ProfilesModel.createUserProfile(user_id, nickname);
            if (!profile) {
                return res.status(200).json({
                    success: false,
                    error: 'Unknown_error'
                });
            }

            res.status(200).json({
                success: true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Unknown error"
            });
        }
    }

    async updateProfile(req, res) {
        const user = req.user;

        try {
            const {nickname, description, birth_date} = req.body;
            const result = await ProfilesModel.updateUserProfile(user.user_id, {nickname, description, birthDate: birth_date});


            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Unknown error"
            });
        }
    }
}

export default new ProfilesController();