const express = require('express')
const router = express.Router()

router.get('/', function(req, res, next) {
    const myExamples = [
        { name: "Topological Optimization", url: "/my-examples/topological-optimization/index.html" }
        // Add other custom examples here as needed
    ];
    res.render('my-examples', { title: 'My Examples', examples: myExamples });
});

module.exports = router;
