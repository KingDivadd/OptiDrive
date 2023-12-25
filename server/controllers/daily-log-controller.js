const asyncHandler = require('express-async-handler')
const Notification = require("../model/notification-model")
const Vehicle = require("../model/vehicle-model")
const DailyLog = require("../model/daily-log-model")
const User = require("../model/user-model")
const { StatusCodes } = require("http-status-codes")

const newLog = asyncHandler(async(req, res) => {
    const { vehicle_id, startingLocation, endingLocation, route, startingMileage, endingMileage } = req.body

    const vehicleExist = await Vehicle.findOne({ _id: vehicle_id })
    if (!vehicleExist) {
        return res.status(404).json({ err: `Error... Vehicle with ID ${vehicle_id} not found!!!` })
    }
    if (!startingLocation || !endingLocation || !route || !startingMileage || !endingMileage) {
        return res.status(500).json({ err: `Please fill all fields!!!` })
    }
    let auth = false
    const assignedTo = vehicleExist.assigned_to
    assignedTo.forEach(async(data, ind) => {
        if (data === req.info.id.id) {
            auth = true
        }
        const user = await User.findOne({ _id: data })
        if (user.driver === req.info.id.id) {
            auth = true
        }
    });
    if (auth === false) {
        return res.status(401).json({ err: `Error... Only staffs assigned to a vehicle are allowed to create vehicle logs!!!` })
    }

    // Now store
    req.body.vehicle = vehicle_id
    req.body.addedBy = req.info.id.id
    const dailyMileage = Number(endingMileage) - Number(startingMileage)
    req.body.dailyMileage = dailyMileage.toLocaleString()

    const current_mileage = Number(endingMileage).toLocaleString()
    const mileage_diff = Number(endingMileage) - Number(startingMileage)
    const daily_mileage = mileage_diff.toLocaleString()

    const newDailyLog = await DailyLog.create(req.body)

    await Vehicle.findOneAndUpdate({ _id: vehicle_id }, { current_mileage: current_mileage, daily_mileage: daily_mileage, $push: { daily_log: newDailyLog._id } }, { new: true, runValidators: true })

    return res.status(200).json({ msg: `Vehicle log created and added successfully...`, dailyLog: newDailyLog })

})

const editLog = asyncHandler(async(req, res) => {
    const { log_id, startingLocation, endingLocation, route, startingMileage, endingMileage } = req.body

    const logExist = await DailyLog.findOne({ _id: log_id })
    if (!logExist) {
        return res.status(404).json({ err: `Error... Vehicle with ID ${log_id} not found!!!` })
    }
    const vehicle = await Vehicle.findOne({ _id: logExist.vehicle })
    let auth = false
    const assignedTo = vehicle.assigned_to
    assignedTo.forEach(async(data, ind) => {
        if (data === req.info.id.id) {
            auth = true
        }
        const user = await User.findOne({ _id: data })
        if (user.driver === req.info.id.id) {
            auth = true
        }
    });
    if (auth === false) {
        return res.status(401).json({ err: `Error... Only staffs assigned to a vehicle are allowed to delete vehicle logs!!!` })
    }

    if (startingMileage && endingMileage) {
        const mileage_diff = Number(endingMileage) - Number(startingMileage)
        const daily_mileage = mileage_diff.toLocaleString()
        const current_mileage = Number(endingMileage).toLocaleString()
        await Vehicle.findOneAndUpdate({ _id: logExist.vehicle }, { current_mileage, daily_mileage }, { new: true, runValidators: true })
        await DailyLog.findOneAndUpdate({ _id: log_id }, { dailyMileage: daily_mileage }, { new: true, runValidators: true })
    }
    if (startingMileage && !endingMileage) {
        const startingMileage = Number(vehicle.current_mileage.replace(/,/g, '')) - Number(vehicle.daily_mileage.replace(/,/g, ''))
        const mileage_diff = Number(endingMileage) - Number(startingMileage)
        const daily_mileage = mileage_diff.toLocaleString()
        const current_mileage = Number(endingMileage).toLocaleString()
        await Vehicle.findOneAndUpdate({ _id: logExist.vehicle }, { current_mileage, daily_mileage }, { new: true, runValidators: true })
        await DailyLog.findOneAndUpdate({ _id: log_id }, { dailyMileage: daily_mileage }, { new: true, runValidators: true })
    }
    if (!startingMileage && endingMileage) {
        const endingMileage = Number(vehicle.current_mileage.replace(/,/g, ''))
        const mileage_diff = Number(endingMileage) - Number(startingMileage)
        const daily_mileage = mileage_diff.toLocaleString()
        const current_mileage = Number(endingMileage).toLocaleString()
        await Vehicle.findOneAndUpdate({ _id: logExist.vehicle }, { current_mileage, daily_mileage }, { new: true, runValidators: true })
        await DailyLog.findOneAndUpdate({ _id: log_id }, { dailyMileage: daily_mileage }, { new: true, runValidators: true })
    }

    let update = {}
    if (startingLocation) {
        update.startingLocation = startingLocation
    }
    if (endingLocation) {
        update.endingLocation = endingLocation
    }
    if (route) {
        update.route = route
    }
    if (startingMileage) {
        update.startingMileage = startingMileage
    }
    if (endingMileage) {
        update.endingMileage = endingMileage
    }
    const updatedLog = await DailyLog.findOneAndUpdate({ _id: log_id }, { update }, { new: true, runValidators: true })
    return res.status(200).json({ msg: `Vehicle log updated successfully...`, updatedLog: updatedLog })

})

const deleteLog = asyncHandler(async(req, res) => {
    const { log_id } = req.body
    const logExist = await DailyLog.findOne({ _id: log_id })
    if (!logExist) {
        return res.status(404).json({ err: `Error... Vehicle log not found!!!` })
    }
    const vehicle = await Vehicle.findOne({ _id: logExist.vehicle })
    let auth = false
    const assignedTo = vehicle.assigned_to
    assignedTo.forEach(async(data, ind) => {
        if (data === req.info.id.id) {
            auth = true
        }
        const user = await User.findOne({ _id: data })
        if (user.driver === req.info.id.id) {
            auth = true
        }
    });
    if (auth === false) {
        return res.status(401).json({ err: `Error... Only staffs assigned to a vehicle are allowed to delete vehicle logs!!!` })
    }

    await Vehicle.findOneAndUpdate({ _id: logExist.vehicle }, { $pull: { daily_log: log_id } }, { new: true, runValidators: true })

    const deleteLog = await DailyLog.findOneAndDelete({ _id: log_id })
    return res.status(200).json({ msg: `Vehicle log deleted successfully...` })
})

module.exports = { newLog, editLog, deleteLog }