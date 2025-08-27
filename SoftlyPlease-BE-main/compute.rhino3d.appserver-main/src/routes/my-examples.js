const express = require('express')
const router = express.Router()

router.get('/', function(req, res, next) {
    const myExamples = [
        { name: "Topological Optimization", url: "/files/topological-optimization.gh" }
        // Add other custom examples here as needed
    ];
    res.render('my-examples', { title: 'My Examples', examples: myExamples });
});

module.exports = router;
