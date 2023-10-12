const notFound = (req, res, next) => {
    res.status(500).json({ msg: "Page not found, check url and try again" })
    next()
}

module.exports = notFound