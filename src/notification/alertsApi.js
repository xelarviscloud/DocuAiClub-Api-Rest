import express from "express";
import authorization from "../services/authorizationMiddleware/authorization.js";
import { sendErrorResponse } from "../utility/extensions.js";
import AlertCollection from "../database/models/alert.js";
import UserCollection from "../database/models/user.js";
import UserAlertCollection from "../database/models/userAlerts.js";
import { mongoose, ObjectId } from "mongoose";

const alertsRouter = express.Router();

alertsRouter.post("/v2/alerts", authorization, async (req, res) => {
  try {
    const _description = req.body.description;
    const _type = req.body.type;
    const _userId = req.body.userId;
    const _userName = req.body.userName;
    const _orgId = req.body.organizationId;

    if (!_description || !_type || !_userId || !_userName || !_orgId) {
      return res.status(400).json({
        status: "failed",
        error: "Please provide all required fields",
      });
    }

    // Save data in the database Organization collection
    const dbObject = new AlertCollection({
      description: _description,
      type: _type,
      userId: _userId,
      organizationId: _orgId,
      userName: _userName,
      createdAt: new Date(),
    });

    const alert = await dbObject.save();

    const oUsers = await UserCollection.find({
      userOrganizationId: _orgId,
      // role: "organizationuser",
    });

    const notifications = oUsers?.map((user) => ({
      alertId: alert._id,
      receiverId: user._id,
      status: 1,
      createdAt: new Date(),
    }));

    const uAlerts = await UserAlertCollection.insertMany(notifications);

    return res.status(200).send({
      success: true,
      message: "Alert is created successfully.",
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

alertsRouter.put("/v2/alerts", authorization, async (req, res) => {
  try {
    console.log("PUT", req.body);
    const _id = req.body.id;
    const _userId = req.body.userId;
    const _userName = req.body.userName;
    const _orgId = req.body.organizationId;

    if (!_id || !_userId || !_userName || !_orgId) {
      return res.status(400).json({
        status: "failed",
        error: "Please provide all required fields",
      });
    }

    const uAlert = await UserAlertCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { status: 0 } }
    );

    return res.status(200).send({
      success: true,
      uAlert,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

alertsRouter.get("/v2/alerts", authorization, async (req, res) => {
  try {
    const _userId = req.query.userId;
    const _userName = req.query.userName;
    const _orgId = req.query.organizationId;

    if (!_userId || !_userName || !_orgId) {
      return res.status(400).json({
        status: "failed",
        error: "Please provide all required fields",
      });
    }
    let nReceiverId = new mongoose.Types.ObjectId(_userId);

    const uAlerts = await UserAlertCollection.aggregate([
      { $match: { receiverId: nReceiverId, status: 1 } },
      {
        $lookup: {
          from: "alerts",
          localField: "alertId",
          foreignField: "_id",
          as: "vw_user_alerts",
        },
      },
      { $unwind: "$vw_user_alerts" },
      {
        $project: {
          _id: 1,
          description: "$vw_user_alerts.description",
          type: "$vw_user_alerts.type",
        },
      },
    ]);

    return res.status(200).send({
      success: true,
      uAlerts,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

export default alertsRouter;
