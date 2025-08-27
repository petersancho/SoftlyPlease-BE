const express = require('express')
const router = express.Router()

router.get('/', function(req, res, next) {
    let definitions = []
    // Assuming definitions are available through req.app.get('definitions')
    req.app.get('definitions').forEach(def => {
        definitions.push({ name: def.name, url: `/examples/${def.name.replace('.gh', '').replace('.ghx', '')}/index.html` });
    });
    res.render('mcneel-examples', { title: 'McNeel Examples', definitions: definitions });
});

module.exports = router;
